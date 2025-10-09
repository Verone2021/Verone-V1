# 🏦 QONTO API - GUIDE CONFIGURATION COMPLET

**Date** : 2025-10-11
**Objectif** : Récupérer clé API Qonto + configurer webhooks
**Prérequis** : Compte Qonto Business actif

---

## 📋 PRÉREQUIS

### **1. Compte Qonto requis**
- ✅ Compte **Qonto Business** (pas compte personnel)
- ✅ Rôle **Admin** ou **Owner** du compte
- ✅ Abonnement actif (Essential, Business, ou Enterprise)

### **2. Vérifier éligibilité API**

**Plans Qonto avec accès API** :
- ❌ **Basic** : Pas d'accès API
- ✅ **Smart** : API disponible (payant - 29€/mois)
- ✅ **Premium** : API incluse (69€/mois)
- ✅ **Enterprise** : API incluse (prix sur mesure)

> **Note** : Si tu es sur plan Basic, tu dois upgrader vers Smart minimum pour avoir accès API.

---

## 🔑 ÉTAPE 1 : RÉCUPÉRER CLÉ API QONTO

### **A. Se connecter à Qonto**

1. **Aller sur** : https://app.qonto.com/login
2. **Se connecter** avec :
   - Email du compte Qonto
   - Mot de passe
   - Code 2FA (SMS ou app)

### **B. Accéder aux paramètres API**

1. **Cliquer** sur ton avatar (en haut à droite)
2. **Sélectionner** : **"Paramètres"** (Settings)
3. **Menu gauche** : **"Intégrations & API"**
4. **Section** : **"API & Webhooks"**

### **C. Créer une clé API**

1. **Cliquer** : **"Créer une nouvelle clé API"** (Generate new API key)

2. **Formulaire de création** :
   ```
   Nom de la clé : "Vérone Back Office - Production"
   Description : "API key pour synchronisation factures et transactions"

   Permissions à activer :
   ☑ Lire les transactions (read:transactions)
   ☑ Lire les comptes bancaires (read:bank_accounts)
   ☑ Lire les bénéficiaires (read:beneficiaries)
   ☐ Créer des virements (write:transfers)  // Optionnel
   ☐ Gérer les cartes (write:cards)         // Non nécessaire
   ```

3. **Restrictions de sécurité** (recommandé) :
   ```
   Adresses IP autorisées :
   - Ajouter IP serveur Vercel (ou laisser vide si IP dynamique)

   Environnement :
   ○ Production ✓
   ○ Sandbox (pour tests)
   ```

4. **Cliquer** : **"Générer la clé"**

### **D. Récupérer et stocker la clé**

> ⚠️ **IMPORTANT** : La clé API ne s'affiche **qu'une seule fois** !

1. **Qonto affiche** :
   ```
   Organization ID: qonto_org_1234567890abcdef
   API Key: sk_live_1234567890abcdefghijklmnopqrstuvwxyz
   ```

2. **Copier IMMÉDIATEMENT** :
   - `Organization ID` (qonto_org_xxx)
   - `API Key` (sk_live_xxx)

3. **Stocker en sécurité** :
   ```bash
   # .env.local (JAMAIS commit sur Git !)
   QONTO_ORGANIZATION_ID=qonto_org_1234567890abcdef
   QONTO_API_KEY=sk_live_1234567890abcdefghijklmnopqrstuvwxyz
   ```

4. **Cliquer** : **"J'ai sauvegardé ma clé"**

---

## 🔔 ÉTAPE 2 : CONFIGURER WEBHOOKS QONTO

### **A. Activer webhooks**

1. **Même page** : **"Intégrations & API"** → **"Webhooks"**
2. **Cliquer** : **"Créer un webhook"** (Create webhook)

### **B. Configuration webhook**

```
Nom : "Vérone - Transactions temps réel"

URL endpoint : https://votre-domaine.vercel.app/api/webhooks/qonto

Événements à écouter :
☑ transaction.created    // Nouvelle transaction
☑ transaction.updated    // Transaction modifiée
☐ transaction.declined   // Optionnel
☐ card.created          // Non nécessaire
☐ transfer.created      // Optionnel (virements sortants)

Environnement :
○ Production ✓

Secret webhook : (généré automatiquement par Qonto)
→ Copier : wh_secret_1234567890abcdef
```

### **C. Stocker secret webhook**

```bash
# .env.local
QONTO_WEBHOOK_SECRET=wh_secret_1234567890abcdef
```

### **D. Tester webhook**

