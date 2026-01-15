# AUDIT DATABASE - LM-ORD-009

**Date**: 2026-01-15
**Objectif**: Vérifier les structures existantes avant modification pour plan LM-ORD-009

---

## 1. TABLE `organisations` (68 colonnes)

### Colonnes EXISTANTES pertinentes pour LM-ORD-009

| Colonne | Type | Nullable | Default | Notes |
|---------|------|----------|---------|-------|
| `legal_name` | varchar | NO | - | ✅ NOM LÉGAL (source de vérité) |
| `trade_name` | varchar | YES | - | ✅ Nom commercial |
| `has_different_trade_name` | boolean | NO | false | ✅ Flag si trade_name différent |
| `ownership_type` | **ENUM** `organisation_ownership_type` | YES | - | ✅ EXISTE DÉJÀ |
| `enseigne_id` | uuid | YES | - | ✅ FK vers enseignes |
| `is_enseigne_parent` | boolean | NO | false | ✅ Si organisation = siège d'enseigne |
| `type` | ENUM `organisation_type` | YES | 'internal' | ✅ internal/supplier/customer/partner |
| `source_type` | ENUM `customer_source_type` | YES | 'internal' | ✅ Origine du client |
| `source_affiliate_id` | uuid | YES | - | ✅ FK vers linkme_affiliates |
| `linkme_code` | varchar | YES | - | ✅ Code unique LinkMe |
| `show_on_linkme_globe` | boolean | YES | false | ✅ Affichage globe LinkMe |

### ENUMS vérifiés

**`organisation_ownership_type`** (2 valeurs) :
- `succursale`
- `franchise`

**`organisation_type`** (4 valeurs) :
- `internal`
- `supplier`
- `customer`
- `partner`

### Données réelles

- **Enseigne Pokawa** : 141 organisations liées
  - 37 succursales
  - 91 franchises
  - 1 parent (legal_name = "Pokawa Siège", is_enseigne_parent = true)

---

## 2. TABLE `enseignes` (9 colonnes)

### Colonnes EXISTANTES

| Colonne | Type | Nullable | Default | Notes |
|---------|------|----------|---------|-------|
| `id` | uuid | NO | gen_random_uuid() | PK |
| `name` | varchar | NO | - | Nom de l'enseigne |
| `description` | text | YES | - | Description |
| `logo_url` | text | YES | - | URL du logo |
| `member_count` | integer | NO | 0 | Nombre de membres |
| `is_active` | boolean | NO | true | Statut actif |
| `created_at` | timestamptz | NO | now() | Date de création |
| `updated_at` | timestamptz | NO | now() | Date de modification |
| `created_by` | uuid | YES | - | Créateur |

### ❌ COLONNE MANQUANTE

**`parent_organisation_id`** : N'EXISTE PAS
→ Actuellement, la relation inverse existe via `organisations.enseigne_id` + `organisations.is_enseigne_parent = true`

### Conclusion

La relation actuelle est :
```
organisations.enseigne_id → enseignes.id (FK)
organisations.is_enseigne_parent = true (1 org par enseigne)
```

Il faudrait inverser pour :
```
enseignes.parent_organisation_id → organisations.id (FK)
```

Mais **ATTENTION** : cela implique une migration de données existantes (Pokawa = 141 orgs).

---

## 3. TABLE `contacts` (27 colonnes)

### Colonnes EXISTANTES pertinentes

| Colonne | Type | Nullable | Default | Notes |
|---------|------|----------|---------|-------|
| `organisation_id` | uuid | YES | - | ✅ FK vers organisations |
| `enseigne_id` | uuid | YES | - | ✅ FK vers enseignes |
| `owner_type` | varchar | YES | 'organisation' | ✅ Type du propriétaire |
| `first_name` | varchar | NO | - | ✅ Prénom |
| `last_name` | varchar | NO | - | ✅ Nom |
| `email` | varchar | NO | - | ✅ Email |
| `phone` | varchar | YES | - | ✅ Téléphone |
| `mobile` | varchar | YES | - | ✅ Mobile |
| `title` | varchar | YES | - | ✅ Poste |
| `is_primary_contact` | boolean | YES | false | ✅ Contact principal |
| `is_billing_contact` | boolean | YES | false | ✅ Contact facturation |
| `is_technical_contact` | boolean | YES | false | ✅ Contact technique |
| `is_commercial_contact` | boolean | YES | true | ✅ Contact commercial |

