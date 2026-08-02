'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function inviteEmployee(formData: FormData) {
  const organizationId = formData.get('organizationId')?.toString()
  const email = formData.get('email')?.toString().trim()
  const role = formData.get('role')?.toString()

  if (!organizationId || !email || !role) {
    console.error('inviteEmployee: missing required field')
    return
  }

  const supabase = createClient()

  const { error } = await supabase.rpc('invite_org_member', {
    target_org_id: organizationId,
    target_email: email,
    member_role: role,
  })

  if (error) {
    console.error('inviteEmployee failed:', error.message)
    return
  }

  revalidatePath('/owner/employees')
}