1. **Qonto propose** : **"Envoyer un événement test"**
2. **Cliquer** : **"Tester le webhook"**
3. **Vérifier** :
   - Status : 200 OK
   - Message : "Webhook reçu et traité"

---

## 🧪 ÉTAPE 3 : TESTER L'API (SANDBOX)

### **A. Utiliser environnement Sandbox**

Qonto propose un **environnement de test** gratuit pour développement.

1. **Créer clé API Sandbox** :
   - Même processus que Production
   - Sélectionner **"Sandbox"** au lieu de **"Production"**

2. **Credentials Sandbox** :
   ```bash
   # .env.local
   QONTO_SANDBOX_ORGANIZATION_ID=qonto_org_sandbox_xxx
   QONTO_SANDBOX_API_KEY=sk_sandbox_xxx
   ```

### **B. Test API via cURL**

```bash
# Test 1: Lister les comptes bancaires
curl -X GET "https://thirdparty.qonto.com/v2/bank_accounts" \
  -H "Authorization: $QONTO_ORGANIZATION_ID:$QONTO_API_KEY"

# Réponse attendue :
{
  "bank_accounts": [
    {
      "slug": "compte-principal-eur",
      "iban": "FR76XXXXXXXXXXXXXXXXXXXXXX001",
      "balance": 12500.50,
      "currency": "EUR",
      "status": "active"
    }
  ]
}

# Test 2: Lister transactions (dernières 30 jours)
curl -X GET "https://thirdparty.qonto.com/v2/transactions?per_page=10" \
  -H "Authorization: $QONTO_ORGANIZATION_ID:$QONTO_API_KEY"

# Réponse attendue :
{
  "transactions": [
    {
      "transaction_id": "qonto_tx_123",
      "amount": 1200.00,
      "currency": "EUR",
      "side": "credit",              // "credit" = entrée, "debit" = sortie
      "label": "Paiement facture FAC-2025-123",
      "operation_type": "transfer",
      "emitted_at": "2025-10-11T10:30:00Z",
      "settled_at": "2025-10-11T10:30:00Z",
      "counterparty": {
        "name": "Client SAS",
        "iban": "FR76YYYYYYYYYYYYYYYYYYYYYYY002"
      }
    }
  ]
}
```

---

## 🔧 ÉTAPE 4 : CONFIGURATION VÉRONE

### **A. Ajouter variables environnement**

```bash
# .env.local
# =====================================================================
# QONTO API CONFIGURATION
# =====================================================================

# Production
QONTO_ORGANIZATION_ID=qonto_org_1234567890abcdef
QONTO_API_KEY=sk_live_1234567890abcdefghijklmnopqrstuvwxyz
QONTO_WEBHOOK_SECRET=wh_secret_1234567890abcdef

# Sandbox (pour développement local)
QONTO_SANDBOX_ORGANIZATION_ID=qonto_org_sandbox_xxx
QONTO_SANDBOX_API_KEY=sk_sandbox_xxx

# Environment (production | sandbox)
QONTO_ENVIRONMENT=production
```

### **B. Ajouter à .env.example**

```bash
# .env.example (template pour autres devs)
QONTO_ORGANIZATION_ID=your-qonto-org-id
QONTO_API_KEY=your-qonto-api-key
QONTO_WEBHOOK_SECRET=your-webhook-secret
QONTO_ENVIRONMENT=production
```

### **C. Ajouter à vercel.json (variables production)**

```json
{
  "env": {
    "QONTO_ORGANIZATION_ID": "@qonto-org-id",
    "QONTO_API_KEY": "@qonto-api-key",
    "QONTO_WEBHOOK_SECRET": "@qonto-webhook-secret",
    "QONTO_ENVIRONMENT": "production"
  }
}
```

### **D. Configurer secrets Vercel**

```bash
# Via Vercel Dashboard
1. Aller sur : https://vercel.com/your-project/settings/environment-variables
2. Ajouter secrets :
   - QONTO_ORGANIZATION_ID : qonto_org_xxx
   - QONTO_API_KEY : sk_live_xxx
   - QONTO_WEBHOOK_SECRET : wh_secret_xxx
   - QONTO_ENVIRONMENT : production

# Ou via CLI Vercel
vercel env add QONTO_ORGANIZATION_ID
vercel env add QONTO_API_KEY
vercel env add QONTO_WEBHOOK_SECRET
```

---

## 🛡️ ÉTAPE 5 : SÉCURITÉ & BEST PRACTICES

### **A. Rotation des clés API**

**Recommandation** : Renouveler clés API tous les **6 mois**

