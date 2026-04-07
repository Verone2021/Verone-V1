# Contacts — Source de Verite Unique

**Status** : DOCUMENTATION CANONIQUE (source de verite unique)
**Derniere mise a jour** : 2026-04-07
**Auteur** : Audit complet back-office + DB

---

## Principe fondamental

> Le **BACK-OFFICE** est la SOURCE DE VERITE UNIQUE pour les contacts.
> Tout composant dans LinkMe, site-internet, ou packages partages DOIT etre identique
> au comportement du back-office. AUCUNE divergence n'est tolerable.

---

## 1. Schema DB — Table `contacts`

### Colonnes

| Colonne                          | Type        | Default           | Description                             |
| -------------------------------- | ----------- | ----------------- | --------------------------------------- |
| `id`                             | uuid        | gen_random_uuid() | PK                                      |
| `organisation_id`                | uuid        | null              | FK organisations (XOR enseigne_id)      |
| `enseigne_id`                    | uuid        | null              | FK enseignes (XOR organisation_id)      |
| `owner_type`                     | varchar     | 'organisation'    | 'organisation' ou 'enseigne'            |
| `first_name`                     | varchar     | NOT NULL          | Prenom                                  |
| `last_name`                      | varchar     | NOT NULL          | Nom                                     |
| `email`                          | varchar     | NOT NULL          | Email principal                         |
| `phone`                          | varchar     | null              | Telephone                               |
| `mobile`                         | varchar     | null              | Mobile                                  |
| `title`                          | varchar     | null              | Fonction/poste                          |
| `department`                     | varchar     | null              | Service                                 |
| `secondary_email`                | varchar     | null              | Email secondaire                        |
| `direct_line`                    | varchar     | null              | Ligne directe                           |
| `is_primary_contact`             | boolean     | false             | Contact principal/responsable           |
| `is_billing_contact`             | boolean     | false             | Contact facturation                     |
| `is_technical_contact`           | boolean     | false             | Contact technique                       |
| `is_commercial_contact`          | boolean     | true              | **DEPRECATED** — voir section 3         |
| `is_delivery_only`               | boolean     | false             | Contact livraison uniquement            |
| `contact_type`                   | varchar     | null              | Type libre (owner, manager...)          |
| `user_id`                        | uuid        | null              | FK auth.users (si lie a un utilisateur) |
| `preferred_communication_method` | varchar     | 'email'           | Methode de contact preferee             |
| `accepts_marketing`              | boolean     | true              | Accepte le marketing                    |
| `accepts_notifications`          | boolean     | true              | Accepte les notifications               |
| `language_preference`            | varchar     | 'fr'              | Langue                                  |
| `notes`                          | text        | null              | Notes libres                            |
| `is_active`                      | boolean     | true              | Soft delete                             |
| `last_contact_date`              | timestamptz | null              | Dernier contact                         |
| `created_by`                     | uuid        | null              | Qui a cree                              |
| `created_at`                     | timestamptz | now()             | Date creation                           |
| `updated_at`                     | timestamptz | now()             | Date modification                       |

### Rattachement (XOR)

Un contact est rattache a **exactement UN** parent :

- `organisation_id` + `owner_type='organisation'` → contact d'une organisation
- `enseigne_id` + `owner_type='enseigne'` → contact d'une enseigne (partage entre toutes les orgs de l'enseigne)

---

## 2. Roles des contacts — Les 3 roles ACTIFS

### Roles valides (a afficher et exposer dans les formulaires)

| Role            | Colonne DB             | Badge couleur                            | Description                   |
| --------------- | ---------------------- | ---------------------------------------- | ----------------------------- |
| **Responsable** | `is_primary_contact`   | Vert (`bg-green-100 text-green-700`)     | Contact principal de l'entite |
| **Facturation** | `is_billing_contact`   | Bleu (`bg-blue-100 text-blue-700`)       | Contact pour la facturation   |
| **Technique**   | `is_technical_contact` | Violet (`bg-violet-100 text-violet-700`) | Contact support technique     |

