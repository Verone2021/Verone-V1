# Index des Pages LinkMe

**Total pages** : 48
**Derniere mise a jour** : 2026-03-14
**Source** : Audit code (`apps/linkme/src/app`) + `route-permissions.ts`

---

## Resume

| Type                 | Count  | Pourcentage |
| -------------------- | ------ | ----------- |
| **Public**           | 17     | 35.4%       |
| **Auth (tous)**      | 20     | 41.7%       |
| **Auth (restreint)** | 11     | 22.9%       |
| **Total**            | **48** | 100%        |

---

## Roles LinkMe

| Role                     | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| `enseigne_admin`         | Admin d'une enseigne (voit tous ses affilies)         |
| `organisation_admin`     | Admin d'une organisation independante (sa propre org) |
| `enseigne_collaborateur` | Collaborateur d'une enseigne (acces limite)           |

---

## Pages Publiques (17 routes)

Aucune authentification requise.

### Marketing

| Route      | Description              |
| ---------- | ------------------------ |
| `/`        | Page d'accueil marketing |
| `/about`   | A propos                 |
| `/contact` | Formulaire de contact    |

### Legal

| Route      | Description                  |
| ---------- | ---------------------------- |
| `/cgu`     | Conditions generales         |
| `/cookies` | Politique cookies            |
| `/privacy` | Politique de confidentialite |

### Selections Publiques

| Route                     | Description                   |
| ------------------------- | ----------------------------- |
| `/s/[id]`                 | Page publique d'une selection |
| `/s/[id]/catalogue`       | Catalogue de la selection     |
| `/s/[id]/contact`         | Contact de la selection       |
| `/s/[id]/faq`             | FAQ de la selection           |
| `/s/[id]/points-de-vente` | Points de vente               |

### Pages Affilies Publiques

| Route                              | Description            |
| ---------------------------------- | ---------------------- |
| `/[affiliateSlug]`                 | Landing page affilie   |
| `/[affiliateSlug]/[selectionSlug]` | Selection d'un affilie |

### Magic Links

| Route                    | Description                        |
| ------------------------ | ---------------------------------- |
| `/complete-info/[token]` | Formulaire completion info (token) |
| `/delivery-info/[token]` | Formulaire info livraison (token)  |

### Autres

| Route           | Description       |
| --------------- | ----------------- |
| `/unauthorized` | Page acces refuse |

---

## Pages Authentifiees — Tous les Roles (20 routes)

Accessibles a `enseigne_admin`, `organisation_admin` et `enseigne_collaborateur`.

### Core

| Route            | Permissions dans route-permissions.ts                      | Description          |
| ---------------- | ---------------------------------------------------------- | -------------------- |
| `/dashboard`     | enseigne_admin, organisation_admin, enseigne_collaborateur | Tableau de bord      |
| `/profil`        | enseigne_admin, organisation_admin, enseigne_collaborateur | Profil utilisateur   |
| `/notifications` | Tous authentifies                                          | Centre notifications |

### Commandes

| Route                      | Permissions                                                | Description         |
| -------------------------- | ---------------------------------------------------------- | ------------------- |
| `/commandes`               | enseigne_admin, organisation_admin, enseigne_collaborateur | Liste des commandes |
| `/commandes/nouvelle`      | Tous authentifies                                          | Nouvelle commande   |
| `/commandes/[id]/modifier` | Tous authentifies                                          | Modifier commande   |

### Panier / Checkout

| Route           | Permissions       | Description           |
| --------------- | ----------------- | --------------------- |
| `/cart`         | Tous authentifies | Panier                |
| `/checkout`     | Tous authentifies | Validation commande   |
| `/confirmation` | Tous authentifies | Confirmation commande |

### Mes Produits

| Route                   | Permissions                                                | Description        |
| ----------------------- | ---------------------------------------------------------- | ------------------ |
| `/mes-produits`         | enseigne_admin, organisation_admin, enseigne_collaborateur | Liste mes produits |
| `/mes-produits/nouveau` | Tous authentifies                                          | Nouveau produit    |
| `/mes-produits/[id]`    | Tous authentifies                                          | Detail produit     |

### Catalogue & Statistiques

| Route                    | Permissions                                                | Description       |
| ------------------------ | ---------------------------------------------------------- | ----------------- |
| `/catalogue`             | enseigne_admin, organisation_admin, enseigne_collaborateur | Catalogue general |
| `/statistiques`          | enseigne_admin, organisation_admin, enseigne_collaborateur | Dashboard stats   |
| `/statistiques/produits` | Tous authentifies                                          | Stats par produit |

