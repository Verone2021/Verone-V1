# MEGA-PLAN : Audit Global et Refonte Complete du Repository Verone

## Contexte pour le prochain agent

Tu travailles sur le repository Verone Back Office — un monorepo Turborepo avec 3 apps (back-office, linkme, site-internet). Ce plan est le resultat de :
- 7 recherches approfondies sur les meilleures pratiques Claude Code 2026 (stockees dans `.claude/research/01 a 08`)
- Un audit partiel deja realise (dossier `.claude/` restructure, agents crees, commandes fusionnees)
- Les retours de Romeo (le proprietaire, novice en dev mais expert metier)

**Branche de travail** : `chore/INFRA-001-restructure-claude-code-config` (deja creee, 1 commit pousse)

**Principes des 7 recherches** (consensus unanime) :
1. CLAUDE.md minimaliste — chemins critiques uniquement
2. Rules avec Emphasis CRITICAL — patterns obligatoires
3. Skills on-demand > MCP persistants — CLI + Bash superieur
4. Triple Lecture — lire 3 fichiers similaires avant modification
5. Sous-agent Clean Code — fichiers > 400 lignes = refactoring
6. Methode Apex — Search → Plan → Execute → Review
7. Multi-agent TMUX — 3-4 instances simultanees

---

## CE QUI A DEJA ETE FAIT (ne pas refaire)

### Dossier .claude/ (TERMINE)
- [x] INDEX.md cree (sommaire centralise)
- [x] 3 agents par app crees (linkme-expert, back-office-expert, site-internet-expert)
- [x] 2 agents redondants supprimes (orchestrator, debug-investigator)
- [x] /search cree (fusion /explore + /research)
- [x] /implement refactore (appelle /search en Phase 0)
- [x] MANUAL_MODE.md fusionne dans git-workflow.md et supprime
- [x] context-loading.md avec Triple Lecture CRITICAL
- [x] clean-code.md (limite 400 lignes)
- [x] api.md enrichi (27 → 80 lignes)
- [x] CLAUDE.md root refait (chemins critiques en haut)
- [x] README.md v13.0.0
- [x] settings.json SessionStart renforce
- [x] 5 agents corrigee (scripts inexistants remplaces)
- [x] rls-patterns.md copie au bon emplacement
- [x] 3 Serena memories manquantes creees
- [x] 2 docs manquantes creees (products-architecture, project-overview)
- [x] Plans obsoletes archives dans docs/archive/plans/2026-01/

---

## CE QUI RESTE A FAIRE

### PHASE 1 : Audit fichiers racine (un par un)

Lire le contenu COMPLET de chaque fichier et decider : GARDER / MODIFIER / SUPPRIMER

| Fichier | Lignes | A auditer |
|---|---|---|
| `AGENTS.md` | 332 | Contenu unique (15 memories, 26 packages, tech stack) mais potentiellement redondant avec INDEX.md. Decider si garder ou fusionner. |
| `CHANGELOG.md` | 235 | Derniere entree 2025-11-08. Stale. Decider : automatiser avec GitHub Releases ou mettre a jour manuellement. |
| `PROTECTED_FILES.json` | 128 | Verifier s'il est utilise par un hook/script. Si non, evaluer son utilite. |
| `README.md` | 11125 | README projet. Verifier s'il est a jour avec la stack actuelle. |
| `.editorconfig` | 299 | Config editeur. Garder si coherent. |
| `.env.example` | 6042 | Template env vars. Verifier completude. |
| `.eslint-baseline.json` | 132 | Baseline ESLint. Verifier si encore utilise. |
| `.gitignore` | 2446 | Verifier patterns, nettoyer si necessaire. |
| `.lintstagedrc.js` | 85 | Config lint-staged. Verifier coherence. |
| `.mcp.json` | 1297 | Config MCP servers. EVALUER : supprimer Magic selon recherches. Evaluer Serena. |
| `.mcp.env` | 850 | Credentials MCP. Verifier. |
| `.npmrc` | 247 | Config npm/pnpm. Garder. |
| `.nvmrc` | 8 | Version Node. Garder. |
| `.prettierignore` | 602 | Patterns Prettier ignore. Verifier. |
| `.prettierrc` | 26 | Config Prettier. Garder. |
| `.vercel-trigger` | 28 | Trigger Vercel. Verifier utilite. |
| `.vercelignore` | 217 | Patterns Vercel ignore. Garder. |
| `components.json` | 349 | Config shadcn/ui. Garder. |
| `eslint.config.mjs` | 11744 | Config ESLint. Auditer les regles. |
| `knip.json` | 1464 | Config dead code detector. Garder. |
| `package.json` | 6676 | Scripts racine. Verifier completude, ajouter scripts manquants. |
| `playwright-ct.config.ts` | 2039 | Config Playwright component testing. Garder. |
| `playwright.config.ts` | 2386 | Config Playwright E2E. Garder. |
| `postcss.config.js` | 83 | Config PostCSS. Garder. |
| `tailwind.config.js` | 4721 | Config Tailwind. Garder. |
| `tsconfig.json` | 3851 | Config TypeScript. Garder. |
| `turbo.json` | 2209 | Config Turborepo. Garder. |
| `vercel.json` | 1978 | Config Vercel. Garder. |
| `next-env.d.ts` | petit | Types Next.js auto-genere. Garder. |
| `pnpm-workspace.yaml` | 272 | Config workspace. Garder. |

