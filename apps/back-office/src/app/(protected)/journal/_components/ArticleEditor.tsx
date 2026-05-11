'use client';

import { useCallback, useDeferredValue, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import type {
  Article,
  ArticleCategory,
  ArticleFormData,
} from '@/lib/article-types-bo';
import { ARTICLE_CATEGORIES } from '@/lib/article-types-bo';

import { ArticleMarkdownPreview } from './ArticleMarkdownPreview';
import { ArticleProductSelector } from './ArticleProductSelector';
import { ArticleRelatedSelector } from './ArticleRelatedSelector';
import { ArticleSeoScoring } from './ArticleSeoScoring';

interface ArticleEditorProps {
  article?: Article | null;
  onSave: (
    data: ArticleFormData,
    status: 'draft' | 'published'
  ) => Promise<void>;
  isSaving?: boolean;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const EMPTY_FORM: ArticleFormData = {
  title: '',
  subtitle: '',
  excerpt: '',
  body_markdown: '',
  slug: '',
  cover_image_url: '',
  cover_image_alt: '',
  og_image_url: '',
  og_image_alt: '',
  meta_title: '',
  meta_description: '',
  canonical_url: '',
  focus_keyword: '',
  category: '',
  tags: [],
  is_featured: false,
  featured_product_ids: [],
  related_article_ids: [],
  status: 'draft',
  scheduled_at: '',
  robots_index: true,
  robots_follow: true,
};

function formFromArticle(a: Article): ArticleFormData {
  return {
    title: a.title,
    subtitle: a.subtitle ?? '',
    excerpt: a.excerpt,
    body_markdown: a.body_markdown,
    slug: a.slug,
    cover_image_url: a.cover_image_url ?? '',
    cover_image_alt: a.cover_image_alt,
    og_image_url: a.og_image_url ?? '',
    og_image_alt: a.og_image_alt ?? '',
    meta_title: a.meta_title ?? '',
    meta_description: a.meta_description ?? '',
    canonical_url: a.canonical_url ?? '',
    focus_keyword: '',
    category: (a.category as ArticleCategory) ?? '',
    tags: a.tags ?? [],
    is_featured: a.is_featured,
    featured_product_ids: a.featured_product_ids ?? [],
    related_article_ids: a.related_article_ids ?? [],
    status: (a.status as ArticleFormData['status']) ?? 'draft',
    scheduled_at: a.scheduled_at ?? '',
    robots_index: a.robots_index,
    robots_follow: a.robots_follow,
  };
}

export function ArticleEditor({
  article,
  onSave,
  isSaving,
}: ArticleEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState<ArticleFormData>(
    article ? formFromArticle(article) : EMPTY_FORM
  );
  const [tagInput, setTagInput] = useState('');
  const [slugManual, setSlugManual] = useState(Boolean(article));

  // Deferred values pour preview/scoring (debounce naturel React 18)
  const deferredBody = useDeferredValue(form.body_markdown);
  const deferredTitle = useDeferredValue(form.title);
  const deferredMeta = useDeferredValue(form.meta_title);
  const deferredMetaDesc = useDeferredValue(form.meta_description);
  const deferredExcerpt = useDeferredValue(form.excerpt);
  const deferredSlug = useDeferredValue(form.slug);
  const deferredKeyword = useDeferredValue(form.focus_keyword);

  const set = useCallback(
    <K extends keyof ArticleFormData>(key: K, val: ArticleFormData[K]) => {
      setForm(prev => ({ ...prev, [key]: val }));
    },
    []
  );

  // Auto-slug depuis le titre (si pas encore édité manuellement)
  useEffect(() => {
    if (!slugManual && form.title) {
      set('slug', slugify(form.title));
    }
  }, [form.title, slugManual, set]);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!form.tags.includes(newTag)) {
        set('tags', [...form.tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    set(
      'tags',
      form.tags.filter(t => t !== tag)
    );
  };

  const handleSave = async (status: 'draft' | 'published') => {
    await onSave({ ...form, status }, status);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
      {/* ─── Colonne gauche : formulaire ─────────────────────── */}
      <div className="space-y-6">
        {/* Section Contenu */}
        <FormSection title="Contenu">
          <Field label="Titre *">
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Titre de l'article"
              className="input-base"
            />
          </Field>
          <Field label="Sous-titre">
            <input
              type="text"
              value={form.subtitle}
              onChange={e => set('subtitle', e.target.value)}
              placeholder="Sous-titre (optionnel)"
              className="input-base"
            />
          </Field>
          <Field label="Extrait *">
            <textarea
              value={form.excerpt}
              onChange={e => set('excerpt', e.target.value)}
              placeholder="Résumé de l'article (visible sur la liste)"
              rows={3}
              className="input-base resize-none"
            />
          </Field>
          <Field label="Slug">
            <input
              type="text"
              value={form.slug}
              onChange={e => {
                setSlugManual(true);
                set('slug', e.target.value.replace(/[^a-z0-9-]/g, ''));
              }}
              placeholder="slug-auto-genere"
              className="input-base font-mono text-xs"
            />
          </Field>
          <Field label="Corps (Markdown) *">
            <textarea
              value={form.body_markdown}
              onChange={e => set('body_markdown', e.target.value)}
              placeholder={
                'Colle ton markdown depuis Claude.ai…\n\nExemple de bloc produit :\n<!-- PRODUIT\nname: "Nom"\nslug: "slug"\nimage: "https://..."\nalt: "alt"\n-->'
              }
              rows={30}
              className="input-base resize-y font-mono text-xs"
            />
          </Field>
        </FormSection>

        {/* Section SEO */}
        <FormSection title="SEO">
          <Field label="Mot-clé cible">
            <input
              type="text"
              value={form.focus_keyword}
              onChange={e => set('focus_keyword', e.target.value)}
              placeholder="Ex : lampadaire design salon"
              className="input-base"
            />
          </Field>
          <Field
            label={`Meta titre (${form.meta_title.length}/60)`}
            hint={form.meta_title.length > 60 ? 'Trop long' : undefined}
          >
            <input
              type="text"
              value={form.meta_title}
              onChange={e => set('meta_title', e.target.value)}
              placeholder="Titre SEO (≤ 60 chars)"
              maxLength={80}
              className="input-base"
            />
          </Field>
          <Field
            label={`Meta description (${form.meta_description.length}/160)`}
            hint={
              form.meta_description.length > 160
                ? 'Trop long'
                : form.meta_description.length > 0 &&
                    form.meta_description.length < 120
                  ? 'Trop court (120 min)'
                  : undefined
            }
          >
            <textarea
              value={form.meta_description}
              onChange={e => set('meta_description', e.target.value)}
              rows={3}
              placeholder="Description SEO (120–160 chars)"
              className="input-base resize-none"
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Image cover (URL)">
              <input
                type="url"
                value={form.cover_image_url}
                onChange={e => set('cover_image_url', e.target.value)}
                placeholder="https://imagedelivery.net/..."
                className="input-base"
              />
            </Field>
            <Field label="Alt image cover *">
              <input
                type="text"
                value={form.cover_image_alt}
                onChange={e => set('cover_image_alt', e.target.value)}
                placeholder="Description de l'image"
                className="input-base"
              />
            </Field>
            <Field label="Image OG (URL, optionnel)">
              <input
                type="url"
                value={form.og_image_url}
                onChange={e => set('og_image_url', e.target.value)}
                placeholder="https://... (1200×630)"
                className="input-base"
              />
            </Field>
            <Field label="Alt image OG">
              <input
                type="text"
                value={form.og_image_alt}
                onChange={e => set('og_image_alt', e.target.value)}
                placeholder="Description image OG"
                className="input-base"
              />
            </Field>
          </div>
          <Field label="URL canonique (optionnel)">
            <input
              type="url"
              value={form.canonical_url}
              onChange={e => set('canonical_url', e.target.value)}
              placeholder="https://verone.fr/journal/..."
              className="input-base"
            />
          </Field>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.robots_index}
                onChange={e => set('robots_index', e.target.checked)}
                className="h-4 w-4"
              />
              Indexer (robots_index)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.robots_follow}
                onChange={e => set('robots_follow', e.target.checked)}
                className="h-4 w-4"
              />
              Suivre les liens (robots_follow)
            </label>
          </div>
        </FormSection>

        {/* Section Catégorisation */}
        <FormSection title="Catégorisation">
          <Field label="Catégorie *">
            <select
              value={form.category}
              onChange={e =>
                set('category', e.target.value as ArticleCategory | '')
              }
              className="input-base"
            >
              <option value="">Choisir une catégorie</option>
              {ARTICLE_CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tags">
            <div className="space-y-2">
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        aria-label={`Retirer ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Tape un tag + Entrée"
                className="input-base"
              />
            </div>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={e => set('is_featured', e.target.checked)}
              className="h-4 w-4"
            />
            Article à la une (mis en avant sur /journal)
          </label>
        </FormSection>

        {/* Section Curation */}
        <FormSection title="Curation">
          <Field label={`Produits liés (max ${4})`}>
            <ArticleProductSelector
              value={form.featured_product_ids}
              onChange={ids => set('featured_product_ids', ids)}
            />
          </Field>
          <Field label={`Articles liés (max ${3})`}>
            <ArticleRelatedSelector
              currentArticleId={article?.id}
              value={form.related_article_ids}
              onChange={ids => set('related_article_ids', ids)}
            />
          </Field>
        </FormSection>

        {/* Section Publication */}
        <FormSection title="Publication">
          <Field label="Statut">
            <select
              value={form.status}
              onChange={e =>
                set('status', e.target.value as ArticleFormData['status'])
              }
              className="input-base"
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
              <option value="scheduled">Planifié</option>
            </select>
          </Field>
          {form.status === 'scheduled' && (
            <Field label="Date de publication planifiée">
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={e => set('scheduled_at', e.target.value)}
                className="input-base"
              />
            </Field>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:border-gray-400 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                void handleSave('draft').catch(err =>
                  console.error('[ArticleEditor] save draft failed:', err)
                );
              }}
              disabled={isSaving}
              className="border border-gray-800 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Sauvegarde…' : 'Sauver brouillon'}
            </button>
            <button
              type="button"
              onClick={() => {
                void handleSave('published').catch(err =>
                  console.error('[ArticleEditor] publish failed:', err)
                );
              }}
              disabled={isSaving}
              className="bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Publication…' : 'Publier maintenant'}
            </button>
          </div>
        </FormSection>
      </div>

      {/* ─── Colonne droite : preview + SEO ─────────────────── */}
      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Aperçu
          </h3>
          <ArticleMarkdownPreview markdown={deferredBody} />
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Score SEO
          </h3>
          <ArticleSeoScoring
            title={deferredTitle}
            metaTitle={deferredMeta}
            metaDescription={deferredMetaDesc}
            excerpt={deferredExcerpt}
            bodyMarkdown={deferredBody}
            slug={deferredSlug}
            focusKeyword={deferredKeyword}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Sous-composants UI ────────────────────────────────────────────────────────

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-700">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
        {hint && <span className="ml-2 font-normal text-red-500">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
