# Audit complet — Page détail produit back-office Vérone

**Date** : 2026-04-20
**Page auditée** : `/produits/catalogue/[productId]` (7 onglets + header + modales)
**Fichier racine** : `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/page.tsx`
**But** : livrable exploitable comme prompt pour l'agent qui portera le redesign + l'implémentation.

---

## 0. Contexte & contraintes à respecter

### Contraintes métier (obligatoires)

1. **1 produit = 1 fournisseur unique**. Si deux fournisseurs distribuent le même article → on crée deux produits. Aucune UI ne doit suggérer une liste de fournisseurs pour un produit donné. Tous les achats (`product_purchase_history`, PO) pour un produit sont forcément chez le même fournisseur (`products.supplier_id`).
2. **Sources de prix DB** (ne jamais inventer, ne jamais mélanger) :
   - `products.cost_price` = prix d'achat manuel (cible de référence)
   - `products.cost_price_avg / min / max / last / count` = agrégats depuis les PO réceptionnées (remplis par trigger)
   - `products.cost_net_avg / min / max / last` = idem avec livraison + assurance réparties
   - `products.margin_percentage` = % marge cible (peut être NULL → afficher "Non renseigné", ne jamais appliquer 25 % par défaut silencieusement)
   - `products.eco_tax_default` = éco-participation
   - `channel_pricing.custom_price_ht` = prix catalogue par canal (= source de vérité pour site-internet / LinkMe catalogue)
   - `channel_pricing.public_price_ht` = prix public indicatif (informatif, non utilisé en calcul)
   - `linkme_selection_items.selling_price_ht` = prix effectif dans une sélection LinkMe (`base_price_ht × (1 + margin_rate/100)`)
   - Google Merchant + Meta Commerce = miroirs du site-internet (pas de prix propre)
3. **Interdiction** : modifier les triggers stock, les routes Qonto, les migrations existantes (append-only). Voir `.claude/rules/stock-triggers-protected.md` et `CLAUDE.md`.

### Objectif Romeo (verbatim 2026-04-20)

- « beaucoup beaucoup beaucoup plus minimaliste »
- « tout plus petit, c'est trop gros »
- « des petits hooks dans chaque onglet, bien structurés »
- **Tous les onglets doivent être refaits**, pas seulement Tarification.
- Bouton "Historique des achats" dans Tarification **a été retiré** (commit `b9c4765b5`) car sa modale était cassée. À remplacer par un affichage inline discret quand les PO ont été reçues.

### Contraintes techniques (rappel CLAUDE.md)

- Fichier > 400 lignes → refactor obligatoire.
- Responsive mobile-first sur 5 tailles : 375 / 768 / 1024 / 1440 / 1920.
- Composants partagés obligatoires : `ResponsiveDataView`, `ResponsiveActionMenu`, `ResponsiveToolbar` (`@verone/ui`) + hook `useBreakpoint` (`@verone/hooks`).
- Aucun formulaire dans `apps/` → tout dans `packages/@verone/`.
- Zéro `any` TypeScript, zéro `eslint-disable`, zéro `router.push` après `signOut`, `await queryClient.invalidateQueries()` dans tous les `onSuccess`, `useCallback` avant d'ajouter une fonction aux deps de `useEffect`.
- Typage strict Supabase : `createClient<Database>()`.

---

## 1. Onglet « Général »

**Rôle** : consolide les infos critiques (nom, SKU, prix coût, statut), attribution client (sur mesure), catégorisation, fournisseur, identifiants. Point d'entrée pour 90 % des modifications produit.

**Fichiers clés** :

- `_components/product-general-tab.tsx` — **336 L** (limite 400 L mais dense, candidat split)
- Sous-composants externes : `ProductInfoSection` (@verone/products, ~360 L), `SupplierEditSection` (~350 L), `ClientOrEnseigneSelector`, `ProductVariantsGrid`, `WeightEditSection`, `SampleRequirementSection`, `IdentifiersCompleteEditSection`

