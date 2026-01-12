# Futurs Canaux de Vente - Spécifications Phase 2+

**Version:** 1.0.0
**Date création:** 5 novembre 2025
**Phase:** Phase 2+ (Roadmap)
**Statut:** ⏳ Planifié (non implémenté)

---

## 🎯 Vue d'Ensemble

Ce document décrit les **canaux de vente sociaux** prévus en Phase 2+ pour étendre la distribution multi-canal Vérone au-delà de Google Merchant Center.

**Canaux prévus:**

1. Instagram Shopping (Phase 2 - Q1 2026)
2. Facebook Marketplace (Phase 2 - Q1 2026)
3. TikTok Shop (Phase 3 - Q2 2026)

**Statut UI:** Visible page `/canaux-vente` (cartes grisées "Bientôt disponible")

---

## 🔮 Timeline Roadmap

| Phase          | Période           | Canaux                                   | Priorité    |
| -------------- | ----------------- | ---------------------------------------- | ----------- |
| **Phase 1** ✅ | Oct-Nov 2025      | Google Merchant Center                   | P0 (ACTUEL) |
| **Phase 2** ⏳ | Q1 2026 (Jan-Mar) | Instagram Shopping, Facebook Marketplace | P1          |
| **Phase 3** ⏳ | Q2 2026 (Avr-Jun) | TikTok Shop                              | P2          |
| **Phase 4** ⏳ | Q3 2026 (Jul-Sep) | Autres canaux (Amazon, eBay, etc.)       | P3          |

**Critères priorisation:**

- ROI estimé (revenus potentiels)
- Complexité technique API
- Audience cible Vérone (décoration haut de gamme)
- Coûts intégration/maintenance

---

## 📱 1. Instagram Shopping

### Vue d'Ensemble

**Type:** Social Commerce
**API:** Meta Commerce Manager (anciennement Facebook Commerce API)
**Audience:** B2C, 18-45 ans, CSP+, passionnés design/décoration
**Potentiel CA:** Estimé 15-20% CA total Vérone (optimiste)

**Statut UI:** Carte visible `/canaux-vente` (grisée Phase 2)

---

### Business Case

**Avantages:**

- ✅ Audience engagée décoration/design (forte affinité Instagram)
- ✅ Shopping natif Instagram (checkout in-app ou redirection site)
- ✅ Contenu visuel premium (photos/vidéos produits ambiance)
- ✅ Influenceurs/ambassadeurs (tagging produits stories/posts)
- ✅ Retargeting publicitaire Facebook Ads

**Inconvénients:**

- ❌ Commission Meta: 5% ventes checkout Instagram (si checkout in-app)
- ❌ Audience principalement mobile (expérience desktop limitée)
- ❌ Catalogue limité produits visuels (moins adapté composants techniques)

**Cible produits Vérone:**

- ⭐⭐⭐ Mobilier design (fauteuils, canapés, tables)
- ⭐⭐⭐ Luminaires décoratifs
- ⭐⭐ Décoration murale
- ⭐ Textile maison

---

### Requirements Techniques

#### API Meta Commerce Manager

**Documentation officielle:** https://developers.facebook.com/docs/commerce-platform

**Endpoints principaux:**

```
POST /instagram_business_account/product_catalogs  # Créer catalogue
POST /product_catalog/products                     # Ajouter produits
POST /product_catalog/product_sets                 # Collections
GET  /product_catalog/products                     # Lister produits
DELETE /product_catalog/products/{id}              # Supprimer produit
```

**Credentials requis:**

- Facebook App ID
- Facebook App Secret
- Instagram Business Account ID
- Access Token (User Access Token avec permissions `instagram_shopping_tag_products`, `catalog_management`)

**Rate Limits:**

- 200 appels/heure (standard tier)
- 4800 appels/heure (business tier, payant)

---

#### Mapping Colonnes Instagram Shopping

**Colonnes obligatoires (15 colonnes vs 31 Google Merchant):**

