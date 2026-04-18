'use client';

import { useState, useEffect } from 'react';

import { useToast } from '@verone/common';
import { ButtonV2, Input, Label, Switch } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';

import {
  useUpdateEnseigne,
  type EnseigneWithStats,
  type CreateEnseigneInput,
} from '../../hooks/use-linkme-enseignes';

interface EditEnseigneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enseigne: EnseigneWithStats | null;
}

export function EditEnseigneModal({
  open,
  onOpenChange,
  enseigne,
}: EditEnseigneModalProps) {
  const { toast } = useToast();
  const updateEnseigne = useUpdateEnseigne();

  const [formData, setFormData] = useState<CreateEnseigneInput>({
    name: '',
    description: '',
    logo_url: null,
    is_active: true,
  });

  useEffect(() => {
    if (enseigne) {
      setFormData({
        name: enseigne.name,
        description: enseigne.description ?? '',
        logo_url: enseigne.logo_url,
        is_active: enseigne.is_active,
      });
    }
  }, [enseigne]);

  const handleUpdate = async () => {
    if (!enseigne || !formData.name.trim()) return;

    try {
      await updateEnseigne.mutateAsync({
        enseigneId: enseigne.id,
        input: formData,
      });
      toast({
        title: 'Succès',
        description: `Enseigne "${formData.name}" mise à jour`,
      });
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la mise à jour',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen md:h-auto max-w-full md:max-w-lg md:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'enseigne</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l'enseigne
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nom de l'enseigne *</Label>
            <Input
              id="edit-name"
              placeholder="ex: POKAWA"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="edit-is_active">Active</Label>
              <p className="text-xs text-muted-foreground">
                L'enseigne sera visible et utilisable
              </p>
            </div>
            <Switch
              id="edit-is_active"
              checked={formData.is_active}
              onCheckedChange={checked =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 md:flex-row">
          <ButtonV2
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full md:w-auto"
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            className="w-full md:w-auto"
            onClick={() => {
              void handleUpdate().catch(error => {
                console.error(
                  '[EditEnseigneModal] handleUpdate failed:',
                  error
                );
              });
            }}
            loading={updateEnseigne.isPending}
          >
            {updateEnseigne.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
