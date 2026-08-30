import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    console.error('paystack webhook: PAYSTACK_SECRET_KEY not configured')
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const rawBody = await req.text()

  const signature = req.headers.get('x-paystack-signature')
  const expectedSignature = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')

  if (signature !== expectedSignature) {
    console.error('paystack webhook: invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)

  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true })
  }

  const reference = event.data?.reference
  if (!reference) {
    return NextResponse.json({ error: 'No reference in payload' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase
    .from('bookings')
    .update({ payment_status: 'paid' })
    .eq('payment_reference', reference)

  if (error) {
    console.error('paystack webhook: failed to update booking', error.message)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
