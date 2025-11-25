# Exploration : Ajout Colonnes Stock Prévisionnel Page Inventaire

**Date** : 2025-11-25  
**Status** : Analyse terminée  
**Utilisateur demande** : Ajouter colonnes `stock_forecasted_in` et `stock_forecasted_out` à la page inventaire

---

## 1. RÉSULTATS EXPLORATION

### ✅ Les colonnes EXISTENT EN BASE DE DONNÉES

La table `products` contient déjà les deux colonnes :

```sql
-- Colonne 1: Stock prévu ENTRANT
stock_forecasted_in INTEGER
  DEFAULT: 0
  COMMENT: "Stock prévu en entrée (commandes fournisseurs en transit).
  Peut être NÉGATIF si annulations prévisionnelles > ajouts.
  Calcul: SUM(stock_movements WHERE affects_forecast=true AND forecast_type='in')"

-- Colonne 2: Stock prévu SORTANT
stock_forecasted_out INTEGER
  DEFAULT: 0
  COMMENT: "Stock prévu en sortie (commandes clients validées non expédiées).
  Peut être NÉGATIF si annulations commandes > réservations.
  Calcul: ABS(SUM(stock_movements WHERE affects_forecast=true AND forecast_type='out'))"
```

**Migration créée** : `20251125_001_add_forecasted_stock_on_po_validation.sql`

- Crée trigger automatique qui incrémente `stock_forecasted_in` lors validation commandes fournisseurs
- Décrémente si annulation
- Déclenché sur changement status purchase_orders (draft → validated)

---

## 2. ARCHITECTURE ACTUELLE PAGE INVENTAIRE

### 📄 Fichiers impliqués

| Fichier         | Rôle                 | Chemin                                                     |
| --------------- | -------------------- | ---------------------------------------------------------- |
| Page Inventaire | Affichage principal  | `/apps/back-office/src/app/stocks/inventaire/page.tsx`     |
| Hook données    | Récupération données | `/packages/@verone/stock/src/hooks/use-stock-inventory.ts` |

### 🔄 Flux actuel (sans colonnes prévisionnelles)

```
page.tsx (client)
  ↓
useStockInventory() hook
  ↓
Query Supabase:
  - SELECT: id, name, sku, stock_quantity, cost_price, product_images
  - JOIN: stock_movements (pour calcul entrées/sorties)
  ↓
Données retournées (ProductInventory interface):
  {
    id, name, sku,
    product_image_url,
    stock_quantity,        ← Stock ACTUEL seulement
    total_in,              ← Entrées mouvements
    total_out,             ← Sorties mouvements
    total_adjustments,     ← Ajustements
    last_movement_at,
    movement_count
  }
  ↓
Tableau affichage avec 8 colonnes:
  [Image] [Produit] [SKU] [Entrées] [Sorties] [Ajust.] [Stock] [Dernière MAJ] [Actions]
```

### 📊 Colonnes actuellement affichées (page.tsx lignes 269-295)

```typescript
<th>Produit</th>           // item.name + link
<th>SKU</th>              // item.sku
<th>Entrées</th>          // item.total_in (mouvements IN)
<th>Sorties</th>          // item.total_out (mouvements OUT)
<th>Ajust.</th>           // item.total_adjustments (mouvements ADJUST)
<th>Stock</th>            // item.stock_quantity (stock ACTUEL)
<th>Dernière MAJ</th>     // item.last_movement_at
<th>Actions</th>          // Boutons ajustement + historique
```

---

## 3. INTERFACE PRODUCTINVENTORY (Hook)

**Fichier** : `/packages/@verone/stock/src/hooks/use-stock-inventory.ts` lignes 6-17

```typescript
interface ProductInventory {
  id: string;
  name: string;
  sku: string;
  product_image_url?: string;
  stock_quantity: number;        ← ACTUEL
  total_in: number;              ← Mouvements ENTRANTS
  total_out: number;             ← Mouvements SORTANTS
  total_adjustments: number;     ← Ajustements
  last_movement_at: string;
  movement_count: number;
}
```

**À ajouter** :

```typescript
stock_forecasted_in: number;    ← Stock prévu EN ENTRÉE
stock_forecasted_out: number;   ← Stock prévu EN SORTIE
```

---

## 4. QUERY SUPABASE (useStockInventory)

**Fichier** : `/packages/@verone/stock/src/hooks/use-stock-inventory.ts` lignes 51-66

**État actuel** :

```typescript
let query = supabase
  .from('products')
  .select(
    `
    id,
    name,
    sku,
    stock_quantity,
    stock_real,
    cost_price,
    product_images!left(public_url)
  `
  )
  .eq('product_images.is_primary', true)
  .limit(1, { foreignTable: 'product_images' })
  .is('archived_at', null);
```

**À modifier** :

- Ajouter `stock_forecasted_in` et `stock_forecasted_out` au `.select()`
- Mapper depuis Supabase vers interface ProductInventory

---

## 5. EXPORT CSV

**Fichier** : `/packages/@verone/stock/src/hooks/use-stock-inventory.ts` lignes 186-235

**État actuel** (exportInventoryCSV) - En-têtes CSV :

```typescript
[
  'Produit',
  'SKU',
  'Entrées',
  'Sorties',
  'Ajustements',
  'Stock Actuel',
  'Dernière Activité',
].join(',');
```

**À modifier** :

