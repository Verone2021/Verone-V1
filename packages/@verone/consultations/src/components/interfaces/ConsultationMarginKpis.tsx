'use client';

interface ConsultationMarginKpisProps {
  total: number;
  totalCost: number;
  totalShipping: number;
  totalMargin: number;
  totalMarginPercent: number;
}

export function ConsultationMarginKpis({
  total,
  totalCost,
  totalShipping,
  totalMargin,
  totalMarginPercent,
}: ConsultationMarginKpisProps) {
  return (
    <div className="bg-white border border-zinc-100 rounded-lg flex divide-x divide-zinc-100 overflow-hidden shadow-sm">
      <div className="flex-1 px-4 py-2 bg-blue-50/20">
        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter">
          CA Total
        </p>
        <p className="text-base font-bold text-zinc-900 leading-none">
          {total.toFixed(2)}€
        </p>
      </div>
      <div className="flex-1 px-4 py-2 bg-rose-50/20">
        <p className="text-[9px] font-bold text-rose-600 uppercase tracking-tighter">
          Achat
        </p>
        <p className="text-base font-bold text-zinc-900 leading-none">
          {totalCost.toFixed(2)}€
        </p>
      </div>
      <div className="flex-1 px-4 py-2 bg-orange-50/20">
        <p className="text-[9px] font-bold text-orange-600 uppercase tracking-tighter">
          Transport
        </p>
        <p className="text-base font-bold text-zinc-900 leading-none">
          {totalShipping.toFixed(2)}€
        </p>
      </div>
      <div className="flex-1 px-4 py-2 bg-emerald-50/20">
        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">
          Bénéfice
        </p>
        <p
          className={`text-base font-bold leading-none ${totalMargin >= 0 ? 'text-zinc-900' : 'text-red-600'}`}
        >
          {totalMargin.toFixed(2)}€
        </p>
      </div>
      <div className="flex-1 px-4 py-2 bg-purple-50/20">
        <p className="text-[9px] font-bold text-purple-600 uppercase tracking-tighter">
          Marge
        </p>
        <p
          className={`text-base font-bold leading-none ${totalMarginPercent >= 30 ? 'text-zinc-900' : totalMarginPercent >= 0 ? 'text-orange-600' : 'text-red-600'}`}
        >
          {totalMarginPercent.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}
