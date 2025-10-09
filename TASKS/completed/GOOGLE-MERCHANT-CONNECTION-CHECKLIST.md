# ✅ Checklist - Connexion Google Merchant Center

**Objectif** : Valider la configuration complète Google Merchant Center
**Durée estimée** : 40-50 minutes
**Guide détaillé** : [docs/guides/GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md](../../docs/guides/GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md)

---

## 📋 Pré-requis

- [ ] Compte Google Merchant Center actif (ID: 5495521926)
- [ ] Accès Admin au compte Merchant Center
- [ ] Accès Google Cloud Console
- [ ] Serveur dev local fonctionnel (`npm run dev`)

---

## 🚀 Étape 1 : Google Cloud Service Account (15 min)

### Configuration Initiale
- [ ] Accéder à https://console.cloud.google.com/iam-admin/serviceaccounts
- [ ] Sélectionner ou créer projet Vérone
- [ ] Noter le **Project ID** exact : `________________`

### Création Service Account
- [ ] Cliquer "CREATE SERVICE ACCOUNT"
- [ ] Nom : `google-merchant-verone`
- [ ] Description : `Service account pour synchronisation Google Merchant Center`
- [ ] Cliquer "CREATE AND CONTINUE"

### Attribution Permissions
- [ ] Role sélectionné : **Service Account User**
- [ ] Alternative (si erreurs) : **Editor**
- [ ] Cliquer "CONTINUE" → "DONE"

### Génération Clé JSON
- [ ] Trouver `google-merchant-verone` dans la liste
- [ ] Cliquer 3 points (⋮) → "Manage keys"
- [ ] "Add Key" → "Create new key"
- [ ] Type : **JSON** (par défaut)
- [ ] Cliquer "CREATE"
- [ ] **Fichier téléchargé** : `verone-prod-123456-abc123def456.json` ✅
- [ ] Sauvegarder dans endroit sécurisé (JAMAIS dans Git)

### Vérification JSON
- [ ] Fichier contient `"type": "service_account"`
- [ ] Fichier contient `"project_id"`
- [ ] Fichier contient `"private_key"`
- [ ] Fichier contient `"client_email"`
- [ ] Fichier contient `"client_id"`

---

## 🏪 Étape 2 : Google Merchant Center Access (10 min)

### Activation API Content
- [ ] Ouvrir https://console.cloud.google.com/apis/library/content.googleapis.com
- [ ] **Vérifier bon projet sélectionné** (menu déroulant en haut)
- [ ] Cliquer "ENABLE"
- [ ] Attendre confirmation "API enabled" (~10 secondes)

### Ajout Service Account
- [ ] Ouvrir https://merchants.google.com/mc/accounts/5495521926/users
- [ ] Se connecter avec compte propriétaire Merchant Center
- [ ] Settings (⚙️) → "Account access"
- [ ] Cliquer "Add user" ou "+"

### Configuration Utilisateur
- [ ] **Email** : copier depuis JSON `client_email`
  - Format : `google-merchant-verone@PROJECT-ID.iam.gserviceaccount.com`
  - Email exact : `________________________________`
- [ ] **Access level** : Sélectionner **Admin**
- [ ] Alternative minimale : "Standard" avec permissions "Content API"
- [ ] Cliquer "SEND INVITATION"