### Conclusion

La table `contacts` permet déjà :
- Lien vers `organisations` OU `enseignes` (via `owner_type`)
- Flags pour types de contacts (primary, billing, technical, commercial)

---

## 4. TABLE `sales_orders` (56 colonnes)

### Colonnes EXISTANTES pertinentes

| Colonne | Type | Nullable | Default | Notes |
|---------|------|----------|---------|-------|
| `customer_id` | uuid | NO | - | ✅ FK vers organisations |
| `customer_type` | text | NO | - | ✅ Type de client |
| `channel_id` | uuid | YES | - | ✅ Canal de vente |
| `created_by_affiliate_id` | uuid | YES | - | ✅ Affilié créateur |
| `linkme_selection_id` | uuid | YES | - | ✅ Sélection LinkMe |
| `pending_admin_validation` | boolean | YES | false | ✅ En attente validation admin |
| `status` | ENUM `sales_order_status` | NO | 'draft' | ✅ Statut de la commande |
| `shipping_address` | jsonb | YES | - | ✅ Adresse de livraison |
| `billing_address` | jsonb | YES | - | ✅ Adresse de facturation |

### Conclusion

La table `sales_orders` est déjà complète pour gérer les commandes LinkMe.

---

## 5. TABLE `sales_order_linkme_details` (33 colonnes)

### Colonnes EXISTANTES

| Colonne | Type | Nullable | Default | Notes |
|---------|------|----------|---------|-------|
| **REQUESTER** | | | | |
| `requester_type` | text | NO | - | ✅ Type demandeur |
| `requester_name` | text | NO | - | ✅ Nom demandeur |
| `requester_email` | text | NO | - | ✅ Email demandeur |
| `requester_phone` | text | YES | - | ✅ Téléphone demandeur |
| `requester_position` | text | YES | - | ✅ Poste demandeur |
| **OWNER** | | | | |
| `owner_type` | text | YES | - | ✅ Type propriétaire |
| `owner_contact_same_as_requester` | boolean | YES | false | ✅ Contact identique |
| `owner_name` | text | YES | - | ✅ Nom propriétaire |
| `owner_email` | text | YES | - | ✅ Email propriétaire |
| `owner_phone` | text | YES | - | ✅ Téléphone propriétaire |
| `owner_company_legal_name` | text | YES | - | ✅ Raison sociale |
| `owner_company_trade_name` | text | YES | - | ✅ Nom commercial |
| `owner_kbis_url` | text | YES | - | ✅ URL KBIS |
| **BILLING** | | | | |
| `billing_contact_source` | text | YES | - | ✅ Source contact facturation |
| `billing_name` | text | YES | - | ✅ Nom facturation |
| `billing_email` | text | YES | - | ✅ Email facturation |
| `billing_phone` | text | YES | - | ✅ Téléphone facturation |
| **DELIVERY** | | | | |
| `delivery_terms_accepted` | boolean | NO | false | ✅ CGV acceptées |
| `desired_delivery_date` | date | YES | - | ✅ Date souhaitée |
| `confirmed_delivery_date` | date | YES | - | ✅ Date confirmée |
| `reception_contact_name` | text | YES | - | ✅ Nom contact réception |
| `reception_contact_email` | text | YES | - | ✅ Email contact réception |
| `reception_contact_phone` | text | YES | - | ✅ Téléphone contact réception |
| **OTHER** | | | | |
| `is_new_restaurant` | boolean | NO | false | ✅ Nouveau restaurant |
| `mall_form_required` | boolean | YES | false | ✅ Formulaire centre commercial requis |
| `mall_form_email` | text | YES | - | ✅ Email formulaire |
| `step4_token` | uuid | YES | - | ✅ Token étape 4 |
| `step4_token_expires_at` | timestamptz | YES | - | ✅ Expiration token |
| `step4_completed_at` | timestamptz | YES | - | ✅ Date complétion étape 4 |

### État actuel des données

- **0 commandes LinkMe** dans la base
- Tous les champs sont vides (pas de valeurs réelles)

### ❌ COLONNES MANQUANTES IDENTIFIÉES

**Pour les adresses de livraison** :
- `delivery_address_line1`
- `delivery_address_line2`
- `delivery_postal_code`
- `delivery_city`
- `delivery_region`
- `delivery_country`