### Aide (7 pages)

| Route               | Permissions                                                | Description      |
| ------------------- | ---------------------------------------------------------- | ---------------- |
| `/aide`             | enseigne_admin, organisation_admin, enseigne_collaborateur | Hub aide         |
| `/aide/demarrer`    | Tous authentifies                                          | Guide demarrage  |
| `/aide/commandes`   | Tous authentifies                                          | Aide commandes   |
| `/aide/commissions` | Tous authentifies                                          | Aide commissions |
| `/aide/faq`         | Tous authentifies                                          | FAQ              |
| `/aide/produits`    | Tous authentifies                                          | Aide produits    |
| `/aide/selections`  | Tous authentifies                                          | Aide selections  |

---

## Pages Authentifiees — Acces Restreint (11 routes)

### enseigne_admin + organisation_admin uniquement

| Route                         | Permissions                        | Description              |
| ----------------------------- | ---------------------------------- | ------------------------ |
| `/ma-selection`               | enseigne_admin, organisation_admin | Gestion selections       |
| `/ma-selection/nouvelle`      | Tous authentifies                  | Nouvelle selection       |
| `/ma-selection/[id]`          | Tous authentifies                  | Detail selection         |
| `/ma-selection/[id]/produits` | Tous authentifies                  | Produits de la selection |
| `/commissions`                | enseigne_admin, organisation_admin | Vue commissions          |
| `/commissions/demandes`       | Tous authentifies                  | Demandes de commission   |
| `/stockage`                   | enseigne_admin, organisation_admin | Gestion stockage M3      |

### enseigne_admin + enseigne_collaborateur uniquement

| Route            | Permissions                            | Description           |
| ---------------- | -------------------------------------- | --------------------- |
| `/organisations` | enseigne_admin, enseigne_collaborateur | Gestion organisations |

### enseigne_admin uniquement

| Route         | Permissions    | Description       |
| ------------- | -------------- | ----------------- |
| `/contacts`   | enseigne_admin | Gestion contacts  |
| `/parametres` | enseigne_admin | Parametres compte |

---

## Matrice de Permissions Complete

Source : `apps/linkme/src/lib/route-permissions.ts` + `apps/linkme/src/hooks/use-permissions.ts`

| Permission             | enseigne_admin | organisation_admin | enseigne_collaborateur |
| ---------------------- | -------------- | ------------------ | ---------------------- |
| manageOrganisations    | oui            | —                  | oui                    |
| createProducts         | oui            | oui                | oui                    |
| manageSelections       | oui            | oui                | —                      |
| viewOrders             | oui            | oui                | oui                    |
| createOrders           | oui            | oui                | oui                    |
| viewCommissions        | oui            | oui                | —                      |
| viewAnalytics          | oui            | oui                | oui                    |
| accessAdvancedSettings | oui            | —                  | —                      |
| inviteUsers            | oui            | oui                | —                      |
| manageContacts         | oui            | —                  | —                      |
| manageStorage          | oui            | oui                | —                      |

---

## Architecture Frontend

### Groupes de Layout

| Groupe        | Prefix route                                        | Authentification | Description                        |
| ------------- | --------------------------------------------------- | ---------------- | ---------------------------------- |
| `(auth)`      | `/login`                                            | Non              | Pages d'authentification           |
| `(marketing)` | `/`, `/about`, `/contact`                           | Non              | Pages marketing                    |
| `(legal)`     | `/cgu`, `/cookies`, `/privacy`                      | Non              | Pages legales                      |
| `(public)`    | `/s/[id]/*`, `/complete-info/*`, `/delivery-info/*` | Non              | Selections publiques + magic links |
| `(main)`      | Tout le reste                                       | Oui              | Application authentifiee           |

### Middleware

Le middleware (`apps/linkme/src/middleware.ts`) definit les routes publiques via regex :

- Routes publiques : `/`, `/login`, `/unauthorized`, `/about`, `/contact`, `/cgu`, `/privacy`, `/cookies`, `/s/*`, `/complete-info/*`, `/delivery-info/*`
- Toutes les autres routes requierent une session active

---

**Derniere mise a jour** : 2026-03-14 par Claude (audit code vs documentation)
