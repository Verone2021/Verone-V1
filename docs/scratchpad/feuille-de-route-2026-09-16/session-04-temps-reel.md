# Session 04 — Temps réel Supabase : réduire ou couper (60 % du temps base)

Base : la publication `supabase_realtime` (accord). Une PR côté code.

```
[PRÉAMBULE V1→V9 du README]

═══ LECTURE ═══
  docs/scratchpad/audit-2026-09-16/AUDIT-COMPLET-2026-09-16.md, partie 1.3
  docs/scratchpad/audit-2026-09-11/RAPPORT-CLAUDE-CODE-2026-09-11.md, § 2 cause 1
  packages/@verone/notifications/src/hooks/** (canaux restants), packages/@verone/utils/query

═══ MISSION ═══
R1. Inventaire : chaque `.channel(` du monorepo (3 apps + packages) → table visée, publiée ou non, événement, ce que le
    salarié y gagne (une pastille ? une liste qui se rafraîchit ?), nombre d'onglets typiquement ouverts.
R2. Mesure : part Realtime dans `pg_stat_statements` sur la fenêtre neuve (audit 1.1), max des appels WAL, nombre
    d'abonnements moyen (`realtime.subscription`, échantillonné 5 fois en journée par Roméo ou via logs).
R3. Décision à présenter à Roméo, chiffrée : (a) couper Realtime (publication vide, `removeChannel` partout,
    rafraîchissement à l'action + retour d'onglet — déjà le modèle S3) ; (b) garder 2 tables (`products`,
    `sales_orders`) et supprimer tout le reste ; (c) statu quo. Recommandation Cowork : (a) sauf preuve qu'un canal
    évite un vrai va-et-vient aux salariés.
R4. Après « OK R » de Roméo : code (suppression des canaux, invalidation à l'action là où elle manque), puis migration
    de la publication (`ALTER PUBLICATION supabase_realtime DROP TABLE …`, accord), PR, preuves : 0 `.channel(` hors
    exceptions validées, part Realtime dans `pg_stat_statements` 24 h après release, compteurs identiques.
Compte rendu, ACTIVE.md.
```