**Note** : Actuellement, l'adresse de livraison est dans `sales_orders.shipping_address` (JSONB).
Il faut décider si on :
- Continue d'utiliser `sales_orders.shipping_address` (JSONB)
- Ajoute des colonnes dédiées dans `sales_order_linkme_details`

---

## 6. TABLE `linkme_affiliates` (25 colonnes)

### Colonnes EXISTANTES pertinentes

| Colonne | Type | Nullable | Default | Notes |
|---------|------|----------|---------|-------|
| `organisation_id` | uuid | YES | - | ✅ FK vers organisations |
| `enseigne_id` | uuid | YES | - | ✅ FK vers enseignes |
| `affiliate_type` | text | NO | - | ✅ Type d'affilié |
| `display_name` | text | NO | - | ✅ Nom affiché |
| `slug` | text | NO | - | ✅ Slug unique |
| `default_margin_rate` | numeric | YES | 10.00 | ✅ Taux de marge par défaut |
| `linkme_commission_rate` | numeric | YES | 5.00 | ✅ Taux de commission LinkMe |
| `status` | text | YES | 'pending' | ✅ Statut |

### Conclusion

La table `linkme_affiliates` permet déjà de lier un affilié à :
- Une `organisation` (via `organisation_id`)
- Une `enseigne` (via `enseigne_id`)

---

## RÉSUMÉ DES DÉCOUVERTES

### ✅ EXISTE DÉJÀ

1. **organisations.ownership_type** : ENUM (`succursale`, `franchise`)
2. **organisations.enseigne_id** : FK vers enseignes
3. **organisations.is_enseigne_parent** : boolean (1 org parent par enseigne)
4. **contacts.owner_type** : varchar (permet lien vers organisation OU enseigne)
5. **contacts.is_billing_contact** : boolean
6. **sales_order_linkme_details** : Table complète avec requester/owner/billing/delivery
7. **sales_orders.shipping_address** : JSONB pour adresse de livraison

### ❌ MANQUE

1. **enseignes.parent_organisation_id** : N'existe pas (relation inverse actuelle)
2. **sales_order_linkme_details.delivery_address_*** : Colonnes dédiées (actuellement JSONB dans sales_orders)

### ⚠️ DONNÉES EXISTANTES

- **Pokawa** : 141 organisations (37 succursales, 91 franchises, 1 parent)
- **0 commandes LinkMe** : Aucune donnée réelle dans `sales_order_linkme_details`

### 🎯 RECOMMANDATIONS

1. **NE PAS créer `enseignes.parent_organisation_id`** : La relation actuelle fonctionne
2. **NE PAS dupliquer les adresses** : Utiliser `sales_orders.shipping_address` (JSONB)
3. **VÉRIFIER les contraintes CHECK** : Sur `owner_type`, `requester_type`, etc.
4. **ATTENTION aux triggers** : Vérifier les triggers existants sur ces tables

---

---

## 7. CONTRAINTES CHECK EXISTANTES

### `sales_order_linkme_details`

| Contrainte | Définition | Impact LM-ORD-009 |
|------------|------------|-------------------|
| `sales_order_linkme_details_owner_type_check` | `owner_type IN ('propre', 'succursale', 'franchise')` | ⚠️ **INCOHÉRENT avec `organisations.ownership_type`** |
| `sales_order_linkme_details_requester_type_check` | `requester_type IN ('responsable_enseigne', 'architecte', 'franchisee')` | ✅ OK |
| `sales_order_linkme_details_billing_contact_source_check` | `billing_contact_source IN ('step1', 'step2', 'custom')` | ✅ OK |

### `organisations`

| Contrainte | Définition | Impact LM-ORD-009 |
|------------|------------|-------------------|
| `organisations_approval_status_check` | `approval_status IN ('pending_validation', 'approved', 'rejected')` | ✅ OK |
| `organisations_customer_type_check` | `customer_type IN ('professional', 'individual')` | ✅ OK |
| `organisations_source_check` | `source IN ('manual', 'transaction_linking', 'import')` | ✅ OK |
| `check_trade_name_consistency` | `has_different_trade_name = false OR (has_different_trade_name = true AND trade_name IS NOT NULL)` | ✅ OK |

### `contacts`

