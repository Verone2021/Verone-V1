# Audit back-office Vérone — 2026-07-30

Point d'entrée. **Lire ce fichier en premier**, puis `PLAN-CORRECTION.md`.

## Ce dossier contient

| Fichier              | Quoi                                                                                                 | Quand le lire                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `PLAN-CORRECTION.md` | La méthode, les 9 lots, les critères de sortie, la trajectoire de note                               | **Toujours**, au début de chaque session de correction |
| `FINDINGS.md`        | Les ~90 défauts avec `fichier:ligne`, groupés par lot                                                | La section du lot en cours, uniquement                 |
| `AUDIT.md`           | Le rapport d'origine : note 22/100, méthode, mesures, ce qui est bien fait                           | Pour comprendre le contexte, une fois                  |
| `PLAN-TESTS.md`      | La stratégie de test, les 8 parcours Playwright, et pourquoi ils viennent en Lot 7 et pas en premier | Aux lots 6 et 7                                        |

## ⚠ Deux clics à faire avant tout le reste

**1. Passer le repo GitHub en privé.** `Verone2021/Verone-V1` est public, et son historique contient depuis le **2026-01-15** trois fichiers `.env.local.backup-*` (419 lignes) avec la `service_role` Supabase, la clé Qonto, le PAT GitHub et le token Vercel. Supprimés le 2026-01-20 par le commit `b07283b7` — ce qui ne les retire pas de l'historique. Passer le repo en privé ferme ce vecteur en un clic, sans rien couper.

**2. Révoquer le PAT Supabase** (Dashboard → Account → Access Tokens). Il est actuellement en service _et_ présent dans 6 commits publics, et sa portée est le compte Supabase entier — y compris les projets Affect et Want It Now qui n'existent pas encore. Un clic, aucune coupure, aucun redéploiement.

**La rotation des autres clés est au Lot 9, en fin de parcours** — c'est le seul lot qui peut interrompre le travail des salariés, et il n'apporte rien fonctionnellement. Détail dans `FINDINGS.md` § Lot 0 et `PLAN-CORRECTION.md` § Lot 0 et Lot 9.

---

## Le résumé en dix lignes

Note **22 / 100** au 2026-07-30. Sécurité 17, stabilité fonctionnelle 24, performance 22, scalabilité 28, qualité et tests 20.

Trois causes racines expliquent presque tout :

1. **Aucun `middleware.ts` dans le back-office.** `src/app/api` est un frère de `src/app/(protected)` : le layout qui vérifie le rôle ne s'y applique jamais. 86 routes sur 151 répondent sans authentification, dont `/api/qonto/balance`, `/transactions` et `/clients`.
2. **Les erreurs ne remontent jamais à l'écran.** `const { data } = await supabase...` sans lire `error`, `catch { console.error }` sans toast, `void ...catch(() => undefined)`. Une erreur est indiscernable d'un résultat vide.
3. **Les droits sont relus en base à chaque ligne.** `is_backoffice_user()` non wrappée dans 216 policies → 255 941 505 scans séquentiels sur une table de 9 lignes.

Et un constat qui commande l'ordre des travaux : **tout l'outillage qui aurait détecté ces défauts existe déjà et est débranché.** Les trois jobs E2E sont désactivés en dur (`if: false &&`), la baseline advisors accepte 315 fonctions exposées à `anon`, et `validate:types` — qui aurait attrapé à lui seul trois des douze bugs bloquants — ne tourne nulle part.

## Ordre d'attaque

```
Lot 0    Repo en privé + PAT Supabase       20 min  2 clics, aucune coupure
Lot 0bis .gitignore en globs                10 min  empêche la prochaine fuite
Lot 1    Le mur, en 3 temps                 4-5 j   Qonto seul → observation → activation
Lot 2    Rebrancher les gates CI            1-2 j   ← AVANT toute correction de bug
Lot 3    Erreurs visibles                   2-3 j   Sentry + toast unique + helper
Lot 4    Performance                        2-3 j   rôle dans le JWT, cache Next, barrels
Lot 5    Bugs bloquants                     1 sem   1 PR par bug, test de régression d'abord
Lot 6    Socle de test                      1 sem   baseline SQL, branche Supabase, seed
Lot 7    Playwright ciblé                   6 h     les 8 parcours qui exigent un vrai clic
Lot 8    Architecture                       mois 2-3
Lot 9    Rotation des clés + purge git      1 soir  ← en DERNIER, seul lot qui coupe
```

Deux choix d'ordre à comprendre :

**Le Lot 2 avant le Lot 5** est contre-intuitif mais non négociable : sans gates, les corrections seront défaites une par une par les merges suivants. Le repo en a déjà fait l'expérience — l'ADR-016 note « 30+ régressions concrètes en production alors que la CI était verte ».

**Le Lot 9 en dernier**, et non en premier comme le voudrait une lecture naïve de la sécurité. La rotation des clés est le seul lot dont chaque étape peut interrompre le travail des deux salariés qui utilisent l'application tous les jours, et elle n'apporte aucune amélioration fonctionnelle. Une fois le repo passé en privé (Lot 0, un clic), le vecteur d'exposition est fermé et l'urgence retombe. Arbitrage Roméo du 2026-07-30, intégré au plan.

**Aucun lot ne touche à la configuration Qonto.** La clé `QONTO_API_KEY` et l'intégration ne sont modifiées qu'au Lot 9, et seulement pour changer la valeur de la clé. Ce que le Lot 1 ajoute est un contrôle de la session _du salarié vers le back-office_ — le cookie déjà présent dans son navigateur — pas une authentification supplémentaire vers Qonto.

## En-tête de session pour Claude Code

```
Lis dans cet ordre : CLAUDE.md racine, apps/back-office/CLAUDE.md,
docs/audit-2026-07-30/PLAN-CORRECTION.md, docs/audit-2026-07-30/FINDINGS.md
(section du lot concerné uniquement), .claude/work/ACTIVE.md.

Applique .claude/rules/non-regression.md sur chaque modification.

Je travaille sur le Lot <n>. Confirme-moi en 5 lignes son objectif et son critère
de sortie avant d'écrire une ligne de code, puis propose ton plan et attends ma
validation.

PR vers staging uniquement. Aucun commit ni push sans mon ordre explicite.
Aucune migration appliquée sans mon accord. `supabase db push` interdit
(utiliser execute_sql).
```

## Conditions de l'audit

Analyse statique du monorepo (3 169 fichiers TS/TSX, 588 068 lignes), lecture de code sur 6 axes, mesures réelles sur la base `verone-backoffice` (`pg_stat_user_tables`, `EXPLAIN ANALYZE`, advisors Supabase), lecture de `.github/workflows/`, `.claude/rules/`, `.claude/DECISIONS.md` et des 770 migrations.

**Aucune écriture sur la base. Aucun fichier du dépôt modifié**, hors la création de ce dossier et l'ajout d'une section à `.claude/work/ACTIVE.md` (fichier gitignored, local).

Chaque finding a été vérifié par lecture du code ou par mesure. Aucun n'est déduit. Si l'un se révèle faux à l'usage, le signaler dans `FINDINGS.md` plutôt que de le contourner en silence.
