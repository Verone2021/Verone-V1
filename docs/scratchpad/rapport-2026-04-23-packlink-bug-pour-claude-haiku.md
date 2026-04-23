# Rapport — Bug Packlink "shipment fantôme" pour Claude Haïku

**Date** : 2026-04-23
**Auteur** : Claude Code (session reverse engineering)
**Pour** : second agent (Claude Haïku) qui aide à débloquer
**Status** : 🔴 BUG bloquant — wizard d'expédition Packlink crée des shipments inutilisables

---

## TL;DR

Notre wizard d'expédition crée des shipments via `POST https://api.packlink.com/v1/shipments`. L'API accepte (HTTP 200) et retourne une référence (ex: `UN2026PRO0001430696`). **MAIS** ce shipment reste en état `AWAITING_COMPLETION` chez Packlink, n'est **jamais payable** côté Packlink PRO web, et n'apparaît pas dans la section "Prêts pour le paiement" du compte utilisateur.

Romeo a confirmé que **ça a déjà fonctionné** (en novembre 2025 et il y a 1-2 mois). Le bug est arrivé après une réécriture du client Packlink le **23 mars 2026** (commit `6ca28bf0d`).

---

## Faits vérifiés directement contre l'API Packlink (curl)

### 1. POST /shipments (notre code actuel) → état inutilisable

```bash
curl -H "Authorization: $KEY" "https://api.packlink.com/v1/shipments/UN2026PRO0001430696"
```

Réponse :

```json
{
  "state": "AWAITING_COMPLETION",
  "price": { "base_price": null, "total_price": null, "items": [] },
  "carrier_id": null,
  "carrier_product_id": "ACI_UPS_FR_STANDARD_INTERNATIONAL_H2H",
  "service_id": "21293",
  "additional_data": {},
  "selected_products": null
}
```

→ Shipment "draft inachevé" : pas de prix calculé, pas de carrier_id, `additional_data` vide.

### 2. POST /orders (le bon endpoint) → HTTP 500 sur tous nos payloads

J'ai testé `POST /orders` avec différentes combinaisons (UPS Standard 21293, Mondial Relay 30407, Colissimo 20557) et différents formats de date/time : tous renvoient HTTP 500 Internal Server Error.

Le seul retour utile : HTTP 400 quand `collection_date`/`collection_time` manquent → preuve que ces champs sont **désormais obligatoires** sur l'API actuelle (alors qu'en novembre 2025 ils étaient optionnels selon le rapport `RAPPORT-PACKLINK-GET-FIX-SUCCESS-2025-11-12.md` restauré).

### 3. Comparaison avec un shipment qui A MARCHÉ historiquement (UN2024PRO0000633712, status DELIVERED)

```json
{
  "state": "DELIVERED",
  "price": { "total_price": 13.6 },
  "carrier_product_id": "FR_UPS_STD_1", // ← legacy domestique
  "additional_data": {
    "postal_zone_id_from": "76",
    "postal_zone_id_to": "76",
    "postal_zone_name_from": "Francia",
    "postal_zone_name_to": "Francia",
    "selectedWarehouseId": "12ef4d85-c109-46d5-a3ff-908f498b0ecf",
    "zip_code_id_from": "pc_fr_18018", // ← ID Packlink interne
    "zip_code_id_to": "pc_fr_18083", // ← ID Packlink interne
    "parcelIds": ["custom-parcel-id"]
  },
  "source": "PRO" // ← créé via interface web Packlink PRO
}
```

Différences clés vs notre shipment :

- `additional_data` riche au lieu de vide
- `carrier_product_id` legacy `FR_UPS_STD_1` au lieu de `ACI_UPS_FR_STANDARD_INTERNATIONAL_H2H`
- `source: "PRO"` (créé par interface web) au lieu de `"verone-backoffice"`

---

## Reverse engineering Packlink PRO web (en cours)

Connexion via Playwright à `https://pro.packlink.fr/private/shipments/create/info` avec le compte de Romeo. Le wizard PRO web utilise des endpoints qu'on n'appelle PAS dans notre code :

