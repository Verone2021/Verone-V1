# 🔌 Guide Complet - Configuration Google Merchant Center

**Objectif** : Connecter Vérone Back Office à Google Merchant Center pour synchronisation produits
**Temps estimé** : 40-50 minutes
**Prérequis** : Compte Google Merchant Center actif (ID: 5495521926)

---

## 📋 Vue d'Ensemble

### Architecture Validée ✅
- ✅ **Schéma DB** : 100% compatible Google Merchant 2025 (11 champs requis mappables)
- ✅ **Système Variantes** : `item_group_id` auto-sync opérationnel
- ✅ **Transformateurs** : Mapping 31 colonnes Excel + validation API
- ✅ **Routes API** : test-connection, export-excel, sync-product implémentés

### Ce qu'il Reste à Faire
- [ ] Créer Service Account Google Cloud
- [ ] Configurer accès Google Merchant Center
- [ ] Extraire 5 variables d'environnement
- [ ] Tester connexion et synchronisation

---

## 🚀 Étape 1 : Google Cloud Service Account (15 min)

### 1.1 Accéder à Google Cloud Console

**URL** : https://console.cloud.google.com/iam-admin/serviceaccounts

### 1.2 Sélectionner ou Créer Projet

**Si projet Vérone existe déjà** :
- Sélectionner le projet dans le menu déroulant en haut
- Vérifier que l'ID du projet correspond à vos besoins

**Si aucun projet n'existe** :
1. Cliquer sur le menu projet (en haut) → "New Project"
2. Nom : `Verone Production` ou `Verone Google Merchant`
3. Prendre note de l'**Project ID** généré (ex: `verone-prod-123456`)

### 1.3 Créer Service Account

1. **Dans la page Service Accounts** :
   - Cliquer sur "**+ CREATE SERVICE ACCOUNT**" (bouton bleu en haut)

2. **Service account details** :
   - **Service account name** : `google-merchant-verone`
   - **Service account ID** : `google-merchant-verone` (auto-généré)
   - **Description** : `Service account pour synchronisation Google Merchant Center`
   - Cliquer "**CREATE AND CONTINUE**"

3. **Grant this service account access to project** :
   - **Role** : Sélectionner "**Service Account User**"
   - Alternative acceptable : "Basic" → "Editor" (si erreurs de permissions)
   - Cliquer "**CONTINUE**"

4. **Grant users access to this service account** :
   - **Laisser vide** (optionnel)
   - Cliquer "**DONE**"

### 1.4 Générer Clé JSON (CRITIQUE)

1. Dans la liste des Service Accounts, **trouver** `google-merchant-verone`

2. **Cliquer sur les 3 points** (⋮) à droite → "**Manage keys**"

3. **Add Key** → "**Create new key**"

4. **Key type** : Sélectionner "**JSON**" (par défaut)

5. Cliquer "**CREATE**"

6. **Le fichier JSON est téléchargé automatiquement** :
   - Nom par défaut : `verone-prod-123456-abc123def456.json`
   - **⚠️ IMPORTANT** : Sauvegarder ce fichier dans un endroit sécurisé
   - **NE JAMAIS COMMITTER** ce fichier dans Git

### 1.5 Vérification Rapide

Le fichier JSON téléchargé doit contenir :

