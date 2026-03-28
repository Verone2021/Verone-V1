# Verone — Vue d'ensemble du projet

**Date** : 2026-03-27

## Applications

| App | Port | Description |
|---|---|---|
| **back-office** | 3000 | CRM/ERP staff — produits, stock, commandes, finance, clients |
| **site-internet** | 3001 | E-commerce public "concept store" — catalogue, panier, checkout |
| **linkme** | 3002 | Plateforme B2B affiliation — selections, commissions, commandes affilies |

## Stack

- **Framework** : Next.js 15 App Router (RSC)
- **Language** : TypeScript strict (zero `any`)
- **UI** : shadcn/ui + Tailwind CSS
- **DB** : Supabase PostgreSQL (RLS obligatoire)
- **Cache** : React Query (TanStack Query)
- **Validation** : Zod
- **Paiements** : Stripe (site-internet), Revolut (LinkMe)
- **Emails** : Resend
- **Monorepo** : pnpm workspaces + Turborepo

## Packages partages (@verone/*)

26+ packages dans `packages/@verone/` :
- `@verone/ui` — composants shadcn/ui
- `@verone/types` — types Supabase generes
- `@verone/utils` — utilitaires partages
- `@verone/products` — hooks produits
- `@verone/orders` — hooks commandes
- `@verone/organisations` — hooks organisations
- `@verone/hooks` — hooks generiques

## Base de donnees

- **Migrations** : `supabase/migrations/` (source de verite)
- **Types generes** : `packages/@verone/types/src/supabase.ts`
- **RLS** : isolation par app/role (voir `.claude/rules/database/rls-patterns.md`)

## Domaines metier

| Domaine | Tables principales |
|---|---|
| Produits | products, product_images, product_categories |
| Commandes | sales_orders, sales_order_items, purchase_orders |
| Stock | stock via triggers PostgreSQL, alertes |
| Finance | financial_documents, Qonto API |
| Clients | organisations, contacts |
| LinkMe | linkme_affiliates, linkme_selections, linkme_commissions |
