import { Badge } from '@/components/ui/Badge';

function formatMoney(amount, currency) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(amount);
}

export function BillingOverview({ billing, loading }) {
  if (loading) return <p className="text-sm text-muted">Loading billing...</p>;
  if (!billing) return <p className="text-sm text-muted">Billing information unavailable.</p>;

  const { currentPlan, usageSummary, invoiceHistory } = billing;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted">Current plan</p>
          <p className="mt-1 text-xl font-bold">{currentPlan.planName}</p>
          <p className="mt-1 text-sm text-muted">
            Renews {new Date(currentPlan.renewalDate).toLocaleDateString()}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted">Usage summary</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(usageSummary || {}).map(([key, val]) => (
              <Badge key={key}>{key}: {val}</Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(invoiceHistory || []).map((inv) => (
              <tr key={inv.invoiceId} className="border-b border-border/60">
                <td className="py-3">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                <td className="py-3">{formatMoney(inv.amount, inv.currency)}</td>
                <td className="py-3"><Badge>{inv.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
