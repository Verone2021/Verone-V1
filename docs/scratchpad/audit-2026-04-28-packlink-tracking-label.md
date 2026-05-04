# Audit Packlink — récupération tracking + bordereau (2026-04-28)

## Contexte

Romeo a payé sur Packlink PRO les 2 expéditions UPS de la commande LinkMe
**SO-2026-00158** (UUID `45f766be-b9b5-42a0-8fad-0927496db777`). Il s'attend
à voir apparaître côté back-office :

- Le numéro de suivi (tracking number) UPS pour chaque colis
- Un bouton pour télécharger le bordereau PDF
- La possibilité d'envoyer un email tracking au client

**Constat utilisateur** : rien n'apparaît côté back-office. La page détail
commande LinkMe ne montre ni tracking ni label.

## Données vérifiées en source de vérité

### Côté Packlink (API live, 2026-04-28)

| Réf Packlink          | Statut                                   | Tracking UPS         | Bordereau PDF                                                                            |
| --------------------- | ---------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| `FR2026PRO0001236805` | READY_TO_PRINT (= payé, prêt à imprimer) | `1Z984RF96808126732` | https://api.eu.shipengine.com/v1/downloads/10/Oc0FDutpIU6VGKr-Oi22bQ/label-783598647.pdf |
| `FR2026PRO0001236869` | READY_TO_PRINT                           | `1Z984RF96805649129` | https://api.eu.shipengine.com/v1/downloads/10/48y773A8bkCgmSjsxI3woA/label-783598273.pdf |

**Les données existent côté Packlink.** Tracking + bordereau disponibles via API.

### Côté DB Verone (`sales_order_shipments`)

```sql
SELECT packlink_shipment_id, packlink_status, tracking_number, label_url
FROM sales_order_shipments
WHERE sales_order_id = '45f766be-b9b5-42a0-8fad-0927496db777';
```

| packlink_shipment_id | packlink_status | tracking_number | label_url |
| -------------------- | --------------- | --------------- | --------- |
| FR2026PRO0001236805  | a_payer (FAUX)  | NULL            | NULL      |
| FR2026PRO0001236869  | a_payer (FAUX)  | NULL            | NULL      |

**La DB est désynchronisée.** Statut `a_payer` alors que les colis sont
payés et prêts. Aucun tracking, aucun label.

### Côté registration webhook Packlink

```bash
curl -H "Authorization: $PACKLINK_API_KEY" \
  https://api.packlink.com/v1/shipments/callback
```

Retour : `{"messages":[{"message":"Not Found"}]}`.

**Aucune URL de webhook n'est enregistrée chez Packlink.** Confirmation :
Packlink ne pourra **jamais** push d'event `shipment.carrier.success`,
`shipment.label.ready`, etc. vers notre endpoint
`/api/webhooks/packlink`.

## Bugs identifiés (4 distincts)

### Bug #1 — 🔴 Bloquant — Callback URL non enregistrée chez Packlink

**Fichier** : configuration Packlink (action côté API, pas dans le repo).

