# Exploration Codebase : Mouvements de Stock MANUELS vs AUTOMATIQUES

**Date** : 2025-11-25
**Objectif** : Comprendre la distinction entre mouvements manuels et automatiques dans le système de stock

---

## 1. COMMENT IDENTIFIER UN MOUVEMENT MANUAL VS AUTOMATIQUE

### 1.1 Colonne `reference_type` (Clé de Distinction)

La table `stock_movements` utilise la colonne **`reference_type`** pour distinguer les types de mouvements :

#### ✅ MOUVEMENTS MANUELS

Ces mouvements peuvent être **supprimés** par l'utilisateur :

```typescript
'manual_adjustment'; // Ajustement inventaire manuel
'manual_entry'; // Entrée manuelle
```

#### ❌ MOUVEMENTS AUTOMATIQUES (NON SUPPRIMABLES)

Créés automatiquement par les réceptions/expéditions :

```typescript
'reception'; // Créé par une réception fournisseur (purchase_order_receptions)
'shipment'; // Créé par une expédition client (sales_order_shipments)
```

#### 🔍 Autres références (moins utilisées)

```typescript
'sales_order'; // Ancien (deprecated, voir migration 20251124_005)
'purchase_order'; // Ancien (deprecated, voir migration 20251124_005)
```

### 1.2 Colonne `affects_forecast` (Filtre Complémentaire)

```typescript
affects_forecast: false; // Mouvement RÉEL (réceptions/expéditions/ajustements)
affects_forecast: true; // Mouvement PRÉVISIONNEL (ne pas afficher dans mouvements réels)
```

---

## 2. OÙ SONT AFFICHÉS LES MOUVEMENTS : PAGE /stocks/mouvements

### 2.1 Structure de la Page

**Fichier** : `/apps/back-office/src/app/stocks/mouvements/page.tsx`

**Composants Clés** :

- `MovementsStatsCards` - Statistiques KPI
- `MovementsFilters` - Filtres sidebar collapsible
- `MovementsTable` - Tableau principal avec bouton "Annuler" ❌
- `MovementsListView` - Vue cards alternative

**États Modals** :

- `CancelMovementModal` - Pour annuler les mouvements
- `MovementDetailsModal` - Détails d'un mouvement
- `GeneralStockMovementModal` - Créer nouveau mouvement

### 2.2 Bouton "Annuler" dans MovementsTable

**Fichier** : `/packages/@verone/stock/src/components/tables/MovementsTable.tsx` (ligne 273-275)

```tsx
{
  onCancelClick && (
    <TableHead className="w-[100px] text-center">Actions</TableHead>
  );
}
```

**Affichage Conditionnel** : Le bouton "Trash2" est visible seulement si `onCancelClick` callback est passé.

```tsx
// Dans page.tsx, ligne 510
<MovementsTable
  movements={movements}
  loading={loading}
  onMovementClick={handleMovementClick}
  onCancelClick={handleCancelClick} // ← Rend le bouton visible
  onOrderClick={handleOrderClick}
/>
```

**Logique du Bouton Annuler** :

```tsx
// Dans MovementsTable.tsx, ligne 346-365
{movement.reference_type === 'sales_order' && movement.reference_id ? (
  <button
    onClick={e => {
      e.stopPropagation();
      onOrderClick?.(movement.reference_id, 'sales');
    }}
    // ...
  >
    Voir commande
  </button>
) : movement.reference_type === 'purchase_order' && movement.reference_id ? (
  // ... similaire pour purchase_order
) : (
  // Si pas de commande liée, afficher bouton Annuler
  (movement.reference_type !== 'manual_adjustment' &&
    movement.reference_type !== 'manual_entry' &&
    !!movement.reference_type)
    ? // Bouton "Voir commande"
    : onCancelClick ? (
      // Bouton "Annuler" pour mouvements manuels
      <button onClick={() => onCancelClick(movement)}>
        <Trash2 className="h-4 w-4 text-red-600" />
      </button>
    )
    : null
)}
```