| Colonne Instagram | Source Vérone                           | Transformation                      | Notes                          |
| ----------------- | --------------------------------------- | ----------------------------------- | ------------------------------ |
| `id`              | `products.id`                           | UUID → String                       | Identifiant unique             |
| `title`           | `products.name`                         | Max 200 caractères                  | Plus flexible que Google (150) |
| `description`     | `products.description`                  | HTML → Texte brut, max 9999 car     | Pas de limite stricte          |
| `availability`    | Calculé                                 | `in stock` / `out of stock`         | Identique Google               |
| `condition`       | Hardcoded                               | `new`                               | Toujours neuf                  |
| `price`           | `price_list_items.retail_price_ttc`     | Format `{montant} {devise}`         | `1440.00 EUR`                  |
| `link`            | Dynamique                               | `https://verone.fr/produits/{slug}` | URL produit site               |
| `image_url`       | `product_images.image_url` (is_primary) | URL publique                        | Min 500x500 pixels             |
| `brand`           | Hardcoded                               | `Vérone`                            | Nom marque                     |
| `product_type`    | `categories.name`                       | Taxonomy libre                      | "Mobilier > Fauteuils"         |

**Colonnes optionnelles recommandées:**

- `additional_image_urls` (max 20 images vs 10 Google)
- `color` (variantes)
- `size` (variantes)
- `material` (filtres recherche)
- `sale_price` (prix promo)
- `gender` (si applicable, rare mobilier)
- `age_group` (si applicable)

**Différences vs Google Merchant:**

- ✅ Moins de colonnes obligatoires (15 vs 31)
- ✅ Descriptions plus longues acceptées
- ✅ Plus d'images autorisées (20 vs 10)
- ❌ Pas de variantes automatiques `item_group_id` (géré différemment)
- ❌ GTIN/MPN moins importants (focus visuel)

---

#### Workflow Synchronisation

**Mode Manuel (Phase 2.1):**

```
1. Commercial sélectionne produits → "Synchroniser Instagram"
   ↓
2. Validation éligibilité:
   - Min 1 image 500x500 pixels
   - Prix configuré
   - Description >50 caractères
   ↓
3. Transformation Supabase → Meta Commerce format
   ↓
4. Appel API Meta POST /product_catalog/products
   ↓
5. Feedback temps réel:
   - Success: "10 produits synchronisés Instagram"
   - Erreurs: Liste par produit
```

**Mode Automatique (Phase 2.2):**

- Trigger database sur modification produit
- Sync différée (1h délai) sauf prix (immédiat)
- Webhook Meta Commerce (notifications erreurs catalogue)

---

#### Instagram Shopping Tags

**Fonctionnalité clé:** Tagging produits dans posts/stories Instagram

**Workflow:**

```
1. Vérone poste photo ambiance fauteuil Milo sur Instagram
   ↓
2. Lors création post, tag produit "Fauteuil Milo" depuis catalogue
   ↓
3. Post publié avec icône shopping
   ↓
4. Utilisateur clique icône → Fiche produit in-app
   ↓
5. "Voir sur le site" → Redirection https://verone.fr/produits/fauteuil-milo
   ↓
6. Achat sur site Vérone (pas checkout Instagram France actuellement)
```

**Note:** Checkout in-app Instagram disponible USA uniquement (2025). France = redirection obligatoire vers site marchand.

---

### Statistiques & KPIs

**Métriques à tracker (Meta Commerce Insights API):**

| Métrique                    | Source API                         | Objectif Phase 2     |
| --------------------------- | ---------------------------------- | -------------------- |
| **Produits catalogue**      | `product_catalog/products` COUNT   | 18 (100% catalogue)  |
| **Impressions produits**    | Commerce Insights                  | 50,000+/mois         |
| **Clics produits**          | Commerce Insights                  | 2,500+/mois (CTR 5%) |
| **Conversions site**        | Google Analytics 4 (UTM Instagram) | 50+/mois             |
| **Revenue Instagram**       | GA4 (attribution)                  | 3,000€+/mois         |
| **Engagement posts tagués** | Instagram Insights                 | 5%+ engagement rate  |

