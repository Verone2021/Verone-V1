'use client';

import { Card, CardContent } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { colors, spacing } from '@verone/ui/design-system';
import { Building2, Plus } from 'lucide-react';

interface CustomerEmptyStateProps {
  searchQuery: string;
  activeTab: 'active' | 'archived' | 'preferred' | 'incomplete';
  onCreateCustomer: () => void;
}

export function CustomerEmptyState({
  searchQuery,
  activeTab,
  onCreateCustomer,
}: CustomerEmptyStateProps) {
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
          Aucun client trouvé
        </h3>
        <p className="mb-4" style={{ color: colors.text.subtle }}>
          {searchQuery
            ? 'Aucun client ne correspond à votre recherche.'
            : activeTab === 'active'
              ? 'Commencez par créer votre premier client.'
              : 'Aucun client archivé.'}
        </p>
        {activeTab === 'active' && (
          <ButtonV2 variant="primary" onClick={onCreateCustomer} icon={Plus}>
            Créer un client
          </ButtonV2>
        )}
      </CardContent>
    </Card>
  );
}
