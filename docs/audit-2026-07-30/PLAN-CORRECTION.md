# Plan de correction back-office Vérone — issu de l'audit du 2026-07-30

**Point d'entrée pour toute session de correction.** À lire avant `ACTIVE.md`, en même temps que `FINDINGS.md`.

Documents liés dans ce dossier :

- `AUDIT.md` — le rapport complet, note 22/100, méthode et mesures
- `FINDINGS.md` — les ~90 défauts avec `fichier:ligne`, groupés par lot de correction
- `PLAN-TESTS.md` — la stratégie de test, et pourquoi Playwright n'est pas le point de départ

---

## 1. Le diagnostic qui commande tout le plan

Ce projet **n'a pas un problème d'outillage ni de méthode**. Il a une méthode senior écrite (`.claude/rules/non-regression.md`), des scripts de validation de bonne qualité, des hooks, des ADR. Le problème est ailleurs, et il est simple :

> **Tout ce qui pourrait détecter ces défauts existe déjà et est débranché.**

État réel des gates au 2026-07-30, vérifié dans `.github/workflows/quality.yml` :

| Gate                                            | Existe ? | Tourne ?                           | Bloque ?                  |
| ----------------------------------------------- | -------- | ---------------------------------- | ------------------------- |
| `quality` — ESLint + type-check + build         | oui      | oui                                | **oui**                   |
| `db-drift-check`                                | oui      | oui                                | **oui**                   |
| `supabase-types-drift`                          | oui      | oui                                | **oui**                   |
| `smoke-golden` (E2E niveau 1, ~30 s)            | oui      | **non** — `if: false &&` ligne 327 | non                       |
| `smoke-domaine` (E2E niveau 2, 4 shards)        | oui      | **non** — `if: false &&` ligne 283 | non                       |
| `e2e-full`                                      | oui      | **non** — `if: false &&` ligne 552 | non                       |
| `supabase-advisors-security`                    | oui      | oui                                | non (`continue-on-error`) |
| `validate:types` (`check-db-type-alignment.ts`) | oui      | **non — absent de la CI**          | non                       |
| `check:console` (`check-console-errors.ts`)     | oui      | **non — absent de la CI**          | non                       |

Et la baseline du gate advisors (`scripts/supabase-advisors-baseline.json`) **accepte déjà comme normal** :

```
anon_security_definer_function_executable      315
authenticated_security_definer_function_...    315
rls_policy_always_true                          48
security_definer_view                           14
function_search_path_mutable                    24
auth_users_exposed                               1
public_bucket_allows_listing                     1
```

Le gate de sécurité tourne donc, ne bloque rien, et valide l'état vulnérable comme référence.

Ajoute à cela l'auto-merge activé par défaut (ADR-032) : **les seuls garde-fous d'un merge sont ESLint, `tsc` et `next build`**. Ce sont précisément les trois outils qui ne voient aucun des 90 défauts de `FINDINGS.md`. L'ADR-016 note lui-même « 30+ régressions concrètes en production alors que la CI était verte ». Ce n'est pas de la malchance, c'est la conséquence mécanique de cette configuration.

**Conclusion pour la méthode :** l'ordre des travaux n'est pas « corriger les bugs puis les tester ». C'est **rebrancher les gates d'abord**, sinon chaque correction sera défaite par la suivante et on refera cet audit dans six mois.

C'est ce que dit déjà l'ADR-033 du projet : _« Prompt-based rules are wishes. Code-based enforcement is control. »_ Ce plan ne fait que l'appliquer.

---

## 2. Le principe de conversion : un bug → une règle

La règle de travail la plus importante de ce plan.

Un développeur senior ne corrige pas 12 bugs. Il regarde les 12 bugs, y voit **6 classes de défaut**, et écrit 6 gates qui rendent chaque classe impossible. Le coût est le même, le résultat est permanent.

