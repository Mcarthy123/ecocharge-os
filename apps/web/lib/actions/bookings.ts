'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateBookingStatus(formData: FormData) {
  const bookingId = formData.get('bookingId')?.toString()
  const newStatus = formData.get('newStatus')?.toString()

  if (!bookingId || !newStatus) {
    console.error('updateBookingStatus: missing bookingId or newStatus')
    return
  }

  const supabase = createClient()

  const { error } = await supabase
    .from('bookings')
    .update({ status: newStatus })
    .eq('id', bookingId)

  if (error) {
    console.error('updateBookingStatus failed:', error.message)
    return
  }

  revalidatePath('/manager/bookings')
}
