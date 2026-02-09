# Template Import Produits - Checklist Complète

**Version** : 1.0.0 (2026-02-08)
**Objectif** : Ne jamais oublier aucun champ lors de l'import de produits

---

## ⚠️ CHAMPS OBLIGATOIRES (Bloquants)

Ces champs **DOIVENT** être renseignés, sinon l'insertion échoue.

| Champ            | Type     | Description                                                             | Exemple                       |
| ---------------- | -------- | ----------------------------------------------------------------------- | ----------------------------- |
| `sku`            | `string` | **Identifiant unique produit** (format : `CAT-NNNN`)                    | `VAS-0032`, `FAU-0001`        |
| `name`           | `string` | **Nom commercial du produit**                                           | `Vase ceramic Spirituel nude` |
| `stock_status`   | `enum`   | **Statut stock** (`in_stock`, `out_of_stock`, `coming_soon`)            | `out_of_stock`                |
| `product_status` | `enum`   | **Statut produit** (`active`, `preorder`, `discontinued`, `draft`)      | `active`                      |
| `article_type`   | `enum`   | **Type comptable** (`vente_de_marchandises`, `prestations_de_services`) | `vente_de_marchandises`       |

---

## 🔥 CHAMPS CRITIQUES (Recommandés Fortement)

Ces champs ne bloquent pas l'insertion, mais **leur absence cause des problèmes métier**.

### Identification & Catégorisation

| Champ                | Type     | Description                                          | Exemple                                        | Impact si manquant                             |
| -------------------- | -------- | ---------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| `supplier_id`        | `uuid`   | **Fournisseur** (FK vers `suppliers`)                | `9078f112-6944-4732-b926-f64dcef66034` (Opjet) | ❌ Impossible de tracer la provenance          |
| `subcategory_id`     | `uuid`   | **Sous-catégorie** (FK vers `subcategories`)         | `4a915a10-0099-439f-a512-09adf0088736` (Vases) | ❌ Produit non classé dans catalogue           |
| `supplier_reference` | `string` | **Référence fournisseur** (code interne du supplier) | `015276`                                       | ⚠️ Impossible de repasser commande fournisseur |
| `brand`              | `string` | **Marque du produit**                                | `OPJET`, `HAY`, `FERM LIVING`                  | ⚠️ Pas de filtre par marque                    |

### Caractéristiques Physiques

| Champ                | Type      | Description                                                 | Exemple                                                | Impact si manquant                                   |
| -------------------- | --------- | ----------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| `weight`             | `numeric` | **Poids unitaire en kg** (net, sans emballage)              | `1.25`                                                 | ❌ **CRITIQUE** : Calcul frais de port impossible    |
| `dimensions`         | `jsonb`   | **Dimensions en cm** (`width_cm`, `height_cm`, `length_cm`) | `{"width_cm": 18, "height_cm": 28.6, "length_cm": 18}` | ⚠️ Client ne peut pas vérifier si ça rentre chez lui |
| `variant_attributes` | `jsonb`   | **Couleur + Matière** (`color`, `material`)                 | `{"color": "Bleu", "material": "ceramique"}`           | ⚠️ Client ne peut pas filtrer par couleur/matière    |

### Caractéristiques Commerciales

| Champ            | Type      | Description                                                            | Exemple                          | Impact si manquant                               |
| ---------------- | --------- | ---------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------ |
| `cost_price`     | `numeric` | **Prix d'achat HT** (base calcul marge)                                | `12.90`                          | ❌ Calcul marge impossible                       |
| `style`          | `string`  | **Style décoratif** (`contemporain`, `scandinave`, `industriel`, etc.) | `contemporain`                   | ⚠️ **MAJEUR** : Filtre front ne fonctionne pas   |
| `suitable_rooms` | `array`   | **Pièces adaptées** (enum `room_type[]`)                               | `["salon", "chambre", "bureau"]` | ⚠️ **MAJEUR** : Filtre "pièce" ne fonctionne pas |

### Stock & Réapprovisionnement

| Champ          | Type      | Description                         | Exemple | Impact si manquant                                |
| -------------- | --------- | ----------------------------------- | ------- | ------------------------------------------------- |
| `stock_real`   | `integer` | **Stock physique réel**             | `5`     | ⚠️ Risque de survente                             |
| `supplier_moq` | `integer` | **Minimum de commande fournisseur** | `4`     | ⚠️ Mauvais réappro (commande trop petite refusée) |