### 2.3 Modal d'Annulation CancelMovementModal

**Fichier** : `/packages/@verone/stock/src/components/modals/CancelMovementModal.tsx`

**Appel API** :

```typescript
// Ligne 73-75
const response = await fetch(`/api/stock-movements/${movement.id}`, {
  method: 'DELETE',
});
```

**Avertissement à l'Utilisateur** (ligne 131-140) :

```
L'annulation de ce mouvement va automatiquement :
• Recalculer le stock du produit
• Mettre à jour les alertes de stock
• Supprimer définitivement ce mouvement de l'historique
```

---

## 3. HOOK `useMovementsHistory` - RÉCUPÉRATION DES MOUVEMENTS

**Fichier** : `/packages/@verone/stock/src/hooks/use-movements-history.ts`

### 3.1 Type `MovementWithDetails`

```typescript
interface MovementWithDetails {
  id: string;
  product_id: string;
  movement_type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  unit_cost?: number;
  reference_type?: string; // ← CLÉE : 'reception', 'shipment', 'manual_adjustment', etc.
  reference_id?: string; // ← Lien vers reception_id ou shipment_id
  notes?: string;
  reason_code?: string;
  affects_forecast: boolean; // ← false pour mouvements réels
  forecast_type?: 'in' | 'out';
  performed_by: string;
  performed_at: string;
  created_at: string;

  // Données enrichies
  product_name?: string;
  product_sku?: string;
  product_image_url?: string | null;
  user_name?: string;
  channel_id?: string | null;
  channel_name?: string | null;
}
```

### 3.2 Filtre par Défaut

**Ligne 99-103** :

```typescript
const [filters, setFilters] = useState<MovementHistoryFilters>({
  affects_forecast: false, // ← Par défaut = mouvements RÉELS uniquement
  forecast_type: undefined,
});
```

### 3.3 Récupération des Mouvements

**Ligne 115-117** :

```typescript
let query = supabase.from('stock_movements').select('*', { count: 'exact' });
```

Puis filtres appliqués (dateRange, movementTypes, reasonCodes, etc.)

---

## 4. API ENDPOINT DELETE : /api/stock-movements/[id]

**Fichier** : `/apps/back-office/src/app/api/stock-movements/[id]/route.ts`

### 4.1 Règles de Suppression (Validation)

**Ligne 74-108** :

```typescript
// ❌ INTERDIRE suppression mouvements PRÉVISIONNELS
if (movement.affects_forecast) {
  return NextResponse.json(
    {
      success: false,
      error: 'Impossible de supprimer un mouvement prévisionnel',
    },
    { status: 403 }
  );
}

// ❌ INTERDIRE suppression mouvements liés à des COMMANDES
if (
  movement.reference_type &&
  movement.reference_type !== 'manual_adjustment' &&
  movement.reference_type !== 'manual_entry'
) {
  return NextResponse.json(
    {
      success: false,
      error: 'Impossible de supprimer un mouvement lié à une commande',
      details: {
        reason: 'Ce mouvement a été créé automatiquement par une commande',
        reference_type: movement.reference_type,
      },
    },
    { status: 403 }
  );
}
```

### 4.2 Recalcul Automatique via Triggers

**Ligne 110-118** :

```typescript
const { error: deleteError } = await supabase
  .from('stock_movements')
  .delete()
  .eq('id', movementId);

// ⚠️ Les triggers database recalculent automatiquement :
//    - stock_real du produit (trigger_maintain_stock_totals AFTER DELETE)
//    - stock_forecasted_in/out si applicable
//    - alertes de stock
```

---

## 5. MOUVEMENTS AUTOMATIQUES : CRÉÉS PAR LES TRIGGERS

### 5.1 Réceptions Fournisseur (Entrée Automatique)

**Trigger** : `trigger_reception_update_stock` sur `purchase_order_receptions`

**Fonction** : `update_stock_on_reception()` (migration 20251124_005)

**Création du Mouvement** (ligne 45-67) :