### PHASE 2 : Audit dossiers racine (un par un)

| Dossier | Contenu | A auditer |
|---|---|---|
| `.github/` | Workflows CI/CD, CODEOWNERS | Lire CHAQUE fichier. Verifier coherence avec hooks actuels. |
| `.husky/` | Git hooks (commit-msg, pre-commit, pre-push) | Deja audite — hooks OK. Verifier si coherent avec settings.json. |
| `.plans/` | Reste README.md apres archivage | Supprimer le dossier si README.md est le seul fichier restant. |
| `.playwright-mcp/` | Screenshots, console logs, reports | Nettoyer les vieux screenshots. Verifier .gitignore. |
| `.serena/` | project.yml, cache, memories (24 fichiers) | Auditer project.yml. Verifier que toutes les memories sont pertinentes. Les 3 memories creees aujourd'hui sont-elles bien formattees ? |
| `.turbo/` | Cache Turborepo | Ne pas toucher — auto-genere. |
| `.vercel/` | Config Vercel locale | Ne pas toucher — auto-genere. |
| `.vscode/` | Settings VS Code | Verifier si pertinent. |
| `archive/` | Anciens fichiers archives | Lister le contenu, evaluer si garder ou supprimer. |
| `docs/` | Documentation complete | AUDIT COMPLET dossier par dossier (voir Phase 3). |
| `reports/` | Rapports generes | Lister le contenu, evaluer si garder ou supprimer. |
| `scripts/` | 11 scripts Shell/TS | Deja audite en detail — tous garder. Ajouter 4 scripts manquants au package.json. |
| `supabase/` | Migrations SQL | Ne pas toucher — source de verite. Verifier que les fichiers de config sont corrects. |
| `test-results/` | Resultats de tests | Auto-genere. Verifier .gitignore. |
| `tests/` | Tests Playwright | Auditer les tests existants, verifier pertinence. |
| `tools/` | Outils custom | Lister et auditer le contenu. |

### PHASE 3 : Audit docs/ (dossier par dossier)

| Sous-dossier | Fichiers | A auditer |
|---|---|---|
| `docs/README.md` | 1 | Index principal. Mettre a jour. |
| `docs/current/` | 34 fichiers | Chaque fichier : GARDER / MODIFIER / SUPPRIMER. Verifier dates, pertinence, liens. |
| `docs/current/database/` | 2 | triggers-stock-reference.md + database.md. Verifier completude. |
| `docs/current/linkme/` | 5 | Guide complet + commission + glossaire + formulaires + index. Verifier. |
| `docs/current/site-internet/` | 4 | Architecture + features + API + DMARC. Verifier. |
| `docs/current/serena/` | 3 | database-schema-mappings + products-architecture + project-overview. Verifier. |
| `docs/current/finance/` | 3 | finance-reference + invoicing + quotes. Verifier. |
| `docs/current/modules/` | 4 | stock + orders + sourcing + purchase-price. Verifier. |
| `docs/current/users/` | 1 | daily-workflows.md. Verifier. |
| `docs/current/troubleshooting/` | 1 | dev-environment.md. Verifier. |
| `docs/archive/` | 6+ | Verifier que tout est bien archive et non reference. |
| `docs/governance/` | 1 | GITHUB-RULESETS.md. Verifier. |
| `docs/workflows/` | 1 | typescript-types-generation.md. Verifier. |
| `docs/integrations/` | 2 | resend-dns + qonto guide. Verifier. |
| `docs/templates/` | 2 | product-import-checklist + script. Verifier. |
| `docs/architecture/` | 2 | COMPOSANTS-CATALOGUE + notifications. Verifier. |
| `docs/assets/` | PDF | Claude_Code_Orchestration.pdf. Garder. |

