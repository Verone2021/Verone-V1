# Exploration Page /stocks - KPIs, Widgets et Synchronisation

**Date**: 2025-11-26  
**Status**: READ-ONLY ANALYSIS  
**Objectif**: Analyser les problèmes de synchronisation du stock réel et proposer des solutions

---

## 1. STRUCTURE PAGE `/stocks` (page.tsx)

### 📍 Fichier Principal

- `/apps/back-office/src/app/stocks/page.tsx` (482 lignes)
- Composant client (`'use client'`)
- Responsive 4 colonnes KPI en grid

### 🏗️ Layout Principal

```
┌─ Header (h-16)
│  └─ Titre "Stocks" + Bouton "Actualiser"
├─ Navigation Cards (Pages Stock + Pages Connexes)
├─ 4 KPI Cards (h-20, grid md:grid-cols-4)
│  ├─ Stock Réel (Package icon, variant="success")
│  ├─ Stock Disponible (CheckCircle icon, variant="info")
│  ├─ Alertes Stock (AlertTriangle icon, variant=dynamic)
│  └─ Valeur Stock (BarChart3 icon, variant="default")
└─ 2 Widgets Main (Card + CardContent)
   ├─ Section "Stock Réel"
   │  ├─ Widget "Alertes Stock" (Top 3 alertes avec ProductThumbnail)
   │  └─ Widget "Historique des Stocks" (5 derniers mouvements)
   └─ bg-white border-gray-200 design sobre
```

---

## 2. HOOKS UTILISÉS POUR LES KPIs

### 🔴 PROBLÈME: Stock Réel ne se met pas à jour

| Hook                    | Ligne | Rôle                                                    | Problème Identifié                                |
| ----------------------- | ----- | ------------------------------------------------------- | ------------------------------------------------- |
| **useStockDashboard**   | 40    | KPI metrics (total_quantity, total_available, overview) | ❌ Pas de refresh automatique des données         |
| **useStockAlerts**      | 43    | Top 3 alertes stock                                     | ⚠️ Refresh 30sec mais stock_real peut être désync |
| **useMovementsHistory** | 44-47 | Derniers 5 mouvements                                   | ✅ Rafraîchit bien                                |

### 🔍 useStockDashboard - Analyse Détaillée

**Fichier**: `/packages/@verone/stock/src/hooks/use-stock-dashboard.ts` (486 lignes)

#### Calcul du "Stock Réel" (KPI #1)

```typescript
// Ligne 194-196
total_quantity: realProducts.reduce(
  (sum, p) => sum + (p.stock_real || p.stock_quantity || 0),
  0
);

// Source: use-stock-ui hook (cache)
let products = stock.stockItems;
if (products.length === 0) {
  products = await stock.getStockItems({ archived: false });
}
```

#### ⚠️ PROBLÈMES DE SYNC IDENTIFIÉS

1. **Pas d'auto-refresh**: useEffect charge une fois au montage (ligne 475-478)

   ```typescript
   useEffect(() => {
     fetchDashboardMetrics();
   }, []); // ← Charge UNE SEULE FOIS!
   ```

2. **Dépend du cache use-stock-ui**:
   - Le hook utilise `stock.stockItems` (cache client)
   - Si le cache n'est pas à jour, le stock_real affiché est obsolète
   - Pas de subscription Realtime pour les mises à jour

3. **Filtrage par mouvements réels** (ligne 178-190):
   - Exclut les produits qui n'ont PAS eu de mouvements dans les 7 derniers jours
   - ⚠️ Produits statiques avec stock > 0 mais "fantôme" = pas affichés
   - Peut masquer le vrai stock de certains articles

### 🔍 useStockAlerts - Analyse Détaillée

**Fichier**: `/packages/@verone/stock/src/hooks/use-stock-alerts.ts` (187 lignes)

#### Source du stock_real dans les alertes

```typescript
// Ligne 131
stock_real: alert.products?.stock_real ?? alert.stock_real,
```

#### Problèmes:

