# 🔍 SCAN organisations.name - Rapport Complet

**Date**: 2025-10-24
**Statut**: ✅ Scan terminé - Prêt pour corrections

---

## 📊 RÉSUMÉ EXÉCUTIF

- **Total fichiers affectés**: 9 fichiers
- **Total occurrences**: 17 occurrences
- **Criticité**: 🔴 HAUTE (erreur 42703 PostgreSQL - colonne inexistante)

---

## 🎯 FICHIERS AFFECTÉS PAR CATÉGORIE

### 🔧 HOOKS (2 occurrences - HAUTE PRIORITÉ)

#### 1. `src/hooks/use-purchase-receptions.ts`

- **Ligne 355**

```typescript
query = query.or(
  `po_number.ilike.%${filters.search}%,organisations.name.ilike.%${filters.search}%`
);
```

**Impact**: Recherche dans réceptions fournisseurs - Erreur SQL

---

#### 2. `src/hooks/use-stock-optimized.ts`

- **Ligne 116**

```typescript
supplier_name: product.organisations?.name;
```

**Impact**: Affichage nom fournisseur dans stocks - Type error

---

### 📄 PAGES (10 occurrences - HAUTE PRIORITÉ)

#### 3. `src/app/commandes/clients/page.tsx`

**4 occurrences**:

- **Ligne 126**: Filtre recherche

```typescript
const matchesOrgName = normalizeString(order.organisations?.name).includes(
  term
);
```

- **Ligne 150**: Tri par nom client

```typescript
? a.organisations?.name || ''
```

- **Ligne 153**: Tri par nom client (suite)

```typescript
? b.organisations?.name || ''
```

- **Ligne 575**: Affichage nom client

```typescript
? order.organisations?.name
```

**Impact**: Page commandes clients complètement cassée

---

#### 4. `src/app/commandes/fournisseurs/page.tsx`

**3 occurrences**:

- **Ligne 141**: Filtre recherche

```typescript
order.organisations?.name.toLowerCase().includes(searchTerm.toLowerCase());
```

- **Ligne 319**: Affichage nom fournisseur

```typescript
{
  order.organisations?.name || 'Non défini';
}
```

- **Ligne 412**: Affichage détail commande

```typescript
<p><span className="font-medium">Fournisseur:</span> {selectedOrder.organisations?.name}</p>
```

**Impact**: Page commandes fournisseurs cassée

---

#### 5. `src/app/commandes/expeditions/page.tsx`

**2 occurrences**:

- **Ligne 46**: Filtre recherche

```typescript
order.organisations?.name.toLowerCase().includes(searchLower) ||
```

- **Ligne 77**: Affichage nom dans carte

```typescript
return order.organisations.name;
```

**Impact**: Page expéditions cassée

---

#### 6. `src/app/stocks/receptions/page.tsx`

**1 occurrence**:

- **Ligne 282**: Affichage nom fournisseur

```typescript
{
  order.organisations?.name || 'Non défini';
}
```

**Impact**: Page réceptions cassée

---

### 🧩 COMPOSANTS (5 occurrences - MOYENNE PRIORITÉ)

#### 7. `src/components/business/sales-order-form-modal.tsx`

- **Ligne 111**

```typescript
name: order.organisations?.name || '',
```

**Impact**: Formulaire commande vente

---

#### 8. `src/components/business/sales-order-shipment-form.tsx`

- **Ligne 207**

```typescript
Commande {salesOrder.so_number} • {salesOrder.organisations?.name}
```

**Impact**: Formulaire expédition

---

#### 9. `src/components/business/sales-order-shipment-modal.tsx`

- **Ligne 55**

```typescript
{
  enrichedOrder?.organisations && ` • ${enrichedOrder.organisations.name}`;
}
```

**Impact**: Modal expédition

---

#### 10. `src/components/business/purchase-order-reception-form.tsx`

- **Ligne 131**

```typescript
Commande {purchaseOrder.po_number} • {purchaseOrder.organisations?.name}
```

**Impact**: Formulaire réception

---

#### 11. `src/components/business/order-detail-modal.tsx`

- **Ligne 80**

```typescript
return order.organisations.name;
```

**Impact**: Modal détail commande

---

## 🎯 CORRECTION REQUISE

**Remplacement pattern**:

```typescript
// AVANT
organisations.name;

// APRÈS
organisations.trade_name || organisations.legal_name;
```

**Raison**: Migration DB 20251022_001 a remplacé:

- `organisations.name` → supprimée
- Ajouté: `organisations.legal_name` (nom légal)
- Ajouté: `organisations.trade_name` (nom commercial optionnel)

---

## 📋 ORDRE DE CORRECTION PROPOSÉ

### Phase 1: Hooks (Critical - 2 fichiers)

1. ✅ `use-stock-optimized.ts` (1 occurrence)
2. ✅ `use-purchase-receptions.ts` (1 occurrence)

### Phase 2: Pages Commandes (High Priority - 3 fichiers)

3. ✅ `commandes/clients/page.tsx` (4 occurrences)
4. ✅ `commandes/fournisseurs/page.tsx` (3 occurrences)
5. ✅ `commandes/expeditions/page.tsx` (2 occurrences)

### Phase 3: Pages Stocks (Medium Priority - 1 fichier)

6. ✅ `stocks/receptions/page.tsx` (1 occurrence)

### Phase 4: Composants (Low Priority - 5 fichiers)

7. ✅ `sales-order-form-modal.tsx`
8. ✅ `sales-order-shipment-form.tsx`
9. ✅ `sales-order-shipment-modal.tsx`
10. ✅ `purchase-order-reception-form.tsx`
11. ✅ `order-detail-modal.tsx`

---

## ⚠️ PAGES CASSÉES IDENTIFIÉES

D'après ce scan, les pages suivantes sont **actuellement non fonctionnelles**:

1. ❌ `/commandes/clients` (4 erreurs)
2. ❌ `/commandes/fournisseurs` (3 erreurs)
3. ❌ `/commandes/expeditions` (2 erreurs)
4. ❌ `/stocks/receptions` (1 erreur)

**Estimation corrections**: 2-3 heures pour tout corriger (si fait méthodiquement)

---

## 📝 NOTES SUPPLÉMENTAIRES

- ✅ Les fichiers déjà corrigés (use-catalogue.ts, use-sales-orders.ts, etc.) n'apparaissent pas dans ce scan
- ⚠️ Certaines occurrences sont dans du code de recherche/filtre (risque erreur SQL)
- ⚠️ D'autres sont dans de l'affichage UI (risque undefined/null)

---

**Prochaine étape**: Présenter ce rapport à l'utilisateur et obtenir validation pour commencer corrections.
