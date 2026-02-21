# Business Rules LinkMe

**Derniere mise a jour:** 2026-02-18

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
Commande expediee (status: shipped)
    │
    ▼
Trigger SQL → Insert linkme_commissions (pending)
    │
    ▼
Client paie → automatique (pending → validated)
    │
    ▼
Commission eligible (validated → payable)
    │
    ▼
Affilie demande versement + Upload facture PDF
    │
    ▼
Virement Verone + status: paid
```

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
pending ──> validated ──> payable ──> paid
              │
              └──> cancelled
```

> **Note** : Ce cycle est simplifié. Voir `docs/current/linkme/GUIDE-COMPLET-LINKME.md` section 10 pour le détail complet.

### Demande Paiement

```
pending ──> invoice_received ──> paid
    │              │
    └─── cancelled <┘
```

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

| KPI        | Description           |
| ---------- | --------------------- |
| En attente | Commissions pending   |
| Validees   | Commissions validated |
| Payables   | Commissions payable   |
| Payees     | Commissions paid      |

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
