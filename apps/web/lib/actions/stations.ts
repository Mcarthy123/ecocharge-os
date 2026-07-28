'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createStation(formData: FormData) {
  const name = formData.get('name')?.toString().trim()
  const address = formData.get('address')?.toString().trim()
  const organizationId = formData.get('organizationId')?.toString()

  if (!name || !organizationId) {
    console.error('Station name is required.')
    return
  }

  const supabase = createClient()

  const { error } = await supabase.from('stations').insert({
    organization_id: organizationId,
    name,
    address: address || null,
    status: 'pending_approval',
  })

  if (error) {
    console.error('createStation failed:', error.message)
    return
  }

  revalidatePath('/owner/stations')
  redirect('/owner/stations')
}
