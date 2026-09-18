# Session 2 — Contrôle central d'accès (commit `cc10edae`) · Bloc G · SÉCURITÉ

Durée : 1 h de reprise + 2-3 jours d'observation (le passage en mode bloquant est une autre session).
Touche la base : **non**. Ex-« Session 5 » de `PROMPTS-2026-09-11.md`.

## Ce qui est déjà mesuré (rapport § 1, § 3 G, [C38])

- `apps/back-office/src/middleware.ts` **absent** de la branche courante ; 152 `route.ts` sous `apps/back-office/src/app/api`.
- Dans `cc10edae` : `GUARD_MODE = process.env.API_GUARD_MODE ?? 'observe'` (l.29), « on laisse TOUJOURS
  passer » (l.100), `console.log` (l.87, interdit par la règle ESLint `no-console`).
- `cc10edae` est un commit « wip » de mise à l'abri, fait en `--no-verify`. Il mélange des sujets
  différents : middleware, gardes sur 3 routes Qonto, `api/logs`, relais `emails/form-reply`, webhook Revolut
  LinkMe, `use-factures-page.ts`, un logo PNG du site internet, 6 documents d'audit, 3 fichiers d'agents,
  `MAPPING-PAGES-TABLES.md`, un fichier `.claude/.write-test` vide.
- Branche `fix/BO-AUDIT-005-ecritures-db-impossibles` : 3 commits (`21ecd4cb`, `1da92551`, `cc10edae`),
  jamais poussée, partie d'un `staging` ancien.

## Ce qui change par rapport au prompt d'origine

| Prompt d'origine                                                                | Correction                                                                                                                                                    | Pourquoi                                                                                                            |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| « Ne le réécris pas »                                                           | on garde le code, mais **on trie le commit** : la PR de cette session ne contient que middleware + gardes d'accès ; le reste part dans ses propres commits/PR | règle « 1 PR = 1 bloc cohérent » ; un logo et 6 documents n'ont rien à faire dans une PR de sécurité                |
| « C'est aussi la cause du plantage quand on ouvre une page sans être connecté » | **à prouver** : reproduire le plantage avant, et vérifier qu'il disparaît après                                                                               | non mesuré ; le middleware en mode observation laisse tout passer, il ne peut pas corriger un plantage par lui-même |
| Branche telle quelle                                                            | remettre la branche à jour depuis `staging` avant tout                                                                                                        | branche partie de `staging` il y a six semaines                                                                     |

## Prompt à coller

```
Dossier : ~/verone-back-office-V1

## Vérifications d'ouverture, lecture seule
1. `pwd` et `git remote -v` = Verone2021/Verone-V1. Sinon ARRÊTE-TOI.
2. MCP Supabase `get_project_url` = https://aorroydfjsrygmosnzrl.supabase.co. Sinon ARRÊTE-TOI.
3. `git status` et `git branch --show-current` : dis-moi l'état, ne touche à rien.
   S'il y a du travail non enregistré sur la branche courante, dis-le-moi avant de changer de branche.

## Lecture
  docs/scratchpad/audit-2026-09-11/sessions/session-2-controle-central-acces.md
  docs/scratchpad/audit-2026-09-11/RAPPORT-CLAUDE-CODE-2026-09-11.md (§ 3 G, annexe C38)
  .claude/work/ACTIVE.md, section « Le Lot 1 ne touche PAS à la configuration Qonto »
  .claude/rules/workflow.md, .claude/rules/non-regression.md, .claude/rules/code-standards.md

## Mission : Bloc G — contrôle central d'accès, en MODE OBSERVATION seulement

90 routes API sur 152 annoncées sans contrôle d'accès (chiffre du plan, à recompter).
Le middleware existe dans le commit cc10edae de la branche
fix/BO-AUDIT-005-ecritures-db-impossibles, jamais poussé. Ne réécris pas sa logique.

ÉTAPE 1 — inventaire, lecture seule.
  a) `git show --stat cc10edae` : classe chaque fichier en « accès API »
     (middleware, gardes Qonto, api/logs, form-reply) / « autre sujet ».
  b) recompte les routes sans contrôle d'accès, avec la commande exacte.
  c) reproduis le plantage « page ouverte sans être connecté » sur le code actuel
     (étapes, message d'erreur). S'il n'est pas reproductible, dis-le.

ÉTAPE 2 — propose le découpage et attends mon accord :
  - une branche depuis staging à jour, avec UNIQUEMENT les fichiers « accès API »
    repris de cc10edae ;
  - la liste de ce qui reste (docs, logo, Revolut, agents) et où ça doit aller.

ÉTAPE 3 — après accord :
  - corrige middleware.ts:87 : console.log → console.warn (règle no-console) ;
  - vérifie ligne par ligne que le middleware laisse TOUT passer, même si
    API_GUARD_MODE vaut autre chose, et confirme-le-moi avec les numéros de lignes ;
  - vérifie qu'il accepte cookie OU Authorization: Bearer (extension Chrome de
    sourcing), et qu'il ne gêne ni api/webhooks/packlink, ni api/gmail/inbound,
    ni les api/cron/* ;
  - type-check + lint du back-office verts.

ÉTAPE 4 — montre-moi la liste des routes sensibles à protéger en premier avec le
motif existant de api/canaux/want-it-now/flux/route.ts (Bearer, 401, comparaison
à temps constant). Liste seulement, pas de modification.

Livraison : un seul push à la fin, PR vers staging, SANS fusion automatique
(dépôt privé offre Free : les 4 contrôles requis se vérifient à la main).
L'activation en mode bloquant est une session à part, après 2-3 jours
d'observation des journaux Vercel.

INTERDITS : aucune écriture en base, aucune donnée de test, aucun commit ni push
sans mon ordre, aucune modification des routes Qonto au-delà des gardes déjà
écrites dans cc10edae, jamais --no-verify.
```

## Retour arrière

Mode observation : aucun blocage possible. En cas de souci, revert de la PR (un seul commit squash).

## Preuve de gain

Journaux Vercel : décisions « aurait bloqué » par route pendant 2-3 jours ⇒ liste mesurée des appelants
légitimes, prérequis de la session d'activation.
