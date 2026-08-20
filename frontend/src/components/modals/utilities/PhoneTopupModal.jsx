import { useState } from 'react';
import { Smartphone, X, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useWalletStore } from '../../../store/useWalletStore';

const telcos = [
  { id: 'viettel', name: 'Viettel', color: 'bg-red-500/10 text-red-500 border-red-500/30' },
  { id: 'vinaphone', name: 'VinaPhone', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  { id: 'mobifone', name: 'MobiFone', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  { id: 'vietnamobile', name: 'Vietnamobile', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' },
];

const amounts = [10000, 20000, 50000, 100000, 200000, 500000];

const getIdempotencyKey = (prefix) => `${prefix}-${Date.now()}`;

export default function PhoneTopupModal({ onClose }) {
  const { balance, executeUtilityPayment } = useWalletStore();
  const [phoneNumber, setPhoneNumber] = useState('0988776655');
  const [selectedTelco, setSelectedTelco] = useState('viettel');
  const [selectedAmount, setSelectedAmount] = useState(100000);
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(1); // 1: Input, 2: PIN, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txResult, setTxResult] = useState(null);

  const discountPercent = 0.02; // 2% discount
  const finalPrice = Math.round(selectedAmount * (1 - discountPercent));

  const handleProceedPin = (e) => {
    e.preventDefault();
    setError('');
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Vui lòng nhập số điện thoại hợp lệ (10 chữ số).');
      return;
    }
    if (finalPrice > balance) {
      setError(`Số dư không đủ. Bạn cần ${finalPrice.toLocaleString('vi-VN')} VNĐ.`);
      return;
    }
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
      const telcoObj = telcos.find((t) => t.id === selectedTelco);
      const res = await executeUtilityPayment({
        serviceName: 'Nạp Điện Thoại',
        provider: telcoObj?.name || selectedTelco,
        targetId: phoneNumber,
        amount: finalPrice,
        details: `Nạp tiền ĐTDĐ ${telcoObj?.name} cho SĐT ${phoneNumber} (Mệnh giá: ${selectedAmount.toLocaleString('vi-VN')}đ, Giảm 2%)`,
        idempotencyKey: getIdempotencyKey('idemp-topup')
      });
      setTxResult(res);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Thanh toán thất bại');
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
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Nạp Điện Thoại Trực Tiếp</h3>
              <p className="text-[11px] text-text-secondary">Chiết khấu ưu đãi 2% mọi mệnh giá</p>
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

        {/* STEP 1: Select details */}
        {step === 1 && (
          <form onSubmit={handleProceedPin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                Số Điện Thoại Nạp Tiền
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Nhập SĐT nạp (vd: 0988776655)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-main bg-bg-input text-sm font-bold tracking-wide focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1.5">Nhà Mạng</label>
              <div className="grid grid-cols-4 gap-2">
                {telcos.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTelco(t.id)}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition text-center ${
                      selectedTelco === t.id
                        ? `${t.color} border-emerald-500 shadow-sm ring-1 ring-emerald-500`
                        : 'border-border-main opacity-70 hover:opacity-100'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1.5">Mệnh Giá</label>
              <div className="grid grid-cols-3 gap-2">
                {amounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSelectedAmount(amt)}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center ${
                      selectedAmount === amt
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500 ring-1 ring-emerald-500'
                        : 'border-border-main text-text-primary hover:border-emerald-500/40'
                    }`}
                  >
                    <span>{amt.toLocaleString('vi-VN')} đ</span>
                    <span className="text-[10px] text-emerald-500 font-normal">Giảm 2%</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price summary */}
            <div className="p-3.5 rounded-xl clean-card-subtle space-y-1.5 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Mệnh giá nạp:</span>
                <span className="font-semibold">{selectedAmount.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between text-emerald-500">
                <span>Chiết khấu ví (2%):</span>
                <span className="font-semibold">-{(selectedAmount * discountPercent).toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="pt-2 border-t border-border-main flex justify-between font-bold text-sm">
                <span>Cần thanh toán:</span>
                <span className="text-emerald-600">{finalPrice.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              Tiếp Tục Thanh Toán
            </button>
          </form>
        )}

        {/* STEP 2: PIN Verification */}
        {step === 2 && (
          <form onSubmit={handleConfirmPayment} className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Xác Nhận Mã PIN An Toàn</h4>
              <p className="text-xs text-text-secondary mt-1">
                Thanh toán <strong>{finalPrice.toLocaleString('vi-VN')} VNĐ</strong> nạp SĐT <strong>{phoneNumber}</strong>
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
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
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
              <h4 className="text-base font-bold text-emerald-600">Nạp Tiền Thành Công!</h4>
              <p className="text-xs text-text-secondary mt-1">
                Số tiền <strong>{selectedAmount.toLocaleString('vi-VN')} VNĐ</strong> đã được nạp trực tiếp vào SĐT <strong>{phoneNumber}</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl clean-card-subtle space-y-1.5 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-text-secondary">Mã giao dịch:</span>
                <span className="font-mono font-bold">{txResult.transactionCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Trace ID (Zipkin):</span>
                <span className="font-mono text-[10px] text-gray-400">{txResult.traceId}</span>
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
