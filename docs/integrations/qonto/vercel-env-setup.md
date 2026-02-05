# Configuration Variables d'Environnement Qonto sur Vercel

## Problème

Les endpoints `/api/qonto/*` retournent une erreur 500 en production avec le message:

```
OAuth mode requires QONTO_ACCESS_TOKEN.
Set QONTO_AUTH_MODE=api_key if using API Key authentication.
```

**Cause**: Les variables d'environnement Qonto ne sont pas configurées sur Vercel.

---

## Solution: Ajouter les Variables d'Environnement

### Étape 1: Accéder aux Paramètres Vercel

1. Ouvrir le dashboard Vercel du projet
2. Aller dans **Settings** → **Environment Variables**
3. Ou accéder directement via: https://vercel.com/verone2021s-projects/verone-back-office/settings/environment-variables

### Étape 2: Ajouter les 3 Variables Qonto

Ajouter chacune des variables suivantes pour **tous les environnements** (Production, Preview, Development):

| Variable                | Valeur                             | Description                                |
| ----------------------- | ---------------------------------- | ------------------------------------------ |
| `QONTO_AUTH_MODE`       | `api_key`                          | Mode d'authentification (api_key ou oauth) |
| `QONTO_ORGANIZATION_ID` | `verone-4819`                      | ID de l'organisation Qonto                 |
| `QONTO_API_KEY`         | `3d3f67599a1aec7c4379ba13fae6f5d9` | Clé API Qonto                              |

**Important**: Sélectionner les 3 environnements (Production, Preview, Development) pour chaque variable.

### Étape 3: Redéployer

Après avoir ajouté les variables:

1. Option A: Push un nouveau commit sur `main` (trigger auto-deploy)
2. Option B: Redéploiement manuel via Vercel Dashboard → Deployments → menu ⋮ → Redeploy

---

## Vérification

### Test 1: Health Check

```bash
curl https://verone-back-office.vercel.app/api/qonto/health
```

**Résultat attendu**:

```json
{
  "status": "healthy",
  "authMode": "api_key",
  "hasOrganizationId": true,
  "hasApiKey": true
}
```

### Test 2: Endpoints API

```bash
# Invoices
curl https://verone-back-office.vercel.app/api/qonto/invoices

# Quotes
curl https://verone-back-office.vercel.app/api/qonto/quotes

# Credit Notes
curl https://verone-back-office.vercel.app/api/qonto/credit-notes
```

**Résultat attendu**: Status 200 avec `{"success": true, ...}` (pas d'erreur 500)

### Test 3: Interface /factures

1. Ouvrir https://verone-back-office.vercel.app/factures
2. Cliquer sur chaque onglet:
   - **Factures**: Doit afficher la liste (ou "0 résultat")
   - **Devis**: Ne doit PAS afficher de message d'erreur OAuth
   - **Avoirs**: Ne doit PAS afficher de message d'erreur OAuth
   - **Factures manquantes**: Doit fonctionner (utilise Supabase, pas Qonto)

---

## Référence: Configuration Locale

Les variables sont définies dans `apps/back-office/.env.local` (gitignored):

```bash
QONTO_AUTH_MODE=api_key
QONTO_ORGANIZATION_ID=verone-4819
QONTO_API_KEY=3d3f67599a1aec7c4379ba13fae6f5d9
```

Le fichier `.env.example` documente le template pour les futurs développeurs.

---

## Troubleshooting

### Erreur persiste après redéploiement

- Vérifier que les 3 variables sont bien présentes dans Vercel
- Vérifier qu'elles sont activées pour l'environnement **Production**
- Vider le cache Vercel: Settings → Clear Vercel Cache

### Comment obtenir une nouvelle API Key Qonto

1. Se connecter sur https://app.qonto.com
2. Aller dans Settings → Integrations → API Keys
3. Créer une nouvelle clé avec les permissions:
   - Read invoices
   - Read quotes
   - Read credit notes

---

**Dernière mise à jour**: 2026-01-17
**Responsable**: Équipe Dev Back-Office
