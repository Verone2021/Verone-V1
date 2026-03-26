'use client';

/**
 * CreateOrganisationModal
 *
 * Modal for creating a new organisation linked to the user's enseigne.
 * Available to enseigne_admin and enseigne_collaborateur roles.
 *
 * Required DB fields: legal_name (min 2 chars), enseigne_id
 * Optional: trade_name, ownership_type (succursale|franchise),
 *           shipping address, siret (14 digits)
 *
 * @module CreateOrganisationModal
 * @since 2026-03-26
 */

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AddressAutocomplete,
  type AddressResult,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface CreateOrganisationModalProps {
  enseigneId: string;
  enseigneName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type OwnershipType = 'succursale' | 'franchise';

interface FormState {
  legalName: string;
  tradeName: string;
  ownershipType: OwnershipType | null;
  siret: string;
  shippingAddress: AddressResult | null;
}

const INITIAL_FORM: FormState = {
  legalName: '',
  tradeName: '',
  ownershipType: null,
  siret: '',
  shippingAddress: null,
};

// ============================================
// COMPONENT
// ============================================

export function CreateOrganisationModal({
  enseigneId,
  enseigneName,
  isOpen,
  onClose,
  onSuccess,
}: CreateOrganisationModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [siretError, setSiretError] = useState<string | null>(null);

  // Validation
  const isLegalNameValid = form.legalName.trim().length >= 2;
  const isSiretValid =
    form.siret === '' || /^\d{14}$/.test(form.siret.replace(/\s/g, ''));
  const canSubmit = isLegalNameValid && isSiretValid;

  // Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const addr = form.shippingAddress;

      const { data, error } = await supabase
        .from('organisations')
        .insert({
          legal_name: form.legalName.trim(),
          enseigne_id: enseigneId,
          type: 'customer' as const,
          source: 'manual' as const,
          source_type: 'linkme' as const,
          approval_status: 'approved' as const,
          country: 'FR',
          trade_name: form.tradeName.trim() || null,
          has_different_trade_name: form.tradeName.trim()
            ? form.tradeName.trim() !== form.legalName.trim()
            : false,
          ownership_type: form.ownershipType,
          siret: form.siret.replace(/\s/g, '') || null,
          shipping_address_line1: addr?.streetAddress ?? null,
          shipping_city: addr?.city ?? null,
          shipping_postal_code: addr?.postalCode ?? null,
          shipping_country: addr?.countryCode ?? 'FR',
          billing_address_line1: addr?.streetAddress ?? null,
          billing_city: addr?.city ?? null,
          billing_postal_code: addr?.postalCode ?? null,
          billing_country: addr?.countryCode ?? 'FR',
          latitude: addr?.latitude ?? null,
          longitude: addr?.longitude ?? null,
        })
        .select('id, legal_name')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async data => {
      await queryClient.invalidateQueries({
        queryKey: ['enseigne-organisations'],
      });
      toast.success(`Organisation "${data.legal_name}" creee avec succes`);
      onSuccess?.();
      handleClose();
    },
    onError: (error: Error) => {
      console.error('[CreateOrganisationModal] Insert failed:', error);
      if (error.message.includes('siret')) {
        toast.error('SIRET invalide (14 chiffres requis)');
      } else if (error.message.includes('org_name_length')) {
        toast.error('Le nom doit contenir au moins 2 caracteres');
      } else {
        toast.error("Erreur lors de la creation de l'organisation");
      }
    },
  });

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setSiretError(null);
    onClose();
  };

  const handleSiretChange = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    setForm(prev => ({ ...prev, siret: value }));

    if (cleaned === '') {
      setSiretError(null);
    } else if (!/^\d*$/.test(cleaned)) {
      setSiretError('Le SIRET ne doit contenir que des chiffres');
    } else if (cleaned.length > 0 && cleaned.length !== 14) {
      setSiretError('Le SIRET doit contenir 14 chiffres');
    } else {
      setSiretError(null);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit || createMutation.isPending) return;
    createMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-[#5DBEBB]/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-[#5DBEBB]" />
            </div>
            <div>
              <DialogTitle>Nouvelle organisation</DialogTitle>
              <DialogDescription className="text-sm">
                {enseigneName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Legal name (required) */}
          <div className="space-y-1.5">
            <Label htmlFor="legal-name">
              Raison sociale <span className="text-red-500">*</span>
            </Label>
            <Input
              id="legal-name"
              placeholder="Ex: SAS Mon Restaurant"
              value={form.legalName}
              onChange={e =>
                setForm(prev => ({ ...prev, legalName: e.target.value }))
              }
              className={
                form.legalName.length > 0 && !isLegalNameValid
                  ? 'border-red-300 focus:ring-red-500'
                  : ''
              }
            />
            {form.legalName.length > 0 && !isLegalNameValid && (
              <p className="text-xs text-red-500">Minimum 2 caracteres</p>
            )}
          </div>

          {/* Trade name (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="trade-name">Nom commercial</Label>
            <Input
              id="trade-name"
              placeholder="Ex: Pokawa Toulouse"
              value={form.tradeName}
              onChange={e =>
                setForm(prev => ({ ...prev, tradeName: e.target.value }))
              }
            />
          </div>

          {/* Ownership type */}
          <div className="space-y-1.5">
            <Label>Type de restaurant</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setForm(prev => ({ ...prev, ownershipType: 'succursale' }))
                }
                className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border-2 transition-colors ${
                  form.ownershipType === 'succursale'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Restaurant propre
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm(prev => ({ ...prev, ownershipType: 'franchise' }))
                }
                className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border-2 transition-colors ${
                  form.ownershipType === 'franchise'
                    ? 'bg-amber-50 border-amber-500 text-amber-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Franchise
              </button>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label>Adresse</Label>
            <AddressAutocomplete
              onSelect={address =>
                setForm(prev => ({ ...prev, shippingAddress: address }))
              }
              placeholder="Rechercher une adresse..."
            />
          </div>

          {/* SIRET (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="siret">SIRET (optionnel)</Label>
            <Input
              id="siret"
              placeholder="Ex: 12345678901234"
              value={form.siret}
              onChange={e => handleSiretChange(e.target.value)}
              maxLength={17}
              className={siretError ? 'border-red-300 focus:ring-red-500' : ''}
            />
            {siretError && <p className="text-xs text-red-500">{siretError}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createMutation.isPending}
            className="bg-linkme-turquoise hover:bg-linkme-turquoise/90"
          >
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Creer l&apos;organisation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