- ✅ Fetch depuis `stock_alert_tracking` + jointure `products`
- ⚠️ Données peuvent être désynchronisées si:
  - Un mouvement a été enregistré mais pas encore reflété dans la vue
  - Cache de la jointure Supabase périmé

#### Refresh:

- Initial: `useEffect(() => { fetchAlerts() }, [fetchAlerts])` (ligne 162-164)
- Page /stocks: refresh manuel toutes les 30 secondes (ligne 56-62)

---

## 3. KPI CARDS - COMPOSANT D'AFFICHAGE

### 📁 Fichier

- `/apps/back-office/src/components/ui-v2/stock/stock-kpi-card.tsx` (173 lignes)

### 🎨 Props & Design

```typescript
interface StockKPICardProps {
  title: string; // "Stock Réel", "Disponible", etc.
  value: number | string; // 1250, "1 250,00 €", etc.
  icon: LucideIcon; // Package, CheckCircle, etc.
  subtitle?: string; // "15 produits en stock"
  variant?: KPIVariant; // "success" | "info" | "warning" | "danger" | "default"
  trend?: { value: number; direction: 'up' | 'down' };
}
```

### Design Actual (lines 109-167)

- Height: 80px (h-20)
- Layout: Icon (40x40 circular) + Content (title + value + subtitle)
- Background: Selon variant
- **ℹ️ Pas de refresh visuel** - affiche juste la valeur props initiale

---

## 4. WIDGET "ALERTES STOCK" - Structure Détaillée

### 📍 Code

Lignes 299-381 dans `/apps/back-office/src/app/stocks/page.tsx`

### 🏗️ Structure

```tsx
<Card> (border-gray-200, white bg)
  <CardHeader>
    <Badge> "Mouvements Effectués"
    <CardTitle> "Alertes Stock"
    <CardDescription> "Top 3 alertes nécessitant attention"
  <CardContent>
    {alerts.length === 0 ? "Aucune alerte" : (
      alerts.slice(0, 3).map(alert => (
        <div> {/* Chaque alerte */}
          <ProductThumbnail src={alert.product_image_url} />
          <Link href={`/produits/catalogue/${alert.product_id}`}>
            {alert.product_name}
          </Link>
          <Badge> "{alert.stock_real} réel"
          <Badge> "Min: {alert.min_stock}"
      ))
    )}
    <ButtonV2> "Voir toutes les alertes"
```

### ⚠️ PROBLÈMES

1. **Information incomplète**:
   - ✅ Affiche: `stock_real`, `min_stock`, `product_name`, `sku`
   - ❌ Manque: statut commande fournisseur (brouillon/validé)
   - ❌ Manque: quantité commandée pour cette alerte
   - ❌ Manque: date attendue de réception

2. **Stock réel qui ne se met pas à jour**:
   - Fetch initial au montage du hook
   - Refresh manuel toutes les 30 sec
   - Si mouvement = entré pendant les 30 sec, affichage décalé de 30 sec

3. **Données désynchronisées**:
   - `alert.stock_real` vs `alert.products.stock_real`
   - Hook lit depuis `products` table (ligne 131 de use-stock-alerts)
   - Mais la table `stock_alert_tracking` peut avoir données cached/old

---

## 5. HISTORIQUE DES MOUVEMENTS - Structure

### 📍 Code

Lignes 383-476 dans `/apps/back-office/src/app/stocks/page.tsx`

### 🏗️ Affichage (5 derniers mouvements)

```tsx
{lastMovements.slice(0, 5).map(movement => (
  <div>
    <ProductThumbnail src={movement.product_image_url} />
    {movement.movement_type === 'IN' ?
      <ArrowDownToLine (green) :
      <ArrowUpFromLine (red)
    }
    <p> movement.product_name
    <p> movement.product_sku
    <p> formatted date
    <Badge> "{movement.quantity_change}"
))}
```

### ✅ BON

- Affiche le type de mouvement avec icône (IN/OUT/ADJUST)
- Affiche la quantité changée
- Affiche la date du mouvement