| Classe de défaut                                          | Bugs concernés                                                                                    | Le gate qui la tue                                                                         | Coût |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---- |
| Valeur envoyée à la DB qui n'existe pas (colonne ou enum) | colonne `status` du wizard produit, `backorder`, `TACTICAL`/`OPERATIONAL`, `ProductCreationModal` | `scripts/check-db-type-alignment.ts` **rendu bloquant en CI** — il fait déjà exactement ça | 1 h  |
| Résultat Supabase dont `error` n'est jamais lu            | ~33 occurrences, toutes les « erreurs silencieuses »                                              | règle ESLint custom + ratchet                                                              | 4 h  |
| Lien interne vers une route inexistante                   | ~40 liens `/catalogue/...` → 404                                                                  | script comparant tous les `href` littéraux aux `page.tsx` existants                        | 2 h  |
| Route API sans contrôle d'accès                           | 86 routes, dont 62 mutations                                                                      | `middleware.ts` avec 401 par défaut + test HTTP en CI                                      | 1 j  |
| Champ de formulaire non persisté                          | devise fournisseur, adresse, `delivery_time_days`, `rating`                                       | test générique « remplir tous les champs → relire en base → comparer » par entité          | 1 j  |
| Requête sans borne au-delà de 1 000 lignes                | bilan, TVA, `fetchLinkedIds`, compteur fournisseur                                                | règle ESLint : tout `.select()` sur une table de liste exige `.range()` ou `.limit()`      | 3 h  |

**Six gates, deux semaines, et ces six familles de bugs ne peuvent plus revenir.** À comparer avec corriger 12 bugs un par un en trois jours et les voir réapparaître par un autre chemin.

Corollaire pratique : quand tu corriges un bug de `FINDINGS.md`, la question à poser n'est jamais « comment je le répare » mais **« quel gate aurait empêché ça, et est-ce qu'il coûte moins cher que de le corriger dix fois »**.

---

## 3. Le principe du test le moins cher

Chaque défaut doit être attrapé par le test le moins coûteux capable de le voir. Playwright est le plus cher et le plus lent : il vient en dernier, pas en premier.

```
                    ┌─────────────────────────────┐
   le plus cher     │  E2E Playwright             │  8 parcours seulement
   ~30 s / test     │  (navigateur réel)          │  → ce qui exige un vrai clic
                    ├─────────────────────────────┤
   ~1 s / test      │  Test HTTP de route API     │  151 routes × 4 identités
                    │  (pas de navigateur)        │  → toute la sécurité
                    ├─────────────────────────────┤
   ~50 ms / test    │  Test unitaire de calcul    │  TVA, commission, marge, totaux
                    │  (fonction pure)            │  → toute la logique argent
                    ├─────────────────────────────┤
   au build         │  Type-check + gate DB↔TS    │  colonnes, enums, contrats
                    ├─────────────────────────────┤
   le moins cher    │  Lint / règle statique      │  erreurs avalées, select('*'),
   à l'écriture     │                             │  liens morts, requêtes sans borne
                    └─────────────────────────────┘
```

Ce que ça change concrètement : sur les 90 findings, **environ 70 se détectent sans navigateur**. La campagne Playwright passe de 20 h en amont à ~6 h en aval, ciblée sur les 8 parcours qui exigent réellement un clic humain.

---

## 4. Ce qui manque et que personne n'a vu : l'observabilité

`NEXT_PUBLIC_SENTRY_DSN` est présent dans `.env.local`, et **il n'existe aucune ligne de code Sentry dans le back-office** (vérifié : zéro fichier). Le projet a donc un DSN et pas de collecteur.

C'est le levier le plus rentable de tout ce plan, et il n'est dans aucune de mes recommandations de ce matin :

> Une fois que les erreurs remontent (Lot 3) **et** que Sentry les collecte, ton usage quotidien du back-office devient le meilleur détecteur de bugs du projet. Gratuit, continu, sur les vrais parcours, avec la stack trace et le contexte.

20 h de Playwright testent ce que quelqu'un a pensé à tester. Sentry branché sur un usage réel remonte ce que personne n'avait imaginé. Un senior branche l'observabilité avant d'écrire des tests.

---

## 5. Les lots

Chaque lot a un **critère de sortie mesurable**. On ne passe pas au suivant sans lui. Chaque lot = une ou plusieurs PR vers `staging`, jamais vers `main`.

Convention d'identifiants pour rester cohérent avec le repo : `[BO-AUDIT-NNN]` (le hook commit-msg exige 3 chiffres).

---

### Lot 0 — Fermer la porte d'entrée · 20 min · `[BO-AUDIT-001]`

**Arbitrage Roméo du 2026-07-30, accepté et intégré : la rotation des clés est repoussée au Lot 9.** Elle implique des coupures de service pour ses deux salariés qui travaillent sur l'application tous les jours, et ce n'est pas le bon moment pour ça. Ce lot est réduit aux deux actions qui coûtent un clic, ne coupent rien, et ne nécessitent aucun redéploiement.

**1. Repo GitHub en privé** — Settings → Danger Zone → Change visibility.

