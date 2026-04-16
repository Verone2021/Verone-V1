# Diagnostic Bug Expedition Modal

**Date :** 16 avril 2026
**Methode :** Lecture seule + requetes DB (aucune modification)
**Symptome :** Clic sur "Expedier" → commande expediee sans aucun detail (pas de tracking, pas de transporteur, pas de methode)

---

## 1. CHAINE COMPLETE DU FLOW "EXPEDIER"

### Page Expeditions (stocks/expeditions)

```
Bouton "Expedier"
  → expeditions-order-row.tsx:160 — onShip(order)
  → use-expeditions-ui.ts:43 — handleOpenShipmentModal(order)
    → setOrderToShip(order) + setShowShipmentModal(true)
  → page.tsx:105 — <ShipmentModalWrapper>
    → expeditions-order-row.tsx:287 — ShipmentModalWrapper
      → SalesOrderShipmentModal (from @verone/orders)
        → loadSalesOrderForShipment(order.id) via useEffect
        → ShipmentWizard (7 etapes)
          → Step 1: Selection stock
          → Step 2: Mode livraison (pickup/hand/manual/packlink)
          → Step 3-7: Details Packlink (si packlink)
          → handleSimpleValidation() ou handleCreateDraft()
            → validateSalesShipment() (Server Action)
              → INSERT INTO sales_order_shipments
```

### Page Commandes Clients (commandes/clients)

```
Menu "..." → "Expedier"
  → SalesOrderActionMenu.tsx:150 — onShip()
  → SalesOrdersTable → modals.openShipmentModal(order)
  → SalesOrderModals.tsx:175 — SalesOrderShipmentModal
    → (meme flow que ci-dessus)
```

**Les deux chemins menent au meme SalesOrderShipmentModal → ShipmentWizard.**

---

## 2. VERIFICATION CODE : TOUT EST INTACT

### Imports et exports

| Verification                                          | Resultat                        |
| ----------------------------------------------------- | ------------------------------- |
| SalesOrderShipmentModal exporte depuis @verone/orders | OK (modals/index.ts:11)         |
| ShipmentWizard exporte depuis index.tsx               | OK (14 sub-components)          |
| useSalesShipments exporte depuis hooks/index.ts       | OK (via barrel)                 |
| useShipmentValidator exporte validateShipment         | OK                              |
| validateSalesShipment Server Action                   | OK (actions/sales-shipments.ts) |

### TypeScript

| Package                        | Erreurs  |
| ------------------------------ | -------- |
| @verone/orders type-check      | 0 erreur |
| @verone/back-office type-check | 0 erreur |

### Structure ShipmentWizard (14 fichiers, split dans cf66b3b78)

Tous presents et correctement importes :

- index.tsx (205 lignes) — composant principal
- useShipmentWizard.ts (520 lignes) — hook orchestrateur
- StepStock.tsx, StepDeliveryMethod.tsx, StepPackageInfo.tsx
- StepCarrierSelection.tsx, StepDropoffs.tsx, StepPayment.tsx, StepSuccess.tsx
- StepStepper.tsx, WizardSummaryPanel.tsx
- types.ts, formatters.ts, handlers.ts

---

## 3. TROUVAILLE CRITIQUE : DONNEES DB

### Toutes les expeditions en base

```sql
SELECT delivery_method, carrier_name, tracking_number, notes
FROM sales_order_shipments ORDER BY shipped_at DESC LIMIT 10;
```

| delivery_method | carrier_name | tracking_number | notes                            |
| --------------- | ------------ | --------------- | -------------------------------- |
| parcel          | null         | null            | null                             |
| parcel          | null         | null            | null                             |
| parcel          | null         | null            | null                             |
| parcel          | null         | null            | null                             |
| parcel          | null         | null            | null                             |
| parcel          | null         | null            | Backfill reconciliation F-25-049 |
| parcel          | null         | null            | Backfill reconciliation F-25-050 |
| parcel          | null         | null            | null                             |
| parcel          | null         | null            | null                             |
| parcel          | null         | null            | null                             |

**TOUTES les expeditions ont `delivery_method = 'parcel'` avec tracking et carrier a NULL.**

### DEFAULT sur la colonne

```sql
SELECT column_default FROM information_schema.columns
WHERE table_name = 'sales_order_shipments' AND column_name = 'delivery_method';
-- Resultat : 'parcel'::text
```

**La colonne `delivery_method` a un DEFAULT `'parcel'`.**

### Incompatibilite avec le ShipmentWizard

Le Zod schema du Server Action (actions/sales-shipments.ts:24) n'accepte que :

```typescript
z.enum(['pickup', 'hand_delivery', 'manual', 'packlink']);
```

**`'parcel'` n'est PAS dans l'enum.** Cela signifie que les expeditions existantes ont ete creees par un AUTRE chemin de code (pas le ShipmentWizard actuel).

### Derniere expedition en date

```
SO-2026-00119 — shipped_at: 2026-03-11 12:23:43
```

**Aucune expedition creee depuis le 11 mars 2026.** Le refactoring max-lines a commence le 6 avril 2026.

---

## 4. COMMITS DE DECOUPAGE DANS LA ZONE EXPEDITION

