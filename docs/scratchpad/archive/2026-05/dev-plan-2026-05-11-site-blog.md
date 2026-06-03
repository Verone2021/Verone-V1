# Plan — Pages Blog Vérone : `/blog` et `/blog/[slug]`

**Date** : 2026-05-11  
**Scope** : Design Stitch (Roméo) + Import Supabase (Claude Code) + Pages Next.js (Claude Code)  
**Tâches** : SITE-BLOG-001 (template article) · SITE-BLOG-002 (import Supabase) · SITE-BLOG-003 (liste articles)

---

## Séquence d'exécution

1. **Roméo** → design Stitch : 2 frames (liste + article)
2. **Claude Code** → SITE-BLOG-002 : créer table `articles` + importer les 5 MDX (pas de dépendance au design)
3. **Claude Code** → SITE-BLOG-001 + 003 : coder les pages depuis les frames Stitch validées

---

## SITE-BLOG-002 — Import Supabase (peut démarrer sans Stitch)

### Table `articles` à créer

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('Inspiration', 'Guide', 'Tendance')),
  excerpt TEXT NOT NULL,
  content_mdx TEXT NOT NULL,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  meta_title TEXT,
  meta_description TEXT,
  reading_time_minutes INTEGER DEFAULT 5,
  related_product_ids UUID[],
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Source des articles

Fichiers dans `docs/content/articles/*.md` (5 articles, format MDX avec frontmatter YAML).  
Parser : lire le frontmatter YAML + le corps MDX. Les blocs `<!-- PRODUIT ... -->` restent dans le MDX — ils seront rendus côté page Next.js.

### RLS

- Lecture publique (anon) pour `is_published = true`
- Staff full access via `is_backoffice_user()`

### Référence complète

Voir `docs/content/articles/README-CLAUDE-CODE.md` pour les instructions détaillées.

---

## SITE-BLOG-001 — Page article `/blog/[slug]`

### Structure de la page (desktop 1440px, mobile 375px)

```
┌─────────────────────────────────────────────────────┐
│ HEADER GLOBAL (nav existante)                       │
├─────────────────────────────────────────────────────┤
│ BREADCRUMB                                          │
│ Accueil > Blog > [Titre tronqué]                    │
├─────────────────────────────────────────────────────┤
│ HERO ARTICLE                                        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Cover image 100% width, ratio 16:9, object-fit  │ │
│ │ cover — overlay charbon 30% sur le bas          │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ CATÉGORIE (pill or doré DM Sans uppercase)  │ │ │
│ │ │ TITRE (Bodoni Moda 900, 48px desktop)       │ │ │
│ │ │ SOUS-TITRE (Montserrat 400, 20px, #888)     │ │ │
│ │ │ Temps lecture · Date publication            │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ CORPS ÉDITORIAL (max-width 720px centré)            │
│                                                     │
│  Texte long format :                                │
│  - Paragraphes : Montserrat 400, 17px, line-height  │
│    1.8, color #1d1d1b                               │
│  - H2 : Bodoni Moda 900, 28px, margin-top 48px      │
│  - H3 : Montserrat 600, 18px uppercase, tracking    │
│  - Séparateur HR : 1px or #C9A961, width 60px       │
│                                                     │
│  BLOCS PRODUIT (intégrés dans le corps) :           │
│  ┌─────────────────────────────────────────────┐    │
│  │ IMAGE produit 4:3 (gauche, 280px desktop)   │    │
│  │ Nom produit — Bodoni 28px                   │    │
│  │ Nom commercial — Montserrat 400 14px        │    │
│  │ [Voir le produit →] CTA gold underline      │    │
│  └─────────────────────────────────────────────┘    │
│  (sur mobile : image pleine largeur, texte dessous) │
│                                                     │
├─────────────────────────────────────────────────────┤
│ BLOC "ARTICLES SIMILAIRES" (fond charbon #1d1d1b)   │
│ Titre : "D'autres idées" — Bodoni 32px blanc        │
│ Grille 3 cards (voir spec card ci-dessous)          │
├─────────────────────────────────────────────────────┤
│ FOOTER GLOBAL (existant)                            │
└─────────────────────────────────────────────────────┘
```

