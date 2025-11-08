# Google Merchant Center - Business Rules

**Version:** 1.0.0
**Date création:** 5 novembre 2025
**Dernière mise à jour:** 5 novembre 2025
**Canal:** Google Shopping / Google Merchant Center
**Statut:** ✅ Implémenté (attente credentials GCP)

---

## 🎯 Vue d'Ensemble

**Google Merchant Center (GMC)** est une plateforme Google permettant de télécharger et gérer les informations produits affichées sur Google Shopping, Google Search, et d'autres services Google.

**Route applicative:** `/canaux-vente/google-merchant`
**Type canal:** Marketplace
**Discount par défaut:** Variable selon produit

---

## 📋 Business Rules Spécifiques Google Merchant

### 1. Produits Éligibles

#### ✅ Critères d'Éligibilité Obligatoires

Un produit Vérone est **éligible Google Merchant** si:

1. **Stock disponible** : `available_stock > 0` OU `allow_backorder = true`
2. **Prix configuré** : `price_list_items.base_price_ht > 0`
3. **Image principale** : Minimum 1 image associée (`product_images`)
4. **Titre valide** : `products.name` non vide (max 150 caractères Google)
5. **Description** : `products.description` non vide (recommandé min 50 caractères)
6. **Référence fournisseur** : `products.supplier_reference` (utilisée pour `mpn`)
7. **Catégorie** : `products.category_id` définie
8. **Statut actif** : `products.status = 'active'`

---

#### ❌ Produits Exclus Automatiquement

| Raison exclusion   | Critère                                            | Action                          |
| ------------------ | -------------------------------------------------- | ------------------------------- |
| **Stock épuisé**   | `available_stock = 0` ET `allow_backorder = false` | `availability = 'out_of_stock'` |
| **Prix manquant**  | `base_price_ht IS NULL` OU `= 0`                   | ❌ Exclu du feed                |
| **Pas d'image**    | `COUNT(product_images) = 0`                        | ❌ Exclu du feed                |
| **Statut inactif** | `products.status != 'active'`                      | ❌ Exclu du feed                |
| **Archive**        | `products.archived = true`                         | ❌ Exclu du feed                |

**Règle métier:** Un produit ne respectant PAS les critères d'éligibilité ne sera jamais synchronisé vers Google Merchant (protection qualité feed).

---

### 2. Mapping Colonnes Google Merchant (31 colonnes obligatoires)

#### Colonnes Critiques Google (Mandatory)

| Colonne Google | Source Vérone                                | Transformation                           | Exemple                                    |
| -------------- | -------------------------------------------- | ---------------------------------------- | ------------------------------------------ |
| `id`           | `products.id` (UUID)                         | Direct                                   | `550e8400-e29b-41d4-a716-446655440000`     |
| `title`        | `products.name`                              | Max 150 caractères                       | `Fauteuil Milo Velours Bleu`               |
| `description`  | `products.description`                       | HTML → Texte brut, max 5000 car          | `Fauteuil confortable en velours...`       |
| `link`         | Dynamique                                    | `https://verone.fr/produits/{slug}`      | `https://verone.fr/produits/fauteuil-milo` |
| `image_link`   | `product_images.image_url` (is_primary=true) | URL publique                             | `https://storage.supabase.co/...`          |
| `price`        | `price_list_items.retail_price_ttc`          | Format `{montant} {devise}`              | `1440.00 EUR`                              |
| `availability` | Calculé                                      | `in stock` / `out of stock` / `preorder` | `in stock`                                 |
| `brand`        | Hardcoded                                    | `Vérone`                                 | `Vérone`                                   |
| `condition`    | Hardcoded                                    | `new`                                    | `new`                                      |
| `mpn`          | `products.supplier_reference`                | Direct                                   | `MILO-CHAIR-001`                           |

---

#### Colonnes Variantes (Multi-Produits)