### Role DEPRECATED

| Role           | Colonne DB              | Status                                                                  |
| -------------- | ----------------------- | ----------------------------------------------------------------------- |
| ~~Commercial~~ | `is_commercial_contact` | **DEPRECATED** — NE PLUS AFFICHER, NE PLUS EXPOSER dans les formulaires |

**Pourquoi** : Le role "commercial" a ete juge non pertinent pour le metier Verone. La colonne DB existe encore (default `true`) mais elle ne doit plus etre visible dans l'UI. 21/26 contacts ont `is_commercial_contact=true` uniquement a cause du default DB — ce n'est pas un choix delibere.

### Couleurs CANONIQUES (source de verite)

```
Responsable : bg-green-100 text-green-700
Facturation : bg-blue-100  text-blue-700
Technique   : bg-violet-100 text-violet-700
```

**INTERDIT** : Utiliser d'autres couleurs pour ces badges (ex: Facturation en vert, Commercial en bleu = FAUX).

---

## 3. Composants UI — Architecture cible

### Composant carte unique : a unifier

Il doit exister **UN SEUL** composant carte de contact dans tout le monorepo, avec les features suivantes :

| Feature                                            | Requis                                        |
| -------------------------------------------------- | --------------------------------------------- |
| Nom complet + fonction                             | Oui                                           |
| Email + telephone + mobile                         | Oui                                           |
| Badges roles (Responsable, Facturation, Technique) | Oui, couleurs canoniques                      |
| Badge "LinkMe" si `user_id` ou `linkmeUserId`      | Oui (indigo)                                  |
| Bouton edit (crayon) au hover                      | Oui                                           |
| Bouton delete (poubelle) au hover                  | Oui                                           |
| Lien vers page detail contact                      | Oui (`/contacts-organisations/contacts/{id}`) |
| Badge ~~Commercial~~                               | **NON** — deprecated                          |

### Composants actuels a corriger (audit 2026-04-07)

| Composant                       | Localisation                                              | Problemes                                                                                |
| ------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `ContactCardBO`                 | `packages/@verone/orders/src/components/contacts/`        | Pas de edit/delete, affiche badge Commercial                                             |
| `ContactCardBO` (doublon)       | `packages/@verone/orders/src/components/linkme-contacts/` | Doublon a supprimer, pas de badge LinkMe                                                 |
| `EnseigneContactCard`           | `canaux-vente/linkme/enseignes/[id]/components/`          | A les boutons edit/delete, affiche Commercial                                            |
| `ContactDisplayCard`            | `apps/linkme/src/components/contacts/`                    | Couleurs inversees (Facturation=vert, Commercial=bleu), detection user fragile via notes |
| `ContactsManagementSection`     | `packages/@verone/customers/src/components/sections/`     | Affiche Commercial, a les boutons edit/delete                                            |
| `organisation-contacts-manager` | `packages/@verone/organisations/src/components/forms/`    | Legacy, utilise `select("*")`, affiche Commercial                                        |

### Formulaires de creation/edition — Champs a exposer

| Champ               | Obligatoire | Type d'input        |
| ------------------- | ----------- | ------------------- |
| Prenom              | Oui         | Input text          |
| Nom                 | Oui         | Input text          |
| Email               | Oui         | Input email         |
| Telephone           | Non         | Input tel           |
| Fonction (title)    | Non         | Input text          |
| Role Responsable    | Non         | Checkbox            |
| Role Facturation    | Non         | Checkbox            |
| Role Technique      | Non         | Checkbox            |
| ~~Role Commercial~~ | **NON**     | **NE PAS AFFICHER** |

---

## 4. Contacts dans le flux commande LinkMe

### Rattachement par type d'ownership

| Type restaurant     | Responsable + Facturation     | Livraison                     |
| ------------------- | ----------------------------- | ----------------------------- |
| Propre / Succursale | Contact de l'**enseigne**     | Contact de l'**organisation** |
| Franchise           | Contact de l'**organisation** | Contact de l'**organisation** |

