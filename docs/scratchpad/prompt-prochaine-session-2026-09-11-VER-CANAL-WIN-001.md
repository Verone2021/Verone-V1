# Prompt — prochaine session [VER-CANAL-WIN-001] (préparé le 2026-09-11)

> À coller tel quel dans une nouvelle session Claude Code ouverte dans `~/verone-back-office-V1`.
> Aucune valeur secrète ici : les jetons sont dans le Trousseau macOS (noms ci-dessous).

---

[VER-CANAL-WIN-001] — Terminer le canal « want-it-now » : Vérone publie un flux JSON protégé lu par Want It Now.

## 0. Avant toute chose (vérifications, lecture seule)

1. `pwd` = `~/verone-back-office-V1`, `git remote -v` = `Verone2021/Verone-V1`. Sinon ARRÊTE-TOI.
2. MCP Supabase : `get_project_url` doit répondre `https://aorroydfjsrygmosnzrl.supabase.co`. Écris la réponse en
   1re ligne du compte rendu. Le MCP lit `${SUPABASE_ACCESS_TOKEN}` (Trousseau `verone-supabase-access-token`,
   chargé par `~/.zshrc` uniquement dans le dossier Vérone). S'il échoue : utiliser l'API Supabase avec ce jeton
   (lecture via `security find-generic-password -s verone-supabase-access-token -w`, jamais affiché). Ne jamais
   demander de jeton à Roméo.
3. `gh auth status` : dans le dossier Vérone, le compte actif doit être `Verone2021` (le `~/.zshrc` ne charge plus
   les jetons Want It Now hors de `~/want-it-now-V1`). Sinon préfixer les écritures GitHub par
   `GH_TOKEN="$(env -u GITHUB_TOKEN gh auth token -u Verone2021)"`.
4. Lire : `CLAUDE.md`, `.claude/work/ACTIVE.md` (section « EN COURS (2026-09-11) »),
   `docs/scratchpad/dev-plan-2026-09-11-VER-CANAL-WIN-001.md`, et le plan complet
   `~/.claude/plans/encapsulated-shimmying-pearl.md`. Contrat : `~/Documents/Workspace/verone/_inbox/2026-09-10-passation-le-pont-vu-de-want-it-now.md`.
