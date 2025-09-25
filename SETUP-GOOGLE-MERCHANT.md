# 🔗 Configuration Google Merchant Center - Vérone

## 📋 Guide de Configuration Complète

### 🎯 Prérequis
- Accès au compte Google Merchant Center Vérone (Account ID: 5495521926)
- Accès au Google Cloud Console du projet associé
- Permissions administrateur sur les deux plateformes

---

## 🔧 Phase 1: Création Service Account Google Cloud

### 1.1 Accéder au Google Cloud Console
1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionner le projet lié au compte Merchant Center Vérone
3. Naviguer vers **IAM & Admin** > **Service Accounts**

### 1.2 Créer le Service Account
1. Cliquer sur **"Create Service Account"**
2. **Nom** : `verone-merchant-integration`
3. **Description** : `Service account for Vérone back-office Google Merchant Center integration`
4. Cliquer **"Create and Continue"**

### 1.3 Assigner les Rôles
Ajouter les rôles suivants :
- **`Content API for Shopping Admin`** (rôle principal)
- **`Service Account User`** (pour l'authentification)

### 1.4 Télécharger la Clé JSON
1. Dans la liste des Service Accounts, cliquer sur le nouveau service account
2. Aller dans l'onglet **"Keys"**
3. Cliquer **"Add Key"** > **"Create new key"**
4. Sélectionner **JSON** et télécharger le fichier

---

## 🔧 Phase 2: Configuration Variables d'Environnement

### 2.1 Extraire les Credentials du JSON
Ouvrir le fichier JSON téléchargé et extraire :
- `client_email` → `GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_MERCHANT_PRIVATE_KEY`

### 2.2 Modifier .env.local
Remplacer dans `/Users/romeodossantos/verone-back-office/.env.local` :

```bash
# ---------- GOOGLE MERCHANT CENTER ----------
GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL=votre-service-account@votre-projet.iam.gserviceaccount.com
GOOGLE_MERCHANT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
Votre clé privée ici (remplacer \\n par de vraies nouvelles lignes)
-----END PRIVATE KEY-----"
```

⚠️ **Important** : La clé privée doit conserver les vrais retours à la ligne, pas `\\n`

---

## 🔧 Phase 3: Configuration Google Merchant Center

### 3.1 Lier le Service Account
1. Aller sur [Google Merchant Center](https://merchants.google.com)
2. Sélectionner le compte Vérone (5495521926)
3. **Settings** > **Account access** > **Users**
4. **Add user** avec l'email du service account
5. Assigner les permissions **Admin** ou **Standard**

### 3.2 Vérifier le Data Source
- **Data Source ID** : 10571293810 ("Cursor")
- Vérifier qu'il est actif et configuré pour les produits Vérone

---

## 🧪 Phase 4: Tests de Validation

### 4.1 Test de Connexion
```bash
curl -X GET "http://localhost:3000/api/google-merchant/test-connection"
```

**Résultat attendu** :
```json
{
  "success": true,
  "data": {
    "authentication": true,
    "apiConnection": true,
    "accountId": "5495521926",
    "dataSourceId": "10571293810"
  }
}
```

### 4.2 Test Synchronisation Produit
```bash
# Utiliser un ID de produit existant (ex: Chaise Design Rouge)
curl -X POST "http://localhost:3000/api/google-merchant/sync-product/584e42e0-dbde-4178-972b-7f85a78deb4e"
```

### 4.3 Interface Admin
- Naviguer vers `http://localhost:3000/admin/google-merchant`
- Vérifier le tableau de bord et les fonctionnalités

---

## 🔒 Sécurité

### Bonnes Pratiques
- ✅ Ne jamais exposer les clés privées côté client
- ✅ Utiliser uniquement en server-side (API routes)
- ✅ Rotating périodique des clés (recommandé : 90 jours)
- ✅ Monitoring des accès via Google Cloud Console

### Variables d'Environnement
- 🔒 `.env.local` est dans `.gitignore` (ne sera pas commité)
- 🔒 Variables réservées aux environnements de production via Vercel/Supabase

---

## 📞 Support & Troubleshooting

### Erreurs Communes
1. **"Authentication failed"** → Vérifier email/clé privée dans .env.local
2. **"Access denied"** → Vérifier permissions Service Account dans Merchant Center
3. **"Data source not found"** → Vérifier que le Data Source ID 10571293810 existe

### Contact
- **Développeur** : Claude Code Assistant
- **Documentation** : Google Merchant Center API v1beta
- **Support Google** : Google Cloud Support (si compte premium)

---

*Vérone Back Office - Google Merchant Center Integration Guide*
*Dernière mise à jour : 2025-09-23*