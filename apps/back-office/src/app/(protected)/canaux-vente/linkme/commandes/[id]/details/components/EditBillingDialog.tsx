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

interface EditBillingDialogProps {
  open: boolean;
  onClose: () => void;
  editForm: Partial<LinkMeOrderDetails>;
  setEditForm: React.Dispatch<
    React.SetStateAction<Partial<LinkMeOrderDetails>>
  >;
  onSaveEdit: () => void;
  updateDetailsPending: boolean;
}

export function EditBillingDialog({
  open,
  onClose,
  editForm,
  setEditForm,
  onSaveEdit,
  updateDetailsPending,
}: EditBillingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier la Facturation</DialogTitle>
          <DialogDescription>
            Modifiez les informations de facturation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Source du contact facturation</Label>
            <Select
              value={editForm.billing_contact_source ?? ''}
              onValueChange={v =>
                setEditForm(prev => ({ ...prev, billing_contact_source: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="step1">Identique au responsable</SelectItem>
                <SelectItem value="step2">Identique au propriétaire</SelectItem>
                <SelectItem value="custom">Contact personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nom contact facturation</Label>
            <Input
              value={editForm.billing_name ?? ''}
              onChange={e =>
                setEditForm(prev => ({ ...prev, billing_name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Email facturation</Label>
            <Input
              type="email"
              value={editForm.billing_email ?? ''}
              onChange={e =>
                setEditForm(prev => ({
                  ...prev,
                  billing_email: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Téléphone facturation</Label>
            <Input
              value={editForm.billing_phone ?? ''}
              onChange={e =>
                setEditForm(prev => ({
                  ...prev,
                  billing_phone: e.target.value,
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
