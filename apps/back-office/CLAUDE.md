# Back-Office — Instructions Agent

**Application** : CRM/ERP central (port 3000)
**Public** : Admin, gestionnaires, equipes ventes/achats/compta
**Stack** : Next.js 15, React 18, TypeScript, Tailwind, Supabase

---

## AVANT TOUTE TACHE

1. Lire `/CLAUDE.md` (racine, regles globales + STANDARDS RESPONSIVE)
2. Lire `.claude/rules/responsive.md` si modif UI
3. Lire `docs/current/INDEX-PAGES-BACK-OFFICE.md` pour connaitre les 147 pages
4. Lire `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md` pour reutiliser l'existant

---

## ARCHITECTURE

```
apps/back-office/
├── src/app/
│   ├── (public)/          # login, unauthorized
│   ├── (protected)/       # 147 pages authentifiees
│   │   ├── dashboard/
│   │   ├── produits/
│   │   ├── stocks/
│   │   ├── commandes/
│   │   ├── finance/
│   │   ├── factures/
│   │   ├── canaux-vente/
│   │   └── ...
│   ├── api/               # Route handlers
│   └── layout.tsx
└── src/components/
    └── layout/            # Sidebar, header, auth-wrapper
```

---

## MODULES METIER

28 modules principaux, 147 pages. Domaines :

- Produits (catalogue, sourcing, variantes)
- Stocks (inventaire, mouvements, alertes, receptions, expeditions)
- Commandes (clients, fournisseurs)
- Finance (factures, devis, depenses, TVA, rapprochement)
- Canaux-vente (LinkMe, site-internet, Google Merchant, prix clients)
- Contacts-organisations (clients B2B/B2C, enseignes, partenaires, fournisseurs)
- Consultations, parametres, admin, messagerie

---

## RESPONSIVE (OBLIGATOIRE)

Voir `/CLAUDE.md` section STANDARDS RESPONSIVE.

Patterns UI dominants dans back-office :

- **Pattern A** : listes CRUD (factures, commandes, produits, stocks)
- **Pattern B** : listes avec filtres toolbar
- **Pattern C** : pages detail (facture, commande, produit)
- **Pattern D** : dashboards (KPIs + widgets)
- **Pattern E** : modals (creation commande, devis, facture)
- **Pattern F** : forms wizard (creation produit, consultation)

Utiliser OBLIGATOIREMENT :

- `ResponsiveDataView` pour toutes les listes
- `ResponsiveActionMenu` pour 3+ actions par ligne
- `ResponsiveToolbar` pour headers de page

Breakpoints specifiques back-office :

- Sidebar prend 64px (collapsed) a 240px (hover)
- Viewport contenu = viewport - sidebar
- Tester avec sidebar fermee ET ouverte

---

## INTERDICTIONS SPECIFIQUES BACK-OFFICE

- JAMAIS modifier les routes API Qonto (`/api/qonto/*`)
- JAMAIS modifier les triggers stock
- JAMAIS creer un formulaire dans `apps/back-office/src/` -> tout dans `packages/@verone/`
- JAMAIS utiliser `use client` pour du rendu pur sans interaction
- Fichier > 400 lignes = refactoring obligatoire avant commit

---

## COMMANDES

```bash
pnpm --filter @verone/back-office type-check    # Validation TS
pnpm --filter @verone/back-office build         # Build production
pnpm --filter @verone/back-office lint          # ESLint
```

Format commit : `[BO-DOMAIN-NNN] type: description`
Exemples : `[BO-FIN-022]`, `[BO-UI-RESP-002]`, `[BO-STOCK-009]`
