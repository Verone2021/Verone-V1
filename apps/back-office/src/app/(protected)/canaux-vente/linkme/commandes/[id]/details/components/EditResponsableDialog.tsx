'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';

import type { LinkMeOrderDetails } from '../../../../hooks/use-linkme-order-actions';

interface EditResponsableDialogProps {
  open: boolean;
  onClose: () => void;
  editForm: Partial<LinkMeOrderDetails>;
  setEditForm: React.Dispatch<
    React.SetStateAction<Partial<LinkMeOrderDetails>>
  >;
  onSaveEdit: () => void;
  updateDetailsPending: boolean;
}

export function EditResponsableDialog({
  open,
  onClose,
  editForm,
  setEditForm,
  onSaveEdit,
  updateDetailsPending,
}: EditResponsableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier le Responsable</DialogTitle>
          <DialogDescription>
            Modifiez les informations du contact responsable.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Type de demandeur *</Label>
            <Select
              value={editForm.requester_type ?? ''}
              onValueChange={v =>
                setEditForm(prev => ({ ...prev, requester_type: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="responsable_enseigne">
                  Responsable Enseigne
                </SelectItem>
                <SelectItem value="architecte">Architecte</SelectItem>
                <SelectItem value="franchisee">Franchisé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nom complet *</Label>
            <Input
              value={editForm.requester_name ?? ''}
              onChange={e =>
                setEditForm(prev => ({
                  ...prev,
                  requester_name: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={editForm.requester_email ?? ''}
              onChange={e =>
                setEditForm(prev => ({
                  ...prev,
                  requester_email: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input
              value={editForm.requester_phone ?? ''}
              onChange={e =>
                setEditForm(prev => ({
                  ...prev,
                  requester_phone: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Poste / Fonction</Label>
            <Input
              value={editForm.requester_position ?? ''}
              onChange={e =>
                setEditForm(prev => ({
                  ...prev,
                  requester_position: e.target.value,
                }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onSaveEdit} disabled={updateDetailsPending}>
            {updateDetailsPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
