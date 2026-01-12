# Plan d'Implementation: Boutons de Creation de Mouvement de Stock

## Contexte

La page `/stocks/mouvements` existe et fonctionne correctement. Les modals de creation de mouvement de stock existent deja dans le package `@verone/stock`:

- `GeneralStockMovementModal` - Modal complete avec selection de produit
- `QuickStockMovementModal` - Modal rapide pour un produit pre-selectionne

**Objectif**: Ajouter des boutons dans l'interface pour permettre aux utilisateurs de creer des mouvements de stock manuels.

---

## Analyse des Fichiers Existants

### 1. Page Mouvements (`apps/back-office/src/app/stocks/mouvements/page.tsx`)

**Structure actuelle du header (lignes 200-242)**:

```tsx
<div className="bg-white border-b border-gray-200">
  <div className="w-full px-4 py-3">
    <div className="flex items-center justify-between">
      {/* Gauche: Bouton Retour + Titre */}
      <div className="flex items-center space-x-4">
        <ButtonV2 ... onClick={() => router.push('/stocks')}>
          <ArrowLeft /> Retour
        </ButtonV2>
        <h1>Mouvements de Stock</h1>
      </div>

      {/* Droite: Badge + Bouton Actualiser */}
      <div className="flex items-center gap-3">
        <Badge>Stock Reel</Badge>
        <ButtonV2 onClick={() => window.location.reload()}>
          <RefreshCw /> Actualiser
        </ButtonV2>
      </div>
    </div>
  </div>
</div>
```

**Hooks deja importes**:

- `useMovementsHistory` - Utilise pour afficher les mouvements (pas de creation)
- `useToggle` - Hook pour gerer les etats booleen des modals

### 2. GeneralStockMovementModal

**Props**:

```tsx
interface GeneralStockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback apres creation reussie
}
```

**Fonctionnement**:

- Utilise `useStock().createManualMovement()` pour la creation
- Le hook `createManualMovement` (ligne 276 de use-stock.ts) gere automatiquement `performed_by: user.id`
- Tracabilite garantie via `await supabase.auth.getUser()` dans le hook

### 3. QuickStockMovementModal

**Props**:

```tsx
interface QuickStockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId?: string; // Optionnel - pre-selection produit
  productName?: string; // Optionnel - affichage nom
  currentStock?: number; // Optionnel - affichage stock actuel
}
```

**Fonctionnement**:

- Utilise `useStockMovements().addStock/removeStock/adjustStock()`
- Le hook `createMovement` (ligne 353 de use-stock-movements.ts) gere `performed_by`
- Tracabilite garantie via `(await supabase.auth.getUser()).data.user?.id`

---

## Plan d'Implementation MINIMALISTE

### Modifications a apporter a `page.tsx`

#### 1. Ajouter les imports (ligne ~10-15)

```tsx
// Ajouter aux imports existants depuis @verone/stock
import {
  MovementsFilters,
  CancelMovementModal,
  MovementDetailsModal,
  MovementsStatsCards,
  MovementsTable,
  useMovementsHistory,
  GeneralStockMovementModal, // NOUVEAU
  QuickStockMovementModal, // NOUVEAU
} from '@verone/stock';

// Ajouter icone Plus
import {
  ArrowLeft,
  ArrowUpDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  ChevronDown,
  LayoutGrid,
  Table,
  Plus, // NOUVEAU
  Zap, // NOUVEAU - icone rapide
} from 'lucide-react';
```

#### 2. Ajouter les etats pour les modals (ligne ~82-84, apres les autres etats modals)

```tsx
// Etats existants pour les modals
const [showCancelModal, toggleShowCancelModal, setShowCancelModal] =
  useToggle(false);

// NOUVEAU: Etats pour les modals de creation
const [showGeneralModal, setShowGeneralModal] = useState(false);
const [showQuickModal, setShowQuickModal] = useState(false);
```

#### 3. Ajouter le handler de succes (ligne ~160, apres handleCancelSuccess)

```tsx
// Handler pour le succes de creation de mouvement
const handleMovementCreated = () => {
  // Rafraichir les donnees via le hook existant
  applyFilters({ ...filters, offset: 0 });
};
```

#### 4. Modifier le header - Ajouter les boutons (ligne ~218-239)

Remplacer la section droite du header par:

