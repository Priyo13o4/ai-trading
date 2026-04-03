import { History, RefreshCw, Download, Loader2, Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BillingHistoryRecord {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  status: string;
  provider?: string;
  invoice_url?: string;
  checkout_url?: string;
  management_url?: string;
  external_payment_id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

interface BillingHistorySectionProps {
  history: BillingHistoryRecord[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  formatAmount: (record: BillingHistoryRecord) => string;
  resolveUrl: (record: BillingHistoryRecord) => string | undefined;
  openLink: (url: string, provider: 'razorpay' | 'plisio') => boolean;
}

const glassCard = 'lumina-card p-6 shadow-2xl transition-all';

export function BillingHistorySection({
  history,
  loading,
  error,
  onRefresh,
  formatAmount,
  resolveUrl,
  openLink
}: BillingHistorySectionProps) {
  
  const handleExportCSV = () => {
    if (history.length === 0) {
      toast.error('No history to export');
      return;
    }

    const csvEscape = (value: string | number): string => {
      const str = String(value);
      const csvSafeValue = /^\s*[=+\-@]/.test(str) ? `'${str}` : str;
      if (csvSafeValue.includes(',') || csvSafeValue.includes('"') || csvSafeValue.includes('\n')) {
        return `"${csvSafeValue.replace(/"/g, '""')}"`;
      }
      return csvSafeValue;
    };

    const headers = ['ID', 'Date', 'Amount', 'Currency', 'Status', 'Provider', 'Invoice URL'];
    const rows = history.map((record) => [
      record.id,
      new Date(record.created_at).toISOString(),
      record.amount,
      record.currency,
      record.status,
      record.provider || 'unknown',
      resolveUrl(record) || '',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `billing-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Billing history exported as CSV');
  };

  return (
    <section id="billing-history-section" className={cn(glassCard, "mt-8")}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-[#E2B485]" />
          <h3 className="text-lg font-bold text-slate-100">Billing History</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10"
            disabled={loading}
          >
            <RefreshCw className={cn("mr-1 h-3 w-3", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10"
            disabled={history.length === 0}
          >
            <Download className="mr-1 h-3 w-3" />
            Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}

      <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        <div className="min-w-[800px] lg:min-w-0">
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-slate-800/60 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Invoice / Description</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Provider</th>
                <th className="px-4 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
              {loading && history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#E2B485]" />
                    <p className="mt-2 text-xs">Loading payment history...</p>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No transactions found yet. Use the platform by subscribing to see your history here.
                  </td>
                </tr>
              ) : (
                history.map((record) => {
                  const accessUrl = resolveUrl(record);
                  const isCrypto = (record.provider || '').toLowerCase().includes('plisio') || (record.provider || '').toLowerCase().includes('crypto');
                  
                  return (
                    <tr key={record.id} className="group transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200">{record.description || `Invoice #${record.id.slice(0, 8)}`}</span>
                          {accessUrl && (
                            <button
                              onClick={() => {
                                if (!openLink(accessUrl, isCrypto ? 'plisio' : 'razorpay')) {
                                  toast.error('This billing link appears invalid or blocked.');
                                }
                              }}
                              className="w-fit text-xs text-[#E2B485] hover:underline"
                            >
                              {isCrypto ? 'View Invoice' : 'Manage Payment'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(record.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">
                        {formatAmount(record)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {record.provider || 'unknown'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge
                          className={cn(
                            'border',
                            record.status === 'succeeded'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              : record.status === 'pending' || record.status === 'processing'
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                          )}
                        >
                          {record.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {loading && history.length > 0 && (
        <div className="mt-3 text-xs text-slate-500">Refreshing billing history in the background...</div>
      )}
    </section>
  );
}
