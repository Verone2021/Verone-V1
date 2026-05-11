# Prompt Claude Code — SEO + pilotage site-internet depuis le back-office

## Mission

Tu vas auditer le back-office et le site-internet, puis implémenter les corrections et nouveaux champs nécessaires pour que l'équipe puisse configurer entièrement le SEO et le contenu du site depuis le back-office. Aucune hypothèse : tu lis les fichiers réels avant de toucher quoi que ce soit.

---

## Contexte projet

Monorepo Next.js 15, trois apps : `back-office` (port 3000), `site-internet` (port 3001), `linkme` (port 3002). Le back-office pilote le site-internet via Supabase. Le projet Supabase actif est `verone-backoffice` (ID : `aorroydfjsrygmosnzrl`).

Un audit a déjà été fait. Les constats sont documentés dans :

- `docs/scratchpad/dev-plan-2026-05-10-seo-site-backoffice.md` — specs complètes avec code à produire
- `docs/scratchpad/seo-strategy-2026-05-10.md` — stratégie SEO validée (mots-clés, clusters)
- `docs/scratchpad/seo-architecture-2026-05-10.md` — architecture URL, H1/H2/H3, Schema.org

**Lis ces trois fichiers en premier.**

---

## Ce que tu dois faire — liste ordonnée

### Étape 0 — Audit préalable (lis avant de toucher)

1. Lis `docs/scratchpad/dev-plan-2026-05-10-seo-site-backoffice.md` en entier
2. Lis les fichiers suivants pour vérifier l'état réel du code :
   - `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/EditSiteInternetProductModal/TabImages.tsx`
   - `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/EditSiteInternetProductModal/TabSEO.tsx`
   - `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/CollectionsSection.tsx`
   - `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/CMSSection.tsx`
   - `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/ConfigurationSection.tsx`
   - `apps/back-office/src/app/(protected)/canaux-vente/site-internet/hooks/use-site-internet-collections.ts`
   - `apps/site-internet/src/app/page.tsx` et `apps/site-internet/src/app/layout.tsx`
   - `apps/site-internet/src/components/home/HeroSection.tsx`
   - Le dossier `apps/site-internet/src/app/` pour inventorier toutes les pages existantes
3. Lis le schéma DB : `docs/current/database/schema/` (tables `products`, `collections`, `product_images`, `site_internet_config`, `site_content`)
4. Vérifie si une table `articles` existe dans Supabase : `mcp__supabase__list_tables`

Après l'audit, écris un plan en 3-6 bullets que tu exécutes sans redemander.

---

### Étape 1 — Corrections back-office (sprint BO)

#### 1a — Bug URL dans TabSEO produit [petit fix]

**Fichier :** `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/EditSiteInternetProductModal/TabSEO.tsx`

Le preview URL affiche `veronecollections.fr/produit/[slug]` — corriger en `veronecollections.fr/catalogue/[slug]`.

#### 1b — Champ `alt_text` éditable sur chaque image [TabImages]

**Fichier :** `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/EditSiteInternetProductModal/TabImages.tsx`

Actuellement : les images affichent `alt_text` en lecture seule (prop `alt={image.alt_text ?? ...}`).
**À faire :** Sous chaque carte image, ajouter un `<Input>` pour éditer `alt_text`. Le champ doit sauvegarder en base (`product_images.alt_text`) via un UPDATE Supabase onBlur. Libellé : "Texte alternatif (SEO + accessibilité)".

Vérifier si un hook `useUpdateImageAlt` ou similaire existe déjà. Sinon le créer dans `hooks/use-product-detail.ts` ou un nouveau fichier dédié. Respecter les standards data-fetching : `await queryClient.invalidateQueries()` dans `onSuccess`.

#### 1c — Champs SEO dans le modal d'édition Collection [CollectionFormModal]

**Fichiers à lire en premier :**

- `packages/@verone/common/src/components/collections/CollectionFormModal/` (ou chemin similaire — le trouver avec `grep -r "CollectionFormModal" packages/`)
- `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/CollectionsSection.tsx`

Le `CollectionFormModal` ne passe pas `meta_title` / `meta_description` en édition.
**À faire :**

- Ajouter les champs `meta_title` (max 60 chars, compteur) et `meta_description` (max 155 chars, compteur) dans le modal
- Mettre à jour le schema Zod du modal pour inclure ces champs
- Mettre à jour le hook de mise à jour collection pour sauvegarder ces champs
- Dans `CollectionsSection.tsx`, passer les nouvelles données via `handleFormSubmit`

#### 1d — Migration DB : champs manquants sur collections

