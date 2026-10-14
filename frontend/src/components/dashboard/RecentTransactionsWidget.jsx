
import { useWalletStore } from '../../store/useWalletStore';
import { Link } from 'react-router-dom';
import { History, ArrowDownLeft, ArrowUpRight, Send, CheckCircle2, ChevronRight } from 'lucide-react';

export default function RecentTransactionsWidget() {
  const { transactions } = useWalletStore();
  const recentList = transactions.slice(0, 4);

  const formatMoney = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="clean-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-tight flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-500" />
          Giao Dịch Gần Đây
        </h2>

        <Link
          to="/history"
          className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1"
        >
          Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-border-main text-xs">
        {recentList.length === 0 ? (
          <div className="py-6 text-center text-text-muted text-xs">
            Chưa có giao dịch nào được ghi nhận.
          </div>
        ) : (
          recentList.map((tx) => {
            const txType = tx.serviceType || tx.type;
            const isTopUp = txType === 'TOPUP';

            return (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl clean-card-subtle flex items-center justify-center shrink-0">
                    {txType === 'TOPUP' && <ArrowDownLeft className="w-4 h-4 text-emerald-500" />}
                    {txType === 'TRANSFER' && <Send className="w-4 h-4 text-indigo-500" />}
                    {txType === 'WITHDRAW' && <ArrowUpRight className="w-4 h-4 text-purple-500" />}
                    {!['TOPUP', 'TRANSFER', 'WITHDRAW'].includes(txType) && <History className="w-4 h-4 text-amber-500" />}
                  </div>

                  <div>
                    <div className="font-semibold text-sm">{tx.description}</div>
                    <div className="text-[11px] text-text-muted font-mono">
                      {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className={`font-bold text-sm ${isTopUp ? 'text-emerald-600' : 'text-text-primary'}`}>
                    {isTopUp ? '+' : '-'}{formatMoney(tx.amount)}
                  </div>
                  <span className={`text-[10px] font-semibold flex items-center justify-end gap-1 ${
                    tx.status === 'SUCCESS' ? 'text-emerald-600' :
                    tx.status === 'PENDING' ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    <CheckCircle2 className="w-3 h-3" /> {tx.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
