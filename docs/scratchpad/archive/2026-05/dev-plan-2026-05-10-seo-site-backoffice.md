# Dev Plan — SEO site-internet + pilotage back-office

**Date :** 2026-05-10
**Tasks :** SITE-SEO-001 à SITE-SEO-006 + SITE-BLOG-001
**Priorité :** Haute — bloque le référencement au lancement
**À lire avec :** `seo-strategy-2026-05-10.md`, `seo-architecture-2026-05-10.md`, `copy-seo-2026-05-10.md`

---

## Contexte et état des lieux

**Audit du 2026-05-11 — back-office production + code + schéma DB.**

Le back-office a une section `/canaux-vente/site-internet` bien structurée avec 11 onglets (Dashboard, Produits, Collections, Catégories, Configuration, Commandes, Clients, Avis, Contenu, Promotions, Ambassadeurs).

### CE QUI EXISTE DÉJÀ (✅ — pas retoucher)

| Composant                  | Champs                                                                      | Statut                                                                                             |
| -------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `TabGeneral.tsx`           | `is_published_online`, `slug`, `publication_date`, `unpublication_date`     | ✅ Complet                                                                                         |
| `TabSEO.tsx`               | `meta_title` (60 chars), `meta_description` (160 chars)                     | ✅ Complet — **BUG mineur** : URL preview affiche `/produit/[slug]` au lieu de `/catalogue/[slug]` |
| `TabImages.tsx`            | Galerie Cloudflare, set primary, delete                                     | ✅ Complet — **GAP : `alt_text` affiché mais non éditable**                                        |
| `TabInformations.tsx`      | Lecture seule — renvoie vers fiche produit principale                       | ✅ Correct par design (source unique)                                                              |
| `SeoConfigCard.tsx`        | `default_meta_title`, `default_meta_description`, `meta_keywords` globaux   | ✅ Complet                                                                                         |
| `ConfigurationSection.tsx` | Identity + SEO + Contact + Analytics + Shipping                             | ✅ Complet                                                                                         |
| `CMSSection.tsx`           | Hero (titre/sous-titre/CTA/image_url), Réassurance (3 items), Bandeau promo | ✅ Complet — **GAP : image hero = URL texte, pas upload Cloudflare**                               |
| `CollectionsSection.tsx`   | Toggle visibilité, créer/éditer/supprimer                                   | ✅ Structure — **GAP critique : `meta_title`, `meta_description` absents du modal d'édition**      |

### CE QUI MANQUE (❌ — sprints Claude Code)

| Manque                                                       | Niveau            | Impact                           |
| ------------------------------------------------------------ | ----------------- | -------------------------------- |
| `alt_text` éditable sur chaque image produit (TabImages)     | Champ UI          | SEO images — critique            |
| `meta_title` + `meta_description` dans `CollectionFormModal` | Champ UI          | SEO collections — critique       |
| `editorial_text` sur collections (DB + admin)                | Migration DB + UI | SEO pages collections — critique |
| `image_alt` sur collections (DB + admin)                     | Migration DB + UI | SEO image collection             |
| `generateMetadata()` sur toutes les pages site-internet      | Site-internet     | SEO fondamental                  |
| `sitemap.ts` dynamique                                       | Site-internet     | Indexation Google                |
| `robots.ts`                                                  | Site-internet     | Crawl control                    |
| Bug slug URL dans TabSEO (`/produit/` → `/catalogue/`)       | Back-office       | UX admin                         |
| Table `articles` + admin CRUD (magazine/blog)                | Migration DB + UI | Contenu SEO                      |
| Pages `/magazine` dans site-internet                         | Site-internet     | Trafic blog                      |

### NOTE sur CMSSection vs site-internet

