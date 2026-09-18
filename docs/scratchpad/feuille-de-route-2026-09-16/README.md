# Feuille de route back-office Vérone — 2026-09-16

**Ce dossier remplace** `docs/scratchpad/audit-2026-09-12/PROGRAMME-2026-09-12.md` (périmé depuis le 14/09) comme source de
l'ordre des sessions. L'**état** vit dans `.claude/work/ACTIVE.md`, section « FEUILLE DE ROUTE 2026-09-16 ». Une session =
un fichier `session-XX-*.md` = un prompt à coller tel quel dans Claude Code = une PR. Après chaque session : compte rendu dans
`~/Documents/Workspace/verone/_inbox/`, colonne « État » d'ACTIVE.md mise à jour.

Écrit par Claude Cowork à partir de ses mesures (11/09 → 15/09) et des comptes rendus Claude Code. Compte rendu de référence :
`~/Documents/Workspace/verone/_outputs/verone/audit-back-office-2026-09-11/compte-rendu-etat-back-office-2026-09-15.md`.

## Préambule commun — à coller en tête de CHAQUE prompt

```
═══ PRÉAMBULE — LECTURE SEULE, RÉSULTATS EN TÊTE DU COMPTE RENDU ═══
V1. `pwd` = ~/verone-back-office-V1 et `git remote -v` = Verone2021/Verone-V1. Sinon ARRÊTE-TOI.
V2. `git branch --show-current`, `git status --short | wc -l`, `git log --oneline -3 origin/main origin/staging`. Note, ne touche à rien.
V3. `gh auth status` : compte actif `Verone2021`, sinon préfixe chaque écriture GitHub par
    GH_TOKEN="$(env -u GITHUB_TOKEN gh auth token -u Verone2021)" et dis-le.
V4. MCP Supabase : `get_project_url` = https://aorroydfjsrygmosnzrl.supabase.co. Sinon ARRÊTE-TOI.
V5. Un appel trivial par MCP déclaré, tableau OK / KO.
V6. `ls -l` sur chaque fichier cité, date notée. Fichier manquant = signalé, jamais recréé.
V7. Base = PRODUCTION, deux salariés. Lecture seule sauf « accord donné » écrit par Roméo dans le chat ; migration
    append-only via execute_sql, jamais `supabase db push` ; jamais `git add -A` ; jamais `gh pr merge --admin` ;
    PR vers staging ; fusion et release UNIQUEMENT sur ordre écrit de Roméo ; écritures écran uniquement sur le
    produit TEST (PRD-0314), remis à l'identique ; ne jamais lancer ni couper les serveurs de Roméo.
V8. **Jamais de release, de migration ni de requête lourde sur `pg_stat_statements` / `information_schema` entre
    07 h et 17 h UTC un jour ouvré** (incident du 15/09). Le soir ou le week-end. Une relance max par contrôle CI.
V9. État attendu : ACTIVE.md section « FEUILLE DE ROUTE 2026-09-16 » ; dis ce qui diffère.
```

## Ordre des sessions

| #   | Fichier                                           | Objet                                                                                                                                                                                                         | Base              | Durée                                            |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------ |
| 00  | `session-00-mesure-et-equerre.md`                 | Mesure production du 16/09 (preuve du menu), cause des timeouts `linkme_orders_enriched`, remise d'équerre PROGRAMME/ACTIVE                                                                                   | non               | 1 h                                              |
| 01  | `session-01-audit-complet.md`                     | **AUDIT COMPLET** : performance à 100 %, sécurité, scalabilité — mesures, notes sur 100, plan chiffré                                                                                                         | non               | 1 session                                        |
| 02  | `session-02-perf-requetes-lentes.md`              | Les corrections de requêtes issues de 01 (`linkme_orders_enriched`, `get_site_internet_products`, alertes stock, Inventaire)                                                                                  | selon 01          | 1-2 sessions                                     |
| 03  | `session-03-s4-ci-hors-production.md`             | CI de dérive hors prod, build des 3 apps sous 20 min, secret E2E                                                                                                                                              | non               | 1 session                                        |
| 04  | `session-04-temps-reel.md`                        | Réduire ou couper Supabase Realtime (60 % du temps base)                                                                                                                                                      | oui (publication) | 1 session                                        |
| 05  | `session-05-s2-routes-api.md`                     | Contrôle central des routes API en 3 temps (90/152 sans garde)                                                                                                                                                | non               | 3 sessions                                       |
| 06  | `session-06-p11-p12-consultations.md`             | Écran consultation projet par fournisseur + PDF                                                                                                                                                               | non               | **PÉRIMÉE le 18/09 — livrée par #1169 et #1171** |
| 07  | `session-07-securite-tables-anon-et-lots-8-11.md` | 98 tables encore SELECT anon, lots 8-11 régénérés, gardes affiliés                                                                                                                                            | accord            | 2 sessions                                       |
| 08  | `session-08-p14-notation-fournisseur.md`          | Notation fournisseur 4 critères par événement                                                                                                                                                                 | accord            | 1 session                                        |
| 09  | `session-09-p6-menage-sourcing.md`                | Ménage sourcing (~4 000 lignes, 13 fonctions, contraction des statuts)                                                                                                                                        | accord            | 1 session                                        |
| 10  | `session-10-scalabilite.md`                       | Baseline SQL des 62 tables, une copie des types, Sentry, rétention journaux                                                                                                                                   | accord            | 3 sessions                                       |
| —   | déjà prêts ailleurs                               | `prompt-2026-09-15-BO-SOURCING-VALIDATION-001.md` · `dev-plan-2026-09-16-SITE-CATALOGUE-FILTRES-001.md` · `dev-plan-2026-09-16-BO-PRODUCTS-LIST-MARGIN-001.md` · WIN-001 (test Roméo) · WIN-002 (3 décisions) |                   |                                                  |

Ordre recommandé : 00 → 01 → 02 → 03 → 04 → 05 → A/B → 07 → 08 → 09 → 10.
(VALIDATION-001 traitée le 16/09, session 06 périmée le 18/09 — l'état à jour est dans `.claude/work/ACTIVE.md`.)

## Décisions de Roméo en attente (bloquent la session indiquée)

- Données de test PRD-0314 / PO-2026-00039 : garder ou supprimer (09).
- Test Want It Now en local puis push ; 3 questions v2.1 (WIN-001/002).
- Port des commandes fournisseurs dans la marge : exclu ou réparti (PROFIT).
- Instance Supabase : montée de gamme si 01 le justifie (01 → 02).
- Welyb envoi réel, Pokawa 5+5, Black & White Burger, 2FA Supabase.