**Données DB affichées** : `products.name / .sku / .cost_price / .cost_net_avg / .stock_status / .product_status / .brand / .gtin / .condition / .created_at / .updated_at / .requires_sample`, `products.supplier_id → organisations`, `.subcategory_id → subcategories → categories → families`, `.variant_group_id → variant_groups`, `.enseigne_id → enseignes`, `.assigned_client_id → organisations`.

**Actions utilisateur** :

- Inline edit (nom, SKU, prix coût)
- Sélecteur client/enseigne mutuellement exclusif
- Modale catégorisation (ouvre `CategoryHierarchySelector`)
- Edit fournisseur + poids (hérités du variant_group si applicable)
- Toggle "échantillon requis" (disabled si stock ≥ 1)
- Edit identifiants (brand, GTIN, condition)

**Problèmes UX/design** :

- **Redondance d'infos** : SKU + nom + completion % affichés dans le header ET dans `ProductInfoSection` (cf `product-detail-header.tsx:98` vs `product-general-tab.tsx:46-65`).
- **Bloc "Métadonnées" mort** : `created_at`/`updated_at` read-only occupent de la place sans action (lignes 305-333). Candidat → tooltip dans header.
- **10 sections `bg-white` empilées** → fatigue visuelle, aucune hiérarchie entre essentiel et accessoire.
- **Badge "Produit affilié" présent 3 × ** : général-tab lignes 71, 111-125 + header. À consolider à une seule source.
- **Responsive @ 375 px cassé** : `max-w-md` dans ClientOrEnseigneSelector ligne 165 ; grille `grid-cols-1 md:grid-cols-2` non testée sur les tailles extrêmes.
- **Variante locked sans doc inline** : si `variant_group_id` existe, catégorisation désactivée (ligne 201 `disabled={!!product.variant_group_id}`), mais le lien "Modifier depuis la page du groupe" est noyé dans un alert bleu (ligne 179).

**Incohérences métier** :

- Contrainte 1 produit = 1 fournisseur : **respectée** (`supplier_id` unique). Risque : changer le fournisseur n'invalide rien → pas de prompt "Recalculer le prix coût ?".
- Héritage variant_group documenté par un seul alert bleu → faible visibilité.
- Sample requirement auto-disabled si stock ≥ 1 : aucune explication UX, l'utilisateur voit un toggle grisé sans raison.

**Pistes** :

1. Fusionner header + "Infos générales" en 1 carte compacte (SKU, nom, prix coût, statut) → 1 seule source.
2. Remplacer 10 sections par 3-4 blocs logiques : **Identité**, **Sourcing & Variantes**, **Opérationnel** (sample, identifiants). Métadonnées → tooltip.
3. Ajouter un badge "Hérité du groupe" explicite sur chaque champ concerné + lien direct vers le groupe.
4. Tooltip "Verrouillé car stock ≥ 1" sur Sample toggle grisé.
5. Tester + fixer responsive ClientOrEnseigneSelector @ 375 / 768.

---

## 2. Onglet « Descriptions »

**Rôle** : description client, description technique, selling points, méta SEO (title + description pour Google SERP).

**Fichiers clés** :

- `_components/product-descriptions-tab.tsx` — **47 L** (bon)
- `ProductDescriptionsEditSection`, `SerpPreview` (@verone/products)

**Données DB** : `products.description / .technical_description / .selling_points (JSONB) / .meta_title / .meta_description / .slug`.

**Actions** : inline edit multiline + preview SERP Google.

**Problèmes** :

- SerpPreview `onUpdate={() => void onProductUpdate({}).catch(...)}` (ligne 41) → appel vide, pas clair si édition inline ou modale.
- Selling points = array JSONB, rendu non clarifié (chips ? liste ?).
- Slug affiché mais aucune UI pour le modifier ici → mystère.
- Pas d'empty state pour selling points NULL.
- Pas de validation longueur meta_description (Google snippet minimum ~120 caractères).

**Pistes** :

