import { useState } from 'react';
import { Ticket, X, CheckCircle2, ShieldCheck, AlertCircle, QrCode } from 'lucide-react';
import { useWalletStore } from '../../../store/useWalletStore';

const cinemas = ['CGV Vincom', 'Lotte Cinema', 'Galaxy Cinema', 'BHD Star'];
const movies = [
  { id: 'm1', title: 'Avatar 3: Fire & Ash', duration: '190 phút', rating: 'C13' },
  { id: 'm2', title: 'Detective Conan: Movie 28', duration: '110 phút', rating: 'P' },
  { id: 'm3', title: 'Deadpool & Wolverine', duration: '128 phút', rating: 'C18' }
];
const showtimes = ['14:30', '17:00', '19:30', '21:45'];

// Seat layout simulation
const rows = ['A', 'B', 'C'];
const seatCols = [1, 2, 3, 4, 5, 6];
const occupiedSeats = ['A3', 'B2', 'B3'];

const getIdempotencyKey = (prefix) => `${prefix}-${Date.now()}`;

export default function MovieTicketModal({ onClose }) {
  const { balance, executeUtilityPayment } = useWalletStore();
  const [selectedCinema, setSelectedCinema] = useState(cinemas[0]);
  const [selectedMovie, setSelectedMovie] = useState(movies[0]);
  const [selectedTime, setSelectedTime] = useState(showtimes[2]);
  const [selectedSeats, setSelectedSeats] = useState(['C3', 'C4']);
  const [step, setStep] = useState(1); // 1: Choose movie & seat, 2: PIN, 3: Ticket QR
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txResult, setTxResult] = useState(null);

  const pricePerSeat = 110000;
  const totalPrice = selectedSeats.length * pricePerSeat;

  const toggleSeat = (seatId) => {
    if (occupiedSeats.includes(seatId)) return;
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleProceedPin = () => {
    if (selectedSeats.length === 0) {
      setError('Vui lòng chọn ít nhất 1 ghế.');
      return;
    }
    if (totalPrice > balance) {
      setError(`Số dư ví không đủ ${totalPrice.toLocaleString('vi-VN')} VNĐ.`);
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
        serviceName: 'Đặt Vé Xem Phim',
        provider: selectedCinema,
        targetId: selectedSeats.join(','),
        amount: totalPrice,
        details: `Vé phim "${selectedMovie.title}" - Rạp: ${selectedCinema} - Suất: ${selectedTime} - Ghế: ${selectedSeats.join(', ')}`,
        idempotencyKey: getIdempotencyKey('idemp-movie')
      });
      setTxResult(res);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Đặt vé thất bại.');
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
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Đặt Vé Xem Phim Chiếu Rạp</h3>
              <p className="text-[11px] text-text-secondary">Chọn phim, suất chiếu & sơ đồ ghế</p>
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

        {/* STEP 1: Movie & Seat Selection */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Movie selection */}
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1.5">Phim Đang Chiếu</label>
              <div className="space-y-1.5">
                {movies.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMovie(m)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                      selectedMovie.id === m.id
                        ? 'bg-purple-500/10 border-purple-500 text-purple-600 ring-1 ring-purple-500'
                        : 'border-border-main text-text-primary hover:border-purple-500/40'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold">{m.title}</h4>
                      <p className="text-[10px] text-text-secondary">{m.duration} • Độ tuổi: {m.rating}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 font-bold">2D Vietsub</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cinema & Showtime */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">Cụm Rạp</label>
                <select
                  value={selectedCinema}
                  onChange={(e) => setSelectedCinema(e.target.value)}
                  className="w-full p-2 rounded-xl border border-border-main bg-bg-input text-xs font-bold focus:outline-none"
                >
                  {cinemas.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">Suất Chiếu</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full p-2 rounded-xl border border-border-main bg-bg-input text-xs font-bold focus:outline-none"
                >
                  {showtimes.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Seat Matrix */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-text-secondary">Sơ Đồ Chọn Ghế</label>
                <div className="flex items-center gap-3 text-[10px] text-text-secondary">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-500/30"></span> Đã đặt</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-purple-500"></span> Đang chọn</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl clean-card-subtle text-center space-y-3">
                {/* Curved Screen label */}
                <div className="w-3/4 mx-auto py-0.5 rounded-t-lg bg-gray-400/20 text-[10px] font-bold text-text-secondary tracking-widest border-t border-gray-400">
                  MÀN HÌNH CHIẾU
                </div>

                <div className="grid gap-2 justify-center">
                  {rows.map((row) => (
                    <div key={row} className="flex items-center gap-2">
                      <span className="w-4 text-xs font-bold text-gray-400">{row}</span>
                      <div className="flex gap-1.5">
                        {seatCols.map((col) => {
                          const seatId = `${row}${col}`;
                          const isOccupied = occupiedSeats.includes(seatId);
                          const isSelected = selectedSeats.includes(seatId);

                          return (
                            <button
                              key={seatId}
                              type="button"
                              disabled={isOccupied}
                              onClick={() => toggleSeat(seatId)}
                              className={`w-7 h-7 rounded-lg text-[10px] font-bold transition flex items-center justify-center ${
                                isOccupied
                                  ? 'bg-gray-500/30 text-gray-500 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400'
                                  : 'bg-bg-input border border-border-main hover:border-purple-500'
                              }`}
                            >
                              {seatId}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="p-3.5 rounded-xl clean-card-subtle flex justify-between items-center text-xs">
              <div>
                <p className="text-text-secondary">Ghế chọn: <strong className="text-text-primary">{selectedSeats.join(', ') || 'Chưa chọn'}</strong></p>
                <p className="text-[10px] text-gray-400">{pricePerSeat.toLocaleString('vi-VN')} đ / vé</p>
              </div>
              <span className="text-sm font-extrabold text-purple-500">{totalPrice.toLocaleString('vi-VN')} VNĐ</span>
            </div>

            <button
              type="button"
              onClick={handleProceedPin}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              Tiếp Tục Thanh Toán
            </button>
          </div>
        )}

        {/* STEP 2: PIN */}
        {step === 2 && (
          <form onSubmit={handleConfirmPayment} className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Xác Nhận Đặt Vé Xem Phim</h4>
              <p className="text-xs text-text-secondary mt-1">
                Thanh toán <strong>{totalPrice.toLocaleString('vi-VN')} VNĐ</strong> cho {selectedSeats.length} vé ({selectedSeats.join(', ')})
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
                {loading ? 'Đang xuất vé...' : 'Xác Nhận'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: E-Ticket QR Code */}
        {step === 3 && txResult && (
          <div className="space-y-4 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto border border-purple-500/20">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-purple-500">Vé Xem Phim Điện Tử (E-Ticket)</h4>
              <p className="text-xs text-text-secondary mt-0.5">Xuất trình mã QR tại quầy rạp để nhận vé vào xem</p>
            </div>

            {/* QR Mock Card */}
            <div className="p-4 rounded-2xl bg-white text-gray-900 shadow-xl space-y-3 mx-auto max-w-xs border border-gray-200">
              <div className="w-32 h-32 bg-gray-900 mx-auto rounded-xl p-2 flex items-center justify-center text-white">
                <QrCode className="w-24 h-24 stroke-[1.5]" />
              </div>
              <div className="border-t border-dashed border-gray-300 pt-2 text-xs space-y-1 text-center">
                <p className="font-extrabold text-sm">{selectedMovie.title}</p>
                <p className="text-gray-600 text-[11px]">{selectedCinema} • {selectedTime}</p>
                <p className="font-bold text-purple-700">Ghế: {selectedSeats.join(', ')}</p>
                <p className="font-mono text-[10px] text-gray-400">Mã vé: {txResult.transactionCode}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
            >
              Hoàn Tất & Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
