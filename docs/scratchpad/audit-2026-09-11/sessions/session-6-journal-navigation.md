# Session 6 — Journal de navigation · Bloc A

Durée : 1-2 h. Touche la base : **non** (code seulement). **Décision de Roméo requise sur l'usage.**
Ex-« Session 1 » de `PROMPTS-2026-09-11.md`.

## Ce qui est déjà mesuré — le diagnostic de l'ancienne étape 1 est fait (rapport § 1, § 3 A)

| Question d'origine                          | Réponse mesurée                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a) Qui lit la table ?                       | Admin « Activité utilisateurs » ; onglet Activité d'une fiche utilisateur ; fiche utilisateur LinkMe ; tableau de bord LinkMe (10 dernières actions) ; encart notifications du tableau de bord (**en panne** : demande `user_profiles.role`, colonne inexistante). Tous ≤ 30 jours. RPC associées : < 2 000 appels en 1 an. Aucun export. |
| b) Écriture dans le chemin du rendu ?       | **Non.** File d'attente, INSERT groupé toutes les 60 s ou par 50 événements (`use-user-activity-tracker.ts:59-60`), page vue différée.                                                                                                                                                                                                    |
| c) Purge ou rétention ?                     | **Aucune.**                                                                                                                                                                                                                                                                                                                               |
| d) Index ou trigger qui expliquent 107 ms ? | 6 index + trigger `update_user_session` (UPSERT dans `user_sessions`). Mais min 0,34 ms / moyenne 107 / max 7 981 : la moyenne est faite d'**attentes** de l'instance, pas du coût de l'écriture.                                                                                                                                         |

Volume : 20 035 lignes en novembre 2025, **81 en août 2026**, 948 au 11 septembre. 106 Mo d'historique.
Coût caché restant : un `supabase.auth.getUser()` (aller-retour réseau) à chaque envoi groupé.

## Ce qui change par rapport au prompt d'origine

| Prompt d'origine                                    | Correction                                  | Pourquoi                        |
| --------------------------------------------------- | ------------------------------------------- | ------------------------------- |
| « 107 ms sur chaque page, dans le chemin du rendu » | faux : hors rendu, envoi groupé par minute  | code relu + volumes mesurés     |
| Option « sortir l'écriture du chemin de rendu »     | **déjà le cas** ; remplacée par « alléger » | l'option n'a plus d'objet       |
| Étape 1 diagnostic                                  | faite ; la session la **vérifie** seulement | évite de refaire 1 h de travail |

## Prompt à coller

```
Dossier : ~/verone-back-office-V1

## Vérifications d'ouverture, lecture seule
1. `pwd` et `git remote -v` = Verone2021/Verone-V1. Sinon ARRÊTE-TOI.
2. MCP Supabase `get_project_url` = https://aorroydfjsrygmosnzrl.supabase.co. Sinon ARRÊTE-TOI.
3. `git status` et `git branch --show-current` : dis-moi l'état, ne touche à rien.

## Lecture
  docs/scratchpad/audit-2026-09-11/sessions/session-6-journal-navigation.md
  docs/scratchpad/audit-perf-scal-2026-09-11/mesures-performance-complements.md (§ 2)
  docs/scratchpad/audit-2026-09-11/RAPPORT-CLAUDE-CODE-2026-09-11.md (§ 3 A, § 5 c)
  .claude/rules/non-regression.md

## Mission : Bloc A — le journal de navigation

ÉTAPE 1 — vérifie en 15 minutes, lecture seule, les 4 réponses déjà mesurées
(lecteurs, écriture hors rendu, absence de purge, trigger + index) et le volume
mensuel. Signale tout écart.

ÉTAPE 2 — propose deux options chiffrées, avec leur retour arrière :
  A) ALLÉGER : supprimer le getUser() réseau à chaque envoi (utilisateur déjà
     connu du contexte) ; ne plus enregistrer les clics (user_click), garder les
     pages vues et les erreurs JavaScript ; les écrans admin et LinkMe continuent
     de fonctionner. Chiffre : appels /auth/v1/user et POST user_activity_logs
     économisés par jour (query_logs).
  B) ARRÊTER : ne plus monter le traceur. Liste précise des écrans qui se vident
     (admin Activité utilisateurs, onglet Activité, fiche LinkMe, tableau de bord
     LinkMe).
Signale aussi, sans le corriger, l'encart notifications du tableau de bord qui
lit user_profiles.role (colonne inexistante).
Attends ma décision.

ÉTAPE 3 — implémente l'option que j'ai choisie. Une seule. Branche depuis staging,
un seul push, PR vers staging sans fusion automatique, 4 contrôles vérifiés à la main.

La rétention des 123 575 lignes existantes n'est PAS dans cette session : c'est
une décision que je prendrai à part.

INTERDITS : aucune suppression de ligne, aucune migration, aucune donnée de test,
aucun commit ni push sans mon ordre, `supabase db push` interdit.
```

## Retour arrière

Revert de la PR : le traceur revient à l'identique.
