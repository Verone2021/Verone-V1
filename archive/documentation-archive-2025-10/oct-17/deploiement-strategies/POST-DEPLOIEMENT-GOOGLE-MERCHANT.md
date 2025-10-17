# 🛍️ FINALISATION GOOGLE MERCHANT CENTER - POST BIG BANG

**Date** : Octobre 2025
**Contexte** : Configuration Google Merchant après stabilisation déploiement Big Bang
**Prérequis** : Big Bang déployé et stable (J+7 minimum)

---

## 📅 Quand Activer Google Merchant ?

### Timing Recommandé

**J+7 minimum après Big Bang** (après bilan et stabilisation)

**Raisons** :
- ✅ Application stabilisée (bugs critiques résolus)
- ✅ Équipe formée sur 8 modules (adoption validée)
- ✅ Workflows métier validés (sourcing → stocks → commandes)
- ✅ Performance optimisée (SLOs respectés)

**Ne PAS activer avant** :
- ❌ Si erreurs Sentry critiques non résolues
- ❌ Si adoption utilisateurs <80%
- ❌ Si performance dégradée (Dashboard >2s)

---

## ⏱️ Effort Total

### Estimation

**2-3 heures** (configuration one-time)

**Breakdown détaillé** :
- **30 min** : Créer projet Google Cloud + Service Account
- **30 min** : Configurer Merchant Center + lier service account
- **30 min** : Copier variables env production (Vercel)
- **30 min** : Tests validation (connexion, export, sync)
- **30 min** : Debug éventuel + documentation

---

## 🔧 Configuration Étape par Étape

### Étape 1 : Google Cloud Console (30 min)

#### 1.1 Créer Projet Google Cloud

