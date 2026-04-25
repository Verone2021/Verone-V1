# Meta Commerce — Procédure de configuration

**Date** : 2026-04-25 — Reconstitution suite à perte de la documentation antérieure.

Procédure pour récupérer les credentials Meta et configurer le canal Meta Commerce en production.

---

## Préalable

- Accès admin au Meta Business Manager Verone
- Accès admin au compte Vercel `verone2021s-projects/verone-back-office`
- Vercel CLI installé localement (`vercel whoami` doit retourner ton compte)

---

## Étape 1 — Récupérer le Business Manager ID

1. Aller sur https://business.facebook.com/settings
2. Section **Informations sur l'entreprise**
3. Noter **l'ID d'entreprise** (15-16 chiffres)

---

## Étape 2 — Vérifier le Catalog ID Verone

Le catalog ID est déjà connu : `1223749196006844` (cf. `meta_commerce_syncs.catalog_id` default en DB).

Pour vérifier qu'il existe encore :

1. https://business.facebook.com/products/catalogs
2. Cliquer sur "Vérone Collections" (ou nom équivalent)
3. URL doit contenir `/catalog/1223749196006844`

Si le catalogue a été supprimé, en recréer un :

1. https://business.facebook.com/products/catalogs/new
2. Type : **E-commerce**
3. Mode : **Données téléchargées** (manuelle/API, pas Pixel)
4. Noter le nouveau catalog_id pour la variable d'env

---

## Étape 3 — Créer un System User + Access Token

**Pourquoi un System User ?** Les tokens user normaux expirent en 60 jours. Les tokens System User n'expirent jamais (sauf révocation manuelle).

1. https://business.facebook.com/settings/system-users
2. Cliquer **"Ajouter"** → créer un System User nommé `verone-meta-sync`
3. Rôle : **Admin**
4. Cliquer sur l'utilisateur créé → bouton **"Générer un nouveau jeton d'accès"**
5. **Application** : sélectionner l'app Meta Verone (ou en créer une si absente — section ci-dessous)
6. **Permissions** :
   - `catalog_management`
   - `business_management`
7. **Expiration** : Sans expiration
8. Copier le token généré (commence par `EAA...`)

⚠️ **Stocker ce token immédiatement** dans un gestionnaire de secrets. Il ne sera plus visible après fermeture de la modal.

---

## Étape 4 — Si l'app Meta n'existe pas

1. https://developers.facebook.com/apps/
2. Créer une app type **Business**
3. Lui ajouter le produit **Marketing API**
4. Vérifier que l'app est associée à la business `Vérone Collections`
5. App ID + App Secret stockés (à conserver pour rotation future du token)

---

## Étape 5 — Donner accès au catalog au System User

1. https://business.facebook.com/products/catalogs/[catalog_id]/permissions
2. Ajouter le System User `verone-meta-sync`
3. Permissions : **Manage catalog**

Sans cette étape, l'API renvoie 403 même avec un token valide.

---

## Étape 6 — Configurer Vercel

```bash
cd /Users/romeodossantos/verone-back-office-V1/apps/back-office

# Production
vercel env add META_ACCESS_TOKEN production
# Coller le token EAA... quand demandé

vercel env add META_CATALOG_ID production
# Coller : 1223749196006844

# Preview (mêmes valeurs que production)
vercel env add META_ACCESS_TOKEN preview
vercel env add META_CATALOG_ID preview

# Development (mêmes valeurs OU un catalogue de test si existant)
vercel env add META_ACCESS_TOKEN development
vercel env add META_CATALOG_ID development
```

Vérifier ensuite :

```bash
vercel env ls --cwd /Users/romeodossantos/verone-back-office-V1/apps/back-office | grep META
```

Doit lister 6 lignes (3 envs × 2 variables).

---

## Étape 7 — Pull en local pour développement

```bash
cd /Users/romeodossantos/verone-back-office-V1/apps/back-office
vercel env pull .env.local
```

Cela rajoute les nouvelles variables Meta dans `.env.local`. **Ne jamais commiter ce fichier** (déjà dans `.gitignore`).

---

## Étape 8 — Smoke test

```bash
# Démarrer le serveur dev
pnpm --filter @verone/back-office dev

# Test sync (curl)
curl -X POST http://localhost:3000/api/meta-commerce/sync-statuses \
  -H "Cookie: <session cookie d'un user back-office>"
```

Attendu : `200 OK` avec `{"success":true, "meta_products_found": N, "updated": M, "not_found": K}`.

Si erreur `META_ACCESS_TOKEN ou META_CATALOG_ID manquant` → re-vérifier Vercel + `vercel env pull`.
Si erreur `Erreur API Meta` avec `{"error":{"code":190}}` → token invalide ou expiré, recréer System User token.
Si erreur `403` → permissions catalog manquantes, retour étape 5.

---

## Rotation du token (procédure périodique)

Bien que le token System User n'expire pas, la rotation tous les 6-12 mois est une bonne pratique sécurité :

1. Créer un nouveau token (étape 3, garder l'ancien actif)
2. Mettre à jour Vercel (étapes 6-7)
3. Redeploy production (`vercel --prod`)
4. Vérifier smoke test sur production
5. Révoquer l'ancien token dans Business Manager

---

## Pourquoi `review_status` est toujours vide ?

En Europe, la checkout Meta est en **mode redirect-to-website** (l'utilisateur clique sur "Acheter" et est redirigé vers `veronecollections.fr`). Dans ce mode, Meta ne fait **pas** de review qualité produit, donc `review_status` reste `""` (chaîne vide).

Le mapping côté code (`apps/back-office/src/app/api/meta-commerce/sync-statuses/route.ts` ligne 150-166) traite `""` comme `active` — c'est volontaire et correct. Un produit visible dans le shop avec `review_status=""` est bien publié.

---

## Documentation officielle Meta

- Catalog API : https://developers.facebook.com/docs/marketing-api/catalog
- Product Item : https://developers.facebook.com/docs/marketing-api/reference/product-item/
- System Users : https://developers.facebook.com/docs/marketing-api/system-users/overview
- Graph API v21.0 : https://developers.facebook.com/docs/graph-api/changelog/version21.0