```typescript
INSERT INTO stock_movements (
  product_id,
  movement_type,
  quantity_change,
  quantity_before,
  quantity_after,
  reference_type,      // ← 'reception'
  reference_id,        // ← NEW.id (reception_id)
  notes,
  reason_code,         // ← 'purchase_reception'
  performed_by
) VALUES (
  NEW.product_id,
  'IN',
  NEW.quantity_received,
  v_stock_before,
  v_stock_after,
  'reception',         // ✅ CLÉE : reference_type = 'reception'
  NEW.id,              // ✅ reference_id = reception.id
  'Réception commande fournisseur PO #...',
  'purchase_reception',
  NEW.received_by
);
```

### 5.2 Expéditions Client (Sortie Automatique)

**Trigger** : `trigger_shipment_update_stock` sur `sales_order_shipments`

**Fonction** : `update_stock_on_shipment()` (migration 20251124_005)

**Création du Mouvement** (ligne 134-156) :

```typescript
INSERT INTO stock_movements (
  reference_type,      // ← 'shipment'
  reference_id,        // ← NEW.id (shipment_id)
  reason_code,         // ← 'sale'
  // ...
) VALUES (
  'shipment',          // ✅ reference_type = 'shipment'
  NEW.id,              // ✅ reference_id = shipment.id
  'sale',
  // ...
);
```

### 5.3 Suppression Automatique de Mouvement (Trigger DELETE)

**Fichier** : `/supabase/migrations/20251124_001_trigger_delete_reception_reverse_stock.sql`

**Fonction** : `handle_reception_deletion()`

**Logique** (ligne 39-44) :

```sql
-- Supprimer le mouvement de stock associé à cette réception
-- Note: Le mouvement a reference_type='reception' ET reference_id=reception_id (OLD.id)
DELETE FROM stock_movements
WHERE reference_type = 'reception'
  AND reference_id = OLD.id
  AND product_id = OLD.product_id;
```

**Déclencheur** :

```sql
CREATE TRIGGER trigger_before_delete_reception
    BEFORE DELETE ON purchase_order_receptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_reception_deletion();
```

---

## 6. MOUVEMENTS MANUELS : CRÉÉS PAR L'UTILISATEUR

### 6.1 Modal Ajustement Inventaire

**Fichier** : `/packages/@verone/stock/src/components/modals/InventoryAdjustmentModal.tsx`

**Types d'Ajustements** :

- `increase` (Augmenter le stock)
- `decrease` (Diminuer le stock)
- `correction` (Corriger à une quantité cible)

**Reason Codes pour Augmentations** (ligne 121-126) :

```typescript
const INCREASE_REASONS: { code: StockReasonCode; label: string }[] = [
  { code: 'found_inventory', label: 'Trouvaille inventaire' },
  { code: 'manual_adjustment', label: 'Ajustement manuel' },
  { code: 'return_from_client', label: 'Retour client' },
  { code: 'purchase_reception', label: 'Réception fournisseur' },
];
```

**Reason Codes pour Diminutions** (ligne 128-136) :

```typescript
const DECREASE_REASONS: { code: StockReasonCode; label: string }[] = [
  { code: 'damage_transport', label: 'Casse transport' },
  { code: 'damage_handling', label: 'Casse manipulation' },
  { code: 'damage_storage', label: 'Dégradation stockage' },
  { code: 'theft', label: 'Vol/Disparition' },
  { code: 'loss_unknown', label: 'Perte inexpliquée' },
  { code: 'write_off', label: 'Mise au rebut' },
  { code: 'obsolete', label: 'Produit obsolète' },
];
```

### 6.2 Création du Mouvement Manuel

Le mouvement est créé avec :

```typescript
reference_type: 'manual_adjustment'; // ou 'manual_entry'
reference_id: null; // Pas de lien à une commande
affects_forecast: false; // Mouvement réel
reason_code: 'adjustment' | autre; // Selon le choix utilisateur
```

---

## 7. RÉSUMÉ : TABLEAU COMPARATIF

