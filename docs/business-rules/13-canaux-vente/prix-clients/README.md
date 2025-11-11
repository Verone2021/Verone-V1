# Prix Clients & Système Ristourne - Business Rules

**Version:** 1.0.0
**Date création:** 5 novembre 2025
**Dernière mise à jour:** 5 novembre 2025
**Module:** Canaux de Vente - Prix Clients
**Statut:** ✅ Opérationnel (CRUD à compléter)

---

## 🎯 Vue d'Ensemble

Le système **Prix Clients** permet de configurer des **tarifs négociés contractuels** par client et par produit, avec un mécanisme de **ristourne/commission** automatique pour les partenaires B2B.

**Route applicative:** `/canaux-vente/prix-clients`
**Table database:** `customer_pricing`
**Priorité waterfall:** MAX (override tous autres prix)

---

## 💰 Concepts Clés

### 1. Prix Client Spécifique

**Définition:** Prix négocié contractuel entre Vérone et un client B2B pour un produit spécifique.

**Cas d'usage:**

- Contrats cadre annuels (volume garantis)
- Partenariats stratégiques (distributeurs exclusifs)
- Remises fidélité grands comptes
- Prix promotionnels temporaires (campagnes)

**Priorité:** ⭐ **MAXIMALE** dans waterfall pricing (override prix canal, prix liste, prix base)

---

### 2. Système Ristourne/Commission ⭐ NOUVEAU

**Date implémentation:** 25 octobre 2025
**Colonne:** `customer_pricing.retrocession_rate`

**Définition:** Commission en pourcentage reversée au client, calculée **par ligne de commande** (pas globalement).

**Cas d'usage principal:** Réseaux de distribution type RFA (Réseau Français Ameublement)

**Exemple concret utilisateur:**

```
Client: RFA (réseau distributeurs)
Produit: Canapé design
Prix vente: 100€
Commission souhaitée: 10%

Configuration Vérone:
→ customer_pricing.retrocession_rate = 10.00

Commande RFA:
→ Ligne commande: total_ht = 100.00€
→ retrocession_rate = 10.00% (snapshot au moment commande)
→ retrocession_amount = 10.00€ (calculé automatiquement par trigger)

Facture RFA: 100€
Ristourne à reverser à RFA: 10€
```

**Différence avec remise:**

- **Remise** : Diminue prix vente (client paye moins)
- **Ristourne** : Prix vente inchangé, commission reversée après paiement (client paye plein prix, reçoit commission)

---

## 🗄️ Table `customer_pricing`

### Colonnes Principales

| Colonne                    | Type      | Description                                         | Obligatoire | Exemple                |
| -------------------------- | --------- | --------------------------------------------------- | ----------- | ---------------------- |
| `id`                       | UUID      | Identifiant unique règle pricing                    | ✅          | Auto-généré            |
| `customer_id`              | UUID      | ID client concerné                                  | ✅          | UUID organisation      |
| `customer_type`            | TEXT      | Type client (`organisation`/`individual`)           | ✅          | `organisation`         |
| `product_id`               | UUID      | ID produit concerné                                 | ✅          | UUID produit           |
| `custom_price_ht`          | DECIMAL   | Prix spécifique HT négocié                          | ❌          | `850.00`               |
| `discount_rate`            | DECIMAL   | Remise % (exclusif avec custom_price_ht)            | ❌          | `15.00`                |
| **`retrocession_rate`** ⭐ | DECIMAL   | Commission % à reverser                             | ❌          | `10.00`                |
| `min_quantity`             | INTEGER   | Quantité minimum commande (MOQ)                     | ❌          | `5`                    |
| `contract_reference`       | TEXT      | Référence contrat cadre                             | ❌          | `CONTRAT-RFA-2025-001` |
| `valid_from`               | DATE      | Date début validité                                 | ❌          | `2025-01-01`           |
| `valid_until`              | DATE      | Date fin validité                                   | ❌          | `2025-12-31`           |
| `approval_status`          | ENUM      | Statut validation (`pending`/`approved`/`rejected`) | ✅          | `approved`             |
| `approved_by`              | UUID      | ID utilisateur ayant approuvé                       | ❌          | UUID user admin        |
| `approved_at`              | TIMESTAMP | Date/heure approbation                              | ❌          | `2025-11-05 10:30:00`  |
| `created_by`               | UUID      | ID utilisateur créateur                             | ✅          | UUID commercial        |
| `created_at`               | TIMESTAMP | Date création                                       | ✅          | Auto                   |