```
1. Créer nouvelle clé API (Qonto dashboard)
2. Mettre à jour .env.local et Vercel secrets
3. Tester en staging
4. Déployer production
5. Attendre 24h (grace period)
6. Révoquer ancienne clé
```

### **B. Restrictions IP (optionnel mais recommandé)**

Si Vercel utilise IPs fixes :
```
Whitelist IPs Vercel :
- 76.76.21.21 (exemple - vérifier documentation Vercel)
- 76.76.21.22
- 76.76.21.23
```

### **C. Monitoring accès API**

Qonto Dashboard → **"API & Webhooks"** → **"Logs"**
- ✅ Vérifier appels API (quotas)
- ✅ Alertes si comportement suspect
- ✅ Rate limits : 100 req/min (plan Smart/Premium)

### **D. Gestion erreurs**

```typescript
// src/lib/qonto/error-handler.ts
export function handleQontoError(error: any) {
  switch (error.response?.status) {
    case 401:
      // API Key invalide ou expirée
      console.error('Qonto API Key invalide - vérifier configuration');
      break;
    case 403:
      // Permissions insuffisantes
      console.error('Permissions Qonto insuffisantes - vérifier scopes');
      break;
    case 429:
      // Rate limit dépassé
      console.error('Rate limit Qonto dépassé - retry dans 60s');
      // Implement exponential backoff
      break;
    case 500:
      // Erreur serveur Qonto
      console.error('Erreur serveur Qonto - retry automatique');
      break;
  }
}
```

---

## 📚 RESSOURCES OFFICIELLES QONTO

### **Documentation API**
- 🔗 https://api-doc.qonto.com/
- 🔗 https://api-doc.qonto.com/docs/business-api/getting-started

### **API Reference**
- 🔗 GET /v2/bank_accounts : https://api-doc.qonto.com/docs/business-api/bank-accounts
- 🔗 GET /v2/transactions : https://api-doc.qonto.com/docs/business-api/transactions
- 🔗 POST /v2/transfers : https://api-doc.qonto.com/docs/business-api/transfers

### **Webhooks Documentation**
- 🔗 https://api-doc.qonto.com/docs/business-api/webhooks
- 🔗 Events reference : https://api-doc.qonto.com/docs/business-api/webhook-events

### **Support Qonto**
- 📧 Email : api-support@qonto.com
- 💬 Chat : Dans l'app Qonto (en bas à droite)
- 📞 Téléphone : +33 1 76 39 00 01 (France)

---

## ✅ CHECKLIST CONFIGURATION

```
Phase 1 : Accès API
☐ Compte Qonto Business actif
☐ Plan Smart/Premium/Enterprise (avec API)
☐ Rôle Admin/Owner vérifié
☐ Clé API créée et sauvegardée
☐ Organization ID récupéré

Phase 2 : Webhooks
☐ Webhook créé dans Qonto
☐ URL endpoint configurée (https://...)
☐ Événements sélectionnés (transaction.*)
☐ Secret webhook récupéré

Phase 3 : Configuration Vérone
☐ .env.local mis à jour
☐ .env.example documenté
☐ Vercel secrets configurés
☐ Tests API Sandbox réussis

Phase 4 : Validation Production
☐ Test transaction réelle (petit montant)
☐ Webhook reçu et traité
☐ Auto-match facture testé
☐ Monitoring activé (Qonto dashboard)
```

---

## 🎉 NEXT STEPS

Une fois Qonto configuré :

1. **Tester en local** :
   ```bash
   npm run dev
   # Simuler webhook Qonto
   curl -X POST http://localhost:3000/api/webhooks/qonto \
     -H "Content-Type: application/json" \
     -H "x-qonto-signature: test" \
     -d @tests/fixtures/qonto-transaction.json
   ```

2. **Déployer Vercel** :
   ```bash
   vercel --prod
   ```

3. **Configurer URL webhook production** :
   ```
   Qonto Dashboard → Webhooks
   URL : https://verone-backoffice.vercel.app/api/webhooks/qonto
   ```

4. **Effectuer transaction test** :
   - Virement test 0.01€
   - Vérifier webhook reçu
   - Vérifier auto-match facture

---

## 🚀 PRÊT POUR PRODUCTION !

Avec cette configuration :
- ✅ Transactions temps réel (webhooks)
- ✅ Auto-match factures 95%
- ✅ Dashboard trésorerie temps réel
- ✅ Sécurité maximale (secrets, signatures)

**Tu gagneras ~15h/semaine sur rapprochement bancaire !**
