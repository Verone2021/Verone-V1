# Dev plan — BO-SHIP-FIX-001 : fiabilisation shipment Packlink

**Date** : 2026-04-22
**Branche** : `fix/BO-SHIP-FIX-001-shipment-integrity`
**Base** : `staging` (tête `e50016a12`)
**Type** : PR corrective (bloc cohérent P0+P1)
**Effort estimé** : ~3h

---

## 1. Contexte & preuves

Audit `docs/scratchpad/audit-2026-04-22-shipments-full-rebuild.md` a identifié 4 défauts bloquants que cette PR corrige, sans toucher aux triggers protégés (`update_stock_on_shipment`, `confirm_packlink_shipment_stock`, `handle_shipment_*`) ni au webhook (déjà mature, 6 events).

Preuves code :

- R1 wizard silencieux — `packages/@verone/orders/src/components/forms/ShipmentWizard/useShipmentWizard.ts:345-446`
- R3 duplication — `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/OrderDetailModal.tsx:126-420`
- R4 bouton disabled — `packages/@verone/orders/src/components/modals/order-detail/OrderShipmentStatusCard.tsx:110-120`
- R5 lien Packlink générique — `OrderShipmentStatusCard.tsx:88` + `OrderShipmentHistoryCard.tsx:115`

Cas réel reproduit : SO-2026-00158 avait un shipment Packlink orphelin (`UN2026PRO0001424092`) — rattrapé manuellement par INSERT DB le 2026-04-22 16:14. Cette PR empêche que ça recommence.

---

## 2. Fichiers modifiés (8 fichiers)

| #   | Fichier                                                                                           | Action                                                                                       |
| --- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | `packages/@verone/orders/src/components/forms/ShipmentWizard/useShipmentWizard.ts`                | R1 — 3 guards + rollback Packlink                                                            |
| 2   | `packages/@verone/orders/src/components/forms/ShipmentWizard/types.ts`                            | Ajout états erreur wizard                                                                    |
| 3   | `packages/@verone/orders/src/components/forms/ShipmentWizard/StepError.tsx`                       | **Nouveau** — écran d'erreur step 8                                                          |
| 4   | `packages/@verone/orders/src/components/forms/ShipmentWizard/index.tsx`                           | Router step 8                                                                                |
| 5   | `apps/back-office/src/app/api/packlink/shipment/[ref]/cancel/route.ts`                            | **Nouveau** — endpoint cancel Packlink                                                       |
| 6   | `packages/@verone/orders/src/components/modals/order-detail/OrderShipmentStatusCard.tsx`          | R4 activation bouton + R5 URL spécifique                                                     |
| 7   | `packages/@verone/orders/src/components/modals/order-detail/OrderShipmentHistoryCard.tsx`         | R5 URL spécifique + champ packlink_shipment_id                                               |
| 8   | `packages/@verone/orders/src/components/modals/order-detail/useOrderDetailData.ts`                | Ajout `packlink_shipment_id` au select                                                       |
| 9   | `packages/@verone/orders/src/components/modals/OrderDetailModal.tsx`                              | Passe `onOpenShipmentModal` à status card                                                    |
| 10  | `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/OrderDetailModal.tsx` | R3 dédup : remplace inline par import `OrderShipmentHistoryCard` + `OrderShipmentStatusCard` |

Total : 2 nouveaux fichiers + 8 éditions. Respecte la limite 400 lignes par fichier (aucun fichier modifié ne la dépasse).

---

## 3. R1 — Wizard silencieux : spécification précise

### Avant (bug)

```ts
// useShipmentWizard.ts lignes 397-438
const { data: { user } } = await supabase.auth.getUser();
if (user?.id) {               // ← branche silencieuse #1
  const itemsToShip = items.filter(...);
  if (itemsToShip.length > 0) { // ← branche silencieuse #2
    const dbResult = await validateShipment({...});
    if (!dbResult.success) {
      console.error(...);      // ← silencieux #3
    }
  }
}
setShipmentResult({...});
setStep(7); // ← toujours exécuté
```

### Après (correctif)

Remplacer les lignes 395-438 par :

