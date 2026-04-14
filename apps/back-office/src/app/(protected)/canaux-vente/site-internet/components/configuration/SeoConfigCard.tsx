'use client';

import { useState, useEffect, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Input,
  Textarea,
  ButtonV2,
} from '@verone/ui';
import { Search, Loader2, Save } from 'lucide-react';

import type { SiteInternetConfig } from '../../types';
import { useUpdateSiteInternetConfig } from '../../hooks/use-site-internet-config';

interface SeoConfigCardProps {
  config?: SiteInternetConfig | null;
}

export function SeoConfigCard({ config }: SeoConfigCardProps) {
  const { toast } = useToast();
  const updateConfig = useUpdateSiteInternetConfig();

  const [seoForm, setSeoForm] = useState({
    default_meta_title: config?.default_meta_title ?? '',
    default_meta_description: config?.default_meta_description ?? '',
    meta_keywords: (config?.meta_keywords ?? []).join(', '),
  });

  useEffect(() => {
    if (config) {
      setSeoForm({
        default_meta_title: config.default_meta_title ?? '',
        default_meta_description: config.default_meta_description ?? '',
        meta_keywords: (config.meta_keywords ?? []).join(', '),
      });
    }
  }, [config]);

  const handleSave = useCallback(async () => {
    try {
      await updateConfig.mutateAsync({
        default_meta_title: seoForm.default_meta_title,
        default_meta_description: seoForm.default_meta_description,
        meta_keywords: seoForm.meta_keywords
          .split(',')
          .map(k => k.trim())
          .filter(Boolean),
      });
      toast({
        title: 'SEO sauvegarde',
        description: 'Les parametres SEO par defaut ont ete mis a jour.',
      });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les parametres SEO.',
        variant: 'destructive',
      });
    }
  }, [seoForm, updateConfig, toast]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-purple-600" />
          <CardTitle>SEO Global</CardTitle>
        </div>
        <CardDescription>
          Parametres SEO par defaut appliques a toutes les pages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="meta-title">Meta Title par Defaut</Label>
          <Input
            id="meta-title"
            placeholder="Ex: Verone Collections - Decoration et mobilier"
            value={seoForm.default_meta_title}
            onChange={e =>
              setSeoForm(prev => ({
                ...prev,
                default_meta_title: e.target.value,
              }))
            }
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground">
            60 caracteres max. Affiche dans les resultats Google.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="meta-description">Meta Description par Defaut</Label>
          <Textarea
            id="meta-description"
            placeholder="Ex: Concept store en ligne..."
            value={seoForm.default_meta_description}
            onChange={e =>
              setSeoForm(prev => ({
                ...prev,
                default_meta_description: e.target.value,
              }))
            }
            rows={3}
            maxLength={160}
          />
          <p className="text-xs text-muted-foreground">160 caracteres max.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="meta-keywords">Meta Keywords</Label>
          <Input
            id="meta-keywords"
            placeholder="Ex: mobilier, decoration, concept store"
            value={seoForm.meta_keywords}
            onChange={e =>
              setSeoForm(prev => ({ ...prev, meta_keywords: e.target.value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Mots-cles separes par des virgules
          </p>
        </div>
        <div className="flex justify-end">
          <ButtonV2
            onClick={() => {
              void handleSave().catch(console.error);
            }}
            disabled={updateConfig.isPending}
          >
            {updateConfig.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder
              </>
            )}
          </ButtonV2>
        </div>
      </CardContent>
    </Card>
  );
}
