'use client';

import { ButtonUnified } from '@verone/ui';
import { colors, spacing } from '@verone/ui/design-system';

type Props = {
  onConvertToOrder: () => Promise<void>;
  onConvertToConsultation: () => Promise<void>;
  onConvertToSourcing: () => Promise<void>;
  onConvertToContact: () => Promise<void>;
  onMarkAsResolved: () => Promise<void>;
};

export function ActionsCard({
  onConvertToOrder,
  onConvertToConsultation,
  onConvertToSourcing,
  onConvertToContact,
  onMarkAsResolved,
}: Props) {
  return (
    <div
      className="border rounded-lg"
      style={{
        borderColor: colors.neutral[200],
        padding: spacing[4],
      }}
    >
      <h3
        className="text-sm font-semibold mb-3"
        style={{ color: colors.text.DEFAULT }}
      >
        Actions rapides
      </h3>

      <div className="space-y-2">
        <ButtonUnified
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => {
            void onConvertToOrder().catch(error => {
              console.error('[ActionsCard] Convert to order failed:', error);
            });
          }}
        >
          Convertir en commande
        </ButtonUnified>

        <ButtonUnified
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => {
            void onConvertToConsultation().catch(error => {
              console.error(
                '[ActionsCard] Convert to consultation failed:',
                error
              );
            });
          }}
        >
          Créer une consultation
        </ButtonUnified>

        <ButtonUnified
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => {
            void onConvertToSourcing().catch(error => {
              console.error('[ActionsCard] Convert to sourcing failed:', error);
            });
          }}
        >
          Créer un sourcing
        </ButtonUnified>

        <ButtonUnified
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => {
            void onConvertToContact().catch(error => {
              console.error('[ActionsCard] Convert to contact failed:', error);
            });
          }}
        >
          Créer un contact CRM
        </ButtonUnified>

        <div
          className="pt-2 border-t"
          style={{ borderColor: colors.neutral[200] }}
        >
          <ButtonUnified
            variant="default"
            size="sm"
            className="w-full"
            onClick={() => {
              void onMarkAsResolved().catch(error => {
                console.error('[ActionsCard] Mark as resolved failed:', error);
              });
            }}
          >
            ✓ Marquer comme résolu
          </ButtonUnified>
        </div>
      </div>
    </div>
  );
}
