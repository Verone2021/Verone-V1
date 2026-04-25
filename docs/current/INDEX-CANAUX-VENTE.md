# INDEX — Canaux de vente Verone

Sommaire unique de toute la documentation liée aux canaux de vente : règles métier, configurations, credentials, intégrations, plans de refonte.

**Dernière mise à jour** : 2026-04-25

---

## 1. Sources de vérité actuelles (à lire en priorité)

| Fichier                                          | Contenu                                                                                  | Statut                                                                |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `docs/current/canaux-vente-publication-rules.md` | Règle métier de publication (cascade Site Internet → Google + Meta, indépendance LinkMe) | ✅ À jour 2026-04-25                                                  |
| `docs/current/database/schema/02-produits.md`    | Schema DB produits (colonnes publication, channel_pricing)                               | ✅ À jour (auto-régénéré par `python3 scripts/generate-docs.py --db`) |
| `docs/current/INDEX-PAGES-BACK-OFFICE.md`        | Liste des 147 pages BO dont domaine canaux-vente                                         | ✅ Auto-généré                                                        |

---

## 2. Documentation restaurée (à valider / mettre à jour)

Documentation historique restaurée depuis git history le 2026-04-25 (perte suite à un nettoyage non documenté). À confronter au code actuel avant promotion vers `docs/current/`.

### 2.1 Google Merchant Center (`docs/restored/google-merchant-2025-11/`)

10 fichiers — **dernière révision Nov 2025**, à valider vs code actuel :

| Fichier                                               | Contenu                                              | À faire                                                                                                                                                                                                                            |
| ----------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                                           | Sommaire intégration                                 | Mettre à jour les liens internes                                                                                                                                                                                                   |
| `GOOGLE-MERCHANT-SERVICE-ACCOUNT-CREDENTIALS.md`      | Credentials Service Account + variables `.env.local` | ⚠️ **Vérifier que les credentials sont toujours valides** (Service Account `google-merchant-verone@make-gmail-integration-428317.iam.gserviceaccount.com`, Project `make-gmail-integration-428317`, Merchant Account `5495521926`) |
| `GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md`           | Guide configuration complet                          | Confronter avec routes API actuelles `/api/google-merchant/*`                                                                                                                                                                      |
| `GOOGLE-MERCHANT-DOMAIN-VERIFICATION.md`              | Vérification domaine `veronecollections.fr`          | Vérifier statut actuel                                                                                                                                                                                                             |
| `GOOGLE-MERCHANT-INTEGRATION-PLAN-COMPLET.md`         | Plan d'intégration historique                        | Garder pour contexte historique                                                                                                                                                                                                    |
| `GOOGLE-MERCHANT-RESUME-EXECUTIF.md`                  | Résumé exécutif                                      | Mettre à jour avec l'état actuel                                                                                                                                                                                                   |
| `RAPPORT-ORCHESTRATION-GOOGLE-MERCHANT-2025-11-06.md` | Rapport d'orchestration de la sync                   | Confronter avec implémentation actuelle                                                                                                                                                                                            |
| `google-merchant-setup.md`                            | Setup technique                                      | Mettre à jour                                                                                                                                                                                                                      |
| `feeds-specifications-google.md`                      | Spécifications du feed Google Shopping (31 colonnes) | Mettre à jour                                                                                                                                                                                                                      |

### 2.2 Meta Commerce / Facebook (`docs/restored/meta-facebook-feeds/`)

| Fichier                            | Contenu                              | À faire                                           |
| ---------------------------------- | ------------------------------------ | ------------------------------------------------- |
| `feeds-specifications-facebook.md` | Spécifications feed Facebook Catalog | Vérifier vs implémentation actuelle Meta Commerce |

**⚠️ Documentation Meta Commerce manquante** — pas de credentials documentés, pas de guide configuration. Tâche : reconstituer la doc Meta Commerce (catalog_id, business_id, system user token) à partir de `apps/back-office/.env.local` et de l'historique git complet.

### 2.3 Canaux de vente — module 13 (`docs/restored/canaux-vente-2025/`)

8 fichiers — **dernière révision Nov 2025 - Jan 2026** :

