# 🔐 Google Merchant Service Account - Credentials Extracted

**Date création** : 2025-10-10
**Service Account** : google-merchant-verone
**Project** : make-gmail-integration-428317
**Fichier JSON** : `make-gmail-integration-428317-58090fe706f9.json`

---

## ✅ Variables pour .env.local

Voici les 5 variables extraites du fichier JSON téléchargé. À copier-coller dans votre `.env.local` :

```bash
# ---------- GOOGLE MERCHANT CENTER ----------
# Service Account Email (JSON: client_email)
GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL="google-merchant-verone@make-gmail-integration-428317.iam.gserviceaccount.com"

# Private Key (JSON: private_key)
# ⚠️ CRITIQUE: Garder les \n littéraux (échappés), pas de retours à la ligne réels
GOOGLE_MERCHANT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDF9lXrO0baWCrE\nWr49Uvx+Kq1lSd/1YaK2olQ3fWaeARwIs9S26HNR87i3/pq+8Mo3kUS9Be83RtyV\nJWnubBUcimpXQ7oc+j2/LENU8isUn4S7XusZxnccU0vDcA+7LtOpJtZH67sWEgYG\nu73oltybXOQ1lqB5L54EWY5qULvwCaEFt2tb0MQ0pa+2vVASIvB2SgFjsJJf7hV0\njXJH7EqyALU7iNZA7O9xNFQ/QIEsoBvBkyc3bAtz3/gB47Z7pqV6nLpV0jRt57kK\nSAdZQ1c3r0NeD0d1lUvnHaPEzBKd9wLVa+q8R9JsDxhMActMOhkL88gtyocAnxVl\nvW0TZ8k/AgMBAAECggEAFpJSVJpzJzUzVyUjmNlr+bTDBZAJTbC+vUVABf2x5CUr\nPaDHib1yXK9F6hDJMylAXVqedFEHaA2X3BeifvFq7NCpdF7AC0rLHI+e88ITAGx5\n1WVquAsljKDAvD18RbL+pkRL3XJ25/rRHhZs/mapK7vJN4T/siGoSkWt09h1vVYg\nWpnZk9eiDaxvj982nSOT4pfpYQMCNjuOy2uoMj3f0g6ievi3SmVpD/NMsDI2o9Iy\nMuX1z0tKhXfnjYO3ineyLKRfXEc++pGHacdN6hzW79BmldJR2z/gv8vIEjChNFUp\nl25ZT6GjCpK8lHx16aKcEXEb06Soe0iKnZkx+J3uRQKBgQDp9gDsH27NfLMuWbsI\nbyXniGcv7T6DS80NPrPiNlvf7J8s6NFs2P0MErji4TzVMq/fARIuG6kGwGfE2nE5\nrKYmZ78TLSR6PoeFfCITIv3Qn8fcl2w7DGUZCYwzA9kiw6CUQS7YtkVgFUa39Ljx\n1Vip5sFYmxu9zbd/mXGoCYrfpQKBgQDYnDgO6UwpV7+faj2VIq6dhYXorP1ZHv88\nFEK3c+brNc2ipcDgF6CQH+VVHvJtkozv44czehuD+zXW6iYSMDzj2hjela/cEtIY\njHZNPJnNE24ccYp6jREF6WuxDwkOAIYWuAHG6VHI0YpG2DveaVj5SvG+6He6Py+I\nS5MPZ21wEwKBgE5n5fk7s3tj3fybj6WM8iv8t3AFVtzTa12T9N7LjtClUNbRE1Yi\nBfOk1pcaGrPsL6pRhpEzLdsYYe5Dsow8gtX+ELfRehcJm4sthZHaOStQUL9pc5j6\nV2sjmvuBv6P54XetvJBdzTQdDT0a41wQPo15yrPyD0L1jRhTCRbiU8sNAoGBAIC1\nouHJYsYWK/jvyhP5/cP/+Sfe0tPIBWWPrG0R457T45LH5ynBIFlDeqPvtaHCORi6\nHDZMUllERiOkEmcwXp4NlEV+sHaWgFyx6gHPBpzC9OTV2rEjbYATyTf2dSzqxsJt\nKDEnpr8rM30RM9Hey02maKtFuw7iSL42GfZHQNIdAoGAH/l2TQs9MYlNQRDfuVG1\ntxIYGI25Pv753p1UGvt5GKqfCX9KUOUIbkPb1j0R6vqZFZglAkj1G+wlGmKciOx3\nI1Fd4HnPE4n2ve95/DbJQPVxm0anTy9SR9thX9I9c5+TCMq0LOgVu+JMSAskNSkI\nzfjHxDmzDlgFY9ca5jwAFpg=\n-----END PRIVATE KEY-----\n"

# Private Key ID (JSON: private_key_id)
GOOGLE_MERCHANT_PRIVATE_KEY_ID="58090fe706f94301d25aecda869335a756630b8e"

# Client ID (JSON: client_id)
GOOGLE_MERCHANT_CLIENT_ID="111311801636391452848"

# Google Cloud Project ID (JSON: project_id)
GOOGLE_CLOUD_PROJECT_ID="make-gmail-integration-428317"
```