**Créer la migration :** `supabase/migrations/YYYYMMDDHHMMSS_site_collections_seo_fields.sql`

```sql
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS editorial_text text,
  ADD COLUMN IF NOT EXISTS image_alt text;

COMMENT ON COLUMN collections.editorial_text IS 'Texte éditorial 100-200 mots visible sur la page collection — optimisé SEO';
COMMENT ON COLUMN collections.image_alt IS 'Texte alternatif image collection pour accessibilité et SEO';
```

Après migration : `python3 scripts/generate-docs.py --db` + régénérer types TS.

**Puis dans le `CollectionFormModal`** : ajouter les champs `editorial_text` (textarea 100-200 chars, compteur) et `image_alt` (input texte).

#### 1e — CMS Hero : câbler la table `site_content` vers le site-internet

**Contexte :** Le back-office édite `site_content` (Hero, Réassurance, Bandeau) via `CMSSection.tsx`. Mais `HeroSection.tsx` dans le site-internet affiche du copy **hardcodé** — il ne lit pas Supabase.

**À faire dans `apps/site-internet/src/components/home/HeroSection.tsx` :**
Transformer en Server Component qui lit `site_content` depuis Supabase :

```typescript
// Server Component — lecture depuis site_content
const supabase = createServerClient();
const { data: heroContent } = await supabase
  .from('site_content')
  .select('content_value')
  .eq('content_key', 'hero')
  .single();
// Fallback vers le copy hardcodé si null
```

Idem pour `NewsletterSection`, `EditorialBannerSection` si elles lisent des textes gérables.

**Important :** Si `site_content` n'a pas de row `hero` en base, créer le seed dans la migration ou en INSERT séparé avec les valeurs hardcodées actuelles (copy de `copy-homepage-2026-05-10.md`). Ne jamais laisser le site planter si la table est vide — toujours un fallback.

---

### Étape 2 — Migration DB : table `articles` (blog/magazine)

**Si la table n'existe pas en Supabase**, créer la migration :
`supabase/migrations/YYYYMMDDHHMMSS_site_articles.sql`

Specs complètes dans `docs/scratchpad/dev-plan-2026-05-10-seo-site-backoffice.md` — section "Sprint 0b".

Après migration : régénérer types, `generate-docs.py --db`.

---

### Étape 3 — Admin CRUD Articles dans le back-office [gros sprint]

**Objectif :** L'équipe peut créer, éditer, publier des articles de blog depuis le back-office, exactement comme elle gère les collections.

**Emplacement :** Ajouter un onglet "Articles" dans la page `/canaux-vente/site-internet` (à côté des onglets existants Dashboard, Produits, Collections, etc.)

**Fichiers à créer/modifier :**

- `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/ArticlesSection.tsx` — liste des articles + bouton créer
- `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/ArticleFormModal.tsx` — modal création/édition
- `apps/back-office/src/app/(protected)/canaux-vente/site-internet/hooks/use-site-internet-articles.ts` — hooks TanStack Query (list, create, update, delete, toggle publish)
- Ajouter l'onglet "Articles" dans `page.tsx` de `/canaux-vente/site-internet/`

**Champs du formulaire article :**

- `title` — Input texte (obligatoire)
- `subtitle` — Input texte (optionnel)
- `slug` — auto-généré depuis `title`, éditable, `font-mono`
- `category` — Select : "Inspiration" / "Guide" / "Tendance"
- `excerpt` — Textarea 150-200 chars max avec compteur (résumé pour les listes)
- `content_mdx` — Textarea grande (éditeur MDX, minimum viable : textarea Monaco ou SimpleMDE si disponible, sinon textarea simple)
- `cover_image_url` — Input URL (image de couverture — peut être une URL Cloudflare)
- `cover_image_alt` — Input texte
- `meta_title` — Input max 60 chars avec compteur
- `meta_description` — Textarea max 155 chars avec compteur
- `reading_time_minutes` — Calculé automatiquement (nombre de mots ÷ 200, affiché en lecture seule)
- `related_product_ids` — Multi-select sur les produits publiés (optionnel)
- `is_published` — Toggle Switch
- `published_at` — DateTime picker (publication planifiée)
- `tags` — Chips input (optionnel)

**Liste articles :** Tableau avec colonnes Titre, Catégorie, Statut (Brouillon/Publié), Date, Actions (Éditer / Supprimer / Toggle publié). Responsive via `ResponsiveDataView`.

---

### Étape 4 — Site-internet : generateMetadata + sitemap + robots

