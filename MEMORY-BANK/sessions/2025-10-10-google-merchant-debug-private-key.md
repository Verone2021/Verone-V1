# 🔧 Session Debug: Google Merchant Private Key Format

**Date**: 2025-10-10
**Durée**: ~2h
**Status**: ❌ **BLOQUÉ** - Problème avec format private key dans `.env.local`

---

## 🎯 Objectif

Configurer et tester la connexion API Google Merchant Center pour Phase 1.4 du plan d'intégration.

---

## ✅ Travail Accompli

### Phase 1.3 : Modal Configuration ✓
- ✅ Hook `use-google-merchant-config.ts` créé
- ✅ Composant `google-merchant-config-modal.tsx` créé
- ✅ Intégration dans page Google Merchant
- ✅ UI professionnelle avec status badges
- ✅ Error handling et troubleshooting

### Phase 1.4 : Tests Connexion API (En cours)
- ✅ Modal s'ouvre correctement
- ✅ Account ID/Data Source ID affichés : `5495521926` / `10571293810`
- ✅ Email Service Account correct chargé : `google-merchant-verone@make-gmail-integration-428317.iam.gserviceaccount.com`
- ❌ **BLOQUÉ** : Erreur authentification Google

---

## ❌ Problème Identifié

### Erreur Node.js Crypto
```
Error: error:1E08010C:DECODER routines::unsupported
  at Sign.sign (node:internal/crypto/sig:128:29)
  at GoogleToken._GoogleToken_requestToken
```

### Cause Root

**PRIVATE KEY mal formatée dans `.env.local`**

Le fichier `.env.local` contient la private key avec des **VRAIS retours à la ligne** :
```bash
GOOGLE_MERCHANT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...
...
-----END PRIVATE KEY-----"
```

Mais Google Auth Library attend des `\n` **LITTÉRAUX** (échappés) sur UNE SEULE LIGNE :
```bash
GOOGLE_MERCHANT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n...\n-----END PRIVATE KEY-----\n"
```

### Diagnostic Technique

**Test effectué** :
```bash
node -e "const key = process.env.GOOGLE_MERCHANT_PRIVATE_KEY; console.log('Contains real newlines:', key.includes('\n'))"
# Output: Contains real newlines: true  ← PROBLÈME !
```

**Code auth.ts ligne 33** :
```typescript
const privateKey = process.env.GOOGLE_MERCHANT_PRIVATE_KEY?.replace(/\\n/g, '\n')
```

Ce code remplace `\\n` (littéral) par `\n` (retour ligne réel).
Mais si la clé a DÉJÀ des vrais `\n`, le `.replace()` ne fait rien et Node crypto ne peut pas décoder.

---

## 🛠️ Solution Requise

### Option 1 : Corriger `.env.local` (RECOMMANDÉ)

L'utilisateur doit éditer `.env.local` et mettre la private key sur **UNE SEULE LIGNE** avec `\n` littéraux :

```bash
# ❌ INCORRECT (vrais retours ligne)
GOOGLE_MERCHANT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQI...
-----END PRIVATE KEY-----"

# ✅ CORRECT (une ligne, \n littéraux)
GOOGLE_MERCHANT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n...\n-----END PRIVATE KEY-----\n"
```

### Option 2 : Modifier `auth.ts` (Alternative)

Modifier le code pour gérer les deux formats :

```typescript
// src/lib/google-merchant/auth.ts ligne 33
function createServiceAccountCredentials(): ServiceAccountCredentials {
  validateGoogleMerchantEnv()

  let privateKey = process.env.GOOGLE_MERCHANT_PRIVATE_KEY

  if (!privateKey) {
    throw new Error('GOOGLE_MERCHANT_PRIVATE_KEY manquante ou invalide')
  }

  // Si la clé contient déjà de vrais \n, ne rien faire
  // Sinon, convertir les \\n littéraux en vrais \n
  if (!privateKey.includes('\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n')
  }

  return {
    type: 'service_account',
    // ... rest
  }
}
```

---

## 📊 État Actuel

### Fichiers Créés
1. `/src/hooks/use-google-merchant-config.ts` (148 lignes)
2. `/src/components/business/google-merchant-config-modal.tsx` (361 lignes)

### Fichiers Modifiés
1. `/src/app/canaux-vente/google-merchant/page.tsx` (import + modal)

### Tests MCP Browser
- ✅ Page charge sans erreurs
- ✅ Modal s'ouvre/ferme correctement
- ✅ Bouton "Tester la connexion" fonctionne
- ❌ API retourne 500 (erreur crypto private key)

---

## 🔜 Prochaines Étapes

### Immédiat
1. **Informer l'utilisateur** du problème de format private key
2. Demander correction `.env.local` OU implémenter Option 2
3. Re-tester connexion après correction

### Après Déblocage
1. **Phase 1.4 complète** : Connexion API réussie
2. **Phase 2** : Synchronisation produits batch (3-4h)
3. **Phase 3** : Dashboard analytics métriques (4-5h)
4. **Phase 4** : Features avancées (2-3h)

---

## 📝 Leçons Apprises

1. **Variables d'env système** peuvent override `.env.local` → Forcer avec `VAR=value npm run dev`
2. **Format private key critique** → `.env` supporte mal multilignes, préférer `\n` littéraux
3. **Node crypto strict** → Format PEM doit être exact pour signature JWT
4. **MCP Browser invaluable** → Visualisation real-time des erreurs vs scripts

---

**Auteur**: Claude (Vérone Assistant)
**Référence**: Phase 1.4 - Google Merchant Integration Plan