- Ajouter deux colonnes CSV: `'Stock Prévisionnel Entrant'` et `'Stock Prévisionnel Sortant'`
- Ajouter extraction données dans `.map()`

---

## 6. UTILISATION DE CES COLONNES AILLEURS

Les colonnes `forecasted_in` et `forecasted_out` sont déjà utilisées dans :

| Fichier                  | Usage                                            |
| ------------------------ | ------------------------------------------------ |
| `use-stock-alerts.ts`    | Calcul stock d'alerte prévisionnel               |
| `use-stock-dashboard.ts` | Dashboard KPIs stock prévu                       |
| `use-stock.ts`           | Hook core stock                                  |
| `use-stock-status.ts`    | Statut stock (in_stock vs out_of_stock)          |
| Types Supabase           | Définition colonne dans Database.tables.products |

✅ **Pas besoin migration DB** - les colonnes existent et sont déjà gérées !

---

## 7. FICHIERS À MODIFIER

### 🔴 MODIFICATION REQUISE #1

**Fichier** : `/packages/@verone/stock/src/hooks/use-stock-inventory.ts`

**Changements** :

1. Ligne 6-17 : Ajouter 2 champs interface ProductInventory
2. Ligne 53-63 : Ajouter colonnes dans Supabase SELECT
3. Ligne 131-143 : Ajouter mapping retour données
4. Ligne 189-197 : Ajouter colonnes CSV export
5. Ligne 198-210 : Mapper données dans CSV rows

### 🔴 MODIFICATION REQUISE #2

**Fichier** : `/apps/back-office/src/app/stocks/inventaire/page.tsx`

**Changements** :

1. Ligne 269-296 : Ajouter 2 colonnes tableau `<th>`
2. Ligne 299-417 : Ajouter 2 colonnes tableau `<td>` dans map
   - Afficher `item.stock_forecasted_in` avec icône TrendingUp
   - Afficher `item.stock_forecasted_out` avec icône TrendingDown

---

## 8. DESIGN PROPOSÉ (Colonnes nouvelles)

### Position dans tableau

```
[Image] [Produit] [SKU] [Entrées] [Sorties] [Ajust.]
[Stock]
[Stock Prév. Entrant] ← NOUVEAU
[Stock Prév. Sortant] ← NOUVEAU
[Dernière MAJ] [Actions]
```

### Style affichage

```typescript
// Stock Prévisionnel Entrant
<td className="py-2 px-3 text-right">
  <div className="flex items-center justify-end gap-1">
    <TrendingUp className="h-4 w-4 text-green-600" />
    <span className="font-medium text-gray-700 text-sm">
      +{item.stock_forecasted_in}
    </span>
  </div>
</td>

// Stock Prévisionnel Sortant
<td className="py-2 px-3 text-right">
  <div className="flex items-center justify-end gap-1">
    <TrendingDown className="h-4 w-4 text-orange-600" />
    <span className="font-medium text-gray-700 text-sm">
      -{item.stock_forecasted_out}
    </span>
  </div>
</td>
```

---

## 9. IMPACT AUTRES PAGES/HOOKS

✅ **Aucun impact** - Colonnes existent déjà en DB et sont utilisées ailleurs :

- Dashboard page récupère déjà ces colonnes
- Alerts system en dépend
- KPIs les affichent

---

## 10. RÉSUMÉ MODIFICATIONS

| Étape | Fichier                | Lignes  | Action                      |
| ----- | ---------------------- | ------- | --------------------------- |
| 1️⃣    | use-stock-inventory.ts | 6-17    | ADD interface fields        |
| 2️⃣    | use-stock-inventory.ts | 53-63   | ADD Supabase SELECT         |
| 3️⃣    | use-stock-inventory.ts | 131-143 | ADD data mapping            |
| 4️⃣    | use-stock-inventory.ts | 189-210 | ADD CSV export              |
| 5️⃣    | inventaire/page.tsx    | 269-296 | ADD table headers (2×)      |
| 6️⃣    | inventaire/page.tsx    | 299-417 | ADD table cells (2×) in map |

**Complexité** : 🟡 Faible (ajouts simples, pas de logique métier)  
**Test requis** : Affichage tableau + export CSV  
**Build check** : TypeScript strict (types interface)

---

## 11. QUESTIONS CLARIFICATION

Avant d'implémenter, confirmer :

1. ✅ **Position colonnes** : Après "Stock" actuel ou ailleurs ?
2. ✅ **Format affichage** : Nombres positifs avec +/- comme actuellement ?
3. ✅ **Libellés** : "Stock Prév. Entrant" / "Stock Prév. Sortant" ?
4. ✅ **Couleurs icônes** : Vert pour entrant, Orange pour sortant ?
5. ✅ **Export CSV** : Inclure les 2 colonnes ?

---

## 📋 CHECKLIST IMPLÉMENTATION

- [ ] Modifier interface ProductInventory (2 champs)
- [ ] Modifier Supabase query `.select()` (2 colonnes)
- [ ] Mapper données retour (2 propriétés)
- [ ] Modifier CSV export (headers + data)
- [ ] Ajouter colonnes table page (headers)
- [ ] Ajouter cellules table page (data)
- [ ] Tests affichage tableau
- [ ] Tests export CSV
- [ ] npm run type-check (vérifier TypeScript)
- [ ] npm run build (vérifier build)
- [ ] Vérifier console zéro erreurs