---

### Contraintes & Validations

#### Contrainte 1: Exclusivité `custom_price_ht` XOR `discount_rate`

**Règle métier:** Un prix client doit définir **soit** un prix fixe **soit** une remise, **jamais les deux**.

```sql
-- Trigger validation
CHECK (
  (custom_price_ht IS NOT NULL AND discount_rate IS NULL) OR
  (custom_price_ht IS NULL AND discount_rate IS NOT NULL)
)
```

**Exemples valides:**

- ✅ `custom_price_ht = 850.00`, `discount_rate = NULL` → Prix fixe 850€
- ✅ `custom_price_ht = NULL`, `discount_rate = 15.00` → Remise 15% sur prix base
- ❌ `custom_price_ht = 850.00`, `discount_rate = 15.00` → ERREUR (les deux définis)

---

#### Contrainte 2: Dates validité cohérentes

**Règle métier:** `valid_until >= valid_from`

```sql
CHECK (valid_until IS NULL OR valid_until >= valid_from)
```

---

#### Contrainte 3: Taux positifs

**Règles métier:**

- `discount_rate` : 0-100% (remise max 100%)
- `retrocession_rate` : 0-50% (commission max 50%, sécurité business)

```sql
CHECK (discount_rate >= 0 AND discount_rate <= 100)
CHECK (retrocession_rate >= 0 AND retrocession_rate <= 50)
```

---

## 🔄 Workflow Validation Prix Clients

### Étapes Workflow

```
1. CRÉATION (Commercial)
   ↓
   Status: pending
   created_by: UUID commercial
   ↓
2. REVIEW (Admin/Owner)
   ↓
   Vérification:
   - Conformité contrat cadre
   - Marges acceptables
   - Dates validité correctes
   ↓
3a. APPROBATION                    3b. REJET
   ↓                               ↓
   approval_status = 'approved'    approval_status = 'rejected'
   approved_by = UUID admin        rejected_reason = texte
   approved_at = NOW()
   ↓
4. ACTIVATION IMMÉDIATE
   Prix actif immédiatement
   Priorité MAX waterfall
```

---

### Rôles & Permissions

| Rôle           | Créer | Review          | Approuver | Supprimer |
| -------------- | ----- | --------------- | --------- | --------- |
| **Commercial** | ✅    | ✅ (ses règles) | ❌        | ❌        |
| **Admin**      | ✅    | ✅ (toutes)     | ✅        | ✅        |
| **Owner**      | ✅    | ✅ (toutes)     | ✅        | ✅        |
| **Viewer**     | ❌    | ✅ (lecture)    | ❌        | ❌        |

**RLS Policy:** `customer_pricing` filtré par `organisation_id` (multi-tenant)

---

### Statuts & Transitions

| Statut     | Description                 | Actions possibles            | Couleur badge UI |
| ---------- | --------------------------- | ---------------------------- | ---------------- |
| `pending`  | En attente validation admin | Approuver, Rejeter, Modifier | 🟡 Orange        |
| `approved` | Validé et actif             | Désactiver (archiver)        | 🟢 Vert          |
| `rejected` | Refusé par admin            | Recréer avec corrections     | 🔴 Rouge         |

---

## 💳 Calcul Ristourne par Ligne de Commande

### Architecture Technique

#### Tables Impliquées

1. **`customer_pricing`** : Configuration ristourne par client/produit
   - Colonne: `retrocession_rate` (%)

2. **`sales_order_items`** : Lignes de commande
   - Colonne: `retrocession_rate` (snapshot au moment commande)
   - Colonne: `retrocession_amount` (calculé automatiquement)

3. **RPC Function:** `get_order_total_retrocession(order_id UUID)`
   - Retourne: Total ristourne commande (SUM toutes lignes)

