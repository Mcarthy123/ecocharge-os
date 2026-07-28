'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createOrganization(formData: FormData) {
  const name = formData.get('name')?.toString().trim()

  if (!name) {
    console.error('Organization name is required.')
    return
  }

  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error('You must be logged in.')
    return
  }

  const { error } = await supabase.rpc('create_organization_with_owner', {
    org_name: name,
  })

  if (error) {
    console.error('createOrganization failed:', error.message)
    return
  }

  revalidatePath('/owner')
  redirect('/owner')
}
