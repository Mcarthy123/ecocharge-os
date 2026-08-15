'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function issueRefund(formData: FormData) {
  const bookingId = formData.get('bookingId')?.toString()
  const amountRaw = formData.get('amount')?.toString()
  const amount = amountRaw ? Number(amountRaw) : NaN

  if (!bookingId || !amountRaw || isNaN(amount) || amount <= 0) {
    console.error('issueRefund: missing or invalid bookingId/amount')
    return
  }

  const supabase = createClient()

  const { error } = await supabase.rpc('issue_refund', {
    target_booking_id: bookingId,
    refund_amount: amount,
  })

  if (error) {
    console.error('issueRefund failed:', error.message)
    return
  }

  revalidatePath('/manager/refunds')
}
