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
import { Briefcase, Building2, Store, User } from 'lucide-react';

import { EntityPicker } from './EntityPicker';
import type { AffiliateType, Enseigne, FormData, Organisation } from './types';

interface AffiliateCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  saving: boolean;
  entitySearch: string;
  setEntitySearch: (value: string) => void;
  filteredEntities: (Organisation | Enseigne)[];
  availableOrganisations: Organisation[];
  availableEnseignes: Enseigne[];
  onEntitySelect: (entityId: string) => void;
  onCreate: () => Promise<void>;
  onCancel: () => void;
}

export function AffiliateCreateModal({
  open,
  onOpenChange,
  formData,
  setFormData,
  saving,
  entitySearch,
  setEntitySearch,
  filteredEntities,
  availableOrganisations,
  availableEnseignes,
  onEntitySelect,
  onCreate,
  onCancel,
}: AffiliateCreateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nouvel Affilié</DialogTitle>
          <DialogDescription>
            Sélectionnez une organisation ou une enseigne existante pour créer
            un affilié LinkMe
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Sélection du type d'entité */}
          <div className="grid gap-2">
            <Label>Type d'entité *</Label>
            <div className="flex gap-2">
              <ButtonV2
                type="button"
                variant={
                  formData.entity_type === 'organisation'
                    ? 'default'
                    : 'outline'
                }
                className="flex-1"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    entity_type: 'organisation',
                    entity_id: '',
                    display_name: '',
                    slug: '',
                    affiliate_type: 'client_professionnel',
                  }));
                  setEntitySearch('');
                }}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Organisation
              </ButtonV2>
              <ButtonV2
                type="button"
                variant={
                  formData.entity_type === 'enseigne' ? 'default' : 'outline'
                }
                className="flex-1"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    entity_type: 'enseigne',
                    entity_id: '',
                    display_name: '',
                    slug: '',
                    affiliate_type: 'enseigne',
                  }));
                  setEntitySearch('');
                }}
              >
                <Store className="h-4 w-4 mr-2" />
                Enseigne
              </ButtonV2>
            </div>
          </div>

          {/* Recherche et sélection d'entité */}
          <EntityPicker
            entityType={formData.entity_type}
            entitySearch={entitySearch}
            onEntitySearchChange={setEntitySearch}
            filteredEntities={filteredEntities}
            selectedEntityId={formData.entity_id}
            onEntitySelect={onEntitySelect}
            availableOrganisationsCount={availableOrganisations.length}
            availableEnseignesCount={availableEnseignes.length}
          />

          {/* Affichage du nom et slug auto-générés */}
          {formData.entity_id && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="display_name">Nom affiché</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={e =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug URL</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={e =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  URL: linkme-blue.vercel.app/s/
                  {formData.slug ?? 'votre-slug'}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type d'affilié</Label>
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
                    <SelectItem value="enseigne">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Enseigne
                      </div>
                    </SelectItem>
                    <SelectItem value="client_professionnel">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Client Pro
                      </div>
                    </SelectItem>
                    <SelectItem value="client_particulier">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Particulier
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">Bio / Description</Label>
                <Input
                  id="bio"
                  value={formData.bio}
                  onChange={e =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Description courte..."
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <ButtonV2 variant="outline" onClick={onCancel}>
            Annuler
          </ButtonV2>
          <ButtonV2
            onClick={() => {
              void onCreate().catch(error => {
                console.error('[Affiliates] Create failed:', error);
              });
            }}
            disabled={
              saving ||
              !formData.entity_id ||
              !formData.display_name.trim() ||
              !formData.slug.trim()
            }
          >
            {saving ? 'Création...' : "Créer l'affilié"}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