**Intégration GA4:**

```
URL produits Instagram:
https://verone.fr/produits/{slug}?utm_source=instagram&utm_medium=shopping&utm_campaign=catalogue
```

---

### Checklist Implémentation Phase 2

#### Prérequis (1 semaine)

- [ ] Convertir compte Instagram en Business Account
- [ ] Lier compte Instagram à Page Facebook Vérone
- [ ] Créer Facebook App développeur
- [ ] Activer Commerce Manager Facebook
- [ ] Obtenir Access Token avec permissions shopping
- [ ] Créer Product Catalog Meta Commerce

#### Développement (2-3 semaines)

- [ ] API routes `/api/instagram-shopping/sync-product`
- [ ] Hook React `useInstagramShoppingSync()`
- [ ] Page UI `/canaux-vente/instagram-shopping`
- [ ] Transformation mapping Vérone → Meta Commerce
- [ ] Gestion erreurs catalogue
- [ ] Tests validation synchronisation

#### Go-Live (1 semaine)

- [ ] Synchronisation 18 produits catalogue
- [ ] Validation catalogue approuvé Meta (review 24-48h)
- [ ] Activation Shopping Tags posts Instagram
- [ ] Formation équipe marketing (tagging produits)
- [ ] Campagne lancement Instagram Shopping
- [ ] Monitoring quotidien métriques (14 premiers jours)

**Durée totale:** 4-5 semaines

---

## 🛒 2. Facebook Marketplace

### Vue d'Ensemble

