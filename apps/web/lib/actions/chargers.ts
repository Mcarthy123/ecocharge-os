'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateChargerStatus(formData: FormData) {
  const chargerId = formData.get('chargerId')?.toString()
  const newStatus = formData.get('newStatus')?.toString()

  if (!chargerId || !newStatus) {
    console.error('updateChargerStatus: missing chargerId or newStatus')
    return
  }

  const supabase = createClient()

  const { error } = await supabase
    .from('chargers')
    .update({ status: newStatus })
    .eq('id', chargerId)

  if (error) {
    console.error('updateChargerStatus failed:', error.message)
    return
  }

  revalidatePath('/manager/chargers')
}