### Composant Card article (réutilisé liste + similaires)

```
┌──────────────────────────────────┐
│ Image cover 3:2 ratio            │
│ object-fit: cover                │
│ (pas de radius)                  │
├──────────────────────────────────┤
│ CATÉGORIE — DM Sans uppercase    │
│ doré #C9A961, 11px, tracking 2px │
├──────────────────────────────────┤
│ TITRE — Bodoni Moda 900, 20px    │
│ 2 lignes max, ellipsis           │
├──────────────────────────────────┤
│ EXTRAIT — Montserrat 400, 14px   │
│ 3 lignes max, ellipsis           │
│ color #555                       │
├──────────────────────────────────┤
│ Temps lecture · →                │
└──────────────────────────────────┘
```

### Contraintes design system à respecter

- `border-radius: 0` partout sauf pills catégorie (`border-radius: 999px`)
- Palette : or `#C9A961` · charbon `#1d1d1b` · blanc `#FFFFFF` · gris texte `#555`
- Bodoni Moda 900 → titres et noms de produits
- Montserrat 400/500 → body, extraits, labels
- DM Sans Light UPPERCASE → catégories, eyebrows, temps lecture
- Tutoiement dans tous les CTAs et incitatifs
- Pas d'ombre portée sur les cards — frontières 1px charbon ou sans bordure

---

## SITE-BLOG-003 — Page liste `/blog`

### Structure

```
┌─────────────────────────────────────────────────────┐
│ HERO LISTE (fond charbon)                           │
│ BLOG — Bodoni Moda 900, 64px, blanc                 │
│ "Idées, guides et tendances pour ton intérieur"     │
│ Montserrat 400, 18px, blanc 80%                     │
├─────────────────────────────────────────────────────┤
│ FILTRES CATÉGORIE (pills horizontaux)               │
│ Tous · Inspiration · Guide · Tendance               │
│ Pill actif : fond or #C9A961, texte charbon         │
│ Pill inactif : bordure charbon, texte charbon       │
├─────────────────────────────────────────────────────┤
│ GRILLE ARTICLES                                     │
│ Desktop : 3 colonnes, gap 32px                      │
│ Tablet : 2 colonnes                                 │
│ Mobile : 1 colonne                                  │
│ (Cards = spec ci-dessus)                            │
├─────────────────────────────────────────────────────┤
│ FOOTER GLOBAL (existant)                            │
└─────────────────────────────────────────────────────┘
```

---

## Frames Stitch à créer

| Frame                      | Dimensions | Priorité |
| -------------------------- | ---------- | -------- |
| Article template — desktop | 1440×auto  | P0       |

| Liste blog — desktop | 1440×auto | P1 |

**Référence projet Stitch** : https://stitch.withgoogle.com/u/2/projects/8938114923283947241?pli=1  
Ajouter dans le même projet, section "Blog".

---

## generateMetadata (Claude Code — SITE-BLOG-001)

```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  return {
    title: article.meta_title ?? `${article.title} | Vérone`,
    description: article.meta_description ?? article.excerpt,
    openGraph: {
      title: article.meta_title,
      description: article.meta_description,
      images: [{ url: article.cover_image_url, alt: article.cover_image_alt }],
      type: 'article',
      publishedTime: article.published_at,
      tags: article.tags,
    },
  };
}
```

### Schema.org Article (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[title]",
  "description": "[excerpt]",
  "image": "[cover_image_url]",
  "author": { "@type": "Organization", "name": "Vérone" },
  "publisher": { "@type": "Organization", "name": "Vérone", "logo": "..." },
  "datePublished": "[published_at]",
  "keywords": "[tags joints par virgule]"
}
```

---

## Points d'attention pour Claude Code

- Les blocs `<!-- PRODUIT ... -->` dans le MDX doivent être parsés côté rendering pour injecter les vrais composants React avec image + CTA
- `generateStaticParams()` obligatoire pour que les pages soient générées statiquement à la build
- Liens internes produits : `/produits/[slug]` (vérifier que la route existe avant de coder)
- Images couverture : pour l'instant URL vide ou placeholder — les images Gemini arriveront dans un second temps