C'est la seule action non négociable du plan, et voici pourquoi précisément. L'historique du repo contient depuis le 2026-01-15 trois fichiers `.env.local.backup-*` avec la `service_role` Supabase, la clé Qonto, le PAT GitHub et le token Vercel (détail dans `FINDINGS.md` § Lot 0). Tant que le repo est public, ces secrets restent lisibles par `git log -p`. L'argument « personne ne connaît notre site » ne s'applique pas ici : les scanners de secrets ne cherchent pas Vérone, ils indexent GitHub en continu et alertent sur les préfixes connus (`sbp_`, `ghp_`, JWT Supabase). **Une fois le repo privé, ce vecteur est fermé** et la pression sur la rotation retombe d'un cran — ce qui rend l'arbitrage de repousser au Lot 9 défendable.

**2. Révoquer le PAT Supabase** — Dashboard → Account → Access Tokens → révoquer, régénérer, remettre la nouvelle valeur dans `.mcp.json` local.

Un clic, aucune coupure, aucun redéploiement : ce token ne sert qu'aux outils MCP en local, pas à l'application. Il est maintenu dans ce lot malgré l'arbitrage parce que (a) il est actuellement en service _et_ présent dans 6 commits publics, (b) sa portée est le **compte Supabase entier** — donc aussi « back-office Affect » et « back-office Want It Now » qui n'existent pas encore, (c) le coût est nul.

