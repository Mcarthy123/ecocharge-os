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
