import { createClient as createGhanaClient } from '@supabase/supabase-js'
import { createClient as createOsClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const ghana = createGhanaClient(
    process.env.GHANA_SUPABASE_URL!,
    process.env.GHANA_SUPABASE_ANON_KEY!
  )
  const os = createOsClient()

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