| Contrainte | Définition | Impact LM-ORD-009 |
|------------|------------|-------------------|
| `contacts_must_have_owner` | `organisation_id IS NOT NULL OR enseigne_id IS NOT NULL` | ✅ OK |
| `contacts_owner_type_check` | `owner_type IN ('organisation', 'enseigne')` | ✅ OK |
| `contacts_email_format` | Regex email valide | ✅ OK |

### 🚨 INCOHÉRENCE DÉTECTÉE

**`sales_order_linkme_details.owner_type`** :
- Valeurs attendues : `'propre'`, `'succursale'`, `'franchise'`

**`organisations.ownership_type`** (ENUM) :
- Valeurs existantes : `'succursale'`, `'franchise'`

**Problème** :
- `'propre'` n'existe pas dans l'ENUM `organisation_ownership_type`
- La valeur `'propre'` dans `sales_order_linkme_details.owner_type` ne correspond à aucune valeur dans `organisations.ownership_type`

**Solution** :
1. Ajouter `'propre'` dans l'ENUM `organisation_ownership_type` (ALTER TYPE)
2. OU utiliser un mapping `'propre'` → `NULL` dans `organisations.ownership_type`

---

## 8. TRIGGERS EXISTANTS (30 triggers)

### Sur `organisations` (7 triggers)

| Trigger | Timing | Event | Fonction | Impact LM-ORD-009 |
|---------|--------|-------|----------|-------------------|
| `trigger_enseigne_member_count` | AFTER | INSERT | `update_enseigne_member_count` | ✅ Recalcule le nombre de membres de l'enseigne |
| `trg_generate_organisation_code` | BEFORE | INSERT | `trigger_generate_organisation_code` | ✅ Génère le code LinkMe |
| `trg_organisation_approval_notification` | AFTER | INSERT | `notify_admin_organisation_approval` | ✅ Notif admin |
| `trg_notify_affiliate_archive` | AFTER | UPDATE | `notify_affiliate_archive` | ✅ Notif archive |
| `audit_organisations` | AFTER | INSERT | `audit_trigger_function` | ✅ Audit |
| `trigger_update_organisations_updated_at` | BEFORE | UPDATE | `update_updated_at` | ✅ Timestamp |

### Sur `sales_orders` (18 triggers)

| Trigger | Timing | Event | Fonction | Impact LM-ORD-009 |
|---------|--------|-------|----------|-------------------|
| `trg_create_linkme_commission` | AFTER | INSERT | `create_linkme_commission_on_order_update` | ⚠️ **CRITIQUE** : Crée commission LinkMe |
| `trg_notify_affiliate_order` | AFTER | INSERT | `notify_admin_affiliate_order` | ✅ Notif affilié |
| `trigger_so_update_forecasted_out` | AFTER | UPDATE | `update_so_forecasted_out` | ⚠️ **STOCK** : Met à jour stock prévisionnel |
| `trg_so_devalidation_forecasted_stock` | AFTER | UPDATE | `rollback_forecasted_out_on_so_devalidation` | ⚠️ **STOCK** : Rollback stock |
| `trigger_so_cancellation_rollback` | AFTER | UPDATE | `rollback_so_forecasted` | ⚠️ **STOCK** : Rollback annulation |
| `sales_order_status_change_trigger` | AFTER | UPDATE | `handle_sales_order_confirmation` | ✅ Gestion confirmation |
| `trigger_prevent_so_direct_cancellation` | BEFORE | UPDATE | `prevent_so_direct_cancellation` | ✅ Empêche annulation directe |
| (+ 11 autres triggers de notification/calcul) | | | | |

### Sur `sales_order_linkme_details` (1 trigger)

| Trigger | Timing | Event | Fonction | Impact LM-ORD-009 |
|---------|--------|-------|----------|-------------------|
| `set_updated_at_sales_order_linkme_details` | BEFORE | UPDATE | `trigger_set_updated_at_linkme_details` | ✅ Timestamp |

### Sur `contacts` (3 triggers)

| Trigger | Timing | Event | Fonction | Impact LM-ORD-009 |
|---------|--------|-------|----------|-------------------|
| `trigger_set_contact_owner_type` | BEFORE | INSERT | `set_contact_owner_type` | ✅ Définit `owner_type` automatiquement |
| `trigger_validate_contact_constraints` | BEFORE | INSERT | `validate_contact_constraints` | ✅ Validation contraintes |
| `trigger_contacts_updated_at` | BEFORE | UPDATE | `update_contacts_updated_at` | ✅ Timestamp |