---

### Workflow Calcul Automatique

**Lors création ligne commande:**

```sql
-- Étape 1: Snapshot retrocession_rate depuis customer_pricing
INSERT INTO sales_order_items (
  order_id,
  product_id,
  quantity,
  unit_price_ht,
  total_ht,
  retrocession_rate  -- Snapshot depuis customer_pricing
)
VALUES (
  uuid_order,
  uuid_product,
  2,
  100.00,
  200.00,
  (SELECT retrocession_rate FROM customer_pricing
   WHERE customer_id = uuid_customer
   AND product_id = uuid_product
   AND approval_status = 'approved'
   AND CURRENT_DATE BETWEEN COALESCE(valid_from, '1970-01-01')
   AND COALESCE(valid_until, '2099-12-31')
   LIMIT 1)  -- 10.00
);

-- Étape 2: Trigger calcule automatiquement retrocession_amount
-- Trigger: calculate_retrocession_amount()
UPDATE sales_order_items
SET retrocession_amount = (total_ht * retrocession_rate / 100)
WHERE id = uuid_sales_order_item;
-- Résultat: retrocession_amount = 200.00 * 10 / 100 = 20.00€
```

**Résultat ligne commande:**

```
total_ht = 200.00€
retrocession_rate = 10.00%
retrocession_amount = 20.00€  ← Calculé automatiquement
```

---

### Exemple Commande Complète Multi-Lignes

**Client:** RFA (retrocession_rate = 10% sur tous produits)

**Commande #12345:**

| Ligne | Produit       | Qté | Prix Unit HT | Total HT | Ristourne % | Ristourne € |
| ----- | ------------- | --- | ------------ | -------- | ----------- | ----------- |
| 1     | Fauteuil Milo | 2   | 100.00       | 200.00   | 10.00       | **20.00**   |
| 2     | Canapé Oslo   | 1   | 500.00       | 500.00   | 10.00       | **50.00**   |
| 3     | Table basse   | 3   | 80.00        | 240.00   | 10.00       | **24.00**   |

**Calculs:**

```sql
-- Total commande HT
SELECT SUM(total_ht) FROM sales_order_items WHERE order_id = '12345';
→ 940.00€

-- Total ristourne à reverser
SELECT get_order_total_retrocession('12345');
→ 94.00€  (20 + 50 + 24)
```

**Facturation:**

- Facture RFA: 940.00€ HT (prix pleins)
- Ristourne à reverser RFA: 94.00€
- Revenus nets Vérone: 846.00€ (940 - 94)

---

### Migration Database

**Fichier:** `supabase/migrations/20251025_002_add_retrocession_system.sql`

**Changements:**

1. Ajout colonne `customer_pricing.retrocession_rate DECIMAL(5,2)`
2. Ajout colonnes `sales_order_items.retrocession_rate` + `retrocession_amount`
3. Trigger `calculate_retrocession_amount()` (calcul automatique)
4. RPC `get_order_total_retrocession(order_id UUID) RETURNS DECIMAL`

---

## 📋 Cas d'Usage Business

### Cas 1: Contrat Cadre Annuel (Prix Fixe)

**Client:** Hôtel Luxe Paris
**Produit:** Fauteuil Milo Velours
**Prix base catalogue:** 1200€ HT
**Prix négocié contrat:** 900€ HT (remise 25%)
**Volume annuel garanti:** 100 unités
**Validité:** 01/01/2025 - 31/12/2025

**Configuration `customer_pricing`:**

```json
{
  "customer_id": "uuid-hotel-luxe-paris",
  "customer_type": "organisation",
  "product_id": "uuid-fauteuil-milo",
  "custom_price_ht": 900.0,
  "discount_rate": null,
  "retrocession_rate": null,
  "min_quantity": 10,
  "contract_reference": "CONTRAT-HOTEL-2025-001",
  "valid_from": "2025-01-01",
  "valid_until": "2025-12-31",
  "approval_status": "approved"
}
```

**Résultat commande:**

- Hôtel commande 15 Fauteuils Milo
- Prix unitaire: 900€ HT (prix contrat, pas 1200€)
- Total: 13,500€ HT