**Ce qui est explicitement repoussé au Lot 9** : rotation de la `service_role` (migration vers les nouvelles clés d'abord, sinon coupure), Qonto, Resend, Packlink, GitHub PAT, Vercel, Google service account, secrets de webhooks. Plus la purge d'historique et `gitleaks`.

**Critère de sortie** : `gh repo view --json visibility` renvoie `PRIVATE`, et l'ancien PAT Supabase renvoie 401 sur l'API de management.

---

### Lot 0bis — Le `.gitignore`, pour ne pas recommencer · 10 min · `[BO-AUDIT-002]`

Sans rotation, sans risque, et ça empêche la prochaine fuite du même type.

Le `.gitignore` racine **fonctionne** pour `.env.local` (lignes 26-30, vérifié par `git check-ignore`). Le problème est qu'il liste des **noms exacts**, et qu'aucun ne correspond à `.env.local.backup-20260114-065620` — c'est par là que la fuite est passée. Remplacer par des globs :

```gitignore
.env*
!.env.example
*.backup
*.bak
```

**Critère de sortie** : `git check-ignore .env.local.backup-test` répond positivement.

---

### Lot 1 — Le mur, en trois temps · `[BO-AUDIT-003]`

**Révisé le 2026-07-30 après objection de Roméo, qui était fondée.** La version initiale disait « un `middleware.ts` avec 401 par défaut, ça ferme 86 trous d'un fichier ». C'est vrai, et c'est aussi la façon la plus rapide de casser une application en production. Preuve concrète trouvée dans ce repo :

- **L'extension Chrome de sourcing s'authentifie par `Authorization: Bearer`, et omet volontairement les cookies** — `chrome-extension/popup.js:585` : _« credentials omis pour eviter CORS strict (on s'authentifie via Bearer) »_. Elle appelle `/api/brands`, `/api/sourcing/auth`, `/api/sourcing/import`, `/api/sourcing/import-supplier`. Un middleware qui teste « pas de cookie → 401 » **casse l'outil de sourcing**, alors que ces routes sont déjà correctement protégées (`api/sourcing/import/route.ts:173-178` accepte cookie **ou** Bearer — c'est du bon code).
- **Deux webhooks entrants** : `api/webhooks/packlink`, `api/gmail/inbound`.
- **Trois routes `api/cron/*`** (`google-merchant-poll`, `meta-commerce-sync`, `sync-comptabilite`) qui ne sont **pas** déclarées dans un `vercel.json` — les seuls `crons` Vercel du monorepo sont sur `site-internet`. Il faut donc identifier qui les appelle (pg_cron Supabase via `invoke_edge_function` ? déclenchement manuel ?) **avant** de les protéger, sinon on coupe une automatisation sans savoir laquelle.

Conclusion méthodologique : on n'introduit pas une politique de sécurité globale d'un coup sur une application dont deux personnes dépendent quotidiennement. On l'introduit **en observation d'abord**.

#### Temps 1 — Les 3 routes Qonto seules · 1 h

Petit périmètre, effet immédiat, réversible par un `git revert`.

`requireBackofficeAdmin(request)` en tête de `api/qonto/balance/route.ts`, `transactions/route.ts`, `clients/route.ts`.

**Ce que ça change pour les salariés : rien.** Le contrôle ajouté porte sur l'authentification _du salarié vers le back-office_ (le cookie de session Supabase déjà présent dans son navigateur), pas sur l'authentification _du back-office vers Qonto_ (la clé `QONTO_API_KEY`, côté serveur, à laquelle on ne touche pas — zéro ligne modifiée). Aucun écran de connexion supplémentaire, aucune reconfiguration Qonto, aucun impact sur les mois de paramétrage de l'intégration.

**Vérification avant/après** (règle 2 de `non-regression.md`) : ouvrir la page Transactions connecté → la liste s'affiche ; `curl` sans cookie sur les 3 routes → 401.

#### Temps 2 — Middleware en mode observation · 2-3 j de collecte

`apps/back-office/src/middleware.ts` avec `matcher: ['/api/:path*']` qui, pour chaque requête :

1. détermine l'identité (cookie de session, `Authorization: Bearer`, secret de webhook, secret de cron, aucune) ;
2. calcule la décision qu'il **aurait** prise ;
3. **laisse toujours passer**, et journalise `{ méthode, chemin, identité détectée, décision simulée, user-agent, origin }`.

Puis laisser tourner pendant que les salariés travaillent normalement, et passer soi-même par tous les outils : extension Chrome de sourcing, dépôt d'une pièce dans la Bibliothèque, une expédition Packlink, un e-mail entrant Gmail, un déclenchement de chaque cron.

Le fichier de log donne alors **la liste exacte des appelants légitimes** — c'est-à-dire l'allow-list, mesurée au lieu d'être devinée. Zéro risque : à ce stade le middleware ne bloque rien.

#### Temps 3 — Activation · 1 j

Le middleware bloque : **401 par défaut**, allow-list issue des logs du temps 2. Les points à ne pas oublier :

- Accepter **cookie OU Bearer** (sinon l'extension casse), en validant le JWT dans les deux cas.
- Vérifier le rôle **et l'app** : les 3 apps partagent le même cookie Supabase (`packages/@verone/utils/src/supabase/server.ts:6-8`). Un `getUser()` seul ne suffit pas — 45 routes sont dans ce cas et sont atteignables par un affilié LinkMe.
- Rendre les webhooks et crons fail-closed (`if (!secret) return 500`), en recopiant le motif correct de `api/cron/google-merchant-poll/route.ts:72`. Aujourd'hui Packlink et 2 crons sont en `if (secret) { ... }` avec le secret non défini, donc ouverts.
- Y brancher les en-têtes de `src/lib/security/headers.ts` (écrits, jamais utilisés) et un rate limiting distribué. **Ne pas** utiliser le `Map` en mémoire de `packages/@verone/utils/src/middleware/api-security.ts` : en serverless chaque instance a son compteur.
- Déployer d'abord sur `staging`, y refaire le tour complet des outils, puis `main`.
- Garder un interrupteur : une variable d'environnement `API_GUARD_MODE=observe|enforce` permet de revenir en observation depuis le dashboard Vercel en trente secondes, sans redéploiement de code, si quelque chose casse un lundi matin.

**Critère de sortie** : un test HTTP en CI qui boucle sur les 151 routes avec 4 identités (aucun cookie / affilié LinkMe / collaborateur BO / owner BO) et échoue si une seule répond 200 là où on attend 401 ou 403. Plus 48 h en `enforce` sans une seule anomalie remontée par les salariés.

---

### Lot 2 — Rebrancher les gates · 1-2 j · `[BO-AUDIT-004]`

Le lot qui décide si tout le reste tient dans le temps. À faire avant toute correction de bug.

1. Retirer les trois `if: false &&` de `quality.yml` (lignes 283, 327, 552). Fiabiliser `smoke-golden`, puis retirer son `continue-on-error` et l'ajouter aux checks requis de la branch protection.
2. Conditionner l'auto-merge (ADR-032) à la verdeur de `smoke-golden`. L'auto-merge n'est pas le problème — l'auto-merge **sans filet** l'est.
3. Ajouter `pnpm validate:types` (`check-db-type-alignment.ts`) à la CI, **bloquant**. Ce script détecte déjà les colonnes inexistantes et les enums hardcodés : c'est exactement la classe de bugs #1 de la section 2, et il dort dans `scripts/`.
4. Purger la baseline advisors. Elle accepte 315 fonctions exposées à `anon`, 48 policies always-true, 14 vues SECURITY DEFINER, `auth_users_exposed` et `public_bucket_allows_listing`. Retirer son `continue-on-error` et **remettre la baseline à zéro sur les catégories `ERROR`**, en ne conservant en exception documentée que les 6 règles système `always-true` déclarées « par conception » dans `ACTIVE.md`.
5. Deux nouveaux gates bon marché :
   - `scripts/check-internal-links.ts` : extrait tous les `href`/`router.push` littéraux du repo, les compare aux `page.tsx` existants, échoue sur un lien mort. Attrape les ~40 liens `/catalogue/...` et empêche leur retour.
   - `scripts/check-supabase-error-handling.ts` ou règle ESLint : interdit `const { data } = await supabase...` sans lecture de `error`. Mode ratchet : le compte actuel est le plafond, il ne peut que baisser. Le repo a déjà `docs/current/eslint-progressive-ratchet.md` — appliquer le même mécanisme.
6. Régénérer la liste des pages de `smoke-147-pages.spec.ts` depuis `find` en CI, et échouer si elle diverge. Le fichier annonce 147 pages, en liste 106, il en existe 168. Un nom de fichier ne doit pas pouvoir mentir.

**Critère de sortie** : une PR volontairement fautive (une colonne inexistante, un lien mort, un `error` non lu, une route API sans auth) est **refusée** par la CI. Le tester réellement sur une branche jetable.

---

### Lot 3 — Rendre les erreurs visibles · 2-3 j · `[BO-AUDIT-006]`

Le lot qui change ton quotidien. Sans lui, tu continueras à ne pas savoir pourquoi ça échoue.

1. **Brancher Sentry** dans les 3 apps (`instrumentation.ts`, `sentry.client.config.ts`, `sentry.server.config.ts`, wrapper `next.config.js`). Le DSN existe déjà.
2. Un seul système de toast. Trois coexistent : `useToast` maison (139 fichiers), `sonner` (82), `react-hot-toast` (18). Garder `sonner`, migrer progressivement, interdire les deux autres par lint.
3. Un helper unique `handleSupabaseError(error, contexte)` : message Postgres complet en développement, libellé métier en production, envoi à Sentry dans les deux cas. Le brancher sur les ~33 occurrences connues de `FINDINGS.md`, en priorité finance, products, organisations.
4. Supprimer les faux succès : chaque `toast.success` doit être précédé d'une vérification du résultat. Cas les plus graves listés dans `FINDINGS.md` — wizard produit, propagation de variantes, sourcing d'images, réordonnancement d'images, dérapprochement.
5. Supprimer `api/logs/route.ts` : incompatible avec un système de fichiers éphémère, et son GET expose les logs du jour à un anonyme. Sentry le remplace.

**Critère de sortie** : provoquer volontairement une erreur d'écriture (une colonne renommée en base sur la branche de test) et vérifier qu'un toast explicite apparaît **et** qu'un événement arrive dans Sentry. Aucun écran ne doit afficher un état vide silencieux.

---

### Lot 4 — Performance · 2-3 j · `[BO-AUDIT-007]`

Quatre chantiers, du plus rentable au moins rentable.

1. **Le rôle dans le JWT.** Trigger sur `user_app_roles` qui écrit un flag dans `raw_app_meta_data`, puis réécriture de `is_backoffice_user()` en lecture pure du JWT, sans I/O. **La signature ne change pas, donc aucune des 216 policies n'est modifiée** — pas de replanification massive, pas de risque. Ne pas re-tenter le wrapping global `(SELECT ...)` : il a été rollbacké le 2026-05-08 après incident (`20260508060000_rollback_bo_rls_perf_002_003.sql`). Gain attendu : suppression des 256 millions de scans séquentiels sur `user_app_roles`.
2. **Le cache Next.** Retirer `force-dynamic` du layout racine (le garder sur `(protected)/layout.tsx` où `cookies()` est réellement lu), ajouter un `loading.tsx` par groupe de routes, configurer `experimental.staleTimes`. Rendre `AuthWrapper` non bloquant : le rôle est déjà validé côté serveur, ce gate client redondant bloque tout l'arbre derrière un `getSession()`.
3. **Le bundle.** `"sideEffects": false` sur les 24 packages, `optimizePackageImports` dans `next.config.js`, sortir `exceljs` du barrel `@verone/utils` et les charts (`recharts`) du barrel `@verone/orders`.
4. **La page de configuration du site.** RPC dédiée à 6 colonnes, pagination, `memo` sur la ligne, callbacks stables, retirer le `refetchOnWindowFocus: true` local. Et une RPC `get_sidebar_counts()` unique en remplacement des 11 `count(*)` + 2 `getUser()` de la sidebar.

**Critère de sortie** : relever `pg_stat_user_tables.seq_scan` sur `user_app_roles`, faire un parcours de 20 pages, vérifier un delta inférieur à 200. Et un budget de performance en CI sur 5 pages représentatives.

---

### Lot 5 — Les bugs bloquants · 1 semaine · `[BO-AUDIT-008]`

Maintenant seulement. Les gates du Lot 2 empêchent la régression, le Lot 3 rend les échecs visibles : on peut corriger sans travailler à l'aveugle.

**Une PR par bug**, dans l'ordre de `FINDINGS.md`. Pour chacune, appliquer `.claude/rules/non-regression.md` — elle est déjà écrite et bonne : audit des call sites, test de référence avant, diff minimal, test après.

Ordre imposé, du plus structurant au plus local :

1. Contacts de commande (3 causes empilées, cause racine côté INSERT)
2. Rapprochement : écriture réelle en base + allocation partielle + signe `side` au lieu de `amount > 0`
3. Wizard produit : colonne fantôme + chaînes vides sur colonnes `uuid`
4. Enums désalignés (segments fournisseur, `backorder`) — normalement déjà bloqué par le gate du Lot 2, à vérifier
5. Champs fournisseur non persistés (devise, adresse, délai, minimum, rating)
6. Requêtes sans borne : bilan, TVA, `fetchLinkedIds`, compteur fournisseur
7. Liens `/catalogue/` → helper `productDetailPath()` centralisé dans `@verone/utils`
8. Synchro Qonto : colonne `provider_updated_at` distincte
9. TVA au prorata de l'allocation, sans `Math.round` sur le taux
10. Suppression du code mort armé : `app/actions/bank-matching.ts` (380 lignes sans appelant), `matchTransaction` stub, `ProductCreationModal`, `simple-product-form.tsx`
11. Marketing : câbler ou retirer `CrossPostModal`, marques depuis la base, période appliquée à Meta et Google
12. Déduplication de l'arbre `catalogue/[id]` vs `catalogue/detail/[id]`

**Critère de sortie** : le test de régression correspondant, écrit **avant** le correctif, passe du rouge au vert. Il reste dans la suite pour toujours.

---

### Lot 6 — Le socle de test · 1 semaine · `[BO-AUDIT-009]`

1. **Baseline SQL.** `pg_dump --schema-only` de la production, committé comme migration `00000000000000_baseline.sql`. Aujourd'hui 59 tables cœur — `products`, `organisations`, `sales_orders`, `stock_movements`, `contacts` — n'ont **aucun `CREATE TABLE`** dans les 770 migrations. Le schéma n'est pas reconstructible, donc aucun environnement de test n'est reproductible. C'est le prérequis de tout le reste. Ça résout aussi partiellement le problème des 418 fichiers à l'ancien format qui empêchent un `supabase db push` propre, noté dans `ACTIVE.md`.
2. Branche Supabase de test + seed déterministe (volumes détaillés dans `PLAN-TESTS.md` — les seuils au-delà de 1 000 lignes sont volontaires, plusieurs bugs ne se manifestent pas en dessous).
3. **Garde-fou d'environnement** : `assertTestEnvironment()` en `globalSetup`, qui refuse de démarrer si l'URL pointe sur la production. Aujourd'hui `turbo.json` expose `SUPABASE_SERVICE_ROLE_KEY` à `test:e2e` et les fixtures écrivent dans `NEXT_PUBLIC_SUPABASE_URL` — lancer les tests peut écrire dans ta prod.
4. Extraire les calculs purs — commission LinkMe, rétrocession, TVA, marge, totaux de document — dans un package `@verone/domain`, et les couvrir à 80 % de branches. `packages/@verone/finance/src/lib/finance-totals/__tests__/compute.test.ts` (598 lignes) est le modèle : le projet sait faire, il y en a 6.
5. Committer une configuration de test unitaire explicite (`vitest.config.ts`) : les 6 tests unitaires existants n'ont aucun runner déclaré, rien ne prouve qu'ils tournent.

**Critère de sortie** : `pnpm test:setup && pnpm test && pnpm test:teardown` fonctionne, et il ne reste aucune ligne préfixée `TEST-` après le teardown.

---

### Lot 7 — Playwright, ciblé · 6 h · `[BO-AUDIT-010]`

Maintenant que le socle existe et que le reste est couvert plus bas dans la pyramide, Playwright sert à ce qu'il fait seul : les parcours à plusieurs écrans avec de vrais clics.

Les 8 parcours sont décrits dans `PLAN-TESTS.md`. La règle de conception y est non négociable : chaque scénario vérifie l'écriture **en base**, puis recharge la page, puis re-vérifie. Un test qui se contente du toast de succès passera sur du code cassé — c'est démontré par le Lot 5.

**Critère de sortie** : les 8 parcours verts sur la branche de test, `smoke-golden` bloquant, `smoke-domaine` fiabilisé.

---

### Lot 8 — Architecture · mois 2-3 · `[BO-AUDIT-011]`

À traiter en fond, sans urgence, quand le reste est stabilisé.

- Une seule copie des types Supabase, suppression des répertoires imbriqués, check CI bloquant sur les doublons
- Casser les 13 cycles inter-packages (`dependency-cruiser` est déjà en dépendance, il suffit de le rendre bloquant)
- Déclarer les 41 % de dépendances inter-packages manquantes
- Couche d'accès aux données unique (9 façons de créer un client Supabase aujourd'hui), key factory React Query (187 racines de `queryKey`)
- Aligner CLAUDE.md et ESLint sur un seul seuil de lignes, en `error`, avec ratchet
- Sortir `lucide-react` de `@verone/types` et passer ses `export *` en `export type *`
- Fermer le RPC `exec_sql` appelé depuis une route API : c'est un chemin d'écriture au schéma hors migrations

---

### Lot 9 — Rotation des clés et purge d'historique · 1 soirée · `[BO-AUDIT-013]`

**Volontairement placé en dernier** (arbitrage Roméo du 2026-07-30). Raison : c'est le seul lot dont chaque étape peut interrompre le travail de ses deux salariés, et il n'apporte aucune amélioration fonctionnelle. Une fois le repo passé en privé (Lot 0), le vecteur d'exposition est fermé et l'urgence retombe.

À faire en une session dédiée, un soir ou un week-end, jamais au milieu d'un autre chantier.

**Règle de méthode : rotation à chevauchement.** Pour chaque clé — créer la nouvelle, la déployer partout (`.env.local`, variables d'environnement Vercel des 3 apps, GitHub Secrets si utilisée en CI), redéployer, vérifier que ça marche, **puis seulement** révoquer l'ancienne. Jamais l'inverse.

| Clé                                                                         | Où                                                                                          | Ce qui tombe si mal fait                                                                                                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `service_role` Supabase                                                     | **migrer d'abord vers les nouvelles clés** (Settings → API Keys), puis désactiver la legacy | les 3 apps. Le projet est en clés legacy : régénérer le JWT secret invalide `anon` **et** `service_role` d'un coup — _« all current API secrets will be immediately invalidated »_ |
| `QONTO_API_KEY`                                                             | Qonto → Paramètres → API                                                                    | la synchro bancaire et le rapprochement                                                                                                                                            |
| `RESEND_API_KEY`                                                            | Resend → API Keys                                                                           | tous les envois d'e-mails                                                                                                                                                          |
| `PACKLINK_API_KEY`                                                          | compte Packlink                                                                             | les expéditions                                                                                                                                                                    |
| `GH_TOKEN`                                                                  | GitHub → Developer settings → PAT                                                           | la CI si elle l'utilise                                                                                                                                                            |
| `VERCEL_TOKEN` + Deploy Hook                                                | Vercel → Account Settings → Tokens ; Project → Git → Deploy Hooks                           | les déploiements automatiques                                                                                                                                                      |
| Google service account                                                      | Cloud Console → IAM → Service Accounts → Keys                                               | Google Merchant                                                                                                                                                                    |
| `DATABASE_URL`                                                              | Supabase → Settings → Database → Reset password                                             | connexions Postgres directes                                                                                                                                                       |
| `CRON_SECRET`, `QONTO_WEBHOOK_SECRET`, `ABBY_WEBHOOK_SECRET`, `REF_API_KEY` | générés soi-même : `openssl rand -hex 32`                                                   | à changer des deux côtés dans le même geste                                                                                                                                        |
| ~~`anon`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`~~                               | publiques par conception                                                                    | rien — les **restreindre** (RLS, restriction par domaine), pas les faire tourner                                                                                                   |

Puis, dans le même lot : `gitleaks` en pre-commit et en CI bloquant (`.husky/pre-push` est un `exit 0` avec un commentaire qui prévoit exactement cet usage), et purge de l'historique (`git filter-repo` ou BFG) — **après** la rotation, jamais à la place : un fork ou un cache GitHub peut conserver les blobs indéfiniment, seule la rotation neutralise réellement.

**Critère de sortie** : chaque ancienne clé renvoie une erreur d'authentification chez son fournisseur, les 3 apps fonctionnent, `gitleaks` refuse un commit contenant une clé de test.

---

## 6. Trajectoire de la note

Réaliste, mesurée sur la même grille que l'audit initial.

| Après                   | Sécu | Stab | Perf | Scal | Test | **Global** |
| ----------------------- | ---- | ---- | ---- | ---- | ---- | ---------- |
| Aujourd'hui             | 17   | 24   | 22   | 28   | 20   | **22**     |
| Lot 0 + 1               | 48   | 24   | 22   | 28   | 22   | **29**     |
| Lot 2                   | 55   | 28   | 22   | 32   | 45   | **37**     |
| Lot 3                   | 58   | 40   | 24   | 34   | 48   | **42**     |
| Lot 4                   | 58   | 42   | 68   | 36   | 50   | **51**     |
| Lot 5                   | 60   | 72   | 70   | 40   | 55   | **62**     |
| Lot 6 + 7               | 64   | 78   | 72   | 45   | 78   | **71**     |
| Lot 8 + durcissement DB | 82   | 82   | 76   | 70   | 80   | **80**     |

**Dis-toi bien que 100 n'existe pas.** Aucune application en production n'est à 100 sur cette grille — ni Stripe, ni Shopify. 80 signifie : aucune faille exploitable connue, les erreurs sont visibles et collectées, les régressions sont bloquées avant merge, et un nouvel arrivant peut modifier un calcul financier sans risque. C'est un très bon back-office. Viser au-delà coûte plus cher que ce que ça rapporte, sauf contrainte réglementaire.

Le passage le plus rentable est **22 → 37** : les lots 0, 1 et 2, environ une semaine, dont un fichier de middleware et le retrait de trois `if: false`.

---

## 7. Comment travailler avec Claude Code sur ce plan

Une session par lot. Jamais deux lots dans la même session : les critères de sortie deviennent flous et la vérification saute.

**En-tête à coller au début de chaque session :**

```
Lis dans cet ordre : CLAUDE.md racine, apps/back-office/CLAUDE.md,
docs/audit-2026-07-30/PLAN-CORRECTION.md, docs/audit-2026-07-30/FINDINGS.md
(section du lot concerné uniquement), .claude/work/ACTIVE.md.

Applique .claude/rules/non-regression.md sur chaque modification.

Je travaille sur le Lot <n>. Commence par me confirmer en 5 lignes ce que tu as
compris de son objectif et de son critère de sortie, avant d'écrire une ligne
de code. Puis propose-moi ton plan d'attaque et attends ma validation.

Rappels : PR vers staging uniquement, aucun commit ni push sans mon ordre
explicite, aucune migration appliquée sans mon accord, `supabase db push`
interdit (utiliser execute_sql).
```

**Ce qu'il faut exiger de lui à chaque lot**, dans cet ordre :

1. La confirmation de l'objectif et du critère de sortie, avant tout code
2. L'audit pré-modification (call sites, tests existants) — règle 1 de `non-regression.md`
3. Le test de régression **écrit avant** le correctif, et qui échoue
4. Le correctif, diff minimal
5. Le test qui passe au vert, plus les cas voisins
6. La mise à jour de `ACTIVE.md` dans le même geste — règle `active-md-maintenance.md`
7. Une ligne dans `.claude/DECISIONS.md` si la correction établit un pattern (le dernier ADR date du 2026-05-09, il y a 2,7 mois de décisions non tracées)

**Le signal d'alarme** : s'il te propose de corriger plusieurs bugs dans la même PR, refuse. La règle du repo est claire — 1 PR = 1 sujet, diff sous 30 lignes par défaut. C'est précisément ce qui empêche de casser trois choses en réparant une.

---

## 8. Où commencer, concrètement

Aujourd'hui, Lot 0, dans cet ordre : le `.gitignore` d'abord (quinze minutes, évite un compromis irréversible), puis les trois routes Qonto, puis le `REVOKE`.

Demain, Lot 1 : le middleware. Un fichier, 86 trous fermés.

Ensuite, Lot 2 avant toute correction de bug. C'est contre-intuitif — on a envie de réparer ce qui est cassé — mais sans les gates, les corrections du Lot 5 seront défaites une par une par les merges suivants. Le repo en a déjà fait l'expérience : 30+ régressions en production avec une CI verte.
