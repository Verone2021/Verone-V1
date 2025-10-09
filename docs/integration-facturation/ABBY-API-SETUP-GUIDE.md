# 🔑 Guide Configuration API Abby.fr - Vérone Back Office

**Date**: 2025-10-10
**Objectif**: Obtenir l'accès API Abby.fr pour l'intégration facturation

---

## 📋 Prérequis

### 1. Compte Abby Professionnel

Vous devez avoir un compte Abby.fr avec un **abonnement professionnel** pour accéder à l'API.

**Vérifier votre abonnement** :
1. Connexion → https://app.abby.fr/
2. Menu utilisateur (haut droite) → **Mon compte** → **Abonnement**
3. Vérifier : Type = **Professionnel** ou **Entreprise**

❌ **Abonnement Gratuit** → Pas d'accès API
✅ **Abonnement Professionnel** → Accès API complet

---

## 🔧 Étapes Configuration

### Étape 1 : Activer l'Accès API

1. **Connexion** : https://app.abby.fr/
2. **Navigation** : Menu gauche → **Paramètres** → **Intégrations & API**
3. **Activer API** :
   - Toggle "Activer l'accès API" → **ON**
   - Accepter les conditions d'utilisation API

### Étape 2 : Générer Clé API

1. **Section "Clés API"** :
   - Cliquer sur **"Générer une nouvelle clé API"**
   - Nom de la clé : `Vérone Back Office Integration`
   - Permissions : **Lecture + Écriture** (Full Access)
   - Cliquer sur **"Générer"**

2. **Copier la clé API** :
   ```
   Format attendu : abby_sk_live_xxxxxxxxxxxxxxxxxxxxx
   ```

   ⚠️ **IMPORTANT** : Cette clé ne sera affichée qu'**UNE SEULE FOIS** !

### Étape 3 : Ajouter dans .env.local

1. Ouvrir le fichier `.env.local` à la racine du projet
2. Ajouter ces lignes à la fin du fichier :

```bash
# ---------- ABBY FACTURATION API ----------
# API Key générée depuis https://app.abby.fr/settings/integrations
ABBY_API_KEY=abby_sk_live_xxxxxxxxxxxxxxxxxxxxx

# Base URL de l'API Abby
ABBY_API_BASE_URL=https://api.abby.fr/v1

# Webhook Secret (sera fourni par Abby après configuration webhooks)
ABBY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# ID Organisation Abby (récupéré depuis GET /me)
ABBY_ORGANIZATION_ID=org_xxxxxxxxxxxxxxxxxxxxx
```

3. **Remplacer** `xxxxxxxxxxxxxxxxxxxxx` par votre vraie clé API

4. **Sauvegarder** le fichier

---

## 🧪 Test de Connexion API

### Test 1 : Vérifier l'Authentification

Exécuter cette commande dans un terminal :

```bash
curl -X GET https://api.abby.fr/v1/me \
  -H "Authorization: Bearer abby_sk_live_VOTRE_CLE_ICI" \
  -H "Content-Type: application/json"
```

**Réponse attendue** (200 OK) :
```json
{
  "id": "user_xxxxx",
  "email": "votre.email@verone.com",
  "organization": {
    "id": "org_xxxxx",
    "name": "Vérone"
  }
}
```

❌ **Erreur 401** → Clé API invalide ou expirée
❌ **Erreur 403** → Permissions insuffisantes
✅ **200 OK** → Connexion fonctionnelle

### Test 2 : Tester Endpoint Création Facture

```bash
curl -X POST https://api.abby.fr/v1/invoices \
  -H "Authorization: Bearer abby_sk_live_VOTRE_CLE_ICI" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "company_name": "Test Client",
      "email": "test@example.com"
    },
    "items": [{
      "description": "Produit Test",
      "quantity": 1,
      "unit_price": 100.00
    }],
    "status": "draft"
  }'
```

**Réponse attendue** (201 Created) :
```json
{
  "id": "inv_xxxxx",
  "number": "FA-2025-00001",
  "status": "draft",
  "total_amount": 100.00
}
```

✅ **201 Created** → Endpoint fonctionnel
❌ **Erreur 400** → Format requête invalide
❌ **Erreur 404** → Endpoint n'existe pas (problème grave!)

---

## 🔔 Configuration Webhooks

### Étape 1 : Obtenir URL de Réception

Une fois l'application déployée sur Vercel :
```
https://verone-back-office.vercel.app/api/webhooks/abby/invoice-status
```

### Étape 2 : Configurer dans Abby

1. **Abby Dashboard** → **Paramètres** → **Webhooks**
2. **Ajouter un webhook** :
   - URL : `https://verone-back-office.vercel.app/api/webhooks/abby/invoice-status`
   - Événements :
     - ✅ `invoice.paid` (paiement reçu)
     - ✅ `invoice.updated` (statut changé)
     - ✅ `payment.created` (nouveau paiement)
   - Secret : Copier le secret généré

3. **Mettre à jour .env.local** :
```bash
ABBY_WEBHOOK_SECRET=whsec_le_secret_fourni_par_abby
```

### Étape 3 : Tester Webhook

Abby fournit un bouton **"Envoyer un événement test"** :
1. Sélectionner événement `invoice.paid`
2. Cliquer **"Envoyer test"**
3. Vérifier logs dans application Vérone

---

## ❓ Troubleshooting

### Problème 1 : "API Key invalide"

**Symptôme** : Erreur 401 Unauthorized

**Solutions** :
1. Vérifier que la clé commence par `abby_sk_live_`
2. Vérifier qu'il n'y a pas d'espace avant/après dans .env.local
3. Redémarrer le serveur Next.js après modification .env.local
4. Générer une nouvelle clé API si expirée

### Problème 2 : "Endpoint POST /invoices n'existe pas"

**Symptôme** : Erreur 404 Not Found

**Solutions** :
1. Vérifier la documentation officielle Abby : https://docs.abby.fr/api
2. Contacter support Abby : support@abby.fr
3. **Plan B** : Pivote vers Pennylane API (architecture identique)

### Problème 3 : "Webhooks ne fonctionnent pas"

**Symptôme** : Aucun événement reçu

**Solutions** :
1. Vérifier que URL webhook est accessible publiquement (pas localhost!)
2. Vérifier logs webhook dans Abby Dashboard
3. Tester avec ngrok en développement :
   ```bash
   ngrok http 3000
   # URL: https://xxxx.ngrok.io/api/webhooks/abby/invoice-status
   ```

---

## 📞 Support Abby

- **Documentation** : https://docs.abby.fr/api
- **Email Support** : support@abby.fr
- **Chat Live** : Disponible dans app.abby.fr (bouton bas droite)

---

## ✅ Checklist Validation

Avant de passer à l'étape suivante (Sprint 1 - Migrations) :

- [ ] Compte Abby professionnel actif
- [ ] Clé API générée et ajoutée dans .env.local
- [ ] Test `GET /me` retourne 200 OK
- [ ] Test `POST /invoices` retourne 201 Created (ou 404 si endpoint manquant)
- [ ] Organization ID récupéré et ajouté dans .env.local
- [ ] Webhook secret configuré (optionnel pour Sprint 1)

**Si endpoint POST /invoices retourne 404** → Contacter support Abby **AVANT** Sprint 1

---

*Guide créé le 2025-10-10 - Vérone Back Office - Intégration Abby.fr*
