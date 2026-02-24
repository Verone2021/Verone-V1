import { cn } from '@verone/utils';

interface OrganisationNameDisplayProps {
  legalName: string;
  tradeName?: string | null;
  className?: string;
  /** 'compact' pour cellules de tableau, 'default' pour blocs détail */
  variant?: 'default' | 'compact';
}

/**
 * Affiche le nom légal (raison sociale) en premier, et le nom commercial
 * en dessous si différent. Règle business : legal_name est toujours primaire.
 *
 * @example
 * // Affiche "ANK" en gras + "Pokawa Aix-La-Pioline" en dessous
 * <OrganisationNameDisplay legalName="ANK" tradeName="Pokawa Aix-La-Pioline" />
 */
export function OrganisationNameDisplay({
  legalName,
  tradeName,
  className,
  variant = 'default',
}: OrganisationNameDisplayProps) {
  const hasDifferentTradeName = tradeName && tradeName !== legalName;

  if (variant === 'compact') {
    return (
      <div className={cn(className)}>
        <div className="font-medium">{legalName}</div>
        {hasDifferentTradeName && (
          <div className="text-xs text-muted-foreground">{tradeName}</div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      <p className="font-semibold">{legalName}</p>
      {hasDifferentTradeName && (
        <p className="text-sm text-muted-foreground">{tradeName}</p>
      )}
    </div>
  );
}
