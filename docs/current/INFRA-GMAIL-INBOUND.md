# Guide de configuration — Pipeline Gmail Inbound (BO-MSG-001)

**Dernière mise à jour** : 2026-05-05

Ce guide explique comment configurer l'infrastructure Google Cloud pour que les
emails reçus sur `contact@veronecollections.fr`, `commandes@veronecollections.fr`,
`contact@linkme.network` et `commandes@linkme.network` apparaissent automatiquement
dans la page **Paramètres › Messagerie** du back-office.

---

## Comment ça fonctionne (en une phrase)

Quand un email arrive, Google nous envoie une notification automatique. Le
back-office récupère le contenu via l'API Gmail, puis l'enregistre pour que
Romeo et Imane puissent le consulter en ligne.

---

## Prérequis

- Accès admin au Google Workspace de Vérone (`admin.google.com`)
- Accès à la [Google Cloud Console](https://console.cloud.google.com)
- Le back-office est déployé sur Vercel (URL : `https://back-office.veronecollections.fr`)

---

## Étape 1 — Créer ou choisir un projet Google Cloud

1. Aller sur [console.cloud.google.com](https://console.cloud.google.com)
2. En haut, cliquer sur le nom de projet (liste déroulante)
3. Cliquer **Nouveau projet**
4. Nom : `Verone Inbound Email` (ou réutiliser un projet existant)
5. Cliquer **Créer**

---

## Étape 2 — Activer les APIs nécessaires

Dans la barre de recherche, chercher et activer :

1. **Gmail API**
   - Rechercher "Gmail API" → cliquer → **Activer**

2. **Cloud Pub/Sub API**
   - Rechercher "Cloud Pub/Sub API" → cliquer → **Activer**

---

## Étape 3 — Créer le compte de service (Service Account)

1. Menu gauche → **IAM et administration** → **Comptes de service**
2. **Créer un compte de service**
3. Nom : `gmail-inbound-reader`
4. ID : laissé auto (quelque chose comme `gmail-inbound-reader@VOTRE-PROJET.iam.gserviceaccount.com`)
5. Cliquer **Créer et continuer**
6. Aucun rôle à donner à ce stade → **Continuer** → **Terminer**

### Générer une clé JSON

1. Cliquer sur le compte de service créé
2. Onglet **Clés** → **Ajouter une clé** → **Créer une nouvelle clé**
3. Format : **JSON** → **Créer**
4. Un fichier `.json` se télécharge — **le conserver précieusement**

---

## Étape 4 — Activer la délégation d'autorité (Domain-Wide Delegation)

Cette étape permet au compte de service de lire les boîtes Gmail des groupes.

1. Sur la page du compte de service → onglet **Informations générales**
2. Section "Délégation au niveau du domaine" → **Modifier**
3. Cocher **Activer la délégation au niveau du domaine Google Workspace**
4. **Enregistrer**
5. Noter l'**ID client** qui apparaît (un grand nombre, ex: `123456789012345678901`)

---

## Étape 5 — Autoriser dans l'Admin Workspace

1. Aller sur [admin.google.com](https://admin.google.com)
2. **Sécurité** → **Accès et contrôle des données** → **Contrôles des API**
3. Cliquer **Gérer la délégation à l'échelle du domaine**
4. **Ajouter** → coller l'**ID client** du compte de service
5. Portées OAuth : coller exactement :
   ```
   https://www.googleapis.com/auth/gmail.readonly
   ```
6. **Autoriser**

---

## Étape 6 — Créer le topic Pub/Sub

1. Sur Google Cloud Console → **Pub/Sub** → **Topics**
2. **Créer un topic**
3. ID du topic : `gmail-inbound`
4. Laisser les autres options par défaut → **Créer**

### Donner les droits de publication à Gmail

1. Cliquer sur le topic `gmail-inbound`
2. Onglet **Autorisations**
3. **Ajouter un principal**
4. Principal : `gmail-api-push@system.gserviceaccount.com`
5. Rôle : **Éditeur Pub/Sub**
6. **Enregistrer**

---

## Étape 7 — Créer la subscription push

1. **Pub/Sub** → **Subscriptions** → **Créer une subscription**
2. ID : `gmail-inbound-push`
3. Sélectionner le topic `gmail-inbound`
4. Type de livraison : **Push**
5. URL du point de terminaison :
   ```
   https://back-office.veronecollections.fr/api/gmail/inbound
   ```
   (remplacer par l'URL réelle de Vercel si différente)
6. Activer l'**authentification** → **Ajouter un token**
7. Cliquer **Créer**

---

## Étape 8 — Configurer les variables d'environnement sur Vercel

Aller sur [Vercel Dashboard](https://vercel.com) → projet back-office → **Settings** → **Environment Variables**.

Ajouter ces 4 variables :

| Nom de la variable                  | Valeur                                                                                                        | Description                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `GMAIL_SERVICE_ACCOUNT_EMAIL`       | `gmail-inbound-reader@VOTRE-PROJET.iam.gserviceaccount.com`                                                   | Email du compte de service (dans le fichier JSON, champ `client_email`) |
| `GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY` | Contenu du champ `private_key` du fichier JSON (avec les `\n`)                                                | Clé privée PEM                                                          |
| `GMAIL_PUBSUB_VERIFICATION_TOKEN`   | Un mot de passe inventé (ex: 40 caractères aléatoires)                                                        | Protège l'endpoint contre les appels non autorisés                      |
| `GMAIL_WATCH_ADDRESSES`             | `contact@veronecollections.fr,commandes@veronecollections.fr,contact@linkme.network,commandes@linkme.network` | Les 4 adresses à surveiller (virgules, sans espaces)                    |

**Pour `GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY`** : ouvrir le fichier JSON téléchargé,
copier la valeur du champ `private_key` (qui commence par `-----BEGIN PRIVATE KEY-----`).

Cocher **Production**, **Preview**, **Development** pour chaque variable.

---

## Étape 9 — Activer la surveillance Gmail (users.watch)

Cette étape est à faire **après** le déploiement de Vercel avec les variables configurées.

Pour chacune des 4 adresses, il faut appeler l'API Gmail pour lui dire de nous
envoyer des notifications. Cela se fait via la commande suivante (à adapter) :

```bash
# Exemple pour contact@veronecollections.fr
curl -X POST \
  "https://gmail.googleapis.com/gmail/v1/users/contact@veronecollections.fr/watch" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topicName": "projects/VOTRE-PROJET/topics/gmail-inbound",
    "labelIds": ["INBOX"]
  }'
```

> **Note** : le `watch` expire après 7 jours. Un renouvellement automatique
> (cron job) sera mis en place dans un sprint futur (BO-MSG-002).

---

## Étape 10 — Vérification

1. Envoyer un email depuis une adresse externe vers `contact@veronecollections.fr`
2. Attendre 30 secondes maximum
3. Ouvrir le back-office → **Paramètres** → **Messagerie**
4. L'email doit apparaître dans la liste

Si rien n'apparaît :

- Vérifier les logs Vercel (Functions → `/api/gmail/inbound`)
- Vérifier que le topic Pub/Sub reçoit bien des messages (Google Cloud → Pub/Sub → Metrics)

---

## Résumé des variables d'environnement

```
GMAIL_SERVICE_ACCOUNT_EMAIL=gmail-inbound-reader@PROJET.iam.gserviceaccount.com
GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXX...\n-----END PRIVATE KEY-----\n"
GMAIL_PUBSUB_VERIFICATION_TOKEN=votre-token-secret-40-caracteres
GMAIL_WATCH_ADDRESSES=contact@veronecollections.fr,commandes@veronecollections.fr,contact@linkme.network,commandes@linkme.network
```

---

## Schéma du flux complet

```
Email reçu sur contact@veronecollections.fr
            ↓
      Gmail (Google)
            ↓ notification Pub/Sub
  POST /api/gmail/inbound (back-office Vercel)
            ↓ vérification token
  Gmail API → récupération message complet
            ↓ parsing + détection commande
  Supabase → INSERT email_messages
            ↓
  Page /parametres/messagerie → affichage
```

---

## Sécurité

- Le token de vérification (`GMAIL_PUBSUB_VERIFICATION_TOKEN`) protège l'endpoint
  contre les appels non autorisés.
- Le compte de service a uniquement le droit `gmail.readonly` — il ne peut
  **jamais** envoyer, supprimer ou modifier des emails.
- La table `email_messages` en base de données est protégée : seul le staff
  back-office peut y accéder (Romeo, Imane).

---

## Renouvellement du watch (important)

La surveillance Gmail (`users.watch`) expire **automatiquement après 7 jours**.
Il faut la renouveler avant expiration. Ce renouvellement automatique sera
implémenté dans le sprint BO-MSG-002.

En attendant, si les emails n'arrivent plus après 7 jours, relancer manuellement
le `watch` pour chaque adresse (étape 9).