---

## 🔒 Sécurité - Instructions Critiques

### ⚠️ NE JAMAIS Committer ce Fichier

```bash
# Vérifier que .env.local est bien dans .gitignore
cat .gitignore | grep ".env.local"

# Si absent, ajouter immédiatement
echo ".env.local" >> .gitignore
```

### 📍 Stockage Sécurisé

1. **Fichier JSON original** : `make-gmail-integration-428317-58090fe706f9.json`
   - ✅ Sauvegardé dans : `.playwright-mcp/` (auto-ignoré par Git)
   - 🔐 **ACTION REQUISE** : Déplacer vers gestionnaire secrets (1Password, Bitwarden, etc.)
   - ⚠️ **NE PAS laisser** dans le repo Git

2. **Variables .env.local**
   - ✅ Fichier déjà dans `.gitignore`
   - 🔐 Accès restreint développeur uniquement
   - 📋 Backup sécurisé dans gestionnaire secrets

### 🚨 Si Clé Exposée Publiquement

Google désactive automatiquement les clés détectées dans les dépôts publics. Si exposition accidentelle :

1. **Immédiat** : Révoquer la clé dans Google Cloud Console
2. Créer nouvelle clé Service Account
3. Mettre à jour `.env.local` avec nouvelles credentials
4. Vérifier logs Google Cloud pour usages suspects

---

## 📋 Prochaines Étapes

### Phase 4 : Configuration Merchant Center Access

1. **Activer API Content**
   - URL : https://console.cloud.google.com/apis/library/content.googleapis.com?project=make-gmail-integration-428317
   - Action : Cliquer "ENABLE"

2. **Ajouter Service Account à Merchant Center**
   - URL : https://merchants.google.com/mc/accounts/5495521926/users
   - Email à ajouter : `google-merchant-verone@make-gmail-integration-428317.iam.gserviceaccount.com`
   - Access Level : **Admin**

### Phase 5 : Configuration .env.local

1. Copier template depuis `.env.example` section Google Merchant
2. Remplacer avec valeurs ci-dessus
3. Redémarrer serveur dev : `npm run dev`

### Phase 6 : Tests Validation

```bash
# Test API connection
curl http://localhost:3000/api/google-merchant/test-connection | jq

# Résultat attendu:
# {
#   "authentication": true,
#   "apiConnection": true,
#   "accountId": "5495521926"
# }
```

---

## 📊 Mapping JSON → Variables

| Variable .env                           | Clé JSON         | Valeur Extraite                          |
| --------------------------------------- | ---------------- | ---------------------------------------- |
| `GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL` | `client_email`   | google-merchant-verone@...               |
| `GOOGLE_MERCHANT_PRIVATE_KEY`           | `private_key`    | -----BEGIN PRIVATE KEY----- (2048 chars) |
| `GOOGLE_MERCHANT_PRIVATE_KEY_ID`        | `private_key_id` | 58090fe706f94301d25aecda869335a756630b8e |
| `GOOGLE_MERCHANT_CLIENT_ID`             | `client_id`      | 111311801636391452848                    |
| `GOOGLE_CLOUD_PROJECT_ID`               | `project_id`     | make-gmail-integration-428317            |

---

## 🎯 Validation Credentials

### Checklist Avant Tests

- [ ] 5 variables copiées dans `.env.local`
- [ ] Private Key contient bien `\n` échappés (PAS de vrais retours à la ligne)
- [ ] `.env.local` bien présent dans `.gitignore`
- [ ] Fichier JSON original déplacé vers gestionnaire secrets
- [ ] Serveur dev redémarré

### Format Private Key Correct

```bash
# ✅ CORRECT (échappés \n)
GOOGLE_MERCHANT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# ❌ INCORRECT (vrais retours à la ligne)
GOOGLE_MERCHANT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIE...
-----END PRIVATE KEY-----
"
```

---

## 🔗 Liens Utiles

- **Google Cloud Console - Service Accounts** : https://console.cloud.google.com/iam-admin/serviceaccounts?project=make-gmail-integration-428317
- **API Content Activation** : https://console.cloud.google.com/apis/library/content.googleapis.com?project=make-gmail-integration-428317
- **Merchant Center Users** : https://merchants.google.com/mc/accounts/5495521926/users
- **Guide Configuration Complet** : [GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md](./GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md)

---

**Créé le** : 2025-10-10
**Service Account créé par** : Claude Code (MCP Playwright Browser automation)
**Statut** : ✅ Credentials extraites et documentées
**Action requise** : Configuration variables .env.local + Activation API Content