### Validation
- [ ] Service account apparaît dans liste utilisateurs
- [ ] Status : **Active** (immédiat, pas besoin d'accepter)
- [ ] Vérifier Data Source "Cursor" existe (ID: 10571293810)

---

## 🔐 Étape 3 : Variables d'Environnement (5 min)

### Extraction depuis JSON

**Ouvrir fichier JSON téléchargé** et extraire :

| Variable | Clé JSON | Valeur extraite |
|----------|----------|-----------------|
| `GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL` | `client_email` | `___________________` |
| `GOOGLE_MERCHANT_PRIVATE_KEY` | `private_key` | `___________________` |
| `GOOGLE_MERCHANT_PRIVATE_KEY_ID` | `private_key_id` | `___________________` |
| `GOOGLE_MERCHANT_CLIENT_ID` | `client_id` | `___________________` |
| `GOOGLE_CLOUD_PROJECT_ID` | `project_id` | `___________________` |

### Configuration .env.local

- [ ] Créer ou éditer `.env.local` à la racine
- [ ] Copier template depuis `.env.example` (section Google Merchant)
- [ ] Remplacer valeurs avec celles extraites ci-dessus

### Vérifications Critiques

**Format Private Key** :
- [ ] Commence par `"-----BEGIN PRIVATE KEY-----\n`
- [ ] Retours à la ligne = `\n` (échappés, pas réels)
- [ ] Termine par `\n-----END PRIVATE KEY-----\n"`
- [ ] **Guillemets doubles** autour de la valeur

**Sécurité** :
- [ ] `.env.local` dans `.gitignore` (déjà configuré)
- [ ] Fichier JSON original stocké hors Git
- [ ] Aucune clé exposée dans code source

### Redémarrage Serveur

- [ ] Arrêter serveur dev actuel (Ctrl+C)
- [ ] Lancer `npm run dev`
- [ ] Vérifier démarrage sans erreur

---

## ✅ Étape 4 : Tests de Validation (10 min)

### Test 1 : Connexion API (Terminal)

```bash
curl http://localhost:3000/api/google-merchant/test-connection | jq
```

**Résultat attendu** :
- [ ] `"success": true`
- [ ] `"authentication": true`
- [ ] `"apiConnection": true`
- [ ] `"accountId": "5495521926"`
- [ ] `"dataSourceId": "10571293810"`

**Si erreur** :
- [ ] Vérifier format `GOOGLE_MERCHANT_PRIVATE_KEY` (retours `\n` échappés)
- [ ] Vérifier API Content activée
- [ ] Vérifier service account ajouté avec role Admin

### Test 2 : Connexion Étendue (Terminal)

```bash
curl -X POST http://localhost:3000/api/google-merchant/test-connection \
  -H "Content-Type: application/json" \
  -d '{"includeProductList": true}' | jq
```

**Résultat attendu** :
- [ ] `"success": true`
- [ ] `"productListTest.success": true`
- [ ] `"productListTest.productCount": 5` (ou nombre produits)

### Test 3 : Interface Web (Navigateur)

- [ ] Ouvrir http://localhost:3000/canaux-vente/google-merchant
- [ ] Ouvrir DevTools (F12) → Console
- [ ] **Vérifier 0 erreur console** ✅
- [ ] Cliquer bouton "Tester Connexion"
- [ ] Message attendu : "✅ Connexion Google Merchant réussie"

### Test 4 : Export Excel

- [ ] Sur page Google Merchant, cliquer "Exporter vers Excel"
- [ ] Fichier téléchargé : `google-merchant-export-YYYYMMDD-HHmmss.xlsx` ✅
- [ ] Ouvrir fichier Excel

**Vérifications** :
- [ ] **31 colonnes** présentes (id, title, description, availability, link, image link, price, gtin, mpn, brand, condition, item group id, ...)
- [ ] Données produits correctement remplies
- [ ] Pas de cellules `#N/A` ou erreurs formule
- [ ] Format prix correct (nombres décimaux)

### Test 5 : Synchronisation Premier Produit (Optionnel)

**⚠️ ATTENTION** : Ce test envoie réellement un produit vers Google Merchant Center

**Sélectionner produit test** :
- [ ] SKU complet : `________________`
- [ ] Nom présent ✅
- [ ] Description présente ✅
- [ ] Prix > 0 ✅
- [ ] Image disponible ✅
- [ ] GTIN ou MPH présent (identifierExists = true) ✅

**Synchronisation** :
- [ ] Interface web : Onglet "Produits"
- [ ] Rechercher SKU du produit test
- [ ] Cliquer "Synchroniser avec Google"
- [ ] Message succès affiché

**Vérification Google Merchant Center** :
- [ ] Ouvrir https://merchants.google.com/mc/products
- [ ] Chercher SKU du produit
- [ ] Status initial : **Pending** ✅
- [ ] Attendre ~15 minutes
- [ ] Status final : **Approved** ✅ (ou détails erreur si rejeté)

---

## 📊 Validation Finale

### Checklist Globale

**Google Cloud** :
- [x] Service Account créé
- [x] Clé JSON téléchargée et sauvegardée
- [x] API Content activée
- [x] Project ID noté

**Merchant Center** :
- [x] Service account ajouté dans Users
- [x] Access level "Admin" accordé
- [x] Data Source ID vérifié (10571293810)
- [x] Status "Active" confirmé

**Variables .env.local** :
- [x] 5 variables configurées
- [x] Format Private Key correct (`\n` échappés)
- [x] Fichier dans .gitignore
- [x] Serveur redémarré

**Tests Réussis** :
- [x] `GET /test-connection` → authentication: true
- [x] `GET /test-connection` → apiConnection: true
- [x] `POST /test-connection` → productListTest réussie
- [x] Interface web → 0 erreur console
- [x] Export Excel → 31 colonnes générées
- [x] (Optionnel) Premier produit synchronisé visible

### Critères de Succès ✅

- **Authentication** : ✅ / ❌
- **API Connection** : ✅ / ❌
- **Export Excel** : ✅ / ❌
- **Console Clean** : ✅ / ❌
- **Premier Produit** : ✅ / ❌ / N/A

**🎯 Configuration Complète** : OUI / NON

---

## 🔧 Troubleshooting Rapide

### Erreur : "Invalid private key format"
**Cause** : Retours à la ligne non échappés
**Solution** : Vérifier `\n` littéraux dans GOOGLE_MERCHANT_PRIVATE_KEY

### Erreur : "Service account not found"
**Cause** : Email mal orthographié
**Solution** : Copier-coller `client_email` exact depuis JSON

### Erreur : "API Content not enabled"
**Cause** : API pas activée ou mauvais projet
**Solution** : Activer sur https://console.cloud.google.com/apis/library/content.googleapis.com

### Erreur : "Insufficient permissions"
**Cause** : Role pas Admin
**Solution** : Merchant Center → Users → Edit service account → Admin

---

## 📅 Prochaines Étapes

### Synchronisation Masse (Planifié J+7)

**Objectifs** :
- [ ] 241 produits dans catalogue Vérone
- [ ] ≥95% produits approuvés Google Merchant
- [ ] <5% produits rejetés (résolution <48h)

**Processus** :
1. Export Excel complet (tous produits actifs)
2. Validation données (échantillon 10%)
3. Upload manuel Google Merchant Center
4. Monitoring approvals quotidien
5. Corrections automatiques rejets fréquents

### Monitoring Continue

- [ ] Dashboard KPI : taux approbation, erreurs
- [ ] Sentry alerts temps réel
- [ ] Rapports hebdomadaires performances

---

## 📚 Références

**Documentation** :
- Guide complet : [docs/guides/GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md](../../docs/guides/GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md)
- Setup original : [manifests/technical-specs/google-merchant-setup.md](../../manifests/technical-specs/google-merchant-setup.md)
- Post-déploiement : [docs/deployment/POST-DEPLOIEMENT-GOOGLE-MERCHANT.md](../../docs/deployment/POST-DEPLOIEMENT-GOOGLE-MERCHANT.md)

**URLs Clés** :
- Google Cloud Console : https://console.cloud.google.com
- Merchant Center : https://merchants.google.com/mc/accounts/5495521926
- API Content : https://console.cloud.google.com/apis/library/content.googleapis.com

---

**Date validation** : _______________
**Validé par** : _______________
**Configuration complète** : ✅ / ❌

---

**Version** : 1.0
**Créé le** : 2025-10-09
**Auteur** : Claude Code (Vérone Back Office Team)
