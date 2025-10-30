# Workflow Échantillons - Business Rules

**Module**: Produits > Sourcing > Échantillons
**Route**: `/produits/sourcing/echantillons`
**Date**: 2025-10-30
**Version**: 1.0.0

---

## 🎯 Vue d'ensemble

Système complet de gestion des échantillons (internes et clients) avec cycle de vie : Création → Commande → Réception → Archive → Réactivation.

**Caractéristiques principales**:
- 2 types d'échantillons : `internal` (catalogue sourcing) et `customer` (B2B/B2C)
- Archivage sécurisé avec validation statut PO
- Réactivation automatique avec création/regroupement PO draft
- Suppression définitive avec confirmation obligatoire

---

## 📊 Types d'Échantillons

### Internal (Catalogue Sourcing)
**Usage**: Validation produits avant ajout catalogue principal

- **Client**: `null` (aucun client associé)
- **PO**: Lié à commande fournisseur standard
- **Affichage**: Badge "Interne" + texte "Interne - Catalogue"
- **Workflow**: Commande → Réception → Validation qualité → Intégration catalogue

### Customer (B2B/B2C)
**Usage**: Échantillons commandés pour clients finaux

- **Client**: Organisation (B2B) OU Individual (B2C)
- **PO**: Commande fournisseur avec livraison directe client
- **Affichage**: Badge "Client" + CustomerBadge (nom + type)
- **Workflow**: Demande client → Commande → Livraison directe

---

## 🔄 Cycle de Vie

### 1. Création
**Table**: `purchase_order_items`

```typescript
{
  id: UUID,
  purchase_order_id: UUID,  // PO draft obligatoire
  product_id: UUID,
  sample_type: 'internal' | 'customer',
  quantity: number,
  unit_price_ht: number,
  notes: string | null,

  // Customer (B2B)
  customer_organisation_id: UUID | null,

  // Customer (B2C)
  customer_individual_id: UUID | null,

  // Système
  archived_at: timestamp | null,
  created_at: timestamp,
  updated_at: timestamp
}
```

**Règles de validation**:
- ✅ `sample_type = 'internal'` → `customer_organisation_id` et `customer_individual_id` doivent être `null`
- ✅ `sample_type = 'customer'` → Exactement UN client (organisation XOR individual)
- ✅ PO doit exister et être en statut `draft` au moment de la création

---

### 2. Archivage

**Action**: Retrait de l'échantillon du PO actuel + marquage `archived_at`

**Règles business**:
1. ✅ **CRITIQUE**: Archivage autorisé UNIQUEMENT si `PO.status = 'draft'`
2. ✅ Trigger database `prevent_archiving_non_draft_samples` bloque si PO validée/envoyée
3. ✅ Message UI: "Impossible d'archiver : commande déjà envoyée au fournisseur"
4. ✅ Échantillon retiré de la liste "Actifs" et ajouté à "Archivés"

**Implémentation**:
```typescript
// Hook: useCustomerSamples.ts - archiveSample()
UPDATE purchase_order_items
SET archived_at = NOW()
WHERE id = sample_id
-- Trigger vérifie automatiquement PO.status = 'draft'
```

