'use client';

import { useState } from 'react';

import type { Organisation } from '@verone/organisations/hooks';
import { ButtonV2 } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { colors, componentShadows, spacing } from '@verone/ui';
import { Briefcase, Building2, Truck } from 'lucide-react';

import { CustomerOrganisationFormModal } from './CustomerOrganisationFormModal';
import { PartnerFormModal } from './PartnerFormModal';
import { SupplierFormModal } from './SupplierFormModal';

type OrgTypeSelection = 'supplier' | 'customer' | 'partner';

interface GenericOrganisationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (organisation: Organisation) => void;
}

interface TypeCard {
  type: OrgTypeSelection;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const TYPE_CARDS: TypeCard[] = [
  {
    type: 'supplier',
    label: 'Fournisseur',
    description: 'Marque ou fabricant qui approvisionne des produits',
    icon: <Truck size={28} />,
  },
  {
    type: 'customer',
    label: 'Client professionnel',
    description: 'Concept store, revendeur ou acheteur professionnel',
    icon: <Building2 size={28} />,
  },
  {
    type: 'partner',
    label: 'Prestataire',
    description: 'Transporteur, photographe, agence ou autre partenaire',
    icon: <Briefcase size={28} />,
  },
];

export function GenericOrganisationFormModal({
  isOpen,
  onClose,
  onSuccess,
}: GenericOrganisationFormModalProps) {
  const [selectedType, setSelectedType] = useState<OrgTypeSelection | null>(
    null
  );

  const handleSelectType = (type: OrgTypeSelection) => {
    setSelectedType(type);
  };

  const handleTypedModalClose = () => {
    setSelectedType(null);
    onClose();
  };

  const handleSuccess = (organisation: Organisation) => {
    setSelectedType(null);
    onSuccess?.(organisation);
    onClose();
  };

  return (
    <>
      <Dialog
        open={isOpen && selectedType === null}
        onOpenChange={open => {
          if (!open) onClose();
        }}
      >
        <DialogContent
          style={{
            maxWidth: 520,
            boxShadow: componentShadows.modal,
          }}
        >
          <DialogHeader>
            <DialogTitle>Nouvelle organisation</DialogTitle>
          </DialogHeader>

          <p
            style={{
              color: colors.text.subtle,
              fontSize: 14,
              marginBottom: spacing[4],
            }}
          >
            Quel type d&apos;organisation souhaitez-vous créer ?
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing[3],
            }}
          >
            {TYPE_CARDS.map(card => (
              <button
                key={card.type}
                onClick={() => handleSelectType(card.type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[4],
                  padding: spacing[4],
                  borderRadius: 8,
                  border: `1px solid ${colors.border.DEFAULT}`,
                  background: colors.background.DEFAULT,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    colors.border.strong;
                  (e.currentTarget as HTMLButtonElement).style.background =
                    colors.background.hover;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    colors.border.DEFAULT;
                  (e.currentTarget as HTMLButtonElement).style.background =
                    colors.background.DEFAULT;
                }}
              >
                <span
                  style={{
                    color: colors.text.subtle,
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </span>
                <span>
                  <span
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      fontSize: 15,
                      color: colors.text.DEFAULT,
                    }}
                  >
                    {card.label}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 13,
                      color: colors.text.subtle,
                      marginTop: 2,
                    }}
                  >
                    {card.description}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: spacing[4],
            }}
          >
            <ButtonV2 variant="ghost" onClick={onClose}>
              Annuler
            </ButtonV2>
          </div>
        </DialogContent>
      </Dialog>

      {selectedType === 'supplier' && (
        <SupplierFormModal
          isOpen
          onClose={handleTypedModalClose}
          onSuccess={handleSuccess}
        />
      )}

      {selectedType === 'customer' && (
        <CustomerOrganisationFormModal
          isOpen
          onClose={handleTypedModalClose}
          onSuccess={handleSuccess}
        />
      )}

      {selectedType === 'partner' && (
        <PartnerFormModal
          isOpen
          onClose={handleTypedModalClose}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
