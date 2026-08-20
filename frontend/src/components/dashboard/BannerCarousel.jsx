import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, ShieldCheck, QrCode, PiggyBank } from 'lucide-react';
import { Link } from 'react-router-dom';

const slides = [
  {
    id: 1,
    title: 'Miễn Phí Chuyển Tiền P2P 24/7',
    desc: 'Chuyển tiền tức thì đến bạn bè & người thân không mất phí giao dịch.',
    badge: 'ƯU ĐÃI ĐẶC BIỆT',
    icon: Zap,
    color: 'from-emerald-600/20 via-emerald-600/10 to-transparent',
    borderColor: 'border-emerald-500/30',
    btnText: 'Chuyển Tiền Ngay',
    link: '/transfer'
  },
  {
    id: 2,
    title: 'Bảo Mật Tối Đa Với Mã PIN 6 Số',
    desc: 'Kích hoạt mã PIN xác thực cấp 2 cho mọi giao dịch nạp, rút và chuyển tiền.',
    badge: 'AN TOÀN BẢO MẬT',
    icon: ShieldCheck,
    color: 'from-indigo-600/20 via-indigo-600/10 to-transparent',
    borderColor: 'border-indigo-500/30',
    btnText: 'Cài Đặt PIN',
    link: '/security'
  },
  {
    id: 3,
    title: 'Nạp Tiền VietQR Khớp Lệnh Tức Thì',
    desc: 'Hỗ trợ quét mã QR tự động từ 40+ ngân hàng tại Việt Nam 24/7.',
    badge: 'TIỆN ÍCH KHÔNG CHỜ',
    icon: QrCode,
    color: 'from-purple-600/20 via-purple-600/10 to-transparent',
    borderColor: 'border-purple-500/30',
    btnText: 'Nạp Tiền Ngay',
    link: '/topup'
  },
  {
    id: 4,
    title: 'Tiết Kiệm Tích Lũy 6.5%/Năm',
    desc: 'Sinh lời tự động mỗi ngày từ số dư nhàn rỗi trong ví điện tử của bạn.',
    badge: 'TÍCH LŨY THÔNG MINH',
    icon: PiggyBank,
    color: 'from-amber-600/20 via-amber-600/10 to-transparent',
    borderColor: 'border-amber-500/30',
    btnText: 'Khám Phá Ngay',
    link: '#'
  }
];

export default function BannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const currentSlide = slides[currentIndex];
  const IconComponent = currentSlide.icon;

  return (
    <div className={`clean-card p-6 sm:p-8 relative overflow-hidden bg-linear-to-r ${currentSlide.color} border ${currentSlide.borderColor} transition-all duration-500`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
        
        <div className="space-y-2 max-w-lg">
          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 uppercase">
            {currentSlide.badge}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {currentSlide.title}
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            {currentSlide.desc}
          </p>

          <div className="pt-2">
            <Link
              to={currentSlide.link}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
            >
              {currentSlide.btnText} →
            </Link>
          </div>
        </div>

        {/* Big Decorative Icon */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-500 shrink-0 self-center sm:self-auto">
          <IconComponent className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

      </div>

      {/* Slider Controls & Dots */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
        
        {/* Navigation Dots */}
        <div className="flex items-center gap-2">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-emerald-500' : 'w-2 bg-slate-500/40 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

        {/* Arrow buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg clean-card-subtle text-text-secondary hover:text-text-primary transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg clean-card-subtle text-text-secondary hover:text-text-primary transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