---

## 📝 CHAMPS RECOMMANDÉS (Confort)

Ces champs améliorent l'expérience utilisateur et la gestion quotidienne.

### Descriptions & Contenus

| Champ                   | Type    | Description                                    | Exemple                                                                 |
| ----------------------- | ------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| `description`           | `text`  | **Description marketing** (page produit front) | `Vase en céramique beige nude au design épuré...`                       |
| `technical_description` | `text`  | **Description technique** (fiche back-office)  | `Céramique émaillée, lavable à l'eau savonneuse`                        |
| `selling_points`        | `jsonb` | **Arguments de vente** (array de strings)      | `["Design épuré", "Fabrication artisanale", "Céramique haute qualité"]` |

### Médias

| Champ               | Type   | Description                            | Exemple                                          |
| ------------------- | ------ | -------------------------------------- | ------------------------------------------------ |
| `video_url`         | `text` | **URL vidéo produit** (YouTube, Vimeo) | `https://www.youtube.com/watch?v=abc123`         |
| `supplier_page_url` | `text` | **Lien catalogue fournisseur**         | `https://opjet.com/produits/vase-spirituel-nude` |

### Marges & Pricing

| Champ                      | Type      | Description                                | Exemple |
| -------------------------- | --------- | ------------------------------------------ | ------- |
| `margin_percentage`        | `numeric` | **Marge actuelle calculée** (auto-calculé) | `42.5`  |
| `target_margin_percentage` | `numeric` | **Marge cible souhaitée**                  | `45.0`  |
| `eco_tax_default`          | `numeric` | **Éco-taxe par défaut** (€ HT)             | `0.08`  |

### SEO & Publication (Site Internet)

| Champ                 | Type        | Description                                 | Exemple                                                                                            |
| --------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `slug`                | `string`    | **URL-friendly name** (auto-généré si vide) | `vase-augustin-bleu-314d048f`                                                                      |
| `meta_title`          | `text`      | **Titre SEO** (<60 caractères)              | `Vase Augustin Bleu - Décoration Contemporaine`                                                    |
| `meta_description`    | `text`      | **Description SEO** (<160 caractères)       | `Vase en céramique bleu design contemporain. Idéal pour salon, chambre, bureau. Livraison rapide.` |
| `is_published_online` | `boolean`   | **Publié sur site internet ?**              | `false`                                                                                            |
| `publication_date`    | `timestamp` | **Date de publication**                     | `2026-03-01 00:00:00+00`                                                                           |

### Affiliation (LinkMe)

| Champ                       | Type      | Description                                               | Exemple         |
| --------------------------- | --------- | --------------------------------------------------------- | --------------- |
| `enseigne_id`               | `uuid`    | **Enseigne propriétaire** (pour produits LinkMe)          | `uuid-enseigne` |
| `created_by_affiliate`      | `uuid`    | **Affilié créateur** (user_id)                            | `uuid-user`     |
| `affiliate_approval_status` | `enum`    | **Statut validation** (`pending`, `approved`, `rejected`) | `approved`      |
| `affiliate_payout_ht`       | `numeric` | **Commission affilié HT**                                 | `5.50`          |
| `affiliate_commission_rate` | `numeric` | **Taux commission** (%)                                   | `10.0`          |
| `show_on_linkme_globe`      | `boolean` | **Afficher sur globe LinkMe ?**                           | `false`         |
| `store_at_verone`           | `boolean` | **Stocké chez Verone ?**                                  | `false`         |

### Gestion Interne

| Champ                   | Type      | Description                                            | Exemple         |
| ----------------------- | --------- | ------------------------------------------------------ | --------------- |
| `condition`             | `string`  | **État produit** (`new`, `used`, `refurbished`)        | `new`           |
| `product_type`          | `string`  | **Type de produit** (`standard`, `service`, `digital`) | `standard`      |
| `gtin`                  | `string`  | **Code-barres international (EAN13)**                  | `3460000004113` |
| `min_stock`             | `integer` | **Stock minimum (alerte)**                             | `2`             |
| `reorder_point`         | `integer` | **Seuil de réappro**                                   | `10`            |
| `completion_status`     | `string`  | **Statut fiche produit** (`draft`, `complete`)         | `draft`         |
| `completion_percentage` | `integer` | **% complétude fiche** (auto-calculé)                  | `88`            |

