# Packlink PRO — Reference Expedition

## API Packlink v1

**Base URL** : `https://api.packlink.com/v1`
**Auth** : Header `Authorization: <API_KEY>` (pas de Bearer)
**API Key** : variable d'environnement `PACKLINK_API_KEY`

## Endpoints utilises

| Methode | Endpoint                                                                                           | Usage                                |
| ------- | -------------------------------------------------------------------------------------------------- | ------------------------------------ |
| GET     | `/services?from[country]=FR&from[zip]=91300&to[country]=FR&to[zip]=XXXXX&packages[0][weight]=N...` | Lister les transporteurs disponibles |
| POST    | `/shipments`                                                                                       | Creer une expedition (brouillon)     |
| GET     | `/shipments/{ref}`                                                                                 | Details d'une expedition             |
| PUT     | `/shipments/{ref}`                                                                                 | Modifier une expedition              |
| DELETE  | `/shipments/{ref}`                                                                                 | Supprimer un brouillon               |
| GET     | `/shipments/{ref}/labels`                                                                          | Recuperer les etiquettes PDF         |
| GET     | `/shipments/{ref}/tracking`                                                                        | Historique de suivi                  |
| GET     | `/shipments`                                                                                       | Lister toutes les expeditions        |
| GET     | `/dropoffs/{service_id}/{country}/{zip}`                                                           | Points relais                        |
| POST    | `/shipments/callback`                                                                              | Enregistrer webhook                  |

## Comportement critique : POST /shipments et statut AWAITING_COMPLETION

### Le probleme

`POST /shipments` cree TOUJOURS une expedition en statut `AWAITING_COMPLETION` (Incomplet/Brouillon).
L'API ne permet PAS de creer directement en statut `READY_TO_PURCHASE` (Pret pour le paiement).

### Cause identifiee (23 mars 2026)

Le champ `collection_time` ne peut PAS etre defini via l'API :

- Si envoye dans le POST (ex: `"collection_time": "09:00"`), l'API retourne **Internal Server Error 500**
- Si omis, le champ reste vide cote Packlink
- Sans `collection_time`, Packlink considere l'expedition comme "incomplete"

Quand on passe par l'interface Packlink PRO et qu'on confirme la date via le date picker,
Packlink set automatiquement le `collection_time` (ex: "07:00-23:00") et l'expedition passe
en `READY_TO_PURCHASE`.

### Workflow actuel (back-office → Packlink PRO)

1. Le wizard back-office cree l'expedition via `POST /shipments` → statut `AWAITING_COMPLETION`
2. L'admin clique "Finaliser et payer sur Packlink PRO" → ouvre la page specifique de l'expedition
3. Sur Packlink PRO : confirmer la date (1 clic sur date picker + Confirmer) → statut `READY_TO_PURCHASE`
4. Cliquer "Aller au paiement" → page paiement → payer

### Champs envoyes dans POST /shipments

```json
{
  "from": { "name", "surname", "email", "phone", "street1", "city", "zip_code", "country", "company" },
  "to": { "name", "surname", "email", "phone", "street1", "city", "zip_code", "country" },
  "packages": [{ "weight", "width", "height", "length" }],
  "service_id": 21293,
  "service": "Standard",
  "carrier": "UPS",
  "content": "Description du contenu",
  "contentvalue": 410.38,
  "content_second_hand": false,
  "priority": false,
  "has_customs": false,
  "shipment_custom_reference": "SO-2026-00132",
  "source": "verone-backoffice",
  "collection_date": "2026/03/25"
}
```

**Notes** :

- `collection_date` format `YYYY/MM/DD` (avec slashes, PAS tirets)
- `collection_time` : NE PAS ENVOYER (cause Internal Server Error)
- `phone` : sans prefixe international (ex: `0600000000`, PAS `+33600000000`)
- `contentvalue` : PAS `content_value` (pas d'underscore)

## Distinction paiement client vs paiement transport

|          | Paiement CLIENT               | Paiement TRANSPORT                           |
| -------- | ----------------------------- | -------------------------------------------- |
| Qui paie | Le client paie Verone         | Verone paie Packlink                         |
| Flux     | Rentree d'argent (revenu)     | Sortie d'argent (charge)                     |
| Champ DB | `sales_orders.payment_status` | `sales_order_shipments.packlink_status`      |
| Valeurs  | `unpaid`, `paid`, `partial`   | `a_payer`, `paye`, `in_transit`, `delivered` |

**REGLE ABSOLUE** : Le cout transport (`sales_order_shipments.shipping_cost`) n'est JAMAIS visible
par les clients (site-internet) ni les affilies (LinkMe). Seul le staff back-office peut le voir.

## Triggers DB

### INSERT sur sales_order_shipments

- Si `packlink_status = 'a_payer'` → stock PAS decremente (transport pas encore paye)
- Si `packlink_status IS NULL` (expedition manuelle) → stock decremente immediatement

### UPDATE sur sales_order_shipments

- Quand `packlink_status` passe de `a_payer` a `paye` (webhook carrier.success) → stock decremente
- Cree un `stock_movements` OUT

## Webhook Packlink

**Endpoint** : `POST /api/webhooks/packlink`
**Securite** : `PACKLINK_WEBHOOK_SECRET` (optionnel)

| Evenement                  | Action                                     | packlink_status    |
| -------------------------- | ------------------------------------------ | ------------------ |
| `shipment.carrier.success` | Tracking + stock decremente + email client | `a_payer` → `paye` |
| `shipment.carrier.fail`    | Log erreur                                 | → `incident`       |
| `shipment.label.ready`     | Sauvegarde label_url                       | inchange           |
| `shipment.label.fail`      | Log erreur                                 | inchange           |
| `shipment.tracking.update` | MAJ tracking                               | → `in_transit`     |
| `shipment.delivered`       | MAJ commande delivered                     | → `delivered`      |

**Note** : Le webhook n'est pas encore enregistre aupres de Packlink (necessite URL Vercel production).

## Adresse source Verone

```
Verone Collections
4 rue du Perou
91300 Massy, France
contact@veronecollections.fr
```

## Fichiers cles

| Fichier                                                            | Role                     |
| ------------------------------------------------------------------ | ------------------------ |
| `packages/@verone/common/src/lib/packlink/client.ts`               | Client API Packlink      |
| `apps/back-office/src/app/api/packlink/shipment/route.ts`          | Creation expedition      |
| `apps/back-office/src/app/api/packlink/shipment/[ref]/route.ts`    | GET/DELETE expedition    |
| `apps/back-office/src/app/api/packlink/shipments/pending/route.ts` | Expeditions en cours     |
| `apps/back-office/src/app/api/webhooks/packlink/route.ts`          | Webhook (6 evenements)   |
| `packages/@verone/orders/src/components/forms/ShipmentWizard.tsx`  | Wizard 7 etapes          |
| `packages/@verone/orders/src/actions/sales-shipments.ts`           | Server action validation |
| `supabase/migrations/20260323100000_packlink_deferred_stock.sql`   | Triggers stock differe   |
