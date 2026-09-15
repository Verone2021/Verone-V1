'use client';

import { useState } from 'react';

import { UserPlus, Save } from 'lucide-react';

import { Card, CardContent, Button, Input, Label } from '@verone/ui';
import { toast } from 'sonner';

import { useUpdateAffiliateCommission } from '../hooks/use-linkme-catalog';

interface Props {
  productId: string;
  affiliateCommissionRate: number | null;
}

/**
 * Carte de gestion de la commission Vérone pour les produits créés par un affilié.
 * Extraite de canaux-vente/linkme/catalogue/[id]/page.tsx (BO-PRODUCTS-PROFIT-001).
 */
export function AffiliateCommissionCard({
  productId,
  affiliateCommissionRate,
}: Props): React.JSX.Element {
  const [editedCommission, setEditedCommission] = useState<number | null>(null);
  const updateAffiliateCommission = useUpdateAffiliateCommission();

  const currentCommission = editedCommission ?? affiliateCommissionRate ?? 0;

  const handleSave = async (): Promise<void> => {
    if (editedCommission === null) return;
    try {
      await updateAffiliateCommission.mutateAsync({
        productId,
        commissionRate: editedCommission,
      });
      toast.success('Commission affilié mise à jour');
      setEditedCommission(null);
    } catch {
      toast.error('Erreur lors de la mise à jour de la commission');
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-violet-600" />
          <h3 className="font-semibold text-lg">Commission Vérone</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium text-gray-700">
              Taux (%)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={currentCommission}
                onChange={e => setEditedCommission(Number(e.target.value))}
                min={0}
                max={100}
                step={0.5}
                className="w-24 h-11 md:h-9"
              />
              {editedCommission !== null &&
                editedCommission !== affiliateCommissionRate && (
                  <Button
                    size="sm"
                    onClick={(): void => void handleSave()}
                    disabled={updateAffiliateCommission.isPending}
                    className="h-11 md:h-9"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Enregistrer
                  </Button>
                )}
            </div>
          </div>

          {/* Simulateur */}
          <div className="text-sm text-gray-600 bg-gray-50 rounded p-3">
            <p className="font-medium mb-2">Simulation pour 1 000 € HT :</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500">Commission Vérone :</span>
                <span className="font-semibold text-violet-600 ml-2">
                  {((1000 * currentCommission) / 100).toFixed(2)} €
                </span>
              </div>
              <div>
                <span className="text-gray-500">Payout Affilié :</span>
                <span className="font-semibold text-green-600 ml-2">
                  {(1000 * (1 - currentCommission / 100)).toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