**Lire d'abord** le dossier `apps/site-internet/src/app/` pour voir quelles pages existent et si elles ont déjà des `generateMetadata`.

**À implémenter :**

#### 4a — generateMetadata sur chaque page

Specs complètes dans `dev-plan-2026-05-10-seo-site-backoffice.md` — Sprint 2. Pages concernées :

- Homepage (`/`) — metadata statique
- Catalogue (`/catalogue`) — metadata statique
- Fiche produit (`/catalogue/[slug]`) — metadata dynamique depuis DB (`products.meta_title`, `.meta_description`, image Cloudflare)
- À-propos, Collections, Contact — metadata statique depuis les copy files
- Collection (`/collections/[slug]`) — metadata dynamique depuis DB (`collections.meta_title`, `.meta_description`)
- Article (`/magazine/[slug]`) — metadata dynamique depuis DB

#### 4b — Schema.org JSON-LD

Créer `apps/site-internet/src/components/seo/JsonLd.tsx`.

- Organization dans `layout.tsx` racine
- Product dans les fiches produit
- Article dans les pages magazine
- CollectionPage dans les pages collection

Specs dans `dev-plan-2026-05-10-seo-site-backoffice.md` — Sprint 3.

#### 4c — sitemap.ts dynamique

`apps/site-internet/src/app/sitemap.ts` — Specs dans Sprint 4 du dev-plan.

#### 4d — robots.ts

`apps/site-internet/src/app/robots.ts` — 5 lignes, specs dans Sprint 5.

---

### Étape 5 — Pages Magazine dans le site-internet

**Si la table `articles` est créée et qu'il y a du contenu**, créer :

- `apps/site-internet/src/app/magazine/page.tsx` — liste des articles publiés (SSG, revalidate 3600)
- `apps/site-internet/src/app/magazine/[slug]/page.tsx` — article complet (SSG via `generateStaticParams`)

Specs dans `dev-plan-2026-05-10-seo-site-backoffice.md` — Sprint 6.

Design : respecter le design system Vérone (Bodoni Moda 900 titres, Montserrat body, DM Sans eyebrows, `#C9A961` or, `#1d1d1b` charbon, `border-radius: 0`, tutoiement).

---

### Étape 6 — Helper Cloudflare Images dans le site-internet

**Vérifier** si `apps/site-internet/src/lib/cloudflare.ts` existe. Si oui, lire son contenu. Si non, créer selon les specs dans Sprint 1 du dev-plan.

S'assurer que tous les `<Image>` du site-internet utilisent :

- `alt` non vide (valeur DB ou fallback construit)
- `priority` sur l'image above-the-fold de chaque page
- `sizes` adapté au contexte (grille catalogue vs hero vs card)
- L'URL Cloudflare via le helper (pas l'URL Supabase Storage legacy)

---

## Contraintes obligatoires

- **1 PR = 1 bloc cohérent.** Sprints 1-2 (back-office + migration DB) = 1 PR. Sprints 3-6 (site-internet) = 1 PR séparée.
- **Zéro push intermédiaire** entre les phases d'un même chantier. 1 push à la fin.
- **Lire avant de modifier.** Triple Lecture sur chaque fichier touché.
- **`select('*')` interdit.** Colonnes explicites.
- **`await queryClient.invalidateQueries()`** dans tous les `onSuccess`.
- **Responsive obligatoire** sur tous les nouveaux composants UI back-office : `ResponsiveDataView` pour les tableaux, `ResponsiveActionMenu` pour > 2 actions, touch targets 44px mobile.
- **Zéro `any` TypeScript.** Types `Database` de `@verone/types`.
- **Après chaque migration DB :** `python3 scripts/generate-docs.py --db` + régénérer types.
- **Roméo ne git jamais, ne lance jamais de terminal.** Tu fais tout. Tu communiques uniquement en français simple, sans jargon technique.
- **Auto-merge activé** dès `gh pr create` pour les sprints sans modification DB.

---

## Ordre d'exécution recommandé

```
1. Lire les 3 docs de contexte + auditer les fichiers listés
2. Établir le plan (3-6 bullets) — l'envoyer à Roméo
3. Sprint BO : fix bug slug + alt_text images + SEO collections + editorial_text migration + hero CMS câblé
4. Sprint DB articles : migration + types
5. Sprint BO articles : CRUD admin
6. Sprint Site : generateMetadata + Schema.org + sitemap + robots
7. Sprint Site : pages /magazine
8. Sprint Site : Cloudflare helper + audit images
```

Roméo donne UN GO à la fin de l'étape 2. Ensuite tu files sans interrompre.
