# Index LinkMe — Reference Metier

Plateforme d'affiliation B2B2C. 54 pages, 14 API routes.

## Modele Economique

```
Verone (catalogue produits)
  → Affilies creent des SELECTIONS (mini-boutiques curatees)
    → Clients achetent via PAGES PUBLIQUES des selections
      → Commissions calculees a la validation
```

Les SELECTIONS sont le coeur du revenu. Sans selections, pas de commandes, pas de revenus.

### Flux Financier

| Acteur  | Recoit                                                            | Source             |
| ------- | ----------------------------------------------------------------- | ------------------ |
| Verone  | Prix base HT + commission plateforme (5% defaut)                  | Vente produit      |
| Affilie | Marge configuree (margin_rate sur chaque produit de la selection) | Commission affilie |
| Client  | Produit livre                                                     | Paiement           |

### Feux Tricolores Marge

- **Vert** : marge competitive (0 → maxRate/3)
- **Orange** : marge correcte (maxRate/3 → 2×maxRate/3)
- **Rouge** : marge risquee (2×maxRate/3 → maxRate)

## Types d'Utilisateurs

### Enseigne Admin (`enseigne_admin`)

Administrateur d'une chaine (ex: Pokawa). Gere TOUTES les organisations de son enseigne.

| Permission    | Acces                                      |
| ------------- | ------------------------------------------ |
| Organisations | Voir + gerer toutes les orgs de l'enseigne |
| Selections    | Creer, editer, publier                     |
| Commissions   | Voir + demander paiement                   |
| Commandes     | Voir toutes les commandes de l'enseigne    |
| Produits      | Creer produits affilies                    |
| Contacts      | Gerer contacts enseigne                    |
| Parametres    | Configuration enseigne                     |
| Stockage      | Gerer stockage produits                    |

### Organisation Admin (`organisation_admin`)

Admin d'une organisation independante (sans enseigne).

Memes permissions que enseigne_admin mais limitees a SA PROPRE organisation.

### Enseigne Collaborateur (`enseigne_collaborateur`)

Utilisateur restreint d'une enseigne.

| Permission   | Acces                    |
| ------------ | ------------------------ |
| Commandes    | Voir                     |
| Selections   | Voir (pas editer marges) |
| Produits     | Voir + creer             |
| Statistiques | Voir                     |
| Commissions  | BLOQUE                   |
| Parametres   | BLOQUE                   |
| Stockage     | BLOQUE                   |
| Contacts     | BLOQUE                   |

### Client Final (pas de compte)

Achete via pages publiques des selections. Ne connait PAS l'existence de LinkMe.

## 2 Formulaires de Commande

### OrderFormUnified (PUBLIC — 6 etapes)

Utilise par les clients finaux via les pages publiques des selections.
Fichier : `components/OrderFormUnified.tsx`

**Question initiale** : "Est-ce une ouverture de restaurant ?"

- Non (existant) → status DRAFT, 6 etapes standard
- Oui (nouveau) → status PENDING_APPROVAL, creation org + contact

| Etape          | Contenu                                                           |
| -------------- | ----------------------------------------------------------------- |
| 1. Demandeur   | Nom, email, telephone, poste                                      |
| 2. Restaurant  | Dropdown existant OU creation nouveau (trade_name, type, adresse) |
| 3. Responsable | Contact responsable + optionnel KBIS (si franchise)               |
| 4. Facturation | Organisation facturation ou custom                                |
| 5. Livraison   | Adresse, date, centre commercial?, semi-remorque?                 |
| 6. Validation  | Recap panier + confirmation                                       |

### NewOrderForm (AUTHENTIFIE — 8 etapes) — FORMULAIRE ACTIF

Utilise par les affilies connectes depuis leur dashboard.
Fichier principal : `components/orders/NewOrderForm.tsx`
Steps : `components/orders/steps/RestaurantStep.tsx`, `ResponsableStep.tsx`, etc.
Validation : `components/orders/schemas/order-form.schema.ts` (fonction `validateStep`)
Hook : `lib/hooks/use-order-form.ts`

**ATTENTION** : `components/order-form/` est l'ANCIEN formulaire (split de OrderFormUnified). NE PAS MODIFIER — utiliser `components/orders/steps/` a la place.

| Etape          | Contenu                                                |
| -------------- | ------------------------------------------------------ |
| 1. Restaurant  | Selection restaurant (dropdown organisations enseigne) |
| 2. Selection   | Choisir selection source                               |
| 3. Produits    | Ajouter produits au panier                             |
| 4. Panier      | Recap + edit quantites                                 |
| 5. Responsable | Contact responsable (acces DB contacts)                |
| 6. Facturation | Contact + adresse facturation                          |
| 7. Livraison   | Contact + adresse livraison + date (optionnel)         |
| 8. Validation  | Recap complet + confirmation                           |

### Differences Cles

| Aspect     | OrderFormUnified (public)       | NewOrderForm (auth)    |
| ---------- | ------------------------------- | ---------------------- |
| Auth       | Non                             | Oui                    |
| Etapes     | 6 + question initiale           | 8                      |
| Contacts   | Saisie manuelle                 | Acces DB contacts      |
| Restaurant | Dropdown ou creation            | Dropdown organisations |
| Produits   | Deja dans le panier (selection) | Selection puis ajout   |

