import { useState } from 'react';
import { Zap, Droplet, X, Search, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useWalletStore } from '../../../store/useWalletStore';

export default function BillPaymentModal({ onClose }) {
  const { balance, executeUtilityPayment } = useWalletStore();
  const [billType, setBillType] = useState('electricity'); // 'electricity' | 'water'
  const [customerCode, setCustomerCode] = useState('PE0100099887');
  const [billData, setBillData] = useState(null);
  const [searching, setSearching] = useState(false);
  const [step, setStep] = useState(1); // 1: Search/View, 2: PIN, 3: Success
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txResult, setTxResult] = useState(null);

  const handleSearchBill = async (e) => {
    e.preventDefault();
    if (!customerCode || customerCode.length < 5) {
      setError('Vui lòng nhập Mã khách hàng hợp lệ.');
      return;
    }
    setError('');
    setSearching(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSearching(false);

    // Mock found bill data
    setBillData({
      customerCode,
      customerName: 'NGUYỄN VĂN A',
      address: '123 Đường Nguyễn Huệ, Q.1, TP. Hồ Chí Minh',
      provider: billType === 'electricity' ? 'EVN TP.HCM' : 'SAWACO Nước Sạch',
      period: 'Tháng 08/2026',
      amount: billType === 'electricity' ? 485000 : 120000
    });
  };

  const handleProceedPin = () => {
    if (!billData) return;
    if (billData.amount > balance) {
      setError(`Số dư ví không đủ. Cần ${billData.amount.toLocaleString('vi-VN')} VNĐ.`);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('Mã PIN gồm 6 chữ số.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await executeUtilityPayment({
        serviceName: billType === 'electricity' ? 'Thanh Toán Tiền Điện' : 'Thanh Toán Tiền Nước',
        provider: billData.provider,
        targetId: billData.customerCode,
        amount: billData.amount,
        details: `Thanh toán hóa đơn ${billType === 'electricity' ? 'Điện' : 'Nước'} (${billData.provider}) Mã KH: ${billData.customerCode} - KH: ${billData.customerName} - Kỳ: ${billData.period}`,
        idempotencyKey: `idemp-bill-${Date.now()}`
      });
      setTxResult(res);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Thanh toán hóa đơn thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="clean-card max-w-md w-full relative p-6 shadow-2xl space-y-5 rounded-2xl overflow-hidden border border-emerald-500/20">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-main">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              {billType === 'electricity' ? <Zap className="w-5 h-5" /> : <Droplet className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold">Thanh Toán Hóa Đơn Điện & Nước</h3>
              <p className="text-[11px] text-text-secondary">Tra cứu trực tiếp từ hệ thống EVN / Sawaco</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-gray-500/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Search Bill */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Bill Type Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setBillType('electricity');
                  setBillData(null);
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  billType === 'electricity'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500 ring-1 ring-amber-500'
                    : 'border-border-main text-text-secondary hover:text-text-primary'
                }`}
              >
                <Zap className="w-4 h-4" /> Tiền Điện (EVN)
              </button>
              <button
                type="button"
                onClick={() => {
                  setBillType('water');
                  setBillData(null);
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  billType === 'water'
                    ? 'bg-blue-500/10 text-blue-500 border-blue-500 ring-1 ring-blue-500'
                    : 'border-border-main text-text-secondary hover:text-text-primary'
                }`}
              >
                <Droplet className="w-4 h-4" /> Tiền Nước
              </button>
            </div>

            <form onSubmit={handleSearchBill} className="flex gap-2">
              <input
                type="text"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                placeholder="Nhập Mã KH (vd: PE0100099887)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-main bg-bg-input text-sm font-bold tracking-wide focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="submit"
                disabled={searching}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0"
              >
                <Search className="w-4 h-4" />
                {searching ? 'Tra cứu...' : 'Tra Cứu'}
              </button>
            </form>

            {/* Bill Info Result */}
            {billData && (
              <div className="p-4 rounded-xl clean-card-subtle space-y-3 border border-emerald-500/30 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-border-main">
                  <span className="text-xs font-semibold text-emerald-500">Thông tin Hóa Đơn Trực Tuyến</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                    {billData.period}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Khách hàng:</span>
                    <span className="font-bold">{billData.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Mã KH:</span>
                    <span className="font-mono">{billData.customerCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Đơn vị cung cấp:</span>
                    <span className="font-medium">{billData.provider}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border-main text-sm font-bold">
                    <span>Số tiền cần trả:</span>
                    <span className="text-emerald-600">{billData.amount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProceedPin}
                  className="w-full py-2.5 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                >
                  Thanh Toán Hóa Đơn
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PIN Verification */}
        {step === 2 && billData && (
          <form onSubmit={handleConfirmPayment} className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Xác Nhận Thanh Toán Hóa Đơn</h4>
              <p className="text-xs text-text-secondary mt-1">
                Thanh toán <strong>{billData.amount.toLocaleString('vi-VN')} VNĐ</strong> cho {billData.provider} (Mã KH: {billData.customerCode})
              </p>
            </div>

            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Nhập PIN (vd: 123456)"
              className="w-full text-center px-4 py-3 rounded-xl border border-border-main bg-bg-input text-lg font-bold tracking-widest focus:outline-none focus:border-emerald-500 transition"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/2 py-2.5 border border-border-main font-bold text-xs rounded-xl hover:bg-gray-500/10 transition"
              >
                Quay Lại
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
              >
                {loading ? 'Đang xử lý...' : 'Xác Nhận'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success */}
        {step === 3 && txResult && (
          <div className="space-y-4 text-center animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-emerald-600">Thanh Toán Thành Công!</h4>
              <p className="text-xs text-text-secondary mt-1">
                Hóa đơn <strong>{billData.period}</strong> đã được gạch nợ thành công trên hệ thống {billData.provider}.
              </p>
            </div>

            <div className="p-3.5 rounded-xl clean-card-subtle space-y-1.5 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-text-secondary">Mã giao dịch:</span>
                <span className="font-mono font-bold">{txResult.transactionCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Số tiền trừ ví:</span>
                <span className="font-bold text-emerald-600">-{txResult.amount.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
            >
              Hoàn Tất
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
