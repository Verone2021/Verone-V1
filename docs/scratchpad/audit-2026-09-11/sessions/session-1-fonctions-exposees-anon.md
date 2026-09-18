# Session 1 — Fonctions ouvertes au public (`anon`) · Bloc H · SÉCURITÉ

Durée : 2-3 h. Touche la base : **oui, accord écrit de Roméo avant toute migration**.
Ex-« Session 4 » de `PROMPTS-2026-09-11.md`.

## Ce qui est déjà mesuré (rapport § 1, § 3 H, commande [C17])

- **332** fonctions `SECURITY DEFINER` de `public` exécutables par `anon`, dont **108 de type trigger**.
- **571 fonctions sur 574** de `public` exécutables par `anon` (le `GRANT EXECUTE … TO PUBLIC` par défaut de Postgres).
- `reset_finance_auto_data(boolean)` : exécutable par `anon` **et par `authenticated`**. Les affiliés LinkMe
  sont des comptes `authenticated` : ils peuvent l'appeler aussi. Retirer seulement `anon` ne suffit pas.
- Contrôle CI « Supabase security advisors » : 315 dans la baseline, 332 aujourd'hui.

## Ce qui change par rapport au prompt d'origine

| Prompt d'origine                                                       | Correction                                                                                                                                          | Pourquoi                                                                                     |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| « `REVOKE` pour `anon` »                                               | `REVOKE … FROM PUBLIC, anon` **et** examiner `authenticated` pour les fonctions d'administration                                                    | droit hérité de `PUBLIC` ; `reset_finance_auto_data` ouverte aussi à `authenticated` [C17]   |
| « vérifie chaque nom contre les appels réels dans apps/ et packages/ » | **ajouter** la preuve d'usage réel : les RPC appelées par le rôle `anon` dans `pg_stat_statements` sur 1 an (site internet, pages publiques LinkMe) | un appel peut venir d'une Edge Function, d'un cron ou d'un site ; le code seul ne suffit pas |
| « fonctions de TRIGGER : aucune raison d'être appelables »             | à confirmer **sur une copie** : retirer `EXECUTE` à `PUBLIC` sur une fonction trigger ne doit pas empêcher le trigger de s'exécuter                 | ne pas présumer du comportement de Postgres sur la production                                |

## Prompt à coller

```
Dossier : ~/verone-back-office-V1

## Vérifications d'ouverture, lecture seule
1. `pwd` et `git remote -v` = Verone2021/Verone-V1. Sinon ARRÊTE-TOI.
2. MCP Supabase `get_project_url` = https://aorroydfjsrygmosnzrl.supabase.co. Sinon ARRÊTE-TOI.
3. `git status` et `git branch --show-current` : dis-moi l'état, ne touche à rien.

## Lecture
  docs/scratchpad/audit-2026-09-11/RAPPORT-CLAUDE-CODE-2026-09-11.md (§ 1, § 3 H, annexe C17)
  docs/scratchpad/audit-2026-09-11/sessions/session-1-fonctions-exposees-anon.md
  .claude/rules/database.md, .claude/rules/workflow.md, .claude/rules/non-regression.md
Shell : utilise /usr/bin/grep (le grep de ce poste ignore les fichiers gitignorés).

## Mission : Bloc H — fermer les fonctions ouvertes au public

Mesuré le 2026-09-11 : 332 fonctions SECURITY DEFINER exécutables par `anon`
(108 de type trigger), 571/574 fonctions de `public` exécutables par `anon`.
`reset_finance_auto_data(boolean)` (DELETE FROM organisations, désactive les règles
de rapprochement) est exécutable par `anon` ET par `authenticated`.
Référence : OWASP API5:2023 Broken Function Level Authorization.

ÉTAPE 1 — lecture seule. Classe les 332 en quatre familles, chaque nom vérifié :
  1. fonctions de trigger (prorettype = trigger)
  2. RPC réellement appelées par le rôle `anon` : preuve dans pg_stat_statements
     (rôle anon, 1 an) ET dans le code (apps/site-internet, pages publiques LinkMe)
  3. RPC appelées par `authenticated` seulement : preuve pg_stat_statements + code
  4. le reste : ni trigger, ni appelée
Pour chaque fonction de la famille 2 : ce qui casserait côté site ou LinkMe.
Dis-moi lesquelles des 17 ajoutées depuis la baseline
(scripts/supabase-advisors-baseline.json) sont nouvelles, et par quelle migration.

ÉTAPE 2 — propose le SQL, famille par famille, SANS L'APPLIQUER :
  - commence par reset_finance_auto_data : REVOKE FROM PUBLIC, anon, authenticated
    (vérifie d'abord qu'aucun écran ne l'appelle ; si un écran admin l'utilise,
    il passera par une route serveur avec service_role)
  - familles 1 et 4 : REVOKE EXECUTE FROM PUBLIC, anon
  - famille 3 : REVOKE FROM PUBLIC, anon ; GRANT EXECUTE TO authenticated
  - famille 2 : ne rien retirer à anon
Pour chaque famille : ce qui casserait si tu te trompes, et la commande de retour
arrière exacte (GRANT EXECUTE … TO …).
Avant de proposer le REVOKE sur les fonctions de trigger, démontre sur une
branche Supabase ou une base locale qu'un trigger continue de s'exécuter.

ÉTAPE 3 — propose le garde-fou : ALTER DEFAULT PRIVILEGES pour que les futures
fonctions ne soient plus exécutables par PUBLIC/anon, et un contrôle CI qui échoue
si le compteur remonte. Montre le SQL.

ATTENDS MON ACCORD ÉCRIT avant toute écriture en base. Puis : migration dans
supabase/migrations/, appliquée via execute_sql, advisors sécurité relus après,
branche depuis staging, PR vers staging sans fusion automatique, les 4 contrôles
requis vérifiés à la main.

INTERDITS : aucune suppression de ligne, aucune donnée de test, aucun commit ni
push sans mon ordre, `supabase db push` interdit.
```

## Retour arrière

Un `GRANT EXECUTE ON FUNCTION … TO …` par fonction retirée, listé dans la migration elle-même en
commentaire. Test de fumée après application : site internet (liste produits), page publique LinkMe,
connexion back-office, tableau de bord.

## Preuve de gain

`has_function_privilege('anon', oid, 'EXECUTE')` sur `public` : 332 → nombre validé ; advisor
`anon_security_definer_function_executable` à 0 hors famille 2 ; contrôle CI advisors au vert.
