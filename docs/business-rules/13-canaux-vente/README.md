# Module 13 - Canaux de Vente

**Version:** 1.0.0
**Date création:** 5 novembre 2025
**Dernière mise à jour:** 5 novembre 2025
**Mainteneur:** Romeo Dos Santos

---

## 🎯 Vue d'Ensemble

Le module **Canaux de Vente** gère la distribution multi-canal des produits Vérone à travers différentes plateformes de vente (marketplaces, site web, retail, B2B). Il intègre un système de **pricing intelligent** avec tarification par canal et **prix clients personnalisés** incluant un système de **ristourne/commission** pour les partenaires B2B.

**Route applicative:** `/canaux-vente`

---

## 📊 Canaux Actifs (Phase 1)

### 1. Google Merchant Center ✅ OPÉRATIONNEL

**Type:** Marketplace
**Statut:** Implémenté (attente credentials GCP)
**Route:** `/canaux-vente/google-merchant`
**Discount par défaut:** Variable selon produit

**Fonctionnalités:**

- Synchronisation automatique produits vers Google Shopping
- Mapping 31 colonnes obligatoires Google
- Gestion variantes (color/size → item_group_id)
- Export Excel format Google Merchant
- Statistiques: Produits synced, Impressions, Clics, Conversions
- Tests validation automatisés

**Documentation:** Voir [`google-merchant/README.md`](./google-merchant/README.md)

---

### 2. Boutique en Ligne (Site Vérone) ✅ CONFIGURÉ

**Type:** E-commerce propriétaire
**Statut:** Mock data (à connecter Supabase)
**Route:** `/canaux-vente/boutique` (TODO)
**Discount par défaut:** Variable selon catalogue

**Canal primaire pour:**

- Ventes directes clients finaux
- Présentation catalogue complet
- Programmes fidélité
- Personnalisation expérience client

---

### 3. Retail (Magasin Physique) ✅ CONFIGURÉ

**Type:** Point de vente physique
**Statut:** Canal database configuré
**Discount par défaut:** NULL (prix base)

**Utilisation:**

- Ventes en magasin
- Showroom
- Prix recommandés clients finaux
- Pas de remise canal (remises individuelles possibles)

---

### 4. Wholesale (Vente en Gros) ✅ CONFIGURÉ

**Type:** B2B Grossistes
**Statut:** Canal database configuré
**Discount par défaut:** 20%

**Critères d'accès:**

- Achat volume (MOQ)
- Contrats cadre
- Partenaires revendeurs
- Remise 20% appliquée automatiquement sur prix base

---

### 5. B2B (Plateforme B2B) ✅ CONFIGURÉ

**Type:** Espace client professionnel
**Statut:** Canal database configuré
**Discount par défaut:** 15%

**Fonctionnalités:**

- Espace client dédié
- Commandes récurrentes
- Historique achats
- Remise 15% appliquée automatiquement

---

## 🔜 Canaux Futurs (Phase 2+)

### 6. Instagram Shopping ⏳ PRÉVU PHASE 2

**Type:** Social Commerce
**Statut:** UI préparée (grisée)
**API:** Facebook Commerce API