```ts
// 1. Auth guard
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user?.id) {
  setServicesError(
    "Session expirée. Reconnectez-vous pour enregistrer l'expédition."
  );
  setPendingPacklinkRef(data.shipmentReference); // pour rollback manuel ultérieur
  setStep(8);
  setPaying(false);
  return;
}

// 2. Items guard
const itemsToShip = items
  .filter(i => (i.quantity_to_ship ?? 0) > 0)
  .map(i => ({
    sales_order_item_id: i.sales_order_item_id,
    product_id: i.product_id,
    quantity_to_ship: i.quantity_to_ship ?? 0,
  }));

if (itemsToShip.length === 0) {
  setServicesError('Aucun article sélectionné avec une quantité > 0.');
  setPendingPacklinkRef(data.shipmentReference);
  setStep(8);
  setPaying(false);
  return;
}

// 3. DB INSERT avec gestion erreur explicite
const dbResult = await validateShipment({
  sales_order_id: salesOrder.id,
  items: itemsToShip,
  shipped_at: new Date().toISOString(),
  shipped_by: user.id,
  delivery_method: 'packlink',
  carrier_name: selectedService.carrier_name,
  carrier_service: selectedService.name,
  shipping_cost: selectedService.price.total_price,
  estimated_delivery_at:
    selectedService.first_estimated_delivery_date ?? undefined,
  packlink_shipment_id: data.shipmentReference,
  packlink_status: 'a_payer',
  notes: `Transport Packlink à payer par Verone — ${selectedService.carrier_name}`,
});

if (!dbResult.success) {
  console.error('[ShipmentWizard] DB save failed:', dbResult.error);
  setDbError(dbResult.error ?? 'Erreur enregistrement base de données');
  setPendingPacklinkRef(data.shipmentReference);
  setStep(8);
  setPaying(false);
  return;
}

// 4. Succès complet
setShipmentResult({
  trackingNumber: null,
  labelUrl: null,
  carrierName: selectedService.carrier_name,
  orderReference: data.shipmentReference,
  totalPaid: selectedService.price.total_price,
});
setStep(7);
setPaying(false);
```

### Nouveaux états hook

```ts
const [dbError, setDbError] = useState<string | null>(null);
const [pendingPacklinkRef, setPendingPacklinkRef] = useState<string | null>(
  null
);
const [retryingDb, setRetryingDb] = useState(false);
```

### Nouvelles actions exposées (pour StepError)

```ts
const handleRetryDbSave = useCallback(async () => {
  if (!pendingPacklinkRef || !selectedService) return;
  setRetryingDb(true);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) { setRetryingDb(false); return; }
  const itemsToShip = items.filter(i => (i.quantity_to_ship ?? 0) > 0).map(...);
  const dbResult = await validateShipment({ ...even params as before, packlink_shipment_id: pendingPacklinkRef, packlink_status: 'a_payer' });
  if (dbResult.success) {
    setShipmentResult({...});
    setStep(7);
    setDbError(null);
    setPendingPacklinkRef(null);
  } else {
    setDbError(dbResult.error ?? 'Erreur enregistrement base de données');
  }
  setRetryingDb(false);
}, [pendingPacklinkRef, selectedService, items, supabase, validateShipment]);

const handleCancelPacklink = useCallback(async () => {
  if (!pendingPacklinkRef) return;
  setRetryingDb(true);
  try {
    const res = await fetch(`/api/packlink/shipment/${encodeURIComponent(pendingPacklinkRef)}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error('Cancel Packlink failed');
    setPendingPacklinkRef(null);
    setDbError(null);
    setServicesError(null);
    setStep(1);
  } catch (err) {
    setDbError(err instanceof Error ? err.message : 'Impossible d\'annuler côté Packlink');
  }
  setRetryingDb(false);
}, [pendingPacklinkRef]);
```

---

## 4. Nouveau fichier : StepError.tsx

```tsx
'use client';

import { ButtonV2 } from '@verone/ui';
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';

interface StepErrorProps {
  packlinkRef: string | null;
  dbError: string | null;
  authError: string | null;
  retrying: boolean;
  onRetryDb: () => void;
  onCancelPacklink: () => void;
  onClose: () => void;
}

