# Suite de session — audit performance · 2026-09-11

Trois choses : ce qu'on répond à Claude Code, ce que contient `ACTIVE.md`, et les corrections
urgentes révisées d'après ses mesures.

---

## 1. Son rapport corrige mon audit sur trois points, et il a raison

| Ce que j'avais écrit                                              | Ce qu'il a mesuré                                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Le rôle dans le JWT supprime les 262 M de scans, gain ×36         | Gain réel ×2 à ×3. Et un droit retiré resterait actif jusqu'à l'expiration du jeton, ~1 h   |
| `force-dynamic` sur le layout racine empêche tout cache           | Sans effet sur 165 pages sur 169 : la zone protégée relit la session de toute façon         |
| 25 boucles faisant une requête par ligne                          | 67 en série, 21 en parallèle                                                                |
| La fonction de rôle est réévaluée à chaque ligne sur 216 policies | Sur 51 tables au maximum sur 132, là où une règle LinkMe cohabite avec celle du back-office |

Mes chiffres venaient d'une analyse statique et d'une lecture de `pg_stat_user_tables`. Les
siens viennent de `EXPLAIN ANALYZE` et de mesures avec un vrai jeton. **Ce sont les siens qui
comptent.** Le plan de correction que je t'avais donné hier est à jeter sur sa partie
performance : il visait les mauvaises cibles.

Ce qu'il a trouvé et que je n'avais pas vu est bien plus rentable : le menu de gauche, le
compteur d'alertes stock, le journal de navigation, la page Inventaire.

---

## 2. Ce que son observation sur mai m'a fait vérifier — et c'est une trouvaille

Il note que le retour arrière du 8 mai a été fait **en même temps** qu'un rafraîchissement des
statistiques internes de la base, et que le temps de préparation d'une requête est passé de
2 484 ms à 17 ms. Il conclut qu'on ne sait pas laquelle des deux actions a réparé. Il a raison
de le noter sans le recommander.

J'ai vérifié l'état actuel de ces statistiques. Voici ce que dit la base aujourd'hui :

| Table                | Lignes  | Dernière analyse                                        |
| -------------------- | ------- | ------------------------------------------------------- |
| `user_app_roles`     | 9       | **13 février 2026** — il y a sept mois                  |
| `products`           | 236     | juillet 2026 (auto) ; dernière manuelle : novembre 2025 |
| `organisations`      | 223     | **8 mai 2026** — le jour de l'incident, jamais depuis   |
| `audit_logs`         | 92 717  | **1er avril 2026**                                      |
| `user_activity_logs` | 123 575 | **29 mai 2026**                                         |

**Les statistiques de la base sont périmées sur toutes les tables qui comptent.** Postgres
planifie ses requêtes à partir de ces statistiques. Sur `user_app_roles`, il travaille avec une
photo vieille de sept mois.

C'est exactement le scénario que son rapport laisse deviner : ce n'est peut-être pas le retour
arrière de mai qui a réparé, c'est le `ANALYZE` qui l'accompagnait. Et le problème est
revenu, doucement, depuis.

Un `ANALYZE` est une opération de maintenance standard de Postgres. **Il ne touche à aucune
donnée métier** — il recalcule les statistiques que Postgres utilise pour choisir ses plans.
C'est réversible par construction, puisque ces statistiques se recalculent en permanence.

C'est peut-être la correction la moins chère de tout le chantier. À vérifier avant d'y croire :
mesurer le temps de préparation d'une requête, lancer `ANALYZE` sur une seule table, remesurer.

---

## 3. Tout ce qu'il y a dans `ACTIVE.md`

398 lignes, gitignored, local uniquement. Voici la structure complète.

**En cours** — `[VER-CANAL-WIN-001]`, le flux JSON protégé pour Want It Now. Migration déjà
appliquée en production, code en local non poussé.

**Chantier `[BO-AUDIT]`, marqué priorité absolue**, treize lots :

