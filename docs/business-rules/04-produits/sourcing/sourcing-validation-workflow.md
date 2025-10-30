# 📋 Règles Métier - Workflow Validation Sourcing → Catalogue

**Date** : 25 septembre 2025
**Version** : 1.0
**Status** : 🎯 IMPLÉMENTATION EN COURS

## 🎯 Objectifs

Définir les règles métier pour le workflow complet de validation des produits sourcing vers le catalogue, incluant :
- **Validation conditionnelle échantillons** : Logique automatique basée sur `requires_sample`
- **Workflow automatique** : Passage produit sourcing → catalogue selon validation
- **Règles business** : Contrôles et validations selon type de produit

## 📊 Workflow Sourcing Validation CORRECT

### **État 1: Création Sourcing**
```typescript
// Formulaire sourcing rapide créé (déjà implémenté)
const sourcingDraft = {
  creation_mode: 'sourcing',
  requires_sample: null, // À déterminer lors de la validation
  status: 'draft'
}
```

### **État 2: Validation Sourcing → Détermination échantillons**
```typescript
interface SourcingValidationRules {
  // Étape 1: Compléter les infos sourcing
  sourcing_completion: {
    required_fields: ['name', 'supplier_id', 'cost_price', 'supplier_page_url'],
    validation_trigger: 'Validation du sourcing'
  },

  // Étape 2: Décision échantillons
  sample_decision: {
    requires_sample_true: {
      workflow: 'sourcing_validated → sample_request → sample_ordered → sample_delivered → sample_approved → catalogue',
      description: 'Si échantillon nécessaire, processus complet requis'
    },
    requires_sample_false: {
      workflow: 'sourcing_validated → catalogue',
      description: 'Si pas d\'échantillon, passage direct au catalogue'
    }
  }
}
```

### **État 3: Demande de commande échantillons (Si requis)**
```typescript
interface SampleOrderWorkflow {
  // Étape 3a: Demande de commande d'échantillons
  sample_request: {
    status: 'sample_request_pending',
    required_fields: ['sample_description', 'estimated_cost', 'delivery_time'],
    validation: 'Demande approuvée par manager'
  },

  // Étape 3b: Commande d'échantillons
  sample_order: {
    status: 'sample_ordered',
    tracking: 'order_number, supplier_contact, expected_delivery',
    notifications: 'Auto-reminder si retard livraison'
  },

  // Étape 3c: Réception et validation échantillons
  sample_validation: {
    status: 'sample_delivered',
    actions: ['approve', 'reject', 'request_modifications'],
    approval_required: 'Manager ou responsable catalogue'
  }
}
```

### **État 4: Passage Catalogue (Conditionnel)**
```typescript
interface CatalogTransferRules {
  // Cas 1: Pas d'échantillon requis
  direct_transfer: {
    condition: 'requires_sample === false && sourcing_validated === true',
    workflow: 'sourcing_validated → product_created',
    automatic: true
  },

  // Cas 2: Échantillons requis ET validés
  sample_transfer: {
    condition: 'requires_sample === true && sample_status === "approved"',
    workflow: 'sample_approved → product_created',
    automatic: true
  },

  // Cas 3: Échantillons refusés
  sample_rejected: {
    condition: 'sample_status === "rejected"',
    workflow: 'sample_rejected → back_to_sourcing OR archive',
    action: 'Retour sourcing ou archivage produit'
  }
}
```

## 🔧 Implémentation Database

### **Nouvelles colonnes product_drafts**
```sql
-- Ajouter colonnes pour workflow validation CORRECT
ALTER TABLE product_drafts ADD COLUMN IF NOT EXISTS sourcing_status TEXT DEFAULT 'draft';
ALTER TABLE product_drafts ADD COLUMN IF NOT EXISTS sample_status TEXT DEFAULT NULL;
ALTER TABLE product_drafts ADD COLUMN IF NOT EXISTS sample_request_status TEXT DEFAULT NULL;

-- Dates de tracking workflow
ALTER TABLE product_drafts ADD COLUMN IF NOT EXISTS sourcing_validated_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE product_drafts ADD COLUMN IF NOT EXISTS sourcing_validated_by UUID REFERENCES auth.users(id);
ALTER TABLE product_drafts ADD COLUMN IF NOT EXISTS sample_requested_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE product_drafts ADD COLUMN IF NOT EXISTS sample_ordered_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE product_drafts ADD COLUMN IF NOT EXISTS sample_delivered_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE product_drafts ADD COLUMN IF NOT EXISTS sample_validated_at TIMESTAMPTZ DEFAULT NULL;

-- Informations échantillons
ALTER TABLE product_drafts ADD COLUMN IF NOT EXISTS sample_description TEXT DEFAULT NULL;
ALTER TABLE product_drafts ADD COLUMN IF NOT EXISTS sample_estimated_cost DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE product_drafts ADD COLUMN IF NOT EXISTS sample_delivery_time_days INTEGER DEFAULT NULL;
ALTER TABLE product_drafts ADD COLUMN IF NOT EXISTS sample_validation_notes TEXT DEFAULT NULL;

-- Types enum pour sourcing_status
CREATE TYPE sourcing_status_type AS ENUM (
  'draft',
  'sourcing_validated',
  'ready_for_catalog',
  'archived'
);
ALTER TABLE product_drafts ALTER COLUMN sourcing_status TYPE sourcing_status_type USING sourcing_status::sourcing_status_type;

-- Types enum pour sample_request_status
CREATE TYPE sample_request_status_type AS ENUM (
  'pending_approval',
  'approved',
  'rejected'
);

-- Types enum pour sample_status (workflow complet)
CREATE TYPE sample_status_type AS ENUM (
  'not_required',
  'request_pending',
  'request_approved',
  'ordered',
  'delivered',
  'approved',
  'rejected'
);
ALTER TABLE product_drafts ALTER COLUMN sample_status TYPE sample_status_type USING sample_status::sample_status_type;
```

