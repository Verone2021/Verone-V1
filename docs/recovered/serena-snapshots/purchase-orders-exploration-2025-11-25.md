# Exploration: Code Structure - Purchase Orders (Commandes Fournisseurs)

## Date: 2025-11-25 | Thoroughness Level: DÉTAILLÉE (L2)

---

## SYNTHÈSE EXÉCUTIVE

Exploration complète de l'architecture des commandes fournisseurs (purchase orders) dans le système.
Découverte de structures existantes pour afficher les items, statuts, et système de badges.

**Fichiers critiques trouvés: 13 fichiers clés**
**État actuel: Système FONCTIONNEL avec possibilités d'améliorations UI**

---

## 1. STRUCTURE DE PRÉSENTATION ACTUELLE

### A. PAGE PRINCIPALE: Purchase Orders List

**Fichier:** `apps/back-office/src/app/commandes/fournisseurs/page.tsx`

**Format d'affichage:** TABLE (Data Table)

Structure:

- Header (Titre + Bouton création)
- KPI Cards (5 cards: total, CA, en cours, reçues, annulées)
- Card Filtres (Tabs + Select)
- Card Liste Commandes (TABLE)
  - Colonnes: N° Commande, Fournisseur, Statut (Badge), Date création, Date livraison, Montant TTC, Actions

**Caractéristiques:**

- Affichage: 1 LIGNE = 1 COMMANDE (résumé)
- Nombre d'unités: NON AFFICHÉ au niveau de la liste
- Badges statut: OUI (6 variantes)
- Système d'expansion: NON (modales existent)

### B. MODAL DÉTAIL: Purchase Order Detail

**Fichier:** `packages/@verone/orders/src/components/modals/PurchaseOrderDetailModal.tsx`

**Format:** LAYOUT 2 COLONNES (70% produits, 30% sidebar)

Colonne Principale (70%):

- Card Produits avec table détails
  - Image, Nom, SKU, Badge remise, Quantité, Prix HT, Total HT, Réception
- Totaux (HT, Éco-taxe, TVA, TTC)

Sidebar (30%):

- Card Fournisseur (condensée)
- Card Paiement (conditions)
- Card Réception (statut + bouton)
- Card Notes (si existe)
- Card Actions (Export, PDF - disabled)

---

## 2. SYSTÈME DE STATUTS ACTUEL

6 statuts possibles:

- `draft` → Brouillon
- `validated` → Validée
- `partially_received` → Partiellement reçue
- `received` → Reçue
- `cancelled` → Annulée

Couleurs badges (Tailwind):

- draft: bg-gray-100 text-gray-800
- validated: bg-green-100 text-green-800
- partially_received: bg-gray-100 text-gray-900
- received: bg-green-100 text-green-800
- cancelled: bg-red-100 text-red-800

**Workflow actions par statut:**

- DRAFT: Edit, Validate, Cancel
- VALIDATED: Receive, Unvalidate, Cancel
- PARTIALLY_RECEIVED: Receive, Cancel
- RECEIVED: (Aucune)
- CANCELLED: Delete

---

## 3. DONNÉES EN BASE - STRUCTURE ITEMS

**Table:** `purchase_order_items`

Colonnes clés:

```
id, purchase_order_id, product_id, quantity, unit_price_ht,
discount_percentage, total_ht, eco_tax, quantity_received,
expected_delivery_date, notes, created_at, updated_at,

// NOUVEAUX (Phase 2 - Échantillons)
sample_type ('internal' | 'customer' | NULL),
customer_organisation_id, customer_individual_id
```

Relations jointes:

- products (id, name, sku, stock_quantity, stock_real, product_images)
- customer_organisation (si sample_type = 'customer')
- customer_individual (si sample_type = 'customer')

---

## 4. SYSTÈME DE BADGES - DÉTAILS

**Badge Component** (`@verone/ui/components/ui/badge.tsx`):

- Variants: default, secondary, success, warning, danger, info, outline, destructive, customer, supplier, partner
- Props: variant, size (sm/md/lg), dot, dotColor, icon, onRemove
- Flexible et réutilisable

**Badges actuellement utilisés:**

1. Status badges (table list) - 6 variantes de couleurs
2. Discount badges (modal) - Vert, "-X%"
3. Reception badges (modal) - Bleu, "n/m"
4. Payment terms badges (sidebar) - Vert
5. Receipt status badges (sidebar) - Vert ou orange

---

## 5. NOMBRE D'UNITÉS / RÉFÉRENCES

**Dans la liste:** NON AFFICHÉ

**Dans le modal détail:**

- Compteur dans header: "Produits (5 articles)"
- Quantité par item: Affichée dans colonne "Qté"
- Somme quantités: Calculable mais NON AFFICHÉE

**Possibilités pour amélioration:**

- Option A: Ajouter colonne "Articles" en liste
- Option B: Ajouter info dans montant "1860€ (5 items)"
- Option C: Card KPI spéciale avant la table

---

## 6. SYSTÈME D'EXPANSION / COLLAPSIBLE

**État actuel:** AUCUN système d'expansion inline

**Alternatives actuelles:**

- Modales (clic Eye → PurchaseOrderDetailModal)
- Accordions utilisés seulement dans PickupPointSelector (shipments)

