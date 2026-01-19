# Business Rules LinkMe

**Derniere mise a jour:** 2026-01-09

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
Auth Supabase (cookie isole sb-linkme-auth)
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

### 4. Cycle Commissions

```
Commande livree
    │
    ▼
Trigger SQL → Insert linkme_commissions (pending)
    │
    ▼
Validation Verone (pending → validated)
    │
    ▼
Affilie demande versement (selection commissions validated)
    │
    ▼
Upload facture PDF
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
pending ──> validated ──> in_payment ──> paid
              │
              └──> cancelled
```

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

| KPI        | Description            |
| ---------- | ---------------------- |
| En attente | Commissions pending    |
| Payables   | Commissions validated  |
| En cours   | Commissions in_payment |
| Payees     | Commissions paid       |

---

## Points de Vigilance

1. **Sessions isolees** - Back-office et LinkMe ont des cookies separes
2. **Marges feux tricolores** - Vert (competitif), Orange (equilibre), Rouge (proche public)
3. **B2B seulement** - Clients = organisations, paiement par virement
4. **TVA 20%** - Calculs TTC = HT × 1.20

---

## Source

Ce document consolide les audits LinkMe de janvier 2026.
Les workflows decrits ci-dessus constituent la source de verite pour le fonctionnement actuel de LinkMe.
