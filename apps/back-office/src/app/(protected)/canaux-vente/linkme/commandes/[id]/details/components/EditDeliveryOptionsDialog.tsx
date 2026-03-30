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
  Separator,
  Switch,
  Textarea,
} from '@verone/ui';

import type { LinkMeOrderDetails } from '../../../../hooks/use-linkme-order-actions';
import type { OrderWithDetails } from './types';

interface EditDeliveryOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  order: OrderWithDetails;
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
  order,
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
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Modalités de livraison acceptées</Label>
              <p className="text-xs text-gray-500">
                Le client a accepté les conditions
              </p>
            </div>
            <Switch
              checked={editForm.delivery_terms_accepted ?? false}
              onCheckedChange={checked =>
                setEditForm(prev => ({
                  ...prev,
                  delivery_terms_accepted: checked,
                }))
              }
            />
          </div>
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
          {order.status === 'validated' && (
            <>
              <Separator />
              <p className="text-sm font-medium text-gray-700">
                Réception (post-approbation)
              </p>
              <div className="space-y-2">
                <Label>Nom du contact réception</Label>
                <Input
                  value={editForm.reception_contact_name ?? ''}
                  onChange={e =>
                    setEditForm(prev => ({
                      ...prev,
                      reception_contact_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email contact réception</Label>
                <Input
                  type="email"
                  value={editForm.reception_contact_email ?? ''}
                  onChange={e =>
                    setEditForm(prev => ({
                      ...prev,
                      reception_contact_email: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone contact réception</Label>
                <Input
                  value={editForm.reception_contact_phone ?? ''}
                  onChange={e =>
                    setEditForm(prev => ({
                      ...prev,
                      reception_contact_phone: e.target.value,
                    }))
                  }
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
            </>
          )}
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
