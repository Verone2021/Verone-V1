'use client';

/**
 * Composant réutilisable : Card Logo Organisation
 * Affiche le logo avec preview + bouton upload/modification dans un modal
 */

import { useState } from 'react';

import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Building2, Edit } from 'lucide-react';

import { LogoUploadButton } from '../buttons/LogoUploadButton';
import { OrganisationLogo } from '../display/OrganisationLogo';

interface OrganisationLogoCardProps {
  organisationId: string;
  organisationName: string;
  organisationType: 'supplier' | 'customer' | 'provider';
  currentLogoUrl?: string | null;
  onUploadSuccess?: () => void;
  className?: string;
}

export function OrganisationLogoCard({
  organisationId,
  organisationName,
  organisationType,
  currentLogoUrl,
  onUploadSuccess,
  className,
}: OrganisationLogoCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  // Labels selon type
  const typeLabels = {
    supplier: 'du fournisseur',
    customer: 'du client',
    provider: 'du prestataire',
  };

  const handleUploadSuccess = () => {
    setModalOpen(false);
    if (onUploadSuccess) {
      onUploadSuccess();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Logo de l'organisation
        </CardTitle>
        <CardDescription>
          Gérer le logo {typeLabels[organisationType]}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview du logo si existe */}
        {currentLogoUrl && (
          <div className="flex justify-center">
            <OrganisationLogo
              logoUrl={currentLogoUrl}
              organisationName={organisationName}
              size="xl"
              fallback="initials"
            />
          </div>
        )}

        {/* Bouton pour ouvrir le modal */}
        <ButtonV2
          variant="outline"
          onClick={() => setModalOpen(true)}
          icon={Edit}
          className="w-full"
        >
          {currentLogoUrl ? 'Modifier le logo' : 'Ajouter un logo'}
        </ButtonV2>

        {/* Modal avec LogoUploadButton */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {currentLogoUrl ? 'Modifier le logo' : 'Ajouter un logo'}
              </DialogTitle>
              <DialogDescription>
                Gérer le logo de {organisationName}
              </DialogDescription>
            </DialogHeader>
            <LogoUploadButton
              organisationId={organisationId}
              organisationName={organisationName}
              currentLogoUrl={currentLogoUrl}
              onUploadSuccess={handleUploadSuccess}
              size="xl"
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
