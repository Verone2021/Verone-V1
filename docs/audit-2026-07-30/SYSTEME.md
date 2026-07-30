# Le système de travail — audit du 2026-07-30 (complément)

Ce document complète `AUDIT.md` et `FINDINGS.md`. Il ne porte pas sur le code applicatif mais sur **le dispositif censé le protéger** : les 15 règles de `.claude/rules/`, les 3 agents, les 5 workflows CI, les hooks git et Claude Code, et les 1 038 fichiers de documentation.

Lecture intégrale de `CLAUDE.md`, `.claude/` (règles, agents, commandes, hooks, settings, DECISIONS, playbooks, templates, skills), `.github/workflows/`, `.husky/`, `docs/current/` (106 fichiers), `docs/runbooks/`, `docs/governance/`.

---

## 1. Le constat central

Le repo contient des règles de **très bonne qualité**. `non-regression.md`, `code-standards.md`, `finance.md`, `no-phantom-data.md`, `database.md`, `data-fetching.md` sont des documents de niveau senior : incidents datés, causes racines, seuils mesurables, patterns copiables. Ce n'est pas de la littérature, c'est de l'expérience écrite.

**Sur les 15 règles, 2 sont réellement outillées de bout en bout.** 5 le sont partiellement. **8 reposent entièrement sur la bonne volonté de l'agent** — et ce sont précisément celles qui protègent le chiffre d'affaires : `stock-triggers-protected`, `finance`, `no-phantom-data`, `non-regression`, `data-fetching`, `database-modeling-patterns`, `responsive`, `communication-style`.

Le repo a écrit lui-même son diagnostic, dans l'ADR-033 : _« Prompt-based rules are wishes. Code-based enforcement is control. »_

### Tableau des mécanismes réellement bloquants

| Règle                                        | Mécanisme automatique                                                    | Bloquant                               |
| -------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------- |
| `database` — patterns RLS obsolètes          | `.husky/pre-commit:20-29` (grep sur les migrations)                      | **oui**                                |
| `database` — FK hors migration               | `db-drift-check` (`quality.yml:650`) + cron hebdo                        | **oui**, si `SUPABASE_DB_URL` défini   |
| `database` — types régénérés                 | `supabase-types-drift` (`quality.yml:719`)                               | **oui**, si migration touchée + secret |
| `playwright` — rangement des captures        | `validate-playwright-screenshot.sh` (PreToolUse, `exit 2`)               | **oui**                                |
| `workflow` — PR vers `staging`               | `settings.json:290` + `protect-main-source.yml`                          | **oui**                                |
| `workflow` — pas de PR dupliquée             | `check-pr-duplication.sh` (`exit 1`)                                     | **oui**                                |
| `workflow` — jamais `--no-verify`            | `settings.json:74-81`                                                    | **oui**                                |
| `code-standards` — `any`, `eslint-disable`   | hooks PreToolUse                                                         | **incertain** — voir § 2               |
| `code-standards` — **fichier > 400 lignes**  | aucun (ESLint réel : `warn` à 500)                                       | **non** — 222 violations               |
| `code-standards` — Zod sur les inputs API    | aucun                                                                    | **non** — 36 routes sur 151            |
| `finance` (R1→R8)                            | 1 test unitaire existe, **aucun job CI ne lance de tests**               | **non**                                |
| `data-fetching` — `select('*')`, ≤ 5 req/5 s | aucun gate                                                               | **non**                                |
| `no-phantom-data`                            | aucun — `execute_sql` est en `allow`                                     | **non**                                |
| `non-regression`                             | aucun — et son critère « E2E Smoke vert » est un faux vert (§ 3)         | **non**                                |
| `stock-triggers-protected` (20 fonctions)    | aucun — `PROTECTED_FILES.json` cité par `CLAUDE.md:122` **n'existe pas** | **non**                                |
| `responsive` (5 techniques)                  | aucun lint, aucun test visuel                                            | **non**                                |

---

## 2. À vérifier en premier : les hooks Claude Code sont peut-être à moitié morts

Deux conventions incompatibles cohabitent dans `.claude/`.

Les **scripts dédiés** lisent le JSON du hook sur **stdin** :

```bash
# .claude/hooks/check-component-creation.sh:4-5
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path')
```