1. **Aller sur** [Google Cloud Console](https://console.cloud.google.com/)
2. **Créer nouveau projet** :
   - Nom : `verone-merchant-center`
   - Organisation : Vérone (si applicable)
   - Localisation : France
3. **Noter l'ID du projet** (ex: `verone-merchant-123456`)
   - Sera utilisé pour `GOOGLE_CLOUD_PROJECT_ID`

#### 1.2 Activer API Content for Shopping

1. **Dans Google Cloud Console** : Menu → **APIs & Services** → **Library**
2. **Rechercher** : "Content API for Shopping"
3. **Activer l'API** (bouton "ENABLE")
4. **Attendre** 2-3 minutes activation complète

#### 1.3 Créer Service Account

1. **Menu** → **IAM & Admin** → **Service Accounts**
2. **Create Service Account** :
   - **Name** : `verone-merchant-service`
   - **Description** : `Service account for Vérone Google Merchant Center integration`
   - **Create and Continue**

3. **Grant Roles** (étape 2) :
   - Ajouter rôle : **Content API User** (pour Google Merchant Center)
   - Optionnel : **Service Account Token Creator** (délégation)
   - **Continue**

4. **Skip** étape 3 (Grant users access) → **Done**

#### 1.4 Créer Clé JSON

1. **Service Accounts** → Cliquer sur `verone-merchant-service@...`
2. **Onglet Keys** → **Add Key** → **Create New Key**
3. **Sélectionner JSON** (pas P12)
4. **Create** → Fichier JSON téléchargé automatiquement

**⚠️ IMPORTANT** : Sauvegarder ce fichier dans un endroit sécurisé (PAS dans Git !)

#### 1.5 Extraire Variables du JSON

**Ouvrir le fichier JSON téléchargé** :

```json
{
  "type": "service_account",
  "project_id": "verone-merchant-123456",
  "private_key_id": "a1b2c3d4e5f6...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n",
  "client_email": "verone-merchant-service@verone-merchant-123456.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  ...
}
```

**Récupérer ces valeurs** :
- `project_id` → `GOOGLE_CLOUD_PROJECT_ID`
- `private_key_id` → `GOOGLE_MERCHANT_PRIVATE_KEY_ID`
- `private_key` → `GOOGLE_MERCHANT_PRIVATE_KEY` (avec `\n` pour sauts de ligne)
- `client_email` → `GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL`
- `client_id` → `GOOGLE_MERCHANT_CLIENT_ID`

---

### Étape 2 : Google Merchant Center Configuration (30 min)

#### 2.1 Accéder à Merchant Center

1. **Aller sur** [Google Merchant Center](https://merchants.google.com/)
2. **Se connecter** avec le compte Google Vérone
3. **Vérifier** : Merchant ID existe (ex: `5495521926`)

#### 2.2 Lier Service Account

1. **Dans Merchant Center** : **Settings** → **Account access**
2. **Add user** :
   - **Email** : Copier `client_email` du JSON (ex: `verone-merchant-service@...iam.gserviceaccount.com`)
   - **Permissions** : **Admin** ou **Standard** (recommandé : Admin pour tests)
3. **Save** → Vérifier email service account dans liste utilisateurs

#### 2.3 Vérifier Data Source

1. **Products** → **Feeds**
2. **Vérifier** : Data source "Cursor" (ID: `10571293810`) existe
3. **Si n'existe pas** :
   - **Add data source** → **API**
   - **Name** : "Vérone API Feed"
   - **Target country** : France (FR)
   - **Content language** : French (fr)
   - **Create**

#### 2.4 Configuration Pays/Langue/Devise

**Vérifier paramètres** :
- **Country** : France (FR)
- **Language** : Français (fr)
- **Currency** : EUR

Si modification nécessaire : **Settings** → **Account information**

---

### Étape 3 : Variables Environnement Vercel (30 min)

#### 3.1 Préparer Variables

**Créer fichier `.env.google-merchant` temporaire** (local uniquement) :

```env
# Variables à copier dans Vercel
GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL=verone-merchant-service@verone-merchant-123456.iam.gserviceaccount.com
GOOGLE_MERCHANT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
... (votre clé privée complète) ...
-----END PRIVATE KEY-----"
GOOGLE_MERCHANT_PRIVATE_KEY_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
GOOGLE_MERCHANT_CLIENT_ID=123456789012345678901
GOOGLE_CLOUD_PROJECT_ID=verone-merchant-123456
```

**⚠️ Important** : Private key doit inclure `\n` pour sauts de ligne ou être entourée de guillemets doubles

#### 3.2 Ajouter à Vercel

1. **Vercel Dashboard** → Projet `verone-backoffice` → **Settings** → **Environment Variables**

2. **Ajouter chaque variable** :
   - **Name** : `GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL`
   - **Value** : (coller valeur)
   - **Environments** : ✅ Production, ✅ Preview, ✅ Development
   - **Save**

3. **Répéter pour** :
   - `GOOGLE_MERCHANT_PRIVATE_KEY`
   - `GOOGLE_MERCHANT_PRIVATE_KEY_ID`
   - `GOOGLE_MERCHANT_CLIENT_ID`
   - `GOOGLE_CLOUD_PROJECT_ID`

4. **Vérifier** : 5 variables ajoutées avec succès

#### 3.3 Redéployer Application

**Vercel redéploie automatiquement** après ajout variables (2-3 min)

**Vérifier** :
- Deployments → Dernier build : ✅ Status "Ready"
- Variables accessibles dans code

---

### Étape 4 : Tests Validation (30 min)

#### 4.1 Test Connexion API

**Méthode 1 : Via Browser**

1. **Aller sur** : `https://votre-app.vercel.app/api/google-merchant/test-connection`
2. **Vérifier réponse JSON** :
```json
{
  "success": true,
  "message": "Google Merchant API connection successful",
  "merchant_id": "5495521926"
}
```

**Si erreur** :
- Vérifier variables env Vercel (typos)
- Vérifier service account lié Merchant Center
- Vérifier API activée Google Cloud

**Méthode 2 : Via Terminal**

```bash
curl https://votre-app.vercel.app/api/google-merchant/test-connection
```

#### 4.2 Test Export Excel

**URL** : `https://votre-app.vercel.app/api/exports/google-merchant-excel?download=true`

**Vérifier** :
- Fichier Excel téléchargé (`verone-google-merchant-YYYYMMDD.xlsx`)
- 241 produits présents (ou nombre produits catalogue)
- Colonnes conformes template Google (33+ champs)

**Colonnes attendues** :
- id, title, description, link, image_link, price, availability, condition, brand, gtin, mpn, google_product_category, ...

#### 4.3 Test Sync Produit Individuel

**Choisir 1 produit test** (avec image, prix, description complète)

**URL** : `https://votre-app.vercel.app/api/google-merchant/sync-product/[PRODUCT_ID]`

Exemple :
```bash
curl -X POST https://votre-app.vercel.app/api/google-merchant/sync-product/123
```

**Vérifier réponse** :
```json
{
  "success": true,
  "product_id": "123",
  "google_status": "active",
  "message": "Product synced to Google Merchant successfully"
}
```

**Vérifier dans Merchant Center** :
1. **Products** → **All products**
2. **Chercher** produit par SKU
3. **Statut** : "Active" ou "Pending review"

#### 4.4 Validation Feed Complet

**Méthode** : Synchronisation bulk (optionnel)

Si route `/api/google-merchant/sync-all` développée :

```bash
curl -X POST https://votre-app.vercel.app/api/google-merchant/sync-all
```

**Vérifier** :
- Réponse JSON avec nombre produits synchronisés
- Merchant Center : Tous produits visibles
- Statuts : "Active" pour produits conformes

---

### Étape 5 : Activation Production (30 min)

#### 5.1 Feature Flag Production

**Activer module Canaux de Vente** :

1. **Vercel Dashboard** → **Environment Variables**
2. **Ajouter/Modifier** :
   ```env
   NEXT_PUBLIC_CANAUX_VENTE_ENABLED=true
   ```
3. **Environments** : ✅ Production uniquement (pas Preview/Dev pour tests)
4. **Save** → Redéploiement automatique

#### 5.2 Synchronisation 241 Produits

**Option 1 : Via Interface UI**

1. **Aller sur** `/canaux-vente/google-merchant`
2. **Onglet** "Ajouter des Produits"
3. **Sélectionner tous produits** (241)
4. **Bouton** "Exporter vers Google"
5. **Attendre** synchronisation (2-5 min pour 241 produits)

**Option 2 : Via API Direct**

```bash
curl -X POST https://votre-app.vercel.app/api/google-merchant/sync-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 5.3 Validation Feed Google Merchant

**Dans Merchant Center** :

1. **Products** → **All products**
2. **Vérifier** :
   - Nombre produits : 241 (ou total catalogue)
   - Statuts : Majorité "Active" (≥95%)
   - Erreurs : <5% (normal pour validation Google)

3. **Diagnostics** → **Product issues**
   - Vérifier issues (titre trop long, image manquante, etc.)
   - Corriger si critique

4. **Performance** → **Feeds**
   - Vérifier data source active
   - Upload réussi

#### 5.4 Tests Utilisateur Final

**Scénario test complet** :

1. **Créer nouveau produit** (`/catalogue/create`)
   - Remplir tous champs obligatoires
   - Ajouter image principale
   - Prix renseigné

2. **Synchroniser produit** (`/canaux-vente/google-merchant`)
   - Sélectionner produit créé
   - Cliquer "Sync"
   - Vérifier message succès

3. **Valider dans Merchant Center** (5 min après)
   - Chercher produit par SKU
   - Vérifier présence
   - Statut "Active" ou "Pending"

4. **Console errors** :
   - MCP Browser check `/canaux-vente/google-merchant`
   - Vérifier 0 erreur console
   - Screenshot validation

---

## 🚨 Troubleshooting

### Erreur "Authentication failed"

**Symptômes** :
```json
{
  "error": "Authentication failed",
  "message": "Invalid service account credentials"
}
```

**Solutions** :
1. ✅ Vérifier toutes variables env Vercel (typos, espaces)
2. ✅ Vérifier private key complète avec `\n` pour sauts ligne
3. ✅ Vérifier service account a permissions "Content API User"
4. ✅ Re-télécharger JSON Google Cloud et copier valeurs

---

### Erreur "API not enabled"

**Symptômes** :
```json
{
  "error": "Content API for Shopping is not enabled"
}
```

**Solutions** :
1. ✅ Google Cloud Console → APIs & Services → Library
2. ✅ Chercher "Content API for Shopping"
3. ✅ Activer API
4. ✅ Attendre 5-10 minutes propagation

---

### Erreur "Access denied"

**Symptômes** :
```json
{
  "error": "Access denied to Merchant Center account"
}
```

**Solutions** :
1. ✅ Merchant Center → Settings → Account access
2. ✅ Vérifier email service account présent dans liste
3. ✅ Vérifier permissions : Admin ou Standard
4. ✅ Re-ajouter si absent

---

### Erreur "Data source not found"

**Symptômes** :
```json
{
  "error": "Data source 'Cursor' (ID: 10571293810) not found"
}
```

**Solutions** :
1. ✅ Merchant Center → Products → Feeds
2. ✅ Créer nouvelle data source si absente :
   - Type : API
   - Country : France (FR)
   - Language : French (fr)
3. ✅ Mettre à jour ID data source dans code si différent

---

### Produits en statut "Pending review"

**Normal** : Google valide produits sous 24-48h

**Accélérer validation** :
1. ✅ Vérifier qualité données (titres, descriptions, images)
2. ✅ Vérifier images haute résolution (≥800x800px)
3. ✅ Vérifier tous champs obligatoires remplis
4. ✅ Attendre 24h maximum

---

### Produits rejetés (Disapproved)

**Diagnostics** :
1. **Merchant Center** → **Products** → **All products**
2. **Filtrer** : Status = "Disapproved"
3. **Cliquer produit** → Voir raison rejet

**Raisons communes** :
- ❌ Image manquante ou trop petite (<800px)
- ❌ Titre trop long (>150 caractères)
- ❌ Prix = 0 ou manquant
- ❌ GTIN manquant (si requis catégorie)
- ❌ Description insuffisante (<50 caractères)

**Corrections** :
1. Corriger dans `/catalogue/[productId]`
2. Re-synchroniser produit
3. Attendre validation Google (1-24h)

---

## 📊 Monitoring Post-Activation

### KPIs Google Merchant (Suivre J+1 à J+7)

**Métriques Business** :

| Métrique | Objectif J+7 | Suivi |
|----------|--------------|-------|
| **Produits synchronisés** | 241 (100%) | Dashboard GMC |
| **Produits actifs** | ≥230 (≥95%) | Products → All products |
| **Impressions** | ≥1000 | Performance → Dashboard |
| **Clics** | ≥50 | Performance → Dashboard |
| **Conversions** | ≥3 | Performance → Dashboard |
| **CTR** | ≥2% | Calculé : Clics/Impressions |

**Sources de données** :
- Google Merchant Center → Performance → Dashboard
- Interface Vérone → `/canaux-vente/google-merchant` (stats temps réel)

### Alertes à Configurer

**Seuils critiques** :

1. **Produits rejetés >10%** → Investigation urgente
2. **Synchronisation échouée** → Vérifier API/credentials
3. **Impressions = 0 après 48h** → Vérifier feed/catégories
4. **CTR <1% après 7 jours** → Optimiser titres/images

**Notifications** :
- Email quotidien résumé (Google Merchant Center)
- Slack alert si >5% produits rejetés

---

## 📚 Références & Documentation

### Documents Internes

- **Setup complet** : [manifests/technical-specs/google-merchant-setup.md](../../manifests/technical-specs/google-merchant-setup.md)
- **Spécifications feeds** : [manifests/architecture/feeds-specifications-google.md](../../manifests/architecture/feeds-specifications-google.md)
- **Stratégie Big Bang** : [STRATEGIE-DEPLOIEMENT-BIG-BANG.md](./STRATEGIE-DEPLOIEMENT-BIG-BANG.md)

### Documentation Officielle Google

- [Google Merchant Center Help](https://support.google.com/merchants/)
- [Content API for Shopping](https://developers.google.com/shopping-content/guides/quickstart)
- [Product Data Specification](https://support.google.com/merchants/answer/7052112)
- [Service Accounts](https://cloud.google.com/iam/docs/service-accounts)

---

## ✅ Checklist Finalisation

### Pré-Activation

- [ ] Big Bang déployé et stable (J+7 minimum)
- [ ] Projet Google Cloud créé
- [ ] API Content for Shopping activée
- [ ] Service Account créé avec permissions
- [ ] Clé JSON téléchargée et sécurisée
- [ ] Variables env Vercel configurées (5 variables)
- [ ] Service account lié Merchant Center

### Tests Validation

- [ ] Test connexion API : ✅ Success
- [ ] Export Excel : ✅ 241 produits
- [ ] Sync produit individuel : ✅ Active
- [ ] Validation Merchant Center : ✅ Produit visible

### Activation Production

- [ ] Feature flag `CANAUX_VENTE_ENABLED=true`
- [ ] Synchronisation 241 produits : ✅ Complète
- [ ] Merchant Center : ≥95% produits actifs
- [ ] Console errors : 0 erreur
- [ ] Tests utilisateur : ✅ Workflow validé

### Monitoring

- [ ] KPIs Google Merchant J+1 vérifiés
- [ ] Alertes configurées (rejets, sync)
- [ ] Documentation utilisateur mise à jour
- [ ] Formation équipe effectuée

---

## 🎯 Prochaines Étapes

### Après Activation (J+1 à J+7)

1. **Optimisation Produits** (basé rejets Google)
   - Améliorer titres (mots-clés)
   - Enrichir descriptions (≥200 caractères)
   - Ajouter GTIN si manquants

2. **Optimisation Images**
   - Résolution ≥1200x1200px (recommandé Google)
   - Fond blanc ou neutre
   - Multiples angles produit

3. **Monitoring Performance**
   - Analyse impressions/clics
   - Optimisation CTR (titres accrocheurs)
   - A/B testing images

4. **Automatisation**
   - Synchronisation automatique quotidienne (cron)
   - Alertes auto si produit rejeté
   - Export rapports hebdomadaires

---

**Document créé le** : Octobre 2025
**Prochaine révision** : Post-activation (J+7 Google Merchant)
**Responsable** : Équipe Tech Vérone

🛍️ **Prêt pour activation Google Merchant Center !**
