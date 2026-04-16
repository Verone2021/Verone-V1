# Plan BO-SHIP-001 — Ajustement stock depuis modal expédition

Date : 2026-04-17
Branche cible : `feat/BO-SHIP-001-stock-adjust-from-shipment`
Base : `staging`

## Besoin

Dans le wizard d'expédition commande client (`SalesOrderShipmentModal` → `StepStock`),
permettre à l'utilisateur :

1. De cliquer sur le nom/thumbnail produit → ouvre `/produits/catalogue/[productId]` dans un **nouvel onglet** (wizard reste ouvert).
2. De cliquer sur une icône Settings à côté du stock → ouvre `InventoryAdjustmentModal` (composant existant `@verone/stock`) pour créer entrée/sortie/correction sans quitter le wizard.
3. Après ajustement réussi → refetch du wizard pour voir le nouveau stock dispo.

Bouton ajustement visible sur **toutes les lignes** (même si stock suffisant).

## Principes

- **Zéro duplication** : réutiliser `InventoryAdjustmentModal` de `@verone/stock` (même composant que `/stocks/inventaire`)
- **Zéro `any`**, zéro `eslint-disable`
- **Pas de modif DB**, pas de nouvelle route API
- **Pas de modification** du composant `InventoryAdjustmentModal` lui-même (il est déjà valide en prod)

## Fichiers à modifier

### 1. `packages/@verone/orders/src/components/forms/ShipmentWizard/StepStock.tsx`

- Ajouter état local pour contrôler l'ajustement modal (ou lever via props — voir §4)
- Cellule "Produit" (lignes 229-258) : wrapper le nom et la thumbnail dans `<Link href="/produits/catalogue/{product_id}" target="_blank" rel="noopener noreferrer">`
- Cellule "Stock" (lignes 273-283) : ajouter un `IconButton` (icon Settings) à côté du nombre, ouvrant l'ajustement pour l'item courant
- Importer `Link` de `next/link`, `Settings` de `lucide-react` (déjà présent indirectement)

**Décision d'architecture** : gérer l'état `adjustmentProduct` dans le parent `ShipmentWizard/index.tsx` (pas dans `StepStock` — le modal doit survivre même si l'utilisateur passe à l'étape suivante). Passer un callback `onOpenAdjustment(item)` à `StepStock`.

### 2. `packages/@verone/orders/src/components/forms/ShipmentWizard/index.tsx`

- Ajouter état `adjustmentProduct: { id, name, sku, stock_quantity } | null`
- Rendre `<InventoryAdjustmentModal>` à la racine du wizard
- Callback `onSuccess` du modal : appeler `refetchShipmentData()` (ou équivalent qui recharge `loadSalesOrderForShipment`)
- Passer `onOpenAdjustment` à `StepStock`

### 3. `packages/@verone/orders/src/components/modals/SalesOrderShipmentModal.tsx`

- Modifier le `useEffect` en extrayant `loadSalesOrderForShipment` dans une fonction réutilisable
- Exposer cette fonction au `ShipmentWizard` (via prop `onRefetch`) pour qu'il puisse recharger après ajustement

OU alternative plus simple :

- Ajouter un état `refreshKey` dans `SalesOrderShipmentModal` incrémenté au succès ajustement
- Le `useEffect` dépend de `refreshKey` pour recharger

**Choix** : alternative `refreshKey` — moins intrusive, pas de modif de signature publique.

## Composant réutilisé

### `InventoryAdjustmentModal` (@verone/stock)

Props requises (depuis `inventory-adjustment.types.ts:34-44`) :

```ts
{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: {
    id: string;
    name: string;
    sku: string;
    stock_quantity: number;
  } | null;
}
```

Mapping depuis `ShipmentItem` (types/reception-shipment.ts:175+) :

- `id` ← `item.product_id`
- `name` ← `item.product_name`
- `sku` ← `item.product_sku`
- `stock_quantity` ← `item.stock_available`

## Gestion refetch après ajustement

Le hook `useInventoryAdjustment` (interne à `InventoryAdjustmentModal`) fait déjà l'INSERT `stock_movements`. Les triggers DB (protégés) mettent à jour le stock réel automatiquement.

Côté UI wizard, il faut :

1. Appeler `loadSalesOrderForShipment(orderId)` à nouveau → refresh `enrichedOrder.items[*].stock_available`
2. Invalider les queries stock si React Query est utilisé ailleurs (inventaire déjà auto-invalidé par le modal lui-même dans son hook)

**Vérification nécessaire avant implémentation** : lire `useInventoryAdjustment` pour confirmer qu'il invalide bien les queries, sinon ajouter un `queryClient.invalidateQueries({ queryKey: ['shipment', orderId] })` dans le callback `onSuccess`.

## Étapes d'implémentation

1. `git checkout staging && git pull`
2. `git checkout -b feat/BO-SHIP-001-stock-adjust-from-shipment`
3. Lire `useInventoryAdjustment` + `ShipmentWizard/index.tsx` (triple lecture)
4. Modifier `StepStock.tsx` (Link + bouton ajustement)
5. Modifier `ShipmentWizard/index.tsx` (state + modal + callback)
6. Modifier `SalesOrderShipmentModal.tsx` (refreshKey pour refetch)
7. `pnpm --filter @verone/orders type-check`
8. `pnpm --filter @verone/back-office type-check`
9. `git diff` → review manuel par Romeo
10. Si OK : commit + push + PR vers staging

## Estimation temps

- Triple lecture (3 fichiers) : 10 min
- Implémentation `StepStock.tsx` : 15 min
- Implémentation `ShipmentWizard/index.tsx` : 15 min
- Implémentation `SalesOrderShipmentModal.tsx` (refreshKey) : 10 min
- Type-check + corrections : 10 min
- Total : **~60 min**

## Tests manuels post-implémentation

1. Ouvrir `/commandes/clients`
2. Sélectionner une commande validée → cliquer "Expédier"
3. Vérifier que le nom + thumbnail sont cliquables → nouvel onglet vers fiche produit
4. Cliquer icône Settings à côté du stock → modal ajustement ouvert
5. Faire une "Trouvaille inventaire" +1 → Valider
6. Modal ajustement se ferme → stock wizard mis à jour (+1)
7. Terminer l'expédition → pas de régression

## Risques

- **Refetch lourd** : `loadSalesOrderForShipment` refetch toute la commande. Acceptable car action manuelle peu fréquente.
- **Regression @verone/orders** : ce package est importé partout. Type-check filtré obligatoire avant commit.
- **Propagation d'état** : le modal d'ajustement par-dessus le modal d'expédition = modals empilés. Dialog de shadcn gère bien ça mais il faut vérifier visuellement.

## Décisions validées avec Romeo

1. Nouvel onglet fiche produit : OUI
2. Bouton ajustement sur toutes les lignes : OUI
3. Task ID : BO-SHIP-001 (vérifié, non utilisé)