**Trigger database**:
```sql
-- Fichier: supabase/migrations/XXX_prevent_archiving_non_draft_samples.sql
CREATE OR REPLACE FUNCTION prevent_archiving_non_draft_samples()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.archived_at IS NOT NULL AND OLD.archived_at IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = NEW.purchase_order_id
      AND po.status != 'draft'
    ) THEN
      RAISE EXCEPTION 'Cannot archive sample: Purchase order already validated/sent';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 3. Réactivation

**Action**: Suppression `archived_at` + création/regroupement PO draft

**Règles business**:
1. ✅ Échantillon réactivé retourne toujours dans un PO draft
2. ✅ **Regroupement intelligent**: Cherche PO draft existant du même fournisseur
3. ✅ Si PO draft trouvé → Ajout à ce PO (économie PO)
4. ✅ Si aucun PO draft → Création automatique nouveau PO draft
5. ✅ `archived_at` remis à `null`

**Implémentation**:
```typescript
// Hook: useCustomerSamples.ts - reactivateSample()
const reactivateSample = async (sampleId: string) => {
  // 1. Récupérer infos échantillon + supplier_id
  const sample = await fetchSampleDetails(sampleId)

  // 2. Chercher PO draft existant pour ce fournisseur
  const existingDraftPO = await findDraftPO(sample.supplier_id)

  // 3. Si trouvé → Utiliser, sinon créer
  const targetPO = existingDraftPO || await createDraftPO(sample.supplier_id)

  // 4. Réassigner échantillon au PO
  await updateSample(sampleId, {
    purchase_order_id: targetPO.id,
    archived_at: null
  })
}
```

**Avantages**:
- 📦 Regroupement échantillons réactivés dans un même PO
- 💰 Réduction coûts expédition (livraisons groupées)
- 🎯 Simplification gestion fournisseurs

---

### 4. Réinsertion dans PO

**Action**: Identique à réactivation mais sans supprimer `archived_at`

**Usage**: Réinclure échantillon archivé dans commande sans le réactiver formellement

**Règles business**:
- ✅ Même logique regroupement/création PO que réactivation
- ✅ `archived_at` conservé (tracabilité historique)
- ✅ Échantillon reste visible dans "Archivés" mais lié à nouveau PO

**Use case**: Échantillon archivé par erreur mais besoin urgent de recommander

---

### 5. Suppression Définitive

**Action**: DELETE définitif de `purchase_order_items`

**Règles business**:
1. ✅ **OBLIGATOIRE**: Dialog de confirmation avant suppression
2. ✅ Message: "Êtes-vous sûr de vouloir supprimer définitivement cet échantillon ? Cette action est irréversible."
3. ✅ Boutons: "Annuler" (défaut) | "Supprimer définitivement" (destructive)
4. ✅ Suppression possible UNIQUEMENT si échantillon archivé
5. ✅ Suppression définitive (pas de soft delete)

**Implémentation**:
```typescript
// Hook: useCustomerSamples.ts - deleteSample()
const deleteSample = async (sampleId: string) => {
  // Confirmation obligatoire via AlertDialog
  const confirmed = await showConfirmDialog()

  if (confirmed) {
    await supabase
      .from('purchase_order_items')
      .delete()
      .eq('id', sampleId)
  }
}
```

**Sécurité**:
- 🔒 Bouton "Supprimer" disponible UNIQUEMENT dans onglet "Archivés"
- 🔒 Pas de suppression directe depuis "Actifs" (workflow obligatoire: Archive → Delete)
- 🔒 Dialog impossible à contourner (pas de suppression accidentelle)

---

## 📋 Statuts Dérivés

**View**: `customer_samples_view` calcule automatiquement `sample_status`

### Logique de calcul
```typescript
sample_status = calculateStatus(po_status, archived_at)

function calculateStatus(po_status: string, archived_at: string | null): SampleStatus {
  if (archived_at !== null) return 'archived'

  switch (po_status) {
    case 'draft': return 'draft'
    case 'sent':
    case 'partial':
    case 'confirmed': return 'ordered'
    case 'received':
    case 'completed': return 'received'
    default: return 'unknown'
  }
}
```

### Mapping statuts
| PO Status | archived_at | sample_status | Badge couleur |
|-----------|-------------|---------------|---------------|
| `draft` | `null` | `draft` | Gris |
| `sent`, `confirmed` | `null` | `ordered` | Bleu |
| `received`, `completed` | `null` | `received` | Vert |
| *any* | `NOT NULL` | `archived` | Rouge |
| *unknown* | `null` | `unknown` | Gris foncé |

---

## 🎨 Affichage UI

### Statistiques (Cards)
```typescript
stats = {
  total: samples.length,
  active: samples.filter(s => !s.archived_at).length,
  archived: samples.filter(s => s.archived_at).length,
  internal: samples.filter(s => s.sample_type === 'internal').length,
  customer: samples.filter(s => s.sample_type === 'customer').length
}
```

### Tabs
1. **Actifs**: `archived_at IS NULL` → Actions: Voir détails | Archiver
2. **Archivés**: `archived_at IS NOT NULL` → Actions: Réactiver | Réinsérer dans PO | Supprimer

### CustomerBadge
**Composant**: `@/components/business/customer-badge.tsx`

**Affichage B2B**:
- Badge bleu avec icône `Building2`
- Texte: `trade_name` ou `legal_name`
- Tooltip: Nom complet + Type B2B

**Affichage B2C**:
- Badge violet avec icône `User`
- Texte: `first_name + last_name`
- Tooltip: Nom complet + Email + Type B2C

---

## 🗄️ Base de données

### Tables principales
1. **purchase_order_items** (échantillons)
   - Colonne `archived_at` (nullable timestamp)
   - Colonnes polymorphiques: `customer_organisation_id`, `customer_individual_id`

2. **purchase_orders** (commandes fournisseurs)
   - Statut critique pour validation archivage

3. **organisations** (clients B2B)
   - `legal_name`, `trade_name`

4. **individuals** (clients B2C)
   - `first_name`, `last_name`, `email`

### View
**`customer_samples_view`**:
- JOIN 4 tables: purchase_order_items + purchase_orders + organisations + individuals
- Calcul automatique `sample_status`
- Génération `customer_display_name` (polymorphique)
- Génération `customer_type` ('B2B' | 'B2C' | null)

---

## ⚙️ Triggers Database

### 1. prevent_archiving_non_draft_samples
**Fichier**: `supabase/migrations/XXX_prevent_archiving_non_draft_samples.sql`

**Fonction**: Bloque archivage si PO status ≠ 'draft'

**Déclenché**: BEFORE UPDATE ON purchase_order_items

**Logique**:
```sql
IF NEW.archived_at IS NOT NULL AND OLD.archived_at IS NULL THEN
  IF po.status != 'draft' THEN
    RAISE EXCEPTION 'Cannot archive: PO already sent'
  END IF