### PHASE 4 : Audit .serena/ memories

- Verifier les 24+ memories existantes
- Croiser avec les references dans les CLAUDE.md des apps
- Supprimer les memories obsoletes
- Mettre a jour celles qui sont outdated (identifiees dans l'audit : linkme-info-request-workflow, site-internet-architecture)

### PHASE 5 : Evaluer les MCP selon les recherches

Les 7 recherches disent unanimement : CLI + Skills > MCP. Evaluer pour notre cas :

| MCP | Verdict recherches | Action |
|---|---|---|
| Supabase | GARDER — pas de CLI equivalent pour execute_sql, list_tables, advisors | Garder |
| Playwright lane-1/2 | GARDER — tests visuels indispensables | Garder |
| Context7 | GARDER — docs librairies a jour, leger | Garder |
| Serena | EVALUER — memories en fichiers, find_symbol = Grep/Glob | Tester si Grep/Glob suffisent, sinon garder |
| Magic | SUPPRIMER — rarement utilise, remplacable par skills templates | Supprimer de .mcp.json |

### PHASE 6 : Creer les Skills manquants (selon recherches)

Les recherches recommandent des Skills on-demand au lieu de charger tout en permanence :

- [ ] `skills/apex/SKILL.md` — workflow complet (Search → Plan → Execute → Review)
- [ ] `skills/oneshot/SKILL.md` — correctif rapide sans exploration profonde
- [ ] `skills/schema-sync/SKILL.md` — reference miroir structure DB pour consultation rapide
- [ ] `skills/new-component/SKILL.md` — template creation composant avec structure dossier standard

### PHASE 7 : Coherence finale

- [ ] Verifier que INDEX.md est a jour avec TOUS les changements
- [ ] Verifier que AGENTS.md racine est coherent ou le supprimer
- [ ] Verifier que .gitignore couvre bien tous les fichiers generes
- [ ] Verifier que le workflow git-workflow.md + hooks + CLAUDE.md sont coherents
- [ ] Nettoyer ACTIVE.md — supprimer les taches INFRA terminees
- [ ] Verifier que chaque agent a ses skills, sa memory, ses tools definis
- [ ] Test : un nouvel agent peut-il trouver toute l'info necessaire depuis INDEX.md ?

---

## PROMPT A COPIER-COLLER DANS LA PROCHAINE SESSION

```
Je travaille sur le repository Verone Back Office (monorepo Turborepo : back-office, linkme, site-internet).

J'ai fait une restructuration partielle du dossier .claude/ sur la branche `chore/INFRA-001-restructure-claude-code-config`. Le commit est pousse.

Maintenant je veux un AUDIT GLOBAL COMPLET du repository — chaque dossier, sous-dossier et fichier racine. Le plan detaille est dans `.claude/work/MEGA-PLAN-REFONTE.md`.

Les 7 recherches sur les meilleures pratiques Claude Code 2026 sont dans `.claude/research/` (fichiers 01 a 08). LIS-LES TOUTES avant de commencer.

Travaille sprint par sprint en suivant les 7 phases du plan. Ne me demande pas confirmation a chaque etape — suis le plan. Arrete-toi uniquement si point de blocage.

Principes cles des recherches :
- CLAUDE.md minimaliste + chemins critiques
- Rules avec Emphasis CRITICAL
- Skills on-demand > MCP persistants
- Triple Lecture (3 fichiers similaires avant modification)
- Clean Code (fichiers > 400 lignes = refactoring)
- Methode Apex (Search → Plan → Execute → Review)

Commence par la Phase 1 (audit fichiers racine) puis enchaine.
```

---

**Fichier** : `.claude/work/MEGA-PLAN-REFONTE.md`