```json
{
  "type": "service_account",
  "project_id": "verone-prod-123456",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "google-merchant-verone@verone-prod-123456.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

**✅ Si ces champs sont présents → Étape 1 terminée avec succès**

---

## 🏪 Étape 2 : Google Merchant Center Access (10 min)

### 2.1 Activer API Content (OBLIGATOIRE)

**URL** : https://console.cloud.google.com/apis/library/content.googleapis.com

1. **Vérifier que le bon projet est sélectionné** (menu déroulant en haut)
2. Cliquer sur "**ENABLE**" (bouton bleu)
3. Attendre confirmation "API enabled" (environ 10 secondes)

### 2.2 Ajouter Service Account dans Merchant Center

**URL** : https://merchants.google.com/mc/accounts/5495521926/users

1. **Se connecter** avec le compte Google propriétaire du Merchant Center

2. **Navigation** :
   - Settings (⚙️ en haut à droite) → "**Account access**"
   - Ou directement : https://merchants.google.com/mc/accounts/5495521926/users

3. **Add User** :
   - Cliquer sur "**+**" ou "**Add user**"
   - **Email address** : `google-merchant-verone@verone-prod-123456.iam.gserviceaccount.com`
     - ⚠️ Remplacer `verone-prod-123456` par votre **Project ID réel**
     - ⚠️ Email exact depuis le fichier JSON : `client_email`
   - **Access level** : Sélectionner "**Admin**" (recommandé)
     - Alternative minimale : "Standard" avec permissions "Content API"
   - Cliquer "**SEND INVITATION**"

4. **Validation** :
   - Le service account apparaît dans la liste des utilisateurs
   - Status : "Active" (immédiat, pas besoin d'accepter invitation)

### 2.3 Vérifier Data Source ID

**URL** : https://merchants.google.com/mc/products/datasources

1. Vérifier que le **Data Source "Cursor"** existe
   - ID attendu : `10571293810`
   - Si inexistant : créer nouveau data source "Primary Feed"

2. **Prendre note** du Data Source ID exact (utilisé dans config)

**✅ Étape 2 terminée → API activée + Service Account ajouté**

---

## 🔐 Étape 3 : Configuration Variables d'Environnement (5 min)

### 3.1 Ouvrir Fichier JSON Téléchargé

Ouvrir le fichier `verone-prod-123456-abc123def456.json` avec un éditeur de texte.

### 3.2 Extraire les 5 Variables Requises

**Mapping JSON → Variables .env** :

| Variable .env | Clé JSON | Exemple Valeur |
|---------------|----------|----------------|
| `GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL` | `client_email` | `google-merchant-verone@verone-prod-123456.iam.gserviceaccount.com` |
| `GOOGLE_MERCHANT_PRIVATE_KEY` | `private_key` | `-----BEGIN PRIVATE KEY-----\nMIIE...ABC\n-----END PRIVATE KEY-----\n` |
| `GOOGLE_MERCHANT_PRIVATE_KEY_ID` | `private_key_id` | `abc123def456789...` |
| `GOOGLE_MERCHANT_CLIENT_ID` | `client_id` | `123456789012345678901` |
| `GOOGLE_CLOUD_PROJECT_ID` | `project_id` | `verone-prod-123456` |

### 3.3 Ajouter dans `.env.local`

**Créer ou éditer** le fichier `.env.local` à la racine du projet :

```bash
# Google Merchant Center Configuration
GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL="google-merchant-verone@verone-prod-123456.iam.gserviceaccount.com"
GOOGLE_MERCHANT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GOOGLE_MERCHANT_PRIVATE_KEY_ID="abc123def456789abcdef123456789ab"
GOOGLE_MERCHANT_CLIENT_ID="123456789012345678901"
GOOGLE_CLOUD_PROJECT_ID="verone-prod-123456"

# Variables existantes Supabase (ne pas modifier)
NEXT_PUBLIC_SUPABASE_URL="..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

### 3.4 Vérifications Importantes

**⚠️ Format Private Key** :
- La clé doit commencer par `-----BEGIN PRIVATE KEY-----\n`
- Les retours à la ligne doivent être `\n` (échappés)
- Terminer par `\n-----END PRIVATE KEY-----\n`
- **Garder les guillemets doubles** autour de la valeur

**⚠️ Sécurité** :
- `.env.local` doit être dans `.gitignore` (déjà configuré)
- **NE JAMAIS** committer ces credentials
- Utiliser `.env.example` pour documenter les variables nécessaires

### 3.5 Redémarrer Serveur Dev

```bash
# Arrêter serveur actuel (Ctrl+C)
npm run dev
```

**✅ Étape 3 terminée → Variables configurées et serveur redémarré**

---

## ✅ Étape 4 : Tests de Validation (10 min)

### 4.1 Test Connexion API (Route GET)

**Terminal** :
```bash
curl http://localhost:3000/api/google-merchant/test-connection | jq
```

**Résultat Attendu (Succès)** :
```json
{
  "success": true,
  "data": {
    "authentication": true,
    "apiConnection": true,
    "accountId": "5495521926",
    "dataSourceId": "10571293810",
    "timestamp": "2025-10-09T...",
    "details": {
      "configuration": {
        "accountId": "5495521926",
        "dataSourceId": "10571293810",
        "contentLanguage": "fr",
        "targetCountry": "FR",
        "baseUrl": "https://merchantapi.googleapis.com",
        "productBaseUrl": "https://verone.com"
      }
    }
  }
}
```