| Fichier                             | Contenu                                                           | À faire                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `README.md`                         | Vue d'ensemble module canaux-vente (5 canaux + roadmap Phase 1-4) | Mettre à jour : LinkMe + Site Internet + Meta + Google + Manuel sont les canaux actuels |
| `AUDIT-COMPLET-LINKME-2025-12.md`   | Audit complet workflow LinkMe                                     | À confronter avec l'app LinkMe actuelle                                                 |
| `AUDIT-LINKME-WORKFLOWS-2026-01.md` | Audit workflows LinkMe (sélections, commissions)                  | À confronter                                                                            |
| `PRESENTATION-LINKME-FIGMA.md`      | Design LinkMe (référence Figma)                                   | Garder pour référence design                                                            |
| `futurs-canaux.md`                  | Roadmap Instagram, Facebook Marketplace, TikTok                   | Mettre à jour (Meta Commerce déjà actif, Instagram Shopping intégré via Meta)           |
| `11-canaux-vente.md`                | Audit BO canaux-vente Janvier 2026                                | À confronter avec implémentation actuelle                                               |
| `TEST-PLAN-REFONTE-CANAUX.md`       | Plan de tests refonte                                             | À adapter aux changements en cours                                                      |

### 2.4 Catalogue produit (`docs/restored/catalogue-2025/`)

12 fichiers — concerne la fiche produit et l'architecture catalogue.

| Fichier                                                  | Contenu                                                   | À faire                                                   |
| -------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| `catalogue.md`                                           | Règles métier catalogue                                   | Mettre à jour                                             |
| `README.md`, `components.md`, `hooks.md`, `workflows.md` | Doc module produits                                       | Confronter avec architecture actuelle                     |
| `CATALOGUE-ANALYSIS-2025.md`, `COMPOSANTS-CATALOGUE.md`  | Analyses architecture                                     | Garder pour contexte historique                           |
| `pricing-multi-canaux-clients.md`                        | Architecture pricing multi-canaux (waterfall + ristourne) | ⚠️ Important — à confronter avec règles finance actuelles |
| `PRD-CATALOGUE-CURRENT.md`                               | PRD catalogue (rare doc produit)                          | À mettre à jour                                           |

---

## 3. Routes API par canal (à auditer / créer)

### 3.1 Routes existantes (à confirmer)

- `apps/back-office/src/app/api/channel-pricing/upsert/route.ts` — édition prix par canal (✅ confirmé existant)
- `apps/back-office/src/app/api/google-merchant/*` — sync Google Merchant (à auditer)
- `apps/back-office/src/app/api/meta-commerce/*` — sync Meta Commerce (à auditer)

### 3.2 Routes à créer pour pilotage publication

Voir `docs/current/canaux-vente-publication-rules.md#routes-api-attendues`.

---

## 4. Pages back-office par canal

### 4.1 Cartographie réelle (audit 2026-04-25)

```
apps/back-office/src/app/(protected)/canaux-vente/
├── page.tsx                                            # Hub canaux
├── prix-clients/                                       # Prix client personnalisés (customer_pricing)
├── site-internet/
│   ├── page.tsx                                        # Dashboard Site Internet (Produits, Collections, Catégories, Clients, CMS, Config)
│   └── produits/[id]/page.tsx                          # Détail produit Site Internet (toggle publier indirect via ProductPricingSection)
├── linkme/                                             # 26 pages
│   ├── page.tsx                                        # Hub LinkMe
│   ├── catalogue/
│   │   ├── page.tsx                                    # Liste catalogue LinkMe
│   │   ├── [id]/page.tsx                               # ✅ Détail produit LinkMe (toggle is_enabled, is_featured, is_public_showcase, show_supplier)
│   │   ├── configuration/page.tsx
│   │   ├── fournisseurs/page.tsx
│   │   └── vedettes/page.tsx
│   ├── commandes/                                      # 3 pages
│   ├── selections/                                     # 3 pages
│   ├── analytics/, configuration/                      # Hubs
│   └── ...                                             # commissions, utilisateurs, enseignes, organisations, etc.
├── google-merchant/
│   └── page.tsx                                        # Dashboard avec tabs (Synced / Add) + toggle visibility par ligne
└── meta/                                               # ⚠️ chemin réel `meta`, PAS `meta-commerce`
    └── page.tsx                                        # Dashboard structure identique Google Merchant — toggle visibility ABSENT (à créer)
```