Le back-office édite la table `site_content` (hero, réassurance, bandeau). Mais le site-internet (`HeroSection.tsx`) utilise du copy **hardcodé**, pas Supabase. **Décision à prendre avec Claude Code** : soit câbler le site pour lire `site_content` (SSG + revalidate), soit supprimer la CMSSection (copy éditorial stable, pas besoin d'admin). Recommandation : câbler `site_content` → donne le contrôle sans redéploiement.

Ce plan couvre 6 sprints techniques + 1 sprint DB.

---

## État du schéma DB (audit 2026-05-10)

### `products` — champs SEO existants (à câbler dans le site)

| Champ                 | Type    | Usage site-internet                         |
| --------------------- | ------- | ------------------------------------------- |
| `slug`                | varchar | URL `/catalogue/[slug]` ✅ à câbler         |
| `meta_title`          | text    | `<title>` fiche produit — non câblé         |
| `meta_description`    | text    | `<meta description>` — non câblé            |
| `description_short`   | text    | H2 + intro fiche — à câbler                 |
| `description_long`    | text    | Corps de texte fiche — à câbler             |
| `selling_points`      | jsonb   | Liste avantages produit — à câbler          |
| `suitable_rooms`      | ARRAY   | Filtres catalogue par pièce — à câbler      |
| `gtin`                | varchar | Schema.org Product identifier — non câblé   |
| `stock_real`          | integer | Schema.org availability — non câblé         |
| `is_published_online` | boolean | Guard de publication — à vérifier           |
| `style`               | text    | Filtre catalogue — à câbler                 |
| `tags`                | ARRAY   | Mots-clés internes — à câbler               |
| `commercial_name`     | varchar | Nom affiché (préféré sur `name`) — à câbler |

### `product_images` — champs à câbler

| Champ                 | Type    | Usage                                         |
| --------------------- | ------- | --------------------------------------------- |
| `alt_text`            | text    | `alt=""` sur les `<img>` — critique SEO       |
| `cloudflare_image_id` | text    | URL Cloudflare Images — à utiliser via helper |
| `is_primary`          | boolean | Image principale fiche + OG                   |
| `display_order`       | integer | Ordre galerie                                 |
| `width` / `height`    | integer | Prop `width`/`height` next/image              |

### `collections` — champs existants + manquants

| Champ                 | Type    | Statut                              |
| --------------------- | ------- | ----------------------------------- |
| `slug`                | text    | ✅ existe                           |
| `meta_title`          | varchar | ✅ existe                           |
| `meta_description`    | text    | ✅ existe                           |
| `image_url`           | text    | ✅ existe (legacy)                  |
| `cloudflare_image_id` | text    | ✅ existe                           |
| `description`         | text    | ✅ existe (courte)                  |
| `is_published_online` | boolean | ✅ existe                           |
| `editorial_text`      | text    | ❌ **MANQUANT — migration requise** |
| `image_alt`           | text    | ❌ **MANQUANT — migration requise** |

### `articles` (blog/magazine)

❌ **Table inexistante — migration complète requise**

---

## Sprint 0 — Migration DB (SITE-DB-001)

**Priorité : faire en premier, tout le reste en dépend**

### 0a — Ajouter champs manquants sur `collections`

```sql
-- Migration : 20260510XXXXXX_site_seo_collections_fields.sql
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS editorial_text text,
  ADD COLUMN IF NOT EXISTS image_alt text;

COMMENT ON COLUMN collections.editorial_text IS 'Texte éditorial 100-200 mots affiché sur la page collection — optimisé SEO, visible visiteur';
COMMENT ON COLUMN collections.image_alt IS 'Texte alternatif image collection pour accessibilité et SEO';
```

### 0b — Créer la table `articles` (blog/magazine)

```sql
-- Migration : 20260510XXXXXX_site_articles.sql
CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  content_mdx text NOT NULL,            -- contenu en MDX (markdown étendu)
  excerpt text,                          -- résumé 150-200 mots pour les listes
  cover_image_url text,                  -- URL Cloudflare R2
  cover_image_alt text,
  cover_cloudflare_image_id text,
  category text NOT NULL DEFAULT 'inspiration',  -- inspiration | guide | tendance
  tags text[] DEFAULT '{}',
  meta_title text,
  meta_description text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  unpublished_at timestamptz,
  author_name text NOT NULL DEFAULT 'Vérone',
  reading_time_minutes integer,          -- calculé automatiquement
  related_product_ids uuid[] DEFAULT '{}',  -- produits liés à l'article
  related_collection_ids uuid[] DEFAULT '{}',
  display_order integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX articles_slug_idx ON articles(slug);
CREATE INDEX articles_published_idx ON articles(is_published, published_at DESC);
CREATE INDEX articles_category_idx ON articles(category);

-- RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_full_access" ON articles FOR ALL TO authenticated USING (is_backoffice_user());
CREATE POLICY "public_read_published" ON articles FOR SELECT TO anon USING (is_published = true AND (unpublished_at IS NULL OR unpublished_at > now()));

-- Updated_at trigger
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Après migration :** `python3 scripts/generate-docs.py --db` + régénérer types TS

---

## Sprint 1 — Images Cloudflare (SITE-SEO-001)

**Fichiers concernés :** `apps/site-internet/src/lib/cloudflare.ts` (à créer ou compléter), tous les composants qui affichent des images

### Helper Cloudflare Images à créer/compléter

```typescript
// apps/site-internet/src/lib/cloudflare.ts

const CLOUDFLARE_ACCOUNT_HASH =
  process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH!;

type CloudflareVariant = 'thumbnail' | 'card' | 'hero' | 'gallery' | 'og';

/**
 * Construit l'URL d'une image Cloudflare Images à partir de son ID.
 * Variantes définies dans le dashboard Cloudflare.
 */
export function getCloudflareImageUrl(
  cloudflareImageId: string,
  variant: CloudflareVariant = 'card'
): string {
  return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${cloudflareImageId}/${variant}`;
}

/**
 * Retourne l'URL de l'image prioritaire d'un produit.
 * Fallback : public_url legacy si pas de cloudflare_image_id.
 */
export function getProductPrimaryImageUrl(
  images: Array<{
    cloudflare_image_id: string | null;
    public_url: string | null;
    is_primary: boolean;
  }>,
  variant: CloudflareVariant = 'card'
): string {
  const primary = images.find(img => img.is_primary) ?? images[0];
  if (!primary) return '/images/placeholder-product.jpg';
  if (primary.cloudflare_image_id) {
    return getCloudflareImageUrl(primary.cloudflare_image_id, variant);
  }
  return primary.public_url ?? '/images/placeholder-product.jpg';
}
```

### Variantes Cloudflare à configurer dans le dashboard

| Variante    | Dimensions    | Usage                                       |
| ----------- | ------------- | ------------------------------------------- |
| `thumbnail` | 120×120 fit   | Miniatures variantes 60×60 (affiché à 60px) |
| `card`      | 400×500 fit   | Grille catalogue (aspect 4/5)               |
| `hero`      | 800×1000 fit  | Galerie fiche produit principale            |
| `gallery`   | 600×750 fit   | Miniatures galerie fiche (4 images)         |
| `og`        | 1200×630 fill | OpenGraph partage réseaux sociaux           |

### Règles `next/image` à appliquer sur TOUS les composants image

```tsx
// ✅ CORRECT — fiche produit hero
<Image
  src={getCloudflareImageUrl(product.cloudflare_image_id, 'hero')}
  alt={image.alt_text ?? `${product.commercial_name ?? product.name} — Vérone`}
  fill
  className="object-cover"
  priority  // ← OBLIGATOIRE pour l'image above-the-fold
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// ✅ CORRECT — card catalogue
<Image
  src={getCloudflareImageUrl(image.cloudflare_image_id, 'card')}
  alt={image.alt_text ?? product.name}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>

// ❌ INTERDIT partout
<img src={product.image_url} />  // pas de next/image
<Image src={url} alt="" />       // alt vide
<Image src={url} alt={url} />   // alt = URL
```

### Checklist par composant image

- [ ] `HeroSection.tsx` — image hero avec `priority`
- [ ] `FeaturedProductsSection.tsx` — cards avec alt depuis `product_images.alt_text`
- [ ] `CollectionsSection.tsx` — collection image avec alt
- [ ] `ProductCard.tsx` (catalogue) — card avec alt
- [ ] `ProductGallery.tsx` (fiche produit) — galerie avec alt par image
- [ ] Toutes les pages collection `/collections/[slug]`

---

## Sprint 2 — generateMetadata par page (SITE-SEO-002)

**Next.js 15 App Router — generateMetadata asynchrone sur chaque page**

### Homepage

```typescript
// apps/site-internet/src/app/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vérone — Déco et mobilier design, sélection éditoriale',
  description:
    'Découvrez notre sélection de meubles et objets décoratifs design. Luminaires, miroirs, vases — des pièces choisies pour leur caractère.',
  openGraph: {
    title: 'Vérone — Déco et mobilier design',
    description: 'Une sélection éditoriale de meubles et objets déco.',
    url: 'https://veronecollections.fr',
    siteName: 'Vérone',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: 'https://veronecollections.fr/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Vérone — Sélection déco et mobilier design',
      },
    ],
  },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: 'https://veronecollections.fr' },
};
```

### Fiche produit — generateMetadata dynamique

```typescript
// apps/site-internet/src/app/catalogue/[slug]/page.tsx
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: 'Produit introuvable — Vérone' };

  const primaryImage = product.images?.find(img => img.is_primary);
  const ogImageUrl = primaryImage?.cloudflare_image_id
    ? getCloudflareImageUrl(primaryImage.cloudflare_image_id, 'og')
    : 'https://veronecollections.fr/og-default.jpg';

  const title =
    product.meta_title ?? `${product.commercial_name ?? product.name} — Vérone`;
  const description =
    product.meta_description ??
    product.description_short ??
    `Découvrez ${product.name} dans notre sélection déco.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://veronecollections.fr/catalogue/${product.slug}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    alternates: {
      canonical: `https://veronecollections.fr/catalogue/${product.slug}`,
    },
  };
}
```

### Page collection — generateMetadata dynamique

```typescript
// apps/site-internet/src/app/collections/[slug]/page.tsx
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const collection = await getCollectionBySlug(params.slug);
  if (!collection) return { title: 'Collection introuvable — Vérone' };

  const title = collection.meta_title ?? `${collection.name} — Vérone`;
  const description =
    collection.meta_description ?? collection.description ?? '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://veronecollections.fr/collections/${collection.slug}`,
      images: collection.cloudflare_image_id
        ? [
            {
              url: getCloudflareImageUrl(collection.cloudflare_image_id, 'og'),
              width: 1200,
              height: 630,
              alt: collection.name,
            },
          ]
        : [],
    },
    alternates: {
      canonical: `https://veronecollections.fr/collections/${collection.slug}`,
    },
  };
}
```

### Page catalogue (filtrée)

```typescript
// apps/site-internet/src/app/catalogue/page.tsx
// NB : le filtre ?categorie= ou ?collection= ne change pas le canonical — canonical = /catalogue
export const metadata: Metadata = {
  title: 'Catalogue déco et mobilier design — Vérone',
  description:
    'Parcourez notre catalogue : lampadaires design, miroirs, vases, objets décoratifs. Sélection éditoriale curatée par Vérone.',
  alternates: { canonical: 'https://veronecollections.fr/catalogue' },
};
```

### Page article blog

```typescript
// apps/site-internet/src/app/magazine/[slug]/page.tsx
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return { title: 'Article introuvable — Vérone' };

  const title = article.meta_title ?? `${article.title} — Vérone Magazine`;
  const description = article.meta_description ?? article.excerpt ?? '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.published_at ?? undefined,
      authors: ['https://veronecollections.fr'],
      url: `https://veronecollections.fr/magazine/${article.slug}`,
      images: article.cover_cloudflare_image_id
        ? [
            {
              url: getCloudflareImageUrl(
                article.cover_cloudflare_image_id,
                'og'
              ),
              width: 1200,
              height: 630,
              alt: article.cover_image_alt ?? article.title,
            },
          ]
        : [],
    },
    alternates: {
      canonical: `https://veronecollections.fr/magazine/${article.slug}`,
    },
  };
}
```

---

## Sprint 3 — Schema.org JSON-LD (SITE-SEO-003)

### Composant générique

```typescript
// apps/site-internet/src/components/seo/JsonLd.tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