**Si expansion requise:**

- Option A: Collapsible Row (shadcn/ui Collapsible)
- Option B: Inline Details (show/hide items)
- Option C: Hybrid (Eye pour modal + Chevron pour preview)

---

## 7. INFOS ÉCHANTILLON (Phase 2)

**Données disponibles en DB:**

```
purchase_order_items.sample_type = 'internal' | 'customer' | NULL
purchase_order_items.customer_organisation_id
purchase_order_items.customer_individual_id

Relations jointes:
- customer_organisation:organisations (id, legal_name, trade_name)
- customer_individual:individual_customers (id, first_name, last_name)
```

**Hook disponible:**
`useUnifiedSampleEligibility()` - Vérifie si produit éligible échantillon

**UI:** Badge "Échantillon" NON AFFICHÉE actuellement

---

## 8. FICHIERS CRITIQUES (13 fichiers)

**Core Files:**

1. `apps/back-office/src/app/commandes/fournisseurs/page.tsx` (937 lignes)
2. `apps/back-office/src/app/actions/purchase-orders.ts`
3. `packages/@verone/orders/src/components/modals/PurchaseOrderDetailModal.tsx` (479 lignes)
4. `packages/@verone/orders/src/components/modals/PurchaseOrderFormModal.tsx`
5. `packages/@verone/orders/src/components/modals/PurchaseOrderReceptionModal.tsx`
6. `packages/@verone/orders/src/hooks/use-purchase-orders.ts` (831 lignes)
7. `packages/@verone/orders/src/hooks/use-draft-purchase-order.ts`
8. `packages/@verone/orders/src/hooks/use-order-items.ts`
9. `packages/@verone/orders/src/hooks/use-unified-sample-eligibility.ts`
10. `packages/@verone/orders/src/components/tables/OrderItemsTable.tsx`
11. `packages/@verone/ui/src/components/ui/badge.tsx` (130 lignes)
12. `packages/@verone/types/src/supabase.ts` (Types auto-générés)
13. `packages/@verone/orders/src/index.ts` (Exports)

---

## 9. RECOMMANDATIONS ARCHITECTURE

### Pour ajouter Badge "Échantillon"

**Données:** ✅ Présentes en DB + hook + fetchées

**UI - Option recommandée (Hybride):**

```
Liste (page.tsx):
- Colonne "Type" après "Statut"
- Badge "Échantillon" si sample_type != null

Modal détail:
- Badge après nom produit (comme remise)
- "Échantillon Client: FournBlanc" ou "Échantillon interne"
```

**Fichiers à modifier:**

1. `apps/back-office/src/app/commandes/fournisseurs/page.tsx` - Ajouter colonne table
2. `packages/@verone/orders/src/components/modals/PurchaseOrderDetailModal.tsx` - Ajouter badge

**Composant optionnel:**
Créer `@verone/orders/components/SampleTypeBadge.tsx` (réutilisable)

---

## 10. POINTS CLÉS POUR IMPLÉMENTATION

### Système ACTUELLEMENT COMPLET ✅

- Page liste avec 6 filtres avancés
- Modal détail 2-colonnes
- Table items avec images, montants, éco-taxe
- Workflow statuts (6 statuts + actions)
- Badges statut (6 variantes)
- Réception partielle/complète
- Tri 3 colonnes
- KPI dynamiques (filtrage réactif)

### Système DISPONIBLE MAIS NON AFFICHÉ ⚠️

- Données: `sample_type` + `customer_organisation/individual`
- Hook: `useUnifiedSampleEligibility()`
- UI: Badge "Échantillon" NON AFFICHÉE

### Système PARTIELLEMENT AFFICHÉ ⚠️

- Nombre d'unités: Seulement en modal
- Somme quantités: NON AFFICHÉ nulle part
- Nombre de références: Seulement en modal

### Système ABSENT ❌

- Expansion inline (voir modal seulement)

---

## 11. IMPORTS CRITIQUES

```typescript
// UI
import {
  Badge,
  Table,
  Card,
  Dialog,
  Button,
  Input,
  Select,
  Tabs,
} from '@verone/ui';

// Icons
import {
  Eye,
  Edit,
  Trash2,
  Ban,
  Package,
  Truck,
  CheckCircle,
  Search,
  ArrowUpDown,
} from 'lucide-react';

// Business
import { usePurchaseOrders, useOrganisations } from '@verone/orders';
import { useStockMovements } from '@verone/stock';

// Utils
import { formatCurrency, formatDate, createClient } from '@verone/utils';

// Server Actions
import { updatePurchaseOrderStatus } from '@/app/actions/purchase-orders';
```

---

## 12. ORDRE DE LECTURE RECOMMANDÉ

1. `apps/back-office/src/app/commandes/fournisseurs/page.tsx` - Page principale
2. `packages/@verone/orders/src/hooks/use-purchase-orders.ts` - Hook principal
3. `packages/@verone/orders/src/components/modals/PurchaseOrderDetailModal.tsx` - Modal détail
4. `packages/@verone/ui/src/components/ui/badge.tsx` - Badge component
5. `packages/@verone/types/src/supabase.ts` - Structure DB (si besoin)
