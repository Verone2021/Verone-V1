'use client';

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch,
  Textarea,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { FileText, ImageIcon, Megaphone, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { Json } from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

// Types matching site_content table
interface HeroContent {
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  image_url: string | null;
}

interface ReassuranceItem {
  title: string;
  description: string;
}

interface ReassuranceContent {
  items: ReassuranceItem[];
}

interface BannerContent {
  enabled: boolean;
  text: string;
  link: string | null;
  bg_color: string;
  text_color: string;
}

interface SiteContentRow {
  id: string;
  content_key: string;
  content_value: Record<string, unknown>;
}

function useSiteContentBO<T>(contentKey: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['site-content-bo', contentKey],
    queryFn: async (): Promise<T | null> => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('content_key', contentKey)
        .single();

      if (error) {
        console.error(`[CMSSection] fetch ${contentKey} error:`, error);
        return null;
      }
      return (data as SiteContentRow | null)?.content_value as T | null;
    },
  });
}

function useUpdateSiteContent() {
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
      const { error } = await supabase
        .from('site_content')
        .update({
          content_value: contentValue as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('content_key', contentKey);

      if (error) throw error;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['site-content-bo', variables.contentKey],
      });
      toast.success('Contenu mis à jour');
    },
    onError: (error: Error) => {
      console.error('[CMSSection] update error:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });
}

// ============================================
// Hero Section Editor
// ============================================

interface HeroFormFieldsProps {
  form: HeroContent;
  setForm: React.Dispatch<React.SetStateAction<HeroContent>>;
}

function HeroFormFields({ form, setForm }: HeroFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Titre principal</Label>
          <Input
            value={form.title}
            onChange={e =>
              setForm(prev => ({ ...prev, title: e.target.value }))
            }
            placeholder="Découvrez l'élégance..."
          />
        </div>
        <div>
          <Label>Sous-titre</Label>
          <Input
            value={form.subtitle}
            onChange={e =>
              setForm(prev => ({ ...prev, subtitle: e.target.value }))
            }
            placeholder="Decoration et mobilier d'interieur..."
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Texte CTA</Label>
          <Input
            value={form.cta_text}
            onChange={e =>
              setForm(prev => ({ ...prev, cta_text: e.target.value }))
            }
            placeholder="Découvrir"
          />
        </div>
        <div>
          <Label>Lien CTA</Label>
          <Input
            value={form.cta_link}
            onChange={e =>
              setForm(prev => ({ ...prev, cta_link: e.target.value }))
            }
            placeholder="/catalogue"
          />
        </div>
      </div>
      <div>
        <Label>Image Hero — URL complète OU Cloudflare Image ID</Label>
        <Input
          value={form.image_url ?? ''}
          onChange={e =>
            setForm(prev => ({
              ...prev,
              image_url: e.target.value || null,
            }))
          }
          placeholder="ex: verone/marketing/.../public  OU  https://..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Soit l&apos;URL complète, soit l&apos;ID Cloudflare (l&apos;URL est
          construite automatiquement).
        </p>
        {form.image_url && (
          <div className="mt-3">
            <Label className="text-xs text-gray-600">Aperçu</Label>
            <div className="relative mt-1 h-40 w-full max-w-md overflow-hidden rounded border border-gray-200 bg-gray-50">
              <Image
                src={resolveHeroPreviewUrl(form.image_url)}
                alt="Aperçu hero"
                fill
                sizes="448px"
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Construit l'URL d'aperçu hero. Accepte :
 *  - URL complète (http/https) → utilisée telle quelle
 *  - ID/path Cloudflare → préfixé avec le domaine imagedelivery.net
 */
function resolveHeroPreviewUrl(value: string): string {
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  const cleaned = value.replace(/^\/+/, '').replace(/\/public$/, '');
  return `https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/${cleaned}/public`;
}

export function CMSHeroEditor() {
  const { data: hero } = useSiteContentBO<HeroContent>('hero');
  const updateContent = useUpdateSiteContent();
  const [form, setForm] = useState<HeroContent>({
    title: '',
    subtitle: '',
    cta_text: '',
    cta_link: '',
    image_url: null,
  });

  useEffect(() => {
    if (hero) setForm(hero);
  }, [hero]);

  const handleSave = useCallback(() => {
    updateContent.mutate({
      contentKey: 'hero',
      contentValue: form as unknown as Record<string, unknown>,
    });
  }, [form, updateContent]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Section Hero
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <HeroFormFields form={form} setForm={setForm} />
        <ButtonV2
          onClick={handleSave}
          disabled={updateContent.isPending}
          size="sm"
        >
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder
        </ButtonV2>
      </CardContent>
    </Card>
  );
}

// ============================================
// Reassurance Section Editor
// ============================================

export function CMSReassuranceEditor() {
  const { data: reassurance } =
    useSiteContentBO<ReassuranceContent>('reassurance');
  const updateContent = useUpdateSiteContent();
  const [items, setItems] = useState<ReassuranceItem[]>([]);

  useEffect(() => {
    if (reassurance?.items) setItems(reassurance.items);
  }, [reassurance]);

  const updateItem = useCallback(
    (index: number, field: keyof ReassuranceItem, value: string) => {
      setItems(prev =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  const handleSave = useCallback(() => {
    updateContent.mutate({
      contentKey: 'reassurance',
      contentValue: { items } as unknown as Record<string, unknown>,
    });
  }, [items, updateContent]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Barre de réassurance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 border rounded"
          >
            <div>
              <Label>Titre {index + 1}</Label>
              <Input
                value={item.title}
                onChange={e => updateItem(index, 'title', e.target.value)}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={item.description}
                onChange={e => updateItem(index, 'description', e.target.value)}
              />
            </div>
          </div>
        ))}
        <ButtonV2
          onClick={handleSave}
          disabled={updateContent.isPending}
          size="sm"
        >
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder
        </ButtonV2>
      </CardContent>
    </Card>
  );
}

// ============================================
// Banner Editor
// ============================================

interface BannerColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function BannerColorPicker({ label, value, onChange }: BannerColorPickerProps) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer"
        />
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1"
        />
      </div>
    </div>
  );
}

interface BannerFormFieldsProps {
  form: BannerContent;
  setForm: React.Dispatch<React.SetStateAction<BannerContent>>;
}

function BannerFormFields({ form, setForm }: BannerFormFieldsProps) {
  return (
    <>
      <div className="flex items-center gap-3">
        <Switch
          checked={form.enabled}
          onCheckedChange={checked =>
            setForm(prev => ({ ...prev, enabled: checked }))
          }
        />
        <Label>Activer le bandeau</Label>
      </div>
      <div>
        <Label>Texte du bandeau</Label>
        <Textarea
          value={form.text}
          onChange={e => setForm(prev => ({ ...prev, text: e.target.value }))}
          placeholder="Livraison offerte dès 500€..."
          rows={2}
        />
      </div>
      <div>
        <Label>Lien (optionnel)</Label>
        <Input
          value={form.link ?? ''}
          onChange={e =>
            setForm(prev => ({ ...prev, link: e.target.value || null }))
          }
          placeholder="/promotions"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BannerColorPicker
          label="Couleur fond"
          value={form.bg_color}
          onChange={v => setForm(prev => ({ ...prev, bg_color: v }))}
        />
        <BannerColorPicker
          label="Couleur texte"
          value={form.text_color}
          onChange={v => setForm(prev => ({ ...prev, text_color: v }))}
        />
      </div>
      {form.text && (
        <div
          className="rounded-lg px-4 py-2.5 text-center text-sm font-medium"
          style={{ backgroundColor: form.bg_color, color: form.text_color }}
        >
          {form.text}
        </div>
      )}
    </>
  );
}

export function CMSBannerEditor() {
  const { data: banner } = useSiteContentBO<BannerContent>('banner');
  const updateContent = useUpdateSiteContent();
  const [form, setForm] = useState<BannerContent>({
    enabled: false,
    text: '',
    link: null,
    bg_color: '#1a1a1a',
    text_color: '#ffffff',
  });

  useEffect(() => {
    if (banner) setForm(banner);
  }, [banner]);

  const handleSave = useCallback(() => {
    updateContent.mutate({
      contentKey: 'banner',
      contentValue: form as unknown as Record<string, unknown>,
    });
  }, [form, updateContent]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Bandeau promotionnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <BannerFormFields form={form} setForm={setForm} />
        <ButtonV2
          onClick={handleSave}
          disabled={updateContent.isPending}
          size="sm"
        >
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder
        </ButtonV2>
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Export
// ============================================

export function CMSSection() {
  return (
    <div className="space-y-6">
      <CMSHeroEditor />
      <CMSReassuranceEditor />
      <CMSBannerEditor />
    </div>
  );
}
