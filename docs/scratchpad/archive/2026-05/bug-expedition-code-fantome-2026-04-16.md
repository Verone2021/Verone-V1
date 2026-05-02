# Diagnostic Final — Bug Expedition Sans Details

**Date :** 16 avril 2026
**Statut :** ROOT CAUSE IDENTIFIEE

---

## Root Cause

**Fichier :** `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/components/RightColumn.tsx`
**Ligne :** 132-141

```tsx
{
  order.status === 'validated' && (
    <Button
      className="w-full gap-2"
      disabled={isUpdatingStatus}
      onClick={() => onStatusChange('shipped')}
    >
      <Truck className="h-4 w-4" />
      {isUpdatingStatus ? 'En cours...' : 'Marquer expédiée'}
    </Button>
  );
}
```

Ce bouton **"Marquer expediee"** change le statut directement a `shipped` via `handleStatusChange` → `updateSalesOrderStatus` Server Action, **SANS** :

- Creer d'enregistrement dans `sales_order_shipments`
- Mettre a jour `quantity_shipped` dans `sales_order_items`
- Decrementer le stock reel (`products.stock_real`)
- Demander le mode de livraison (pickup/manual/packlink)
- Demander le tracking number

## Chaine d'appel complete

```
RightColumn.tsx:137 — onClick={() => onStatusChange('shipped'))
  → details/page.tsx:244 — handleStatusChange(newStatus)
    → details/hooks.ts:91-116 — handleStatusChange()
      → updateSalesOrderStatus() Server Action
        → UPDATE sales_orders SET status = 'shipped'
        (AUCUN INSERT dans sales_order_shipments)
        (AUCUN trigger stock)
```

## Preuve DB

Commande SO-2026-00124 (Pokawa Limoges) :

- `sales_orders.status` = 'shipped' (AVANT devalidation)
- `sales_orders.shipped_at` = '2026-04-16 13:33:11'
- `sales_order_shipments` : **0 enregistrements**
- `sales_order_items.quantity_shipped` : **tout a 0** (12 items)

## Page concernee

`/canaux-vente/linkme/commandes/[id]/details` — page de detail d'une commande LinkMe dans le back-office.

Cette page a son propre bouton "Marquer expediee" dans le panneau lateral droit (RightColumn), distinct du bouton "Expedier" de la page /stocks/expeditions qui ouvre le ShipmentWizard.

## Le wizard fonctionne

Tests Playwright confirmes (dev ET production) :

- Page /stocks/expeditions → bouton "Expedier" → **wizard s'ouvre correctement**
- Meme pour la commande Pokawa Limoges → modal charge, 12 produits affiches, wizard multi-etapes operationnel
- 0 erreur JS, 0 erreur reseau

Le probleme n'est PAS le wizard. C'est le bouton raccourci sur la page detail LinkMe.

## Fix requis

**Option A (recommandee) :** Remplacer le bouton "Marquer expediee" par un bouton qui ouvre le `SalesOrderShipmentModal` (meme wizard que la page expeditions).

**Option B (rapide) :** Supprimer le bouton "Marquer expediee" de RightColumn.tsx et rediriger vers /stocks/expeditions.

**Fichiers a modifier :**

1. `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/components/RightColumn.tsx` (ligne 132-141)
2. Eventuellement `details/page.tsx` et `details/hooks.ts` pour ajouter le state du modal

---

FIN DU DIAGNOSTIC
