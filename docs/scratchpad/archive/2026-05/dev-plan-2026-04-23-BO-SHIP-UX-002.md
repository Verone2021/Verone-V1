# Dev plan — BO-SHIP-UX-002 : résumé visuel colis précédents dans wizard Packlink

**Ticket** : `BO-SHIP-UX-002`
**Base** : après merge de la chaîne `test/all-fixes-romeo` (#715 → #722 + `BO-SHIP-UX-001`)
**Effort** : ~3h (migration DB + backfill + UI)

---

## Demande métier (Romeo)

Quand on ouvre le wizard d'expédition sur une commande qui a **déjà** une/des expéditions Packlink, l'utilisateur doit voir visuellement dans le modal :

- Numéro du colis (« Colis 1 », « Colis 2 »…)
- **Quantité envoyée** (ex : 15 unités)
- **Dimensions** : largeur × longueur × hauteur (cm)
- **Poids** (kg)
- Transporteur + statut (a_payer / paye / in_transit…)

Objectif : ne pas recréer mentalement ce qui a été fait précédemment. Scénario typique : commande de 60 articles en 4 colis, l'utilisateur envoie colis 1 (dimensions X × Y × Z, 15 kg), puis doit envoyer colis 2, 3, 4 → il veut voir le template du colis 1 pour reproduire.

---

## État actuel (vérifié)

### DB

`sales_order_shipments` a **20 colonnes** mais **aucune** liée aux dimensions/poids physiques des colis :

- Infos carrier : `delivery_method`, `carrier_name`, `carrier_service`, `shipping_cost`
- Infos tracking : `tracking_number`, `tracking_url`, `label_url`, `packlink_*`
- Info expédition : `shipped_at`, `shipped_by`, `estimated_delivery_at`
- Items : `product_id`, `quantity_shipped` (1 row par product)

→ **Les dimensions et poids sont envoyés à Packlink mais pas persistés.**

### Code wizard

`PackageInfo` côté client (`types.ts:26-31`) :

```ts
export interface PackageInfo {
  weight: number; // kg
  width: number; // cm
  height: number; // cm
  length: number; // cm
}
```

`handle-create-draft.ts:141` envoie `packages: PackageInfo[]` à l'API Packlink mais pas à Supabase.

### Hook `usePreviousShipments`

Charge déjà depuis `sales_order_shipments` :

```sql
SELECT shipped_at, quantity_shipped, product_id,
       delivery_method, carrier_name, tracking_number, tracking_url,
       packlink_status, shipping_cost,
       products:product_id (name)
FROM sales_order_shipments
WHERE sales_order_id = ?
ORDER BY shipped_at ASC
```

Groupe par `shipped_at` (timestamp) → retourne `PreviousShipmentGroup[]` avec `items[]`. **Pas de dimensions dans le retour actuel** (colonnes inexistantes).

---

## Plan — Option A : migration DB + stockage

### 1. Migration SQL

**Fichier** : `supabase/migrations/20260503_add_packages_info_to_sales_order_shipments.sql`

```sql
-- Ajoute packages_info pour stocker les dimensions et poids envoyés à Packlink
-- Permet UX "résumé colis précédent" dans le wizard (BO-SHIP-UX-002)

ALTER TABLE public.sales_order_shipments
ADD COLUMN IF NOT EXISTS packages_info jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.sales_order_shipments.packages_info IS
  'Liste des colis envoyés à Packlink au moment de la création du shipment. '
  'Format : [{"weight": 5, "width": 30, "height": 30, "length": 30}]. '
  'Dimensions en cm, poids en kg. Permet affichage historique colis '
  'précédents dans wizard d''expédition (BO-SHIP-UX-002).';

-- Index GIN pour recherche éventuelle (léger, optionnel)
-- CREATE INDEX IF NOT EXISTS idx_sales_order_shipments_packages_info
--   ON public.sales_order_shipments USING GIN (packages_info);
```

**Design decision** : jsonb plutôt que colonnes flat car :

- Un shipment peut contenir plusieurs colis (packages est un array)
- Pas de besoin de requête indexée sur les dimensions individuelles
- Flexibilité future (ex: fragile, contents, insurance)

### 2. Backfill optionnel

SO-2026-00158 existe déjà en DB avec `packages_info = '[]'`. Pas de backfill possible (données perdues). Le shipment UN2026PRO0001424092 créé ce matin n'aura pas ses dimensions affichées rétroactivement.

→ Accepter que seuls les shipments créés APRÈS cette migration auront les infos colis.

### 3. Modification `handle-create-draft.ts`

Dans `validateShipment({...})` (ligne ~160), ajouter le champ :

```ts
packages_info: deps.packages,   // Array de {weight, width, height, length}
```

Puis côté server action `sales_shipments.ts` (ou hook `use-shipment-validator.ts`), passer ce champ dans l'INSERT.

### 4. Modification `use-previous-shipments.ts`

Ajouter `packages_info` au SELECT :

```ts
.select(
  `shipped_at, quantity_shipped, product_id,
   delivery_method, carrier_name, tracking_number, tracking_url,
   packlink_status, shipping_cost, packages_info,
   products:product_id (name)`
)
```

Étendre `PreviousShipmentGroup` (`types.ts`) :

```ts
export interface PackageDimensions {
  weight: number;
  width: number;
  height: number;
  length: number;
}

export interface PreviousShipmentGroup {
  shipped_at: string;
  delivery_method: string | null;
  carrier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  packlink_status: string | null;
  shipping_cost: number | null;
  packages_info: PackageDimensions[]; // ← NEW
  items: Array<{ product_name: string; quantity: number }>;
}
```

Note : `packages_info` est identique pour toutes les rows d'un même `shipped_at` (groupe). On prend celui de la première row rencontrée.

### 5. UI — nouveau composant `PreviousShipmentCard`

**Fichier** : `packages/@verone/orders/src/components/forms/ShipmentWizard/PreviousShipmentCard.tsx`

```tsx
'use client';

import { Badge, Card } from '@verone/ui';
import { Package, Truck, Scale, Ruler } from 'lucide-react';
import { formatCurrency } from '@verone/utils';
import type { PreviousShipmentGroup } from './types';

interface PreviousShipmentCardProps {
  group: PreviousShipmentGroup;
  index: number;
}

const PACKLINK_STATUS_LABELS: Record<string, { label: string; color: string }> =
  {
    a_payer: { label: 'À payer', color: 'bg-orange-100 text-orange-800' },
    paye: { label: 'Payé', color: 'bg-green-100 text-green-800' },
    in_transit: { label: 'En transit', color: 'bg-blue-100 text-blue-800' },
    delivered: { label: 'Livré', color: 'bg-emerald-100 text-emerald-800' },
    incident: { label: 'Incident', color: 'bg-red-100 text-red-800' },
  };

export function PreviousShipmentCard({
  group,
  index,
}: PreviousShipmentCardProps) {
  const statusStyle = group.packlink_status
    ? PACKLINK_STATUS_LABELS[group.packlink_status]
    : null;

  const totalQty = group.items.reduce((s, i) => s + i.quantity, 0);
  const totalWeight = group.packages_info.reduce((s, p) => s + p.weight, 0);
  const nbPackages = group.packages_info.length;

  return (
    <Card className="border-orange-200 bg-orange-50/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-orange-600" />
          <span className="font-semibold text-sm">
            Expédition #{index + 1} —{' '}
            {new Date(group.shipped_at).toLocaleDateString('fr-FR')}
          </span>
        </div>
        {statusStyle && (
          <Badge className={`text-xs ${statusStyle.color}`}>
            {statusStyle.label}
          </Badge>
        )}
      </div>

      {/* Transporteur */}
      {group.carrier_name && (
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <Truck className="h-3 w-3" />
          <span>{group.carrier_name}</span>
          {group.shipping_cost != null && (
            <span className="text-gray-500">
              · {formatCurrency(group.shipping_cost)}
            </span>
          )}
        </div>
      )}

      {/* Colis — dimensions + poids */}
      {nbPackages > 0 && (
        <div className="border-t border-orange-200 pt-2 space-y-1">
          <p className="text-xs font-medium text-gray-600">
            {nbPackages} colis · {totalWeight.toFixed(1)} kg total
          </p>
          <div className="space-y-1">
            {group.packages_info.map((pkg, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-xs text-gray-700"
              >
                <span className="font-medium w-16">Colis {i + 1}</span>
                <span className="inline-flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  {pkg.width} × {pkg.length} × {pkg.height} cm
                </span>
                <span className="inline-flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  {pkg.weight} kg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Articles envoyés */}
      <div className="border-t border-orange-200 pt-2">
        <p className="text-xs font-medium text-gray-600 mb-1">
          {totalQty} articles envoyés
        </p>
        <div className="space-y-0.5">
          {group.items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs text-gray-700">
              <span className="truncate mr-2">{item.product_name}</span>
              <span className="font-medium">×{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lien tracking si dispo */}
      {group.tracking_url && (
        <a
          href={group.tracking_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          Suivi → {group.tracking_number ?? 'lien transporteur'}
        </a>
      )}
    </Card>
  );
}
```

### 6. Intégration dans le wizard

**Fichier** : `packages/@verone/orders/src/components/forms/ShipmentWizard/StepStock.tsx`

Remplacer l'accordéon simple « 1 expédition précédente » par la liste des `<PreviousShipmentCard>`, visible d'emblée (pas caché derrière un clic).

Exemple :

```tsx
{
  previousShipments.length > 0 && (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <History className="h-4 w-4" />
        {previousShipments.length} expédition
        {previousShipments.length > 1 ? 's' : ''} précédente
        {previousShipments.length > 1 ? 's' : ''}
      </h3>
      <div className="space-y-2">
        {previousShipments.map((group, idx) => (
          <PreviousShipmentCard
            key={group.shipped_at}
            group={group}
            index={idx}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 italic">
        Astuce : vous pouvez réutiliser les dimensions du colis précédent à
        l'étape 3.
      </p>
    </div>
  );
}
```

### 7. Bonus — bouton « Reproduire ces dimensions »

Dans `PreviousShipmentCard`, ajouter un bouton « Utiliser ces dimensions » qui pré-remplit `packages` dans le wizard (au lieu du default 5 kg / 30×30×30).

Passer `onReusePackages` en prop, appelé au clic → `setPackages(group.packages_info)` dans le parent.

---

## Plan — Option B : pas de migration, juste info minimale

Si la migration est jugée trop lourde, alternative low-cost :

- **Pas de dimensions/poids** (données perdues car non stockées)
- Juste afficher ce qui existe déjà : quantité, transporteur, statut, date, items
- Card visuelle plus riche que l'accordéon actuel

→ Moins utile pour Romeo qui veut **reproduire** les dimensions du colis précédent.

**Recommandation : Option A** (migration + stockage + UI complète).

---

## Checklist règles Verone

- ✅ Migration DB = FEU ROUGE normalement, mais Romeo demande le feu vert (à confirmer avant d'appliquer)
- ✅ Colonne `packages_info jsonb` nullable avec default `'[]'` → pas de breaking sur les lignes existantes
- ✅ Aucune modification des triggers protégés
- ✅ RLS hérite de `sales_order_shipments` existante (pas touché)
- ✅ Après migration : `python3 scripts/generate-docs.py --db` pour regen types

---

## Fichiers à toucher (récap)

| #   | Fichier                                                                                 | Action                                                           |
| --- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | `supabase/migrations/20260503_add_packages_info_to_sales_order_shipments.sql`           | **Nouveau**                                                      |
| 2   | `packages/@verone/orders/src/components/forms/ShipmentWizard/handle-create-draft.ts`    | Ajouter `packages_info` dans validateShipment                    |
| 3   | `packages/@verone/orders/src/hooks/use-sales-shipments/use-shipment-validator.ts`       | Accepter `packages_info` dans payload                            |
| 4   | `packages/@verone/orders/src/actions/sales-shipments.ts`                                | INSERT `packages_info` en DB                                     |
| 5   | `packages/@verone/orders/src/components/forms/ShipmentWizard/types.ts`                  | Type `PackageDimensions` + `PreviousShipmentGroup.packages_info` |
| 6   | `packages/@verone/orders/src/components/forms/ShipmentWizard/use-previous-shipments.ts` | SELECT `packages_info` + mapping                                 |
| 7   | `packages/@verone/orders/src/components/forms/ShipmentWizard/PreviousShipmentCard.tsx`  | **Nouveau composant**                                            |
| 8   | `packages/@verone/orders/src/components/forms/ShipmentWizard/StepStock.tsx`             | Intégrer `<PreviousShipmentCard>`                                |

---

## Effort estimé

- Migration + type regen : **20 min**
- Modif hooks (handle-create-draft, validator, action) : **40 min**
- Type `PackageDimensions` + `use-previous-shipments` : **15 min**
- Composant `PreviousShipmentCard` + intégration StepStock : **1h**
- Validation + type-check + lint + test Playwright : **30 min**

**Total** : ~2h30 à 3h

---

## Limites connues

- **Pas de backfill** : les shipments créés AVANT cette migration n'auront pas de dimensions affichées (colonnes vides). Message UX : « Dimensions non enregistrées (shipment créé avant la fonctionnalité) ».
- **Synchro Packlink** : si le client modifie les dimensions sur Packlink PRO après création, notre DB n'est pas mise à jour. On affiche les dimensions initiales envoyées. Acceptable pour le besoin métier « reproduire la config ».

---

## À faire avant démarrage

1. Romeo donne feu vert explicite sur la migration DB (FEU ROUGE sinon)
2. Merger test/all-fixes-romeo → staging → main (cette session)
3. Vérifier en prod que tout marche (nouveau shipment → check `packages_info` rempli)
4. Démarrer BO-SHIP-UX-002 sur nouvelle branche depuis staging à jour