**Erreurs Possibles** :

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Authentication failed` | Clé privée invalide | Vérifier format `\n` dans PRIVATE_KEY |
| `API connection failed` | API Content non activée | Activer sur console.cloud.google.com |
| `Insufficient permissions` | Service account pas Admin | Ajouter role Admin dans Merchant Center |
| `Account not found` | accountId incorrect | Vérifier ID 5495521926 dans config.ts |

### 4.2 Test Extended (Route POST)

```bash
curl -X POST http://localhost:3000/api/google-merchant/test-connection \
  -H "Content-Type: application/json" \
  -d '{"includeProductList": true}' | jq
```

**Résultat Attendu** :
```json
{
  "success": true,
  "data": {
    "authentication": true,
    "apiConnection": true,
    "details": {
      "productListTest": {
        "success": true,
        "productCount": 5,
        "data": { "products": [...] }
      }
    }
  }
}
```

### 4.3 Test Interface Web (MCP Playwright Recommandé)

**Option A : Test Manuel** :
1. Ouvrir navigateur : http://localhost:3000/canaux-vente/google-merchant
2. Vérifier **0 erreur console** (F12 → Console)
3. Cliquer bouton "**Tester Connexion**"
4. Vérifier message : "✅ Connexion Google Merchant réussie"

**Option B : Test Automatisé MCP Playwright** :

```typescript
// Workflow automatique
mcp__playwright__browser_navigate("http://localhost:3000/canaux-vente/google-merchant")
mcp__playwright__browser_console_messages({ onlyErrors: true })
// Résultat attendu: [] (aucune erreur)

mcp__playwright__browser_click({
  element: "Bouton Tester Connexion",
  ref: "[data-testid='test-connection-btn']"
})