### ❌ À AMÉLIORER

- Pas de notes/description du mouvement
- Pas de raison du mouvement (motif)
- Pas d'utilisateur qui a effectué le mouvement

---

## 6. SYNCHRONISATION & REFRESH

### 🔄 Flux Actuel

```
┌─ Page /stocks Monte
│  └─ useStockDashboard (hook) → fetchDashboardMetrics() [1 fois]
│     ├─ use-stock-ui cache → getStockItems()
│     ├─ stock_movements queries
│     └─ stock_alerts_view
│  └─ useStockAlerts (hook) → fetchAlerts() [1 fois au montage]
│  └─ useMovementsHistory → fetchMovements() [1 fois]
│
├─ Refresh Manuel
│  └─ Bouton "Actualiser" → refetch() toutes les données
│
├─ Auto-refresh (useEffect)
│  └─ Toutes les 30 secondes → fetchAlerts() ONLY
│     ⚠️ Dashboard KPIs NE rafraîchissent PAS
│
└─ Triggers Supabase
   └─ Aucun realtime subscription configuré
      ❌ Pas de live update quand stock change
```

### ⚠️ PROBLÈMES

1. **Dashboard KPIs ne rafraîchissent jamais automatiquement**
   - useStockDashboard: 0 refresh automatique
   - Seul le bouton "Actualiser" retrigger
   - Les utilisateurs voient données obsolètes

2. **Alertes rafraîchissent mais stock_real désync**
   - useStockAlerts: refresh toutes les 30 sec
   - Mais stock_real lu depuis cache product jointure
   - Si mouvement manuel juste effectué, stock pas à jour

3. **Aucune subscription Realtime Supabase**
   - Pas de `.on('*')` sur tables stock
   - Pas de WebSocket live updates
   - Utilisateurs ignorent changements jusqu'au refresh manuel

---

## 7. DONNÉES MANQUANTES POUR LES ALERTES

### Problème Utilisateur #1: "Statut commande + Quantité commandée"

**Situation**:

```
Alerte Stock (ex: Produit X):
  Stock Réel: 5
  Min Stock: 20

Question: "Pourquoi si bas? Avons-nous une commande fournisseur?"
Réponse Actuelle: ❌ NON affichée dans widget alertes
Réponse Attendue:
  - Statut: Brouillon (PO #123) Qty: 100 | Validé (PO #456) Qty: 50
```

**Données à Ajouter** (EXISTENT DÉJÀ dans StockAlert interface):

```typescript
interface StockAlert {
  // Actuel ✅
  stock_real: number;
  min_stock: number;
  product_name: string;

  // Manquant dans WIDGET ❌ (mais existent dans HOOK ✅)
  quantity_in_draft: number | null; // Qty en brouillon
  draft_order_id: string | null; // ID de la commande brouillon
  draft_order_number: string | null; // Numéro PO
  is_in_draft: boolean; // Flag si en brouillon

  validated: boolean; // Flag si validé
  validated_at: string | null; // Date validation

  related_orders?: {
    // Toutes commandes liées
    order_number: string;
    quantity: number;
  }[];
}
```

⚠️ **Note Critique**: Les données EXISTENT DÉJÀ dans le hook! Le problème est qu'elles ne sont PAS AFFICHÉES dans le widget page /stocks.

---

## 8. FICHIERS CRITIQUES À MODIFIER

### 🔴 HIGH PRIORITY

| Fichier                                                    | Ligne   | Problème                   | Solution                              |
| ---------------------------------------------------------- | ------- | -------------------------- | ------------------------------------- |
| `/packages/@verone/stock/src/hooks/use-stock-dashboard.ts` | 475-478 | Pas d'auto-refresh         | Ajouter interval refresh 60 sec       |
| `/apps/back-office/src/app/stocks/page.tsx`                | 299-381 | Widget alertes incomplet   | Afficher statut commande + quantité   |
| Idem                                                       | 282-478 | Design manque infos utiles | Ajouter fond blanc + infos détaillées |

