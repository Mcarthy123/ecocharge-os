'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createOrganization(formData: FormData) {
  const name = formData.get('name')?.toString().trim()

  if (!name) {
    return { error: 'Organization name is required.' }
  }

  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  // Calls the create_organization_with_owner() DB function (migration
  // 11) — the only sanctioned way for a regular user to create an org,
  // since RLS otherwise only lets platform_admin insert into
  // organizations directly.
  const { error } = await supabase.rpc('create_organization_with_owner', {
    org_name: name,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/owner')
  redirect('/owner')
}
