# Prompt — audit ciblé performance et scalabilité

Préparé le 2026-09-11. À coller **tel quel** dans une session Claude Code ouverte sur
`~/verone-back-office-V1`.

> Cette session **ne modifie rien**. Elle mesure, elle propose, elle pose ses questions. Les
> corrections viennent après, dans une session dédiée, une fois que tu as validé le plan.

---

## Avant de coller : l'ordre des chantiers

Tu as trois chantiers ouverts en même temps :

1. **Le canal Want It Now** — 5 commits locaux non poussés, plus le travail testé aujourd'hui.
   La migration est déjà en production, le code ne l'est pas. Une session attend tes retours.
2. **Le Lot BO-AUDIT-005** — le commit `cc10edae` sur `fix/BO-AUDIT-005-ecritures-db-impossibles`,
   ouvert depuis six semaines, jamais poussé. Il contient le middleware qui corrige le défaut
   n° 3 signalé dans le compte rendu.
3. **Performance et scalabilité** — ce que tu veux commencer.

Mon avis : **pousse Want It Now d'abord.** Il est fini et testé, il attend une relecture et une
mise en ligne. Le laisser en local pendant qu'on ouvre un troisième chantier, c'est exactement
ce qui a fait dormir le Lot 005 six semaines.

L'audit ci-dessous ne touche à rien : tu peux le lancer en parallèle sans risque, y compris
pendant que la session Want It Now travaille.

---

## Les réponses à donner à la session Want It Now

Elle attend tes retours sur trois défauts. Les trois sont anciens et **aucun n'est dans le
périmètre du canal**. Réponse à lui donner :

- **Fiche produit qui déborde en largeur sur téléphone et tablette** — hors périmètre, ne pas
  corriger dans cette branche. À traiter dans un ticket responsive dédié.
- **Message « ajouté » affiché même quand l'enregistrement échoue** — c'est le défaut
  transversal n° 2 de l'audit, l'erreur avalée. Il y en a 1 699 occurrences dans le dépôt. Il
  se corrige globalement au lot `BO-AUDIT-006`, pas au cas par cas. Ne pas corriger ici.
- **Page qui plante au lieu de renvoyer vers la connexion** — c'est le symptôme direct de
  l'absence de `middleware.ts`. Le correctif existe déjà, dans le commit `cc10edae`. Ne pas le
  réécrire : merger la branche du Lot 005.

Donc : **aucune correction supplémentaire sur la branche Want It Now.** Relecture finale et
mise en ligne.

---

## Le prompt

