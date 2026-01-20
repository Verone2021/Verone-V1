# Configuration Variables d'Environnement Qonto - Vercel

## 🎯 Objectif

Corriger les erreurs 500 des API Qonto en production (`/api/qonto/balance`, `/api/qonto/transactions`, etc.).

## ⚠️ Problème Identifié

Les variables d'environnement Qonto ne sont pas configurées sur Vercel, causant :
- ❌ `/api/qonto/balance` → 500 Error
- ❌ `/api/qonto/transactions` → 500 Error
- ❌ Pages Trésorerie/Factures → "Aucune donnée"

## 📋 Variables à Configurer

### URL Vercel Dashboard

```
https://vercel.com/verone2021s-projects/verone-back-office/settings/environment-variables
```

### Variables Requises

| Variable | Valeur | Description |
|----------|--------|-------------|
| `QONTO_AUTH_MODE` | `api_key` | Mode d'authentification Qonto |
| `QONTO_ORGANIZATION_ID` | `verone-4819` | ID organisation Qonto |
| `QONTO_API_KEY` | `3d3f67599a1aec7c4379ba13fae6f5d9` | Clé API Qonto (depuis .env.local ligne 111) |

### Environnements

Configurer pour **tous les environnements** :
- ✅ Production
- ✅ Preview
- ✅ Development

## 🔧 Étapes de Configuration

### 1. Accéder au Dashboard Vercel

1. Ouvrir : https://vercel.com/verone2021s-projects/verone-back-office
2. Aller dans : **Settings** → **Environment Variables**

### 2. Ajouter QONTO_AUTH_MODE

- Cliquer sur **Add New**
- **Name**: `QONTO_AUTH_MODE`
- **Value**: `api_key`
- **Environments**: Cocher **Production**, **Preview**, **Development**
- Cliquer sur **Save**

### 3. Ajouter QONTO_ORGANIZATION_ID

- Cliquer sur **Add New**
- **Name**: `QONTO_ORGANIZATION_ID`
- **Value**: `verone-4819`
- **Environments**: Cocher **Production**, **Preview**, **Development**
- Cliquer sur **Save**

### 4. Ajouter QONTO_API_KEY

- Cliquer sur **Add New**
- **Name**: `QONTO_API_KEY`
- **Value**: `3d3f67599a1aec7c4379ba13fae6f5d9`
- **Environments**: Cocher **Production**, **Preview**, **Development**
- Cliquer sur **Save**

### 5. Forcer Redéploiement

Après avoir configuré les 3 variables :

**Option A** (Automatique via commit) :
```bash
# Un commit vide forcera un redéploiement
echo "# Force deploy after Qonto env vars $(date)" >> .vercel-trigger
git add .vercel-trigger
git commit -m "[BO-INT-001] chore: force deploy after Qonto env vars config"
git push origin main
```

**Option B** (Manuel via Vercel Dashboard) :
1. Aller dans **Deployments**
2. Cliquer sur le dernier déploiement
3. Cliquer sur **...** (menu)
4. Cliquer sur **Redeploy**
5. Confirmer

## ✅ Vérification

### 1. Vérifier API Balance

```bash
curl https://verone-back-office.vercel.app/api/qonto/balance | jq
```

**Résultat attendu** :
```json
{
  "success": true,
  "accounts": [...],
  "totalBalance": 123.45,
  "currency": "EUR"
}
```

### 2. Vérifier Page Trésorerie

1. Ouvrir : https://verone-back-office.vercel.app/tresorerie
2. Vérifier que "Vos Comptes Qonto" affiche le solde (pas "0,00 €")
3. Vérifier console browser : 0 erreurs 500

### 3. Vérifier Autres Routes Qonto

Routes impactées (39 routes corrigées) :
- ✅ `/api/qonto/balance`
- ✅ `/api/qonto/transactions`
- ✅ `/api/qonto/invoices/**`
- ✅ `/api/qonto/quotes/**`
- ✅ `/api/qonto/credit-notes/**`
- ✅ `/api/qonto/status`

## 🔒 Sécurité

**Note** : Ces valeurs proviennent de `/apps/back-office/.env.local` (lignes 109-126).

**Recommandation** :
- ⚠️ Ne jamais commiter `.env.local` dans Git
- ⚠️ Rotation de la clé API Qonto tous les 6 mois
- ⚠️ Utiliser Vercel Secrets pour les valeurs sensibles en production

## 📚 Références

- Qonto API Documentation: https://api-doc.qonto.com/
- Variables d'environnement configurées : `/apps/back-office/.env.local` (lignes 109-126)
- Plan de correction : `/docs/plan-correction-production-2026-01-17.md`

---

**Date de création** : 2026-01-17
**Auteur** : Claude (Fix Production Critical Issues)
**Status** : ⚠️ ACTION REQUISE - Variables doivent être configurées manuellement sur Vercel
