import { createClient } from '@/lib/supabase/server'

export default async function DriverWalletPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('user_id', user!.id)
    .maybeSingle()

  const { data: transactions } = wallet
    ? await supabase
        .from('transactions')
        .select('id, amount, type, reference, created_at')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
    : { data: null }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Wallet</h1>
        <p className="text-sm text-neutral-400">Your balance and transaction history.</p>
      </div>

      <div className="rounded-lg border border-neutral-800 p-4">
        <p className="text-xs text-neutral-500">Current balance</p>
        <p className="text-2xl font-semibold">
          {wallet ? `₵${wallet.balance.toFixed(2)}` : '—'}
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium">Transaction history</h2>
        {!transactions || transactions.length === 0 ? (
          <p className="text-sm text-neutral-400">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium capitalize">{t.type}</p>
                  <p className="text-xs text-neutral-500">
                    {new Date(t.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-sm font-medium ${
                    t.amount >= 0 ? 'text-accent' : 'text-red-400'
                  }`}
                >
                  {t.amount >= 0 ? '+' : ''}
                  {t.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
