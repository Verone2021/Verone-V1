# 🎉 Session Débugging Google Merchant : SUCCÈS Authentification - Permissions à Configurer

**Date** : 2025-10-10
**Durée** : ~4h
**Status** : ✅ **AUTHENTIFICATION RÉUSSIE** | ⏳ **Permissions Google Cloud requises**

---

## 🎯 Objectif

Résoudre l'erreur `error:1E08010C:DECODER routines::unsupported` et valider la connexion complète à l'API Google Merchant Center.

---

## ✅ Travail Accompli

### 🔓 FIX 1 : Résolution Problème Private Key Format

**Problème Identifié** :
- Variables d'environnement **système** contenaient des fake credentials overriding `.env.local`
- Private key système : `YOUR_PRIVATE_KEY_HERE` (placeholder)
- Email système : `verone-merchant@your-project.iam.gserviceaccount.com` (fake)

**Solution Implémentée** (Best Practice Stack Overflow/GitHub) :

1. **Script de démarrage clean** (`start-dev-clean.sh`) :
```bash
#!/bin/bash
# Unset toutes les variables système AVANT npm dev
unset GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL
unset GOOGLE_MERCHANT_PRIVATE_KEY
# ... autres vars

# Next.js va maintenant charger .env.local UNIQUEMENT
npm run dev
```

2. **Code auth.ts modifié** (support multiple formats private key) :
```typescript
// /src/lib/google-merchant/auth.ts ligne 29-75
function createServiceAccountCredentials(): ServiceAccountCredentials {
  validateGoogleMerchantEnv()

  let privateKey = process.env.GOOGLE_MERCHANT_PRIVATE_KEY

  if (!privateKey) {
    throw new Error('GOOGLE_MERCHANT_PRIVATE_KEY manquante ou invalide')
  }

  // 🔧 FIX: Support multiple formats (senior dev best practice)
  // Format 1: Base64 encoded (recommended for deployment)
  // Format 2: PEM with literal \n (standard .env format)
  // Format 3: PEM with real newlines (current .env.local format)

  try {
    // Check if Base64 encoded (recommended by Stack Overflow/GitHub)
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      // Decode Base64 format
      privateKey = Buffer.from(privateKey, 'base64').toString('utf-8')
    }
  } catch (error) {
    // Not Base64, continue with other formats
  }

  // Handle literal \n characters (convert to real newlines)
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n')
  }

  // Validate PEM format
  if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
    throw new Error('GOOGLE_MERCHANT_PRIVATE_KEY format invalide (PEM attendu)')
  }

  return {
    type: 'service_account',
    // ... reste
  }
}
```

**Résultat** :
```
✅ Test authentification: ✅ Succès
✅ Authentication test: SUCCESS
✅ clientEmail: 'google-merchant-verone@make-gmail-integration-428317.iam.gserviceaccount.com'
```

---

### 🌐 FIX 2 : Correction URL API Products v1beta

**Problème Identifié** :
- URL incorrecte : `https://merchantapi.googleapis.com/accounts/{id}/products`
- Documentation officielle : `https://merchantapi.googleapis.com/products/v1beta/accounts/{id}/products`

**Solution Implémentée** :

Fichier `/src/lib/google-merchant/config.ts` ligne 48-53 :
```typescript
getResourcePaths = (accountId = GOOGLE_MERCHANT_CONFIG.accountId) => ({
  account: `accounts/${accountId}`,
  dataSource: `accounts/${accountId}/dataSources/${GOOGLE_MERCHANT_CONFIG.dataSourceId}`,
  // 🔧 FIX: URLs correctes selon documentation officielle Google Merchant API v1beta
  productInputs: `products/${GOOGLE_MERCHANT_CONFIG.apiVersion}/accounts/${accountId}/productInputs`,
  products: `products/${GOOGLE_MERCHANT_CONFIG.apiVersion}/accounts/${accountId}/products`
})
```

**Résultat** :
```
GET https://merchantapi.googleapis.com/products/v1beta/accounts/5495521926/products?pageSize=1
```

---

## 🚧 PROCHAIN BLOCAGE : Permissions Google Cloud

### Erreur Actuelle

```
Status: 403 Forbidden
PERMISSION_DENIED

Caller does not have required permission to use project make-gmail-integration-428317
Grant the caller the roles/serviceusage.serviceUsageConsumer role
```

### Solution Requise (ACTION MANUELLE NÉCESSAIRE)

**Étapes à suivre** :

1. **Aller dans Google Cloud Console** :
   https://console.developers.google.com/iam-admin/iam/project?project=make-gmail-integration-428317

