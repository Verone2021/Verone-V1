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
  Switch,
  Textarea,
} from '@verone/ui';

import type { LinkMeOrderDetails } from '../../../../hooks/use-linkme-order-actions';

interface EditDeliveryOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  editForm: Partial<LinkMeOrderDetails>;
  setEditForm: React.Dispatch<
    React.SetStateAction<Partial<LinkMeOrderDetails>>
  >;
  onSaveEdit: () => void;
  updateDetailsPending: boolean;
}

export function EditDeliveryOptionsDialog({
  open,
  onClose,
  editForm,
  setEditForm,
  onSaveEdit,
  updateDetailsPending,
}: EditDeliveryOptionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Options de livraison</DialogTitle>
          <DialogDescription>
            Modifiez les options et dates de livraison.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Date de livraison souhaitée</Label>
            <Input
              type="date"
              value={editForm.desired_delivery_date ?? ''}
              onChange={e =>
                setEditForm(prev => ({
                  ...prev,
                  desired_delivery_date: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Livraison en centre commercial</Label>
            </div>
            <Switch
              checked={editForm.is_mall_delivery ?? false}
              onCheckedChange={checked =>
                setEditForm(prev => ({ ...prev, is_mall_delivery: checked }))
              }
            />
          </div>
          {editForm.is_mall_delivery && (
            <div className="space-y-2">
              <Label>Email direction centre commercial</Label>
              <Input
                type="email"
                value={editForm.mall_email ?? ''}
                onChange={e =>
                  setEditForm(prev => ({ ...prev, mall_email: e.target.value }))
                }
              />
            </div>
          )}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Accès semi-remorque</Label>
            </div>
            <Switch
              checked={editForm.semi_trailer_accessible ?? false}
              onCheckedChange={checked =>
                setEditForm(prev => ({
                  ...prev,
                  semi_trailer_accessible: checked,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Notes de livraison</Label>
            <Textarea
              value={editForm.delivery_notes ?? ''}
              onChange={e =>
                setEditForm(prev => ({
                  ...prev,
                  delivery_notes: e.target.value,
                }))
              }
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Date de livraison confirmée</Label>
            <Input
              type="date"
              value={editForm.confirmed_delivery_date ?? ''}
              onChange={e =>
                setEditForm(prev => ({
                  ...prev,
                  confirmed_delivery_date: e.target.value,
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
