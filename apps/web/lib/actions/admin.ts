'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateStationStatus(formData: FormData) {
  const stationId = formData.get('stationId')?.toString()
  const newStatus = formData.get('newStatus')?.toString()

  if (!stationId || !newStatus) {
    console.error('updateStationStatus: missing stationId or newStatus')
    return
  }

  const supabase = createClient()

  const { error } = await supabase
    .from('stations')
    .update({ status: newStatus })
    .eq('id', stationId)

  if (error) {
    console.error('updateStationStatus failed:', error.message)
    return
  }

  revalidatePath('/admin/stations')
}
export async function updateOrganizationStatus(formData: FormData) {
  const organizationId = formData.get('organizationId')?.toString()
  const newStatus = formData.get('newStatus')?.toString()

  if (!organizationId || !newStatus) {
    console.error('updateOrganizationStatus: missing organizationId or newStatus')
    return
  }

  const supabase = createClient()

  const { error } = await supabase
    .from('organizations')
    .update({ status: newStatus })
    .eq('id', organizationId)

  if (error) {
    console.error('updateOrganizationStatus failed:', error.message)
    return
  }

  revalidatePath('/admin/organizations')
}
