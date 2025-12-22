# Qonto API Authentication

**Date**: 2025-12-22
**Statut**: Production
**API Version**: Business API v2

---

## Strategie d'Authentification

### Modes d'Authentification Supportes

Verone supporte **deux modes** d'authentification Qonto :

| Mode | Header | Variable d'Env | Recommande |
|------|--------|----------------|------------|
| **OAuth** (defaut) | `Authorization: Bearer <token>` | `QONTO_ACCESS_TOKEN` | Oui |
| **API Key** | `Authorization: <orgId>:<apiKey>` | `QONTO_ORGANIZATION_ID` + `QONTO_API_KEY` | Non |

### Configuration du Mode

```bash
# Mode OAuth (defaut) - recommande pour Business API
QONTO_AUTH_MODE=oauth
QONTO_ACCESS_TOKEN=<votre_access_token>

# OU Mode API Key (legacy)
QONTO_AUTH_MODE=api_key
QONTO_ORGANIZATION_ID=verone-4819
QONTO_API_KEY=<votre_api_key>
```

### Pourquoi OAuth est Recommande ?

1. **Securite**: Tokens expirent (1h), moins de risque si fuite
2. **Conformite**: Business API officielle de Qonto
3. **Fonctionnalites**: Acces complet aux endpoints v2
4. **Audit**: Meilleure tracabilite des appels

### Quand utiliser API Key ?

- Tests rapides en developpement
- Si vous n'avez pas encore configure OAuth
- Pour compatibilite avec anciens scripts

---

## Variables d'Environnement

```bash
# REQUIS
QONTO_ORGANIZATION_ID=verone-4819
QONTO_API_KEY=<votre_cle_api>

# OPTIONNEL (valeurs par defaut dans le code)
QONTO_API_BASE_URL=https://thirdparty.qonto.com/v2
QONTO_ENVIRONMENT=production
QONTO_TIMEOUT_MS=30000
QONTO_MAX_RETRIES=3
```

### Ou trouver les credentials ?

1. Connectez-vous a [Qonto Dashboard](https://app.qonto.com)
2. Allez dans **Parametres** → **Integrrations & API**
3. Section **API** → Cliquez sur **Afficher la cle**
4. L'Organization ID est le **slug** visible dans l'URL: `app.qonto.com/organizations/{slug}/...`

---

## Format du Header Authorization

```typescript
// Construction du header
const credentials = `${organizationId}:${apiKey}`;
const authHeader = credentials; // PAS de Base64 pour Qonto Thirdparty API

// Exemple de requete
fetch('https://thirdparty.qonto.com/v2/organization', {
  headers: {
    'Authorization': `verone-4819:sk_live_xxxxx`,
    'Content-Type': 'application/json'
  }
});
```

---

## Rotation des Cles API

### Frequence Recommandee

- **Tous les 90 jours** en conditions normales
- **Immediatement** si suspicion de fuite

### Procedure de Rotation

1. **Generer nouvelle cle** dans Qonto Dashboard
   - Parametres → Integrations & API → Regenerer la cle

2. **Mettre a jour les secrets**
   ```bash
   # Local
   # Editer .env.local avec la nouvelle cle

   # Vercel Production
   vercel env rm QONTO_API_KEY production
   vercel env add QONTO_API_KEY production
   # Coller la nouvelle cle

   # Vercel Preview
   vercel env rm QONTO_API_KEY preview
   vercel env add QONTO_API_KEY preview
   ```

3. **Verifier la connexion**
   ```bash
   # Utiliser le health check
   curl -X GET "https://your-app.vercel.app/api/qonto/health"
   ```

4. **L'ancienne cle est automatiquement revoquee** par Qonto lors de la regeneration

### En cas de fuite

Si une cle API a ete exposee (commit git, log, etc.):

1. **Action immediate**: Regenerer la cle dans Qonto Dashboard
2. **Audit**: Verifier les transactions recentes pour anomalies
3. **Mise a jour**: Deployer les nouveaux secrets
4. **Post-mortem**: Documenter l'incident et mesures correctives

---

## Implementation dans le Code

### Client Qonto

```typescript
// packages/@verone/integrations/src/qonto/client.ts

export class QontoClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(config: QontoConfig) {
    this.baseUrl = config.baseUrl ?? 'https://thirdparty.qonto.com/v2';
    this.authHeader = `${config.organizationId}:${config.apiKey}`;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new QontoApiError(response.status, await response.text());
    }

    return response.json();
  }
}
```

### Factory avec validation

```typescript
// packages/@verone/integrations/src/qonto/client.ts

export function getQontoClient(): QontoClient {
  const organizationId = process.env.QONTO_ORGANIZATION_ID;
  const apiKey = process.env.QONTO_API_KEY;

  if (!organizationId || !apiKey) {
    throw new Error(
      'QONTO_ORGANIZATION_ID et QONTO_API_KEY doivent etre definis'
    );
  }

  return new QontoClient({
    organizationId,
    apiKey,
    baseUrl: process.env.QONTO_API_BASE_URL,
  });
}
```

---

## Health Check

### Endpoint recommande

```typescript
// apps/back-office/src/app/api/qonto/health/route.ts

import { getQontoClient } from '@verone/integrations/qonto';

export async function GET() {
  try {
    const client = getQontoClient();
    const org = await client.getOrganization();

    return Response.json({
      status: 'healthy',
      organization: org.name,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
```

### Test manuel

```bash
# Via curl
curl -s "https://thirdparty.qonto.com/v2/organization" \
  -H "Authorization: verone-4819:$QONTO_API_KEY" \
  | jq '.organization.name'

# Resultat attendu: "Verone SASU" ou similaire
```

---

## Securite

### Regles Absolues

1. **JAMAIS** de cle API dans le code source
2. **JAMAIS** de cle API dans les logs
3. **TOUJOURS** utiliser les variables d'environnement
4. **TOUJOURS** valider cote serveur (jamais cote client)

### Fichiers a verifier

```bash
# Verifier qu'aucune cle n'est commitee
git grep -i "qonto" --all-match -- "*.ts" "*.tsx" "*.js" | grep -v ".env"

# Verifier les fichiers ignores
cat .gitignore | grep -E "env|secret"
```

### .gitignore requis

```gitignore
# Secrets
.env
.env.local
.env.*.local
*.secret
```

---

## Endpoints Principaux

| Endpoint | Methode | Description |
|----------|---------|-------------|
| `/organization` | GET | Info organisation |
| `/bank_accounts` | GET | Liste comptes bancaires |
| `/transactions` | GET | Liste transactions |
| `/transactions/{id}/attachments` | POST | Upload piece jointe |
| `/client_invoices` | GET/POST | Factures clients |
| `/supplier_invoices/bulk` | POST | Upload factures fournisseurs |
| `/clients` | GET/POST | Gestion clients |
| `/labels` | GET | Etiquettes/categories |

---

## References

- [Qonto API Documentation](https://docs.qonto.com)
- [Qonto API Reference](https://docs.qonto.com/faq-articles/api-questions/api-questions-reference)
- [Qonto Security Best Practices](https://qonto.com/security)