```
Dossier : ~/verone-back-office-V1

## 0. Vérifications d'ouverture — lecture seule, avant tout le reste

1. `pwd` = ~/verone-back-office-V1 et `git remote -v` = Verone2021/Verone-V1.
   Sinon ARRÊTE-TOI et dis-le-moi.
2. MCP Supabase : appelle `get_project_url`. Il DOIT répondre
   https://aorroydfjsrygmosnzrl.supabase.co — c'est la base Vérone.
   S'il répond autre chose, ou s'il échoue : ARRÊTE-TOI et dis-le-moi.
   Ne jamais me demander un jeton, ne jamais afficher sa valeur.
3. `git status` et `git branch --show-current` : dis-moi sur quelle branche
   tu es et ce qui traîne dans le working tree. Ne touche à rien.
4. Le back-office tourne sur le port 3003 en local, pas 3000 (le 3000 est
   pris par Want It Now).

Écris les réponses aux points 1 à 3 en tête de ton compte rendu.

## 1. Ce que tu dois lire

  docs/audit-2026-07-30/SOMMAIRE.md
  docs/audit-2026-07-30/AUDIT-2026-09-11.md          <- le plus récent, commence par lui
  docs/audit-2026-07-30/PLAN-CORRECTION.md, sections « Lot 4 » et « Lot 8 »
  docs/audit-2026-07-30/FINDINGS.md, sections « Lot 4 » et « Lot 8 » UNIQUEMENT
  supabase/migrations/20260508060000_rollback_bo_rls_perf_002_003.sql
  .claude/work/ACTIVE.md

## 2. Ta mission

Un AUDIT CIBLÉ performance et scalabilité, et RIEN D'AUTRE. Tu produis un plan
chiffré que je validerai. Tu ne corriges rien dans cette session.

INTERDICTIONS ABSOLUES, sans exception :
- Aucune écriture en base. MCP Supabase en SELECT uniquement.
- Aucune migration, même en dry-run. `supabase db push` interdit.
- Aucune modification de fichier applicatif.
- Aucun commit, aucun push, aucune PR.
- Aucune donnée de test créée, nulle part. L'application est en production
  depuis des mois, deux salariés l'utilisent tous les jours. Tu observes
  l'existant, tu n'ajoutes rien.
- Tu n'écris que dans docs/scratchpad/audit-perf-scal-2026-09-11/.

AVERTISSEMENT sur la RLS, à lire avant de proposer quoi que ce soit :
la solution classique — envelopper is_backoffice_user() en
(SELECT is_backoffice_user()) dans les policies — a DÉJÀ été appliquée le
2026-05-07 sur 64 policies. Le 2026-05-08 à 03:00 elle a mis la production à
terre : SELECT FROM auth.users à 3955 ms, service d'authentification en 504
sur tous les jetons, back-office inaccessible. Lis le fichier de rollback.
NE PROPOSE PAS de la retenter. Si ton analyse te conduit quand même vers
cette piste, dis-le-moi explicitement au lieu de l'écrire dans le plan.

## 3. Ce que tu mesures — performance

En lecture seule, et tu donnes le chiffre réel, pas une estimation :

a) pg_stat_user_tables : seq_scan, seq_tup_read, idx_scan et n_live_tup sur
   user_app_roles et les 10 tables les plus sollicitées. Point de comparaison
   du 2026-09-11 : user_app_roles = 9 lignes, 262 390 637 scans séquentiels.
b) Le corps actuel de is_backoffice_user() et de TOUTES les fonctions de rôle
   voisines (is_back_office_admin, is_backoffice_admin, is_staff_user_cached,
   has_scope, is_back_office_owner). Lesquelles font des I/O, lesquelles non.
c) Combien de policies appellent chacune de ces fonctions.
d) Existe-t-il déjà un hook custom_access_token sur ce projet ? Y a-t-il déjà
   quelque chose dans raw_app_meta_data ? (test_custom_access_token_hook et
   sync_user_metadata_to_jwt existent en base — dis-moi ce qu'elles font.)
e) force-dynamic : où exactement, et sur quelles pages ça retire le cache.
f) Les 25 boucles qui font une requête par ligne affichée : la liste avec
   fichier:ligne, et pour chacune combien de requêtes au pire cas.
g) Les 5 pages les plus lourdes du back-office : nombre de requêtes PostgREST
   au chargement. Si tu dois lancer le serveur local pour ça, fais-le sur le
   port 3003 et dis-le-moi avant.

## 4. Ce que tu mesures — scalabilité

a) Les 7 copies du fichier de types Supabase : laquelle est la source, quelles
   sont les mortes, qui importe quoi. Deux d'entre elles sont dans des
   répertoires imbriqués par accident sous packages/@verone/types/.
b) Les 13 cycles entre packages : lesquels sont cassables en moins d'une
   journée, lesquels demandent une refonte.
c) Les 6 tables cœur sans CREATE TABLE dans les 771 migrations. Confirme la
   liste et dis-moi ce que coûterait exactement une baseline `pg_dump
   --schema-only` committée : taille, risques, ce qu'elle débloque.
d) Les 27 clés étrangères sans index couvrant : la liste, et pour chacune si
   l'index servirait aujourd'hui ou seulement à volume supérieur. Sois
   honnête : sur 236 produits et 190 commandes, la plupart ne serviront à rien
   tout de suite.
e) L'arbre produit dupliqué (catalogue/[id] 66 fichiers vs catalogue/detail/[id]
   67 fichiers) : lequel est vivant, lequel le catalogue vise, ce qui existe
   dans l'un et pas dans l'autre.
f) 26 packages dont 5 seulement ont un script build, 0 déclare
   sideEffects: false, optimizePackageImports absent. Dis-moi l'effet réel sur
   le temps de build et sur la taille du bundle, mesuré, pas supposé.

## 5. Ce que tu me rends

Un fichier docs/scratchpad/audit-perf-scal-2026-09-11/plan.md contenant :

1. Les mesures, brutes, avec la requête ou la commande qui les a produites.
2. Une correction par bloc, et pour chacune : ce qu'elle change exactement,
   le gain attendu CHIFFRÉ et d'où vient le chiffre, l'effort en heures, le
   risque, et surtout LE PLAN DE RETOUR ARRIÈRE.
3. Les corrections classées par gain/effort, pas par gravité.
4. Ce qui ne sert à rien aujourd'hui et que je ne dois PAS faire maintenant —
   cette section est obligatoire, je veux savoir ce que tu écartes.
5. Tes questions. S'il y a une ambiguïté, tu me la poses AVANT de l'écrire
   dans le plan. Tu n'improvises rien, tu ne supposes rien.

## 6. Comment tu travailles

Avant de commencer : confirme-moi en 5 lignes ce que tu as compris de la
mission et des interdictions, puis attends mon feu vert.

Ensuite : d'abord toute la performance (§ 3), tu me montres, tu attends.
Puis toute la scalabilité (§ 4), tu me montres, tu attends. Puis le plan.

Si une mesure demande de lancer quelque chose de plus lourd qu'un SELECT ou
qu'un grep, tu me demandes d'abord.
```

---

## Après cette session

Tu auras un plan chiffré et validé. La session suivante exécute, un bloc à la fois, une PR par
bloc. Reviens me voir avec le plan avant de lancer l'exécution : le bloc « rôle dans le JWT »
est le seul du chantier qui peut couper la connexion des salariés, et je veux qu'on relise
ensemble son plan de retour arrière avant qu'il parte.