## Pages Authentifiees (38 pages)

| Route                      | But                                                      | Roles                 |
| -------------------------- | -------------------------------------------------------- | --------------------- |
| `/dashboard`               | KPIs, selections publiees, top produits, actions rapides | Tous                  |
| `/commandes`               | Liste commandes + KPIs (CA, panier moyen, commissions)   | Tous                  |
| `/commandes/nouvelle`      | NewOrderForm 8 etapes                                    | Tous                  |
| `/commandes/[id]/modifier` | Edit commande existante                                  | Admin seulement       |
| `/ma-selection`            | Gerer selections (brouillon, publiee, archivee)          | Admin (collab = voir) |
| `/ma-selection/[id]`       | Edit selection (produits, marges, config)                | Admin                 |
| `/ma-selection/nouvelle`   | Creer selection                                          | Admin                 |
| `/commissions`             | Voir commissions + demander paiement                     | Admin seulement       |
| `/commissions/demandes`    | Historique demandes versement                            | Admin seulement       |
| `/mes-produits`            | Produits crees par l'affilie                             | Tous                  |
| `/catalogue`               | Catalogue Verone (pour ajouter aux selections)           | Tous                  |
| `/statistiques`            | Analytics ventes + produits + selections + commissions   | Tous                  |
| `/organisations`           | Gerer organisations de l'enseigne                        | Admin + collab (voir) |
| `/contacts`                | Contacts utilisateurs enseigne                           | Admin seulement       |
| `/stockage`                | Produits stockes + demandes stockage                     | Admin seulement       |
| `/parametres`              | Reglages enseigne (marges, branding)                     | Admin seulement       |
| `/profil`                  | Infos profil utilisateur                                 | Tous                  |
| `/notifications`           | Centre notifications                                     | Tous                  |
| `/aide/*`                  | Centre d'aide (6 pages)                                  | Tous                  |

## Pages Publiques (13 pages)

| Route                          | But                                              |
| ------------------------------ | ------------------------------------------------ |
| `/`                            | Landing marketing (hero, features, CTA)          |
| `/about`                       | A propos Verone                                  |
| `/contact`                     | Formulaire contact                               |
| `/s/[id]/catalogue`            | Catalogue selection publique (COEUR DU BUSINESS) |
| `/s/[id]/contact`              | Contact specifique selection                     |
| `/s/[id]/faq`                  | FAQ selection                                    |
| `/s/[id]/points-de-vente`      | Carte points de vente                            |
| `/complete-info/[token]`       | Formulaire completion info (magic link)          |
| `/delivery-info/[token]`       | Formulaire info livraison (magic link)           |
| `/cgu`, `/privacy`, `/cookies` | Pages legales                                    |

## API Routes (14)

| Route                                    | But                                     |
| ---------------------------------------- | --------------------------------------- |
| `POST /api/create-order`                 | Creer commande (Revolut paiement)       |
| `POST /api/forms/submit`                 | Soumettre formulaire (contact, inquiry) |
| `GET /api/complete-info/[token]`         | Recuperer donnees pre-remplies          |
| `POST /api/complete-info/[token]/submit` | Soumettre donnees completees            |
| `GET /api/invoices/[orderId]/pdf`        | Generer facture PDF                     |
| `GET /api/page-config/[pageId]`          | Config page dynamique                   |
| `GET /api/globe-items`                   | Donnees globe interactif                |
| `POST /api/webhook/revolut`              | Webhook paiement Revolut                |
| `POST /api/emails/order-confirmation`    | Email confirmation client               |
| `POST /api/emails/notify-enseigne-order` | Notification staff Verone               |
| `POST /api/emails/form-confirmation`     | Confirmation formulaire                 |
| `POST /api/emails/form-notification`     | Notification interne                    |
| `POST /api/emails/step4-confirmed`       | Notification etape 4                    |
| `POST /api/contact/send`                 | Envoi email contact                     |

## Cycle Commande

```
NOUVEAU RESTAURANT (public) :
  PENDING_APPROVAL → (staff valide) → VALIDATED → SHIPPED → DELIVERED
                                    ↘ CANCELLED

RESTAURANT EXISTANT (public ou auth) :
  DRAFT → (staff approuve) → VALIDATED → SHIPPED → DELIVERED
       ↘ CANCELLED
```

## Cycle Commissions

```
Commande validee
  → linkme_commissions creees (status = pending)
    → Affilie demande paiement (PaymentRequestModal)
      → Staff valide + paie
        → status = paid
```

## Architecture Auth

1. **Middleware** (edge) : verifie auth + role LinkMe → redirect `/login` ou `/unauthorized`
2. **AuthContext** (client) : state user + session + linkMeRole
3. **usePermissions()** (client) : matrice permissions par role
4. **RLS** (DB) : isolation donnees par enseigne_id ou organisation_id
5. **RouteGuard** (client) : protection routes par permissions

## Sous-organisations d'enseigne

- Si `enseigne_id` rempli → sous-organisation (restaurant)
- PAS de produits, selections, utilisateurs propres
- Tout gere au niveau enseigne via `linkme_affiliates`
- Logo herite automatiquement (trigger `trg_org_inherit_enseigne_logo`)
- Page detail → redirection vers page BO generale
