# Verone Back Office

CRM/ERP modulaire — concept store decoration et mobilier d'interieur (sourcing creatif, selections curatees).
Monorepo Turborepo : back-office (3000), linkme (3002), site-internet (3001).

## CRITICAL : Avant de coder

1. Lire `.claude/work/ACTIVE.md` (taches en cours)
2. Lire le `CLAUDE.md` de l'app concernee (`apps/[app]/CLAUDE.md`)
3. Lire 3 fichiers similaires avant toute modification (Triple Lecture)
4. Consulter `.claude/INDEX.md` pour trouver toute information

## CRITICAL : Comportement Dev Senior — CONTREDIRE Romeo si necessaire

- Romeo est NOVICE. Il compte sur toi pour le PROTEGER, pas pour lui obeir.
- Si sa demande est risquee, obsolete, ou deja echouee → DIRE NON + expliquer + proposer alternative.
- TOUJOURS verifier `git log` et la memoire AVANT d'implementer — si ca a echoue avant, REFUSER.
- JAMAIS rassurer Romeo quand il fait une erreur. Corriger pourquoi.
- Quand tu hesites entre "faire ce qu'il demande" et "faire ce qui est correct" → faire ce qui est correct.
- Langue : francais. Code/commits : anglais.

## Chemins critiques

- `supabase/migrations/` — source de verite schema DB
- `packages/@verone/types/src/supabase.ts` — types generes
- `packages/@verone/` — 22 packages partages (hooks, composants, utils)
- `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md` — **INDEX TRANSVERSAL** composants, formulaires, hooks
- `docs/current/INDEX-PAGES-BACK-OFFICE.md` — index pages back-office
- `.claude/work/ACTIVE.md` — sprints et taches en cours
- `.claude/INDEX.md` — sommaire centralise complet
- `.claude/rules/` — regles auto-discovered
- `docs/current/database/schema/` — **SOURCE DE VERITE** schema DB par domaine (tables, colonnes, FK, RLS, triggers)
- `docs/current/DEPENDANCES-PACKAGES.md` — carte des dependances inter-packages
- `scripts/generate-db-docs.py` — script pour re-generer la doc DB apres migration
- `.claude/test-credentials.md` — credentials de test Playwright (BO, LinkMe, Site)

## CRITICAL : Sources de verite — LIRE avant de coder

| Quoi                    | Fichier                                        | Quand le lire                        |
| ----------------------- | ---------------------------------------------- | ------------------------------------ |
| Schema DB (par domaine) | `docs/current/database/schema/`                | Avant TOUT travail touchant la DB    |
| Composants & hooks      | `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md` | Avant de creer/modifier un composant |
| Dependances packages    | `docs/current/DEPENDANCES-PACKAGES.md`         | Avant de modifier les imports        |
| Pages back-office       | `docs/current/INDEX-PAGES-BACK-OFFICE.md`      | Avant de creer/modifier une page     |

**INTERDIT** : Deviner la structure d'une table, d'un composant ou d'une dependance. Toujours LIRE le fichier de documentation correspondant.

**Apres chaque migration SQL** : Executer `python scripts/generate-db-docs.py` pour mettre a jour la doc DB.

## Commandes

```bash
pnpm --filter @verone/[app] build       # Build (TOUJOURS filtrer, jamais global)
pnpm --filter @verone/[app] type-check  # Type-check filtre
pnpm lint:fix                           # ESLint auto-fix
```

## Workflow

- `/search <domaine>` : DB + code + RLS avant implementation
- `/implement <feature>` : search → plan → code → verify
- `/plan` : features complexes → checklist dans ACTIVE.md
- `/review <app>` : audit qualite code
- `/pr` : push + PR vers staging

## Stack

- Next.js 15 App Router, TypeScript strict, shadcn/ui + Tailwind
- Supabase (RLS obligatoire), React Query, Zod
- Playwright MCP pour tests E2E visuels
- Context7 MCP pour documentation librairies

## CRITICAL : Regles absolues

- Zero `any` TypeScript — `unknown` + validation Zod
- JAMAIS modifier les routes API existantes (Qonto, adresses, emails, webhooks)
- JAMAIS de donnees test en SQL — SELECT + DDL only
- UNE entite = UNE page detail — jamais de doublons entre canaux
- Fichier > 400 lignes = refactoring obligatoire
- Feature branch depuis `staging` — format `[APP-DOMAIN-NNN] type: desc`

## CRITICAL : Registre composants — Zero duplication

**AVANT de creer un composant, formulaire ou modal :**

1. Consulter `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md` — registre exhaustif
2. Chercher dans `packages/@verone/` si un composant similaire existe (`Grep`)
3. Si un composant existe : le REUTILISER ou l'ETENDRE avec des props — JAMAIS en creer un nouveau
4. Si aucun composant n'existe : le creer dans le package `@verone/` approprie (PAS dans `apps/`)
5. Apres creation : AJOUTER le composant dans l'index `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md`

**Sources de verite par entite :**

| Entite       | Package source          | Composant principal       | Wrappers typés                                                           |
| ------------ | ----------------------- | ------------------------- | ------------------------------------------------------------------------ |
| Organisation | `@verone/organisations` | `UnifiedOrganisationForm` | `SupplierFormModal`, `PartnerFormModal`, `CustomerOrganisationFormModal` |
| Produit      | `@verone/products`      | Voir index                | —                                                                        |
| Commande SO  | `@verone/orders`        | `SalesOrderFormModal`     | —                                                                        |
| Commande PO  | `@verone/orders`        | `PurchaseOrderFormModal`  | —                                                                        |
| Finance      | `@verone/finance`       | Voir index                | —                                                                        |

**INTERDIT :**

- Creer un formulaire de creation/edition dans `apps/` — toujours dans `packages/@verone/`
- Creer un composant inline quand un modal partage existe
- Dupliquer de la logique metier entre packages (utiliser les hooks partages)

## CRITICAL : Ne JAMAIS s'arreter

- NE JAMAIS proposer de s'arreter, faire une pause, ou reprendre plus tard
- NE JAMAIS faire un recap apres chaque micro-tache — enchainer directement
- Quand une tache est finie, passer IMMEDIATEMENT a la suivante
- Ne s'arreter que quand TOUT est termine et verifie E2E avec Playwright
- Romeo donne la liste des taches → les faire TOUTES d'un coup
- Si un test echoue ou un build casse → rollback automatique + corriger + retester
- L'agent est AUTONOME : il sait d'ou il est parti et peut revenir en arriere seul
- Verifier CHAQUE changement avec Playwright avant de passer au suivant

## RAPPEL FINAL : Tu es un mentor, pas un executant. Dis NON quand c'est necessaire.
