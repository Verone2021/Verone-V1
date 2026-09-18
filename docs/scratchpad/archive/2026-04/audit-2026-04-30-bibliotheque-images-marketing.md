# Audit final — Studio Marketing Vérone Group (multi-marques)

**Date** : 2026-04-30
**Auteur** : Coordinateur (Claude)
**Statut** : Audit v4 — partiellement OBSOLÈTE, voir docs corrigés ci-dessous
**Pour** : Roméo (Vérone)

> ⚠️ **CORRECTION FINALE v5 (2026-04-30 fin de session)** : ce document a été restructuré 5 fois durant la session. Les sources de vérité finales sont :
>
> - **`docs/scratchpad/audit-marques-canaux-2026-04-30.md`** — audit factuel verrouillé
> - **`.claude/work/BO-BRAND-MKT-roadmap-v3.md`** — **ROADMAP CONSOLIDÉE FINALE** : fondations multi-marques d'abord (BO-BRAND-001 à 007), puis marketing (BO-MKT-001 à 004).
> - `docs/scratchpad/brief-BO-BRAND-001-rename-manufacturer.md` — brief atomique du renommage `products.brand` → `manufacturer`
> - `docs/scratchpad/brief-BO-MKT-001-phase1-dam.md` — RENUMÉROTÉ en `[BO-BRAND-002]` table brands
>
> **Reste valide dans ce document** : philosophie générale du DAM (§ 3-4), reco Cloudflare vs Cloudinary (§ 4), réflexion Metricool vs natif (§ 6), matrices de prompts (§ 5 Module 2).
>
> **OBSOLÈTE dans ce document** : tout l'ordre des phases. Le marketing n'est plus en premier. Les fondations multi-marques (renommage manufacturer → table brands → canaux par marque → RPC paramétrée → 4 apps Next.js) doivent venir d'abord (~3-4 semaines de dev). Le marketing devient `[BO-MKT-001]` Bibliothèque DAM, après que les fondations soient stables (~8-10 semaines totales avant un système marketing fonctionnel).

