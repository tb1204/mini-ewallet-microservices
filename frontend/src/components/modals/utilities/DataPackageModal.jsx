import  { useState } from 'react';
import { Wifi, X, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useWalletStore } from '../../../store/useWalletStore';

const dataPackages = [
  { id: 'st30k', name: 'ST30K', data: '7 GB Data', duration: '7 ngày', price: 30000, desc: 'Dung lượng tốc độ cao' },
  { id: 'st90k', name: 'ST90K', data: '30 GB (1GB/ngày)', duration: '30 ngày', price: 90000, desc: 'Hot nhất tháng' },
  { id: 'sd135', name: 'SD135', data: '150 GB (5GB/ngày)', duration: '30 ngày', price: 135000, desc: 'Xem Youtube/TikTok thả ga' },
  { id: 'v200b', name: 'V200B', data: '240 GB + Nội mạng FREE', duration: '30 ngày', price: 200000, desc: 'Combo Data + Gọi thoại' }
];

const getIdempotencyKey = (prefix) => `${prefix}-${Date.now()}`;

export default function DataPackageModal({ onClose }) {
  const { balance, executeUtilityPayment } = useWalletStore();
  const [phoneNumber, setPhoneNumber] = useState('0988776655');
  const [selectedPkg, setSelectedPkg] = useState(dataPackages[1]);
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txResult, setTxResult] = useState(null);

  const handleProceedPin = (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Số điện thoại không hợp lệ.');
      return;
    }
    if (selectedPkg.price > balance) {
      setError(`Số dư ví không đủ ${selectedPkg.price.toLocaleString('vi-VN')} VNĐ.`);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('Nhập mã PIN gồm 6 chữ số.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await executeUtilityPayment({
        serviceName: 'Đăng Ký Gói Data 4G/5G',
        provider: 'Viettel Telecom',
        targetId: phoneNumber,
        amount: selectedPkg.price,
        details: `Đăng ký gói Data 4G/5G [${selectedPkg.name}] (${selectedPkg.data}) cho SĐT ${phoneNumber}`,
        idempotencyKey: getIdempotencyKey('idemp-data')
      });
      setTxResult(res);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Thanh toán gói Data thất bại.');
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
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Nạp Gói Data 4G/5G Siêu Tốc</h3>
              <p className="text-[11px] text-text-secondary">Kích hoạt trực tiếp vào tài khoản Data SIM</p>
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

        {/* STEP 1: Select Package */}
        {step === 1 && (
          <form onSubmit={handleProceedPin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                Số Điện Thoại Nhận Data
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Nhập SĐT nhận Data"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-main bg-bg-input text-sm font-bold tracking-wide focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                Chọn Gói Cước Data
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {dataPackages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPkg(pkg)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-1 ${
                      selectedPkg.id === pkg.id
                        ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500'
                        : 'border-border-main hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold">{pkg.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 font-bold">
                        {pkg.duration}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-emerald-500">{pkg.data}</p>
                    <p className="text-[10px] text-text-secondary">{pkg.desc}</p>
                    <span className="text-xs font-extrabold pt-1 text-text-primary">
                      {pkg.price.toLocaleString('vi-VN')} đ
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              Đăng Ký ({selectedPkg.price.toLocaleString('vi-VN')} VNĐ)
            </button>
          </form>
        )}

        {/* STEP 2: PIN */}
        {step === 2 && (
          <form onSubmit={handleConfirmPayment} className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Xác Nhận Đăng Ký Data</h4>
              <p className="text-xs text-text-secondary mt-1">
                Gói <strong>{selectedPkg.name} ({selectedPkg.data})</strong> cho SĐT <strong>{phoneNumber}</strong>
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
                {loading ? 'Đang kích hoạt...' : 'Xác Nhận'}
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
              <h4 className="text-base font-bold text-emerald-600">Kích Hoạt Data Thành Công!</h4>
              <p className="text-xs text-text-secondary mt-1">
                Gói <strong>{selectedPkg.name}</strong> ({selectedPkg.data}) đã sẵn sàng trên SĐT <strong>{phoneNumber}</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl clean-card-subtle space-y-1.5 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-text-secondary">Mã GD:</span>
                <span className="font-mono font-bold">{txResult.transactionCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Giá gói:</span>
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
