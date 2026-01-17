---
id: BO-INT-001
app: back-office
domain: INT
status: in_progress
priority: critical
created: 2026-01-17
commits: []
---

# BO-INT-001 — Fix Qonto API 500 Error en Production

## Context

Les endpoints `/api/qonto/*` retournent une erreur 500 en production:
- `/api/qonto/invoices` → 500 (retry 4x failed)
- `/api/qonto/quotes` → 500
- `/api/qonto/credit-notes` → 500

**Message d'erreur**:
```
OAuth mode requires QONTO_ACCESS_TOKEN.
Set QONTO_AUTH_MODE=api_key if using API Key authentication.
```

**Root Cause**: Variables d'environnement Qonto manquantes sur Vercel.

En local, les variables sont définies dans `.env.local` (gitignored), donc le code fonctionne.
En production, `.env.local` n'est pas déployé → variables `undefined` → fallback à `oauth` → erreur.

## Solution

Ajouter les 3 variables d'environnement Qonto dans Vercel Dashboard:
1. `QONTO_AUTH_MODE=api_key`
2. `QONTO_ORGANIZATION_ID=verone-4819`
3. `QONTO_API_KEY=3d3f67599a1aec7c4379ba13fae6f5d9`

## Implementation

- [x] Mettre à jour `.env.example` avec template Qonto
- [x] Créer guide Vercel: `docs/integrations/vercel-env-qonto-setup.md`
- [x] Vérifier code API routes (aucune modification nécessaire)
- [x] Créer task tracking file `.tasks/BO-INT-001.md`
- [ ] Run type-check & build
- [ ] Créer PR avec documentation
- [ ] Configurer variables d'environnement sur Vercel
- [ ] Redéployer application
- [ ] Vérifier endpoints en production

## Verification

### Après configuration Vercel & redéploiement:

**Test 1: Health Check**
```bash
curl https://verone-back-office.vercel.app/api/qonto/health
```
Attendu: `{"status":"healthy","authMode":"api_key"}`

**Test 2: Endpoints API**
```bash
curl https://verone-back-office.vercel.app/api/qonto/quotes
```
Attendu: Status 200 avec `{"success": true, ...}`

**Test 3: Interface /factures**
- Ouvrir https://verone-back-office.vercel.app/factures
- Cliquer onglet "Devis" → Ne doit PAS afficher erreur OAuth
- Cliquer onglet "Avoirs" → Ne doit PAS afficher erreur OAuth

## Files Modified

- `apps/back-office/.env.example` - Ajout template Qonto
- `docs/integrations/vercel-env-qonto-setup.md` - Nouveau guide
- `.tasks/BO-INT-001.md` - Ce fichier

## Notes

- Aucune modification de code nécessaire
- Le code Qonto est correct, c'est uniquement un problème de configuration
- Guide Vercel créé pour éviter ce problème à l'avenir
