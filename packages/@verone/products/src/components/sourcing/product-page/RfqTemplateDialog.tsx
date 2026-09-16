'use client';

import { useState } from 'react';

import { ButtonV2 } from '@verone/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui/components/ui/dialog';
import { Input } from '@verone/ui/components/ui/input';
import { Label } from '@verone/ui/components/ui/label';
import { Check, Copy } from 'lucide-react';

import type { NewSourcingJournalEntry } from '../../../hooks/sourcing/use-sourcing-notebook';

export type RfqMode = 'request' | 'counter_offer';

export interface RfqTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: RfqMode;
  productName: string;
  supplierReference: string | null;
  targetPrice: number | null;
  /** Quantité annoncée dans la demande. */
  defaultQuantity: number | null;
  supplierId: string | null;
  saving?: boolean;
  /** Journalise l'envoi comme échange sortant. */
  onLogExchange: (entry: NewSourcingJournalEntry) => Promise<void>;
}

function buildMessage(params: {
  mode: RfqMode;
  productName: string;
  supplierReference: string | null;
  quantity: string;
  targetPrice: string;
  leadDays: string;
  incoterm: string;
}): string {
  const {
    mode,
    productName,
    supplierReference,
    quantity,
    targetPrice,
    leadDays,
    incoterm,
  } = params;
  const reference =
    supplierReference !== null && supplierReference !== ''
      ? ` (votre référence ${supplierReference})`
      : '';

  if (mode === 'counter_offer') {
    return [
      `Bonjour,`,
      ``,
      `Merci pour votre offre sur « ${productName} »${reference}.`,
      targetPrice !== ''
        ? `Pour que ce produit entre dans notre gamme, nous devons atteindre ${targetPrice} € HT par pièce en ${incoterm}.`
        : `Nous devons encore ajuster le prix pour que ce produit entre dans notre gamme.`,
      quantity !== ''
        ? `Nous envisageons ${quantity} pièces sur la première commande, avec des réassorts réguliers ensuite.`
        : `Des réassorts réguliers sont prévus après la première commande.`,
      ``,
      `Pouvez-vous nous confirmer :`,
      `- le meilleur prix unitaire HT pour cette quantité,`,
      `- le coût du transport et, le cas échéant, les droits de douane,`,
      `- le délai de production et d'expédition.`,
      ``,
      `Merci d'avance,`,
    ].join('\n');
  }

  return [
    `Bonjour,`,
    ``,
    `Nous souhaitons référencer le produit suivant : « ${productName} »${reference}.`,
    ``,
    `Pourriez-vous nous communiquer :`,
    `- le prix unitaire HT${quantity !== '' ? ` pour ${quantity} pièces` : ''},`,
    `- la quantité minimale de commande,`,
    `- le coût du transport${incoterm !== '' ? ` en ${incoterm}` : ''} et les droits de douane éventuels,`,
    leadDays !== ''
      ? `- le délai de production et d'expédition (nous visons ${leadDays} jours),`
      : `- le délai de production et d'expédition,`,
    `- les certifications et les matériaux utilisés,`,
    `- la possibilité de recevoir un échantillon et son coût.`,
    targetPrice !== ''
      ? `\nNotre prix cible est de ${targetPrice} € HT par pièce.`
      : '',
    ``,
    `Merci d'avance,`,
  ]
    .filter(line => line !== '')
    .join('\n');
}

/**
 * Demande de prix pré-remplie — [BO-SOURCING-ETAPES-003]
 *
 * L'étape Contact n'offrait aucun outil : chacun réécrivait sa demande de prix,
 * en oubliant une fois le transport, une fois la quantité minimale. Le message
 * se copie vers Alibaba, WeChat ou un e-mail, et l'envoi est journalisé comme
 * échange sortant pour que la relance soit suivie.
 */
export function RfqTemplateDialog({
  open,
  onOpenChange,
  mode,
  productName,
  supplierReference,
  targetPrice,
  defaultQuantity,
  supplierId,
  saving = false,
  onLogExchange,
}: RfqTemplateDialogProps) {
  const [quantity, setQuantity] = useState(
    defaultQuantity != null ? String(defaultQuantity) : ''
  );
  const [price, setPrice] = useState(
    targetPrice != null ? String(targetPrice) : ''
  );
  const [leadDays, setLeadDays] = useState('30');
  const [incoterm, setIncoterm] = useState('FOB');
  const [copied, setCopied] = useState(false);

  const message = buildMessage({
    mode,
    productName,
    supplierReference,
    quantity: quantity.trim(),
    targetPrice: price.trim(),
    leadDays: leadDays.trim(),
    incoterm: incoterm.trim(),
  });

  const handleCopy = () => {
    void navigator.clipboard
      .writeText(message)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      })
      .catch((error: unknown) => {
        console.error('[RfqTemplateDialog] copie impossible:', error);
      });
  };

  const handleLog = () => {
    void onLogExchange({
      entry_type: 'exchange',
      channel: 'email',
      direction: 'outbound',
      summary:
        mode === 'counter_offer'
          ? `Contre-proposition envoyée${price.trim() !== '' ? ` à ${price.trim()} € HT` : ''}`
          : `Demande de prix envoyée${quantity.trim() !== '' ? ` pour ${quantity.trim()} pièces` : ''}`,
      next_action: 'Relancer si pas de réponse',
      ...(supplierId !== null ? { supplier_id: supplierId } : {}),
    })
      .then(() => onOpenChange(false))
      .catch((error: unknown) => {
        console.error('[RfqTemplateDialog] journalisation échouée:', error);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen md:h-auto md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'counter_offer'
              ? 'Contre-proposition'
              : 'Demande de prix'}
          </DialogTitle>
          <DialogDescription>
            Ajustez les valeurs, copiez le message, puis enregistrez l’envoi
            pour qu’une relance soit suivie.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto md:max-h-[55vh]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="rfq_qty" className="text-xs text-gray-600">
                Quantité
              </Label>
              <Input
                id="rfq_qty"
                type="number"
                min="1"
                className="mt-1 w-full"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="100"
              />
            </div>
            <div>
              <Label htmlFor="rfq_price" className="text-xs text-gray-600">
                Prix cible (€)
              </Label>
              <Input
                id="rfq_price"
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="12.50"
              />
            </div>
            <div>
              <Label htmlFor="rfq_lead" className="text-xs text-gray-600">
                Délai visé (j)
              </Label>
              <Input
                id="rfq_lead"
                type="number"
                min="0"
                className="mt-1 w-full"
                value={leadDays}
                onChange={e => setLeadDays(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rfq_incoterm" className="text-xs text-gray-600">
                Incoterm
              </Label>
              <Input
                id="rfq_incoterm"
                className="mt-1 w-full"
                value={incoterm}
                onChange={e => setIncoterm(e.target.value)}
                placeholder="FOB"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-600">Message</Label>
            <pre className="mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 font-sans text-sm text-black">
              {message}
            </pre>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 md:flex-row">
          <ButtonV2
            variant="outline"
            icon={copied ? Check : Copy}
            onClick={handleCopy}
            className="w-full md:w-auto"
          >
            {copied ? 'Copié' : 'Copier le message'}
          </ButtonV2>
          <ButtonV2
            variant="primary"
            onClick={handleLog}
            disabled={saving}
            className="w-full md:w-auto"
          >
            Enregistrer l’envoi
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