```tsx
<div className="flex items-center gap-3">
  {/* Badge info compact */}
  <Badge
    variant="outline"
    className="text-xs text-green-700 border-green-600 px-2 py-1"
  >
    Stock Reel
  </Badge>

  {/* NOUVEAU: Bouton Creation Rapide (secondaire) */}
  <ButtonV2
    variant="outline"
    size="sm"
    onClick={() => setShowQuickModal(true)}
    className="border-black text-black hover:bg-black hover:text-white"
  >
    <Zap className="h-4 w-4 mr-2" />
    Rapide
  </ButtonV2>

  {/* NOUVEAU: Bouton Nouveau Mouvement (principal) */}
  <ButtonV2
    variant="primary"
    size="sm"
    onClick={() => setShowGeneralModal(true)}
    className="bg-black text-white hover:bg-black/90"
  >
    <Plus className="h-4 w-4 mr-2" />
    Nouveau mouvement
  </ButtonV2>

  <ButtonV2
    variant="outline"
    size="sm"
    onClick={() => window.location.reload()}
    disabled={loading}
    className="border-black text-black hover:bg-black hover:text-white"
  >
    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
    Actualiser
  </ButtonV2>
</div>
```

#### 5. Ajouter les modals (ligne ~574, apres UniversalOrderDetailsModal)

```tsx
{
  /* Modal creation mouvement general */
}
<GeneralStockMovementModal
  isOpen={showGeneralModal}
  onClose={() => setShowGeneralModal(false)}
  onSuccess={handleMovementCreated}
/>;

{
  /* Modal creation mouvement rapide */
}
<QuickStockMovementModal
  isOpen={showQuickModal}
  onClose={() => setShowQuickModal(false)}
  onSuccess={handleMovementCreated}
/>;
```

---

## Verification de la Tracabilite `performed_by`

### GeneralStockMovementModal

- Utilise `useStock().createManualMovement()`
- Fichier: `packages/@verone/stock/src/hooks/use-stock.ts`
- Ligne 196-200: Recuperation utilisateur
- Ligne 276: `performed_by: user.id`
- **Tracabilite: GARANTIE**

### QuickStockMovementModal

- Utilise `useStockMovements().addStock/removeStock/adjustStock()`
- Ces fonctions appellent `createMovement()`
- Fichier: `packages/@verone/stock/src/hooks/use-stock-movements.ts`
- Ligne 353: `performed_by: (await supabase.auth.getUser()).data.user?.id`
- **Tracabilite: GARANTIE**

---

## Resume des Modifications

| Fichier    | Ligne    | Modification                                                         |
| ---------- | -------- | -------------------------------------------------------------------- |
| `page.tsx` | ~10      | Ajout imports `GeneralStockMovementModal`, `QuickStockMovementModal` |
| `page.tsx` | ~44      | Ajout imports icones `Plus`, `Zap`                                   |
| `page.tsx` | ~84      | Ajout etats `showGeneralModal`, `showQuickModal`                     |
| `page.tsx` | ~163     | Ajout handler `handleMovementCreated`                                |
| `page.tsx` | ~218-239 | Ajout 2 boutons dans le header                                       |
| `page.tsx` | ~575     | Ajout 2 modals en fin de composant                                   |

---

## UX Proposee

1. **Bouton principal "Nouveau mouvement"** (noir, icone +)
   - Position: Header droite, avant "Actualiser"
   - Ouvre `GeneralStockMovementModal` avec selection produit complete

2. **Bouton secondaire "Rapide"** (outline, icone Zap)
   - Position: Header droite, avant le bouton principal
   - Ouvre `QuickStockMovementModal` (formulaire simplifie)
   - Note: Sans productId pre-rempli, l'utilisateur devra le saisir

---

## Fichiers Critiques pour Implementation

1. **`apps/back-office/src/app/stocks/mouvements/page.tsx`** - Fichier principal a modifier
2. **`packages/@verone/stock/src/components/modals/GeneralStockMovementModal.tsx`** - Modal complete (reference)
3. **`packages/@verone/stock/src/components/modals/QuickStockMovementModal.tsx`** - Modal rapide (reference)
4. **`packages/@verone/stock/src/hooks/use-stock.ts`** - Hook avec `createManualMovement` (tracabilite)
5. **`packages/@verone/stock/src/hooks/use-stock-movements.ts`** - Hook avec `createMovement` (tracabilite)

---

## Estimation

- **Complexite**: Faible (ajout de boutons + instanciation modals existantes)
- **Lignes de code a ajouter**: ~40 lignes
- **Risque de regression**: Minimal (aucune modification de logique existante)
- **Tests recommandes**:
  - Ouvrir modal generale, creer mouvement, verifier rafraichissement
  - Ouvrir modal rapide, creer mouvement, verifier rafraichissement
  - Verifier que `performed_by` est bien rempli dans la base de donnees