1. Clarifier SerpPreview : edit inline OU modale, décider et documenter.
2. Empty state : "Aucun selling point défini."
3. Slug : afficher "auto-généré depuis le nom" ou "manuel" avec bouton edit si manuel.
4. Ajouter badge longueur meta_description (ex. "12/120 caractères — trop court pour Google").

---

## 3. Onglet « Tarification »

**Rôle** : coût fournisseur, marge, prix de vente par canal. Actuellement le plus redesigné (sprint SI-PRICING-001 en cours).

**Fichiers clés** :

- `_components/product-pricing-tab.tsx` — 45 L (wrapper mince, OK)
- `UnifiedPricingPanel` — 49 L (@verone/common)
- **`SupplierVsPricingEditSection` — ~350 L** (@verone/common) → délègue à `SupplierPricingDisplay` (312 L) + `SupplierPricingEditForm`
- **`ChannelPricingEditor` — ~320 L** (@verone/common) (non auditable sans relecture)
- **`PurchasePriceHistoryTimeline`** (retiré de l'UI mais encore exporté)

**Données DB** : voir section 0 (sources de prix). Ajoute `channel_pricing.discount_rate`, `.markup_rate`, `.is_active`, `.min_quantity`, `.notes` + `sales_channels.code / .name`.

**Actions** :

- Inline edit cost_price, eco_tax, margin_percentage (dans SupplierPricingEditForm)
- Edit channel price (custom_price_ht) + toggle actif par canal
- Override minimum bloquant via `POST /api/channel-pricing/upsert` (override_minimum=true)

**Problèmes identifiés (déjà corrigés ou à corriger dans ce sprint)** :

- ✅ Fallback silencieux `?? 25` retiré → "Taux de marge non renseigné" quand NULL
- ✅ Badge "Min de vente" masqué quand marge manquante
- ✅ Codes canaux DB (underscores, pas hyphens) alignés
- ✅ Affichage public_price_ht si custom_price_ht absent
- ✅ Liste sélections LinkMe avec selling_price_ht sous le canal LinkMe
- ✅ Bouton "Historique des achats" retiré (modale cassée)
- ❌ **Gros blocs pleine largeur** (Romeo : "trop gros") — redesign en cours via Stitch
- ❌ Historique agrégé inline (`SupplierPricingDisplay` lignes 154-243) masqué quand `cost_price_avg` NULL → invisible pour nouveaux produits tant qu'aucune PO réceptionnée. **Comportement DB-correct mais UX-pauvre**. Pistes : "Aucun achat enregistré encore. Première PO attendue."
- ❌ Sync channel pricing quand margin_percentage change : pas confirmée. Si on baisse la marge, les prix canaux déjà enregistrés ne sont pas flaggés "sous le nouveau min".

**Incohérences métier** :

- ✅ Contrainte 1 produit = 1 fournisseur → tous les PO affichés doivent être chez le même supplier (pas de colonne "Fournisseur" variable dans l'historique).
- ✅ Distinction 3 sources prix documentée par le GLOSSAIRE-CHAMPS-PRIX.md (2026-03-18).
- ❌ `PurchasePriceHistoryTimeline` exporté mais inutilisé → code mort à supprimer si on ne ramène pas l'historique en modale.

**Pistes (redesign ciblé Romeo)** :

1. Grille 3 tuiles KPI compactes : Coût / Marge / Min vente (type Stripe Dashboard).
2. Historique inline **toujours visible** : soit valeurs, soit "Aucun achat enregistré. Premier PO à recevoir."
3. Tableau dense canaux (Linear-style) avec sous-row LinkMe pour sélections.
4. État "Sous le min" : bord rouge gauche 3 px + chip destructive.
5. Empty states italic gris pour toute valeur NULL — jamais de fallback inventé.

---

## 4. Onglet « Stock »

**Rôle** : stock réel, prévu (forecasted_in/out), seuil min, alertes, historique mouvements.

**Fichiers clés** :

- `_components/product-stock-tab.tsx` — **76 L** (OK)
- `StockDisplay`, `StockEditSection` (@verone/stock), `StockAlertsBanner`, `ProductStockHistoryModal` (@verone/products)

**Données DB** : `products.stock_real / .stock_forecasted_in / .stock_forecasted_out / .min_stock / .condition`, `stock_alert_tracking`, `stock_movements`.

**Actions** :

- View stock (summary 3 lignes)
- Edit `min_stock` + `condition`
- Ouvrir modale "Historique des mouvements"

**Problèmes** :

- `StockAlertsBanner` : pas d'error boundary. Si le fetch plante → silencieux.
- Bouton "Historique mouvements" utilise `Button` au lieu de `ButtonUnified` → incohérent.
- Modale stock_movements : pagination invisible (si 1000 moves → perf hit + scroll infini).
- `min_stock` fallback hard-codé à 5 si NULL (`StockDisplay` ligne 35) → incohérent avec la règle "zéro fallback inventé".
- Champ `condition` : intention floue (état stock vs état produit neuf/occasion ?), pas d'enum picker.
- Aucun lien direct vers `/stocks/parametres` pour configurer les seuils globaux.

**Pistes** :

1. Error boundary + retry sur StockAlertsBanner.
2. Pagination modale : 50 moves par page + bouton "Charger plus".
3. Retirer fallback 5 → afficher "Seuil non défini" si NULL.
4. Enum picker `condition` (neuf / reconditionné / occasion) si applicable métier.
5. Bouton "Configurer les seuils globaux" → deep-link /stocks/parametres.

---

## 5. Onglet « Caractéristiques »

**Rôle** : attributs variantes (color, material, finish, style), dimensions (L × W × H), poids. Read-only + bouton edit modale.

**Fichiers clés** :

- `_components/product-characteristics-tab.tsx` — **58 L**
- `ProductFixedCharacteristics` (@verone/products)

**Données DB** : `products.variant_attributes (JSONB) / .dimensions (JSONB) / .weight`, héritage éventuel `variant_groups.style / .suitable_rooms / .common_dimensions / .common_weight`.

**Actions** :

- Read-only display
- Click "Modifier" → ouvre `ProductCharacteristicsModal` (page-level state)

**Problèmes** :

- Duplication du message "Caractéristiques gérées au niveau du groupe de variantes" (general-tab ligne 176 + characteristics-tab ligne 35-46).
- Aucun empty state si `variant_attributes = {}`.
- Source d'un attribut (produit spécifique vs hérité du groupe) non affichée.
- Modale ProductCharacteristicsModal : pré-population non vérifiée si héritage existe.

**Pistes** :

1. Supprimer le message dupliqué → unique dans general-tab.
2. Empty state : "Aucune caractéristique. Cliquez sur Modifier."
3. Badge "Hérité du groupe" sur chaque attribut concerné.
4. Tests e2e de la pré-population modale.

---

## 6. Onglet « Images »

**Rôle** : galerie (upload, reorder, set primary, delete, view full-screen). Drag-drop support.

**Fichiers clés** :

- `_components/product-images-tab.tsx` — **350 L** (limite 400 L, dense)
- `useProductImages` hook (@verone/products) — upload/delete/setPrimary via Supabase storage
- `ProductImageViewerModal`

**Données DB** : `product_images (id, public_url, alt_text, is_primary, product_id)`.

**Actions** :

- Upload (input + drag-drop)
- View lightbox
- Set as primary
- Delete + confirm
- Hover overlay (view / star / delete)

**Problèmes** :

- **Alt text non éditable inline** → utile pour SEO + accessibilité. Aujourd'hui seulement lecture.
- Format rejeté silencieusement (ligne 62 `!file.type.startsWith('image/')`) → l'utilisateur ne sait pas pourquoi son PDF est ignoré.
- **Taille max 10 MB annoncée (ligne 222) mais pas enforce en code** → risque OOM.
- Pas de pagination / lazy-load → si 1000 images, perf hit massif.
- **3 instances `useProductImages`** (header, images-tab, modale ProductPhotosModal) → 3 queries identiques au mount, risque de désync (le header utilise `refreshHeaderImages` pour compenser).
- `product.has_images` : computed ou flag manuel ? À confirmer (publication-tab dépend de ce flag).

**Pistes** :

1. Inline alt text editor (popover ou double-clic).
2. Toast "Format non supporté : .pdf. JPG/PNG/WebP uniquement."
3. Validation taille côté client + enforce 10 MB.
4. Pagination 20 images par page + lazy-load.
5. Unifier `useProductImages` en 1 instance au niveau page, propagée via context.
6. Vérifier que `has_images` est un trigger DB, sinon le devenir.

---

## 7. Onglet « Publication »

**Rôle** : checklist 9 critères de "ready to publish" + statut par canal (site_internet, meta_commerce, google_merchant, linkme).

**Fichiers clés** :

- `_components/product-publication-tab.tsx` — **272 L**

**Données DB** : `products.name / .description / .meta_description / .has_images / .subcategory_id / .slug / .product_status / .is_published_online`, `channel_pricing` + `sales_channels`.

**Actions** :

- View readiness score + progress bar
- Voir le statut par canal + prix défini (oui/non)
- Bouton "Partager" sur site_internet (si actif) → redirige vers `veronecollections.fr/produits/{slug}`

**Problèmes** :

- **Aucune action inline pour activer/désactiver un canal** — seulement de la lecture. L'utilisateur doit aller dans Tarification ou ailleurs.
- Check prix fragile : `channels.some(c => c.custom_price_ht > 0)` → vrai dès qu'UN canal a un prix. Devrait être "tous les canaux actifs ont un prix".
- `is_published_online` affiché mais **jamais toggle dans le BO** → flag mystère (auto-géré par trigger ? manuel ?).
- Checklist incomplète : manque length min description, alt text image, slug présent.
- Mapping icônes canaux hard-codé (lignes 100-117) → tout nouveau canal = fallback Globe.
- Loading state : "Chargement..." texte nu, pas de spinner.

**Pistes** :

1. Toggle actif/inactif par canal avec confirmation destructive.
2. Refiner check prix : "Priced sur X / Y canaux actifs".
3. Documenter / UI le flag `is_published_online` : auto, manuel, ou retirer.
4. Ajouter checks manquants (desc ≥ 120, alt text, slug).
5. Icônes canaux → depuis `sales_channels.metadata` ou config centralisée.
6. Spinner + texte contextualisé.

---

## 8. Audit transversal

### 8.1 Header (`product-detail-header.tsx`, 174 L)

- Sticky top z-10 avec thumbnail 100 × 100, breadcrumb, sourcing badge, completion bar.
- **Redondance avec general-tab** : nom, completion, sourcing affichés 2 ×.
- Breadcrumb truncate → @ 375 px (sidebar ouverte) illisible. Alternative : vertical stack + ellipsis.
- Completion bar sans légende (seuils 30 / 70 non expliqués).

### 8.2 Navigation onglets

- `TabsNavigation` sticky horizontale.
- **Pas de deep-link** : URL ne contient pas `?tab=pricing`. Bookmark → toujours "general".
- Badges tab (count missing fields) utiles.
- **Ordre actuel** : général / descriptions / tarification / stock / caractéristiques / images / publication. À challenger : publication en dernier alors que c'est le "livrable final" → peut-être OK.

### 8.3 Modales (`ProductModals.tsx`, 150 L)

Liste :

- `ProductPhotosModal` (upload + reorder) — duplique l'onglet Images.
- `ProductCharacteristicsModal` (variant attributes + dimensions + weight)
- `ProductDescriptionsModal` (desc + tech + selling points)
- `CategoryHierarchySelector` dialog

**Problèmes** :

- 4 booléens scattered entre page.tsx + useProductDetail → à centraliser.
- Synchro ProductPhotosModal ↔ ProductImagesTab fragile (2 instances `useProductImages`).
- Bouton "Historique achats" retiré (modale cassée).

### 8.4 Hook `useProductDetail` (441 L)

- Fetch product + relations (single query) ✅
- Fetch channelPricing séparé sur mount
- **Pas de React Query caching** → refetch à chaque navigation
- `handleProductUpdate` optimiste + silent refetch pour certains champs → erreurs ne remontent qu'en console
- **N+1 risk** : useProductImages 3 × au mount

**Pistes** : migrer vers React Query avec `invalidateQueries` dans `onSuccess`, unifier les instances, toast sur erreur refetch.

### 8.5 Performance

- `select('*', ...)` inline au lieu de projection explicite.
- Pas de pagination (images, mouvements stock, historique PO).
- Pas de CDN placeholder pour les images.
- Completion % recalc à chaque load (useMemo OK mais 19 checks).

### 8.6 Responsive (5 breakpoints 375 / 768 / 1024 / 1440 / 1920)

- Header : `max-w-[1800px]` centré. @ 1920 centré, @ 375 avec sidebar risque de déborder.
- Sections : `bg-white rounded-lg border p-5` uniformes. Grille images 2 → 3 → 4 cols, probablement OK mais non testée.
- Modales : `h-screen md:h-auto max-w-full md:max-w-md`. @ 375 px full-screen = bon. Risque overflow si contenu dynamique.
- **Aucun test explicite aux 5 tailles** documenté.

### 8.7 Cohérence avec autres pages

- `/canaux-vente/linkme/catalogue/[id]` et `/canaux-vente/site-internet/produits/[id]` dupliquent potentiellement images, descriptions, tarification (via prisme canal).
- Source de vérité à confirmer : produit détail centralisé dans `/produits/catalogue/[id]`, les pages canaux = vues filtrées / surchargées.
- Recommandation : auditer `canaux-vente/*` en séparé pour clarifier les duplications.

---

## 9. Résumé des problèmes — priorisé

### Bloquants redesign

1. **Général tab trop gros** (336 L, 10 sections) → split en 3 blocs logiques
2. **Redondance header / général** → 1 source unique
3. **Pricing tab visuel trop imposant** → grille 3 tuiles KPI + tableau dense (piste Stitch en cours)
4. **Images : 3 instances hook** → unifier
5. **Publication : aucune action** → ajouter toggle canal
6. **Aucun deep-link tab** → `?tab=xxx`

### Data integrity

7. Fallback silencieux 25 % margin → remplacer par état explicite NULL
8. Fallback min_stock = 5 → retirer
9. `is_published_online` : flag fantôme à documenter ou retirer
10. `PurchasePriceHistoryTimeline` → code mort, supprimer ou réintégrer inline
11. `has_images` : computed ou manuel ? trigger DB ?

### Performance & qualité

12. React Query caching absent
13. `select('*')` générique au lieu de projection explicite
14. Pagination manquante (images, mouvements, historique)
15. Aucun test e2e documenté aux 5 breakpoints

### Métier

16. Contrainte "1 produit = 1 fournisseur" respectée mais non enforced visuellement (pas de warning au changement de supplier)
17. Distinction `custom_price_ht` / `public_price_ht` / `selling_price_ht` documentée dans GLOSSAIRE mais pas dans l'UI → tooltip
18. Messages "Hérité du variant_group" dupliqués sur 3 onglets → consolider

---

## 10. Prompt pour l'agent de redesign (à utiliser tel quel)

> **Rôle** : designer + développeur senior React/TypeScript. Refactor complet de la page détail produit du back-office Vérone (7 onglets + header + modales) selon l'audit ci-dessus (sections 1 à 8).
>
> **Principes directeurs** (dictés par Romeo 2026-04-20) :
>
> - **Ultra-minimaliste** : densité > wow-effect. Tout plus petit, plus compact.
> - **Petites tuiles bien structurées** : remplacer les blocs pleine largeur par des grilles (KPI cards type Stripe Dashboard, tableaux denses type Linear, chips type Vercel).
> - **Zéro valeur inventée** : si NULL en DB, afficher "Non renseigné" en italique gris, jamais un fallback silencieux (ex. `?? 25`).
> - **Inline edit par défaut** : click-to-edit sur les valeurs, jamais de modale sauf pour éditer des objets complexes (images, dimensions, description multi-champs).
> - **Responsive strict** : testé + screenshot aux 5 tailles 375 / 768 / 1024 / 1440 / 1920.
>
> **Contraintes métier** (impératif) :
>
> - 1 produit = 1 fournisseur unique — ne jamais suggérer multi-supplier dans aucune UI.
> - Prix : 3 sources séparées (`products.cost_price`, `channel_pricing.custom_price_ht / .public_price_ht`, `linkme_selection_items.selling_price_ht`). Les afficher clairement, jamais les mélanger, tooltips si nécessaire.
> - Google Merchant + Meta Commerce = miroirs du site-internet (lecture seule).
> - Respect de `CLAUDE.md`, `.claude/rules/` (workflow.md, responsive.md, code-standards.md, database.md).
>
> **Ordre d'attaque suggéré** (PR groupées, pas une PR par onglet) :
>
> 1. **Header + Général tab** (bloc fondation) — consolider les redondances, splitter en 3 groupes logiques (Identité / Sourcing & Variantes / Opérationnel), retirer la section Métadonnées morte.
> 2. **Tarification** (sprint SI-PRICING-001 en cours) — finir le redesign grille KPI + tableau dense canaux + historique inline.
> 3. **Stock + Caractéristiques** (tabs légers) — fix empty states, retirer fallbacks hard-codés (`min_stock ?? 5`).
> 4. **Images** — unifier `useProductImages` en 1 instance, ajouter inline alt-text editor, paginer si > 20 images, enforce taille fichier.
> 5. **Descriptions + Publication** (bloc éditorial) — clarifier SerpPreview inline/modale, ajouter toggle canal actif/inactif, compléter checklist (slug, alt text, longueur meta).
> 6. **Navigation + URL** — ajouter `?tab=xxx` deep-link, bookmark-friendly.
> 7. **Performance** — projection explicite `select('id, name, ...')`, React Query caching, pagination stock_movements.
>
> **Livrables par PR** :
>
> - Scratchpad `docs/scratchpad/dev-plan-YYYY-MM-DD-redesign-produit-{bloc}.md` avant de coder.
> - Screenshots Playwright 5 tailles avant de marquer PR ready.
> - Test e2e + type-check + lint verts.
> - Reviewer-agent PASS avant merge.
>
> **Références obligatoires à lire avant de coder** :
>
> - `CLAUDE.md` racine + `apps/back-office/CLAUDE.md`
> - `.claude/rules/responsive.md`, `.claude/rules/code-standards.md`, `.claude/rules/workflow.md`
> - `docs/current/database/schema/02-produits.md` + `09-autres.md`
> - `docs/current/linkme/GLOSSAIRE-CHAMPS-PRIX.md`
> - Cet audit (sections 1-9 ci-dessus)
> - Thumbnail Stitch de référence : `docs/scratchpad/stitch/stitch-tarification-desktop-v1-2026-04-20.png`
>
> **Interdictions strictes** :
>
> - Pas de `any`, pas d'`eslint-disable`
> - Pas de migration DB sans ordre explicite Romeo
> - Pas de modif des triggers stock ni des routes Qonto
> - Pas de `pnpm dev` lancé par l'agent (Romeo le lance manuellement)
> - Pas de PR direct vers `main` — toujours vers `staging`
> - Pas de fallback inventé (ex : `margin_percentage ?? 25` → **interdit**)
> - Pas de multi-supplier UI

---

## 11. Traces

- PR actuelle : #693 (SI-PRICING-001), branche `feat/SI-PRICING-001-unified-product-pricing`
- Commits récents clés : `5ec300420`, `b9c4765b5` (retrait bouton Historique cassé), `825ac035e` (mockup Stitch desktop v1)
- Stitch project : `14273265056008991888` (thumbnail `docs/scratchpad/stitch/stitch-tarification-desktop-v1-2026-04-20.png`)
- Rapport agent Explore intégral : cet audit (rédigé par Explore, corrigé et contextualisé par l'orchestrateur)
