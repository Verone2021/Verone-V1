interface AideSectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Section de contenu pour les pages d'aide.
 * Carte blanche avec titre et contenu structuré.
 */
export function AideSection({
  title,
  children,
}: AideSectionProps): JSX.Element {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-linkme-marine mb-4">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}