**Cas d'usage:** Fauteuil Milo disponible en 3 couleurs (Bleu, Vert, Rouge)

| Colonne Google  | Source                                                                   | Logique                   | Exemple                                |
| --------------- | ------------------------------------------------------------------------ | ------------------------- | -------------------------------------- |
| `item_group_id` | `product_variants.parent_product_id` OU `products.id` si pas de variante | Groupe variantes ensemble | `550e8400-e29b-41d4-a716-446655440000` |
| `color`         | `product_variants.color`                                                 | Direct si variante        | `Bleu`                                 |
| `size`          | `product_variants.size`                                                  | Direct si variante        | `L` (si applicable)                    |

**Règle métier:**

- **Produit SANS variante** : `item_group_id = products.id` (parent lui-même)
- **Produit AVEC variantes** : `item_group_id = parent_product_id` (toutes variantes partagent même ID)

**Résultat Google Shopping:**

- Fiche unique "Fauteuil Milo" avec 3 couleurs sélectionnables
- Google regroupe automatiquement via `item_group_id`

---

#### Colonnes Optionnelles (Recommandées)

| Colonne Google              | Source Vérone                             | Impact SEO/Conversion             |
| --------------------------- | ----------------------------------------- | --------------------------------- |
| `additional_image_link`     | `product_images` (is_primary=false)       | ⭐⭐⭐ Améliore CTR (+15%)        |
| `product_type`              | `categories.name`                         | ⭐⭐ Améliore ciblage Google      |
| `google_product_category`   | Mapping manuel taxonomy Google            | ⭐⭐⭐ Critique pour Shopping Ads |
| `sale_price`                | `price_list_items.base_price_ht` si promo | ⭐⭐ Affiche badge promotion      |
| `sale_price_effective_date` | Dates promo                               | ⭐ Validité promo automatique     |
| `shipping_weight`           | `products.weight_kg`                      | ⭐⭐ Calcul frais port précis     |
| `material`                  | `products.material`                       | ⭐ Filtre recherche Google        |
| `pattern`                   | `products.pattern`                        | ⭐ Filtre recherche Google        |

**Documentation complète mapping:** `docs/guides/GOOGLE-MERCHANT-INTEGRATION-PLAN-COMPLET.md`

---

### 3. Workflow Synchronisation

#### Mode Manuel (Phase 1 - ACTUEL)

**Route:** `/canaux-vente/google-merchant`
**Déclenchement:** Bouton "Synchroniser" (commercial)

**Processus:**

```
1. Utilisateur clique "Synchroniser X produits"
   ↓
2. Frontend appel hook useGoogleMerchantSync()
   ↓
3. Hook appel API route /api/google-merchant/sync-product
   ↓
4. Backend:
   - Validation éligibilité produit
   - Transformation colonnes Supabase → Google format
   - Appel Google Content API for Shopping
   ↓
5. Feedback temps réel:
   - Progress bar (0-100%)
   - Success: "3 produits synchronisés"
   - Erreurs: Liste détaillée par produit
```

**Règles métier:**

- ✅ Utilisateur sélectionne produits manuellement (checkbox)
- ✅ Maximum 50 produits par batch (limitation API Google)
- ✅ Retry automatique sur erreur temporaire (3 tentatives)
- ❌ Pas de synchronisation automatique (contrôle commercial)

---

#### Mode Automatique (Phase 2 - FUTUR)

**Déclencheur:** Trigger database sur modification produit

**Cas de synchronisation auto:**
| Événement | Action GMC | Priorité |
|-----------|------------|----------|
| Nouveau produit créé | ⏳ Sync différée (1h) | P2 |
| Prix modifié | ⚡ Sync immédiate | P0 |
| Stock épuisé (`available_stock = 0`) | ⚡ Update `availability = 'out_of_stock'` | P1 |
| Image ajoutée/modifiée | ⏳ Sync différée (24h) | P3 |
| Produit archivé | ⚡ Suppression GMC immédiate | P1 |

