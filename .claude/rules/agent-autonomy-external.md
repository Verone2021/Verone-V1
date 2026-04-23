# INTERDIT ABSOLU : l'agent ne demande jamais à Romeo de vérifier sur un site externe

**Source de vérité** pour toute tâche qui implique un service externe (Vercel, Packlink, Qonto, Supabase, GitHub, etc.).

Romeo est novice. Chaque fois que l'agent lui demande « va sur le dashboard Vercel », « clique sur telle section Packlink », « vérifie sur Supabase que », Romeo perd du temps, accumule de la friction, et sa santé est impactée. Cette règle existe parce que ce comportement s'est répété trop de fois.

---

## Principe

**L'agent fait TOUT lui-même.** Il utilise les CLI officielles déjà installées, les MCP disponibles (Supabase, Playwright), les credentials déjà configurés dans `.env.local` ou `.claude/test-credentials.md`, et ne sollicite Romeo qu'à la toute fin pour valider le résultat.

Si la tâche semble exiger une interaction UI, l'agent utilise **MCP Playwright Browser** et pilote le navigateur lui-même. Romeo n'ouvre jamais un onglet, n'entre jamais un identifiant, ne clique jamais sur un bouton.

---

## Outils disponibles par plateforme

### Vercel

- `vercel inspect <url>` — détails d'un déploiement
- `vercel ls <project> --prod` — liste des déploiements production
- `vercel inspect <url> --logs` — logs d'un déploiement
- `vercel logs <project>` — logs runtime
- `vercel env ls` — variables d'environnement
- **MCP Playwright** sur https://vercel.com/dashboard si l'UI est nécessaire
- CLI déjà authentifié localement (pas besoin de demander à Romeo)

### Packlink

- `curl` direct sur `https://api.packlink.com/v1/*` avec l'API key dans `apps/back-office/.env.local` (variable `PACKLINK_API_KEY`)
- **MCP Playwright** sur https://pro.packlink.fr pour le wizard web (cf. l'approche validée dans `docs/scratchpad/rapport-2026-04-23-packlink-bug-pour-claude-haiku.md`)
- Credentials Packlink PRO : dans `.claude/test-credentials.md`

### Qonto

- API REST avec `curl` + credentials dans `apps/back-office/.env.local`
- **MCP Playwright** sur https://app.qonto.com
- **Interdit de modifier** les routes `/api/qonto/*` (cf. INTERDICTIONS ABSOLUES racine)

### Supabase

- `mcp__supabase__execute_sql` — requêtes SELECT/EXPLAIN (read-only)
- `mcp__supabase__list_migrations` — liste des migrations appliquées
- `mcp__supabase__list_tables` — schema des tables
- `mcp__supabase__get_advisors` — conseils perf/sécurité
- `mcp__supabase__generate_typescript_types` — régénération types
- **MCP Playwright** sur https://app.supabase.com si besoin d'UI (rare)
- **Interdit** (dans `.claude/settings.json` `deny`) : `apply_migration`, `create_branch`, `merge_branch`, `delete_branch`, `reset_branch`, `deploy_edge_function`

### GitHub

- `gh pr view <num>` — détails d'une PR
- `gh pr list` — PRs ouvertes
- `gh pr checks <num> --watch` — attendre la CI
- `gh pr merge <num> --squash` — merge standard
- `gh pr merge <num> --admin --squash` — bypass CI si doc-only (ordre Romeo requis)
- `gh run list` / `gh run view <id>` — runs CI
- `gh api` — appels directs à l'API GitHub
- CLI déjà authentifié localement

### Toute autre plateforme

- **MCP Playwright** (`playwright-lane-1` ou `playwright-lane-2`) sur l'URL concernée
- Credentials dans `.claude/test-credentials.md` (local only, gitignored)
- Screenshots dans `.playwright-mcp/screenshots/YYYYMMDD/` (cf. `.claude/rules/playwright-artifacts.md`)

---

## Credentials connus (ne jamais demander à Romeo)

