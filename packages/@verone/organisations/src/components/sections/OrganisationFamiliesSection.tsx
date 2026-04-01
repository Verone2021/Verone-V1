'use client';

import { useState } from 'react';

import { useFamilies } from '@verone/categories';
import { Badge, Card, CardContent, Checkbox } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Tags, Pencil, Loader2 } from 'lucide-react';

import {
  useOrganisationFamilies,
  type OrganisationFamily,
} from '../../hooks/use-organisation-families';

interface OrganisationFamiliesSectionProps {
  organisationId: string;
}

const FAMILY_COLORS: Record<string, string> = {
  'Maison et decoration': 'bg-amber-100 text-amber-800 border-amber-200',
  Electromenager: 'bg-blue-100 text-blue-800 border-blue-200',
  'Haute technologie': 'bg-purple-100 text-purple-800 border-purple-200',
  'Beaute et bien-etre': 'bg-pink-100 text-pink-800 border-pink-200',
  'Alimentation et boissons': 'bg-green-100 text-green-800 border-green-200',
  'Sport et loisirs': 'bg-orange-100 text-orange-800 border-orange-200',
  'Bebe et enfant': 'bg-cyan-100 text-cyan-800 border-cyan-200',
};

function getFamilyColor(name: string): string {
  return FAMILY_COLORS[name] ?? 'bg-gray-100 text-gray-800 border-gray-200';
}

export function OrganisationFamiliesSection({
  organisationId,
}: OrganisationFamiliesSectionProps) {
  const { families, loading, setFamilies } =
    useOrganisationFamilies(organisationId);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tags className="h-4 w-4 text-gray-500" />
            <h3 className="font-semibold text-sm text-gray-900">
              Familles produits
            </h3>
          </div>
          <ButtonV2
            variant="ghost"
            size="sm"
            onClick={() => setDialogOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Modifier
          </ButtonV2>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement...
          </div>
        ) : families.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune famille assignee</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {families.map((f: OrganisationFamily) => (
              <Badge
                key={f.family_id}
                variant="outline"
                className={getFamilyColor(f.family_name)}
              >
                {f.family_name}
              </Badge>
            ))}
          </div>
        )}

        <FamilySelectorDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          currentFamilyIds={families.map(f => f.family_id)}
          onSave={async (selectedIds: string[]) => {
            await setFamilies(selectedIds);
            setDialogOpen(false);
          }}
        />
      </CardContent>
    </Card>
  );
}

// ============================================
// DIALOG MULTI-SELECT
// ============================================

interface FamilySelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFamilyIds: string[];
  onSave: (familyIds: string[]) => Promise<void>;
}

function FamilySelectorDialog({
  open,
  onOpenChange,
  currentFamilyIds,
  onSave,
}: FamilySelectorDialogProps) {
  const { families: allFamilies, loading } = useFamilies();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(currentFamilyIds)
  );
  const [saving, setSaving] = useState(false);

  // Sync selection when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelected(new Set(currentFamilyIds));
    }
    onOpenChange(isOpen);
  };

  const toggleFamily = (familyId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(familyId)) next.delete(familyId);
      else next.add(familyId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave([...selected]);
    } catch (err) {
      console.error('[FamilySelectorDialog] Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Familles produits du fournisseur</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {allFamilies
              .filter(f => f.is_active)
              .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
              .map(family => (
                <label
                  key={family.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selected.has(family.id)}
                    onCheckedChange={() => toggleFamily(family.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {family.name}
                    </p>
                    {family.description && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {family.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={getFamilyColor(family.name)}
                  >
                    {family.categories_count ?? 0} cat.
                  </Badge>
                </label>
              ))}
          </div>
        )}

        <DialogFooter>
          <ButtonV2
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            onClick={() => {
              void handleSave();
            }}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              `Valider (${selected.size})`
            )}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
