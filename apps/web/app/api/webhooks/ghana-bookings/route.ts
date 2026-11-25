import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Main-app status -> OS status
const STATUS_MAP: Record<string, string> = {
  pending_payment: 'pending',
  confirmed: 'confirmed',
  completed: 'completed',
  cancelled: 'cancelled',
  expired: 'no_show',
}

// The main app stores slot_time without a timezone; it is UTC (Ghana is on GMT).
const asUtc = (s: string) => (/(Z|[+-]\d{2}:\d{2})$/.test(s) ? s : s + 'Z')

export async function POST(request: Request) {
  const secret = process.env.GHANA_WEBHOOK_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const record = body?.record
  if (!body || body.table !== 'bookings' || body.type === 'DELETE' || !record) {
    return NextResponse.json({ ignored: 'not a booking insert or update' })
  }

  const os = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: map } = await os
    .from('ghana_charger_map')
    .select('os_charger_id')
    .eq('ghana_charger_id', record.charger_id ?? '')
    .maybeSingle()

  if (!map) {
    return NextResponse.json({ ignored: 'charger not linked to OS' })
  }

  const from = new Date(asUtc(String(record.slot_time)))
  const until = new Date(from.getTime() + (Number(record.duration_min) || 60) * 60000)

  const { error } = await os.from('bookings').upsert(
    {
      ghana_booking_id: record.id,
      source: 'ghana',
      external_reference: record.reference ?? null,
      charger_id: map.os_charger_id,
      driver_id: null,
      driver_name: record.driver_name || record.name || null,
      driver_vehicle: record.vehicle || null,
      reserved_from: from.toISOString(),
      reserved_until: until.toISOString(),
      status: STATUS_MAP[record.status] ?? 'pending',
      amount_pesewas: Math.round(Number(record.amount || 0) * 100),
      payment_status: record.payment_confirmed ? 'paid' : 'unpaid',
    },
    { onConflict: 'ghana_booking_id' }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