### 🟡 MEDIUM PRIORITY

| Fichier                                                 | Ligne   | Problème          | Solution                      |
| ------------------------------------------------------- | ------- | ----------------- | ----------------------------- |
| `/apps/back-office/src/app/stocks/page.tsx`             | 383-476 | Historique simple | Ajouter raison + utilisateur  |
| `/packages/@verone/stock/src/hooks/use-stock-alerts.ts` | 48-160  | Pas de realtime   | Ajouter subscription Supabase |

### 🟢 NICE TO HAVE

| Fichier                                                           | Problème        | Solution                             |
| ----------------------------------------------------------------- | --------------- | ------------------------------------ |
| `/apps/back-office/src/components/ui-v2/stock/stock-kpi-card.tsx` | Pas d'animation | Ajouter skeleton loading             |
| Pages alertes/mouvements                                          | Intégration     | Mettre à jour avec nouvelles données |

---

## 9. AMÉLIORATIONS PROPOSÉES

### Phase 1: Auto-refresh Dashboard (15 min)

✅ Ajouter interval dans `useStockDashboard` (60 secondes)
✅ Vérifier si cache `use-stock-ui` se met à jour

### Phase 2: Widget Alertes Enrichi (30 min)

✅ Afficher `quantity_in_draft` + `draft_order_number`
✅ Afficher badge "En brouillon" vs "Validé"
✅ Lien vers la commande fournisseur
✅ Fond blanc + design sobre (déjà en place)

### Phase 3: Synchronisation Realtime (45 min)

✅ Ajouter `.on('*')` subscription sur `products` table
✅ Update local state quand stock change
✅ Retry automatique si connexion perte

### Phase 4: Historique Enrichi (20 min)

✅ Afficher raison du mouvement (`reason_code` → description)
✅ Afficher utilisateur qui a effectué (`performer_name`)
✅ Afficher notes/commentaires

---

## 10. RÉCAPITULATIF TROUVAILLES

### 🔴 BLOCAGES

1. **useStockDashboard** ne rafraîchit qu'une fois au montage
2. **Pas de Realtime Supabase** pour stock changes
3. **Widget alertes manque infos** clés (commandes fournisseurs)

### 🟡 DÉSYNCHRONISATIONS

1. Cache `use-stock-ui` peut être périmé
2. `stock_alert_tracking` vs `products` stock_real décalage
3. Délai 30 sec avant affichage mouvement manuel

### ✅ DÉJÀ PRÉSENT (mais non utilisé)

1. `quantity_in_draft`, `draft_order_id` dans StockAlert interface
2. `validated`, `validated_at` pour tracking commandes
3. `related_orders` pour afficher toutes les commandes liées

### 📊 DONNÉES SOURCE

- **Réelles**: `products.stock_real` (source vérité) + `stock_movements` (historique)
- **Prévisionnelles**: `purchase_orders` + `sales_orders` (commandes)
- **Alertes**: `stock_alert_tracking` (vue spécialisée)

---

## RÉFÉRENCES FICHIERS CLÉS

### 📁 Page Principale

- `/apps/back-office/src/app/stocks/page.tsx` (482 lignes)

### 📁 Hooks Stock

- `/packages/@verone/stock/src/hooks/use-stock-dashboard.ts` (486 lignes)
- `/packages/@verone/stock/src/hooks/use-stock-alerts.ts` (187 lignes)
- `/packages/@verone/stock/src/hooks/use-movements-history.ts` (712 lignes)
- `/packages/@verone/stock/src/hooks/use-stock-ui.ts` (cache + data management)

### 📁 Composants UI

- `/apps/back-office/src/components/ui-v2/stock/stock-kpi-card.tsx` (173 lignes)

### 📁 Pages Connexes

- `/apps/back-office/src/app/stocks/alertes/page.tsx` (à explorer)
- `/apps/back-office/src/app/stocks/mouvements/page.tsx` (à explorer)
- `/apps/back-office/src/app/stocks/inventaire/page.tsx` (à explorer)
