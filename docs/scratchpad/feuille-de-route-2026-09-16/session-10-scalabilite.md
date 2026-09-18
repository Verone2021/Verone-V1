# Session 10 — Scalabilité et stabilité : base reconstructible, types uniques, Sentry, rétention

Trois sessions (10a, 10b, 10c). Accord base pour 10a et 10c.

```
[PRÉAMBULE V1→V9 du README]

═══ LECTURE ═══
  docs/scratchpad/audit-2026-09-16/AUDIT-COMPLET-2026-09-16.md, partie 4
  docs/audit-2026-07-30/FINDINGS.md (lot BO-AUDIT-009 socle de test, BO-AUDIT-006 Sentry, BO-AUDIT-011 architecture)
  .claude/rules/database.md, .claude/rules/workflow.md

═══ 10a — BASELINE SQL ET BRANCHE SUPABASE (accord) ═══
- Export du schéma de production (`pg_dump --schema-only`, hors données) → `supabase/baseline/2026-09-XX.sql` ; les 418
  fichiers à l'ancien format sont archivés (déplacés, jamais supprimés) ; nouvelle numérotation à partir de la baseline.
- Preuve : une branche Supabase (ou un projet vide) démarre depuis la baseline + les migrations postérieures, sans
  erreur, et `db-drift-check` la compare à la prod : 0 écart. Aucune modification de la prod.
- Décision Roméo : coût d'une branche Supabase / d'un projet de test (plan payant ?) avant de commencer.

═══ 10b — UNE SEULE COPIE DES TYPES + HYGIÈNE (sans base) ═══
- Un seul `packages/@verone/types/src/supabase.ts` généré ; suppression des copies mortes (3 sur 7) ; imports corrigés ;
  contrôle CI `supabase-types-drift` conservé.
- Fichiers > 400 lignes : compte, découpe des 10 plus gros dans les modules touchés récemment (catalogue `page.tsx`
  406 l., fiche sourcing).
- `select('*')` restants : liste et remplacement par colonnes explicites sur les 10 requêtes les plus appelées.

═══ 10c — VISIBILITÉ ET RÉTENTION (accord) ═══
- Sentry : DSN présent, zéro code → brancher sur les 3 apps (erreurs serveur et client), un tableau de bord, une alerte
  sur 5xx > 10/h. Test : une erreur volontaire en local remonte.
- Postgres : `log_min_duration_statement = 2000` (accord) pour enfin dater les requêtes lentes ; revue une semaine après.
- Rétention `user_activity_logs` (123 k lignes, 106 Mo) et `audit_logs` (92 k, 76 Mo) : proposition (ex. 90 jours
  glissants, purge hebdo hors heures) chiffrée, décision Roméo, export avant purge.
Compte rendu par session, ACTIVE.md.
```
