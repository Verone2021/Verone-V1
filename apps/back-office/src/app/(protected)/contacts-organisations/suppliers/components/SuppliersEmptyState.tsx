'use client';

import { ButtonV2, Card, CardContent } from '@verone/ui';
import { colors, spacing } from '@verone/ui/design-system';
import { Building2, Plus } from 'lucide-react';

interface SuppliersEmptyStateProps {
  activeTab: 'active' | 'archived' | 'preferred';
  searchQuery: string;
  onCreateSupplier: () => void;
}

export function SuppliersEmptyState({
  activeTab,
  searchQuery,
  onCreateSupplier,
}: SuppliersEmptyStateProps) {
  return (
    <Card>
      <CardContent className="text-center" style={{ padding: spacing[8] }}>
        <Building2
          className="h-12 w-12 mx-auto mb-4"
          style={{ color: colors.text.muted }}
        />
        <h3
          className="text-lg font-medium mb-2"
          style={{ color: colors.text.DEFAULT }}
        >
          Aucun fournisseur trouvé
        </h3>
        <p className="mb-4" style={{ color: colors.text.subtle }}>
          {searchQuery
            ? 'Aucun fournisseur ne correspond à votre recherche.'
            : activeTab === 'active'
              ? 'Commencez par créer votre premier fournisseur.'
              : 'Aucun fournisseur archivé.'}
        </p>
        {activeTab === 'active' && (
          <ButtonV2 variant="primary" onClick={onCreateSupplier} icon={Plus}>
            Créer un fournisseur
          </ButtonV2>
        )}
      </CardContent>
    </Card>
  );
}