### Variants & Groupes

| Champ              | Type      | Description                                                 | Exemple      |
| ------------------ | --------- | ----------------------------------------------------------- | ------------ |
| `variant_group_id` | `uuid`    | **Groupe de variants** (même produit, couleurs différentes) | `uuid-group` |
| `variant_position` | `integer` | **Position dans le groupe**                                 | `1`          |
| `item_group_id`    | `string`  | **Groupe d'articles** (pour lots/packs)                     | `PACK-001`   |

---

## 🚫 CHAMPS AUTO-GÉNÉRÉS (Ne PAS Renseigner Manuellement)

Ces champs sont gérés automatiquement par la base de données.

| Champ           | Type        | Description                                  |
| --------------- | ----------- | -------------------------------------------- |
| `id`            | `uuid`      | Identifiant unique (auto-généré)             |
| `created_at`    | `timestamp` | Date de création (auto)                      |
| `updated_at`    | `timestamp` | Date de modification (auto)                  |
| `search_vector` | `tsvector`  | Index de recherche full-text (auto)          |
| `slug`          | `string`    | Généré automatiquement depuis `name` si vide |

---

## 📋 VALEURS PAR DÉFAUT À CONNAÎTRE

Si ces champs ne sont pas renseignés, les valeurs suivantes seront appliquées :

| Champ                   | Valeur par défaut       |
| ----------------------- | ----------------------- |
| `condition`             | `new`                   |
| `stock_quantity`        | `0`                     |
| `stock_real`            | `0`                     |
| `stock_forecasted_in`   | `0`                     |
| `stock_forecasted_out`  | `0`                     |
| `min_stock`             | `0`                     |
| `reorder_point`         | `10`                    |
| `stock_status`          | `out_of_stock`          |
| `product_status`        | `active`                |
| `article_type`          | `vente_de_marchandises` |
| `availability_type`     | `normal`                |
| `product_type`          | `standard`              |
| `completion_status`     | `draft`                 |
| `completion_percentage` | `0`                     |
| `supplier_moq`          | `1`                     |
| `eco_tax_default`       | `0.00`                  |
| `is_published_online`   | `false`                 |
| `requires_sample`       | `false`                 |
| `store_at_verone`       | `false`                 |
| `show_on_linkme_globe`  | `false`                 |
| `variant_attributes`    | `{}`                    |
| `dimensions`            | `{}`                    |
| `suitable_rooms`        | `[]`                    |

---

## 📖 EXEMPLE COMPLET : Produit Opjet

```sql
INSERT INTO products (
  -- 🔴 OBLIGATOIRES
  sku,
  name,
  stock_status,
  product_status,
  article_type,

  -- 🔥 CRITIQUES
  supplier_id,
  subcategory_id,
  supplier_reference,
  brand,
  weight,
  dimensions,
  variant_attributes,
  cost_price,
  style,
  suitable_rooms,
  stock_real,
  supplier_moq,

  -- 📝 RECOMMANDÉS
  description,
  technical_description,
  gtin,
  condition,
  product_type,
  completion_status,
  completion_percentage
)
VALUES (
  -- 🔴 OBLIGATOIRES
  'VAS-0032',
  'Vase ceramic Spirituel nude',
  'out_of_stock',
  'active',
  'vente_de_marchandises',

  -- 🔥 CRITIQUES
  '9078f112-6944-4732-b926-f64dcef66034',  -- Opjet
  '4a915a10-0099-439f-a512-09adf0088736',  -- Sous-catégorie Vases
  '015276',
  'OPJET',
  0.9,  -- kg (calculé depuis facture : 3.6kg / 4 unités)
  '{"width_cm": 15, "height_cm": 20, "length_cm": 15}'::jsonb,
  '{"color": "Beige nude", "material": "ceramique"}'::jsonb,
  12.90,
  'contemporain',
  ARRAY['salon', 'salle_a_manger', 'chambre', 'bureau', 'hall_entree']::room_type[],
  0,
  4,  -- MOQ Opjet = 4 unités

  -- 📝 RECOMMANDÉS
  'Vase en céramique beige nude au design épuré et spirituel. Parfait pour décorer votre intérieur.',
  'Céramique émaillée haute qualité. Dimensions : D15 x H20 cm. Poids : 0.9kg.',
  '3460000004113',
  'new',
  'standard',
  'draft',
  75
);
```

---

