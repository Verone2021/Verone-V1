# Verone Back Office - Vue d'ensemble du projet

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Primary_sources:

- README.md
- CLAUDE.md
- apps/back-office/
- apps/linkme/
- apps/site-internet/
  Owner: Romeo Dos Santos
  Created: 2025-10-01
  Updated: 2026-01-10

---

## Objectif du projet

**Verone Back Office** est un CRM/ERP modulaire specialise dans la decoration et le mobilier d'interieur haut de gamme.

### Mission Business

Transformer la gestion commerciale de Verone avec un MVP **Catalogue Partageable** :

- **Admin** : Lien client securise + PDF branded + Feeds Meta/Google
- **Impact** : -70% temps creation catalogues clients
- **ROI** : 15% conversion catalogue → devis, 99% uptime, <10s generation feeds

---

## Architecture Technique

- **Type** : Monorepo Turborepo avec packages partages
- **Backend** : Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- **Frontend** : Next.js 15 App Router + React 18 + Tailwind + shadcn/ui
- **Modules** : Catalogue ↔ Stock ↔ Commandes ↔ Facturation ↔ CRM ↔ Integrations

---

## Structure Monorepo

```
verone-back-office/
├── apps/
│   ├── back-office/        # CRM/ERP (Port 3000)
│   ├── linkme/             # Commissions affilies (Port 3002)
│   └── site-internet/      # E-commerce B2C (Port 3001)
├── packages/@verone/        # 26 packages partages
├── supabase/               # Migrations + functions
├── docs/                   # Documentation
└── .claude/                # Configuration Claude Code
```

---

## 3 Applications

| App               | Port | Description                           |
| ----------------- | ---- | ------------------------------------- |
| **back-office**   | 3000 | CRM/ERP principal - pilotage activite |
| **linkme**        | 3002 | Plateforme commissions & selections   |
| **site-internet** | 3001 | E-commerce luxury mobilier            |

---

## Non-Goals

- Cette memory ne couvre PAS les details techniques DB (voir `database-implementation.md`)
- Cette memory ne couvre PAS les workflows specifiques (voir autres memories)

---

## References

- `docs/current/architecture.md` - Architecture detaillee
- `docs/current/serena/database-implementation.md` - Implementation DB
