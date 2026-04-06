'use client';

import { type MutableRefObject } from 'react';

import {
  EnseigneLogoUploadButton,
  type EnseigneLogoUploadRef,
  type Enseigne,
} from '@verone/organisations';
import { ButtonV2, Input, Label, Switch } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';

import { type FormData } from '../hooks/useEnseignesPage';

interface EnseigneCreateEditModalProps {
  open: boolean;
  editingEnseigne: Enseigne | null;
  formData: FormData;
  setFormData: (updater: (prev: FormData) => FormData) => void;
  isSubmitting: boolean;
  logoUploadRef: MutableRefObject<EnseigneLogoUploadRef | null>;
  onClose: () => void;
  onSubmit: () => void;
  onRefetch: () => void;
}

export function EnseigneCreateEditModal({
  open,
  editingEnseigne,
  formData,
  setFormData,
  isSubmitting,
  logoUploadRef,
  onClose,
  onSubmit,
  onRefetch,
}: EnseigneCreateEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingEnseigne ? "Modifier l'enseigne" : 'Nouvelle enseigne'}
          </DialogTitle>
          <DialogDescription>
            {editingEnseigne
              ? "Modifiez les informations de l'enseigne"
              : 'Créez une nouvelle enseigne pour regrouper vos clients franchisés'}
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

          {/* Logo Upload - uniquement en mode édition */}
          {editingEnseigne ? (
            <div className="space-y-2">
              <Label>Logo</Label>
              <EnseigneLogoUploadButton
                ref={logoUploadRef}
                enseigneId={editingEnseigne.id}
                enseigneName={editingEnseigne.name}
                currentLogoUrl={editingEnseigne.logo_url}
                onUploadSuccess={() => {
                  void Promise.resolve(onRefetch()).catch(error => {
                    console.error(
                      '[Enseignes] Refetch after upload failed:',
                      error
                    );
                  });
                }}
                size="md"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Logo</Label>
              <p className="text-sm text-muted-foreground">
                Le logo pourra être ajouté après la création de l'enseigne.
              </p>
            </div>
          )}

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
                  ? 'Prepaiement (franchise)'
                  : `NET ${formData.payment_delay_days} — propage aux succursales`}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <ButtonV2 variant="ghost" onClick={onClose}>
            Annuler
          </ButtonV2>
          <ButtonV2
            variant="primary"
            onClick={() => {
              void Promise.resolve(onSubmit()).catch(error => {
                console.error('[Enseignes] Submit failed:', error);
              });
            }}
            loading={isSubmitting}
            disabled={!formData.name.trim()}
          >
            {editingEnseigne ? 'Enregistrer' : 'Créer'}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