### Schema Organization — layout racine

```typescript
// apps/site-internet/src/app/layout.tsx
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Vérone',
  url: 'https://veronecollections.fr',
  logo: 'https://veronecollections.fr/logo.png',
  email: 'contact@veronecollections.fr',
  sameAs: ['https://www.instagram.com/veronecollections'],
  areaServed: 'FR',
};
// Injecter dans <head> via JsonLd dans le RootLayout
```

### Schema Product — fiche produit

```typescript
// Injecter dans apps/site-internet/src/app/catalogue/[slug]/page.tsx
const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.commercial_name ?? product.name,
  description: product.description_short,
  sku: product.sku,
  gtin: product.gtin ?? undefined,
  image: product.images
    ?.filter(img => img.cloudflare_image_id)
    .map(img => getCloudflareImageUrl(img.cloudflare_image_id!, 'hero')),
  brand: { '@type': 'Brand', name: 'Vérone' },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'EUR',
    price: product.selling_price_ttc, // colonne à identifier dans la vue prix
    availability:
      product.stock_real > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    url: `https://veronecollections.fr/catalogue/${product.slug}`,
  },
};
```

**NB :** La vue prix — identifier quelle vue ou colonne expose le `selling_price_ttc` côté site public. Lire `docs/current/database/schema/` avant d'implémenter.

### Schema CollectionPage — pages collection

```typescript
const collectionSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: `${collection.name} — Vérone`,
  description: collection.editorial_text ?? collection.description,
  url: `https://veronecollections.fr/collections/${collection.slug}`,
};
```

### Schema Article — pages magazine

```typescript
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  description: article.excerpt,
  datePublished: article.published_at,
  dateModified: article.updated_at,
  author: { '@type': 'Organization', name: 'Vérone' },
  publisher: {
    '@type': 'Organization',
    name: 'Vérone',
    logo: {
      '@type': 'ImageObject',
      url: 'https://veronecollections.fr/logo.png',
    },
  },
  image: article.cover_cloudflare_image_id
    ? getCloudflareImageUrl(article.cover_cloudflare_image_id, 'og')
    : undefined,
};
```

---

## Sprint 4 — Sitemap dynamique (SITE-SEO-004)

```typescript
// apps/site-internet/src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerClient();

  const [productsRes, collectionsRes, articlesRes] = await Promise.all([
    supabase
      .from('products')
      .select('slug, updated_at')
      .eq('is_published_online', true)
      .not('slug', 'is', null),
    supabase
      .from('collections')
      .select('slug, updated_at')
      .eq('is_published_online', true)
      .not('slug', 'is', null),
    supabase
      .from('articles')
      .select('slug, updated_at')
      .eq('is_published', true)
      .not('slug', 'is', null),
  ]);

  const productUrls = (productsRes.data ?? []).map(p => ({
    url: `https://veronecollections.fr/catalogue/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    priority: 0.7,
  }));

  const collectionUrls = (collectionsRes.data ?? []).map(c => ({
    url: `https://veronecollections.fr/collections/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
    priority: 0.9,
  }));

  const articleUrls = (articlesRes.data ?? []).map(a => ({
    url: `https://veronecollections.fr/magazine/${a.slug}`,
    lastModified: a.updated_at ? new Date(a.updated_at) : new Date(),
    priority: 0.6,
  }));

  return [
    { url: 'https://veronecollections.fr', priority: 1.0 },
    { url: 'https://veronecollections.fr/catalogue', priority: 0.8 },
    { url: 'https://veronecollections.fr/collections', priority: 0.8 },
    { url: 'https://veronecollections.fr/a-propos', priority: 0.4 },
    { url: 'https://veronecollections.fr/contact', priority: 0.4 },
    { url: 'https://veronecollections.fr/magazine', priority: 0.7 },
    ...collectionUrls,
    ...productUrls,
    ...articleUrls,
  ];
}
```

---

## Sprint 5 — robots.txt (SITE-SEO-005)

```typescript
// apps/site-internet/src/app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/compte/'] },
    sitemap: 'https://veronecollections.fr/sitemap.xml',
  };
}
```

---

## Sprint 6 — Section Magazine dans le site-internet (SITE-BLOG-001)

### Architecture URL

```
/magazine                     → liste des articles (grille éditoriale)
/magazine/[slug]              → article complet
```

Ne pas appeler ça "Blog" — "Magazine" ou "Inspirations" est plus cohérent avec le positionnement Vérone.

### Page liste `/magazine`

- Grille 2 colonnes desktop, 1 colonne mobile
- Cards : image cover (aspect 3/2), catégorie (eyebrow DM Sans), titre (Bodoni), extrait, lien
- Filtre par catégorie : `inspiration | guide | tendance` (pills charbon/or)
- SSG avec `revalidate: 3600` (1h)

### Page article `/magazine/[slug]`

- Hero : titre Bodoni 900 centré, sous-titre Montserrat, image cover full-width
- Corps : MDX rendu avec `next-mdx-remote` ou `@next/mdx`
- Sidebar (desktop) : produits liés depuis `related_product_ids`
- En bas : 3 articles suggérés
- SSG via `generateStaticParams()` sur les slugs publiés

### generateStaticParams

```typescript
export async function generateStaticParams() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('articles')
    .select('slug')
    .eq('is_published', true);
  return (data ?? []).map(a => ({ slug: a.slug }));
}
```

---

## Sprint 7 — Admin back-office — sections à ajouter (SITE-BO-001)

### 7a — Fiche produit : onglet "Publication & SEO"

Ajouter un onglet dédié dans `SalesProductFormModal` (ou page dédiée produit) :

**Section "Publication web"**

- Toggle `is_published_online` (déjà existant — vérifier qu'il est bien exposé)
- Champ `slug` (auto-généré depuis `commercial_name`, éditable)
- Date publication / dépublication

**Section "SEO"**

- `meta_title` (max 60 chars avec compteur)
- `meta_description` (max 155 chars avec compteur)
- Prévisualisation Google snippet (live)

**Section "Images"**

- Pour chaque image : champ `alt_text` éditable (inline dans la liste d'images)
- Label affiché : "Texte alternatif (pour les moteurs de recherche)"

### 7b — Collections : onglet "Publication & SEO"

Ajouter dans l'admin collections :

- Toggle `is_published_online`
- `slug` (auto + éditable)
- `editorial_text` : textarea 100-200 mots avec compteur ("Texte éditorial visible sur la page collection")
- `image_alt` : texte alternatif image de la collection
- `meta_title` / `meta_description` avec compteurs
- Prévisualisation snippet

### 7c — CRUD Articles (Magazine)

Créer une nouvelle section "Magazine" dans le back-office :

**Liste articles** : tableau avec titre, catégorie, statut (brouillon/publié), date, actions
**Formulaire article** :

- `title`, `subtitle`
- `slug` (auto depuis title, éditable)
- `category` (select : Inspiration / Guide / Tendance)
- `tags` (chips input)
- `cover_image` (upload Cloudflare R2) + `cover_image_alt`
- `excerpt` (200 chars max)
- `content_mdx` : éditeur MDX (Monaco Editor ou SimpleMDE)
- `reading_time_minutes` (calculé automatiquement depuis la longueur du contenu)
- `related_product_ids` (searchable multi-select sur les produits publiés)
- `meta_title` / `meta_description` avec prévisualisation snippet
- Toggle `is_published` + `published_at` (date programmable)

---

## Contenu blog à rédiger (5 articles — sprints copy)

| Priorité | Titre                                | Keyword primaire             | Vol/mois | Longueur cible |
| -------- | ------------------------------------ | ---------------------------- | -------- | -------------- |
| 1        | Déco chambre adulte tendance 2026    | déco chambre adulte tendance | 16,000   | 1,500 mots     |
| 2        | Lampadaires design : comment choisir | lampadaire design            | 4,400    | 1,200 mots     |
| 3        | Décoration murale en bois : 12 idées | décoration murale bois       | 3,600    | 1,200 mots     |
| 4        | Tableau déco salon : guide           | tableau décoration salon     | 2,400    | 1,000 mots     |
| 5        | Lampe bureau design — sélection      | lampe de bureau design       | 1,600    | 1,000 mots     |

**Copy de ces articles = scope d'une prochaine session Cowork (pas encore rédigé).**

---

## Ordre d'exécution pour Claude Code

```
Sprint 0  → Migration DB (collections + articles)
Sprint 1  → Helper Cloudflare + next/image sur tous les composants existants
Sprint 2  → generateMetadata sur toutes les pages
Sprint 3  → JsonLd Schema.org (Organization layout + Product + Article)
Sprint 4  → sitemap.ts dynamique
Sprint 5  → robots.ts
Sprint 6  → Pages /magazine (liste + article) — SSG depuis table articles
Sprint 7  → Admin back-office — onglets SEO produits/collections + CRUD articles
```

**Sprints 0-5 sont bloquants pour le lancement SEO. Sprints 6-7 peuvent suivre.**

---

## Checklist lancement SEO (J0)

- [ ] `is_published_online = true` sur au moins 10 produits avec `slug` + `meta_title` + `meta_description` renseignés dans le back-office
- [ ] `is_published_online = true` sur 3 collections (salon, chambre, extérieur) avec `editorial_text` + `meta_title`
- [ ] `alt_text` renseigné sur l'image principale de chaque produit publié
- [ ] `sitemap.xml` généré et soumis à Google Search Console
- [ ] `robots.txt` en place
- [ ] Schema.org Organisation visible dans le source de la homepage
- [ ] Score Lighthouse Performance ≥ 90 sur homepage et une fiche produit
- [ ] Compte Google Search Console créé + propriété vérifiée

---

## Variables d'environnement à ajouter (site-internet)

```bash
# .env.local et .env.production (Vercel)
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH=xxx   # hash du compte Cloudflare Images
NEXT_PUBLIC_SITE_URL=https://veronecollections.fr
```