| Lot            | Objet                                                       | État réel au 2026-09-11                                          |
| -------------- | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| `BO-AUDIT-001` | Mot de passe back-office, dépôt en privé, PAT révoqué       | mot de passe fait, dépôt **privé** (confirmé), PAT à vérifier    |
| `BO-AUDIT-002` | `.gitignore` en globs, identifiants versionnés retirés      | **fait**                                                         |
| `BO-AUDIT-003` | Le mur : 3 routes Qonto, middleware observation, activation | écrit dans `cc10edae`, **jamais poussé**                         |
| `BO-AUDIT-004` | Rebrancher les gates CI                                     | **fait et mergé** (#1129)                                        |
| `BO-AUDIT-005` | Purge documentaire + écritures DB impossibles               | à mi-chemin, branche non poussée                                 |
| `BO-AUDIT-006` | Erreurs visibles : Sentry, toast unique, helper             | à faire — c'est le défaut « message ajouté » de ton compte rendu |
| `BO-AUDIT-007` | Performance                                                 | **en cours, c'est la session d'aujourd'hui**                     |
| `BO-AUDIT-008` | Les 12 bugs bloquants, 1 PR par bug                         | à faire                                                          |
| `BO-AUDIT-009` | Socle de test, baseline SQL                                 | à faire                                                          |
| `BO-AUDIT-010` | Playwright ciblé, 8 parcours                                | à faire                                                          |
| `BO-AUDIT-011` | Architecture : copies de types, 13 cycles, arbre dupliqué   | à faire                                                          |
| `BO-AUDIT-012` | Créer les 3 agents manquants                                | fichiers prêts, à déplacer                                       |
| `BO-AUDIT-013` | Rotation des clés, purge d'historique                       | repoussé volontairement, en dernier                              |

**Trois sections d'alerte** : identifiants en clair dans des fichiers versionnés ; deux points
à vérifier avant les gates CI ; le rappel que le Lot 1 ne touche pas à la configuration Qonto.

**Le reste** : rapprochements bancaires Pokawa (à ta main, en ligne), dette et vigilance,
suites LinkMe non urgentes, comptabilité Welyb, ce qui attend le passage en version live,
l'historique récent, le backlog en attente de ta décision, la demande Pokawa
PR-2026-000001, la Brand Foundation, et le chantier site public LinkMe clôturé le 17 juin.

**Deux passages sont périmés et t'induiront en erreur** : le fichier dit encore que le dépôt
est public — il est privé ; et il annonce 59 tables sans `CREATE TABLE`, chiffre que je n'ai
pas pu confirmer (j'en ai vérifié 8, dont 6 sont effectivement sans). À corriger.

---

## 4. Les corrections urgentes, révisées d'après ses mesures

Plus aucune ne touche à la RLS, au JWT, ni à une donnée métier.

| #   | Correction                                             | Gain mesuré                                                      | Effort | Risque                  |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------- | ------ | ----------------------- |
| 1   | `ANALYZE` sur les tables clés                          | à mesurer — potentiellement le temps de préparation des requêtes | 15 min | très faible, réversible |
| 2   | Le journal de navigation : ne plus écrire en synchrone | 107 ms gagnés **sur chaque page vue**                            | 2 h    | faible                  |
| 3   | Le menu de gauche : 11 compteurs → 1 appel             | ~16 h de travail base par an                                     | 4 h    | faible                  |
| 4   | Le compteur d'alertes stock                            | 141 ms → 2 ms                                                    | 2 h    | faible                  |
| 5   | La page Inventaire : 222 requêtes → 2                  | le chargement de la page                                         | 3 h    | moyen                   |

**Le n° 2 est le plus rentable et personne ne l'avait vu.** Le journal de navigation écrit une
ligne en base à chaque page affichée, l'écriture prend 107 ms, et elle est dans le chemin du
rendu. Ce n'est pas une lenteur de base de données, c'est 107 ms ajoutés à chaque clic que tu
fais dans l'application, toute la journée.

Il pèse aussi 106 Mo, soit 36 % de ta base. Avec `audit_logs` (76 Mo), tes deux journaux font
environ 62 % du volume total.

**Une question à te poser avant de toucher à ce journal** : à quoi sert-il ? Si personne ne le
lit, la bonne correction n'est pas de l'optimiser, c'est d'arrêter de l'écrire. Si tu en as
besoin pour de la traçabilité, on le rend asynchrone et on l'archive. Je ne propose **aucune
suppression de lignes** tant que tu n'as pas tranché — 123 575 lignes de journal restent tes
données.

Ce que j'écarte explicitement, et que je te conseille de ne PAS faire maintenant : le rôle
dans le JWT (gain ×2 pour un risque de sécurité réel sur la révocation des droits), le retrait
de `force-dynamic` (sans effet sur 165 pages sur 169), les 27 index sur clés étrangères (sans
objet à 236 produits), et surtout toute nouvelle tentative sur les policies RLS.

---

## 5. Ce qu'on lui répond

À coller tel quel dans la session en cours.

```
Excellent travail, et merci d'avoir corrigé mes trois points au lieu de les
reprendre. Réponses, dans l'ordre.

## 1. Oui pour la mesure au navigateur (3g)

Fais-la. Je lance le back-office sur le port 3003 et je me connecte dans la
fenêtre de test. Les 5 pages : Inventaire, Catalogue, Commandes clients,
Rapprochement bancaire, Configuration du site internet.

Rappel des règles pour cette mesure : tu ouvres et tu comptes, tu ne cliques
sur AUCUN bouton qui enregistre, envoie, valide, synchronise ou supprime. Tu
n'ouvres pas /finance/admin/reset ni /finance/admin/cloture. Aucune donnée de
test créée, nulle part.

## 2. Une piste à mesurer AVANT de finir le plan — statistiques périmées

Ton observation sur mai (retour arrière fait en même temps qu'un
rafraîchissement des statistiques, temps de préparation passé de 2484 ms à
17 ms) m'a fait vérifier l'état actuel. Voici ce que dit la base aujourd'hui :

  user_app_roles      9 lignes       dernière analyse : 13 février 2026
  organisations     223 lignes       dernière analyse : 8 mai 2026
  products          236 lignes       dernière analyse manuelle : nov. 2025
  audit_logs      92 717 lignes      dernière analyse : 1er avril 2026
  user_activity_logs 123 575 lignes  dernière analyse : 29 mai 2026

Les statistiques sont périmées sur toutes les tables qui comptent, et
user_app_roles travaille avec une photo vieille de sept mois.

Mesure ceci, en lecture seule d'abord :
  a) le temps de PRÉPARATION (planning time, pas execution time) des requêtes
     du menu de gauche et du compteur d'alertes stock
  b) est-ce que ça expliquerait les 141 ms du compteur d'alertes, que tu
     attribues à une re-préparation complète à chaque appel ?
  c) quel serait le coût et la durée d'un ANALYZE sur les tables concernées

Puis propose-le-moi comme une correction à part entière, avec son plan de
retour arrière, si les mesures le confirment. NE LANCE AUCUN ANALYZE sans mon
accord écrit dans le chat, même si tu es sûr — c'est ma base de production.

## 3. Le journal de navigation : ne propose pas encore de correction

Tu as trouvé qu'il écrit 107 ms à chaque page vue et qu'il pèse 106 Mo, 36 %
de la base. C'est la trouvaille la plus rentable de ton audit.

Avant que tu proposes quoi que ce soit, réponds-moi à ça, par la lecture du
code uniquement :
  - qui lit cette table ? quelle page, quel écran, quel export ?
  - l'écriture est-elle dans le chemin du rendu, ou déclenchée après ?
  - existe-t-il déjà une purge ou une rétention quelque part ?

Je ne veux AUCUNE suppression de lignes proposée tant que je n'ai pas tranché
sur l'usage. 123 575 lignes de journal restent mes données.

## 4. Ce que j'écarte — ne le mets pas dans le plan

  - le rôle dans le JWT : gain ×2 pour un risque réel sur la révocation des
    droits. Ta piste « lire les droits une seule fois par requête, sans
    toucher aux règles et sans rien stocker dans le jeton » m'intéresse
    beaucoup plus — détaille-la.
  - le retrait de force-dynamic : tu as montré que ça ne change rien pour
    165 pages sur 169.
  - les 27 index sur clés étrangères : sans objet à 236 produits.
  - toute nouvelle tentative sur les policies RLS.

## 5. Ordre du plan final

Classe par gain réel mesuré, pas par gravité. Mon hypothèse à confirmer ou
infirmer par tes mesures :
  1. statistiques périmées (si confirmé)
  2. journal de navigation
  3. menu de gauche, 11 compteurs
  4. compteur d'alertes stock
  5. page Inventaire

Et garde la section obligatoire « ce que je n'ai pas retenu et pourquoi ».

## 6. Après la performance

Tu enchaînes sur la capacité à grandir (§ 4 du prompt d'origine). Toujours en
lecture seule, toujours sans rien modifier.
```

---

## 6. Sur les fichiers de juillet — ils sont tous là

Rien n'est perdu. Dans `docs/audit-2026-07-30/` : `AUDIT.md` (52 ko), `FINDINGS.md` (83 ko,
les 122 défauts), `PLAN-CORRECTION.md` (37 ko), `PLAN-TESTS.md` (37 ko), `SYSTEME.md` (28 ko),
`ECRITURES-DB-IMPOSSIBLES.md` (26 ko), `README.md`, et `AUDIT-2026-09-11.md` d'hier.

Trois fichiers que je t'avais préparés le 31 juillet ne sont **pas** sur le disque : le
`SOMMAIRE.md`, les `PROMPTS-SESSIONS.md`, la `BATTERIE-TESTS-LECTURE-SEULE.md` et le
`RAPPORT-CAMPAGNE-TEMPLATE.md`. Ils sont dans le commit `cc10edae`, jamais poussé, donc
invisibles depuis la branche où tu travailles. Ils réapparaîtront quand cette branche sera
mergée.

Les mémoires du projet sont intactes elles aussi : le chantier d'audit, les mesures et le
nommage de la base, la règle « ne pas wrapper les policies RLS », et l'environnement de
travail. Je les ai relues avant d'écrire ce document.
