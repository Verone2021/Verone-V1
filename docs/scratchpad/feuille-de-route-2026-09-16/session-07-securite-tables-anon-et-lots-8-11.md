# Session 07 — Sécurité base, suite : 98 tables encore SELECT `anon`, lots 8-11, gardes affiliés

Accord écrit par lot. Chaque lot = migration montrée, essai en `BEGIN … ROLLBACK`, application hors heures, PR.

```
[PRÉAMBULE V1→V9 du README]

═══ LECTURE ═══
  docs/scratchpad/audit-2026-09-16/AUDIT-COMPLET-2026-09-16.md, partie 3.2
  docs/scratchpad/bloc-S-drafts-2026-09-15/ et docs/scratchpad/reste-a-faire-2026-09-15.md (brouillons NON applicables :
  corps de fonctions finance tronqués, empreinte stock à refaire — à régénérer depuis la production)
  docs/scratchpad/audit-2026-09-11/sessions/session-1-fonctions-exposees-anon.md
  .claude/rules/database.md, .claude/rules/stock-triggers-protected.md

═══ LOT T — tables encore ouvertes à anon (98 le 15/09) ═══
T1. Liste `information_schema.role_table_grants` pour `anon` (SELECT/INSERT/UPDATE/DELETE) ; pour chaque table : lue
    par le site ou LinkMe sans session ? (grep + `pg_stat_statements` par rôle + logs 7 jours). Trois colonnes :
    publiques voulues (`products`, `product_images`, `linkme_public_products`, `collections`, `articles`… — à prouver),
    jamais lues sans session, incertaines.
T2. Migration REVOKE sur « jamais lues » ; « incertaines » en observation (journal des appels anon sur 7 jours) avant
    décision. Preuves : site 200 sur 10 pages, LinkMe 200 + 2 sélections `/s/…`, salarié connecté inchangé.

═══ LOTS 8-11 (bloc S), régénérés ═══
S8. Fonctions SECURITY INVOKER exécutables par anon (251 le 15/09) : triggers (aucune raison d'être appelables),
    actions métier, lectures. REVOKE par lot avec les mêmes preuves qu'aux lots 1-7.
S9. Fonctions finance et stock sensibles ouvertes aux `authenticated` sans garde owner/admin (`reset_*`, `delete_*`,
    `mark_*_paid`, resynchronisation stock) : garde en tête de fonction sur le modèle de `reset_finance_auto_data`,
    corps régénéré depuis `pg_get_functiondef` en production (jamais depuis les brouillons tronqués), empreinte
    avant/après du comportement stock en rôle salarié (`stock-fingerprint`), essai annulé.
S10. Affiliés LinkMe connectés : quelles fonctions leur sont accessibles (rôle `authenticated` + app linkme) et
     lesquelles ne devraient pas ; garde app + rôle.
S11. Garde-fou permanent : contrôle CI qui échoue si une fonction ou une table s'ouvre à `anon` (baseline à 0 hors liste
     blanche) ; ALTER DEFAULT PRIVILEGES déjà posé — vérifier qu'il couvre `supabase_admin` aussi.
Compte rendu par lot, ACTIVE.md.
```