**Type:** Marketplace P2P/B2C
**API:** Meta Commerce Manager (même que Instagram)
**Audience:** B2C, 25-55 ans, tous CSP, recherche bonnes affaires/local
**Potentiel CA:** Estimé 5-10% CA total (moins premium qu'Instagram)

**Statut UI:** Carte visible `/canaux-vente` (grisée Phase 2)

---

### Business Case

**Avantages:**

- ✅ Audience massive Facebook (30M+ France)
- ✅ Recherche locale (marketplace par ville/région)
- ✅ Gratuit (pas de commission Facebook)
- ✅ API similaire Instagram (implémentation groupée)
- ✅ Messagerie directe acheteurs (Facebook Messenger)

**Inconvénients:**

- ❌ Positionnement "bonnes affaires" (moins premium)
- ❌ Concurrence forte particuliers/d'occasion
- ❌ Attentes prix bas (vs positionnement haut de gamme Vérone)
- ❌ Expérience utilisateur moins contrôlée (vs site Vérone)

**Stratégie recommandée:**

- 🎯 Sélection produits entrée de gamme (€€ vs €€€€)
- 🎯 Stocks ancienne collection (déstockage)
- 🎯 Targeting géographique (Paris, Lyon, Bordeaux)
- 🎯 Messagerie automatisée (réponses rapides 24h)

**Cible produits Vérone:**

- ⭐⭐ Mobilier entrée de gamme (<500€)
- ⭐⭐ Ancien stock collection précédente
- ⭐ Petites pièces décoration
- ❌ Mobilier haut de gamme (risque dilution marque)

---

### Requirements Techniques

#### API Meta Commerce Manager

**Identique Instagram Shopping** (même plateforme Meta Commerce)

**Différence clé:** Paramètre `intended_surface`

```json
{
  "intended_surface": "MARKETPLACE" // vs "INSTAGRAM"
}
```

**Product Sets Marketplace:**

```
POST /product_catalog/product_sets
{
  "name": "Vérone Marketplace - Entrée Gamme",
  "filter": {
    "price": {"max": 500.00},
    "availability": "in stock"
  }
}
```

---

#### Mapping Colonnes Facebook Marketplace

**Identique Instagram Shopping** (15 colonnes obligatoires)

**Colonnes spécifiques Marketplace recommandées:**

- `location` : "Paris, France" (ciblage local)
- `delivery_options` : `["shipping", "local_pickup"]`
- `shipping_cost` : Frais port estimés
- `return_policy` : "14 jours satisfait ou remboursé"

---

#### Workflow Synchronisation

**Similaire Instagram avec filtres produits:**

```
1. Sélection automatique produits éligibles Marketplace:
   - Prix <500€ (entrée gamme)
   - Stock ancienne collection
   - Disponibilité: in stock
   ↓
2. Sync API Meta Commerce (intended_surface: MARKETPLACE)
   ↓
3. Produits visibles Marketplace 24-48h (review Meta)
```

**Règle métier:** Pas de sync automatique tous produits (protection positionnement premium).

---

### Stratégie Messagerie Facebook Messenger

**Défi:** Marketplace = nombreuses questions acheteurs via Messenger

**Solutions:**

1. **Chatbot automatique (Phase 2.1):**
   - Réponses automatiques FAQ (dimensions, délais livraison, matériaux)
   - Transfert humain si question complexe
   - SLA réponse <2h

2. **Templates réponses (Phase 2.2):**
   - Disponibilité produit
   - Options livraison
   - Conditions retour
   - Demande rendez-vous showroom

**Outil recommandé:** ManyChat OU chatbot custom Facebook Messenger API

---

### Statistiques & KPIs

**Métriques Marketplace (Meta Commerce Insights):**

| Métrique                | Objectif Phase 2               | Notes                                      |
| ----------------------- | ------------------------------ | ------------------------------------------ |
| **Produits listés**     | 10-15 (sélection entrée gamme) | Pas 100% catalogue                         |
| **Impressions**         | 20,000+/mois                   | Moins qu'Instagram (ciblage local)         |
| **Messages reçus**      | 100+/mois                      | Questions acheteurs                        |
| **Taux réponse**        | >90% <2h                       | SLA critique Marketplace                   |
| **Conversions**         | 20+/mois                       | Moins qu'Instagram (prix moyen plus bas)   |
| **Revenue Marketplace** | 1,500€+/mois                   | Revenus additionnels (pas principal canal) |

---

### Checklist Implémentation Phase 2

#### Prérequis (3 jours)

- [ ] Commerce Manager configuré (partagé avec Instagram)
- [ ] Product Set "Marketplace" créé (filtres prix/stock)
- [ ] Politiques livraison/retour rédigées
- [ ] Chatbot Messenger configuré (FAQ)

#### Développement (1 semaine)

- [ ] Réutiliser routes API Instagram (paramètre `intended_surface`)
- [ ] Hook `useFacebookMarketplaceSync()` (wrapper hook Instagram)
- [ ] Page UI `/canaux-vente/facebook-marketplace` (stats Marketplace)
- [ ] Filtrage automatique produits éligibles

#### Go-Live (3 jours)

- [ ] Sync 10-15 produits sélection
- [ ] Validation catalogue approuvé Meta
- [ ] Tests messages Messenger (chatbot)
- [ ] Monitoring taux réponse quotidien

**Durée totale:** 2 semaines (si Instagram déjà fait)

---

## 🎵 3. TikTok Shop

### Vue d'Ensemble

**Type:** Social Commerce (Live Shopping + Vidéos courtes)
**API:** TikTok for Business API (TikTok Shop Seller API)
**Audience:** B2C, 16-35 ans, GenZ/Millennials, découverte produits via vidéos
**Potentiel CA:** Estimé 10-15% CA total (marché émergent France)

**Statut UI:** Mentionné roadmap (pas encore UI)

**Lancement TikTok Shop France:** Septembre 2024 (très récent)

---

### Business Case

**Avantages:**

- ✅ Croissance explosive (TikTok Shop UK +500% 2024)
- ✅ Audience jeune engagée (découverte produits via vidéos)
- ✅ Live Shopping (ventes flash animées)
- ✅ Influenceurs TikTok (partenariats créateurs)
- ✅ Checkout in-app natif (expérience fluide)

**Inconvénients:**

- ❌ Commission TikTok: 5% ventes (similaire Instagram)
- ❌ Audience très jeune (budget limité vs haut de gamme)
- ❌ API TikTok moins mature (vs Meta/Google)
- ❌ Modération stricte (review produits lente)
- ❌ Nécessite production contenu vidéo régulier

**Stratégie recommandée:**

- 🎯 Produits visuellement impactants (vidéos courtes captivantes)
- 🎯 Prix accessibles (<1000€) pour audience jeune
- 🎯 Collaborations créateurs TikTok décoration/design
- 🎯 Live Shopping mensuel (événements exclusifs)
- 🎯 Challenges/trends TikTok (#VeroneDecoration)

**Cible produits Vérone:**

- ⭐⭐⭐ Luminaires design (très photogéniques vidéos)
- ⭐⭐⭐ Petits meubles (<500€, accessibles GenZ)
- ⭐⭐ Décoration murale/textile
- ⭐ Accessoires design (<200€)
- ❌ Mobilier massif haut de gamme (budget GenZ limité)

---

### Requirements Techniques

#### API TikTok Shop Seller

**Documentation officielle:** https://developers.tiktok.com/products/shop/

**Endpoints principaux:**

```
POST /api/products/upload                    # Créer produit
GET  /api/products/list                      # Lister produits
POST /api/products/update                    # Modifier produit
POST /api/products/activate                  # Activer vente
GET  /api/orders/list                        # Lister commandes
POST /api/logistics/shipping_providers       # Config livraison
```

**Credentials requis:**

- TikTok Shop Seller Account
- TikTok App Key (développeur)
- TikTok App Secret
- Access Token (OAuth 2.0)

**Rate Limits:**

- 10 appels/seconde (tier standard)
- 50 appels/seconde (tier business, sur demande)

---

#### Mapping Colonnes TikTok Shop

**Colonnes obligatoires (18 colonnes):**

| Colonne TikTok   | Source Vérone                       | Transformation                          | Notes                         |
| ---------------- | ----------------------------------- | --------------------------------------- | ----------------------------- |
| `product_name`   | `products.name`                     | Max 255 caractères                      | Plus flexible                 |
| `description`    | `products.description`              | HTML → Markdown, max 5000 car           | Support Markdown basique      |
| `category_id`    | Mapping manuel                      | Taxonomy TikTok                         | Catégories prédéfinies TikTok |
| `brand_name`     | Hardcoded                           | `Vérone`                                | Nom marque                    |
| `main_images`    | `product_images` (is_primary)       | Min 3 images obligatoires (vs 1 Google) | 800x800 min                   |
| `price`          | `price_list_items.retail_price_ttc` | Format cents: `144000` (=1440.00€)      | Différent Google/Meta         |
| `stock_quantity` | `available_stock`                   | Integer                                 | Sync temps réel critique      |
| `weight`         | `products.weight_kg`                | Grammes: `5000` (=5kg)                  | Pour frais port               |
| `package_length` | `products.length_cm`                | Centimètres                             | Dimensions colis              |
| `package_width`  | `products.width_cm`                 | Centimètres                             |                               |
| `package_height` | `products.height_cm`                | Centimètres                             |                               |

**Colonnes spécifiques TikTok:**

- `delivery_option_ids` : IDs options livraison configurées (Standard, Express)
- `video_ids` : Videos TikTok associées produit (⭐ CRITIQUE pour conversions)
- `is_cod_allowed` : Paiement à la livraison (COD) autorisé (false France)

**Différences majeures vs Google/Meta:**

- ✅ Support Markdown descriptions (meilleure mise en forme)
- ✅ Vidéos produits natives (clé conversions TikTok)
- ❌ Min 3 images obligatoires (vs 1 Google/Meta)
- ❌ Format prix en cents (144000 vs 1440.00 EUR)
- ❌ Dimensions colis obligatoires (calcul frais port)

---

#### Workflow Synchronisation

**Mode Manuel (Phase 3.1):**

```
1. Sélection produits éligibles TikTok Shop:
   - Min 3 images haute qualité
   - Prix <1000€ (accessible GenZ)
   - Vidéo produit disponible (recommandé)
   ↓
2. Validation éligibilité stricte:
   - Dimensions colis renseignées
   - Poids exact configuré
   - Stock >0
   ↓
3. Upload API TikTok POST /api/products/upload
   ↓
4. Review TikTok (24-72h):
   - Modération contenu
   - Vérification conformité
   ↓
5. Activation manuelle produit (POST /api/products/activate)
```

**Note:** Pas de sync automatique (review TikTok systématique).

---

#### Vidéos Produits TikTok (CRITIQUE)

**Règle TikTok Shop:** Produits AVEC vidéo = +300% conversions vs sans vidéo

**Specs vidéos:**

- Format: MP4, max 500MB
- Durée: 9-60 secondes (optimal 15-30s)
- Résolution: 720x1280 (9:16 vertical) OU 1080x1080 (carré)
- Contenu: Produit en action, styling, détails

**Stratégie production vidéos Vérone:**

1. **Phase 3.1:** Réutiliser contenu Instagram Reels existant
2. **Phase 3.2:** Production vidéos dédiées TikTok Shop (studio)
3. **Phase 3.3:** UGC (User Generated Content) clients + influenceurs

**Outil recommandé:** CapCut (éditeur vidéo TikTok officiel, templates Shop intégrés)

---

### Live Shopping TikTok

**Fonctionnalité star:** Ventes live animées (animateur + produits tagués)

**Format:**

- Live 30-60 minutes
- Animateur présente produits Vérone
- Spectateurs achètent in-live (checkout instantané)
- Remises exclusives live (urgence)

**Exemple événement:**

```
Titre: "Live Shopping Vérone - Collection Automne 2025"
Durée: 45 minutes
Animateur: Fondateur Vérone OU influenceur déco
Produits: 10-15 pièces sélection
Offre exclusive: -15% code LIVETIKTOK

Résultats attendus:
- 500-1000 spectateurs simultanés
- 30-50 ventes pendant live
- 2000-3000€ CA live
```

**Fréquence recommandée:** 1 live/mois (Phase 3)

---

### Statistiques & KPIs

**Métriques TikTok Shop (Seller Center Dashboard):**

| Métrique                    | Objectif Phase 3      | Notes                   |
| --------------------------- | --------------------- | ----------------------- |
| **Produits actifs**         | 15-20                 | Sélection ciblée GenZ   |
| **Vidéos produits**         | 15-20 (100% produits) | CRITIQUE conversions    |
| **Vues vidéos produits**    | 100,000+/mois         | Viralité TikTok         |
| **Live Shopping vues**      | 1,000+/live           | Engagement événements   |
| **Conversions TikTok Shop** | 50+/mois              | In-app checkout         |
| **Revenue TikTok Shop**     | 3,000€+/mois          | CA additionnel          |
| **GMV Live Shopping**       | 2,000€/live           | Gross Merchandise Value |

---

### Checklist Implémentation Phase 3

#### Prérequis (2 semaines)

- [ ] Créer TikTok Shop Seller Account (inscription vendeur)
- [ ] Validation compte vendeur TikTok (KYC 5-7 jours)
- [ ] Configurer options livraison (Standard, Express)
- [ ] Configurer moyens paiement (Stripe/PayPal TikTok Shop)
- [ ] Produire 15 vidéos produits (production studio)
- [ ] Créer TikTok App développeur
- [ ] Obtenir Access Token OAuth

#### Développement (3 semaines)

- [ ] API routes `/api/tiktok-shop/upload-product`
- [ ] Hook React `useTikTokShopSync()`
- [ ] Page UI `/canaux-vente/tiktok-shop`
- [ ] Upload vidéos produits (TikTok Video API)
- [ ] Gestion stock temps réel (critique TikTok)
- [ ] Webhook commandes TikTok Shop

#### Go-Live (2 semaines)

- [ ] Upload 15 produits sélection
- [ ] Soumission review TikTok (attente 24-72h)
- [ ] Activation produits approuvés
- [ ] Campagne lancement TikTok Ads
- [ ] Premier Live Shopping (test)
- [ ] Partenariat 2-3 créateurs TikTok déco
- [ ] Monitoring quotidien conversions

**Durée totale:** 7 semaines

---

## 📊 Comparaison Canaux Sociaux

| Critère                  | Instagram Shopping     | Facebook Marketplace         | TikTok Shop                  |
| ------------------------ | ---------------------- | ---------------------------- | ---------------------------- |
| **Audience**             | 18-45 ans, CSP+        | 25-55 ans, tous CSP          | 16-35 ans, GenZ              |
| **Positionnement**       | Premium, design        | Bonnes affaires              | Découverte virale            |
| **Commission**           | 5% (checkout in-app)   | 0% (gratuit)                 | 5% (checkout in-app)         |
| **API**                  | Meta Commerce (mature) | Meta Commerce (mature)       | TikTok Seller (récente)      |
| **Complexité**           | Moyenne                | Faible (similaire Instagram) | Élevée (vidéos obligatoires) |
| **CA estimé**            | 15-20%                 | 5-10%                        | 10-15%                       |
| **Priorité**             | P1 (Phase 2)           | P2 (Phase 2)                 | P2 (Phase 3)                 |
| **Durée implémentation** | 4-5 semaines           | 2 semaines                   | 7 semaines                   |

---

## 🚀 Recommandations Stratégiques

### Phase 2 (Q1 2026) - Instagram + Facebook

**Approche:** Implémentation groupée (même API Meta Commerce)

**Avantages bundling:**

- Réutilisation code API (économie développement)
- Product Catalog partagé Meta Commerce
- Apprentissage simultané 2 canaux
- ROI plus rapide (2 canaux, 1 développement)

**Timeline:**

- Semaines 1-4: Instagram Shopping (prioritaire)
- Semaines 5-6: Facebook Marketplace (réutilisation code)
- Semaines 7-8: Optimisations + monitoring

**Budget estimé:** 15-20K€ (développement + campagnes lancement)

---

### Phase 3 (Q2 2026) - TikTok Shop

**Approche:** Standalone (API différente + production vidéos)

**Prérequis critiques:**

- ✅ Production 15-20 vidéos produits professionnelles
- ✅ Stratégie contenu TikTok organique (3 mois avant Shop)
- ✅ Partenariats créateurs TikTok (2-3 influenceurs déco)
- ✅ Budget campagne TikTok Ads (5-10K€)

**Timeline:**

- Semaines 1-2: Prérequis (compte vendeur, vidéos)
- Semaines 3-5: Développement API
- Semaines 6-7: Tests + review TikTok
- Semaines 8-9: Go-live + monitoring

**Budget estimé:** 20-25K€ (développement + production vidéos + campagnes)

---

## 🔗 Documentation Associée

### Business Rules

- [`./README.md`](./README.md) - Vue d'ensemble canaux de vente
- [`./google-merchant/README.md`](./google-merchant/README.md) - Google Merchant Center (référence implémentation)

### Documentation Externe

- **Meta Commerce:** https://developers.facebook.com/docs/commerce-platform
- **Instagram Shopping:** https://business.instagram.com/shopping
- **Facebook Marketplace:** https://www.facebook.com/business/marketing/marketplace
- **TikTok Shop:** https://seller-uk.tiktok.com/ (documentation UK, bientôt FR)
- **TikTok for Business API:** https://developers.tiktok.com/products/shop/

---

## 📞 Contact & Support

**Questions stratégiques:** Romeo Dos Santos (Mainteneur)
**Questions techniques:** À définir lors implémentation Phase 2/3
**Ressources externes:** Documentation APIs officielles

---

**Dernière révision:** 5 novembre 2025
**Prochaine révision:** Q4 2025 (avant Phase 2)
