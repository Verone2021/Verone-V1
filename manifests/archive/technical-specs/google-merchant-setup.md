# 🏪 Configuration Google Merchant Center - Guide Setup

## 📋 Variables d'Environnement Requises

Ajoutez ces variables à votre fichier `.env.local` :

```env
# Google Merchant Center Configuration
GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_MERCHANT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
GOOGLE_MERCHANT_PRIVATE_KEY_ID=your-key-id
GOOGLE_MERCHANT_CLIENT_ID=your-client-id
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project

# URLs (déjà configuré dans votre .env.local)
NEXT_PUBLIC_APP_URL=https://verone.com
```

## 🔧 Configuration Google Cloud Console

### Étape 1: Créer un Projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Notez l'ID du projet pour `GOOGLE_CLOUD_PROJECT_ID`

### Étape 2: Activer l'API Google Merchant Center

1. Dans Google Cloud Console, allez dans **APIs & Services > Library**
2. Recherchez "Merchant API"
3. Cliquez sur **"Merchant API"** et activez-la
4. Attendez quelques minutes que l'API soit disponible

### Étape 3: Créer un Service Account

1. Allez dans **IAM & Admin > Service Accounts**
2. Cliquez **Create Service Account**
3. Nom : `verone-merchant-center-service`
4. Description : `Service account for Vérone Google Merchant Center integration`
5. Cliquez **Create and Continue**

### Étape 4: Attribuer les Rôles

Ajoutez ces rôles au Service Account :
- **Content API User** (pour Google Merchant Center)
- **Service Account Token Creator** (optionnel pour délégation)

### Étape 5: Créer une Clé JSON

1. Dans **Service Accounts**, cliquez sur votre service account
2. Allez dans **Keys > Add Key > Create New Key**
3. Sélectionnez **JSON** et téléchargez le fichier
4. Le fichier contient toutes les informations nécessaires

### Étape 6: Extraire les Variables

Depuis le fichier JSON téléchargé, récupérez :
```json
{
  "type": "service_account",
  "project_id": "votre-projet-id",
  "private_key_id": "votre-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "votre-service-account@projet.iam.gserviceaccount.com",
  "client_id": "votre-client-id",
  ...
}
```

## 🏪 Configuration Google Merchant Center

### Étape 1: Accéder à Merchant Center

1. Allez sur [Google Merchant Center](https://merchants.google.com/)
2. Connectez-vous avec le compte Google associé à Vérone (compte 5495521926)

### Étape 2: Lier le Service Account

1. Dans Merchant Center, allez dans **Settings > Account access**
2. Cliquez **Add user**
3. Ajoutez l'email du service account : `your-service-account@your-project.iam.gserviceaccount.com`
4. Donnez les permissions **Standard** ou **Admin**

### Étape 3: Vérifier la Data Source

1. Allez dans **Products > Feeds**
2. Vérifiez que la data source "Cursor" (ID: 10571293810) existe
3. Si elle n'existe pas, créez une nouvelle data source :
   - Type : **API**
   - Target country : **France (FR)**
   - Content language : **French (fr)**

## 🧪 Test de Configuration

Une fois configuré, testez avec :

```bash
# Test de connexion
curl http://localhost:3000/api/google-merchant/test-connection

# Test d'export Excel
curl http://localhost:3000/api/exports/google-merchant-excel?download=false
```

## 📝 Exemple .env.local Complet

```env
# Supabase (existant)
NEXT_PUBLIC_SUPABASE_URL=https://aorroydfjsrygmosnzrl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application (existant)
NEXT_PUBLIC_APP_URL=https://verone.com

# Google Merchant Center (nouveau)
GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL=verone-merchant@your-project-123456.iam.gserviceaccount.com
GOOGLE_MERCHANT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
... (votre clé privée complète) ...
-----END PRIVATE KEY-----"
GOOGLE_MERCHANT_PRIVATE_KEY_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
GOOGLE_MERCHANT_CLIENT_ID=123456789012345678901
GOOGLE_CLOUD_PROJECT_ID=your-project-123456
```

## ⚠️ Sécurité

- **JAMAIS** committer le fichier `.env.local` avec les vraies clés
- Stockez les clés de production dans votre gestionnaire de secrets (Vercel, AWS Secrets Manager, etc.)
- Rotez les clés régulièrement
- Surveillez les logs d'accès à l'API

## 🚀 Après Configuration

1. Redémarrez votre serveur de développement
2. Testez la connexion via `/api/google-merchant/test-connection`
3. Essayez un export Excel via `/api/exports/google-merchant-excel`
4. Synchronisez un produit test via `/api/google-merchant/sync-product/[id]`

## 🆘 Dépannage

### Erreur "Authentication failed"
- Vérifiez que toutes les variables d'environnement sont correctement définies
- Assurez-vous que la clé privée est complète avec `\\n` pour les sauts de ligne
- Vérifiez que le service account a les bonnes permissions

### Erreur "API not enabled"
- Vérifiez que la Merchant API est activée dans Google Cloud Console
- Attendez quelques minutes après l'activation

### Erreur "Access denied"
- Vérifiez que le service account est ajouté dans Google Merchant Center
- Assurez-vous qu'il a les permissions appropriées

### Erreur "Data source not found"
- Vérifiez l'ID de la data source dans Google Merchant Center
- Mettez à jour `GOOGLE_MERCHANT_CONFIG.dataSourceId` si nécessaire