### Colonnes FK dans `sales_orders`

- `responsable_contact_id` → FK `contacts(id)`
- `billing_contact_id` → FK `contacts(id)`
- `delivery_contact_id` → FK `contacts(id)`

---

## 5. Detection utilisateur LinkMe

### Methode CORRECTE

```typescript
// CORRECT : utiliser user_id ou linkmeUserId
const isLinkmeUser = !!contact.user_id; // DB
const isLinkmeUser = !!contact.linkmeUserId; // via hook BO
```

### Methode INTERDITE

```typescript
// INTERDIT : heuristique fragile via notes
const isUser = contact.notes?.includes('auto-sync'); // NE JAMAIS FAIRE
```

---

## 6. Hooks — Source de verite

### Hook canonique back-office

`packages/@verone/orders/src/hooks/linkme/use-organisation-contacts-bo.ts`

Type `ContactBO` — champs pertinents :

- `id`, `firstName`, `lastName`, `email`, `phone`, `mobile`, `title`
- `isPrimaryContact`, `isBillingContact`, `isTechnicalContact`
- `isCommercialContact` — **DEPRECATED, ne pas afficher**
- `linkmeUserId` — detection utilisateur LinkMe
- `linkmeRole` — role LinkMe (enseigne_admin, org_independante)

### Hook app LinkMe

`apps/linkme/src/lib/hooks/use-organisation-contacts.ts`

**Bug connu** : force `is_commercial_contact = !is_delivery_only` dans create/update. A corriger — ne plus toucher `is_commercial_contact` dans les mutations.

---

## 7. Pages affichant des contacts

| Page                     | URL                                      | Composant contacts          | Status                            |
| ------------------------ | ---------------------------------------- | --------------------------- | --------------------------------- |
| Detail enseigne (BO ref) | `/contacts-organisations/enseignes/[id]` | `EnseigneContactsTab`       | Manque edit/delete                |
| Detail enseigne (LinkMe) | `/canaux-vente/linkme/enseignes/[id]`    | `EnseigneContactsSection`   | A edit/delete, affiche Commercial |
| Liste contacts           | `/contacts-organisations/contacts`       | `ContactsTable`             | Filtre Commercial a retirer       |
| Detail contact           | `/contacts-organisations/contacts/[id]`  | Page detail                 | Affiche badge Commercial          |
| Detail client            | `/contacts-organisations/customers/[id]` | `ContactsManagementSection` | Affiche Commercial                |
| Detail fournisseur       | `/contacts-organisations/suppliers/[id]` | `ContactsManagementSection` | Affiche Commercial                |
| Detail partenaire        | `/contacts-organisations/partners/[id]`  | Inline                      | A verifier                        |

---

## 8. Checklist avant toute modification de contacts

- [ ] Le composant carte utilise les couleurs canoniques (vert/bleu/violet) ?
- [ ] Le badge "Commercial" n'est PAS affiche ?
- [ ] Les boutons edit/delete sont presents ?
- [ ] La detection utilisateur LinkMe utilise `user_id` (pas `notes`) ?
- [ ] Le formulaire expose Responsable + Facturation + Technique (pas Commercial) ?
- [ ] Le comportement est IDENTIQUE entre back-office et LinkMe ?
- [ ] Pas de `select("*")` dans les queries ?

---

## 9. Donnees production (snapshot 2026-04-07)

- 26 contacts actifs
- 6 rattaches a une enseigne, 21 a une organisation (1 avec les deux — anomalie)
- 21 avec `is_commercial_contact=true` (default DB, pas intentionnel)
- 23 avec `is_primary_contact=true`
- 2 avec `is_billing_contact=true`
- 0 avec `is_technical_contact=true`
- 0 avec `user_id` renseigne (colonne inutilisee)
- 0 avec `is_delivery_only=true`
