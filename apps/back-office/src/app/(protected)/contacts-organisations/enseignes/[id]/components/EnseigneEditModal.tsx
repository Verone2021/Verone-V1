'use client';

import type { RefObject } from 'react';

import {
  EnseigneLogoUploadButton,
  type EnseigneLogoUploadRef,
} from '@verone/organisations';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Switch } from '@verone/ui';
import { Loader2 } from 'lucide-react';

interface FormData {
  name: string;
  description: string;
  logo_url: string;
  is_active: boolean;
  payment_delay_days: number;
}

interface EnseigneForModal {
  id: string;
  name: string;
  logo_url?: string | null;
}

interface EnseigneEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enseigne: EnseigneForModal;
  formData: FormData;
  setFormData: (updater: (prev: FormData) => FormData) => void;
  isSubmitting: boolean;
  logoUploadRef: RefObject<EnseigneLogoUploadRef>;
  handleRefresh: () => void;
  handleSubmitEdit: () => void;
}

export function EnseigneEditModal({
  open,
  onOpenChange,
  enseigne,
  formData,
  setFormData,
  isSubmitting,
  logoUploadRef,
  handleRefresh,
  handleSubmitEdit,
}: EnseigneEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier l'enseigne</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l'enseigne
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              placeholder="Ex: Pokawa, Black and White..."
            />
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            {enseigne && (
              <EnseigneLogoUploadButton
                ref={logoUploadRef}
                enseigneId={enseigne.id}
                enseigneName={enseigne.name}
                currentLogoUrl={enseigne.logo_url}
                onUploadSuccess={() => {
                  handleRefresh();
                }}
                size="md"
              />
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Enseigne active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={checked =>
                setFormData(prev => ({ ...prev, is_active: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_delay_days">
              Delai de paiement (jours)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="payment_delay_days"
                type="number"
                min={0}
                max={180}
                value={formData.payment_delay_days}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    payment_delay_days: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="w-24"
              />
              <span className="text-xs text-gray-500">
                {formData.payment_delay_days === 0
                  ? 'Prepaiement'
                  : `NET ${formData.payment_delay_days} — propage aux succursales`}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <ButtonV2 variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </ButtonV2>
          <ButtonV2
            onClick={handleSubmitEdit}
            disabled={!formData.name.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