2. **Trouver le Service Account** :
   `google-merchant-verone@make-gmail-integration-428317.iam.gserviceaccount.com`

3. **Ajouter les rôles suivants** :
   - ✅ `roles/serviceusage.serviceUsageConsumer` (CRITIQUE)
   - ✅ `roles/content.admin` (Google Merchant Center Admin)
   - ✅ Optionnel : `roles/merchantapi.productEditor` (pour édition produits)

4. **Attendre propagation** : 2-5 minutes

5. **Re-tester connexion** dans Vérone modal

---

## 📊 État Technique Actuel

### ✅ Fonctionnel
- ✅ Authentification JWT avec Google
- ✅ Service Account Email correct chargé depuis `.env.local`
- ✅ Private Key format supporté (multiline PEM)
- ✅ URL API Products v1beta correcte
- ✅ Modal configuration professionnelle avec UI complète
- ✅ Error handling et troubleshooting UX

### ⏳ En Attente
- ⏳ Permissions Google Cloud IAM
- ⏳ Test API Products list complet
- ⏳ Phase 2 : Synchronisation produits batch
- ⏳ Phase 3 : Dashboard analytics métriques

---

## 📁 Fichiers Créés/Modifiés

### Créés
1. `/start-dev-clean.sh` - Script démarrage avec env clean
2. `/src/hooks/use-google-merchant-config.ts` - Hook state management
3. `/src/components/business/google-merchant-config-modal.tsx` - UI Modal
4. `/.playwright-mcp/google-merchant-test-403-permissions.png` - Screenshot résultat

### Modifiés
1. `/src/lib/google-merchant/auth.ts` - Fix private key multi-format support
2. `/src/lib/google-merchant/config.ts` - Fix URLs API v1beta
3. `/src/app/canaux-vente/google-merchant/page.tsx` - Intégration modal

---

## 🎓 Leçons Apprises - Best Practices Seniors

### Variables Environnement (Stack Overflow)
- **Problème** : System env vars override `.env.local` silencieusement
- **Solution** : `unset` explicit dans script de démarrage
- **Alternative** : Base64 encoding pour clés privées en production

### Private Key Format (GitHub Issues)
- **Problème** : `.env` files supporte mal multilines
- **Solution** : Support multiple formats (Base64, littéral `\n`, real newlines)
- **Best Practice** : Base64 encode entire key pour Vercel/Heroku/AWS

### Google Merchant API v1beta (Documentation Officielle)
- **URL Pattern** : `/products/v1beta/accounts/{id}/products`
- **Scope Requis** : `https://www.googleapis.com/auth/content`
- **IAM Role** : `roles/serviceusage.serviceUsageConsumer` MANDATORY

### MCP Playwright Browser (CLAUDE.md Rule)
- ✅ TOUJOURS utiliser MCP Browser direct (jamais scripts *.js)
- ✅ Console error checking AVANT success declaration
- ✅ Screenshots comme preuve visuelle

---

## 🔜 Prochaines Étapes

### Immédiat (Utilisateur)
1. ⏳ Configurer permissions IAM dans Google Cloud Console
2. ⏳ Attendre propagation (2-5 min)
3. ⏳ Re-tester connexion dans modal Vérone

### Après Déblocage (Automatique)
1. ✅ Validation connexion API complète
2. 🚀 Phase 2 : Synchronisation produits batch (3-4h)
3. 📊 Phase 3 : Dashboard analytics métriques réelles (4-5h)
4. 🎨 Phase 4 : Features avancées (2-3h)

---

## 📸 Preuve Visuelle

**Screenshot** : `/.playwright-mcp/google-merchant-test-403-permissions.png`

**État Modal** :
- ✅ Account ID: 5495521926
- ✅ Data Source ID: 10571293810
- ✅ Langue/Pays: FR/FR
- ✅ Devise: EUR
- ❌ Erreur: "Connection test failed" (403 PERMISSION_DENIED)

---

## 🏆 Réussite Technique

**Problèmes résolus** :
1. ✅ Variables système override → Script shell unset
2. ✅ Private key DECODER error → Multi-format support
3. ✅ URL API incorrecte → Documentation officielle appliquée

**Résultat** :
- 🎉 **Authentification Google JWT : SUCCÈS**
- 🎉 **Private Key décodée correctement**
- 🎉 **Email Service Account correct**
- ⏳ **Permissions IAM : Action manuelle requise**

---

**Auteur** : Claude (Vérone Assistant)
**Référence** : Phase 1.4 - Google Merchant Integration Plan
**Temps Total** : ~4h recherche + debugging + implémentation