| Aspect               | MANUEL                                          | AUTOMATIQUE (Réception)              | AUTOMATIQUE (Expédition)            |
| -------------------- | ----------------------------------------------- | ------------------------------------ | ----------------------------------- |
| **`reference_type`** | `manual_adjustment` ou `manual_entry`           | `reception`                          | `shipment`                          |
| **`reference_id`**   | NULL                                            | `reception_id`                       | `shipment_id`                       |
| **`reason_code`**    | Choix utilisateur (adjust, damage, theft, etc.) | `purchase_reception`                 | `sale`                              |
| **Créé par**         | Utilisateur via InventoryAdjustmentModal        | Trigger (réception fournisseur)      | Trigger (expédition client)         |
| **Supprimable**      | ✅ OUI (via API DELETE)                         | ❌ NON (bloqué par API)              | ❌ NON (bloqué par API)             |
| **Affecte Forecast** | `affects_forecast: false`                       | `affects_forecast: false`            | `affects_forecast: false`           |
| **Recalcul Stock**   | Via trigger AFTER DELETE                        | Via trigger AFTER DELETE (reception) | Via trigger AFTER DELETE (shipment) |

---

## 8. FICHIERS CLÉS RÉFÉRENCÉS

### Frontend Components

- `/apps/back-office/src/app/stocks/mouvements/page.tsx` - Page principale
- `/packages/@verone/stock/src/components/tables/MovementsTable.tsx` - Tableau avec actions
- `/packages/@verone/stock/src/components/modals/CancelMovementModal.tsx` - Modal suppression
- `/packages/@verone/stock/src/components/modals/InventoryAdjustmentModal.tsx` - Modal ajustement
- `/packages/@verone/stock/src/hooks/use-movements-history.ts` - Hook récupération

### API & Backend

- `/apps/back-office/src/app/api/stock-movements/[id]/route.ts` - DELETE endpoint

### Database Migrations

- `/supabase/migrations/20251124_005_fix_stock_movements_reference_type.sql` - Correction reference_type
- `/supabase/migrations/20251124_001_trigger_delete_reception_reverse_stock.sql` - Trigger DELETE réceptions
- `/supabase/migrations/20251124_002_trigger_delete_shipment_reverse_stock.sql` - Trigger DELETE expéditions
- `/supabase/migrations/20251124_007_validate_stock_architecture.sql` - Validation complète

---

## 9. POINTS IMPORTANTS

✅ **Système de Traçabilité Précis** :

- Chaque mouvement de réception/expédition est lié spécifiquement à sa réception/expédition
- Via `reference_type='reception'/'shipment'` + `reference_id=reception_id/shipment_id`

✅ **Protection des Données** :

- API DELETE bloque les mouvements liés à des commandes
- Seuls les mouvements manuels (`manual_adjustment`, `manual_entry`) peuvent être supprimés
- Mouvements prévisionnels (`affects_forecast=true`) ne peuvent jamais être supprimés

✅ **Triggers Automatiques** :

- Suppression réception → Supprime le mouvement de stock associé
- Suppression expédition → Supprime le mouvement de stock associé
- Recalcul automatique du stock via triggers AFTER DELETE

✅ **Filtre par Défaut** :

- Page `/stocks/mouvements` affiche par défaut les mouvements RÉELS (`affects_forecast: false`)
- Les mouvements prévisionnels sont filtrés

---

## 10. EXEMPLE : COMMENT DISTINGUER DANS LE CODE

```typescript
// Vérifier si c'est un mouvement manuel
const isManualMovement =
  movement.reference_type === 'manual_adjustment' ||
  movement.reference_type === 'manual_entry';

// Vérifier si c'est un mouvement automatique lié à une réception
const isReceptionMovement = movement.reference_type === 'reception';

// Vérifier si c'est un mouvement automatique lié à une expédition
const isShipmentMovement = movement.reference_type === 'shipment';

// Vérifier si supprimable
const isDeletable = isManualMovement && !movement.affects_forecast;
```
