# Vérone Back Office - Vue d'ensemble du projet

## 🎯 Objectif du projet

**Vérone Back Office** est un CRM/ERP modulaire spécialisé dans la décoration et le mobilier d'intérieur haut de gamme.

### Mission Business

Transformer la gestion commerciale de Vérone avec un MVP **Catalogue Partageable** :

- **Admin** → Lien client sécurisé + PDF branded + Feeds Meta/Google
- **Impact** : -70% temps création catalogues clients
- **ROI** : 15% conversion catalogue → devis, 99% uptime, <10s génération feeds

## 🏗️ Architecture Technique

- **Type** : Monorepo Turborepo avec packages partagés
- **Backend** : Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- **Frontend** : Next.js 15 App Router + React 18 + Tailwind + shadcn/ui
- **Modules** : Catalogue ↔ Stock ↔ Commandes ↔ Facturation ↔ CRM ↔ Intégrations

## 📁 Structure Monorepo

```
verone-back-office/
├── apps/                    # Applications principales
│   ├── back-office/        # Interface administration (MVP)
│   ├── website-public/     # Site vitrine particuliers
│   ├── website-pro/        # Site B2B professionnels
│   └── partner-clients/    # Front-ends partenaires affiliés
├── packages/               # Packages partagés
│   ├── database/          # Types Supabase + client
│   ├── business-logic/    # Règles métier + validations
│   ├── shared-ui/         # Composants UI réutilisables
│   ├── api-client/        # Client API centralisé
│   ├── utils/             # Utilitaires communs
│   └── partner-sdk/       # SDK pour partenaires
├── manifests/             # Documentation métier structurée
├── supabase/              # Database migrations + functions
└── .claude/               # Configuration Claude Code + agents
```

## 🎯 Phase actuelle : MVP Catalogue

Focus sur l'interface administration catalogue avec gestion produits, conditionnements, et exports (PDF + Feeds).
