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
  Separator,
  Switch,
  Textarea,
  AddressAutocomplete,
  type AddressResult,
} from '@verone/ui';
import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';
import { RestaurantAddressButton } from './RestaurantAddressButton';
import type { OrderWithDetails } from './types';

interface FooterActionsProps {
  isPending: boolean;
  onClose: () => void;
  onSave: () => void;
}

function FooterActions({ isPending, onClose, onSave }: FooterActionsProps) {
  return (
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>
        Annuler
      </Button>
      <Button onClick={onSave} disabled={isPending}>
        {isPending ? 'Enregistrement...' : 'Enregistrer'}
      </Button>
    </DialogFooter>
  );
}

interface EditDialogsProps {
  editingStep:
    | 'responsable'
    | 'billing'
    | 'delivery_address'
    | 'delivery_options'
    | null;
  editForm: Partial<LinkMeOrderDetails>;
  setEditForm: React.Dispatch<
    React.SetStateAction<Partial<LinkMeOrderDetails>>
  >;
  organisation: OrderWithDetails['organisation'];
  orderStatus: string;
  updateDetailsIsPending: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function EditDialogs({
  editingStep,
  editForm,
  setEditForm,
  organisation: org,
  orderStatus,
  updateDetailsIsPending,
  onClose,
  onSave,
}: EditDialogsProps) {
  const handleSave = () => {
    void Promise.resolve(onSave()).catch(error => {
      console.error('[EditDialogs] Save edit failed:', error);
    });
  };

  return (
    <>
      {/* Dialog: Edit Responsable */}
      <Dialog
        open={editingStep === 'responsable'}
        onOpenChange={() => onClose()}
      >
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
                  <SelectValue placeholder="Selectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="responsable_enseigne">
                    Responsable Enseigne
                  </SelectItem>
                  <SelectItem value="architecte">Architecte</SelectItem>
                  <SelectItem value="franchisee">Franchise</SelectItem>
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
              <Label>Telephone</Label>
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
          <FooterActions
            isPending={updateDetailsIsPending}
            onClose={onClose}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Billing */}
      <Dialog open={editingStep === 'billing'} onOpenChange={() => onClose()}>
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
                  setEditForm(prev => ({
                    ...prev,
                    billing_contact_source: v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="step1">
                    Identique au responsable
                  </SelectItem>
                  <SelectItem value="step2">
                    Identique au proprietaire
                  </SelectItem>
                  <SelectItem value="custom">Contact personnalise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nom contact facturation</Label>
              <Input
                value={editForm.billing_name ?? ''}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    billing_name: e.target.value,
                  }))
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
              <Label>Telephone facturation</Label>
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
          <FooterActions
            isPending={updateDetailsIsPending}
            onClose={onClose}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Delivery Address */}
      <Dialog
        open={editingStep === 'delivery_address'}
        onOpenChange={() => onClose()}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;adresse de livraison</DialogTitle>
            <DialogDescription>
              Modifiez l&apos;adresse ou selectionnez celle du restaurant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RestaurantAddressButton org={org} setEditForm={setEditForm} />
            <div className="space-y-2">
              <Label>Adresse</Label>
              <AddressAutocomplete
                value={editForm.delivery_address ?? ''}
                onChange={v =>
                  setEditForm(prev => ({
                    ...prev,
                    delivery_address: v,
                  }))
                }
                onSelect={(address: AddressResult) => {
                  setEditForm(prev => ({
                    ...prev,
                    delivery_address: address.streetAddress,
                    delivery_postal_code: address.postalCode,
                    delivery_city: address.city,
                  }));
                }}
                placeholder="Rechercher une adresse..."
                id="edit-delivery-address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input
                  value={editForm.delivery_postal_code ?? ''}
                  onChange={e =>
                    setEditForm(prev => ({
                      ...prev,
                      delivery_postal_code: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input
                  value={editForm.delivery_city ?? ''}
                  onChange={e =>
                    setEditForm(prev => ({
                      ...prev,
                      delivery_city: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <FooterActions
            isPending={updateDetailsIsPending}
            onClose={onClose}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Delivery Options */}
      <Dialog
        open={editingStep === 'delivery_options'}
        onOpenChange={() => onClose()}
      >
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
                <Label>Modalites de livraison acceptees</Label>
                <p className="text-xs text-gray-500">
                  Le client a accepte les conditions
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
              <Label>Date de livraison souhaitee</Label>
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
                  setEditForm(prev => ({
                    ...prev,
                    is_mall_delivery: checked,
                  }))
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
                    setEditForm(prev => ({
                      ...prev,
                      mall_email: e.target.value,
                    }))
                  }
                />
              </div>
            )}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Acces semi-remorque</Label>
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
            {/* Post-approval fields */}
            {orderStatus === 'validated' && (
              <>
                <Separator />
                <p className="text-sm font-medium text-gray-700">
                  Reception (post-approbation)
                </p>
                <div className="space-y-2">
                  <Label>Nom du contact reception</Label>
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
                  <Label>Email contact reception</Label>
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
                  <Label>Telephone contact reception</Label>
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
                  <Label>Date de livraison confirmee</Label>
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
          <FooterActions
            isPending={updateDetailsIsPending}
            onClose={onClose}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
