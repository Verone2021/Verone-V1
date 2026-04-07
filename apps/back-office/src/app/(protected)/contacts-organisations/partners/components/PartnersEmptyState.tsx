'use client';

import { ButtonV2, Card, CardContent } from '@verone/ui';
import { colors, spacing } from '@verone/ui/design-system';
import { Building2, Plus } from 'lucide-react';

interface PartnersEmptyStateProps {
  searchQuery: string;
  activeTab: 'active' | 'archived' | 'preferred';
  onCreatePartner: () => void;
}

export function PartnersEmptyState({
  searchQuery,
  activeTab,
  onCreatePartner,
}: PartnersEmptyStateProps) {
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
          Aucun partenaire trouvé
        </h3>
        <p className="mb-4" style={{ color: colors.text.subtle }}>
          {searchQuery
            ? 'Aucun partenaire ne correspond à votre recherche.'
            : activeTab === 'active'
              ? 'Commencez par créer votre premier partenaire.'
              : 'Aucun partenaire archivé.'}
        </p>
        {activeTab === 'active' && (
          <ButtonV2 variant="primary" onClick={onCreatePartner} icon={Plus}>
            Créer un partenaire
          </ButtonV2>
        )}
      </CardContent>
    </Card>
  );
}
