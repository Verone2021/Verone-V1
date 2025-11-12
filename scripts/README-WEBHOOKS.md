# Packlink Webhook Registration

## 📋 Vue d'ensemble

Ce script enregistre l'URL webhook Vérone auprès de Packlink pour recevoir les événements de tracking en temps réel.

## 🎯 Événements Reçus

| Événement                  | Description                | Action Automatique                        |
| -------------------------- | -------------------------- | ----------------------------------------- |
| `shipment.label.ready`     | Étiquette PDF générée      | Maj status → `READY_FOR_SHIPPING`         |
| `shipment.tracking.update` | Mise à jour tracking       | Maj status + création tracking event      |
| `shipment.delivered`       | Livraison effectuée        | Maj status → `DELIVERED` + `delivered_at` |
| `shipment.carrier.success` | Transporteur enregistré    | Maj status → `PROCESSING`                 |
| `shipment.carrier.fail`    | Échec transporteur         | Maj status → `INCIDENT` + notes erreur    |
| `shipment.label.fail`      | Échec génération étiquette | Maj status → `INCIDENT` + notes erreur    |

## 🔧 Prérequis

### 1. Variables d'environnement

Ajouter dans `.env.local` :

```bash
# Packlink API
PACKLINK_API_KEY=your_packlink_api_key_here
PACKLINK_ENVIRONMENT=sandbox  # ou "production"

# Application URL
NEXT_PUBLIC_APP_URL=https://verone-v1.vercel.app

# Webhook Secret (optionnel mais recommandé)
PACKLINK_WEBHOOK_SECRET=your_random_secret_here
```

### 2. Installation dépendances

```bash
# Si tsx n'est pas installé
npm install -g tsx

# Ou utiliser npx
npx tsx scripts/setup-packlink-webhook.ts
```

## 🚀 Usage

### Sandbox (Test)

```bash
tsx scripts/setup-packlink-webhook.ts sandbox
```

### Production

```bash
tsx scripts/setup-packlink-webhook.ts production
```

### Auto-détection environnement (depuis .env)

```bash
tsx scripts/setup-packlink-webhook.ts
```

## 📝 Workflow Complet

### 1. Configuration Initiale

```bash
# 1. Obtenir clé API Packlink (dashboard Packlink)
# 2. Ajouter PACKLINK_API_KEY dans .env.local
# 3. Générer secret webhook (optionnel)
openssl rand -hex 32

# 4. Ajouter PACKLINK_WEBHOOK_SECRET dans .env.local
```

### 2. Déployer Application

```bash
# Vérifier route webhook existe
curl https://verone-v1.vercel.app/api/webhooks/packlink \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"test","created_at":"2025-11-12T10:00:00Z","data":{"shipment_reference":"TEST"}}'

# Résultat attendu: {"received":true,"warning":"Shipment not found"}
```

### 3. Enregistrer Webhook

```bash
# Sandbox (test)
tsx scripts/setup-packlink-webhook.ts sandbox

# Si succès, output:
# ✅ SUCCÈS - Webhook enregistré avec succès !
#    URL: https://verone-v1.vercel.app/api/webhooks/packlink
#    Environment: sandbox
```

### 4. Tester Réception Événements

```bash
# Créer shipment test via API ou dashboard Packlink

# Vérifier logs Next.js
# [Packlink Webhook] Received event: shipment.label.ready

# Vérifier table Supabase
psql -h aws-1-eu-west-3.pooler.supabase.com \
     -U postgres.pznybkhwzwcdagyhijmo \
     -d postgres \
     -c "SELECT * FROM shipment_tracking_events ORDER BY created_at DESC LIMIT 5;"
```

## 🐛 Troubleshooting

### Erreur "PACKLINK_API_KEY manquant"

**Solution** :

```bash
# Vérifier .env.local
cat .env.local | grep PACKLINK_API_KEY

# Si manquant, ajouter
echo "PACKLINK_API_KEY=your_key_here" >> .env.local
```

### Erreur "Endpoint webhook non accessible"

**Causes possibles** :