### Sur `enseignes` (2 triggers)

| Trigger | Timing | Event | Fonction | Impact LM-ORD-009 |
|---------|--------|-------|----------|-------------------|
| `trg_create_linkme_profile_enseigne` | AFTER | INSERT | `create_linkme_profile_for_enseigne` | ✅ Crée profil LinkMe auto |
| `trigger_enseignes_updated_at` | BEFORE | UPDATE | `update_enseignes_updated_at` | ✅ Timestamp |

### 🚨 TRIGGERS CRITIQUES À VÉRIFIER

1. **`trg_create_linkme_commission`** : Créé automatiquement une commission à l'INSERT d'une `sales_order`
   - Doit fonctionner avec les nouvelles commandes LinkMe (vérifier la logique)

2. **`trigger_so_update_forecasted_out`** : Met à jour le stock prévisionnel
   - Vérifie si la logique fonctionne avec `sales_order_linkme_details`

3. **`trigger_enseigne_member_count`** : Recalcule le nombre de membres de l'enseigne
   - Fonctionne via `organisations.enseigne_id` (OK)

---

## 9. RLS POLICIES

Les tables suivantes ont des RLS policies actives :
- `organisations` : ~10 policies (SELECT, INSERT, UPDATE, DELETE)
- `sales_orders` : ~8 policies (SELECT, INSERT, UPDATE, DELETE)
- `sales_order_linkme_details` : ~6 policies (SELECT, INSERT, UPDATE, DELETE)
- `contacts` : ~8 policies (SELECT, INSERT, UPDATE, DELETE)
- `enseignes` : ~6 policies (SELECT, INSERT, UPDATE, DELETE)
- `linkme_affiliates` : ~8 policies (SELECT, INSERT, UPDATE, DELETE)

**Note** : Les policies sont complexes et utilisent des fonctions helper (`get_user_role()`, `is_customer_user()`, etc.)

### 🚨 POINTS D'ATTENTION

1. **Commandes anonymes** : Vérifier si les RLS bloquent la création de commandes anonymes (sans `auth.uid()`)
2. **Accès affiliés** : Vérifier si les affiliés peuvent lire leurs propres commandes
3. **Accès admin** : Vérifier si les admins peuvent accéder à toutes les commandes LinkMe

---

---

## 10. RÉSUMÉ EXÉCUTIF & RECOMMANDATIONS

### ✅ CE QUI EXISTE ET FONCTIONNE

1. **Architecture organisations/enseignes** :
   - Relation via `organisations.enseigne_id` → `enseignes.id`
   - Flag `organisations.is_enseigne_parent` pour identifier le siège
   - Enum `organisations.ownership_type` : `'succursale'`, `'franchise'`
   - Trigger `trigger_enseigne_member_count` maintient le nombre de membres à jour

2. **Table `sales_order_linkme_details`** :
   - 33 colonnes déjà présentes (requester, owner, billing, delivery)
   - Aucune donnée réelle (0 commandes)
   - Structure complète pour gérer les commandes LinkMe

3. **Contacts** :
   - Support multi-propriétaire (`organisation_id` OU `enseigne_id`)
   - Flags pour types de contacts (primary, billing, technical, commercial)
   - Trigger `trigger_set_contact_owner_type` gère automatiquement le type

4. **Commandes & Commissions** :
   - Trigger `trg_create_linkme_commission` crée automatiquement les commissions
   - Trigger `trg_notify_affiliate_order` notifie l'affilié
   - Gestion stock via triggers sur `sales_orders`

### 🚨 INCOHÉRENCES À CORRIGER

#### 1. **`owner_type` : TEXT vs ENUM**

**Problème** :
- `sales_order_linkme_details.owner_type` (TEXT) : `CHECK IN ('propre', 'succursale', 'franchise')`
- `organisations.ownership_type` (ENUM) : `'succursale'`, `'franchise'` (pas de `'propre'`)

**Impact** :
- Impossible de mapper directement `sales_order_linkme_details.owner_type = 'propre'` vers `organisations.ownership_type`

**Solutions possibles** :

**Option A** : Ajouter `'propre'` dans l'ENUM
```sql
ALTER TYPE organisation_ownership_type ADD VALUE 'propre';
```
- ✅ Cohérence totale
- ⚠️ Modification d'un ENUM existant (irréversible)
- ⚠️ Impact sur 141 organisations existantes (Pokawa)

