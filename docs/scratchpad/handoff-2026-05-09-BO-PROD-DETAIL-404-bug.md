# Handoff — Bug page détail produit 404 en prod

**Date** : 2026-05-09
**Auteur précédent** : agent (session saturée, contexte ~140k tokens)
**Pour** : prochain agent (nouvelle session)
**Tag tâche** : `BO-PROD-DETAIL-404-XXX`
**Branche staging** : à jour avec main (commit `eb6991c7` ou plus récent)

---

## Le bug

`https://verone-backoffice.vercel.app/produits/catalogue/<id>` renvoie **404** en prod (`x-matched-path: /_not-found`, `x-next-error-status: 404`) pour TOUS les product IDs (existants ou non).

**Important** : c'est la SEULE page `/produits/catalogue/[productId]` qui est cassée. Toutes les autres routes dynamiques (factures, commandes, admin, sous-routes catalogue/categories, /collections, etc.) fonctionnent normalement.

Reproduce :

```bash
curl -sI https://verone-backoffice.vercel.app/produits/catalogue/4d587f9b-1b81-4ed2-972c-d3c1ca1421f7 | grep -E "HTTP|x-matched-path"
# HTTP/2 404
# x-matched-path: /_not-found
```

Témoins qui marchent :

```bash
curl -sI https://verone-backoffice.vercel.app/produits/catalogue                       # 200, /produits/catalogue
curl -sI https://verone-backoffice.vercel.app/produits/catalogue/categories/abc        # 200, /produits/catalogue/categories/[categoryId]
curl -sI https://verone-backoffice.vercel.app/factures/abc                             # 200, /factures/[id]
curl -sI https://verone-backoffice.vercel.app/admin/users/abc                          # 200, /admin/users/[id]
```

---

## Investigation déjà menée (ne pas refaire)

### Faits établis

1. **Build local OK** — `pnpm --filter @verone/back-office build` produit la route correctement (`apps/back-office/.next/routes-manifest.json` contient `/produits/catalogue/[productId]`).
2. **Le code source est sain** — aucun import cassé, aucune référence orpheline. Tous les composants enfants (`ProductDetailHeader`, `ProductDescriptionsTab`, `ProductCharacteristicsTab`, etc.) existent.
3. **Bug spécifique à Vercel** — la route est buildée localement mais absente du manifest servi par Vercel.
4. **Bug uniquement sur cette page précise** — toutes les autres routes dynamiques voisines sont OK.
5. **Le bug est silencieux** — aucun warning/error dans les Build Logs Vercel ni Runtime Logs visibles.

### Pistes testées et qui n'ont PAS résolu

| Tentative                                                            | PR                    | Résultat           |
| -------------------------------------------------------------------- | --------------------- | ------------------ |
| Restore `use-product-detail.tsx` à 6b8ab0b8 (last known good)        | #960 (mergée)         | Route toujours 404 |
| Vercel "Redeploy" sans cache                                         | manuel                | Route toujours 404 |
| Cache-bust commentaire dans `page.tsx` (force rebuild de cette page) | #965 (mergée)         | Route toujours 404 |
| Bypass turbo dans vercel.json (`pnpm --filter` direct)               | #971 + #973 (mergées) | Route toujours 404 |

### Pistes invalidées

