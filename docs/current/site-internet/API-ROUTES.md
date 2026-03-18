# Site Internet Vérone — API Routes

## Routes

| Méthode | Path                                   | Description                                       | Auth             |
| ------- | -------------------------------------- | ------------------------------------------------- | ---------------- |
| POST    | `/api/checkout`                        | Crée session Stripe Checkout                      | Non              |
| POST    | `/api/contact`                         | Envoie message contact + email confirmation       | Non              |
| POST    | `/api/promo/validate`                  | Valide un code promo                              | Non              |
| POST    | `/api/account/export`                  | Export données personnelles (RGPD)                | Oui              |
| POST    | `/api/webhooks/stripe`                 | Webhook Stripe (payment_intent.succeeded, etc.)   | Stripe signature |
| POST    | `/api/emails/welcome`                  | Email bienvenue après inscription                 | Service          |
| POST    | `/api/emails/order-confirmation`       | Email confirmation commande                       | Service          |
| POST    | `/api/emails/admin-order-notification` | Notification admin nouvelle commande              | Service          |
| POST    | `/api/emails/shipping-notification`    | Email expédition                                  | Service          |
| POST    | `/api/emails/delivery-confirmation`    | Email livraison confirmée                         | Service          |
| POST    | `/api/emails/order-status-update`      | Email changement statut commande                  | Service          |
| POST    | `/api/emails/abandoned-cart`           | Email panier abandonné                            | Service          |
| POST    | `/api/emails/review-request`           | Email demande d'avis                              | Service          |
| POST    | `/api/emails/win-back`                 | Email win-back (inactif 30j)                      | Service          |
| POST    | `/api/emails/contact-confirmation`     | Email confirmation contact                        | Service          |
| GET     | `/api/cron/abandoned-cart-check`       | Cron : détecte paniers abandonnés (24h)           | Cron secret      |
| GET     | `/api/cron/review-request-check`       | Cron : envoie demandes d'avis (7j post-livraison) | Cron secret      |
| GET     | `/api/cron/win-back-check`             | Cron : détecte clients inactifs (30j)             | Cron secret      |

## Auth Levels

- **Non** : Route publique, aucune auth requise
- **Oui** : Supabase auth token requis (cookie SSR)
- **Service** : Appelé en interne (Stripe webhook, cron, ou autre API route)
- **Cron secret** : Header `Authorization: Bearer CRON_SECRET` requis
- **Stripe signature** : Vérification webhook signature Stripe

## Patterns

### Checkout Flow

```
Client → POST /api/checkout → Stripe Session → Redirect Stripe
Stripe → POST /api/webhooks/stripe → Update DB → POST /api/emails/order-confirmation
```

### Email Flow

```
Trigger (webhook/cron/form) → POST /api/emails/[type] → Resend API → Email sent
```

### Cron Jobs

```
Vercel Cron → GET /api/cron/[job] → Query DB → POST /api/emails/[type] per match
```