mcp__playwright__browser_wait_for({ text: "Connexion réussie" })
mcp__playwright__browser_take_screenshot({ filename: "google-merchant-success.png" })
```

### 4.4 Test Export Excel

1. **Interface Web** : http://localhost:3000/canaux-vente/google-merchant
2. Cliquer "**Exporter vers Excel**"
3. **Vérifier fichier téléchargé** :
   - Nom : `google-merchant-export-YYYYMMDD-HHmmss.xlsx`
   - **31 colonnes** présentes (id, title, description, availability, link, ...)
   - Données produits correctement mappées

**Validation Colonnes Obligatoires** :
```
id, title, description, availability, link, image link, price,
identifier exists, gtin, mpn, brand, condition, item group id
```

### 4.5 Test Synchronisation Premier Produit (Optionnel)

**⚠️ ATTENTION** : Ce test envoie réellement un produit vers Google Merchant Center

1. **Sélectionner produit test** avec données complètes :
   - SKU valide (ex: `FMIL-GRIS`)
   - Nom, description, prix, image
   - GTIN ou MPH présent (identifierExists = true)

2. **Interface Web** :
   - Onglet "Produits" → Rechercher produit test
   - Cliquer "**Synchroniser avec Google**"

3. **Vérifier dans Google Merchant Center** :
   - URL : https://merchants.google.com/mc/products
   - Chercher SKU du produit
   - Status attendu : "Pending" (puis "Approved" après ~15 min)

**✅ Étape 4 terminée → Connexion validée et fonctionnelle**

---

## 📊 Checklist Validation Complète

### Configuration Google Cloud ✅
- [ ] Service Account `google-merchant-verone` créé
- [ ] Clé JSON téléchargée et sauvegardée
- [ ] API Content activée pour le projet
- [ ] Project ID noté et vérifié

### Configuration Merchant Center ✅
- [ ] Service account email ajouté dans Users
- [ ] Access level "Admin" accordé
- [ ] Data Source ID vérifié (10571293810)
- [ ] Service account status "Active"

### Variables d'Environnement ✅
- [ ] `GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL` configurée
- [ ] `GOOGLE_MERCHANT_PRIVATE_KEY` configurée (format `\n` correct)
- [ ] `GOOGLE_MERCHANT_PRIVATE_KEY_ID` configurée
- [ ] `GOOGLE_MERCHANT_CLIENT_ID` configurée
- [ ] `GOOGLE_CLOUD_PROJECT_ID` configurée
- [ ] `.env.local` dans `.gitignore`
- [ ] Serveur dev redémarré

### Tests de Validation ✅
- [ ] `GET /api/google-merchant/test-connection` → `authentication: true`
- [ ] `GET /api/google-merchant/test-connection` → `apiConnection: true`
- [ ] `POST /api/google-merchant/test-connection` → productListTest réussie
- [ ] Interface web : 0 erreur console
- [ ] Export Excel : 31 colonnes générées correctement
- [ ] (Optionnel) Premier produit synchronisé visible dans Merchant Center

---

## 🎯 Synchronisation Complète (Planification)

### Timing Recommandé
**J+7 minimum après Big Bang deployment** (selon `POST-DEPLOIEMENT-GOOGLE-MERCHANT.md`)

### Objectifs KPI
- **241 produits** dans catalogue Vérone
- **≥95% produits approuvés** par Google Merchant
- **<5% produits rejetés** (résolution sous 48h)

### Processus de Synchronisation Masse

1. **Phase 1 : Export Excel Complet**
   - Générer fichier avec tous les produits actifs
   - Validation manuelle des données (échantillon 10%)
   - Upload manuel dans Google Merchant Center (via UI)

2. **Phase 2 : Synchronisation API Incrémentale**
   - Activer sync automatique pour nouveaux produits
   - Updates produits existants via API
   - Monitoring Sentry temps réel

3. **Phase 3 : Monitoring et Optimisation**
   - Dashboard KPI : taux approbation, erreurs, performances
   - Corrections automatiques des rejets fréquents
   - Rapports hebdomadaires

---

## 🔧 Troubleshooting

### Erreur : "Invalid private key format"

**Cause** : Retours à la ligne non échappés dans `GOOGLE_MERCHANT_PRIVATE_KEY`

**Solution** :
```bash
# La clé doit contenir des \n littéraux
GOOGLE_MERCHANT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# PAS de retours à la ligne réels :
# ❌ INCORRECT :
GOOGLE_MERCHANT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADAN...
-----END PRIVATE KEY-----"
```

### Erreur : "Service account not found in Merchant Center"

**Cause** : Email service account mal orthographié ou pas ajouté

**Solution** :
1. Vérifier email exact depuis JSON : `client_email`
2. Copier-coller (ne pas retaper manuellement)
3. Vérifier dans https://merchants.google.com/mc/accounts/5495521926/users
4. Si absent : re-ajouter avec email exact

### Erreur : "API Content not enabled"

**Cause** : API pas activée ou mauvais projet sélectionné

**Solution** :
1. Aller sur https://console.cloud.google.com/apis/library/content.googleapis.com
2. **Vérifier projet sélectionné** (menu déroulant en haut)
3. Cliquer "ENABLE"
4. Attendre 30 secondes et retester

### Erreur : "Insufficient permissions"

**Cause** : Service account n'a pas role Admin

**Solution** :
1. https://merchants.google.com/mc/accounts/5495521926/users
2. Trouver le service account
3. Edit → Access level : "Admin"
4. Save

### Produit Rejeté : "Missing required attribute"

**Cause** : Données produit incomplètes (title, description, image, etc.)

**Solution** :
1. Vérifier logs Sentry : détails erreur Google
2. Corriger données produit dans Supabase
3. Re-synchroniser produit spécifique
4. Valider avec transformer : `validateGoogleMerchantProduct()`

---

## 📚 Références

### Documentation Interne
- [Setup Guide Original](../../manifests/technical-specs/google-merchant-setup.md)
- [Post-Déploiement Checklist](../deployment/POST-DEPLOIEMENT-GOOGLE-MERCHANT.md)
- [Session Variantes Architecture](../../MEMORY-BANK/archive/sessions/session-2025-09-30-variantes-dual-mode-google-merchant.md)

### Documentation Google Officielle
- [Content API for Shopping](https://developers.google.com/shopping-content/guides/quickstart)
- [Service Account Authentication](https://cloud.google.com/iam/docs/service-accounts)
- [Product Data Specification](https://support.google.com/merchants/answer/7052112)
- [Merchant Center Help](https://support.google.com/merchants/)

### Code Source
- Transformer API : `src/lib/google-merchant/transformer.ts`
- Transformer Excel : `src/lib/google-merchant/excel-transformer.ts`
- Configuration : `src/lib/google-merchant/config.ts`
- Route Test : `src/app/api/google-merchant/test-connection/route.ts`

---

## ✅ Validation Finale

**Critères de Succès** :
1. ✅ Test connexion : `authentication: true` + `apiConnection: true`
2. ✅ Export Excel : 31 colonnes avec données valides
3. ✅ 0 erreur console sur interface web
4. ✅ Premier produit synchronisé visible dans Merchant Center

**🎯 Configuration Complète → Prêt pour Synchronisation Masse**

---

**Créé le** : 2025-10-09
**Version** : 1.0
**Auteur** : Claude Code (Vérone Back Office Team)