## 🔍 CHAMPS SPÉCIAUX : Formats JSONB

### `dimensions` (JSONB)

```json
{
  "width_cm": 18.0, // Largeur en cm
  "height_cm": 28.6, // Hauteur en cm
  "length_cm": 18.0 // Profondeur en cm
}
```

### `variant_attributes` (JSONB)

```json
{
  "color": "Bleu", // Couleur principale
  "material": "ceramique", // Matière principale
  "color_secondary": "Blanc", // Couleur secondaire (optionnel)
  "material_secondary": "bois" // Matière secondaire (optionnel)
}
```

### `selling_points` (JSONB Array)

```json
[
  "Design épuré et contemporain",
  "Fabrication artisanale française",
  "Céramique haute qualité",
  "Livraison rapide 48-72h"
]
```

---

## 🎯 VALEURS ENUM : Référence Rapide

### `stock_status`

- `in_stock` - En stock
- `out_of_stock` - Rupture de stock
- `coming_soon` - Bientôt disponible

### `product_status`

- `active` - Actif (vendable)
- `preorder` - Précommande
- `discontinued` - Arrêté
- `draft` - Brouillon

### `article_type`

- `vente_de_marchandises` - Produit physique (défaut)
- `prestations_de_services` - Prestation de service

### `availability_type`

- `normal` - Disponibilité normale (défaut)
- `preorder` - Précommande
- `coming_soon` - Bientôt disponible
- `discontinued` - Arrêté

### `affiliate_approval_status`

- `pending` - En attente validation
- `approved` - Approuvé
- `rejected` - Refusé

### `condition`

- `new` - Neuf (défaut)
- `used` - Occasion
- `refurbished` - Reconditionné

### `room_type[]` (Array)

Valeurs possibles pour `suitable_rooms` :

- `salon`, `salle_a_manger`, `cuisine`, `chambre`, `salle_de_bain`, `bureau`, `hall_entree`, `couloir`, `bibliotheque`, `salon_sejour`, `wc`, `toilettes`, `cave`, `garage`, `grenier`, `terrasse`, `balcon`, `jardin`, `veranda`, `patio`, `dressing`

**⚠️ Éviter** : `wc`, `toilettes`, `cave`, `garage`, `grenier` pour les meubles principaux (aberration métier)

---

## 🛠️ WORKFLOW IMPORT RECOMMANDÉ

### Étape 1 : Collecte Données Facture

- [ ] Nom produit
- [ ] Référence fournisseur
- [ ] Prix d'achat HT
- [ ] Quantité commandée
- [ ] Poids brut total
- [ ] Poids net total

### Étape 2 : Calculs

- [ ] **Poids unitaire** = Poids net total / Quantité
- [ ] **SKU** = Calculer prochain numéro de séquence par catégorie

### Étape 3 : Recherche Complémentaire

- [ ] Dimensions (site fournisseur ou mesure physique)
- [ ] Couleur + Matière (visuel + catalogue)
- [ ] Style (contemporain, scandinave, etc.)
- [ ] Pièces adaptées (logique métier selon type produit)
- [ ] GTIN/EAN13 (si disponible)

### Étape 4 : Insertion Base

- [ ] Préparer requête SQL avec TOUS les champs critiques
- [ ] Exécuter insertion
- [ ] Vérifier `completion_percentage` (objectif : >80%)

### Étape 5 : Validation

- [ ] Vérifier poids présent (critique calcul frais de port)
- [ ] Vérifier style présent (critique filtres front)
- [ ] Vérifier pièces adaptées non aberrantes (pas de fauteuils dans WC)
- [ ] Vérifier variant_attributes complet (couleur + matière)

---

## 📚 Ressources & Documentation

- **Schéma complet** : `information_schema.columns WHERE table_name = 'products'`
- **Types TypeScript** : `packages/@verone/types/src/supabase.ts`
- **Enum `room_type`** : `packages/@verone/types/src/room-types.ts`
- **Patterns RLS** : `.claude/rules/database/rls-patterns.md`

---

## 🔄 Historique des Mises à Jour

| Version | Date       | Changements                                                                  |
| ------- | ---------- | ---------------------------------------------------------------------------- |
| 1.0.0   | 2026-02-08 | Création initiale suite audit table `products` et corrections produits Opjet |

---

**Maintenu par** : Romeo & Claude Code
**Dernière révision** : 2026-02-08
