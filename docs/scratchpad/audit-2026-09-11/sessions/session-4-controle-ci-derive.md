# Session 4 — Le contrôle CI de dérive qui charge la base de production · NOUVEAU

Durée : 1-2 h. Touche la base : **non** (lecture seule pour comparer). Issue du rapport du 2026-09-11.

## Ce qui est mesuré (rapport § 2 cause 3, [C18] [C33])

- `scripts/db-drift-check.py` (l.~205) lit `information_schema.table_constraints ⋈ key_column_usage ⋈
constraint_column_usage` sur la **base de production** (`SUPABASE_DB_URL`).
- Lancé par `.github/workflows/quality.yml:722-744` sur **chaque** `pull_request` vers `main`, `staging`,
  `integration/*`, et par `.github/workflows/db-drift-cron.yml` le lundi à 06:00 UTC.
- `pg_stat_statements` : **809 exécutions** (+76 d'une variante), **moyenne 5,5 s, max 40,3 s,
  4,24 millions de blocs lus par exécution**, sur une instance de 224 Mo de cache.
- Pendant ces secondes, des instructions triviales de toute l'application attendent (rapport § 2).
- `scripts/generate-docs.py` contient la même lecture (usage local).

## Prompt à coller

```
Dossier : ~/verone-back-office-V1

## Vérifications d'ouverture, lecture seule
1. `pwd` et `git remote -v` = Verone2021/Verone-V1. Sinon ARRÊTE-TOI.
2. MCP Supabase `get_project_url` = https://aorroydfjsrygmosnzrl.supabase.co. Sinon ARRÊTE-TOI.
3. `git status` et `git branch --show-current` : dis-moi l'état, ne touche à rien.

## Lecture
  docs/scratchpad/audit-2026-09-11/sessions/session-4-controle-ci-derive.md
  docs/scratchpad/audit-2026-09-11/RAPPORT-CLAUDE-CODE-2026-09-11.md (§ 2 cause 3, annexe C18, C33)
  scripts/db-drift-check.py, .github/workflows/quality.yml (job db-drift-check),
  .github/workflows/db-drift-cron.yml, .claude/DECISIONS.md (ADR-018)

## Mission : que le contrôle de dérive des clés étrangères ne ralentisse plus la production

Mesuré : la requête du contrôle tourne sur la base de production à chaque PR,
5,5 s en moyenne, 40 s au pire, 4,2 millions de blocs lus par exécution.

ÉTAPE 1 — lecture seule :
  a) relevé pg_stat_statements de la requête (calls, mean, max, blocs) : référence ;
  b) écris l'équivalent en pg_catalog (pg_constraint, pg_attribute, pg_class,
     pg_namespace) qui produit EXACTEMENT le même résultat ;
  c) exécute les deux en lecture seule et compare ligne à ligne (même nombre de
     lignes, mêmes valeurs, même tri). Donne EXPLAIN ANALYZE des deux.
  Si les résultats diffèrent, ARRÊTE-TOI et montre-moi l'écart.

ÉTAPE 2 — propose le changement AVANT de l'écrire :
  - remplacer la requête dans scripts/db-drift-check.py (et generate-docs.py) ;
  - option complémentaire : ne lancer le job que sur les PR qui touchent
    supabase/migrations/** (le job reste bloquant quand il tourne). Dis-moi ce que
    cette option ferait perdre (ADR-018) avant de la proposer.

ÉTAPE 3 — après accord : modification, test local du script en mode --ci contre
la base (lecture seule), sortie identique à avant. Branche depuis staging, un seul
push, PR vers staging sans fusion automatique, 4 contrôles vérifiés à la main.

Preuve de gain après fusion : pg_stat_statements par différence de relevés,
moyenne 5 510 ms → moins de 200 ms, blocs 4,24 M → moins de 20 000.

INTERDITS : aucune écriture en base, aucune donnée de test, aucun commit ni push
sans mon ordre, ne pas désactiver le contrôle.
```

## Retour arrière

Revert de la PR : le script d'origine revient tel quel.