**Implémentation future:**

- Supabase Edge Function trigger
- Queue système (Inngest/BullMQ)
- Webhook Google Merchant (notifications erreurs feed)

---

### 4. Gestion Erreurs Feed

#### Types Erreurs Google Merchant

**Catégories:**

1. **CRITICAL** - Produit rejeté totalement
2. **WARNING** - Produit accepté mais visibilité réduite
3. **INFO** - Optimisations recommandées

---

#### Erreurs Courantes Vérone

| Code Erreur GMC         | Cause Vérone                                       | Solution                                  | Priorité |
| ----------------------- | -------------------------------------------------- | ----------------------------------------- | -------- |
| `missing_price`         | `price_list_items.retail_price_ttc IS NULL`        | Configurer prix liste                     | P0       |
| `invalid_image_url`     | URL Supabase Storage inaccessible publiquement     | Vérifier RLS policy `product_images`      | P0       |
| `missing_gtin`          | GTIN non configuré (optionnel mobilier)            | Ignorer OU configurer EAN13 si disponible | P3       |
| `title_too_long`        | `products.name > 150 caractères`                   | Tronquer automatiquement + warning        | P2       |
| `description_too_short` | `LENGTH(description) < 50`                         | Enrichir descriptions produits            | P2       |
| `out_of_stock`          | `available_stock = 0` ET `allow_backorder = false` | Réapprovisionner OU activer backorder     | P1       |
| `image_too_small`       | Image < 100x100 pixels                             | Uploader image min 800x800 pixels         | P1       |

**Dashboard erreurs:** `/canaux-vente/google-merchant` → Tab "Diagnostics" (Phase 2)

---

#### Workflow Correction Erreurs

```
1. Google Merchant envoie rapport erreurs (quotidien)
   ↓
2. Vérone import rapport via API Content
   ↓
3. Classification erreurs par priorité (P0-P3)
   ↓
4. Notification commercial:
   - P0 (CRITICAL): Email immédiat
   - P1 (HIGH): Notification in-app
   - P2-P3 (LOW): Rapport hebdomadaire
   ↓
5. Commercial corrige dans Vérone
   ↓
6. Re-synchronisation automatique (Phase 2)
```

**SLO Correction:**

- P0 (CRITICAL): <24h
- P1 (HIGH): <72h
- P2-P3 (LOW): <7 jours

---

### 5. Règles Métier Spécifiques

#### Prix & Promotions

**Règle 1: Prix canal Google Merchant**

```sql
-- Ordre priorité pricing
1. Prix client spécifique (si existe)
2. Prix canal google_merchant (si configuré dans channel_pricing)
3. Prix liste retail (retail_price_ttc)
4. Prix base + TVA 20%
```

**Règle 2: Promotions**

- Si `price_list_items.sale_price_ttc IS NOT NULL` ET `sale_price_ttc < retail_price_ttc`
  - Google `price` = `sale_price_ttc`
  - Google `sale_price` = `retail_price_ttc` (barré)
  - Badge "PROMO" affiché automatiquement

**Règle 3: Devise**

- Hardcodé: `EUR` (euros)
- Futur multi-devise: Configuration par compte GMC

---

#### Disponibilité & Stock

**Mapping `availability`:**

| Condition Vérone                                                                         | Google `availability` | Google `availability_date` |
| ---------------------------------------------------------------------------------------- | --------------------- | -------------------------- |
| `available_stock > 0`                                                                    | `in stock`            | NULL                       |
| `available_stock = 0` ET `allow_backorder = false`                                       | `out of stock`        | NULL                       |
| `available_stock = 0` ET `allow_backorder = true` ET `expected_restock_date IS NOT NULL` | `preorder`            | `expected_restock_date`    |
| `available_stock = 0` ET `allow_backorder = true` ET `expected_restock_date IS NULL`     | `out of stock`        | NULL                       |