### **Fonction validation automatique**
```sql
CREATE OR REPLACE FUNCTION validate_sourcing_product(draft_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    product_id UUID
) AS $$
DECLARE
    draft_record RECORD;
    new_product_id UUID;
BEGIN
    -- 1. Récupérer le brouillon sourcing
    SELECT * INTO draft_record
    FROM product_drafts
    WHERE id = draft_id AND creation_mode = 'sourcing';

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Brouillon sourcing introuvable', NULL::UUID;
        RETURN;
    END IF;

    -- 2. Vérifications business rules
    IF draft_record.supplier_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Fournisseur obligatoire', NULL::UUID;
        RETURN;
    END IF;

    IF draft_record.cost_price <= 0 THEN
        RETURN QUERY SELECT FALSE, 'Prix d''achat obligatoire', NULL::UUID;
        RETURN;
    END IF;

    -- 3. Vérification échantillons si requis
    IF draft_record.requires_sample = TRUE THEN
        IF draft_record.sample_status != 'validated' THEN
            RETURN QUERY SELECT FALSE, 'Échantillons doivent être validés avant passage catalogue', NULL::UUID;
            RETURN;
        END IF;
    END IF;

    -- 4. Créer le produit final
    INSERT INTO products (
        sku,
        name,
        price_ht,
        cost_price,
        description,
        supplier_id,
        supplier_reference,
        creation_mode,
        requires_sample,
        product_type,
        assigned_client_id,
        status
    ) VALUES (
        'VER-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
        draft_record.name,
        COALESCE(draft_record.estimated_selling_price, draft_record.cost_price * 1.5),
        draft_record.cost_price,
        draft_record.description,
        draft_record.supplier_id,
        draft_record.supplier_reference,
        'sourcing',
        FALSE, -- Plus besoin d'échantillon
        draft_record.product_type,
        draft_record.assigned_client_id,
        'in_stock'
    ) RETURNING id INTO new_product_id;

    -- 5. Migrer les images
    INSERT INTO product_images (
        product_id,
        storage_path,
        is_primary,
        image_type,
        alt_text,
        file_size,
        format,
        display_order
    )
    SELECT
        new_product_id,
        storage_path,
        is_primary,
        image_type,
        alt_text,
        file_size,
        format,
        display_order
    FROM product_draft_images
    WHERE product_draft_id = draft_id;

    -- 6. Supprimer le brouillon
    DELETE FROM product_draft_images WHERE product_draft_id = draft_id;
    DELETE FROM product_drafts WHERE id = draft_id;

    -- 7. Succès
    RETURN QUERY SELECT TRUE, 'Produit ajouté au catalogue avec succès', new_product_id;
END;
$$ LANGUAGE plpgsql;
```

## 🎯 Interface Utilisateur

### **1. Formulaire Sourcing Enhanced**
```typescript
// Ajout champ requires_sample au formulaire
interface SourcingFormData {
  name: string
  supplier_page_url: string
  assigned_client_id?: string
  requires_sample: boolean | null // ⭐ NOUVEAU
  supplier_id?: string           // ⭐ NOUVEAU
  cost_price?: number           // ⭐ NOUVEAU
  estimated_selling_price?: number // ⭐ NOUVEAU
}

// Validation conditionnelle
const validateSourcingForm = (data: SourcingFormData) => {
  const errors = []

  // Champs obligatoires base
  if (!data.name) errors.push('Nom obligatoire')
  if (!data.supplier_page_url) errors.push('URL fournisseur obligatoire')

  // Pour validation finale
  if (data.requires_sample !== null) {
    if (!data.supplier_id) errors.push('Fournisseur obligatoire pour validation')
    if (!data.cost_price || data.cost_price <= 0) errors.push('Prix d\'achat obligatoire')
  }

  return errors
}
```

