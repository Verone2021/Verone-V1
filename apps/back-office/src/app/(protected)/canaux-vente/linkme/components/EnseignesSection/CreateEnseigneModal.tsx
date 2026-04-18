'use client';

import { useState } from 'react';

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
  useCreateEnseigne,
  type CreateEnseigneInput,
} from '../../hooks/use-linkme-enseignes';

interface CreateEnseigneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEnseigneModal({
  open,
  onOpenChange,
}: CreateEnseigneModalProps) {
  const { toast } = useToast();
  const createEnseigne = useCreateEnseigne();

  const [formData, setFormData] = useState<CreateEnseigneInput>({
    name: '',
    description: '',
    logo_url: null,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      logo_url: null,
      is_active: true,
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erreur',
        description: "Le nom de l'enseigne est obligatoire",
        variant: 'destructive',
      });
      return;
    }

    try {
      await createEnseigne.mutateAsync(formData);
      toast({
        title: 'Succès',
        description: `Enseigne "${formData.name}" créée avec succès`,
      });
      onOpenChange(false);
      resetForm();
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Erreur lors de la création',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen md:h-auto max-w-full md:max-w-lg md:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle enseigne</DialogTitle>
          <DialogDescription>
            Créez une nouvelle enseigne pour votre réseau d'affiliation
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'enseigne *</Label>
            <Input
              id="name"
              placeholder="ex: POKAWA"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Active</Label>
              <p className="text-xs text-muted-foreground">
                L'enseigne sera visible et utilisable
              </p>
            </div>
            <Switch
              id="is_active"
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
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            className="w-full md:w-auto"
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            className="w-full md:w-auto"
            onClick={() => {
              void handleCreate().catch(error => {
                console.error(
                  '[CreateEnseigneModal] handleCreate failed:',
                  error
                );
              });
            }}
            loading={createEnseigne.isPending}
          >
            {createEnseigne.isPending ? 'Création...' : 'Créer'}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
