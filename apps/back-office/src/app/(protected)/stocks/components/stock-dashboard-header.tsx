'use client';

import Link from 'next/link';

interface StockDashboardHeaderProps {
  onRefetch: () => void;
}

const NAV_LINKS = [
  { href: '/stocks/inventaire', label: 'Inventaire' },
  { href: '/stocks/mouvements', label: 'Mouvements' },
  { href: '/stocks/alertes', label: 'Alertes' },
  { href: '/stocks/analytics', label: 'Analytics' },
  { href: '/stocks/previsionnel', label: 'Previsionnel' },
  { href: '/stocks/ajustements', label: 'Ajustements' },
  { href: '/stocks/stockage', label: 'Stockage' },
];

export function StockDashboardHeader({ onRefetch }: StockDashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Stocks</h1>
        <div className="flex items-center gap-3 mt-1 text-xs">
          {NAV_LINKS.map((link, idx) => (
            <span key={link.href} className="flex items-center gap-3">
              {idx > 0 && <span className="text-gray-300">|</span>}
              <Link
                href={link.href}
                className="text-gray-500 hover:text-gray-900"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onRefetch}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
      >
        Actualiser
      </button>
    </div>
  );
}