### **2. Interface Validation Échantillons**
```typescript
interface SampleValidationInterface {
  // Liste produits avec échantillons requis
  products_awaiting_samples: ProductDraft[]

  // Actions disponibles
  actions: {
    mark_sample_ordered: (draftId: string) => void
    mark_sample_delivered: (draftId: string) => void
    validate_sample: (draftId: string, approved: boolean, notes: string) => void
    reject_sample: (draftId: string, reason: string) => void
  }

  // États affichés
  sample_statuses: {
    'ordered': 'Échantillon commandé',
    'delivered': 'Échantillon livré',
    'validated': 'Échantillon validé',
    'rejected': 'Échantillon refusé'
  }
}
```

### **3. Workflow Automatique**
```typescript
interface AutoWorkflow {
  // Trigger automatique après validation échantillon
  on_sample_validated: async (draftId: string) => {
    const draft = await getDraft(draftId)

    if (draft.requires_sample && draft.sample_status === 'validated') {
      // Auto-passage vers catalogue
      return await validateSourcingProduct(draftId)
    }
  }

  // Trigger pour produits sans échantillon
  on_sourcing_completed: async (draftId: string) => {
    const draft = await getDraft(draftId)

    if (!draft.requires_sample && hasAllRequiredFields(draft)) {
      // Auto-passage vers catalogue
      return await validateSourcingProduct(draftId)
    }
  }
}
```

## 🔍 Tests Business Rules

### **Test 1: Produit sans échantillon**
```typescript
describe('Sourcing without samples', () => {
  test('Direct validation to catalog', async () => {
    const draft = await createSourcingDraft({
      name: 'Test Product',
      supplier_page_url: 'https://supplier.com',
      requires_sample: false,
      supplier_id: 'supplier-123',
      cost_price: 100,
      estimated_selling_price: 150
    })

    // Should allow direct validation
    const result = await validateSourcingProduct(draft.id)
    expect(result.success).toBe(true)
    expect(result.product_id).toBeTruthy()
  })
})
```

### **Test 2: Produit avec échantillons**
```typescript
describe('Sourcing with samples', () => {
  test('Requires sample validation before catalog', async () => {
    const draft = await createSourcingDraft({
      name: 'Test Product With Sample',
      requires_sample: true,
      supplier_id: 'supplier-123',
      cost_price: 100
    })

    // Should fail validation without sample approval
    const result = await validateSourcingProduct(draft.id)
    expect(result.success).toBe(false)
    expect(result.message).toContain('Échantillons doivent être validés')

    // After sample validation
    await updateDraft(draft.id, { sample_status: 'validated' })
    const result2 = await validateSourcingProduct(draft.id)
    expect(result2.success).toBe(true)
  })
})
```

## 📊 Métriques Business

### **KPIs Sourcing Workflow**
```typescript
interface SourcingMetrics {
  // Performance workflow
  avg_sourcing_to_catalog_time: 'jours moyens sourcing → catalogue',
  sample_validation_rate: '% échantillons validés vs rejetés',
  auto_validation_rate: '% produits validés automatiquement',

  // Efficacité business
  sourcing_success_rate: '% produits sourcing → ventes',
  margin_accuracy: 'écart prix estimé vs réel',
  supplier_reliability: 'temps livraison échantillons respecté'
}
```

### **Dashboard Sourcing**
```sql
-- Vue métriques sourcing
CREATE VIEW sourcing_workflow_metrics AS
SELECT
    COUNT(*) FILTER (WHERE creation_mode = 'sourcing') as total_sourcing,
    COUNT(*) FILTER (WHERE requires_sample = true) as requiring_samples,
    COUNT(*) FILTER (WHERE sample_status = 'validated') as samples_validated,
    COUNT(*) FILTER (WHERE validation_status = 'approved') as approved_products,
    AVG(EXTRACT(EPOCH FROM (validated_at - created_at))/86400) as avg_validation_days
FROM product_drafts
WHERE creation_mode = 'sourcing'
AND created_at >= CURRENT_DATE - INTERVAL '30 days';
```

## ✅ Critères de Succès

### **Fonctionnel**
- ✅ **Sauvegarde formulaire** : Tous champs sauvegardés correctement
- ✅ **Validation conditionnelle** : Échantillons requis selon `requires_sample`
- ✅ **Workflow automatique** : Passage catalogue sans intervention manuelle
- ✅ **Business rules** : Validation prix, fournisseur, échantillons

### **Performance**
- ✅ **Validation <2s** : Passage brouillon → produit catalogue
- ✅ **Interface réactive** : Mise à jour statuts temps réel
- ✅ **Workflow fluide** : Navigation sourcing → échantillons → catalogue

### **Qualité**
- ✅ **0 erreur console** : Interface sans erreur JavaScript
- ✅ **Validation robuste** : Gestion cas limites et erreurs
- ✅ **Audit trail** : Traçabilité complète des validations

---

**Ce workflow garantit une gestion professionnelle du sourcing avec validation automatique intelligente selon les besoins d'échantillonnage.**