import { createClient } from '@/lib/supabase/server'

const TYPE_LABELS: Record<string, string> = {
  topup: 'Top-up',
  charge_payment: 'Charge payment',
  refund: 'Refund',
  payout: 'Payout',
}

export default async function OwnerWalletPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance, currency')
    .eq('user_id', user!.id)
    .single()

  const { data: transactions } = wallet
    ? await supabase
        .from('transactions')
        .select('id, amount, type, reference, created_at')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Wallet</h1>
        <p className="text-sm text-neutral-400">
          Payments and payouts land here once billing (Phase 6) is wired up.
        </p>
      </div>

      <div className="max-w-xs rounded-lg border border-neutral-800 bg-base-900 p-4">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Balance</p>
        <p className="mt-1 text-2xl font-semibold">
          {wallet ? `${wallet.currency} ${Number(wallet.balance).toFixed(2)}` : '—'}
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-400">Transaction history</h2>
        {!transactions || transactions.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No transactions yet. These will appear once payments start flowing through the
            platform.
          </p>
        ) : (
          <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm">{TYPE_LABELS[tx.type] ?? tx.type}</p>
                  <p className="text-xs text-neutral-500">
                    {new Date(tx.created_at).toLocaleString()}
                    {tx.reference ? ` · ${tx.reference}` : ''}
                  </p>
                </div>
                <span
                  className={
                    'text-sm font-medium ' +
                    (Number(tx.amount) < 0 ? 'text-red-400' : 'text-accent')
                  }
                >
                  {Number(tx.amount) >= 0 ? '+' : ''}
                  {Number(tx.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