**Constat principal** : la page **Meta Commerce** existe mais n'a **pas de route API toggle visibility** ni de bouton fonctionnel — seule route existante : `POST /api/meta-commerce/sync-statuses`. C'est ce que Romeo a remarqué (« Meta a été oublié »).

**Constat LinkMe** : le toggle publier existe déjà au niveau **catalogue BO** via `useToggleLinkMeProductField('is_enabled', boolean)` qui flippe `channel_pricing.is_active`. Il faut donc le réutiliser depuis l'onglet Publication de la fiche produit, pas le réinventer.

---

## 5. Apps consommatrices

### 5.1 `apps/site-internet`

- URL produit publique : `https://veronecollections.fr/produits/[slug]`
- Pages : `/catalogue`, `/produit/[slug]`, `/panier`, `/checkout`
- Toggle dépublier depuis l'app : à confirmer (probablement non — l'app est en lecture seule sur les produits)

### 5.2 `apps/linkme`

- Plateforme affilié (port 3002)
- Catalogue affilié, pas de page produit unitaire publique
- Sélections gérées par enseigne

### 5.3 `apps/back-office`

- Pilote complet de tous les canaux (CRUD + sync + monitoring)

---

## 6. Tâches à venir liées aux canaux de vente

1. **Refonte onglet Publication** (fiche produit BO) — `[BO-UI-PROD-PUB-002]`
   - Afficher 4 canaux fixes (Site Internet, LinkMe, Google Merchant, Meta Commerce)
   - Toggle réel publier/dépublier avec cascade Site → Google + Meta
   - Bouton "Publier sur le site" fonctionnel (PublishButton + route API)
   - Checklist cliquable redirigeant sur l'onglet correspondant
   - URLs "voir sur le canal" pour les 4 canaux

2. **Refonte onglet Général > Pricing par canal** — `[BO-UI-PROD-PRICING-002]`
   - Bouton "= prix min" pour auto-fill
   - Modal de confirmation si override du prix min

3. **Création catalogue Meta Commerce dans BO** si absent — `[BO-CHANNEL-META-001]`

4. **Documentation Meta Commerce** — `[INFRA-DOC-META-001]`
   - Reconstituer credentials, business_id, catalog_id, system user token
   - Créer `docs/current/integrations/meta-commerce/README.md`

5. **Mise à jour doc canaux-vente** — `[INFRA-DOC-CHANNELS-001]`
   - Promotion `docs/restored/canaux-vente-2025/README.md` → `docs/current/canaux-vente/README.md` après mise à jour

---

## 7. Mémoire et règles agent à respecter

- `.claude/rules/no-phantom-data.md` — ne jamais créer de ligne `channel_pricing` ou `google_merchant_syncs` artificielle
- `.claude/rules/agent-autonomy-external.md` — pas de demande à Romeo de vérifier sur Google Merchant ou Meta Business Manager
- `.claude/rules/database.md` — ne jamais éditer une migration existante (canaux gérés par migrations append-only)
- Memory `architecture_db.md` — colonnes critiques produits/channel_pricing
- Memory `app_specific_context.md` — règles métier par app

---

## 8. Historique

- **2026-04-25** — Création de cet INDEX. Restauration de 30 docs supprimées (Google Merchant, Meta, canaux-vente, catalogue, pricing) depuis git history. Règle de publication cascade officialisée (Romeo).
- **Avant 2026-04-25** — Doc canaux-vente fragmentée et partiellement supprimée. Règle cascade non documentée.

---

## 9. Référence

Cet index est référencé par :

- `docs/current/canaux-vente-publication-rules.md` (règle cascade)
- `.claude/INDEX.md` section "Documentation projet" (à mettre à jour)
- `~/.claude/projects/.../memory/MEMORY.md` (à mettre à jour avec pointeur)
