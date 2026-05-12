'use client';

/**
 * PublicationScoreCard — score ring SVG + barre de progression + bouton Publier.
 * Sprint : BO-UI-PROD-PUB-001
 */

interface PublicationScoreCardProps {
  passedRequired: number;
  totalRequired: number;
}

function getColor(passed: number, total: number): string {
  if (passed === total) return '#16a34a'; // emerald-600
  if (passed >= total * 0.67) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

function getTailwindColor(passed: number, total: number): string {
  if (passed === total) return 'bg-emerald-500';
  if (passed >= total * 0.67) return 'bg-orange-500';
  return 'bg-red-500';
}

export function PublicationScoreCard({
  passedRequired,
  totalRequired,
}: PublicationScoreCardProps) {
  const pct = Math.round((passedRequired / totalRequired) * 100);
  const circumference = 2 * Math.PI * 15; // r=15
  const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
  const ringColor = getColor(passedRequired, totalRequired);
  const barColor = getTailwindColor(passedRequired, totalRequired);
  const missing = totalRequired - passedRequired;
  const isReady = passedRequired === totalRequired;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Ring SVG */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke={ringColor}
              strokeWidth="3"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums">
            {passedRequired}/{totalRequired}
          </div>
        </div>

        {/* Barre + label */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900 mb-1">
            Score de publication
          </p>
          <p className="text-xs text-neutral-500 mb-2">
            {isReady
              ? 'Tous les critères requis sont remplis — prêt à publier.'
              : `${missing} critère${missing > 1 ? 's' : ''} requis manquant${missing > 1 ? 's' : ''}.`}
          </p>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Bouton Publier */}
        <div className="flex-shrink-0">
          <button
            type="button"
            disabled
            title="Bientôt disponible"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-400 cursor-not-allowed"
          >
            Publier sur le site
          </button>
        </div>
      </div>
    </div>
  );
}
