# Business Rules LinkMe

**Derniere mise a jour:** 2026-05-20

> **Guide unifié** : Pour la documentation complète et à jour, voir `docs/current/linkme/GUIDE-COMPLET-LINKME.md`

Plateforme d'affiliation B2B2C - Regles metier et workflows.

---

## Vue d'Ensemble

LinkMe est une plateforme d'affiliation permettant aux organisations (enseignes, independants) de creer des mini-boutiques et percevoir des commissions.

**Status:** Operationnel a 85%

---

## Architecture

### Tables Principales

```
AUTHENTIFICATION                    DONNEES BUSINESS
┌─────────────────────┐            ┌─────────────────────────────┐
│ user_app_roles      │            │ linkme_affiliates           │
│ - app='linkme'      │ ──JOIN──>  │ - enseigne_id XOR org_id    │
│ - enseigne_id       │            │ - default_margin_rate (15%) │
│ - organisation_id   │            │ - linkme_commission_rate(5%)│
└─────────────────────┘            └─────────────────────────────┘
```

### Roles

| Role               | Description                     |
| ------------------ | ------------------------------- |
| `enseigne_admin`   | Admin d'une chaine (ex: Pokawa) |
| `org_independante` | Organisation autonome           |

---

## Workflows Critiques

### 1. Connexion Affilie

```
Login (/login)
    │
    ▼
Auth Supabase (cookie partage, isolation via RLS user_app_roles)
    │
    ▼
Query user_app_roles WHERE app='linkme'
    │
    ▼
Liaison linkme_affiliates (via enseigne_id ou org_id)
    │
    ▼
Redirection Dashboard
```

### 2. Creation Selection

```
/ma-selection
    │
    ▼
Nouvelle selection (nom, description)
    │
    ▼
Ajout produits depuis catalogue
    │
    ▼
Configuration marge (slider feux tricolores)
    │
    ▼
Publication (toggle is_public)
    │
    ▼
URL publique: /s/{slug}
```

### 3. Commande Client (B2B)

```
Page publique /s/[slug]
    │
    ▼
Ajout panier (localStorage)
    │
    ▼
Checkout (formulaire entreprise + adresses)
    │
    ▼
Confirmation commande (status: draft)
    │
    ▼
Validation Back-Office (draft → validated)
    │
    ▼
Virement bancaire recu
    │
    ▼
Expedition + Creation commission auto
```

### Regles de Validation Commande

> **REGLE ABSOLUE** : Pas de selection = pas de commande LinkMe.
>
> Toute commande LinkMe DOIT etre liee a une `linkme_selection` via `linkme_selection_id` sur `sales_orders`.
> Sans selection, les rétrocessions et commissions ne peuvent pas etre calculees.

**Invariants :**

- `sales_orders.linkme_selection_id` ne doit JAMAIS etre NULL pour une commande LinkMe
- `sales_order_items.linkme_selection_item_id` doit pointer vers un item de cette selection
- Le trigger `trg_calculate_retrocession` calcule : `(unit_price_ht - base_price_ht_locked) × quantity`
- Si `base_price_ht_locked` est NULL, le trigger utilise `linkme_selection_items.base_price_ht`

**Incident B&W (2026-02-19)** : 2 factures (F-25-034, F-25-035) avaient `linkme_selection_id = NULL` et `retrocession = 0` car l'enseigne Black & White n'avait aucune selection. Corrige en creant la selection et reliant les commandes.

### 4. Cycle Commissions

```
Commande validee puis expediee (status: validated → shipped)
    │
    ▼
Trigger create_linkme_commission_on_order_update → linkme_commissions
    │  status = 'validated' si la commande est deja payee, sinon 'pending'
    ▼
Verone encaisse la commande (payment_status_v2 = 'paid')
    │  rapprochement bancaire Qonto OU marquage manuel
    ▼
Trigger sync_commission_status_on_payment → commission 'pending' → 'validated'
    │
    ▼
La commission devient DEMANDABLE (statut 'validated')
    │
    ▼
L'affilie l'inclut dans une demande de paiement + depose sa facture PDF
    │  trigger mark_commission_requested_on_item_insert → 'validated' → 'requested'
    ▼
Verone regle la demande (1 ou plusieurs virements)
    │  trigger sync_commissions_on_payment_request_paid → 'requested' → 'paid'
```

#### Conditions d'eligibilite a une demande de paiement

> **REGLE FONDAMENTALE** : un affilie ne peut demander le paiement d'une
> commission QUE si elle est au statut `validated`.

Une commission `validated` signifie que **Verone a effectivement encaisse la
commande correspondante** — rapprochement bancaire Qonto confirme, ou marquage
manuel quand il n'y a pas de transaction a rapprocher. Une commission `pending`
(commande pas encore payee a Verone) n'est **jamais** demandable. Le paiement
d'une commande peut prendre jusqu'a 30 jours ; il existe aussi des prepaiements.