**Règle métier:** Produits `out of stock` restent synchronisés GMC (Google cache 30 jours) pour préserver historique performance SEO.

---

#### Images

**Règles qualité Google:**

- ✅ **Minimum:** 1 image (800x800 pixels)
- ⭐ **Recommandé:** 3-8 images (produit, détails, ambiance)
- ⭐⭐ **Optimal:** 8-15 images (améliore conversion +25%)

**Ordre images Vérone:**

1. `is_primary = true` → Google `image_link`
2. `is_primary = false` ORDER BY `display_order` → Google `additional_image_link` (max 10)

**Format acceptés:**

- JPEG, PNG, GIF, BMP, TIFF
- Max 16MB par image
- Min 100x100 pixels, Recommandé 800x800+

**Règle métier:** Si aucune image `is_primary`, prendre première image `display_order ASC`.

---

### 6. Configuration Requise

#### Credentials Google Cloud Platform (5 variables)

**Fichier:** `.env.local`

```bash
# Google Merchant Center Configuration
GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL=verone-gmc@project-id.iam.gserviceaccount.com
GOOGLE_MERCHANT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
GOOGLE_MERCHANT_PRIVATE_KEY_ID=abc123def456...
GOOGLE_MERCHANT_CLIENT_ID=123456789012345678901
GOOGLE_CLOUD_PROJECT_ID=verone-production-123
```

**Guide configuration complet:** `docs/guides/GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md`
**Temps requis:** 40-50 minutes (première configuration)

---

#### Compte Google Merchant Center

**Prérequis:**