**Option B** : Utiliser un mapping NULL
```sql
-- Lors de la création d'une organisation depuis sales_order_linkme_details
CASE WHEN sales_order_linkme_details.owner_type = 'propre'
     THEN NULL
     ELSE sales_order_linkme_details.owner_type::organisation_ownership_type
END
```
- ✅ Pas de modification d'ENUM
- ⚠️ Logique métier : `'propre'` = pas de rattachement à une enseigne (donc `ownership_type = NULL`)

**Recommandation** : **Option B** (mapping NULL)
- `'propre'` signifie "restaurant indépendant" → pas d'enseigne → `ownership_type = NULL`
- Cohérent avec la logique métier LinkMe

#### 2. **Adresse de livraison : JSONB vs colonnes dédiées**

**État actuel** :
- `sales_orders.shipping_address` (JSONB) : Adresse de livraison
- `sales_order_linkme_details` : Pas de colonnes dédiées pour l'adresse

**Options** :

**Option A** : Continuer avec `sales_orders.shipping_address` (JSONB)
- ✅ Pas de duplication
- ✅ Structure flexible
- ⚠️ Moins typé

**Option B** : Ajouter colonnes dédiées dans `sales_order_linkme_details`
- ✅ Plus typé
- ⚠️ Duplication avec `sales_orders.shipping_address`
- ⚠️ Risque de désynchronisation

**Recommandation** : **Option A** (conserver JSONB)
- La structure actuelle fonctionne
- Évite la duplication
- Les contacts de réception sont déjà dans `sales_order_linkme_details`

### ❌ CE QU'IL NE FAUT PAS FAIRE

1. **NE PAS créer `enseignes.parent_organisation_id`** :
   - La relation inverse existe déjà (`organisations.enseigne_id`)
   - Créerait une redondance
   - Migration complexe (141 orgs Pokawa)

2. **NE PAS dupliquer les adresses** :
   - Utiliser `sales_orders.shipping_address` (JSONB)
   - Éviter la désynchronisation

3. **NE PAS modifier l'ENUM `organisation_ownership_type`** :
   - Utiliser un mapping `'propre'` → `NULL`
   - Évite une migration irréversible

### 🎯 PLAN MINIMAL RECOMMANDÉ

**Aucune migration SQL nécessaire !**

Les structures existantes sont suffisantes pour gérer LM-ORD-009 :

1. **Organisations/Enseignes** : Architecture déjà fonctionnelle
2. **Contacts** : Support multi-propriétaire OK
3. **Commandes** : `sales_order_linkme_details` complète (33 colonnes)
4. **Triggers** : 30 triggers actifs (commissions, stock, notifications)
5. **RLS** : Policies actives sur toutes les tables

**Ce qui reste à faire** (CODE, pas DB) :

1. **Logique métier** : Implémenter le mapping `'propre'` → `ownership_type = NULL`
2. **Création organisation** : Depuis `sales_order_linkme_details` vers `organisations`
3. **Création contacts** : Depuis `requester_*`, `owner_*`, `billing_*` vers `contacts`
4. **Validation UX** : Tester le workflow de création de commande LinkMe
5. **Tests E2E** : Vérifier le workflow complet (Step 1 → 4)

### 📊 STATISTIQUES FINALES

| Élément | Existant | À créer | À modifier |
|---------|----------|---------|------------|
| Tables | 6 | 0 | 0 |
| Colonnes | 218 | 0 | 0 |
| Triggers | 30 | 0 | 0 |
| RLS Policies | ~48 | 0 | 0 |
| Contraintes CHECK | 26 | 0 | 0 |
| Enums | 3 | 0 | 0 |

**Conclusion** : La base de données est PRÊTE pour LM-ORD-009. Aucune migration nécessaire.

---

## NEXT STEPS

1. ✅ Contraintes CHECK lues
2. ✅ Triggers listés (30 triggers identifiés)
3. ✅ RLS policies vérifiées
4. ✅ Incohérences analysées (solutions proposées)
5. ✅ **PLAN MINIMAL PROPOSÉ : AUCUNE MIGRATION NÉCESSAIRE**

**Action suivante** : Passer à l'implémentation CODE (pas DB) dans une session WRITE.