> Historique : v1 recommandait Cloudinary à tort (pas d'audit stack). v2 corrigeait avec Cloudflare Images. v3 intègre la stratégie multi-marques. v4 corrige le concept enseignes vs brands et l'ordre des phases.

---

## 1. Contexte stratégique validé

**Groupe Vérone** = 4 marques distinctes :

- **Vérone** (marque mère, généraliste premium déco/mobilier)
- **Bohemia** (ambiance bohème + plage)
- **Solar** (électronique, luminaire, spot, powerbank)
- **Flos** (plantes séchées + bougies)

Chaque marque aura son **propre site Next.js** dans le monorepo (`apps/bohemia`, `apps/solar`, `apps/flos` à venir) + ses **comptes sociaux** (IG + FB déjà créés, à configurer + Pinterest/TikTok à créer).

**Canaux cibles** sur 6-12 mois : Meta (FB + IG), Pinterest, TikTok, LinkedIn → 4 marques × 4 canaux = **16 channels** à orchestrer.

**Équipe** : Roméo + 1 community manager → workflow d'approbation obligatoire.

**Budget outils** : 30-100 €/mois.

---

## 2. Stack actuel (audit confirmé)

11 intégrations actives chez Vérone :

- **Cloudflare Images** ACTIF depuis 2026-04-21 (CDN + variants + custom domain `images.veronecollections.fr`)
- **Supabase** cloud (DB + Auth + Storage + Realtime + Edge Functions)
- **Vercel** (hosting + 1 cron Meta Commerce)
- **Qonto** (factures, devis, avoirs)
- **Packlink** (expéditions)
- **Google Merchant Center** (sync produits)
- **Meta Commerce** (catalog FB/IG actif)
- **Stripe** (paiements site-internet)
- **Resend** (emails)
- **MapLibre** (cartes)
- **GitHub Actions** (5 workflows)

---

## 3. Architecture cible

### Principe : PIM/DAM centralisé + Hub social externe + outils natifs gratuits

```
                    ┌──────────────────────────────────────────┐
                    │     BACK-OFFICE VÉRONE GROUP             │
                    │  (PIM + DAM + Studio + Tracker)          │
                    │                                          │
                    │  - Supabase DB (source de vérité)        │
                    │  - Cloudflare Images (assets)            │
                    │  - Matrice prompts Nano Banana           │
                    │  - Workflow validation Toi ↔ CM          │
                    └──────────────────────────────────────────┘
                                      │
                  ┌───────────────────┼───────────────────┐
                  │                   │                   │
                  ▼                   ▼                   ▼
         ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
         │  4 SITES NEXT  │  │  METRICOOL     │  │  ADS NATIFS    │
         │                │  │  (Hub social)  │  │  (gratuit)     │
         │  apps/         │  │                │  │                │
         │   site-internet│  │  Schedule +    │  │  Meta Ads      │
         │   bohemia      │  │  Analytics +   │  │  Pinterest Ads │
         │   solar        │  │  Approbation   │  │  TikTok Ads    │
         │   flos         │  │                │  │                │
         └────────────────┘  └────────────────┘  └────────────────┘
                                      │
                              ┌───────┴───────┐
                              ▼               ▼
                        ┌──────────┐   ┌──────────┐
                        │  Meta    │   │ Pinterest│
                        │  FB+IG   │   │  TikTok  │
                        │  ×4      │   │  LinkedIn│
                        └──────────┘   └──────────┘
```

### Stack outils définitif

| Couche                            | Outil                                     | Coût           |
| --------------------------------- | ----------------------------------------- | -------------- |
| Stockage assets + CDN             | Cloudflare Images (existant)              | ~5 €/mois      |
| PIM + DAM + Studio                | Back-office Vérone (custom)               | 0              |
| Hub social (4 marques × 4 canaux) | **Metricool Advanced** (15 brands inclus) | ~67 €/mois     |
| Pubs payantes Meta + DPA          | Meta Ads Manager (natif, deep-link)       | gratuit        |
| Pubs payantes Pinterest           | Pinterest Ads (natif, deep-link)          | gratuit        |
| Pubs payantes TikTok              | TikTok Ads (natif, deep-link)             | gratuit        |
| Stories Highlights, Reels collab  | Meta Business Suite (natif)               | gratuit        |
| Génération images IA              | Nano Banana (manuel via prompts)          | 0              |
| **TOTAL outils marketing**        |                                           | **~72 €/mois** |

---

## 4. Schéma DB DAM multi-marques

```sql
-- Référentiel marques
brands (
  id uuid PK,
  slug text UNIQUE NOT NULL,        -- 'verone' | 'bohemia' | 'solar' | 'flos'
  name text NOT NULL,
  brand_color text,
  logo_asset_id uuid,
  social_handles jsonb,             -- {instagram: "@bohemia.verone", facebook: "..."}
  metricool_brand_id text,          -- ID externe Metricool
  is_active bool DEFAULT true
)
-- Seed: 4 lignes (verone, bohemia, solar, flos)

-- Bibliothèque centrale (DAM)
media_assets (
  id uuid PK,
  storage_path text NOT NULL,
  cloudflare_image_id text,
  public_url text,

  -- Métadonnées techniques
  width int, height int, file_size bigint, format text, mime_type text,

  -- Classification
  asset_type text NOT NULL,          -- 'product' | 'lifestyle' | 'banner' | 'social' | 'logo' | 'video'
  tags text[],
  alt_text text,

  -- Multi-marques
  brand_ids uuid[],                  -- [verone_id, bohemia_id] — un asset peut servir N marques
  brand_specific_captions jsonb,     -- {"verone": "Caption neutre", "bohemia": "Caption bohème"}

  -- Visibilité par canal
  eligible_channels text[],          -- ['meta', 'pinterest', 'tiktok', 'linkedin']
  visible_on_back_office bool DEFAULT true,

  -- Conformité
  contains_persons bool DEFAULT false,
  consent_obtained bool DEFAULT false,

  -- Traçabilité IA
  ai_generated bool DEFAULT false,
  ai_model text,                     -- 'nano-banana-2' | 'nano-banana-pro'
  ai_prompt text,
  ai_source_image_ids uuid[],

  -- Audit
  created_by uuid, created_at, updated_at
)

-- Liaisons multi-cible
media_asset_links (
  id uuid PK,
  media_asset_id uuid FK,
  linkable_type text,                -- 'product' | 'collection' | 'campaign'
  linkable_id uuid,
  display_order int,
  is_primary bool,
  brand_id uuid FK brands(id),       -- ce lien est valide pour QUELLE marque ?
  UNIQUE(media_asset_id, linkable_type, linkable_id, brand_id)
)

-- Tracker publications
media_asset_publications (
  id uuid PK,
  media_asset_id uuid FK,
  brand_id uuid FK,                  -- publié sous QUELLE marque
  channel text NOT NULL,             -- 'meta_feed' | 'meta_story' | 'meta_reel' | 'pinterest' | 'tiktok' | 'linkedin'
  scheduled_at timestamptz,
  published_at timestamptz,
  status text,                       -- 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'failed'
  approved_by uuid,

  -- Liens externes
  metricool_post_id text,
  external_post_url text,            -- URL du post une fois publié

  -- Métriques (pull via Metricool API)
  impressions int,
  engagement int,
  clicks int,
  conversions int,
  metrics_last_synced_at timestamptz,

  -- Lien produit (pour le tracker "produits jamais publiés")
  product_id uuid FK,

  created_at, updated_at
)

-- Étendre products
ALTER TABLE products ADD COLUMN brand_ids uuid[]; -- liste des marques sous lesquelles ce produit est listé
```

### RLS multi-marques

Pattern : staff backoffice voit tout via `is_backoffice_user()`. Le community manager voit uniquement les marques auxquelles il a accès via une nouvelle table `user_brand_access (user_id, brand_id, role)`.

---

## 5. Modules Studio Marketing à construire

### Module 1 — Bibliothèque (DAM)

- Grille filtrable : marque, canal, type, tag, statut publication, AI, date
- Upload drag-drop multiple
- Édition métadonnées (tags, captions par marque, eligible_channels)
- Lien vers produit(s) avec choix de marque

### Module 2 — Studio Marketing (page `/marketing/studio` dans le back-office)

**3 onglets dans une seule page intégrée au back-office** (pas d'artifact séparé, pas de Drive).

**Onglet 2.A — Générateur de prompts**

- Matrices par marque (Vérone neutre / Bohemia plage / Solar tech / Flos nature)
- Formulaire : marque + produit (autocomplete DB) + preset (parmi les 27 livrés) → prompt structuré généré (Subject + Action + Scene + Camera + Lighting + Realism + Format)
- Bouton "Copier le prompt" + bouton "Ouvrir Gemini" (lien externe nouvel onglet)
- Banque de prompts personnalisés (table `marketing_prompt_presets` + UI CRUD)

**Onglet 2.B — Créer une fiche produit depuis une photo** (demande Roméo 2026-04-30)

- Drop d'une photo → appel API Gemini Vision (vision multimodale)
- Extraction automatique : catégorie probable (croisée `categories`), sous-catégorie, famille, nom suggéré, couleur dominante, matières, dimensions visuelles estimées, description marketing 200-300 car. ton Vérone, tags
- Formulaire produit pré-rempli avec ces champs → utilisateur valide/ajuste/complète (prix, fournisseur, stock)
- À la création : insertion dans `products` + insertion dans `media_assets` + lien `media_asset_links` + `ai_described = true` + prompt stocké
- Coût indicatif Gemini Vision : ~0,002 € par appel = négligeable

**Onglet 2.C — Itérer sur une image existante** (demande Roméo 2026-04-30)

- Sélection d'une image source (depuis bibliothèque ou produit)
- Génération automatique de 3 propositions de prompt orientées : packshot fond blanc, lifestyle marque actuelle, lifestyle marque sœur
- Bouton "Copier ce prompt" + bouton "Ouvrir Gemini avec image source"
- Zone "Résultat à valider" (drop image générée)
- 3 actions : ✅ Valider (rejoint bibliothèque + lien produit + ai_generated=true) / 🔄 Ajuster prompt (éditeur inline + relance) / ❌ Rejeter

**Prérequis Phase 2** :

- Souscription API Gemini (clé API dans `.env.local`, variable `GEMINI_API_KEY`)
- Budget mensuel max à valider avec Roméo (estimation : <5 €/mois pour 200 fiches/mois)
- Composant `<PromptBuilder>` dans nouveau package `packages/@verone/marketing`
- Import des 27 presets de `matrices-prompts-nano-banana-2026-04-30.md` comme données seed

**Pourquoi tout intégré dans le back-office (pas d'artifact Cowork)** : la donnée (produits, images, marques) vit dans Supabase. Un artifact externe créerait une double source de vérité — exactement le problème que la stratégie DAM cherche à éviter.

### Module 3 — Tracker publications

- Vue par produit : "Jamais publié sur Pinterest", "Saturé sur Meta (3x en 30 jours)"
- Vue par marque : calendrier éditorial mensuel
- Saisie manuelle d'abord, puis pull automatique via Metricool API en Phase 3

### Module 4 — Deep-links Ads Managers

- Sur fiche produit : boutons "Créer pub Meta", "Créer pub Pinterest", "Créer pub TikTok"
- Pré-rempli avec produit catalog + image sélectionnée + UTM auto
- Lecture des Ad Sets actifs via Meta Graph API (gratuit, lecture seule)

### Module 5 — Workflow Toi ↔ CM

- États : `draft → pending_approval → approved → scheduled → published`
- Notifications email (Resend déjà branché) à chaque transition
- CM crée → Toi reçois notif → tu valides → push automatique vers Metricool

### Module 6 — Hashtags + Copy variations par marque

- Banque de hashtags par catégorie + marque
- 3-5 variantes de caption par produit + marque (une fois rédigées, elles servent toutes les futures publications)

---

## 6. Ce que Roméo a oublié (à intégrer dès le départ)

1. **Pixel Meta sur 4 sites** (Vérone existant + 3 à venir). Sans ça : 0 attribution conversion.
2. **Pinterest Tag** sur les 4 sites.
3. **TikTok Pixel** sur les 4 sites.
4. **LinkedIn Insight Tag** si LinkedIn dans les canaux finaux.
5. **UTM auto** sur toute URL produit générée par le back-office.
6. **Conformité droit à l'image** : flag `contains_persons` + `consent_obtained` dans `media_assets`.
7. **Catalog Pinterest** (équivalent Meta Commerce déjà branché). À setup pour activer Rich Pins + Catalog Ads Pinterest.
8. **A/B testing visuel** : `variant_group_id` dans `media_assets` pour grouper 2-3 visuels d'un même produit et comparer perfs.
9. **Saturation alerte** : la même image ne doit pas être republiée à moins de 14 jours d'écart sur la même marque.
10. **Brand Safety** : règle "jamais publier le même produit sur Vérone et Solar le même jour" si ce produit est cross-marques.

---

## 7. Plan d'attaque définitif

```
PHASE 0 — Setup externe (Roméo, sans dev) — 1 à 2 semaines
  ├─ Meta Business Manager "Vérone Group" + 4 Pages FB + 4 IG Business + liaisons
  ├─ Pinterest Business × 4 + connection catalog
  ├─ TikTok Business × 4 (ou 1 si tu mutualises)
  ├─ Comptes Metricool Advanced + branchement 16 channels + token API
  ├─ Pixels installés sur site-internet existant + plan d'install pour les 3 futurs
  └─ Définition des 4 chartes visuelles marques (presets prompts)

PHASE 1 — DAM multi-marques (3 sprints, ~3 semaines)
  ├─ Migration DB : brands + media_assets + media_asset_links + brand_ids products
  ├─ Régénération types Supabase (cf. règle branch-strategy.md Q4)
  ├─ UI Bibliothèque (filtres, upload, tags, multi-marques)
  ├─ Migration douce des product_images existantes
  └─ RLS multi-marques + table user_brand_access

PHASE 2 — Studio Prompts Nano Banana (2 sprints, ~10 jours)
  ├─ Matrices par marque (4 chartes)
  ├─ Générateur prompt + reverse prompt
  └─ Import workflow image générée

PHASE 3 — Connecteur Metricool API (1 sprint, ~1 semaine)
  ├─ Push publication depuis back-office vers Metricool
  ├─ Pull analytics dans tracker back-office
  └─ Workflow validation Toi ↔ CM

PHASE 4 — Deep-links Ads Managers + UTM auto (1 sprint, ~1 semaine)
  ├─ Boutons "Créer pub Meta/Pinterest/TikTok" sur fiche produit
  ├─ UTM auto sur tous liens produit
  └─ Vue "Produits jamais publiés" + saturation par marque

PHASE 5 — Optimisations (à mesurer)
  ├─ A/B testing visuel automatisé
  ├─ Caption auto-générée depuis fiche produit (Gemini API)
  └─ Catalog Pinterest sync (équivalent Meta Commerce)
```

---

## 8. Sources

- [Metricool API Documentation](https://help.metricool.com/en/category/api-integrations-dc0snw/)
- [Metricool Pricing 2026](https://metricool.com/pricing/)
- [Metricool MCP Server (GitHub)](https://github.com/metricool/mcp-metricool)
- [Meta Business Suite Scheduling 2026](https://www.facebook.com/business/help/942827662903020)
- [Instagram Content Scheduling Update 2026](https://almcorp.com/blog/instagram-content-scheduling-all-users-2026/)
- [Nano Banana Image Generation — Google AI](https://ai.google.dev/gemini-api/docs/image-generation)
- [Ultimate Prompting Guide for Nano Banana — Google Cloud](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana)
- [DeepMind Nano Banana Prompt Guide](https://deepmind.google/models/gemini-image/prompt-guide/)
