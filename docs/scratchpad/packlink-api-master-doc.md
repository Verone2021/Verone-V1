# Packlink API — Documentation Maître (Session 2026-04-23)

**Maintenu par** : Claude Code  
**Dernière mise à jour** : 2026-04-23  
**Statut** : ✅ Fix déployé (PR #741, main, Vercel en cours)

---

## TL;DR — Ce qui fonctionne

**Endpoint correct** : `POST https://api.packlink.com/v1/shipments`  
**Condition** : inclure `additional_data` avec les IDs zones postales (voir payload ci-dessous)  
**Résultat** : shipment en état `READY_TO_PURCHASE` → visible et payable sur pro.packlink.fr

---

## Historique des tentatives (chronologique)

### ❌ Erreur #1 — `POST /v1/shipments` sans `additional_data` (mars 2026, commit `6ca28bf0d`)

```json
{
  "from": {...},
  "to": {...},
  "packages": [...],
  "service_id": 21293,
  "content": "...",
  "contentvalue": 326.55
}
```

**Résultat** : HTTP 200, référence créée MAIS état `AWAITING_COMPLETION`  
**Conséquence** : shipment invisible sur Packlink PRO, impossible à payer  
**Cause** : `additional_data` vide → Packlink ne calcule pas le prix, ne l'assigne pas à un service

---

### ❌ Erreur #2 — `POST /v1/drafts` (PR #738, 2026-04-23)

```json
{
  "from": {...},
  "to": {...},
  "packages": [...],
  "service_id": 21293,
  "content": "...",
  "contentvalue": 326.55
}
```

**Résultat** : HTTP 404 — cet endpoint n'existe PAS  
**Conséquence** : wizard complètement cassé en production  
**Cause** : l'endpoint `/v1/drafts` a peut-être existé un temps, il retourne 404 aujourd'hui

---

### ❌ Erreur #3 — `POST /v1/orders`

**Résultat** : HTTP 500 (UPS Standard), HTTP 400 si `contentvalue=0`  
**Tentatives** : service_id 21293, 30407, 20557 — toutes échouent  
**Raison inconnue** : l'endpoint existe mais refuse tous nos payloads  
**Note** : `contentvalue=0` est rejeté par Packlink regex : doit être > 0

---

### ✅ Solution qui fonctionne — `POST /v1/shipments` avec `additional_data` enrichi

**Implémentée dans** : `packages/@verone/common/src/lib/packlink/client.ts` méthode `createShipment()`  
**Déployée dans** : PR #741 (hotfix main 2026-04-23)

#### Payload complet

```json
{
  "carrier": "UPS",
  "service": "Standard",
  "service_id": 21293,
  "adult_signature": false,
  "additional_handling": false,
  "insurance": { "amount": 0, "insurance_selected": false },
  "print_in_store_selected": false,
  "proof_of_delivery": false,
  "priority": false,
  "additional_data": {
    "selectedWarehouseId": "12ef4d85-c109-46d5-a3ff-908f498b0ecf",
    "postal_zone_id_from": "76",
    "postal_zone_name_from": "France",
    "zip_code_id_from": "pc_fr_18018",
    "postal_zone_id_to": "76",
    "postal_zone_name_to": "France",
    "zip_code_id_to": "pc_fr_XXXX",
    "parcelIds": ["custom-parcel-id"]
  },
  "content": "Produits decoration et mobilier",
  "contentvalue": 326.55,
  "currency": "EUR",
  "from": {
    "country": "FR",
    "zip_code": "91300",
    "city": "Massy",
    "street1": "4 rue du Perou",
    "phone": "+33600000000",
    "email": "contact@veronecollections.fr",
    "name": "Verone",
    "surname": "Collections",
    "state": "France"
  },
  "packages": [
    {
      "weight": 7.8,
      "width": 23,
      "height": 25,
      "length": 35,
      "id": "custom-parcel-id",
      "name": "CUSTOM_PARCEL"
    }
  ],
  "to": {
    "country": "FR",
    "zip_code": "13002",
    "city": "Marseille",
    "street1": "9 Quai du Lazaret",
    "phone": "+33612345678",
    "email": "client@example.fr",
    "name": "Prénom",
    "surname": "Nom",
    "state": "France"
  },
  "has_customs": false,
  "shipment_custom_reference": "SO-2026-XXXXX",
  "source": "PRO"
}
```

**Clé** : les champs `additional_data` avec les IDs internes Packlink. Sans eux → `AWAITING_COMPLETION`.

---

## Résolution des IDs `additional_data`

Les IDs sont obtenus dynamiquement avant chaque création :

### 1. Warehouse ID (constant pour notre compte)

```bash
curl -H "Authorization: $PACKLINK_KEY" "https://api.packlink.com/v1/warehouses"
```

Notre warehouse : `12ef4d85-c109-46d5-a3ff-908f498b0ecf`  
`postal_zone.id` : `"76"` (France)  
`postal_code_id` : `"pc_fr_18018"` (Massy 91300)

### 2. Destination postal code ID

```bash
curl "https://api.packlink.com/v1/locations/postalcodes?language=fr_FR&postalzone=76&q=13002&platform=PRO&platform_country=FR" \
  -H "Authorization: $PACKLINK_KEY"
# → retourne [{ "id": "pc_fr_XXXX", "zipcode": "13002", "postal_zone_id": 76 }]
```

Utiliser `id` du premier résultat comme `zip_code_id_to`.  
Utiliser `String(postal_zone_id)` comme `postal_zone_id_to`.

---

## États Packlink — Signification

| État                   | Visible PRO | Payable | Description                                        |
| ---------------------- | ----------- | ------- | -------------------------------------------------- |
| `AWAITING_COMPLETION`  | ❌ Non      | ❌ Non  | Shipment incomplet, `additional_data` vide         |
| `READY_TO_PURCHASE`    | ✅ Oui      | ✅ Oui  | Shipment prêt, dans inbox "Prêts pour le paiement" |
| `READY_FOR_COLLECTION` | ✅ Oui      | ❌      | Payé, en attente collecte transporteur             |
| `DELIVERED`            | ✅ Oui      | ❌      | Livré                                              |

---

## Assurance — Comportement réel

**0.99€ d'assurance est TOUJOURS facturé par Packlink**, même avec `insurance_selected: false`.  
C'est la couverture de base obligatoire (responsabilité transporteur).

Ce que `insurance_selected: false` évite : l'assurance ADDITIONNELLE (2–5€ selon la valeur déclarée).  
Ce n'est PAS un bug de notre code. C'est le comportement de Packlink PRO.

---

## Variables importantes

```
API Key : 03df0c0d63fc1038eac7bf0964b2190b57460810d1025a38e4a54de57e804346 (veronebyromeo@gmail.com)
Warehouse ID : b1aa7d2c-8fbc-4942-a104-881266f16474 (alias: Verone Collections, email: romeo@veronecollections.fr)
Postal zone Verone : "76" (France)
URL API : https://api.packlink.com/v1
URL PRO web : https://pro.packlink.fr
```

---

## Services disponibles (testés et fonctionnels)

| service_id | Transporteur  | Nom              | Type     |
| ---------- | ------------- | ---------------- | -------- |
| 21293      | UPS           | Standard         | Domicile |
| 30407      | Mondial Relay | Domicile France  | Domicile |
| 20140      | DHL           | Domestic Express | Domicile |

Récupérer la liste complète :

```bash
curl "https://api.packlink.com/v1/services?from[country]=FR&from[zip]=91300&to[country]=FR&to[zip]=75002&packages[0][weight]=5&packages[0][width]=30&packages[0][height]=30&packages[0][length]=30" \
  -H "Authorization: $PACKLINK_KEY"
```

---

## Fichiers concernés dans le code

| Fichier                                                                              | Rôle                                                               |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `packages/@verone/common/src/lib/packlink/client.ts`                                 | Client API Packlink — `createShipment()` est la méthode principale |
| `apps/back-office/src/app/api/packlink/shipment/route.ts`                            | Route POST /api/packlink/shipment appelée par le wizard            |
| `packages/@verone/orders/src/components/forms/ShipmentWizard/handle-create-draft.ts` | Handler wizard qui appelle la route                                |
| `apps/back-office/src/app/api/packlink/services/route.ts`                            | Route GET /api/packlink/services (fonctionnelle, ne pas toucher)   |
| `apps/back-office/src/app/api/packlink/shipment/[ref]/sync/route.ts`                 | Sync on-demand Packlink → DB                                       |
| `apps/back-office/src/app/api/packlink/shipment/[ref]/cancel/route.ts`               | Annulation shipment                                                |

---

## Règles à NE JAMAIS violer

1. **JAMAIS appeler `POST /v1/drafts`** — retourne 404, n'existe pas
2. **JAMAIS `POST /v1/shipments` sans `additional_data`** — crée un shipment `AWAITING_COMPLETION` invisible
3. **JAMAIS `contentvalue = 0`** — Packlink rejette avec HTTP 400
4. **JAMAIS modifier `createShipment()` sans tester en production** — les erreurs sont invisibles côté back-office (Packlink retourne HTTP 200 même pour des shipments cassés)
5. **TOUJOURS vérifier sur pro.packlink.fr** qu'un shipment créé via l'API est visible dans "Prêts pour le paiement"

---

## Test end-to-end (procédure)

1. Ouvrir le back-office sur une commande validée sans expédition
2. Cliquer "Expédition" → choisir "Packlink"
3. Sélectionner un service
4. Valider
5. Vérifier sur https://pro.packlink.fr → section "Prêts pour le paiement"
6. Le shipment doit apparaître avec le bon référence et le bon montant

---

## Shipments de test supprimés (nettoyage 2026-04-23)

Ces références ont été créées pendant les tests de debug et supprimées :

- UN2026PRO0001430696 (AWAITING_COMPLETION — test session nov 2025)
- UN2026PRO0001424092 (fantôme — incident 2026-04-22)
- UN2026PRO0001438121, 438128, 438130, 438139 (tests debug 2026-04-23)
- UN2026PRO0001438144 (TEST-008, READY_TO_PURCHASE — prouve que la solution fonctionne)
- UN2026PRO0001438145 (TEST-009, READY_TO_PURCHASE — prouve que la solution fonctionne)
