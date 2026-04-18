'use client';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';

import type { Affiliate, AffiliateType, FormData } from './types';

interface AffiliateEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAffiliate: Affiliate | null;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  saving: boolean;
  onUpdate: () => Promise<void>;
}

export function AffiliateEditModal({
  open,
  onOpenChange,
  selectedAffiliate,
  formData,
  setFormData,
  saving,
  onUpdate,
}: AffiliateEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen md:h-auto max-w-full md:max-w-lg md:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'affilié</DialogTitle>
          <DialogDescription>
            Modifiez les informations de {selectedAffiliate?.display_name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit_display_name">Nom affiché *</Label>
            <Input
              id="edit_display_name"
              value={formData.display_name}
              onChange={e =>
                setFormData({ ...formData, display_name: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit_slug">Slug URL *</Label>
            <Input
              id="edit_slug"
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit_type">Type *</Label>
            <Select
              value={formData.affiliate_type}
              onValueChange={(value: AffiliateType) =>
                setFormData({ ...formData, affiliate_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enseigne">Enseigne</SelectItem>
                <SelectItem value="client_professionnel">Client Pro</SelectItem>
                <SelectItem value="client_particulier">Particulier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit_bio">Bio / Description</Label>
            <Input
              id="edit_bio"
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
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
              void onUpdate().catch(error => {
                console.error('[Affiliates] Update failed:', error);
              });
            }}
            disabled={
              saving || !formData.display_name.trim() || !formData.slug.trim()
            }
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
