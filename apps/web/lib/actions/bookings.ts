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
export async function generatePaymentLink(formData: FormData) {
  const bookingId = formData.get('bookingId')?.toString()
  const email = formData.get('driverEmail')?.toString()
  const amountPesewasRaw = formData.get('amountPesewas')?.toString()
  const amountPesewas = amountPesewasRaw ? Number(amountPesewasRaw) : NaN

  if (!bookingId || !email || !amountPesewasRaw || isNaN(amountPesewas) || amountPesewas <= 0) {
    console.error('generatePaymentLink: missing or invalid bookingId/email/amount')
    return
  }

  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    console.error('generatePaymentLink: PAYSTACK_SECRET_KEY not configured')
    return
  }

  const reference = `ECOOS-${bookingId.slice(0, 8)}-${Date.now()}`

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: amountPesewas,
      reference,
      currency: 'GHS',
    }),
  })

  const data = await res.json()

  if (!data.status || !data.data?.authorization_url) {
    console.error('generatePaymentLink: Paystack init failed', data.message)
    return
  }

  const supabase = createClient()

  const { error } = await supabase
    .from('bookings')
    .update({
      payment_reference: reference,
      payment_link: data.data.authorization_url,
    })
    .eq('id', bookingId)

  if (error) {
    console.error('generatePaymentLink: failed to save reference', error.message)
    return
  }

  revalidatePath('/manager/bookings')
}
