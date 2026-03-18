/**
 * StarRating - Compact SVG star rating display
 * Usage: <StarRating average={4.2} count={15} />
 */

interface StarRatingProps {
  average: number;
  count: number;
  size?: 'sm' | 'md';
  showCount?: boolean;
}

export function StarRating({
  average,
  count,
  size = 'sm',
  showCount = true,
}: StarRatingProps) {
  if (count === 0) return null;

  const starSize = size === 'sm' ? 14 : 18;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const rounded = Math.round(average * 2) / 2; // Round to nearest 0.5

  return (
    <div className="flex items-center gap-1">
      <div
        className="flex items-center"
        aria-label={`${average.toFixed(1)} sur 5`}
      >
        {Array.from({ length: 5 }).map((_, i) => {
          const fill =
            i + 1 <= rounded ? 'full' : i + 0.5 <= rounded ? 'half' : 'empty';

          return (
            <svg
              key={i}
              width={starSize}
              height={starSize}
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={`half-star-${i}`}>
                  <stop offset="50%" stopColor="#FBBF24" />
                  <stop offset="50%" stopColor="#D1D5DB" />
                </linearGradient>
              </defs>
              <path
                d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 13.85 5.06 16.7l.94-5.49-4-3.9 5.53-.8L10 1.5z"
                fill={
                  fill === 'full'
                    ? '#FBBF24'
                    : fill === 'half'
                      ? `url(#half-star-${i})`
                      : '#D1D5DB'
                }
              />
            </svg>
          );
        })}
      </div>
      {showCount && (
        <span className={`${textSize} text-muted-foreground ml-0.5`}>
          ({count})
        </span>
      )}
    </div>
  );
}