1. Application non déployée sur Vercel
2. Route `/api/webhooks/packlink` manquante
3. Firewall bloque requêtes POST

**Solution** :

```bash
# Tester route manuellement
curl -X POST https://verone-v1.vercel.app/api/webhooks/packlink \
  -H "Content-Type: application/json" \
  -d '{"name":"test","created_at":"2025-11-12T10:00:00Z","data":{"shipment_reference":"TEST"}}'

# Résultat attendu: {"received":true,...}
```

### Erreur "Webhook non enregistré" (API Packlink)

**Causes possibles** :

1. Clé API invalide
2. URL webhook non accessible depuis internet (localhost)
3. Format URL incorrect

**Solution** :

```bash
# Vérifier clé API via API Packlink
curl -X GET https://api.packlink.com/v1/services \
  -H "Authorization: your_api_key"

# Si 401 → Clé invalide
# Si 200 → Clé valide
```

### Webhooks non reçus après registration

**Diagnostic** :

```bash
# 1. Vérifier logs Vercel
vercel logs

# 2. Vérifier logs Supabase (table shipment_tracking_events)
# 3. Tester manuellement avec curl
curl -X POST https://verone-v1.vercel.app/api/webhooks/packlink \
  -H "Content-Type: application/json" \
  -d '{
    "name": "shipment.tracking.update",
    "created_at": "2025-11-12T10:30:00Z",
    "data": {
      "shipment_reference": "DE567YH981230AA",
      "status": "IN_TRANSIT",
      "city": "Paris"
    }
  }'
```

## 📊 Vérification Registration

### Option 1: Dashboard Packlink

1. Se connecter dashboard Packlink
2. Settings → Webhooks
3. Vérifier URL enregistrée : `https://verone-v1.vercel.app/api/webhooks/packlink`

### Option 2: Test Programmatique

```typescript
import { getPacklinkClient } from '@/lib/packlink/client';

const client = getPacklinkClient();

// Créer shipment test
const order = await client.createOrder({
  order_custom_reference: 'VERONE-TEST-001',
  shipments: [
    {
      /* ... */
    },
  ],
});

// Attendre événements webhook (5-30s)
// Vérifier table shipment_tracking_events
```

## 🔐 Sécurité Webhook

### Secret Webhook (Recommandé)

```bash
# Générer secret fort
openssl rand -hex 32

# Ajouter dans .env.local
PACKLINK_WEBHOOK_SECRET=a7f3d9e2b1c4f6a8d5e7b9c1a3f5d7e9b2c4a6f8d1e3b5c7a9f1d3e5b7c9a1f3
```

### Validation Signature (À implémenter)

```typescript
// Dans /api/webhooks/packlink/route.ts
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('X-Packlink-Signature');
  const secret = process.env.PACKLINK_WEBHOOK_SECRET;

  if (secret && signature) {
    const payload = await request.text();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  // ... reste du code
}
```

## 📚 Ressources

- **Documentation Packlink API** : https://github.com/wout/packlink.cr
- **Webhook Handler** : `apps/back-office/src/app/api/webhooks/packlink/route.ts`
- **Packlink Client** : `apps/back-office/src/lib/packlink/client.ts`
- **Database Schema** : `docs/database/SCHEMA-REFERENCE.md` (shipments, shipment_tracking_events)

## ✅ Checklist Post-Registration

- [ ] Script exécuté sans erreur
- [ ] Webhook URL visible dans dashboard Packlink
- [ ] Route `/api/webhooks/packlink` accessible publiquement
- [ ] Variables environnement configurées (.env.local + Vercel)
- [ ] Test shipment créé avec succès
- [ ] Événements reçus dans logs Next.js
- [ ] Tracking events enregistrés dans Supabase
- [ ] Statuts shipments mis à jour automatiquement
- [ ] Secret webhook configuré (si production)

## 🔄 Re-registration

Si webhook URL change (nouveau domaine, nouveau environnement) :

```bash
# Re-exécuter script avec nouveau NEXT_PUBLIC_APP_URL
tsx scripts/setup-packlink-webhook.ts production
```

Packlink écrasera l'ancienne registration automatiquement.