5. Mémoires à respecter : `repo-private-no-branch-protection` (dépôt PRIVÉ sur GitHub Free → aucune protection de
   branche, **jamais d'auto-merge**, vérifier les 4 checks requis à la main), `verone-win-access-separation`.

## 1. État au 2026-09-11 (vérifié)

- Branche `feat/VER-CANAL-WIN-001-flux-want-it-now`, partie de `staging` (`3a39703a`), **5 commits locaux non
  poussés** : `e7ab8ca4` migration · `dfbe354c` types · `5fb336dd` module flux + tests · `1d063c2b` route + réglages ·
  `131c3edb` plan.
- **Migration déjà APPLIQUÉE en production** et inscrite au carnet (`20260911012000`) : `products.is_published_want_it_now`
  (0 produit coché), CHECK `products_style_check` + 4 `style_options` (japandi, moderne organique, méditerranéen,
  mid-century modern), `feed_configs.access_token` facultatif + ligne « Want It Now » (`platform='custom'`, jeton NULL,
  `last_export_at` NULL). **Ne pas la rejouer.**
- Code prêt : `apps/back-office/src/lib/canaux/want-it-now/{feed,token,query}.ts`, tests
  `__tests__/feed.test.ts` (15/15, `npx tsx apps/back-office/src/lib/canaux/want-it-now/__tests__/feed.test.ts`),
  route `apps/back-office/src/app/api/canaux/want-it-now/flux/route.ts`. Type-check back-office : 0 erreur.
- Jeton du flux : généré, dans le Trousseau (`verone-canal-want-it-now-jeton`, libellé « Vérone — jeton flux Want It
  Now ») et dans Vercel `verone-back-office` → `CANAL_WANT_IT_NOW_JETON` (sensible, production + preview).
- Preuves locales faites : route 500 (réglage absent) / 401 (sans en-tête, faux jeton, mauvais schéma), `no-store` ;
  flux réel vide (rien de coché) ; simulation sur 224 produits publiables : sku uniques, 0 photo invalide, 342 Ko,
  seules les clés du contrat, 13 sans fournisseur, 18 indisponibles ; mots « interdits » trouvés = texte de fiches
  (« Marguerite », « généreuse marge » d'un plateau), aucun champ interne.
- Images : `imagedelivery.net`. Sans en-tête `Accept` (robot Want It Now) → `image/jpeg` ou `image/png`, ≤ 440 Ko.
  Avec `Accept: image/avif…` → `image/avif` (refusé par Want It Now). Parade testée si besoin : `…/<id>/format=jpeg`.
- Vercel : projet `verone-back-office` de l'équipe `verone2021s-projects`, branche de production **`main`**,
  adresse **`https://verone-backoffice.vercel.app`**. Ce projet ne fait **aucun déploiement d'aperçu** : la preuve
  HTTPS réelle n'est possible qu'après la mise en ligne staging → main (faite par Roméo).

## 2. À faire en premier : relire les écrans back-office (écrits par un agent, NON enregistrés, NON relus)

L'agent a terminé le 2026-09-11 (rapport : `docs/scratchpad/dev-report-2026-09-11-VER-CANAL-WIN-001-ui.md`) et
annonce type-check 0 erreur, ESLint 0, Prettier OK. Fichiers en attente dans `git status` :

- créés : `produits/catalogue/detail/[id]/_components/WantItNowPublicationCard.tsx` (119 l.),
  `canaux-vente/want-it-now/page.tsx` (224 l.), `canaux-vente/want-it-now/_components/use-want-it-now-channel.ts` (103 l.)
- modifiés : `produits/catalogue/detail/[id]/page.tsx` (+6 l.), `canaux-vente/page.tsx` (carte « Want It Now », icône
  `Zap`), `components/layout/app-sidebar/sidebar-nav-items.ts` (entrée de menu ; fichier déjà > 400 l. avant).

Points à vérifier à la relecture (décisions de l'agent) :

- `use-product-detail.tsx` et `types.ts` non touchés : le hook lit déjà les colonnes (`select('*', …)` préexistant).
- Écran canal : `createClient()` non générique → résultat typé par `as WantItNowProductRow[]` ; vérifier que les
  colonnes du `select` correspondent exactement au type (sinon typer autrement, jamais `as unknown as`).
- `page.tsx` du canal à 224 lignes (composant > 200) : extraire le rendu tableau/carte si la relecture le demande.
- Case : désactivée pour produits d'affilié / d'enseigne / dédiés à un client / prestations, mais toujours
  décochable ; avertissements « sans prix d'achat » et « sans fournisseur ».
- Tester à l'écran (Playwright, 1440 et 1920 ; la fiche produit et `/commandes` sont en responsive obligatoire :
  375/768/1024 aussi) : cocher/décocher sur un produit **puis remettre l'état d'origine** (aucun produit ne doit
  rester coché sans ordre de Roméo), écran canal vide, 0 erreur console.
  Ne jamais `git add -A` : `.husky/post-merge` range des rapports `docs/scratchpad/*.md` (15 suppressions + dossier
  `archive/2026-09/`) qui ne font pas partie du chantier. Préparer fichier par fichier.

## 3. Suite du chantier

1. `pnpm --filter @verone/back-office type-check`, ESLint `--max-warnings=0` + Prettier sur les fichiers touchés,
   test tsx. Pas de `next build` ni `pnpm dev`.
2. Commit(s) des écrans (format `[VER-CANAL-WIN-001] feat: …`).
3. reviewer-agent sur tout le bloc → `docs/scratchpad/review-report-2026-09-11-VER-CANAL-WIN-001.md`.
4. **Un seul push**, PR vers `staging`, **sans fusion automatique** (changement de base) ; attendre les 4 checks
   requis verts (`ESLint + Type-Check + Build`, `DB FK drift check (blocking)`, `E2E Smoke (Playwright — back-office)`,
   `Supabase TS types drift (blocking)`) ; `Supabase security advisors (informational)` est rouge pour une autre
   raison (voir § 5), non bloquant. Fusion seulement sur ordre de Roméo.
5. Mise en ligne staging → main : **Roméo seul** la déclenche.
6. Après mise en ligne, preuves HTTPS (jeton lu depuis le Trousseau, jamais affiché) :
   `curl -s -o /dev/null -w "%{http_code}"` sans jeton → 401 ; avec → 200 ; `jq '.version, .devise, (.produits|length)'` ;
   `jq '[.produits[].sku] | length == (unique|length)'` → true ; une image → `200 image/jpeg|png` < 5 Mo ; vérifier que
   `feed_configs.last_export_at` se remplit.
7. Roméo coche lui-même les premiers produits (quelques dizaines au plus pour le 1er import, cf. § 14 de la passation).

## 4. Compte rendu final (français simple, pour Roméo)

1re ligne : réponse du MCP Supabase. Puis : compte `gh` actif ; SHA du WIP BO-AUDIT-005 `cc10edae` (branche
`fix/BO-AUDIT-005-ecritures-db-impossibles`, jamais poussée, commit fait en `--no-verify` sur ordre de Roméo) ; départ
de la branche canal `e6e0e31c` (avancée ensuite sur `8d9dadfd` puis `3a39703a`) ; sauvegarde
`~/verone-backups/2026-09-10-avant-ver-canal-win-001.bundle` (vérifiée, 220 Mo) ; équipe Vercel `verone2021s-projects`,
production `main` ; Content-Type réel des images ; adresse du flux ; hôte `imagedelivery.net` ; remise du jeton =
Trousseau (jamais écrit) ; et les 3 valeurs à poser côté Want It Now (par Roméo, pas par l'agent) :

- `FOURNISSEUR_FLUX_URL` = `https://verone-backoffice.vercel.app/api/canaux/want-it-now/flux`
- `FOURNISSEUR_FLUX_JETON` = valeur de l'entrée Trousseau « Vérone — jeton flux Want It Now »
- `FOURNISSEUR_IMAGES_HOTES` = `imagedelivery.net`
  Nommer honnêtement les preuves non atteintes (pas de moteur Want It Now ni de base locale sur la machine).

## 5. Points ouverts à signaler (ne pas traiter sans ordre de Roméo)

- 🔴 Sécurité base : 17 fonctions `SECURITY DEFINER` de plus exécutables par `anon` (332 contre 315 en référence,
  dernier vert le 2026-08-24). Lot dédié, lecture seule d'abord.
- Compte Supabase : vérification en deux étapes désactivée (Roméo, téléphone requis).
- Règle `.claude/rules/workflow.md` (ADR-032, auto-merge) à mettre à jour dans une PR dédiée : incompatible avec un
  dépôt privé sur GitHub Free.
- À la reprise de BO-AUDIT-005 : `apps/back-office/src/middleware.ts:87` utilise `console.log` (no-console).
- `apps/back-office/src/types/supabase.d.ts` est une copie de types abandonnée (le code utilise `@verone/types`).
- `.husky/post-merge` : lignes dépréciées signalées par husky (casseront en v10).
- Styles : l'affichage en lecture d'un nouveau style montre sa valeur brute (le sélecteur, lui, lit `style_options`).

## Ne fait pas

Rien dans le dépôt ni la base Want It Now · pas de push de `fix/BO-AUDIT-005-…` · pas de stash/reset/suppression de
branche · pas de réécriture d'historique · aucune donnée métier modifiée · aucun produit coché à la place de Roméo ·
aucun prix de cession / de vente / de marge dans le flux.
