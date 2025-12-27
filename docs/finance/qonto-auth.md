# Qonto API Authentication

**Date**: 2025-12-27
**Statut**: Production
**API Version**: Business API v2

---

## ⚠️ RÈGLE ABSOLUE - UN SEUL MODE

**CHOIX FINAL (2025-12-27)**: Verone utilise **UNIQUEMENT OAuth**.

```bash
# .env.local - CONFIGURATION UNIQUE
QONTO_AUTH_MODE=oauth
QONTO_ACCESS_TOKEN=<votre_access_token>

# NE PAS DÉFINIR (supprimé pour éviter conflit):
# QONTO_ORGANIZATION_ID=xxx  ← NE PAS UTILISER
# QONTO_API_KEY=xxx          ← NE PAS UTILISER
```

### Pourquoi un seul mode ?

Le code auto-détecte le mode si les variables sont définies:

- Si `QONTO_ORGANIZATION_ID` + `QONTO_API_KEY` → utilise API Key (legacy)
- Si `QONTO_ACCESS_TOKEN` → utilise OAuth

**Problème**: Si les deux sont définis → comportement imprévisible = "Auth conflict"

**Solution**: Ne définir QUE les variables OAuth.

---

## Configuration Production (Vercel)

```bash
# Variables à définir dans Vercel Dashboard
QONTO_AUTH_MODE=oauth
QONTO_ACCESS_TOKEN=<token_from_qonto_oauth>

# Variables à SUPPRIMER si elles existent:
# - QONTO_ORGANIZATION_ID
# - QONTO_API_KEY
```

### Vérifier la configuration

```bash
# Via API health check
curl https://votre-app.vercel.app/api/qonto/health

# Réponse attendue:
{
  "healthy": true,
  "authMode": "oauth",
  "timestamp": "2025-12-27T..."
}
```

---

## Obtenir un Access Token OAuth

### Option 1: Via Qonto Dashboard

1. Connectez-vous à [Qonto Dashboard](https://app.qonto.com)
2. Paramètres → Intégrations & API
3. Section "OAuth Applications"
4. Générer un nouveau token

### Option 2: Via OAuth Flow

```typescript
// 1. Redirect user to Qonto auth
const authUrl =
  'https://oauth.qonto.com/authorize?' +
  new URLSearchParams({
    client_id: process.env.QONTO_CLIENT_ID,
    redirect_uri: 'https://your-app.com/api/qonto/callback',
    response_type: 'code',
    scope: 'read_transactions write_transactions',
  });

// 2. Exchange code for token (in callback)
const tokenResponse = await fetch('https://oauth.qonto.com/token', {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    client_id: process.env.QONTO_CLIENT_ID,
    client_secret: process.env.QONTO_CLIENT_SECRET,
    redirect_uri: 'https://your-app.com/api/qonto/callback',
  }),
});

const { access_token, refresh_token } = await tokenResponse.json();
```

---

## API Key (DEPRECATED)

> ⚠️ **NE PLUS UTILISER** - Conservé pour référence uniquement.

L'API Key était utilisée avant OAuth:

```bash
# DEPRECATED - NE PAS UTILISER
QONTO_AUTH_MODE=api_key
QONTO_ORGANIZATION_ID=verone-4819
QONTO_API_KEY=sk_live_xxx
```

### Migration API Key → OAuth

1. Générer un OAuth token (voir ci-dessus)
2. Remplacer les variables:

   ```bash
   # Supprimer
   vercel env rm QONTO_ORGANIZATION_ID production
   vercel env rm QONTO_API_KEY production

   # Ajouter
   vercel env add QONTO_AUTH_MODE production   # valeur: oauth
   vercel env add QONTO_ACCESS_TOKEN production
   ```

3. Redéployer

---

## Sécurité

### Règles Absolues

1. **JAMAIS** de token dans le code source
2. **JAMAIS** de token dans les logs
3. **JAMAIS** de token dans les commandes CLI visibles
4. **TOUJOURS** utiliser les variables d'environnement

### Rotation des Tokens

- **Fréquence**: Tous les 90 jours
- **Immédiatement** si suspicion de fuite

### En cas de fuite

1. Révoquer immédiatement dans Qonto Dashboard
2. Générer nouveau token
3. Mettre à jour Vercel env vars
4. Redéployer
5. Audit des transactions récentes

---

## Health Check

### Endpoint

```
GET /api/qonto/health
```

### Réponses

```json
// Succès
{
  "healthy": true,
  "authMode": "oauth",
  "timestamp": "2025-12-27T10:00:00Z",
  "bankAccountsCount": 2
}

// Erreur config
{
  "healthy": false,
  "authMode": "oauth",
  "error": "OAuth mode requires QONTO_ACCESS_TOKEN",
  "timestamp": "2025-12-27T10:00:00Z"
}
```

---

## Références

- [Qonto API Documentation](https://docs.qonto.com)
- [Qonto OAuth Guide](https://docs.qonto.com/oauth)

---

_Mis à jour: 2025-12-27 - OAuth uniquement, API Key deprecated_
