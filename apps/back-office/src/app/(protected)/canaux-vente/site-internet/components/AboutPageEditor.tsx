'use client';

/**
 * AboutPageEditor — sous-onglet "À propos" du canal site-internet
 * (BO-SITE-CMS-001 Phase 8).
 *
 * Permet d'éditer le contenu de la page /a-propos veronecollections.fr.
 * Stockage dans `site_content` avec deux clés dédiées :
 *  - `about_hero`  : { title, subtitle, image_url }
 *  - `about_story` : { paragraphs: string[] }
 *
 * Le composant côté site (`apps/site-internet/src/app/a-propos/page.tsx`)
 * lit ces clés via `useSiteContent` pour rendre la page dynamique. Si une
 * clé n'existe pas encore en base, des valeurs par défaut sont utilisées.
 */

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  ButtonV2,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from '@verone/ui';
import { BookOpen, ImageIcon, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { Json } from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

interface AboutHero {
  title: string;
  subtitle: string;
  image_url: string | null;
}

interface AboutStory {
  paragraphs: string[];
}

interface SiteContentRow {
  content_key: string;
  content_value: Record<string, unknown>;
}

function useSiteContentValue<T>(contentKey: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['about-page-content', contentKey],
    queryFn: async (): Promise<T | null> => {
      const { data, error } = await supabase
        .from('site_content')
        .select('content_key, content_value')
        .eq('content_key', contentKey)
        .maybeSingle();
      if (error) {
        console.error(`[AboutPageEditor] fetch ${contentKey}:`, error);
        return null;
      }
      return (data as SiteContentRow | null)?.content_value as T | null;
    },
  });
}

function useUpsertSiteContent() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentKey,
      contentValue,
    }: {
      contentKey: string;
      contentValue: Record<string, unknown>;
    }) => {
      // UPSERT pour gérer la création initiale d'une clé qui n'existait pas.
      const { error } = await supabase.from('site_content').upsert(
        {
          content_key: contentKey,
          content_value: contentValue as unknown as Json,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'content_key' }
      );
      if (error) throw error;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['about-page-content', variables.contentKey],
      });
      toast.success('Page À propos mise à jour');
    },
    onError: (err: Error) => {
      console.error('[AboutPageEditor] upsert error:', err);
      toast.error('Erreur lors de la mise à jour');
    },
  });
}

function resolveImagePreview(value: string): string {
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  const cleaned = value.replace(/^\/+/, '').replace(/\/public$/, '');
  return `https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/${cleaned}/public`;
}

function AboutHeroEditor() {
  const { data: hero } = useSiteContentValue<AboutHero>('about_hero');
  const upsert = useUpsertSiteContent();
  const [form, setForm] = useState<AboutHero>({
    title: '',
    subtitle: '',
    image_url: null,
  });

  useEffect(() => {
    if (hero) setForm(hero);
  }, [hero]);

  const handleSave = useCallback(() => {
    upsert.mutate({
      contentKey: 'about_hero',
      contentValue: form as unknown as Record<string, unknown>,
    });
  }, [form, upsert]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Entête « À propos »
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Titre</Label>
          <Input
            value={form.title}
            onChange={e =>
              setForm(prev => ({ ...prev, title: e.target.value }))
            }
            placeholder="Notre histoire"
          />
        </div>
        <div>
          <Label>Sous-titre</Label>
          <Input
            value={form.subtitle}
            onChange={e =>
              setForm(prev => ({ ...prev, subtitle: e.target.value }))
            }
            placeholder="Une sélection patiente, un regard exigeant"
          />
        </div>
        <div>
          <Label>Image — URL complète OU Cloudflare Image ID</Label>
          <Input
            value={form.image_url ?? ''}
            onChange={e =>
              setForm(prev => ({
                ...prev,
                image_url: e.target.value || null,
              }))
            }
            placeholder="ex: verone/marketing/about-hero/public  OU  https://..."
          />
          {form.image_url && (
            <div className="relative mt-2 h-40 w-full max-w-md overflow-hidden rounded border border-gray-200 bg-gray-50">
              <Image
                src={resolveImagePreview(form.image_url)}
                alt="Aperçu À propos"
                fill
                sizes="448px"
                className="object-contain"
                unoptimized
              />
            </div>
          )}
        </div>
        <ButtonV2 onClick={handleSave} disabled={upsert.isPending} size="sm">
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder
        </ButtonV2>
      </CardContent>
    </Card>
  );
}

function AboutStoryEditor() {
  const { data: story } = useSiteContentValue<AboutStory>('about_story');
  const upsert = useUpsertSiteContent();
  const [paragraphs, setParagraphs] = useState<string[]>([]);

  useEffect(() => {
    if (story?.paragraphs) setParagraphs(story.paragraphs);
  }, [story]);

  const updateParagraph = useCallback((index: number, value: string) => {
    setParagraphs(prev => prev.map((p, i) => (i === index ? value : p)));
  }, []);

  const addParagraph = useCallback(() => {
    setParagraphs(prev => [...prev, '']);
  }, []);

  const removeParagraph = useCallback((index: number) => {
    setParagraphs(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(() => {
    upsert.mutate({
      contentKey: 'about_story',
      contentValue: {
        paragraphs: paragraphs.filter(p => p.trim().length > 0),
      },
    });
  }, [paragraphs, upsert]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Récit éditorial
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {paragraphs.map((paragraph, index) => (
          <div key={index} className="flex gap-2 items-start">
            <Textarea
              value={paragraph}
              onChange={e => updateParagraph(index, e.target.value)}
              rows={3}
              placeholder={`Paragraphe ${index + 1}`}
              className="flex-1"
            />
            <ButtonV2
              variant="ghost"
              size="sm"
              onClick={() => removeParagraph(index)}
              aria-label="Supprimer ce paragraphe"
            >
              <Trash2 className="h-4 w-4" />
            </ButtonV2>
          </div>
        ))}
        <div className="flex justify-between">
          <ButtonV2 variant="outline" size="sm" onClick={addParagraph}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un paragraphe
          </ButtonV2>
          <ButtonV2 onClick={handleSave} disabled={upsert.isPending} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </ButtonV2>
        </div>
      </CardContent>
    </Card>
  );
}

export function AboutPageEditor() {
  return (
    <div className="space-y-6">
      <AboutHeroEditor />
      <AboutStoryEditor />
    </div>
  );
}