1. Compte GMC créé (https://merchants.google.com)
2. Domaine vérifié (verone.fr OU verone-v1.vercel.app)
3. Service Account ajouté comme "Utilisateur Standard"
4. API Content activée
5. ID Merchant (format: `123456789`)

**Guide complet:** `docs/guides/GOOGLE-MERCHANT-RESUME-EXECUTIF.md`

---

### 7. Tests Validation

#### Checklist Pré-Synchronisation

**Tests automatisés disponibles:** `docs/guides/GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md#tests`

| Test               | API Route                                    | Objectif                            | Succès attendu                   |
| ------------------ | -------------------------------------------- | ----------------------------------- | -------------------------------- |
| **Connexion GCP**  | `/api/google-merchant/test-connection`       | Valider credentials Service Account | Status 200 + "Connexion réussie" |
| **Export Excel**   | `/api/google-merchant/export-excel`          | Générer feed test local             | Fichier .xlsx 31 colonnes        |
| **Sync 1 produit** | `/api/google-merchant/sync-product` (1 UUID) | Test synchronisation unitaire       | Produit visible GMC sous 5min    |

**Workflow validation:**

```
1. Test connexion (2min)
   ↓ Si ✅
2. Export Excel 3 produits test (5min)
   ↓ Vérifier colonnes obligatoires
3. Sync 1 produit test (10min)
   ↓ Attendre indexation GMC (5-10min)
4. Vérifier GMC dashboard
   ↓ Si ✅
5. Sync batch 10 produits
   ✅ Configuration validée
```

---

### 8. Statistiques & KPIs

**Page:** `/canaux-vente/google-merchant`

**Métriques affichées:**

| Métrique                  | Source                                                                   | Calcul                      | Objectif Phase 1    |
| ------------------------- | ------------------------------------------------------------------------ | --------------------------- | ------------------- |
| **Produits synchronisés** | Supabase `sales_channel_products` WHERE `channel_id = 'google_merchant'` | COUNT                       | 18 (100% catalogue) |
| **Impressions**           | Google Merchant API (Reporting)                                          | SUM last 30 days            | 10,000+             |
| **Clics**                 | Google Merchant API (Reporting)                                          | SUM last 30 days            | 500+                |
| **CTR**                   | Calculé                                                                  | (Clics / Impressions) × 100 | >5%                 |
| **Conversions**           | Google Analytics 4 (Enhanced Ecommerce)                                  | SUM attributed GMC          | 10+                 |
| **Revenue GMC**           | GA4                                                                      | SUM revenue attributed GMC  | 5,000€+             |

**Fréquence actualisation:** Quotidienne (Google Content API)

---

### 9. Optimisations Recommandées

#### Phase 1 - Qualité Feed (ACTUEL)

**Priorités:**

1. ✅ Remplir TOUTES descriptions produits (min 200 caractères)
2. ✅ Uploader 5+ images par produit
3. ✅ Configurer `google_product_category` (taxonomy Google)
4. ✅ Enrichir attributs produits (material, pattern, color)
5. ✅ Activer backorder produits phares (éviter out_of_stock)

**Impact attendu:** +30% visibilité Google Shopping

---

#### Phase 2 - Performance & Automation

**Priorités:**

1. Synchronisation automatique (triggers database)
2. Dashboard diagnostics temps réel
3. A/B testing titres produits (Google Experiments)
4. Smart Bidding Shopping Ads (Google Ads)
5. Merchant Promotions (codes promo natifs GMC)

**Impact attendu:** +50% conversions, -20% coût acquisition

---

## 📋 Checklist Go-Live Google Merchant

### Pré-Lancement (Checklist Commerciale)

- [ ] Compte Google Merchant Center créé et vérifié
- [ ] Domaine Vérone vérifié dans GMC
- [ ] Service Account configuré (.env.local)
- [ ] API Content activée GCP
- [ ] Test connexion ✅ (route `/api/google-merchant/test-connection`)
- [ ] Export Excel validé (31 colonnes correctes)
- [ ] 3 produits test synchronisés et visibles GMC
- [ ] Descriptions produits complètes (min 200 caractères)
- [ ] Images produits haute qualité (min 800x800, 5+ images/produit)
- [ ] Prix configurés pour 100% catalogue
- [ ] Stock à jour (available_stock correct)
- [ ] Catégories produits mappées taxonomy Google

### Lancement Production

- [ ] Synchronisation batch 18 produits total
- [ ] Vérification GMC dashboard (0 erreurs critiques)
- [ ] Activation Shopping Ads (Google Ads)
- [ ] Tracking GA4 Enhanced Ecommerce configuré
- [ ] Formation équipe commerciale synchronisation
- [ ] Documentation interne partagée
- [ ] Monitoring quotidien erreurs feed (14 premiers jours)

---

## 🔗 Documentation Associée

### Business Rules

- [`../README.md`](../README.md) - Vue d'ensemble canaux de vente
- [`../../05-pricing-tarification/pricing-multi-canaux-clients.md`](../../05-pricing-tarification/pricing-multi-canaux-clients.md) - Pricing multi-canal

### Guides Techniques

- `docs/guides/GOOGLE-MERCHANT-RESUME-EXECUTIF.md` - Checklist 40-50min
- `docs/guides/GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md` - Guide pas-à-pas
- `docs/guides/GOOGLE-MERCHANT-INTEGRATION-PLAN-COMPLET.md` - Architecture complète
- `docs/guides/GOOGLE-MERCHANT-SERVICE-ACCOUNT-CREDENTIALS.md` - Création Service Account
- `docs/guides/GOOGLE-MERCHANT-DOMAIN-VERIFICATION.md` - Vérification domaine

### Database

- `docs/database/pricing-architecture.md` - Architecture pricing
- `docs/database/SCHEMA-REFERENCE.md` - Tables `sales_channels`, `price_list_items`

---

## 📞 Support

**Questions techniques:** Voir guides `docs/guides/GOOGLE-MERCHANT-*.md`
**Questions business:** Voir documentation module 13
**Erreurs GMC:** Google Merchant Center Help (https://support.google.com/merchants)
**Mainteneur:** Romeo Dos Santos

---

**Dernière révision:** 5 novembre 2025
