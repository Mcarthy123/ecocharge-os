import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ghana = createClient(
    process.env.GHANA_SUPABASE_URL!,
    process.env.GHANA_SUPABASE_ANON_KEY!
  )
  const os = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: mappings, error: mapError } = await os
    .from('ghana_charger_map')
    .select('os_charger_id, ghana_charger_id')

  if (mapError || !mappings) {
    return NextResponse.json({ error: 'Failed to load charger map' }, { status: 500 })
  }

  const results = []
  for (const { os_charger_id, ghana_charger_id } of mappings) {
    const { data: ghanaCharger } = await ghana
      .from('chargers')
      .select('status, online')
      .eq('id', ghana_charger_id)
      .single()

    if (!ghanaCharger) continue

    const mappedStatus = !ghanaCharger.online
      ? 'offline'
      : ghanaCharger.status === 'Available'
        ? 'available'
        : 'in_use'

    const { error: updateError } = await os
      .from('chargers')
      .update({ status: mappedStatus })
      .eq('id', os_charger_id)

    results.push({ os_charger_id, ghana_charger_id, mappedStatus, updateError })
  }

  return NextResponse.json({ synced: results.length, results })
}