END IF
```

### 2. handle_purchase_order_forecast
**Fichier**: Existant (gestion stocks prévisionnels)

**Impact échantillons**:
- Recalcule totaux PO après réactivation/réinsertion
- Met à jour `total_ht`, `total_ttc`
- Gère stock prévisionnel si produit lié

---

## 🔐 Sécurité & RLS

### Row Level Security
**Politique**: Accès échantillons basé sur `organisation_id` de l'utilisateur

```sql
-- Policy: users_can_view_their_org_samples
CREATE POLICY users_can_view_their_org_samples
ON purchase_order_items
FOR SELECT
USING (
  -- Staff voit tout
  auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('Owner', 'Admin', 'Manager'))
  OR
  -- Client B2B voit ses échantillons
  customer_organisation_id IN (
    SELECT organisation_id FROM profiles WHERE user_id = auth.uid()
  )
);
```

**Notes**:
- Clients B2C ne peuvent PAS voir leurs échantillons (accès staff uniquement)
- Échantillons internes visibles uniquement par staff
- Archivage/Réactivation/Suppression: Staff uniquement

---

## 📊 Tests E2E Validés

### Scénario 1: Consultation page
- ✅ Chargement liste échantillons actifs
- ✅ Statistiques correctes (Total, Archivés, Internes, Clients)
- ✅ Filtres fonctionnels (type, statut)
- ✅ Console errors: RSC prefetch uniquement (non-bloquants)

### Scénario 2: Archivage
- ✅ Archivage échantillon PO draft réussi
- ✅ Échantillon déplacé Actifs → Archivés
- ✅ Statistiques mises à jour (Actifs -1, Archivés +1)
- ✅ Badge "Archivé" affiché avec date

### Scénario 3: Réactivation
- ✅ Réactivation depuis onglet Archivés
- ✅ Création automatique nouveau PO draft
- ✅ Échantillon retourne dans Actifs avec nouveau PO
- ✅ `archived_at` remis à null

### Scénario 4: Suppression définitive
- ✅ Dialog de confirmation obligatoire affiché
- ✅ Message clair avec avertissement irréversibilité
- ✅ Suppression complète après confirmation
- ✅ Statistiques à zéro après suppression

---

## 🎯 Best Practices

### 1. Workflow recommandé
```
Création → [Commande] → [Réception] → Archive → [Suppression si nécessaire]
                                      ↓
                                  Réactivation
                                      ↓
                              Nouveau cycle commande
```

### 2. Gestion PO
- ✅ Toujours créer échantillon dans PO draft
- ✅ Regrouper échantillons même fournisseur avant envoi
- ✅ Valider PO uniquement quand tous échantillons confirmés

### 3. Archivage
- ✅ Archiver échantillons annulés/refusés
- ✅ Archiver échantillons reçus et validés (cycle terminé)
- ❌ NE PAS archiver si commande déjà envoyée (trigger bloque)

### 4. Suppression
- ⚠️ Utiliser avec extrême prudence (action irréversible)
- ✅ Supprimer uniquement échantillons archivés définitivement inutiles
- ✅ Privilégier archivage pour traçabilité historique

---

## 📚 Références

### Code source
- **Hook**: `/src/hooks/use-customer-samples.ts`
- **Page**: `/src/app/produits/sourcing/echantillons/page.tsx`
- **Composant Badge**: `/src/components/business/customer-badge.tsx`
- **View SQL**: `supabase/migrations/XXX_create_customer_samples_view.sql`
- **Trigger**: `supabase/migrations/XXX_prevent_archiving_non_draft_samples.sql`

### Documentation
- **Database schema**: `docs/database/tables/purchase_order_items.md`
- **RLS policies**: `docs/database/rls-policies.md`
- **Triggers**: `docs/database/triggers/prevent_archiving_non_draft_samples.md`

---

**Dernière mise à jour**: 2025-10-30
**Auteur**: Claude Code (V&amp;eacute;rone CRM/ERP)
**Statut**: ✅ Production-ready (Phase 1 complète)