---

### Cas 2: Réseau Distribution B2B (Remise % + Ristourne)

**Client:** RFA (Réseau Français Ameublement)
**Produits:** Tous catalogue Vérone
**Remise catalogue:** 10%
**Commission reversée:** 10% (ristourne)
**MOQ:** 5 unités par produit
**Validité:** Indéterminée (contrat permanent)

**Configuration `customer_pricing` (par produit):**

```json
{
  "customer_id": "uuid-rfa",
  "customer_type": "organisation",
  "product_id": "uuid-produit-1",
  "custom_price_ht": null,
  "discount_rate": 10.0,
  "retrocession_rate": 10.0, // ⭐ RISTOURNE
  "min_quantity": 5,
  "contract_reference": "CONTRAT-RFA-2024-PERMANENT",
  "valid_from": "2024-01-01",
  "valid_until": null,
  "approval_status": "approved"
}
```

**Exemple commande RFA:**

```
Produit: Canapé Oslo
Prix base: 1000€ HT
Remise RFA: 10% → Prix vente: 900€ HT
Quantité: 10 unités

Ligne commande:
→ total_ht = 9000€ (10 × 900€)
→ retrocession_rate = 10%
→ retrocession_amount = 900€ (calculé automatiquement)

Facture RFA: 9000€
Ristourne à reverser: 900€
Revenus nets Vérone: 8100€
```

**Marge Vérone:**

```
Prix vente: 900€/unité
Coût achat fournisseur: 500€/unité (exemple)
Ristourne: 90€/unité (10% de 900€)

Marge nette Vérone: 900 - 500 - 90 = 310€/unité (34% marge)
```

---

### Cas 3: Promotion Temporaire (Dates Validité)

**Client:** Architecte d'intérieur VIP
**Produit:** Collection Printemps 2025 (10 produits)
**Promotion:** -30% période lancement
**Validité:** 01/03/2025 - 30/04/2025 (2 mois)

**Configuration `customer_pricing`:**

```json
{
  "customer_id": "uuid-architecte-vip",
  "customer_type": "individual",
  "product_id": "uuid-produit-collection-printemps",
  "custom_price_ht": null,
  "discount_rate": 30.0,
  "retrocession_rate": null,
  "min_quantity": null,
  "contract_reference": "PROMO-PRINTEMPS-2025",
  "valid_from": "2025-03-01",
  "valid_until": "2025-04-30",
  "approval_status": "approved"
}
```

**Comportement système:**

- Avant 01/03/2025: Prix base (pas de remise)
- 01/03 - 30/04: -30% automatique
- Après 30/04/2025: Retour prix base automatique

---

## 🔧 Implémentation Technique

### Hook React `use-pricing.ts`

**Fichier:** `apps/back-office/apps/back-office/src/hooks/use-pricing.ts`

#### `useCustomerPricing()` - Liste Prix Clients

```typescript
import { useCustomerPricing } from '@/hooks/use-pricing';

// Filtrer par client
const { data: clientPrices, isLoading } = useCustomerPricing({
  customer_id: 'uuid-client',
  customer_type: 'organisation',
});

// Filtrer par statut
const { data: pendingPrices } = useCustomerPricing({
  approval_status: 'pending',
});
```

**Retourne:** Array `CustomerPricing[]`

---

#### `useCreateCustomerPricing()` - Création Prix Client

```typescript
import { useCreateCustomerPricing } from '@/hooks/use-pricing';

const createPricing = useCreateCustomerPricing();

const handleCreate = async () => {
  await createPricing.mutateAsync({
    customer_id: 'uuid-client',
    customer_type: 'organisation',
    product_id: 'uuid-produit',
    discount_rate: 15.0,
    retrocession_rate: 10.0,
    min_quantity: 5,
    contract_reference: 'CONTRAT-2025-001',
    valid_from: '2025-01-01',
    valid_until: '2025-12-31',
  });
};
```

**Validation automatique:**

- Exclusivité `custom_price_ht` XOR `discount_rate`
- Taux dans ranges valides
- Dates cohérentes

---