| Plateforme    | Credential / emplacement                                          |
| ------------- | ----------------------------------------------------------------- |
| Back-office   | `veronebyromeo@gmail.com` / `Abc123456` (cf. test-credentials.md) |
| LinkMe        | cf. `.claude/test-credentials.md`                                 |
| Site-Internet | cf. `.claude/test-credentials.md`                                 |
| Packlink API  | `PACKLINK_API_KEY` dans `apps/back-office/.env.local`             |
| Packlink web  | cf. `.claude/test-credentials.md`                                 |
| Qonto API     | `QONTO_*` dans `apps/back-office/.env.local`                      |
| Vercel CLI    | déjà authentifié (`vercel whoami` pour vérifier)                  |
| GitHub CLI    | déjà authentifié (`gh auth status` pour vérifier)                 |
| Supabase MCP  | déjà branché dans `.claude/settings.json` `enabledMcpServers`     |

Si un credential manque, l'agent **lit** `apps/*/.env.local` ou `.claude/test-credentials.md` — il ne demande PAS à Romeo.

Si le credential est absent de ces deux endroits, l'agent dit une seule phrase : « Il manque le credential X, peux-tu le coller ici ou le mettre dans `.env.local` sous la clé `NOM_DE_LA_VAR` ? » — et attend. Aucune autre question.

---

## Règle d'or

Quand une tâche de Romeo contient un des verbes suivants : « va voir », « clique », « vérifie que », « configure sur », « teste depuis », « connecte-toi à », « ouvre le dashboard » — l'agent **ne répète jamais ces verbes à Romeo**.

L'agent :

1. Ouvre lui-même la session (CLI ou MCP Playwright)
2. Exécute l'action
3. Capture le résultat (logs, screenshots, JSON de réponse)
4. Rapporte le résultat à Romeo avec preuve

**Seul Romeo valide le résultat final.** Jamais les étapes intermédiaires.

---

## Exemples interdits vs autorisés

### Interdit

> « Romeo, peux-tu aller sur Vercel Dashboard et vérifier que le build est passé ? »

> « Connecte-toi à Packlink PRO et dis-moi si le shipment apparaît dans Prêts à payer. »

> « Ouvre Supabase Studio et vérifie la policy RLS de la table `sales_orders`. »

> « Va sur GitHub et vérifie si la PR est mergée. »

### Autorisé

> « J'ai lancé `vercel inspect <url> --logs`, voici le résultat : [logs]. Le build est passé à 14h32. »

> « Via MCP Playwright sur pro.packlink.fr, je vois le shipment UN2026PRO0001430789 dans "Prêts à payer" (screenshot `.playwright-mcp/screenshots/20260423/packlink-ready-143230.png`). »

> « `mcp__supabase__execute_sql` retourne la policy `sales_orders_read_staff` avec USING `is_backoffice_user()`. Conforme au pattern staff. »

> « `gh pr view 742` dit `state: MERGED, mergedAt: 2026-04-23T15:12:00Z`. Voir link : https://github.com/.../pull/742 »

---

## Si la règle semble impossible à respecter

Rare. Dans 99% des cas, un CLI ou MCP Playwright suffit.

Si vraiment l'agent bute (ex: 2FA sur un nouveau service sans MCP disponible, action qui exige un device physique comme un passkey), il propose **une solution technique** au lieu de solliciter Romeo :

- Installer un nouveau MCP
- Utiliser un PAT (personal access token) au lieu de 2FA
- Documenter le point bloquant dans un `rapport-*.md` et attendre

Dans tous les cas, il **ne demande jamais** à Romeo « va sur X et fais Y ».

---

## Référence

Fichier référencé par :

- `CLAUDE.md` racine (section INTERDICTIONS ABSOLUES + table SOURCES DE VERITE)
- `.claude/DECISIONS.md` (ADR-015)

Complémentaire de `.claude/rules/no-phantom-data.md` : l'une interdit de fabriquer un état faux, l'autre interdit de déléguer une vérification à Romeo. Les deux protègent Romeo (santé, temps, confiance).
