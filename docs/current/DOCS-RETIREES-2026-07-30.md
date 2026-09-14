# Documents retirés le 2026-07-30 — `[BO-AUDIT-005]`

Six documents de `docs/current/` ont été supprimés parce qu'ils **causaient activement de mauvaises décisions**. Ils restent récupérables dans l'historique git (`git log --diff-filter=D -- docs/current/<fichier>`).

Ce fichier existe pour trois raisons : tracer ce qui a été retiré, dire où trouver l'information juste, et empêcher qu'un agent les recrée de bonne foi.

Contexte complet : `docs/audit-2026-07-30/SYSTEME.md` § 4.

---

## Le principe appliqué

> **Un document qui compte, liste ou chemine doit être généré, ou ne pas exister. Un document écrit à la main n'a le droit de contenir qu'un invariant, une décision, ou un geste.**

Vérification par l'exemple : `docs/current/serena/database-schema-mappings.md`, daté du 2026-01-10, est encore intégralement exact après six mois — parce qu'il n'énonce que des invariants de nommage. `database/triggers-stock-reference.md` annonce 48 triggers là où il y en a 243, parce qu'il **compte**. L'ancienneté n'est pas le problème ; compter l'est.

---

## Les six documents et pourquoi

### `security-auth.md` — le plus nuisible

Affirmait (lignes 86-92) :

> **Middleware** — `apps/back-office/src/middleware.ts` — Vérifie session Supabase sur chaque requête — Redirige vers `/login` si non authentifié

**Ce fichier n'a jamais existé.** Un agent qui lisait cette ligne concluait que l'authentification était centralisée et écrivait une route API sans `getUser()`, en toute bonne foi. Répété 86 fois, c'est exactement l'état mesuré par l'audit : 86 routes API sur 151 sans aucun contrôle d'accès, dont les endpoints bancaires Qonto. **Ce document est la cause racine documentaire de la principale faille du back-office.**

Il annonçait aussi 239 policies RLS (il y en a 336), une colonne `user_profiles.role` qui n'existe pas, et enseignait un pattern RLS que `.husky/pre-commit:21-28` rejette activement.

→ **Où est la vérité** : les policies réelles dans `docs/current/database/schema/` (généré, à jour). Les patterns RLS autorisés dans `.claude/rules/database.md`. L'état réel de l'authentification dans `docs/audit-2026-07-30/FINDINGS.md` § Lot 1.

### `deploy-runbooks.md`

Seule procédure de retour arrière du repo, et elle était infaisable : `git revert` puis `git push origin main` (ligne 95), alors que le push direct sur `main` est interdit par `CLAUDE.md:129` et bloqué par `.husky/pre-commit:14-17`. Citait un workflow `linkme-validation.yml` inexistant, classait `site-internet` et `linkme` en « à créer / PLANIFIÉ » alors qu'ils sont en production, et ne mentionnait jamais `staging`.

→ **Remplacé par `docs/runbooks/rollback.md`**, écrit à partir de la configuration réelle (`vercel.json`, `protect-main-source.yml`, ADR-020) et du seul rollback réellement exécuté dans ce projet.

### `dev-workflow.md` et `QUICKSTART-GIT-HOOKS.md`

Les documents les plus proches d'un onboarding, et **chacune de leurs étapes est soit interdite, soit rejetée par un hook** : travail sur `main`, `npm run dev` (interdit par `CLAUDE.md:146`), `npm run build` global (interdit par `CLAUDE.md:190`), format de commit `feat(module):` — rejeté à l'exécution par `.husky/commit-msg:17` qui exige `[APP-DOMAIN-NNN] type:`. Et `QUICKSTART-GIT-HOOKS.md` annonçait « Pre-push : Type-check (30-60s) » alors que `.husky/pre-push:11` est un `exit 0` depuis l'ADR-031.

→ **Où est la vérité** : `.claude/rules/workflow.md` (git, PR, merge) et `.claude/rules/code-standards.md`. Un vrai document d'onboarding reste à écrire, en copiant les hooks réels plutôt que l'inverse.

### `DATABASE-SCHEMA-COMPLETE.md` (celui de `docs/current/`, pas celui de `docs/current/database/`)

Doublon manuel du 2026-04-10 annonçant **91 tables**. La base en a **159**. Son tableau omettait le domaine `09-autres` (68 relations), soit 43 % de la base rendue invisible. Homonyme du fichier **généré et correct** produit par `scripts/generate-docs.py:336` dans `docs/current/database/`.

→ **Où est la vérité** : `docs/current/database/DATABASE-SCHEMA-COMPLETE.md` (généré, 2026-07-23) et `docs/current/database/schema/00-SUMMARY.md`.

### `stack.md`

Affirmait « Repo — GitHub — **Private** » alors que le dépôt était **public**. C'est l'affirmation qui a permis de ne pas voir, pendant six mois, que des secrets de production étaient exposés dans l'historique git. Classait aussi Google Merchant, Stripe et Packlink en « PLANIFIÉ » alors que les trois sont actifs et exploités.

→ **Où est la vérité** : les versions dans les `package.json` (source réelle), les intégrations actives dans `.claude/local/OPERATIONS-RUNBOOK.md`.

---

## Ce qui reste à faire sur la documentation

Identifié à l'audit, pas encore fait :

1. **Brancher `scripts/generate-docs.py` en gate CI bloquant.** Le générateur est écrit et correct (7 sous-commandes). Il produirait `INDEX-COMPOSANTS-FORMULAIRES.md` et `DEPENDANCES-PACKAGES.md` — deux fichiers **déclarés sources de vérité par `CLAUDE.md:160-161` et absents du disque**. Sa régénération automatique a été désactivée le 2026-04-25 (`.husky/pre-commit:38-45`, 4 conflits de merge) en annonçant un « cron post-merge sur staging » qui n'a jamais été écrit. Le bon remède est une régénération **une fois par PR en CI**, avec `git diff --exit-code` — même patron que `supabase-types-drift`, l'un des deux seuls gates qui fonctionnent dans ce repo.
2. **Corriger `CLAUDE.md:160-161`**, qui déclare sources de vérité deux fichiers inexistants.
3. **Retirer `docs/scratchpad/` du suivi git** : 267 fichiers, 26 % du corpus documentaire, c'est de la mémoire de session et ça dilue l'attention de tout agent qui cherche où est la vérité.
4. **Supprimer `docs/current/serena/`** (17 fichiers, MCP retiré, annoncent 78 tables) en sauvant `database-schema-mappings.md`, seul document du corpus vérifié encore entièrement exact.
5. Environ 60 autres fichiers de `docs/current/` sont soit remplaçables par une génération, soit des instantanés datés à archiver. Cible réaliste : ~34 fichiers dont ~15 générés, contre 106 aujourd'hui.