Les **hooks inline** de `settings.json` lisent une **variable d'environnement** `$TOOL_INPUT` : lignes 88 (Task-ID sur commit), 101 (push sur main), 119 (blocage `gh pr merge`), 128 (`pnpm dev`), 173 (blocage `any`), 211 (type-check post-édition), plus `check-eslint-disable.sh:8-9` et `validate-git-checkout.sh:4`.

Si `$TOOL_INPUT` n'est pas peuplé par le runtime, ces gardes se comportent de deux façons opposées, et aucune n'est celle voulue :

- **fail-open silencieux** pour `any`, `eslint-disable`, push sur `main`, blocage `gh pr merge`, `pnpm dev`, type-check automatique → la protection annoncée dans `commands/README.md:57-63` (« Zero any → Bloque si TypeScript `any` détecté ») ne s'appliquerait **jamais** ;
- **fail-closed** pour le contrôle Task-ID (`:88`) : `echo "" | grep -qE …` échoue → « Task ID manquant » → `exit 1` sur **tous** les commits.

Ces deux comportements ne peuvent pas être vrais simultanément sur une machine où l'on commite tous les jours. **Donc soit la moitié des gardes est morte, soit les commits sont bloqués.** Un `echo "$TOOL_INPUT" >> /tmp/hook-debug.log` dans un seul hook tranche la question en une minute, et conditionne la valeur réelle de tout le tableau du § 1.

---

## 3. Le check de sécurité le plus important de la CI est un tampon vert permanent

`quality.yml:893-914` définit un job nommé **« E2E Smoke (Playwright — back-office) »**. C'est le nom du check requis par la branch protection de `staging` et `main` (ADR-020). Son commentaire l'assume : _« Alias retro-compat […] pour ne pas avoir à modifier la protection. À supprimer le jour où on met à jour les protections branch. »_

Sa logique :

```bash
if [ "$GOLDEN" = "failure" ] || [ "$DOMAINE" = "failure" ]; then exit 1; fi
echo "✅ E2E smoke OK"
```

Or `smoke-golden` et `smoke-domaine` sont désactivés en dur depuis le **2026-05-13** (`if: false &&`). Leur `result` vaut donc `skipped`, jamais `failure`. **Le job sort en succès sur 100 % des pull requests.**

Conséquence : la branch protection affiche un gate E2E vert, et personne ne peut deviner qu'aucun test n'a tourné depuis deux mois et demi. `non-regression.md:45` fait de ce check l'un des cinq critères de sa définition de « CI verte ».

Il y a **4 occurrences de `if: false &&`** dans `quality.yml`, pas 3 comme indiqué dans la première version de l'audit : ligne 283 (upload de l'artifact `.next` — un step, pas un job), 327 (`smoke-golden`), 430 (`smoke-domaine`), 552 (`e2e-full`, dont même le déclenchement manuel est mort).

