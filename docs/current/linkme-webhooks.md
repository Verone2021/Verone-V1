# LinkMe - Webhooks Revolut

Documentation du workflow de webhook Revolut pour la gestion des paiements LinkMe.

## Overview

LinkMe utilise Revolut Merchant API pour le traitement des paiements. Les webhooks permettent de synchroniser automatiquement les commandes et commissions apres confirmation du paiement.

## Endpoint

```
POST /api/webhook/revolut
```

**Fichier source**: `apps/linkme/src/app/api/webhook/revolut/route.ts`

## Types d'evenements

| Evenement | Description | Action |
|-----------|-------------|--------|
| `ORDER_COMPLETED` | Paiement confirme et capture | Creation commande + commission |
| `ORDER_AUTHORISED` | Paiement autorise (pre-capture) | Log uniquement (en mode automatique, suivi de COMPLETED) |
| `ORDER_PAYMENT_DECLINED` | Paiement refuse | Log pour analyse |
| `ORDER_PAYMENT_FAILED` | Echec technique | Log + notification eventuelle |
| `ORDER_CANCELLED` | Commande annulee | Annulation commande en attente |

## Workflow ORDER_COMPLETED

Sequence de traitement lors d'un paiement confirme:

```
1. Reception webhook Revolut
   ↓
2. Verification signature (revolut-signature header)
   ↓
3. Recuperation details commande depuis Revolut API
   ↓
4. Extraction metadata:
   - affiliate_id
   - selection_id
   - merchant_order_ext_ref
   ↓
5. Creation dans sales_orders:
   - source_channel: 'linkme'
   - status: 'confirmed'
   - payment_status: 'paid'
   ↓
6. Creation commission (si affiliate_id present):
   - linkme_commissions.affiliate_commission
   - linkme_commissions.linkme_commission
   - status: 'pending'
```

## Securite

### Verification de signature

```typescript
const signature = headers.get('revolut-signature');
const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
```

La signature est calculee via HMAC-SHA256 du body avec le secret configure.

### Variables d'environnement requises

```bash
REVOLUT_WEBHOOK_SECRET=    # Secret pour verification signature
SUPABASE_SERVICE_ROLE_KEY= # Acces admin pour creation commandes
```

## Structure des donnees

### Payload webhook

```typescript
interface RevolutWebhookEvent {
  event: 'ORDER_COMPLETED' | 'ORDER_AUTHORISED' | ...;
  order_id: string;           // ID Revolut de la commande
  merchant_order_ext_ref?: string;  // Notre reference interne
  timestamp: string;
}
```

### Metadata envoyees a Revolut

Lors de la creation de commande, on envoie:

```typescript
metadata: {
  affiliate_id: string;   // ID de l'affilie LinkMe
  selection_id: string;   // ID de la selection
}
```

Ces metadata sont retournees dans le webhook pour lier commande et commission.

## Calcul des commissions

Le webhook calcule automatiquement:

1. **Commission affilié** = `order_amount_ht × margin_rate`
2. **Commission LinkMe** = `order_amount_ht × linkme_commission_rate`

Les taux sont recuperes depuis `linkme_affiliates`:
- `default_margin_rate`: taux de marge par defaut de l'affilie
- `linkme_commission_rate`: commission plateforme LinkMe

**Note**: Le calcul utilise le taux de marge simple (pas le taux de marque) car c'est sur le montant HT de la commande, pas sur le prix de base.

## Tables impactees

| Table | Action | Description |
|-------|--------|-------------|
| `sales_orders` | INSERT | Creation de la commande confirmee |
| `linkme_commissions` | INSERT | Creation de la commission affilie |

## Error Handling

| Code HTTP | Scenario | Comportement |
|-----------|----------|--------------|
| 200 | Succes | `{ received: true }` |
| 401 | Signature invalide | Rejet, log erreur |
| 500 | Erreur traitement | Log erreur, Revolut retente |

### Retry policy (cote Revolut)

Revolut retente automatiquement les webhooks en cas d'echec (5xx):
- 1ere retry: 5 min
- 2eme retry: 30 min
- 3eme retry: 2h
- Max: 24h

## Tests

### Payload exemple (ORDER_COMPLETED)

```json
{
  "event": "ORDER_COMPLETED",
  "order_id": "6516c9dc-0bab-a0e3-8fd3-78ca53f8f645",
  "merchant_order_ext_ref": "LM-2026-001234",
  "timestamp": "2026-01-21T10:30:00Z"
}
```

### Test local avec cURL

```bash
curl -X POST http://localhost:3002/api/webhook/revolut \
  -H "Content-Type: application/json" \
  -H "revolut-signature: test-signature" \
  -d '{
    "event": "ORDER_COMPLETED",
    "order_id": "test-order-id",
    "timestamp": "2026-01-21T10:30:00Z"
  }'
```

## Monitoring

### Logs a surveiller

```
"Received Revolut webhook: ORDER_COMPLETED for order: xxx"
"Sales order created: xxx"
"Commission created for affiliate: xxx"
```

### Erreurs frequentes

1. **Invalid signature**: Verifier `REVOLUT_WEBHOOK_SECRET`
2. **Could not fetch order details**: API Revolut inaccessible
3. **Error creating sales order**: Contrainte DB (doublon reference?)

## Configuration Revolut

1. Aller sur Revolut Business Dashboard > Developer
2. Configurer webhook URL: `https://linkme.verone.io/api/webhook/revolut`
3. Selectionner les evenements: `ORDER_COMPLETED`, `ORDER_CANCELLED`
4. Recuperer le Webhook Secret et le configurer dans `.env`

---

**Derniere mise a jour**: 2026-01-21