**Documentation:** Voir [`futurs-canaux.md`](./futurs-canaux.md#instagram-shopping)

---

### 7. Facebook Marketplace ⏳ PRÉVU PHASE 2

**Type:** Marketplace Social
**Statut:** UI préparée (grisée)
**API:** Facebook Marketing API

**Documentation:** Voir [`futurs-canaux.md`](./futurs-canaux.md#facebook-marketplace)

---

### 8. TikTok Shop ⏳ PRÉVU PHASE 2+

**Type:** Social Commerce
**Statut:** Roadmap Phase 2+
**API:** TikTok for Business API

**Documentation:** Voir [`futurs-canaux.md`](./futurs-canaux.md#tiktok-shop)

---

## 💰 Architecture Pricing Multi-Canal

### Principe: Waterfall Pricing

Le système applique les prix selon une **hiérarchie de priorités** (du plus spécifique au plus générique):

```
1. Prix Client Spécifique      (PRIORITÉ MAX)
   ↓ (si non trouvé)
2. Prix Canal
   ↓ (si non trouvé)
3. Prix Package/Liste
   ↓ (si non trouvé)
4. Prix Base Produit           (FALLBACK)
```

**Exemple concret:**

```
Produit: Fauteuil Milo
Prix base: 1200€

Client A (wholesale, pas de prix spécifique):
→ Prix canal wholesale (-20%) = 960€

Client B (wholesale, prix spécifique négocié):
→ Prix client B = 900€ (PRIORITÉ sur prix canal)
```

**Documentation technique:** `docs/business-rules/05-pricing-tarification/pricing-multi-canaux-clients.md`

---

## 🤝 Système Prix Clients & Ristourne

### Prix Clients Personnalisés

**Route:** `/canaux-vente/prix-clients`
**Documentation:** Voir [`prix-clients/README.md`](./prix-clients/README.md)

**Principe:**

- Prix négociés contractuels par client/produit
- Validation workflow (commercial → admin)
- Traçabilité complète (contrat, dates validité)
- Priorité MAX dans waterfall pricing

---

### Système Ristourne/Commission B2B ⭐ NOUVEAU

**Date implémentation:** 25 octobre 2025
**Table:** `customer_pricing.retrocession_rate`

**Principe:**
Commission calculée **par ligne de commande** (pas globale) et reversée au client.

**Exemple concret:**

```
Cas d'usage: RFA (Réseau Français Ameublement)

Produit: Canapé 100€
RFA souhaite: 10% commission

Configuration:
→ customer_pricing.retrocession_rate = 10%

Commande créée:
→ Ligne 1: total_ht = 100€
→ retrocession_rate = 10% (snapshot)
→ retrocession_amount = 10€ (calculé automatiquement)

Facture client: 100€
Ristourne à reverser: 10€
```

**Calcul automatique:**

- Trigger database calcule `retrocession_amount` sur chaque ligne
- RPC `get_order_total_retrocession(order_id)` pour total commande
- Traçabilité complète dans `sales_order_items`

**Documentation:** [`prix-clients/README.md`](./prix-clients/README.md#ristourne-commission)

---

## 🗄️ Tables Database

### Tables Canaux

| Table                 | Description                    | Rows actuelles                                         |
| --------------------- | ------------------------------ | ------------------------------------------------------ |
| `sales_channels`      | Canaux de vente configurés     | 5 (retail, wholesale, ecommerce, b2b, google_merchant) |
| `channel_pricing`     | Prix par canal/produit         | Variable                                               |
| `channel_price_lists` | Association canal → price_list | Variable                                               |

### Tables Prix Clients

| Table                  | Description                      | Rows actuelles |
| ---------------------- | -------------------------------- | -------------- |
| `customer_pricing`     | Prix spécifiques client/produit  | Variable       |
| `customer_price_lists` | Association client → price_list  | Variable       |
| `customer_groups`      | Groupes clients (tarifs groupés) | Variable       |
| `group_price_lists`    | Association groupe → price_list  | Variable       |

### Tables Price Lists

| Table                | Description                   | Rows actuelles                        |
| -------------------- | ----------------------------- | ------------------------------------- |
| `price_lists`        | Listes de prix (catalogues)   | 2 (Liste principale, Liste wholesale) |
| `price_list_items`   | Prix par produit dans liste   | 16/18 produits                        |
| `price_list_history` | Historique modifications prix | Audit trail complet                   |

**Documentation technique:** `docs/database/pricing-architecture.md`

---

## 🔧 Composants React

### Pages

| Route                           | Fichier                                                                           | Statut                    |
| ------------------------------- | --------------------------------------------------------------------------------- | ------------------------- |
| `/canaux-vente`                 | `apps/back-office/apps/back-office/src/app/canaux-vente/page.tsx`                 | ✅ Implémenté (mock data) |
| `/canaux-vente/google-merchant` | `apps/back-office/apps/back-office/src/app/canaux-vente/google-merchant/page.tsx` | ✅ Production-ready       |
| `/canaux-vente/prix-clients`    | `apps/back-office/apps/back-office/src/app/canaux-vente/prix-clients/page.tsx`    | ✅ MVP (CRUD incomplet)   |

### Hooks

| Hook                          | Fichier                                                      | Fonctionnalités                                                                        |
| ----------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `use-pricing.ts`              | `apps/back-office/apps/back-office/src/hooks/use-pricing.ts` | `useProductPrice()`, `useBatchPricing()`, `useSalesChannels()`, `useCustomerPricing()` |
| `use-google-merchant-sync.ts` | Hook spécifique GMC                                          | Synchronisation, progress, error handling                                              |

### Composants Business

| Composant         | Fichier                                                                          | Usage                                   |
| ----------------- | -------------------------------------------------------------------------------- | --------------------------------------- |
| `ChannelSelector` | `apps/back-office/apps/back-office/src/components/business/channel-selector.tsx` | Dropdown sélection canal (réutilisable) |

---

## 🚀 Migrations Database

### Migrations Fondatrices (Octobre 2025)

| Date       | Fichier                                 | Description                                                    |
| ---------- | --------------------------------------- | -------------------------------------------------------------- |
| 2025-10-10 | `001_sales_channels_pricing_system.sql` | Tables `sales_channels`, `channel_pricing`, `customer_pricing` |
| 2025-10-10 | `002_price_lists_system.sql`            | Tables `price_lists`, `price_list_items`, `price_list_history` |
| 2025-10-10 | `003_customer_channel_price_lists.sql`  | Associations canaux/clients/groupes                            |
| 2025-10-10 | `005_price_calculation_function_v2.sql` | RPC `calculate_product_price_v2()`                             |

### Migrations Ristourne (Octobre 2025)

| Date       | Fichier                           | Description                                         |
| ---------- | --------------------------------- | --------------------------------------------------- |
| 2025-10-25 | `002_add_retrocession_system.sql` | Colonnes `retrocession_rate/amount`, trigger calcul |

### Migrations Channel Tracking (Octobre-Novembre 2025)

| Date       | Fichier                                   | Description                             |
| ---------- | ----------------------------------------- | --------------------------------------- |
| 2025-10-31 | `003_add_channel_to_stock_movements.sql`  | Colonne `channel_id` dans stocks        |
| 2025-10-31 | `004_trigger_propagate_channel_sales.sql` | Propagation `channel_id` mouvements OUT |

**Emplacement:** `supabase/migrations/`

---

## 📋 Roadmap Phase 1-4

### ✅ Phase 1 (ACTUELLE) - Fondations Multi-Canal

**Statut:** 90% complète
**Date:** Octobre-Novembre 2025

**Réalisations:**

- ✅ Architecture database pricing multi-canal
- ✅ Google Merchant Center (attente credentials)
- ✅ Prix clients avec ristourne B2B
- ✅ 5 canaux configurés database
- ✅ Hook `use-pricing.ts` production-ready
- ❌ Documentation module 13 (en cours)

---

### 🔜 Phase 2 - Extension Canaux Sociaux

**Statut:** Planifiée
**Date estimée:** Q1 2026

**Objectifs:**

- Instagram Shopping (API Facebook Commerce)
- Facebook Marketplace (API Facebook Marketing)
- Migration mock data → Supabase
- Compléter CRUD prix clients
- Analytics multi-canal

**Documentation:** [`futurs-canaux.md`](./futurs-canaux.md)

---

### 🔜 Phase 3 - TikTok & Optimisations

**Statut:** Roadmap
**Date estimée:** Q2 2026

**Objectifs:**

- TikTok Shop (API TikTok for Business)
- Synchronisation automatique multi-canal
- Feed management centralisé
- A/B testing pricing par canal

---

### 🔜 Phase 4 - Intelligence & Automatisation

**Statut:** Vision
**Date estimée:** Q3 2026

**Objectifs:**

- Pricing dynamique (AI-driven)
- Recommandations canaux optimaux par produit
- Attribution multi-touch revenue
- Optimisation inventaire cross-channel

---

## 🔗 Documentation Associée

### Business Rules

- [`05-pricing-tarification/pricing-multi-canaux-clients.md`](../05-pricing-tarification/pricing-multi-canaux-clients.md) - Architecture pricing complète
- [`05-pricing-tarification/tarification.md`](../05-pricing-tarification/tarification.md) - Règles métier génériques
- [`google-merchant/README.md`](./google-merchant/README.md) - Google Merchant Center
- [`prix-clients/README.md`](./prix-clients/README.md) - Prix clients & ristourne
- [`futurs-canaux.md`](./futurs-canaux.md) - Instagram, Facebook, TikTok

### Documentation Technique

- `docs/database/pricing-architecture.md` - Architecture database pricing
- `docs/database/SCHEMA-REFERENCE.md` - Référence tables (sales_channels, etc.)

### Guides Google Merchant

- `docs/guides/GOOGLE-MERCHANT-RESUME-EXECUTIF.md` - Checklist configuration 40-50min
- `docs/guides/GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md` - Guide pas-à-pas
- `docs/guides/GOOGLE-MERCHANT-INTEGRATION-PLAN-COMPLET.md` - Architecture complète

---

## 📞 Support & Contact

**Questions architecture:** Voir `docs/database/pricing-architecture.md`
**Questions business rules:** Voir sous-documentations module 13
**Issues techniques:** GitHub Issues
**Mainteneur:** Romeo Dos Santos

---

**Dernière révision:** 5 novembre 2025