Comme une commande payee est forcement deja expediee, et qu'une commande
expediee n'est plus modifiable (cf. `.claude/rules/finance.md` R6), une
commission `requested` ou `paid` porte toujours sur une commande figee.

**Garde-fou** : `apps/linkme/src/lib/hooks/use-payment-requests.ts` filtre
`.eq('status','validated')` a la creation d'une demande de paiement cote
affilie. Toute demande montee hors de ce parcours (script, back-office) doit
respecter la meme regle.

---

## Statuts

### Selection

```
draft ──────────> active (publication)
  │                  │
  └───── archived <──┘ (archivage)
```

### Commande

```
draft → validated → partially_shipped → shipped → delivered
         │                               │
         └────────── cancelled <─────────┘
```

### Commission

```
pending ──> validated ──> requested ──> paid
   │            │             │
   │            └──> cancelled │
   └──────────────────────────┘ (de-soldage : un virement supprime
                                  ramene la commission a 'requested')
```

| Statut      | Signification                                                          |
| ----------- | ---------------------------------------------------------------------- |
| `pending`   | Commission creee, commande pas encore payee a Verone. Non demandable.  |
| `validated` | Commande payee/rapprochee. Commission DEMANDABLE par l'affilie.        |
| `requested` | Commission incluse dans une demande de paiement en cours de reglement. |
| `paid`      | Demande reglee integralement, commission versee a l'affilie.           |
| `cancelled` | Commission annulee.                                                    |
| `payable`   | Alias historique de `validated` (lecture seule, ne plus utiliser).     |

**Transitions et declencheurs :**

| Transition                         | Declencheur                          | Trigger DB                                 |
| ---------------------------------- | ------------------------------------ | ------------------------------------------ |
| → `pending` / `validated`          | Commande validee / expediee          | `create_linkme_commission_on_order_update` |
| `pending` → `validated`            | Commande payee (`payment_status_v2`) | `sync_commission_status_on_payment`        |
| `validated` → `requested`          | Entree dans une demande de paiement  | `mark_commission_requested_on_item_insert` |
| `requested` → `paid`               | Demande reglee integralement         | `sync_commissions_on_payment_request_paid` |
| `paid` / `requested` → `requested` | De-soldage (virement supprime)       | `sync_commissions_on_payment_request_paid` |

> **Faille connue (non corrigee, latente)** : le trigger
> `create_linkme_commission_on_order_update` se declenche sur tout changement
> de statut d'une commande. Quand une commande LinkMe passe a `delivered`, il
> execute un `DELETE` de la commission liee — meme `requested` ou `paid`. Aucune
> commande LinkMe n'est `delivered` aujourd'hui, donc rien n'est casse, mais le
> correctif reste a faire. Voir `.claude/work/ACTIVE.md` Bloc 2.

### Demande Paiement

```
pending ──> partially_paid ──> paid
   │
   └──> cancelled
```

Le flag `invoice_received` (booleen) est **independant du statut** : il passe a
`true` des que l'affilie depose sa facture PDF, peu importe l'avancement du
paiement. Une demande peut etre `paid` sans `invoice_received`, ou
`invoice_received` sans etre payee.

---

## Fichiers Critiques

### App LinkMe

```
apps/linkme/src/
├── contexts/AuthContext.tsx           # Auth + linkMeRole
├── lib/hooks/use-user-selection.ts    # Liaison user→affiliate
├── lib/hooks/use-affiliate-*.ts       # Hooks affilies
├── components/commissions/            # Composants modulaires
└── app/(main)/layout.tsx              # Layout authentifie
```

### CMS Back-Office

```
apps/back-office/src/app/canaux-vente/linkme/
├── layout.tsx                         # Layout sidebar
├── components/LinkMeSidebar.tsx       # Navigation
├── hooks/use-linkme-*.ts              # Hooks CMS
└── utilisateurs/                      # Gestion users LinkMe
```

---

## KPIs Commissions (Affiche TTC)

| KPI          | Description                             |
| ------------ | --------------------------------------- |
| En attente   | Commissions `pending` (non demandables) |
| Validees     | Commissions `validated` (demandables)   |
| En reglement | Commissions `requested`                 |
| Payees       | Commissions `paid`                      |

---

## Points de Vigilance

1. **Cookie partage, isolation RLS** - Meme cookie Supabase, permissions separees via `user_app_roles.app`
2. **Marges feux tricolores** - Vert (competitif), Orange (equilibre), Rouge (proche public)
3. **B2B seulement** - Clients = organisations, paiement par virement
4. **TVA 20%** - Calculs TTC = HT × 1.20

---

## Documentation Complete

Pour les workflows detailles avec diagrammes, voir:

- `docs/archive/2026-01/business-rules/AUDIT-LINKME-WORKFLOWS-2026-01.md`
- `docs/archive/2026-01/business-rules/AUDIT-COMPLET-LINKME-2025-12.md`

---

_Source: Audits LinkMe Janvier 2026_
