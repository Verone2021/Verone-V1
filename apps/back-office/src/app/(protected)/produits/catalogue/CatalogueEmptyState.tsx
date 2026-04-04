'use client';

interface CatalogueEmptyStateProps {
  activeTab: 'active' | 'incomplete' | 'archived';
  isEmpty: boolean;
}

const EMPTY_MESSAGES: Record<string, { title: string; subtitle: string }> = {
  active: {
    title: 'Aucun produit actif trouvé',
    subtitle: 'Essayez de modifier vos critères de recherche',
  },
  incomplete: {
    title: 'Tous les produits sont complets',
    subtitle:
      'Aucun produit ne manque de fournisseur, sous-catégorie, prix, photo, dimensions ou poids',
  },
  archived: {
    title: 'Aucun produit archivé trouvé',
    subtitle: 'Les produits archivés apparaîtront ici',
  },
};

export function CatalogueEmptyState({
  activeTab,
  isEmpty,
}: CatalogueEmptyStateProps) {
  if (!isEmpty) return null;

  const msg = EMPTY_MESSAGES[activeTab];

  return (
    <div className="text-center py-12">
      <div className="text-black opacity-50 text-lg">{msg.title}</div>
      <p className="text-black opacity-30 text-sm mt-2">{msg.subtitle}</p>
    </div>
  );
}
