# Instructions pour Claude Code — Import articles blog Vérone

## Mission

Ces 5 fichiers `.md` sont les articles blog Vérone rédigés et validés avec de vrais produits (images Cloudflare + slugs Supabase).
Tu dois les importer dans la table `articles` de Supabase (projet `verone-backoffice`, ID : `aorroydfjsrygmosnzrl`).

## Format des fichiers

Chaque fichier contient :

- Un **frontmatter YAML** avec tous les champs de la table `articles`
- Un **corps MDX** avec des blocs `<!-- PRODUIT ... -->` (format YAML inline) là où des cartes produit doivent être insérées

## Ce que tu dois faire

### 1. Créer la table `articles` si elle n'existe pas

```sql
CREATE TABLE IF NOT EXISTS articles (
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

-- RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_published" ON articles FOR SELECT TO anon USING (is_published = true);
CREATE POLICY "staff_full_access" ON articles FOR ALL TO authenticated USING (is_backoffice_user());
```

### 2. Parser et insérer les 5 articles

- `is_published = false` (brouillons — Roméo publie manuellement)
- `content_mdx` = corps complet du fichier (après le frontmatter)
- `cover_image_url` = NULL (images à générer dans un second temps)
- `related_product_ids` = NULL (à câbler manuellement depuis le back-office)
- Les blocs `<!-- PRODUIT ... -->` restent dans le MDX — ils servent au rendu côté page Next.js

### 3. Après import

Confirmer les 5 slugs créés. Les articles doivent apparaître dans le back-office sous forme de brouillons.

## Correction à faire dans le même sprint

**`apps/site-internet/src/components/seo/JsonLdOrganization.tsx`**

Ce fichier a déjà été corrigé — vérifier que les valeurs sont bien :

- `email: 'contact@verone.fr'` (pas de telephone)
- `sameAs: ['https://www.instagram.com/veronecollections', 'https://www.facebook.com/veronecollections']`

## Fichiers articles (noms définitifs)

1. `01-deco-chambre-adulte-tendance-2026.md` — Déco chambre adulte tendance 2026
2. `02-lampadaire-design-comment-choisir.md` — Lampadaire design : comment choisir
3. `03-decoration-murale-naturelle-raphia-paille.md` — Décoration murale naturelle : raphia, paille tressée
4. `04-miroirs-composition-murale-salon.md` — Miroir déco salon : compositions murales
5. `05-lampe-table-design-choisir.md` — Lampe de table design : comment choisir
