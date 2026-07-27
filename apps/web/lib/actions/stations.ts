'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createStation(formData: FormData) {
  const name = formData.get('name')?.toString().trim()
  const address = formData.get('address')?.toString().trim()
  const organizationId = formData.get('organizationId')?.toString()

  if (!name || !organizationId) {
    return { error: 'Station name is required.' }
  }

  const supabase = createClient()

  // RLS (migration 10, "owners/managers modify their stations") already
  // enforces that the current user has an owner/manager membership in
  // this organization_id — no need to re-check that here, the insert
  // simply fails under RLS if they don't.
  const { error } = await supabase.from('stations').insert({
    organization_id: organizationId,
    name,
    address: address || null,
    status: 'pending_approval',
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/owner/stations')
  redirect('/owner/stations')
}