| Endpoint observé                                                                                      | Rôle déduit                                                                              |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `GET /v1/warehouses`                                                                                  | Charge le warehouse Verone (id `12ef4d85-c109-46d5-a3ff-908f498b0ecf`, postal_zone `76`) |
| `GET /v1/locations/postalzones/origins?language=fr_FR`                                                | Liste zones origine                                                                      |
| `GET /v1/locations/postalzones/destinations?language=fr_FR`                                           | Liste zones destination                                                                  |
| `GET /v1/locations/postalcodes?language=fr_FR&postalzone=76&q=13002&platform=PRO&platform_country=FR` | **Résout `13002` → `pc_fr_xxxx`** (l'ID interne manquant)                                |
| `GET /v1/import/configurations`                                                                       | Configuration utilisateur                                                                |
| `GET /v1/support/users/self`                                                                          | Profil utilisateur                                                                       |
| `GET /v1/services?from[country]=FR&...`                                                               | Liste services dispo (on l'utilise déjà ✅)                                              |

**Étapes web suivies** :

1. ✅ Étape 1 (Détails de l'expédition) — saisie destinataire 13002 + colis 7.8kg / 35×23×25cm
2. ✅ Étape 2 (Sélection service) — 15 services proposés, sélection Mondial Relay Domicile 9.53€
3. 🟡 Étape 3 (Coordonnées de l'adresse) — page chargée, pas encore soumise (à compléter)
4. ⏸️ Étape 4 (Informations de paiement) — **C'est là qu'on attend le POST critique** qui crée un shipment payable

**Hypothèse forte** : à l'étape 4, le wizard PRO appelle un POST avec un payload incluant `additional_data` complet (postal_zone IDs + zip_code IDs résolus via `/v1/locations/postalcodes` + `selectedWarehouseId` du warehouse). C'est ce payload qu'il faut reproduire dans notre code.

---

## Doc historique restaurée (utile pour Claude Haïku)

J'ai restauré dans `docs/restored/packlink-2025-11/` les fichiers supprimés lors du cleanup repository :

```
docs/restored/packlink-2025-11/
├── lib/                                  # Code client + types + errors + rate limiter (novembre 2025)
│   ├── client.ts                         # 8.4 KB — implémente POST /orders, POST /drafts, GET /labels?ref=...
│   ├── errors.ts                         # 4.2 KB — gestion erreurs typées
│   ├── index.ts
│   ├── rate-limiter.ts                   # 3.8 KB — token bucket
│   ├── types.ts                          # 8.5 KB — interfaces TypeScript
│   ├── validation.ts                     # 2.8 KB — validation Zod
│   └── webhooks.ts                       # 1.4 KB
├── api/                                  # Routes API back-office novembre
│   ├── packlink/
│   │   ├── search-services-route.ts
│   │   ├── draft-create-route.ts         # POST /api/packlink/draft/create
│   │   ├── order-create-route.ts         # POST /api/packlink/order/create
│   │   └── dropoffs-route.ts
│   ├── sales-shipments-create-route.ts   # 12 KB — orchestrateur principal qui appelle createOrder()
│   ├── sales-shipments-validate-route.ts
│   └── webhooks-packlink-route.ts        # 5.6 KB
├── migration/
│   └── 20251112_002_packlink_shipments_setup.sql
└── rapports/
    ├── 2025-10-10-test-api-packlink.md
    ├── 2025-10-10-test-packlink-modal-v2-succes.md
    ├── RAPPORT-COMPARAISON-FORMULAIRES-PACKLINK-2025-11-12.md
    ├── RAPPORT-MULTI-SHIPMENTS-PACKLINK-INTEGRATION-2025-11-12.md
    ├── RAPPORT-PACKLINK-GET-FIX-SUCCESS-2025-11-12.md  ← LECTURE OBLIGATOIRE
    ├── RAPPORT-SESSION-TESTS-PACKLINK-2025-11-13.md
    └── packlink-shipping-reference.md
```

**Lecture critique** : `RAPPORT-PACKLINK-GET-FIX-SUCCESS-2025-11-12.md` documente que le code de novembre :

- Avait `createOrder` (POST /orders) — endpoint correct pour shipment payable
- Avait `createDraft` (POST /drafts) — pour brouillon
- N'utilisait **PAS** `POST /shipments` (endpoint actuel buggé)
- Conclusion du rapport : "**Implémenter POST /v1/orders** pour création expédition finale" — c'est l'étape qui n'a probablement jamais été terminée à 100% en novembre.

---

## Comparaison code novembre 2025 vs code actuel mars 2026

| Fichier           | Novembre 2025 (commit `60b93bc85`)                                                      | Mars 2026 (commit `6ca28bf0d`, actuel)                                                                              |
| ----------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `client.ts`       | 8.4 KB, 9 méthodes (createOrder, createDraft, getLabels, getTracking, registerWebhook…) | 8.3 KB, **réécriture from scratch**, méthode `createShipment` qui appelle `POST /shipments` (endpoint inutilisable) |
| `errors.ts`       | Présent (PacklinkError, RateLimit, RequestTimeout, parser)                              | **Absent**                                                                                                          |
| `rate-limiter.ts` | Présent (token bucket)                                                                  | **Absent**                                                                                                          |
| `validation.ts`   | Présent (Zod)                                                                           | **Absent**                                                                                                          |
| `types.ts`        | Présent (PacklinkOrderRequest, PacklinkShipmentDetails, customs, etc.)                  | **Absent** (types inline dans client.ts)                                                                            |
| Endpoint create   | `POST /orders` (shipment payable direct)                                                | `POST /shipments` (draft inachevé inutilisable)                                                                     |
| Endpoint labels   | `GET /labels?shipment_reference=...`                                                    | `GET /shipments/{ref}/labels`                                                                                       |
| Endpoint tracking | `GET /shipments/{ref}/track`                                                            | `GET /shipments/{ref}/tracking`                                                                                     |

→ Le re-déploiement du 23 mars 2026 a **réécrit** complètement le client au lieu de restaurer celui de novembre. Cette réécriture est la cause racine.

---

## Ce qui reste à découvrir / faire

### Pour Claude Haïku (recherche docs/forums)

1. **Documentation API Packlink officielle à jour** : trouver la ressource qui décrit le bon flow `POST /orders` aujourd'hui (champs obligatoires : `collection_date`, `collection_time`, `additional_data` ?). La doc référencée dans le code (`https://wout.github.io/packlink.cr/`) date de 2025 et probablement obsolète.
2. **Forums dev Packlink** : chercher des cas similaires "shipment stuck in AWAITING_COMPLETION" ou "POST /v1/orders 500 Internal Server Error".
3. **Github** : chercher des intégrations open-source récentes (depuis mars 2026) qui appellent l'API Packlink avec succès.

### Pour la session Playwright (à finir)

1. Compléter étape 3 du wizard PRO (remplir adresse Pokawa Marseille)
2. Avancer à étape 4 "Informations de paiement"
3. Capturer le **POST critique** émis par le wizard web (probablement `POST /v1/orders` avec un body riche)
4. Reproduire exactement ce payload dans notre client

### Action de cleanup déjà faite

- ✅ Shipment fantôme `UN2026PRO0001430696` annulé via DELETE Packlink + DELETE row DB
- ✅ Stock/SO `SO-2026-00158` intacts (vérifié pre/post)
- ✅ Règle `.claude/rules/no-phantom-data.md` créée + référencée dans CLAUDE.md (PR #729 mergée)

---

## Reproductibilité

### Pour rejouer le bug

```bash
KEY=5f0be75668e78f6c4ac49b21969cf0241545278db885c4b6479dc3e04acb2cee

# Test 1 : POST /shipments (notre code) → succeed mais shipment inutilisable
curl -X POST -H "Authorization: $KEY" -H "Content-Type: application/json" -d '{
  "from": {"country":"FR","zip_code":"91300","city":"Massy","street1":"4 rue du Perou","phone":"+33600000000","email":"contact@veronecollections.fr","name":"Verone","surname":"Collections"},
  "to":   {"country":"FR","zip_code":"13002","city":"Marseille","street1":"9 Quai du Lazaret","phone":"+33600000000","email":"client@verone.fr","name":"Pokawa","surname":"Marseille"},
  "packages": [{"weight":7.8,"width":23,"height":25,"length":35}],
  "service_id": 21293,
  "content": "Plateau bois",
  "contentvalue": 326.55,
  "shipment_custom_reference": "TEST-MANUEL"
}' "https://api.packlink.com/v1/shipments"
# Réponse : 200 + reference → mais state AWAITING_COMPLETION et invisible côté PRO

# Test 2 : POST /orders → HTTP 500 (l'endpoint qui devrait marcher)
curl -X POST -H "Authorization: $KEY" -H "Content-Type: application/json" -d '{
  "order_custom_reference": "VERONE-TEST",
  "shipments": [{
    "from": {...same...},
    "to":   {...same...},
    "packages": [{"weight":7.8,"width":23,"height":25,"length":35}],
    "service_id": 21293,
    "content": "Plateau bois",
    "contentvalue": 326.55,
    "shipment_custom_reference": "TEST-ORDER",
    "collection_date": "2026/04/27",
    "collection_time": "10:00-18:00"
  }]
}' "https://api.packlink.com/v1/orders"
# Réponse : 500 Internal Server Error
```

### Compte test

- Packlink API key : `5f0be75668e7...` (en prod sur Vercel + handoff de session)
- Compte Packlink user : `1e39d5bf-f8e9-4b1b-97dd-b12740d8c584` / client `637d7c28-6968-4665-a340-27d4735245de`
- Warehouse default : `12ef4d85-c109-46d5-a3ff-908f498b0ecf` (Roméo Dos Santos, 91300 Massy, postal_zone "76")

---

## Recommandation finale

Une fois qu'on a identifié le bon payload via reverse engineering du wizard PRO web :

1. **Restaurer en bloc** les fichiers `lib/packlink/*` de novembre 2025 dans `packages/@verone/common/src/lib/packlink/` (ils sont dans `docs/restored/packlink-2025-11/lib/`)
2. **Adapter** la méthode `createOrder` pour ajouter les champs nouvellement obligatoires (`collection_date`, `collection_time`, et `additional_data` si nécessaire)
3. **Modifier** la route `apps/back-office/src/app/api/packlink/shipment/route.ts` pour appeler `createOrder` au lieu de `createShipment`
4. **Tester de bout en bout** sur SO-2026-00158 (commande propre, sans shipment fantôme)

---

## Fichiers de référence dans le repo

- `packages/@verone/common/src/lib/packlink/client.ts` — client actuel (cassé)
- `apps/back-office/src/app/api/packlink/shipment/route.ts` — route POST shipment (utilise `createShipment`)
- `apps/back-office/src/app/api/packlink/services/route.ts` — search services (OK)
- `packages/@verone/orders/src/components/forms/ShipmentWizard/handle-create-draft.ts` — wizard caller
- `docs/restored/packlink-2025-11/` — code novembre restauré
- `.claude/rules/no-phantom-data.md` — règle anti-fantôme suite à incident
