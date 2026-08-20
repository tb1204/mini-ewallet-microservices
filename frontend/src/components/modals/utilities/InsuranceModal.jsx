import  { useState } from 'react';
import { ShieldCheck, X, AlertCircle, FileCheck } from 'lucide-react';
import { useWalletStore } from '../../../store/useWalletStore';

const insurancePackages = [
  { id: 'wallet_sec', name: 'Bảo Vệ Tài Khoản Ví', price: 10000, duration: '1 tháng', payout: '50.000.000 VNĐ', desc: 'Bồi thường 100% tài sản ví nếu bị mất do lừa đảo/hacker' },
  { id: 'motorbike', name: 'Bảo Hiểm Xe Máy (TNDS)', price: 66000, duration: '1 năm', payout: '150.000.000 VNĐ', desc: 'Bảo hiểm trách nhiệm dân sự bắt buộc cho chủ xe máy' },
  { id: 'health', name: 'Bảo Hiểm Tai Nạn Cá Nhân', price: 150000, duration: '1 năm', payout: '100.000.000 VNĐ', desc: 'Hỗ trợ chi phí y tế & tai nạn sinh hoạt 24/7' }
];

const getIdempotencyKey = (prefix) => `${prefix}-${Date.now()}`;

export default function InsuranceModal({ onClose }) {
  const { balance, executeUtilityPayment } = useWalletStore();
  const [selectedPkg, setSelectedPkg] = useState(insurancePackages[0]);
  const [insuredName, setInsuredName] = useState('Nguyễn Văn A');
  const [idNumber, setIdNumber] = useState('079198001122');
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txResult, setTxResult] = useState(null);

  const handleProceedPin = (e) => {
    e.preventDefault();
    if (!insuredName || !idNumber) {
      setError('Vui lòng điền đầy đủ Họ tên và Số CCCD/CMND.');
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
      setError('Mã PIN gồm 6 chữ số.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await executeUtilityPayment({
        serviceName: 'Mua Bảo Hiểm Điện Tử',
        provider: 'Bảo Hiểm PJICO / PTI',
        targetId: idNumber,
        amount: selectedPkg.price,
        details: `Mua [${selectedPkg.name}] - Người được BH: ${insuredName} (CCCD: ${idNumber}) - Quyền lợi: ${selectedPkg.payout}`,
        idempotencyKey: getIdempotencyKey('idemp-insur')
      });
      setTxResult(res);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Thanh toán bảo hiểm thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="clean-card max-w-md w-full relative p-6 shadow-2xl space-y-5 rounded-2xl overflow-hidden border border-emerald-500/20 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-main">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Bảo Hiểm Số Ví & Cá Nhân</h3>
              <p className="text-[11px] text-text-secondary">Cấp Giấy chứng nhận điện tử có hiệu lực ngay</p>
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

        {/* STEP 1: Select Package & Form */}
        {step === 1 && (
          <form onSubmit={handleProceedPin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                Chọn Gói Bảo Hiểm
              </label>
              <div className="space-y-2">
                {insurancePackages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPkg(pkg)}
                    className={`w-full p-3 rounded-xl border text-left flex flex-col space-y-1 transition ${
                      selectedPkg.id === pkg.id
                        ? 'bg-rose-500/10 border-rose-500 ring-1 ring-rose-500'
                        : 'border-border-main hover:border-rose-500/40'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-text-primary">{pkg.name}</h4>
                      <span className="text-xs font-extrabold text-rose-500">
                        {pkg.price.toLocaleString('vi-VN')} đ/{pkg.duration}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-secondary">{pkg.desc}</p>
                    <div className="text-[10px] font-semibold text-emerald-500 pt-0.5">
                      Quyền lợi tối đa: {pkg.payout}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                  Họ & Tên Người Được BH
                </label>
                <input
                  type="text"
                  value={insuredName}
                  onChange={(e) => setInsuredName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border-main bg-bg-input text-xs font-bold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                  Số CCCD / CMND
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border-main bg-bg-input text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              Tiếp Tục Thanh Toán ({selectedPkg.price.toLocaleString('vi-VN')} VNĐ)
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
              <h4 className="text-sm font-bold">Xác Nhận Mua Bảo Hiểm</h4>
              <p className="text-xs text-text-secondary mt-1">
                Thanh toán <strong>{selectedPkg.price.toLocaleString('vi-VN')} VNĐ</strong> mua <strong>{selectedPkg.name}</strong> cho {insuredName}
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
                {loading ? 'Đang phát hành...' : 'Xác Nhận'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: E-Certificate */}
        {step === 3 && txResult && (
          <div className="space-y-4 text-center animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
              <FileCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-rose-500">Giấy Chứng Nhận Bảo Hiểm Điện Tử</h4>
              <p className="text-xs text-text-secondary mt-0.5">Hợp đồng bảo hiểm đã có hiệu lực pháp lý ngay lập tức</p>
            </div>

            <div className="p-4 rounded-xl clean-card-subtle space-y-2 text-xs text-left border border-rose-500/30">
              <div className="flex justify-between items-center pb-2 border-b border-border-main">
                <span className="font-extrabold text-sm text-text-primary">{selectedPkg.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                  ĐANG HIỆU LỰC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Người được bảo hiểm:</span>
                <span className="font-bold">{insuredName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Số CCCD:</span>
                <span className="font-mono">{idNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Mã Giấy chứng nhận:</span>
                <span className="font-mono text-[11px] text-rose-500 font-bold">INS-{txResult.transactionCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Mức bồi thường tối đa:</span>
                <span className="font-bold text-emerald-600">{selectedPkg.payout}</span>
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