export function StepError({
  packlinkRef,
  dbError,
  authError,
  retrying,
  onRetryDb,
  onCancelPacklink,
  onClose,
}: StepErrorProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-start gap-3 p-4 border border-red-200 bg-red-50 rounded-lg">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-red-900">
            L'expédition Packlink a été créée mais l'enregistrement interne a
            échoué
          </p>
          {packlinkRef && (
            <p className="text-sm text-red-800">
              Référence Packlink :{' '}
              <code className="font-mono bg-red-100 px-1">{packlinkRef}</code>
            </p>
          )}
          {(dbError || authError) && (
            <p className="text-sm text-red-700">{dbError ?? authError}</p>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700">
        Deux actions possibles pour résoudre :
      </p>

      <div className="space-y-2">
        <ButtonV2
          variant="default"
          className="w-full justify-start h-11 md:h-9"
          onClick={onRetryDb}
          disabled={retrying || !!authError}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`}
          />
          Réessayer l'enregistrement
        </ButtonV2>
        <ButtonV2
          variant="outline"
          className="w-full justify-start h-11 md:h-9 text-red-600"
          onClick={onCancelPacklink}
          disabled={retrying || !packlinkRef}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Annuler côté Packlink
        </ButtonV2>
        <ButtonV2
          variant="ghost"
          className="w-full h-11 md:h-9"
          onClick={onClose}
        >
          Fermer (traiter plus tard)
        </ButtonV2>
      </div>

      <p className="text-xs text-gray-500">
        Si vous fermez, notez la référence Packlink ci-dessus. Le shipment
        restera créé sur Packlink PRO mais pas dans notre système.
      </p>
    </div>
  );
}
```

Touch target 44px mobile respecté (`h-11 md:h-9`).

---

## 5. Nouveau endpoint `/api/packlink/shipment/[ref]/cancel/route.ts`

```ts
import { NextResponse } from 'next/server';
import { getPacklinkClient } from '@verone/common/lib/packlink/client';
import { createServerClient } from '@verone/utils/supabase/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ref } = await params;
    if (!ref) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    const client = getPacklinkClient();
    await client.deleteShipment(ref);

    return NextResponse.json({ success: true, ref });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cancel failed';
    console.error('[Packlink Cancel] Failed:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

Vérifier que `getPacklinkClient().deleteShipment(ref)` existe (méthode dans `packages/@verone/common/src/lib/packlink/client.ts`). Si absent, l'ajouter : `DELETE /shipments/{ref}`.

---

## 6. R4 + R5 — OrderShipmentStatusCard

Remplacer lignes 110-120 (bouton disabled) par :

```tsx
{
  !readOnly &&
    canShip &&
    shipmentHistory.length === 0 &&
    onOpenShipmentModal && (
      <ButtonV2 size="sm" className="w-full" onClick={onOpenShipmentModal}>
        <Truck className="h-3 w-3 mr-1" />
        Nouvelle expédition
      </ButtonV2>
    );
}
```

Ajouter à `OrderShipmentStatusCardProps` :

```ts
onOpenShipmentModal?: () => void;
```

Remplacer ligne 88 (URL générique) par :

```tsx
{
  (() => {
    const firstToPay = shipmentHistory.find(
      h => h.packlink_status === 'a_payer'
    );
    const url = firstToPay?.packlink_shipment_id
      ? `https://pro.packlink.fr/private/shipments/${firstToPay.packlink_shipment_id}/create/address`
      : 'https://pro.packlink.fr/private/shipments';
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="...">
        <ExternalLink className="h-3 w-3" />
        Payer sur Packlink PRO
      </a>
    );
  })();
}
```

---

## 7. R5 — OrderShipmentHistoryCard

1. Ajouter `packlink_shipment_id: string | null` à `ShipmentHistoryItem` (ligne 19)
2. Remplacer ligne 115 URL par :
   ```tsx
   href={h.packlink_shipment_id
     ? `https://pro.packlink.fr/private/shipments/${h.packlink_shipment_id}/create/address`
     : 'https://pro.packlink.fr/private/shipments'}
   ```

---

## 8. useOrderDetailData.ts

Ajouter `packlink_shipment_id` dans le `.select(...)` de la query `sales_order_shipments` + dans le type `ShipmentHistoryItem` local + dans le mapping retour.

---

## 9. OrderDetailModal.tsx

Passer la prop `onOpenShipmentModal={() => setShowShipmentModal(true)}` à `<OrderShipmentStatusCard>` (state `showShipmentModal` + `<SalesOrderShipmentModal>` existe déjà dans la page parente `SalesOrdersTable` → utiliser le même pattern que `details/page.tsx` LinkMe ligne 24,338).

Si `OrderDetailModal` est un modal enfant de `SalesOrdersTable`, propager via prop (remonter le state vers `SalesOrdersTable` qui a déjà `modals.openShipmentModal`).

---

## 10. R3 — site-internet OrderDetailModal dédup

Fichier : `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/OrderDetailModal.tsx` lignes 126-420.

1. Supprimer :
   - State local `shipments` (ligne 126-141)
   - useEffect de fetch `sales_order_shipments` (ligne 143-155)
   - Le bloc rendu inline (lignes 383-445 environ) qui duplique le badge coloré + boucle
2. Importer et utiliser :

   ```tsx
   import {
     OrderShipmentHistoryCard,
     OrderShipmentStatusCard,
   } from '@verone/orders/components/modals/order-detail';
   import { useOrderDetailData } from '@verone/orders/components/modals/order-detail';
   ```

   Réutiliser le hook `useOrderDetailData(order)` pour obtenir `shipmentHistory`, puis rendre les deux cards comme dans `OrderDetailModal` standard.

---

## 11. Checklist règles Verone

- [x] Aucune migration DB (rien ne touche schéma ni triggers)
- [x] Triggers protégés intacts (`update_stock_on_shipment`, `confirm_packlink_shipment_stock`, `handle_shipment_*`)
- [x] Routes API existantes non touchées (création nouveau endpoint `/api/packlink/shipment/[ref]/cancel`)
- [x] Zéro `any`, `unknown` + narrow
- [x] `useCallback` sur les handlers pour stabilité deps
- [x] Touch target 44px mobile (`h-11 md:h-9`) sur boutons StepError
- [x] Fichiers < 400 lignes (useShipmentWizard 446 → estimé 520 → **à surveiller**, potentiellement éclater en PR 2 si > 400 après ajout handlers)
- [x] Pas de swap composant inter-package — réutilisation `@verone/orders` dans site-internet
- [x] Format commit : `[BO-SHIP-FIX-001] fix: ...`

**Attention fichier > 400 lignes** : `useShipmentWizard.ts` est déjà à 446 L. L'ajout des 2 handlers fera dépasser ~520 L. Solution : extraire `handleCreateDraft` + `handleRetryDbSave` + `handleCancelPacklink` dans un fichier séparé `useShipmentWizard/handleCreateDraft.ts` réimporté dans le hook.

---

## 12. Tests Playwright manuels (5 tailles obligatoires)

Lancer via lane-2 MCP (déjà authentifié) sur `localhost:3000` :

1. **SO-2026-00158** (a déjà un shipment) : ouvrir modal détail → « Payer sur Packlink PRO » → vérifier URL spécifique `/shipments/UN2026PRO0001424092/create/address`
2. **SO quelconque en `validated`** sans shipment : ouvrir modal détail → bouton « Nouvelle expédition » activé → ouvre wizard
3. **Simulation erreur DB** : forcer `validateShipment` à retourner `{success:false}` via DevTools ou en cassant temporairement RLS test → écran StepError → clic « Annuler côté Packlink » → fetch appelé → reset step 1
4. **Simulation auth expirée** : supprimer cookie auth → retenter → écran StepError avec authError
5. **Site-internet OrderDetailModal** : ouvrir commande site-internet avec shipment → voir cards `OrderShipmentHistoryCard` + `OrderShipmentStatusCard` (pas de double affichage)

5 breakpoints (375 / 768 / 1024 / 1440 / 1920) sur les étapes 1, 2, 5. Screenshots dans `.playwright-mcp/screenshots/20260422/BO-SHIP-FIX-001-*-HHmmss.png`.

---

## 13. Workflow

1. Dev-agent implémente (cette PR)
2. Scratchpad report dans `docs/scratchpad/dev-report-2026-04-22-BO-SHIP-FIX-001.md`
3. Verify-agent : type-check + lint + build back-office + build @verone/orders
4. Reviewer-agent : review blind sur le diff
5. Si PASS : commit + push + PR DRAFT vers staging
6. Romeo valide → PR ready → CI → merge squash → staging
7. Deploy staging → main via PR de release séparée (pas dans celle-ci)