**Constat** : la route `POST /api/packlink/callback/register` existe (créée
2026-04-26 dans PR #793). Mais elle n'a manifestement **jamais été appelée
en production** — la liste des callbacks Packlink retourne 404.

**Conséquence** : aucun webhook n'est déclenché par Packlink. Le statut
DB ne passera jamais à `paye` automatiquement, le tracking et le label
ne seront jamais récupérés sans intervention manuelle.

**Fix** : appeler `POST /api/packlink/callback/register` depuis une session
back-office authentifiée, en pointant vers
`https://verone-backoffice.vercel.app/api/webhooks/packlink`. Action
ponctuelle (1 fois par environnement).

### Bug #2 — 🔴 Bloquant — Parsing `tracking_code` au mauvais endroit

**Fichier** : `apps/back-office/src/app/api/webhooks/packlink/route.ts:75`

```ts
if ('tracking_code' in details && details.tracking_code) {
  updateFields.tracking_number = details.tracking_code;
}
```

**Constat** : `client.getShipment(reference)` retourne un objet où le
tracking_number n'est **pas** au top-level mais dans
`details.packages[0].carrier_tracking_number` (vérifié en live sur
l'API Packlink). La condition `'tracking_code' in details` est donc
toujours fausse.

**Conséquence** : même quand le webhook arrivera (après fix #1), le
champ `tracking_number` restera NULL en DB. L'UI continuera à
n'afficher rien. Idem ligne 146-148 où le mail tracking est envoyé avec
`details.tracking_code` (donc sans tracking).

**Fix** : remplacer le parsing par

```ts
const trackingNumber = (
  details.packages?.[0] as { carrier_tracking_number?: string }
)?.carrier_tracking_number;
if (trackingNumber) updateFields.tracking_number = trackingNumber;
```

Idem dans le payload de l'email shipping-notification (ligne 146).

### Bug #3 — 🟠 Majeur — Sync on-demand ne pull pas l'état Packlink

**Fichier** : `apps/back-office/src/app/api/packlink/shipments/sync/route.ts`

**Constat** : le hook `useShipmentHistory` appelle ce route à chaque
ouverture de la page détail. Mais le route ne fait que **vérifier 404**
(suppression côté Packlink) — il ne pull jamais le `state`, le
`tracking_number` ou le `label_url`.

**Conséquence** : même si le webhook ne marche pas, le sync on-demand ne
peut pas servir de filet de sécurité. L'utilisateur n'a aucun moyen
d'obtenir le tracking depuis l'UI sans intervention manuelle.

**Fix** : étendre la boucle. Pour chaque row `a_payer` ou `paye` :

1. `GET /shipments/{ref}` → si state = `READY_TO_PRINT` ou supérieur,
   passer `packlink_status` à `paye` + remplir
   `tracking_number` (depuis `packages[0].carrier_tracking_number`)
2. `GET /shipments/{ref}/labels` → si non vide, remplir `label_url`
3. UPDATE DB (le trigger `confirm_packlink_shipment_stock` se chargera
   du décrément de stock)

### Bug #4 — 🟠 Majeur — Pas de bouton manuel "Synchroniser"

**Fichier** : `packages/@verone/orders/src/components/modals/order-detail/OrderShipmentHistoryCard.tsx`

**Constat** : aucun bouton UI pour déclencher manuellement une
synchronisation Packlink → DB. Si le webhook fail (ce qui est le cas
actuellement), l'utilisateur n'a aucun recours côté interface.

**Fix** : ajouter un bouton "Synchroniser Packlink" dans la card
historique d'expéditions. Au clic, appelle `/api/packlink/shipments/sync`
(une fois étendu via Bug #3) et rafraîchit la liste.

## Actions proposées (ordre)

### 1. Backfill immédiat de SO-2026-00158 (FEU ROUGE — UPDATE prod)

UPDATE DB des 2 shipments existants avec les données réelles récupérées via
API Packlink. Le trigger `confirm_packlink_shipment_stock()` va se
déclencher automatiquement et décrémenter le stock + passer la commande
à `partially_shipped` puis `shipped`.

```sql
UPDATE sales_order_shipments
SET packlink_status = 'paye',
    tracking_number = '1Z984RF96808126732',
    label_url = 'https://api.eu.shipengine.com/v1/downloads/10/Oc0FDutpIU6VGKr-Oi22bQ/label-783598647.pdf',
    packlink_label_url = 'https://api.eu.shipengine.com/v1/downloads/10/Oc0FDutpIU6VGKr-Oi22bQ/label-783598647.pdf',
    updated_at = NOW()
WHERE packlink_shipment_id = 'FR2026PRO0001236805';

UPDATE sales_order_shipments
SET packlink_status = 'paye',
    tracking_number = '1Z984RF96805649129',
    label_url = 'https://api.eu.shipengine.com/v1/downloads/10/48y773A8bkCgmSjsxI3woA/label-783598273.pdf',
    packlink_label_url = 'https://api.eu.shipengine.com/v1/downloads/10/48y773A8bkCgmSjsxI3woA/label-783598273.pdf',
    updated_at = NOW()
WHERE packlink_shipment_id = 'FR2026PRO0001236869';
```

⚠️ Cet UPDATE n'est PAS de la donnée fantôme : il aligne la DB avec
l'état réel côté Packlink. Conformément à
`.claude/rules/no-phantom-data.md` règle 1 : « cas valide d'UPDATE :
nettoyer une row clairement fausse pour aligner avec l'état externe ».

### 2. Re-register callback URL chez Packlink (FEU ORANGE)

Appeler une fois (depuis session admin BO) :

```bash
curl -X POST https://verone-backoffice.vercel.app/api/packlink/callback/register \
  -H "Cookie: <session>" -H "Content-Type: application/json" \
  -d '{"url":"https://verone-backoffice.vercel.app/api/webhooks/packlink"}'
```

### 3. PR `[BO-PACKLINK-SYNC-002]` (FEU ORANGE — bloc de 4 commits)

- Commit 1 : fix parsing `tracking_code` → `packages[0].carrier_tracking_number` (Bug #2)
- Commit 2 : étendre sync on-demand → pull state + tracking + label (Bug #3)
- Commit 3 : bouton "Synchroniser" sur OrderShipmentHistoryCard (Bug #4)
- Commit 4 : test Playwright sur la page détail commande LinkMe

Pas de migration DB nécessaire (colonnes déjà présentes).

## Estimation

- Backfill immédiat : 30 secondes (2 UPDATE SQL après accord Romeo)
- Register callback : 1 minute (1 curl avec cookie session)
- PR fix structurel : 1h dev + 30 min review/test

## Références

- Code webhook : `apps/back-office/src/app/api/webhooks/packlink/route.ts`
- Code sync on-demand : `apps/back-office/src/app/api/packlink/shipments/sync/route.ts`
- Code register : `apps/back-office/src/app/api/packlink/callback/register/route.ts`
- Hook UI : `packages/@verone/orders/src/components/modals/order-detail/use-shipment-history.ts`
- Composant UI : `packages/@verone/orders/src/components/modals/order-detail/OrderShipmentHistoryCard.tsx`
- Trigger DB : `confirm_packlink_shipment_stock` (migration `20260323100000_packlink_deferred_stock.sql`)
- PR webhook créée : #793 (commit `9359628d5` 2026-04-26)