| Hash      | Date       | Message                                           | Impact                        |
| --------- | ---------- | ------------------------------------------------- | ----------------------------- |
| cf66b3b78 | ~fev 2026  | split ShipmentWizard (2080L) → 14 sub-components  | Structure wizard              |
| 11d498ec9 | 6 avr 2026 | split use-sales-shipments.ts (889L) → 8 sub-files | Hook expedition               |
| bcde467ce | ~avr 2026  | SalesOrderShipmentForm 616→233 lines              | Ancien formulaire (dead code) |
| 7fa34ddf7 | ~avr 2026  | stock hooks types extracted                       | Types stock                   |

---

## 5. PROBLEMES IDENTIFIES

### Probleme 1 : useEffect sans .catch() dans SalesOrderShipmentModal

**Fichier :** `packages/@verone/orders/src/components/modals/SalesOrderShipmentModal.tsx:38-46`

```typescript
useEffect(() => {
  if (open && order?.id) {
    setLoading(true);
    void loadSalesOrderForShipment(order.id).then(data => {
      setEnrichedOrder(data);
      setLoading(false);
    });
  }
}, [open, order?.id, loadSalesOrderForShipment]);
```

**Si `loadSalesOrderForShipment` echoue :**

- La promesse est rejetee silencieusement (void + pas de .catch)
- `setLoading(false)` n'est jamais appele
- Le modal reste bloque sur "Chargement des donnees..." indefiniment
- L'utilisateur ferme le modal → rien ne se passe → pas d'expedition

### Probleme 2 : Dependance useCallback instable

**Fichier :** `packages/@verone/orders/src/hooks/use-sales-shipments/use-shipment-detail.ts:14-15`

```typescript
export function useShipmentDetail() {
  const supabase = createClient();  // Potentiellement nouveau a chaque render
  // ...
  const loadSalesOrderForShipment = useCallback(
    async (soId: string) => { /* ... */ },
    [supabase]  // Si supabase change → callback change → useEffect re-fire
  );
```

Si `createClient()` retourne une nouvelle reference a chaque render, `loadSalesOrderForShipment` est instable, ce qui cause des re-renders infinis dans le `useEffect` du modal.

### Probleme 3 : DEFAULT DB incompatible avec l'enum Zod

La colonne `delivery_method` a un DEFAULT `'parcel'` mais le ShipmentWizard n'utilise JAMAIS cette valeur. Si le wizard envoie `undefined` pour `delivery_method`, la DB utilise `'parcel'`.

---

## 6. HYPOTHESE DE ROOT CAUSE

**Le ShipmentWizard n'a probablement JAMAIS fonctionne correctement en production.** Les preuves :

1. TOUTES les expeditions existantes ont `delivery_method = 'parcel'` (valeur DB default, pas une valeur du wizard)
2. Aucune expedition n'a de `carrier_name` ou `tracking_number` (champs que le wizard remplit)
3. La derniere expedition date du 11 mars — AVANT le refactoring max-lines (6 avril)
4. Le `useEffect` sans `.catch()` fait que toute erreur de chargement bloque le modal silencieusement

**Scenario probable :** Le modal s'ouvre, `loadSalesOrderForShipment` echoue (erreur Supabase, probleme de requete, timeout), la promesse est rejetee silencieusement, le modal reste bloque sur "Chargement des donnees...", l'utilisateur ne peut pas utiliser le wizard.

Les anciennes expeditions (avant le wizard) etaient probablement creees via l'ancien `SalesOrderShipmentForm` ou une insertion directe, avec le DEFAULT `'parcel'`.

---

## 7. FICHIERS A MODIFIER POUR FIXER

| Fichier                                                                        | Ligne | Action                                                                                |
| ------------------------------------------------------------------------------ | ----- | ------------------------------------------------------------------------------------- |
| `packages/@verone/orders/src/components/modals/SalesOrderShipmentModal.tsx`    | 38-46 | Ajouter `.catch()` sur `loadSalesOrderForShipment` + afficher erreur                  |
| `packages/@verone/orders/src/hooks/use-sales-shipments/use-shipment-detail.ts` | 14-15 | Stabiliser `supabase` via `useMemo` ou ref                                            |
| `packages/@verone/orders/src/hooks/use-sales-shipments/use-shipment-detail.ts` | 149   | Retirer `supabase` des deps du `useCallback` ou le stabiliser                         |
| Migration SQL                                                                  | --    | Changer le DEFAULT de `delivery_method` de `'parcel'` vers `NULL` (ou un enum valide) |

### Fichiers a verifier en priorite (ne sont PAS a modifier sans diagnostic runtime)

| Fichier                                                  | Pourquoi                                                  |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `packages/@verone/utils/supabase/client.ts`              | Verifier si `createClient()` retourne un singleton        |
| `packages/@verone/orders/src/actions/sales-shipments.ts` | Verifier que le Server Action est accessible (route OK)   |
| Browser console en production                            | Chercher les erreurs silencieuses lors du clic "Expedier" |

---

## 8. PLAN DE VERIFICATION RECOMMANDE (avant de coder)

1. **Ouvrir le back-office en dev** → Page Expeditions → Cliquer "Expedier" sur une commande validee
2. **Ouvrir la console navigateur** → Observer les erreurs
3. **Verifier si le modal s'ouvre** → Si oui, reste-t-il bloque sur "Chargement" ?
4. **Verifier `loadSalesOrderForShipment`** → Ajouter un console.log temporaire dans le `.then()` et un `.catch()`
5. Si le chargement fonctionne mais le wizard ne rend pas → verifier les props passees au ShipmentWizard
6. Si le chargement echoue → identifier l'erreur Supabase (RLS ? colonne manquante ? timeout ?)

---

FIN DU DIAGNOSTIC