- Cache turbo persistant : non, redeploy without cache n'a rien changé
- Cause turbo : non, bypass turbo n'a rien changé
- `use-product-detail.tsx` (le hook) : non, le restore l'a fait revenir à un état OK
- Variables Gmail : sujets résolus séparément (PR #962 + #967 — non liés au 404)

---

## Hypothèse principale à tester EN PRIORITÉ

**Le segment `[productId]` au même niveau de tree que 9 dossiers statiques siblings** :

```
apps/back-office/src/app/(protected)/produits/catalogue/
├── [productId]/        ← segment dynamique
├── archived/
├── categories/
├── collections/
├── families/
├── modals/
├── nouveau/
├── stocks/
├── subcategories/
├── variantes/
├── page.tsx            ← /produits/catalogue (liste)
├── CatalogueBulkActionsBar.tsx
├── CatalogueEmptyState.tsx
├── ... (10+ fichiers Catalogue*.tsx)
└── use-catalogue-page.ts
```

Hypothèse : Next.js 15 bug edge case avec segment dynamique + many sibling static folders + many adjacent component files.

### Test 1 — renommer `[productId]` → `[id]` (le plus simple)

```bash
git checkout -b fix/BO-PROD-DETAIL-404-rename-segment
mv "apps/back-office/src/app/(protected)/produits/catalogue/[productId]" "apps/back-office/src/app/(protected)/produits/catalogue/[id]"

# Mettre à jour les utilisations de useParams qui castent en productId
# Chercher : grep -rn "params.productId\|params\.productId" apps/back-office/src/app/\(protected\)/produits/catalogue/\[id\]/
# Remplacer params.productId par params.id

# Tester : pnpm --filter @verone/back-office type-check
# Push, PR, auto-merge
```

Si le rename fix le bug → on a la cause confirmée (problème de naming/parsing Next.js).

### Test 2 — déplacer la route dans un sous-dossier `detail/[id]/`

Si le rename ne résout pas, déplacer dans une nouvelle profondeur :

```
apps/back-office/src/app/(protected)/produits/catalogue/detail/[id]/page.tsx
```

Ça teste si c'est le NIVEAU du segment qui pose problème, pas le nom.

Attention : ça change l'URL publique. Il faudra rediriger `/produits/catalogue/<id>` → `/produits/catalogue/detail/<id>` via `next.config.js` redirects.

### Test 3 — bisect git si tests 1+2 échouent

```bash
git bisect start HEAD 6b8ab0b8       # 6b8ab0b8 = "last known good" (PR #760, 25 avril)
# tester chaque commit en faisant pnpm build et en vérifiant routes-manifest.json
git bisect run sh -c "pnpm --filter @verone/back-office build > /dev/null 2>&1 && grep -q '/produits/catalogue/\[productId\]' apps/back-office/.next/routes-manifest.json && exit 0 || exit 1"
```

Si tous les commits ont la route en local → le bug est purement Vercel-side et il faut creuser leur infrastructure.

### Test 4 — désactivation imports `page.tsx` par dichotomie

Si tout le reste échoue, créer une branche debug qui :

1. Commente la moitié des imports de `page.tsx`
2. Déploie via auto-merge
3. Si la route revient → l'import qui plante est dans la moitié commentée
4. Dichotomie successive jusqu'à isoler

---

## Plan B — Rollback Vercel (si tests ci-dessus échouent)

### Quel déploiement rollback ?

Le bug existe depuis plusieurs jours. Il faut un déploiement assez ancien pour être avant la casse mais qui contienne le maximum de features récentes.

Approche : **bisect prod via Vercel UI** :

1. Aller sur https://vercel.com/verone2021s-projects/verone-back-office/deployments
2. Pour chaque déploiement Production récent (de plus récent au plus ancien) :
   - Cliquer "..." → "Promote to Production"
   - Tester `curl -sI https://verone-backoffice.vercel.app/produits/catalogue/abc | grep matched`
   - Si `/produits/catalogue/[productId]` → c'est notre rollback target
   - Si `/_not-found` → continuer plus en arrière
3. Une fois trouvé : promote ce déploiement.

### Features à RESTAURER après le rollback

Le rollback fait revenir la prod à un déploiement antérieur. Le code reste sur GitHub. Pour faire revenir les features perdues, il suffit de fix le bug 404 puis de laisser le prochain déploiement main inclure tout. Liste des features touchées si rollback > 24h :

| Feature                                            | Tag                         | PR                                                   | Fichiers clés                                                                                                      |
| -------------------------------------------------- | --------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Studio Marketing IA — generation images via Gemini | `BO-MKT-002`                | #958                                                 | `apps/back-office/src/app/(protected)/marketing/studio/...`                                                        |
| Suppression sélecteur marque global                | `BO-BRAND-CLEANUP-001`      | #956                                                 | `apps/back-office/src/components/layout/brand-switcher.tsx` (supprimé), `user_profiles.active_brand_id` (drop SQL) |
| URLs Cloudflare images                             | `BO-IMG-CF-002`             | #954+#955                                            | `apps/back-office/src/lib/cloudflare-images-url.ts`, etc.                                                          |
| INFRA agent coherence (lifecycle mémoires/règles)  | `INFRA-AGENT-COHERENCE-001` | #957                                                 | `.claude/rules/memory-lifecycle.md`, hook PR anti-duplication                                                      |
| Auto-merge by default + zero push between phases   | `BO-INFRA-DX-002`           | #970                                                 | `.claude/rules/workflow.md` ADR-031 + ADR-032                                                                      |
| Gmail env vars dans turbo.json                     | `BO-INFRA-GMAIL-ENV-001`    | #962                                                 | `turbo.json`                                                                                                       |
| CRON + RESEND env vars                             | `BO-INFRA-ENV-VARS-002`     | #967 (peut-être pas mergée encore — voir ci-dessous) | `turbo.json`                                                                                                       |

Toutes les features sont sur GitHub `main`. Le fix du bug 404 + nouveau déploiement = retour automatique de tout. **Aucun travail à refaire**, juste à attendre le nouveau build.

### Procédure rollback détaillée (si activé)

1. Identifier déploiement target via méthode bisect ci-dessus
2. Sur Vercel UI : déploiement target → menu "..." → **Promote to Production**
3. Confirmer le promote. Vercel switche la prod alias `verone-backoffice.vercel.app` vers ce déploiement.
4. Tester immédiatement : `curl -sI .../produits/catalogue/abc` doit renvoyer 200 + `/produits/catalogue/[productId]`
5. Annoncer à Romeo : "prod rollback OK, page produit accessible. Travail sur fix continue."
6. Une fois le fix du bug trouvé et déployé : Vercel auto-promote le nouveau build (mode Staged Production peut imposer un promote manuel — voir `vercel.json` setting `git.deploymentEnabled.main: true`).

---

## État actuel du repo

### Branches

- `staging` à jour avec main (commit `eb6991c7` — merge main into staging à 02:39)
- `main` HEAD = `b31d664` (release PR #974 contenant bypass turbo + ignoreCommand fix — ces deux fixes seront RÉVERTÉS par PR #975 en cours)

### PRs en cours (auto-merge activé)

- **#967** — `[BO-INFRA-ENV-VARS-002]` ajoute CRON*SECRET + RESEND*\* dans `turbo.json` (était DIRTY, j'ai rebasé). Vérifier si auto-merge passe ou s'il y a un nouveau conflit.
- **#975** — `[BO-PROD-DETAIL-404-003]` revert du bypass turbo (retour à `turbo run build`). Important : laisser cette PR merger pour restaurer la baseline turbo.

### Stashs locaux (sur la machine de Romeo)

```
stash@{0}: On staging: scratchpad cleanup — pre BO-HOTFIX-PRODUCT-DETAIL-001
stash@{1}: On staging: dirty state during release merge resolution
```

Aucun n'est essentiel. Peuvent être droppés en début de prochaine session.

### Tasks ouvertes (à nettoyer)

- `#11 [in_progress] Diagnostiquer 500 local productId page` — résolu : 500 local = cache `.next/` cassé (chunk Next.js manquant), pas le même bug que la prod. Mark completed.

---

## Méthodologie recommandée pour la nouvelle session

1. **Lire ce document EN PREMIER.** Tout le contexte est ici.
2. **Vérifier le statut PR #975** (revert turbo). Si pas mergée, attendre + intervenir si conflit.
3. **Vérifier le statut PR #967** (CRON+RESEND). Si conflit, rebaser et auto-merge.
4. **Tester l'hypothèse 1 (rename `[productId]` → `[id]`)** AVANT toute autre action. C'est mon meilleur pari.
5. Si le test 1 échoue : **proposer rollback à Romeo** avec délai estimé (~5 min via Vercel UI, plus 5 min de test).
6. Continuer le diagnostic à froid en parallèle (test 2, 3, 4).

### Règles à respecter (nouvelles, ADR-031 + ADR-032)

- **1 chantier = 1 push final** (pas de push entre phases). Voir `.claude/rules/workflow.md`.
- **Auto-merge à la création de PR** : `gh pr merge <num> --auto --squash --delete-branch` immédiatement après `gh pr create`.
- **Tester localement avant push** : `pnpm --filter @verone/back-office type-check` minimum.
- **Communication français simple, pas de jargon, rapports 5 lignes max.** Voir `.claude/rules/communication-style.md`.

### Pièges connus (sources de perte de temps)

1. **URL prod** = `verone-backoffice.vercel.app` (SANS tiret entre back et office). La doc interne contient les 2 variantes — seule celle-ci existe.
2. **`vercel.json` `ignoreCommand`** — la sémantique est inverse de ce qu'on croit : `exit 0 = SKIP`, `exit 1 = BUILD`. Une faute d'inattention ici a coûté 30 min en cycle (PR #971 → #973).
3. **`vercel.json` `deploymentEnabled.staging: false`** — Vercel ne déploie PAS de Preview pour les branches staging/feature, uniquement main. Donc impossible de tester en preview avant merge main.
4. **Vercel CLI** non authentifié — pas de `vercel login`. Tout doit passer par MCP Playwright sur l'UI Vercel ou via gh + auto-release.
5. **Hook `commit-msg`** rejette les types non-standard (autorisés : feat|fix|chore|docs|refactor|test|style|perf). Pas de "debug:" ou "revert:".
6. **Hook `pre-commit`** sur main bloque les commits directs. Toute modif passe par PR via staging → release auto.
7. **`pnpm dev` interdit à l'agent** — Romeo lance le serveur lui-même. Pour tester en local après modifs, demander à Romeo de relancer ou nettoyer `.next/`.

---

## Liens rapides

- Dashboard Vercel projet : https://vercel.com/verone2021s-projects/verone-back-office/deployments
- Repo GitHub : https://github.com/Verone2021/Verone-V1
- Last known good (page produit OK) : commit `6b8ab0b8` (PR #760, 25 avril 2026)
- Fichier route fautif : `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/page.tsx`
- Fichier hook : `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/hooks/use-product-detail.tsx`

---

## Question ouverte à Romeo

Le code de la page `[productId]` est sain (build local OK). Le bug est exclusivement côté Vercel. Si l'hypothèse 1 (rename) ne fonctionne pas, il faudra peut-être ouvrir un ticket support Vercel avec les détails du déploiement A5Gqgba9q. C'est un cas suffisamment étrange pour mériter un échange avec leur équipe (route absente du manifest sans erreur de build).
