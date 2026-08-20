import { useState } from 'react';
import { PiggyBank, X, CheckCircle2, ShieldCheck, AlertCircle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useWalletStore } from '../../../store/useWalletStore';

const savingsOptions = [
  { id: 'flex', title: 'Linh Hoạt (Không kỳ hạn)', termMonths: 0, interestRate: 4.0, desc: 'Rút bất kỳ lúc nào vẫn được tính lãi' },
  { id: '3m', title: 'Kỳ Hạn 3 Tháng', termMonths: 3, interestRate: 6.0, desc: 'Lãi suất hấp dẫn ngắn hạn' },
  { id: '6m', title: 'Kỳ Hạn 6 Tháng', termMonths: 6, interestRate: 7.2, desc: 'Tối ưu lợi nhuận cho ví' },
  { id: '12m', title: 'Kỳ Hạn 12 Tháng', termMonths: 12, interestRate: 8.0, desc: 'Lãi suất cao nhất 8%/năm' }
];

const getIdempotencyKey = (prefix) => `${prefix}-${Date.now()}`;

export default function SavingsModal({ onClose }) {
  const { balance, savingsAccounts, depositSavings, withdrawSavings } = useWalletStore();
  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' | 'my_accounts'
  const [selectedOption, setSelectedOption] = useState(savingsOptions[0]);
  const [amount, setAmount] = useState('1000000');
  const [step, setStep] = useState(1); // 1: Input, 2: PIN, 3: Success
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txResult, setTxResult] = useState(null);

  const numAmount = parseFloat(amount) || 0;
  // Estimated interest for 1 year or selected term
  const daysInTerm = selectedOption.termMonths === 0 ? 365 : selectedOption.termMonths * 30;
  const estimatedInterest = Math.round((numAmount * (selectedOption.interestRate / 100) * daysInTerm) / 365);

  const handleProceedPin = (e) => {
    e.preventDefault();
    if (numAmount < 100000) {
      setError('Số tiền gửi tiết kiệm tối thiểu là 100.000 VNĐ.');
      return;
    }
    if (numAmount > balance) {
      setError(`Số dư ví không đủ ${numAmount.toLocaleString('vi-VN')} VNĐ.`);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleConfirmDeposit = async (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('Mã PIN gồm 6 chữ số.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await depositSavings({
        title: selectedOption.title,
        termMonths: selectedOption.termMonths,
        interestRate: selectedOption.interestRate,
        amount: numAmount,
        idempotencyKey: getIdempotencyKey('idemp-savings')
      });
      setTxResult(res);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Gửi tiết kiệm thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (savId) => {
    if (!window.confirm('Bạn có chắc chắn muốn rút Sổ Tiết Kiệm này về Số dư Ví chính?')) return;
    setLoading(true);
    try {
      const payout = await withdrawSavings({ savingsId: savId });
      alert(`Đã rút thành công ${(payout || 0).toLocaleString('vi-VN')} VNĐ vào số dư Ví!`);
    } catch (err) {
      alert(err.message);
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
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Tiết Kiệm Ví Sinh Lời</h3>
              <p className="text-[11px] text-text-secondary">Lãi suất lên tới 8.0%/năm • An toàn tuyệt đối</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-gray-500/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-bg-input border border-border-main">
          <button
            type="button"
            onClick={() => {
              setActiveTab('deposit');
              setStep(1);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'deposit'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Gửi Tiết Kiệm Mới
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my_accounts')}
            className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'my_accounts'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Sổ Của Tôi ({savingsAccounts.length})
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: Deposit */}
        {activeTab === 'deposit' && (
          <>
            {step === 1 && (
              <form onSubmit={handleProceedPin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                    Chọn Kỳ Hạn Tiết Kiệm
                  </label>
                  <div className="space-y-2">
                    {savingsOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedOption(opt)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                          selectedOption.id === opt.id
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 ring-1 ring-indigo-500'
                            : 'border-border-main hover:border-indigo-500/40'
                        }`}
                      >
                        <div>
                          <h4 className="text-xs font-bold">{opt.title}</h4>
                          <p className="text-[10px] text-text-secondary">{opt.desc}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-emerald-500">{opt.interestRate}%</span>
                          <span className="text-[10px] text-gray-400 block">/năm</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                    Số Tiền Gửi Tiết Kiệm (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Nhập số tiền gửi (tối thiểu 100.000đ)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-main bg-bg-input text-sm font-bold tracking-wide focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {/* Live interest estimation */}
                <div className="p-3.5 rounded-xl clean-card-subtle space-y-1.5 text-xs border border-emerald-500/20">
                  <div className="flex justify-between items-center text-emerald-500 font-bold">
                    <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Tiền lãi dự kiến nhận:</span>
                    <span className="text-sm">+{estimatedInterest.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-text-secondary pt-1 border-t border-border-main">
                    <span>Tổng nhận dự kiến:</span>
                    <span className="font-bold text-text-primary">
                      {(numAmount + estimatedInterest).toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
                >
                  Tiếp Tục Gửi ({numAmount.toLocaleString('vi-VN')} VNĐ)
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleConfirmDeposit} className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Xác Nhận Mở Sổ Tiết Kiệm</h4>
                  <p className="text-xs text-text-secondary mt-1">
                    Gửi <strong>{numAmount.toLocaleString('vi-VN')} VNĐ</strong> ({selectedOption.title} - Lãi {selectedOption.interestRate}%/năm)
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
                    {loading ? 'Đang mở sổ...' : 'Xác Nhận'}
                  </button>
                </div>
              </form>
            )}

            {step === 3 && txResult && (
              <div className="space-y-4 text-center animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-emerald-600">Mở Sổ Tiết Kiệm Thành Công!</h4>
                  <p className="text-xs text-text-secondary mt-1">
                    Sổ tiết kiệm <strong>{txResult.title}</strong> đã được khởi tạo và bắt đầu sinh lãi ngay hôm nay.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('my_accounts');
                    setStep(1);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                >
                  Xem Danh Sách Sổ Tiết Kiệm
                </button>
              </div>
            )}
          </>
        )}

        {/* TAB 2: My Accounts List */}
        {activeTab === 'my_accounts' && (
          <div className="space-y-3">
            {savingsAccounts.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-secondary space-y-2">
                <PiggyBank className="w-10 h-10 mx-auto text-gray-400" />
                <p>Bạn chưa có Sổ tiết kiệm nào.</p>
              </div>
            ) : (
              savingsAccounts.map((sav) => (
                <div key={sav.id} className="p-4 rounded-xl clean-card-subtle space-y-2 border border-indigo-500/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">{sav.title}</h4>
                      <p className="text-[10px] text-text-secondary">Lãi suất: <strong className="text-emerald-500">{sav.interestRate}%/năm</strong></p>
                    </div>
                    <span className="text-sm font-extrabold text-indigo-500">
                      {sav.amount.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border-main text-[10px] text-text-secondary">
                    <span>Ngày mở: {new Date(sav.createdAt).toLocaleDateString('vi-VN')}</span>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleWithdraw(sav.id)}
                      className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 font-bold rounded-lg transition flex items-center gap-1"
                    >
                      <ArrowUpRight className="w-3 h-3" /> Rút về Ví
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