Et la justification écrite de cette désactivation (`quality.yml:323-326`) est celle que le repo avait lui-même réfutée trois semaines plus tôt : _« Les tests E2E ralentissaient la CI sans détecter les vraies régressions (cf. PR #942 qui a cassé les photos commandes en prod pendant 6 jours sans que le smoke ne sourcille). Roméo teste lui-même. »_ — l'ADR-020, section « Pourquoi mes smoke tests initiaux n'ont pas attrapé le bug », concluait qu'il fallait **durcir les assertions**, pas supprimer les tests.

Enfin, **la désactivation du filet de régression n'a aucun ADR.** `DECISIONS.md` s'arrête à ADR-033 du 2026-05-09 ; l'extinction date du 2026-05-13. Le repo a 33 ADR pour des suppressions de fichiers vides et zéro pour ça. La règle qui l'aurait empêché existe (`CLAUDE.md:122` : toute modification de `.claude/` exige une PR dédiée + une entrée `DECISIONS.md`, « un script CI vérifiera ce contrat »), le script existe (`scripts/check-config-integrity.sh`), et son en-tête dit « à activer en Phase 3 » — Phase 3 classée « 🚫 abandonnée » dans `INDEX.md:194`.

---

## 4. La documentation cause activement les bugs qu'on vient de corriger

C'est la découverte la plus utile de cette lecture, parce qu'elle explique le **pourquoi** des 86 routes ouvertes.

`docs/current/security-auth.md:86-92`, daté du 2026-03-27, affirme :

> **Middleware** — `apps/back-office/src/middleware.ts` — Vérifie session Supabase sur chaque requête — Redirige vers `/login` si non authentifié

Ce fichier n'existe pas. Il n'a jamais existé dans le back-office. Un agent — ou un développeur — qui lit cette ligne conclut que l'authentification est centralisée, et écrit une route API sans `getUser()` en toute bonne foi. **Répété 86 fois, c'est exactement le résultat observé.**

Le même document sous-compte les policies RLS d'un facteur 1,4 (239 annoncées, 336 réelles), invente une colonne `user_profiles.role` qui n'existe pas, et enseigne un pattern RLS que `.husky/pre-commit:21-28` rejette activement.

Autres documents qui mentent sur des faits vérifiables :

| Document                                 | Affirme                             | Réalité                                                                                                                   |
| ---------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `security-auth.md:86`                    | un `middleware.ts` qui protège tout | inexistant → 86 routes ouvertes                                                                                           |
| `stack.md:43`                            | « Repo — GitHub — **Private** »     | **PUBLIC**. C'est l'affirmation qui a permis de ne pas voir la fuite de secrets pendant six mois                          |
| `database/triggers-stock-reference.md:5` | « 48 triggers sur 9 tables »        | **243 triggers sur 90 tables**. Sur le domaine explicitement déclaré immuable                                             |
| `MAPPING-PAGES-TABLES.md`                | 43 identifiants de tables           | **9 noms de tables inventés** (`product_variants`, `stock_items`, `stock_adjustments`…)                                   |
| `DATABASE-SCHEMA-COMPLETE.md` (racine)   | « 91 tables »                       | **159**. Homonyme périmé du fichier généré correct                                                                        |
| `deploy-runbooks.md:93-97`               | rollback = `git push origin main`   | interdit par `CLAUDE.md:129` et bloqué par le pre-commit. **La seule procédure de retour arrière du repo est infaisable** |
| `dev-workflow.md`                        | 5 étapes de workflow git            | chacune est soit interdite, soit rejetée par un hook                                                                      |
| `WORKFLOWS-CRITIQUES.md`                 | mapping vers 5 specs E2E            | ces chemins n'existent pas et les jobs sont éteints                                                                       |

Et deux fichiers déclarés « sources de vérité » par `CLAUDE.md:160-161` — `INDEX-COMPOSANTS-FORMULAIRES.md` et `DEPENDANCES-PACKAGES.md` — **sont absents du disque**. Ils sont référencés en 8 endroits dont deux hooks agent. La cause est traçable : `.husky/pre-commit:38-45` a désactivé leur régénération automatique le 2026-04-25 (4 conflits de merge dans une session : PR #762, #767, #768, #769) en annonçant « régénération désormais via cron post-merge sur staging ». **Ce cron n'a jamais été écrit.** Les fichiers n'étant pas versionnés, ils ont simplement disparu.

### Ce qu'un développeur senior en conclut

> **Un document qui compte, liste ou chemine doit être généré, ou ne pas exister. Un document écrit à la main n'a le droit de contenir qu'un invariant, une décision, ou un geste.**

Vérification par l'exemple : `docs/current/serena/database-schema-mappings.md`, daté du 2026-01-10, est encore **intégralement vrai** après six mois et demi — parce qu'il n'énonce que des invariants de nommage (`organisations.legal_name` et non `name`, pas de table `suppliers`, images via `product_images.public_url`). `triggers-stock-reference.md` est faux d'un facteur cinq parce qu'il **compte**. L'ancienneté n'est pas le problème ; compter l'est.

Le générateur `scripts/generate-docs.py` (34 Ko, 7 sous-commandes) est déjà écrit et correct. Il produirait les index de composants, de dépendances, de pages et de routes API. Il n'est déclenché par **rien** : ni hook, ni CI, ni cron.

**Recommandation** : un job CI bloquant qui lance `generate-docs.py --all` puis `git diff --exit-code docs/current .claude/INDEX.md`. Même patron que `supabase-types-drift` et `db-drift-check` — les deux seuls dispositifs du repo qui fonctionnent. La régénération se fait une fois par PR en CI, pas à chaque commit local : c'est le remède au problème de conflits de 2026-04-25, que la désactivation a contourné au lieu de résoudre.

Sur 106 fichiers de `docs/current/`, environ 75 devraient disparaître : ~15 remplacés par des générations, ~12 sont des instantanés datés à archiver, 17 sont les mémoires d'un MCP retiré, 5 sont des récits d'installation responsive, et **4 causent activement de mauvaises décisions** (`security-auth.md`, `deploy-runbooks.md`, `dev-workflow.md`, `DATABASE-SCHEMA-COMPLETE.md` racine). Cible réaliste : ~34 fichiers, dont ~15 générés.

À noter aussi : `docs/scratchpad/` contient **267 fichiers markdown**, soit 26 % du corpus documentaire — plus que `docs/current/`. C'est de la mémoire de session, pas de la documentation, et ça dilue l'attention de tout agent qui cherche où est la vérité.

---

## 5. Identifiants en clair dans des fichiers versionnés

Trois fichiers **trackés par git**, donc publiés sur le repo public, contiennent des identifiants :

- `.claude/rules/agent-autonomy-external.md:73` — e-mail **et mot de passe** du compte back-office, en clair, dans un tableau de credentials de test
- `.claude/test-credentials.md` — tracké
- `.claude/commands/review-references/security-rules.md`

Un mot de passe de compte owner est plus grave qu'une clé API : combiné aux 86 routes ouvertes, il donne l'accès complet, par la porte d'entrée.

Et `.claude/local/CREDENTIALS-VAULT.md:37` contient un token Cloudflare DNS en clair (`cfut_…`) plus deux identifiants de zone — ce fichier est gitignored, donc non exposé, mais un `.md` n'est pas un gestionnaire de mots de passe.

**Actions** : changer le mot de passe du compte back-office, sortir les identifiants des fichiers versionnés (`git rm --cached` puis gitignore), passer le repo en privé, et brancher `gitleaks` en pre-commit — `.husky/pre-push:8-9` annonce déjà l'emplacement prévu : _« pour permettre l'ajout de hooks futurs (ex: scan secrets) »_.

---

## 6. Les agents : trois existent, trois manquent

`dev-agent` (implémentation), `reviewer-agent` (revue à froid), `perf-optimizer` (audit perf). Le pipeline documenté dans `README.md:21-25` en compte cinq étapes — mais `verify-agent` a été supprimé (ADR-027) et `ops-agent` aussi (ADR-031), alors que `commands/README.md:49-51` publie encore le pipeline complet et que `cleanup-scratchpad.sh:88-89` archive encore leurs rapports.

Manques mesurés au vu de l'audit :

| Manque                 | Constat                                                                                                                                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent sécurité**     | Personne ne porte auth, RLS, routes API. Le seul filet écrit est l'axe 2 de `reviewer-agent.md:66-72` : **5 puces**, contre 39 lignes pour le responsive. Sécurité notée 17/100. À créer.                                                                                        |
| **Agent migration DB** | `database-architect` supprimé (ADR-001). `perf-optimizer` doit déléguer les migrations à `dev-agent`, à qui `CLAUDE.md:116` interdit de toucher aux policies RLS sans PR dédiée. **Personne ne porte les migrations**, alors que l'outillage est le plus mûr du repo. À recréer. |
| **Agent test**         | 1 % du code en tests, `turbo.json` a une tâche `test` que personne n'appelle. Aucun agent n'a pour mission d'écrire un test. Prérequis du Lot 7.                                                                                                                                 |
| **Agent incident**     | `ops-agent` supprimé, `docs/runbooks/incident.md` est en réalité un **prompt d'agent égaré dans `docs/`** (frontmatter `name: senior-stabilization-protocol`, `$ARGUMENTS` en ligne 10) qui invoque un agent et un MCP inexistants. Aucun porteur du rollback.                   |

Incohérences internes notables : `dev-agent.md:50-51` lui impose de tester aux 5 tailles Playwright, mais **aucun outil `mcp__playwright*` n'est dans sa liste** ; `dev-agent.md:34` lui demande de créer la branche avec `git checkout -b`, que `validate-git-checkout.sh:7-21` **bloque inconditionnellement** — et la justification de ce blocage renvoie à l'ADR-023, annulé par l'ADR-024.

---

## 7. Contradictions règle ↔ configuration, par gravité

1. **`gh pr merge` est interdit par la configuration alors que la règle l'exige.** `workflow.md:263-273` (ADR-032) : « Dès `gh pr create` réussi, l'agent enchaîne immédiatement `gh pr merge --auto --squash` ». `settings.json:114-121` : tout `gh pr merge` → `exit 2` « BLOQUÉ ». La procédure obligatoire est bloquée par le hook censé la protéger.
2. **Trois régimes de merge coexistent.** ADR-032 « auto-merge par défaut, pas de validation humaine » / `CLAUDE.md:132` « merger vers staging sans ordre Roméo explicite » en interdiction absolue / `settings.json:23` (injecté à chaque session) « JAMAIS commit/push/PR sans ordre explicite » / `commands/pr.md:151` « NE PAS MERGER ». Un agent qui lit tout ne peut pas trancher.
3. **`> 400 lignes = refactoring obligatoire` n'est outillé nulle part.** Répété dans 5 fichiers ; ESLint est à `warn` 500 ; et `commands/review.md:70-71` classe « > 500 L » en `IMPORTANT` et « 300-500 L » en `SUGGESTION` — la commande de revue déclare _acceptable_ ce que la règle déclare _obligatoire_. État réel : 222 fichiers.
4. **`validate-git-checkout.sh` interdit ce que `workflow.md` prescrit** (`git checkout -b`), sur la base d'un ADR annulé, et demande une confirmation utilisateur en contradiction avec la règle 6 anti-paralysie de `communication-style.md`.
5. **Le check E2E requis est vert par construction** (§ 3).
6. **`CODEOWNERS` assigne 30 chemins à `@owner`** — ce n'est pas un handle GitHub valide, donc **aucune règle CODEOWNERS ne désigne jamais personne**. Une ligne à corriger redonne son sens à un fichier de 80 lignes. Par ailleurs le ruleset réel exige **0 approbation** (`docs/governance/GITHUB-RULESETS.md:20`) alors que `BRANCH_PROTECTION.md:49` en annonce 1, et référence un workflow `linkme-validation.yml` inexistant. Trois documents décrivent trois protections différentes de `main` ; aucun ne correspond au YAML.
7. **Il n'y a pas de préproduction.** `vercel.json:7-13` désactive les déploiements de `staging` (`"staging": false, "main": true`) et l'`ignoreCommand` ne construit que `main`. `staging` est une branche git, pas un environnement. Rien n'est jamais exécuté avant la production. Inverser ces deux réglages donne une préprod en une session.
8. **`commands/pr.md` viole trois règles** : lance `type-check`, `lint` et `build` **globaux** alors que `CLAUDE.md:190` impose `--filter` et interdit le build global ; crée la PR en `--draft` et interdit le merge, contre ADR-032 ; exige une validation Vercel qui ne peut jamais arriver pour une PR vers `staging` (point 7).
9. **Quatre seuils de délégation incompatibles** pour la même décision : `CLAUDE.md:19` « > 5 outils ou > 10 fichiers », `AGENT-ENTRY-POINT.md` « > 10 lignes ou > 1 fichier », `non-regression.md:35` « < 30 lignes », `CLAUDE.md:92` « > 3 fichiers ».
10. **`INDEX.md` et `README.md`, présentés comme points d'entrée, sont périmés** : « Rules (14 fichiers) » puis 13 listés, 15 réels ; « 14 PreToolUse, 2 PostToolUse » contre 17 et 3 ; les ADR s'arrêtent à 007 alors que le fichier va à 033 ; `README.md:9-16` annonce 6 agents dont 3 supprimés en avril.
11. **`settings.local.json` accorde 12 autorisations `rm -rf` sur `.claude/`** alors que `CLAUDE.md:122` interdit toute modification de `.claude/` sans PR + ADR.
12. **`non-regression.md` n'est référencé ni par `CLAUDE.md` ni par `INDEX.md`.** La meilleure règle du repo est orpheline : elle n'est atteinte que si un humain la nomme. Idem `finance.md` et `playwright.md`, absents de `CLAUDE.md`.

---

## 8. Scripts écrits et jamais appelés

| Script                                                  | Prétend                                                     | Réalité                                                                                                                 |
| ------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `scripts/check-db-type-alignment.ts` (`validate:types`) | détecte colonnes inexistantes et enums hardcodés            | absent de la CI et des hooks. Aurait attrapé à lui seul 3 des 12 bugs bloquants                                         |
| `scripts/check-console-errors.ts` (`check:console`)     | zéro erreur console                                         | idem                                                                                                                    |
| `scripts/check-config-integrity.sh`                     | garde-fou anti-dérive de `.claude/` + contrat DECISIONS     | « à activer en Phase 3 », Phase 3 abandonnée. C'est ce script qui aurait bloqué l'extinction des E2E sans ADR           |
| `.claude/hooks/validate-affected-apps.sh`               | « appelé par `.husky/pre-push` ET `settings.json` »         | `pre-push` = `exit 0`, aucun matcher `git push`. **Zéro appelant.** L'ADR-031 se contredit lui-même à 14 lignes d'écart |
| `.claude/scripts/check-open-prs.sh`                     | « appelé par CLAUDE.md section AU DÉBUT DE CHAQUE SESSION » | cette section a été retirée par l'ADR-031                                                                               |
| `scripts/generate-docs.py`                              | 7 sous-commandes, 2 sources de vérité                       | aucun déclencheur (§ 4)                                                                                                 |
| `scripts/monitor-health.sh`                             | « surveillance »                                            | surveille le Mac (CPU, RAM, fuite `ccusage`), pas l'application                                                         |

---

## 9. Ce que ça change pour le plan de correction

Ajouts au **Lot 0** :

- Changer le mot de passe du compte back-office, sortir les 3 fichiers d'identifiants du suivi git.

Ajouts au **Lot 2** (rebrancher les gates) — le lot gagne en importance :

- **Supprimer le job alias `e2e-smoke-aggregate`** et mettre à jour la branch protection pour exiger les vrais jobs. Tant que l'alias existe, retirer les `if: false` ne suffit pas : la protection continuera d'accepter un skip comme un succès.
- **Tester si les hooks Claude Code fonctionnent** (§ 2) — un `echo` de debug. Si `$TOOL_INPUT` est vide, la moitié des gardes annoncées n'a jamais rien bloqué, et le tableau du § 1 est encore plus vide qu'il n'y paraît.
- **Brancher `scripts/check-config-integrity.sh`** — c'est le gardien de `.claude/`, écrit, jamais activé. Son absence explique l'extinction des E2E sans trace.
- **Brancher `generate-docs.py --all` en gate bloquant** (§ 4) — remède réel au problème de conflits de 2026-04-25.
- **Corriger `CODEOWNERS`** : remplacer `@owner` par le vrai handle. Une ligne.
- Rattraper les ADR manquants : 2,7 mois de décisions non tracées, dont l'extinction du filet de régression.

Nouveau **Lot 2bis — purge documentaire** (une journée, aucun risque) :

- Supprimer les 4 documents qui causent activement des erreurs : `security-auth.md`, `deploy-runbooks.md`, `dev-workflow.md`, `DATABASE-SCHEMA-COMPLETE.md` (racine).
- Supprimer `docs/current/serena/` (17 fichiers d'un MCP retiré) en sauvant `database-schema-mappings.md`, seul document vérifié encore entièrement vrai.
- Retirer `docs/scratchpad/` du suivi git (267 fichiers, 26 % du corpus).
- Corriger `CLAUDE.md:160-161` qui déclare sources de vérité deux fichiers absents.

Ajout au **Lot 4** : `vercel.json:7-13` — activer les déploiements de `staging` pour obtenir une préproduction. C'est le prérequis d'un test réel avant production, et ça manque à tous les lots suivants.

Nouveau **Lot 8bis — les agents manquants** : sécurité, migration DB, test. Chacun avec un périmètre étroit et des interdits explicites, sur le modèle des trois existants qui sont bien écrits.

---

_Complément produit le 2026-07-30. Lecture seule, aucun fichier modifié hors ce dossier et `.claude/work/ACTIVE.md`._
