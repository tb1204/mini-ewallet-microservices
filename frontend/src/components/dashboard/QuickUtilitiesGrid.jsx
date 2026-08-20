import { useState } from 'react';
import { Smartphone, Zap, Wifi, PiggyBank, ShieldCheck } from 'lucide-react';
import PhoneTopupModal from '../modals/utilities/PhoneTopupModal';
import BillPaymentModal from '../modals/utilities/BillPaymentModal';
import DataPackageModal from '../modals/utilities/DataPackageModal';
import SavingsModal from '../modals/utilities/SavingsModal';
import InsuranceModal from '../modals/utilities/InsuranceModal';

const utilityServices = [
  { id: 'phone', name: 'Nạp Điện Thoại', icon: Smartphone, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { id: 'bill', name: 'Điện & Nước', icon: Zap, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { id: 'data', name: 'Gói Data 4G/5G', icon: Wifi, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'saving', name: 'Tiết Kiệm Ví', icon: PiggyBank, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
  { id: 'insurance', name: 'Bảo Hiểm Ví', icon: ShieldCheck, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' }
];

export default function QuickUtilitiesGrid() {
  const [activeServiceId, setActiveServiceId] = useState(null);

  const handleCloseModal = () => setActiveServiceId(null);

  return (
    <div className="clean-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-tight">
          Dịch Vụ & Tiện Ích Ví
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {utilityServices.map((srv) => {
          const IconComp = srv.icon;
          return (
            <button
              key={srv.id}
              onClick={() => setActiveServiceId(srv.id)}
              className="p-3.5 rounded-2xl clean-card-subtle flex flex-col items-center gap-2 hover:border-emerald-500/50 hover:scale-105 transition duration-200 text-center group cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${srv.color}`}>
                <IconComp className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary transition">
                {srv.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Render Active Utility Modal */}
      {activeServiceId === 'phone' && <PhoneTopupModal onClose={handleCloseModal} />}
      {activeServiceId === 'bill' && <BillPaymentModal onClose={handleCloseModal} />}
      {activeServiceId === 'data' && <DataPackageModal onClose={handleCloseModal} />}
      {activeServiceId === 'saving' && <SavingsModal onClose={handleCloseModal} />}
      {activeServiceId === 'insurance' && <InsuranceModal onClose={handleCloseModal} />}
    </div>
  );
}
