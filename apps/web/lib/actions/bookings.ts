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

export async function setBookingAmount(formData: FormData) {
  const bookingId = formData.get('bookingId')?.toString()
  const amountGhsRaw = formData.get('amountGhs')?.toString()
  const amountGhs = amountGhsRaw ? Number(amountGhsRaw) : NaN

  if (!bookingId || !amountGhsRaw || isNaN(amountGhs) || amountGhs < 0) {
    console.error('setBookingAmount: missing or invalid bookingId/amountGhs')
    return
  }

  const amountPesewas = Math.round(amountGhs * 100)

  const supabase = createClient()

  const { error } = await supabase
    .from('bookings')
    .update({ amount_pesewas: amountPesewas })
    .eq('id', bookingId)

  if (error) {
    console.error('setBookingAmount failed:', error.message)
    return
  }

  revalidatePath('/manager/bookings')
}