### RPC Database `calculate_product_price_v2()`

**Fonction:** Calcul prix produit avec waterfall pricing

**Paramètres:**

```sql
calculate_product_price_v2(
  p_product_id UUID,
  p_customer_id UUID DEFAULT NULL,
  p_channel_id UUID DEFAULT NULL,
  p_quantity INTEGER DEFAULT 1
) RETURNS JSON
```

**Logique waterfall:**

```sql
-- 1. PRIORITÉ MAX: Prix client spécifique
SELECT custom_price_ht, discount_rate, retrocession_rate
FROM customer_pricing
WHERE customer_id = p_customer_id
  AND product_id = p_product_id
  AND approval_status = 'approved'
  AND CURRENT_DATE BETWEEN COALESCE(valid_from, '1970-01-01')
                       AND COALESCE(valid_until, '2099-12-31')
LIMIT 1;

-- Si trouvé → STOP, retourner prix + retrocession_rate

-- 2. Sinon: Prix canal
SELECT discount_rate FROM channel_pricing WHERE...

-- 3. Sinon: Prix liste package
SELECT base_price_ht FROM price_list_items WHERE...

-- 4. Fallback: Prix base produit
SELECT base_price_ht FROM products WHERE id = p_product_id;
```

**Retour JSON:**

```json
{
  "final_price_ht": 900.0,
  "final_price_ttc": 1080.0,
  "source": "customer_pricing",
  "discount_applied": 15.0,
  "retrocession_rate": 10.0,
  "retrocession_amount": 90.0
}
```

---

## 📊 Interface Utilisateur

### Page `/canaux-vente/prix-clients`

**Fichier:** `apps/back-office/apps/back-office/src/app/canaux-vente/prix-clients/page.tsx`

**Fonctionnalités actuelles (MVP):**

- ✅ Statistiques dashboard (règles configurées, actives, clients, remise moyenne)
- ✅ Filtres: Recherche, Type client, Statut
- ✅ Table liste prix clients (colonnes: Client, Produit, Type, Prix HT, Remise, Ristourne, Qté min, Statut)
- ✅ Badges statuts colorés (pending 🟡, approved 🟢, rejected 🔴)
- ✅ Chargement données Supabase réelles

**Fonctionnalités manquantes (TODO Phase 2):**

- ❌ Bouton "Créer prix client" (modal formulaire)
- ❌ Action "Éditer" par ligne (modal édition)
- ❌ Action "Supprimer" avec confirmation
- ❌ Action "Approuver/Rejeter" (admins seulement)
- ❌ Filtres avancés (dates validité, produits, contrats)
- ❌ Export Excel liste prix clients

**Estimation complétion:** 4h développement

---

### Statistiques Affichées

| Métrique                  | Calcul                                                  | Exemple |
| ------------------------- | ------------------------------------------------------- | ------- |
| **Règles configurées**    | `COUNT(*)` total                                        | 25      |
| **Règles actives**        | `COUNT(*) WHERE approval_status = 'approved' AND valid` | 18      |
| **Clients concernés**     | `COUNT(DISTINCT customer_id)`                           | 8       |
| **Remise moyenne**        | `AVG(discount_rate) WHERE discount_rate IS NOT NULL`    | 12.5%   |
| **Ristourne totale mois** | `SUM(retrocession_amount)` last 30 days                 | 2,450€  |

---

## 🚨 Règles Validation & Sécurité

### Validation Métier

#### Règle 1: Marges Minimales

**Objectif:** Garantir rentabilité Vérone

```typescript
// Validation côté application (avant création)
if (custom_price_ht) {
  const costPrice = await getProductCostPrice(product_id);
  const margin = ((custom_price_ht - costPrice) / custom_price_ht) * 100;

  if (margin < 15) {
    throw new Error('Marge minimale 15% non respectée');
  }
}
```

**Seuils recommandés:**

- Marge minimale: 15%
- Marge cible: 30-40%
- Alerte si marge <20%

---

#### Règle 2: Ristourne Cohérente avec Marge

**Validation:**

