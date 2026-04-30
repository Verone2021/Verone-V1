'use client';

import { useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
  Textarea,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';

export interface BrandRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  brand_color: string | null;
  logo_url: string | null;
  social_handles: Record<string, string> | null;
  website_url: string | null;
  is_active: boolean;
  display_order: number;
}

interface BrandEditModalProps {
  brand: BrandRow;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface SocialHandles {
  instagram: string;
  facebook: string;
  pinterest: string;
  tiktok: string;
}

const EMPTY_SOCIALS: SocialHandles = {
  instagram: '',
  facebook: '',
  pinterest: '',
  tiktok: '',
};

export function BrandEditModal({
  brand,
  open,
  onClose,
  onSaved,
}: BrandEditModalProps) {
  const [name, setName] = useState(brand.name);
  const [description, setDescription] = useState(brand.description ?? '');
  const [brandColor, setBrandColor] = useState(brand.brand_color ?? '#6366f1');
  const [logoUrl, setLogoUrl] = useState(brand.logo_url ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(brand.website_url ?? '');
  const [isActive, setIsActive] = useState(brand.is_active);
  const [socials, setSocials] = useState<SocialHandles>(EMPTY_SOCIALS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-init quand on change de brand
  useEffect(() => {
    setName(brand.name);
    setDescription(brand.description ?? '');
    setBrandColor(brand.brand_color ?? '#6366f1');
    setLogoUrl(brand.logo_url ?? '');
    setWebsiteUrl(brand.website_url ?? '');
    setIsActive(brand.is_active);
    setSocials({
      instagram: brand.social_handles?.instagram ?? '',
      facebook: brand.social_handles?.facebook ?? '',
      pinterest: brand.social_handles?.pinterest ?? '',
      tiktok: brand.social_handles?.tiktok ?? '',
    });
    setError(null);
  }, [brand]);

  const save = async () => {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const cleanSocials: Record<string, string> = {};
    (Object.entries(socials) as Array<[keyof SocialHandles, string]>).forEach(
      ([key, value]) => {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          cleanSocials[key] = trimmed;
        }
      }
    );

    const { error: updateError } = await supabase
      .from('brands')
      .update({
        name: name.trim(),
        description: description.trim() || null,
        brand_color: brandColor || null,
        logo_url: logoUrl.trim() || null,
        website_url: websiteUrl.trim() || null,
        is_active: isActive,
        social_handles:
          Object.keys(cleanSocials).length > 0 ? cleanSocials : null,
      })
      .eq('id', brand.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    onSaved();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="h-screen md:h-auto md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Éditer la marque · {brand.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto md:max-h-[70vh] space-y-4 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nom (label humain)">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Vérone"
                className="w-full"
              />
            </Field>
            <Field label="Slug technique (lecture seule)">
              <Input
                value={brand.slug}
                readOnly
                disabled
                className="w-full bg-gray-50"
              />
            </Field>
          </div>

          <Field label="Description">
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brève description de la marque (visible interne)"
              className="w-full min-h-[80px]"
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Couleur primaire">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandColor}
                  onChange={e => setBrandColor(e.target.value)}
                  className="h-11 md:h-9 w-14 rounded border border-gray-300"
                  aria-label="Sélecteur de couleur"
                />
                <Input
                  value={brandColor}
                  onChange={e => setBrandColor(e.target.value)}
                  placeholder="#6366f1"
                  className="w-full font-mono text-xs"
                />
              </div>
            </Field>
            <Field label="URL du logo (provisoire)">
              <Input
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://…/logo.svg"
                className="w-full"
              />
            </Field>
          </div>

          <Field label="Site web">
            <Input
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              placeholder="https://boemia.com"
              className="w-full"
            />
          </Field>

          <fieldset className="space-y-3 rounded border border-gray-200 p-3">
            <legend className="px-1 text-xs font-semibold text-gray-600 uppercase">
              Réseaux sociaux
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Instagram (handle)">
                <Input
                  value={socials.instagram}
                  onChange={e =>
                    setSocials(s => ({ ...s, instagram: e.target.value }))
                  }
                  placeholder="@boemia"
                  className="w-full"
                />
              </Field>
              <Field label="Facebook (handle)">
                <Input
                  value={socials.facebook}
                  onChange={e =>
                    setSocials(s => ({ ...s, facebook: e.target.value }))
                  }
                  placeholder="boemia.officiel"
                  className="w-full"
                />
              </Field>
              <Field label="Pinterest (handle)">
                <Input
                  value={socials.pinterest}
                  onChange={e =>
                    setSocials(s => ({ ...s, pinterest: e.target.value }))
                  }
                  placeholder="boemia"
                  className="w-full"
                />
              </Field>
              <Field label="TikTok (handle)">
                <Input
                  value={socials.tiktok}
                  onChange={e =>
                    setSocials(s => ({ ...s, tiktok: e.target.value }))
                  }
                  placeholder="@boemia"
                  className="w-full"
                />
              </Field>
            </div>
          </fieldset>

          <div className="flex items-center justify-between rounded border border-gray-200 p-3">
            <div>
              <Label className="text-sm">Marque active</Label>
              <p className="text-xs text-gray-500 mt-0.5">
                Désactiver cache la marque dans le BrandSwitcher.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {error && (
            <p className="text-sm text-red-600 rounded border border-red-200 bg-red-50 p-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 md:flex-row">
          <Button
            variant="outline"
            className="w-full md:w-auto h-11 md:h-9"
            onClick={onClose}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button
            className="w-full md:w-auto h-11 md:h-9"
            onClick={() => {
              void save().catch(err => {
                console.error('[BrandEditModal] save failed:', err);
                setError(String(err));
              });
            }}
            disabled={saving}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-gray-700">{label}</Label>
      {children}
    </div>
  );
}