```typescript
if (retrocession_rate && discount_rate) {
  // Calcul marge nette après remise + ristourne
  const netMargin = calculateNetMargin(
    base_price,
    cost_price,
    discount_rate,
    retrocession_rate
  );

  if (netMargin < 10) {
    throw new Error('Ristourne + Remise = Marge nette <10%, dangereux!');
  }
}
```

**Exemple problématique:**

```
Prix base: 1000€
Coût: 700€
Remise: 20% → Prix vente: 800€
Ristourne: 15% → Commission: 120€

Revenus nets: 800 - 120 = 680€
PERTE: -20€ par unité!
```

---

#### Règle 3: Approbation Obligatoire Seuils

**Workflow automatique:**

| Condition      | Approbation                   | Niveau     |
| -------------- | ----------------------------- | ---------- |
| Remise <10%    | ✅ Auto-approuvé (commercial) | Commercial |
| Remise 10-20%  | ⏳ Review admin               | Admin      |
| Remise >20%    | ⏳ Review owner               | Owner      |
| Ristourne >15% | ⏳ Review owner               | Owner      |
| Marge <20%     | ⏳ Review owner               | Owner      |

---

### Sécurité & RLS

**RLS Policy `customer_pricing`:**

```sql
-- Lecture: Tous utilisateurs authentifiés (même organisation)
CREATE POLICY "Users can view customer pricing of their org"
ON customer_pricing FOR SELECT
USING (
  organisation_id = auth.uid_organisation_id()
);

-- Création: Commercial, Admin, Owner
CREATE POLICY "Commercial can create customer pricing"
ON customer_pricing FOR INSERT
WITH CHECK (
  auth.user_has_role('commercial', 'admin', 'owner') AND
  organisation_id = auth.uid_organisation_id()
);

-- Approbation: Admin, Owner uniquement
CREATE POLICY "Admin can approve customer pricing"
ON customer_pricing FOR UPDATE
USING (
  auth.user_has_role('admin', 'owner') AND
  organisation_id = auth.uid_organisation_id()
);
```

---

## 📋 Checklist Création Prix Client

### Avant Création

- [ ] Contrat cadre signé (référence disponible)
- [ ] Validation marge minimale 15%
- [ ] Dates validité définies
- [ ] MOQ déterminé (si applicable)
- [ ] Approbation préalable obtenue (si remise >20%)

### Pendant Création

- [ ] Client sélectionné (UUID correct)
- [ ] Produit(s) sélectionné(s)
- [ ] **Soit** prix fixe **soit** remise % (pas les deux)
- [ ] Ristourne configurée (si applicable)
- [ ] Référence contrat saisie
- [ ] Dates validité saisies
- [ ] MOQ saisi (si applicable)

### Après Création

- [ ] Statut `pending` créé
- [ ] Notification admin envoyée (review)
- [ ] Admin review marge/conditions
- [ ] Admin approuve → Statut `approved`
- [ ] Prix actif immédiatement (priorité MAX)
- [ ] Test commande client (vérifier prix appliqué)

---

## 🔗 Documentation Associée

### Business Rules

- [`../README.md`](../README.md) - Vue d'ensemble canaux de vente
- [`../../05-pricing-tarification/pricing-multi-canaux-clients.md`](../../05-pricing-tarification/pricing-multi-canaux-clients.md) - Architecture pricing waterfall

### Database

- `docs/database/pricing-architecture.md` - Architecture technique pricing
- `supabase/migrations/20251010_001_sales_channels_pricing_system.sql` - Migration tables pricing
- `supabase/migrations/20251025_002_add_retrocession_system.sql` - Migration ristourne

### Code

- `apps/back-office/apps/back-office/src/hooks/use-pricing.ts` - Hook React pricing
- `apps/back-office/apps/back-office/src/app/canaux-vente/prix-clients/page.tsx` - Page UI

---

## 📞 Support

**Questions workflow:** Voir section "Workflow Validation Prix Clients"
**Questions techniques:** Voir `docs/database/pricing-architecture.md`
**Questions calculs:** Voir section "Calcul Ristourne"
**Mainteneur:** Romeo Dos Santos

---

**Dernière révision:** 5 novembre 2025
