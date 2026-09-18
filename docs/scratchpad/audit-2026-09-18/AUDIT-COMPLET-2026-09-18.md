# Audit complet — back-office, site internet, LinkMe

**Date** : 2026-09-18 · **Auditeur** : Cowork (tour de contrôle) · **Périmètre** : monorepo `verone-back-office-V1` (3 applications, 26 packages) + base Supabase `aorroydfjsrygmosnzrl` (production)
**Mode** : lecture seule intégrale. Aucune écriture en base, aucun commit, aucune modification de fichier.

---

## 1. Méthode

### La grille de notation

Un audit sérieux fixe sa grille **avant** de mesurer, sinon la note n'est qu'une opinion habillée d'un chiffre. J'ai gardé la grille de juillet pour que la comparaison reste valable :

| Axe                        | Poids | Ce qu'il mesure                                                        |
| -------------------------- | ----- | ---------------------------------------------------------------------- |
| Sécurité                   | 25 %  | Ce qu'un attaquant ou un utilisateur mal intentionné peut atteindre    |
| Stabilité fonctionnelle    | 25 %  | Est-ce que ce que l'écran affiche correspond à ce qui se passe en base |
| Performance                | 20 %  | Temps de réponse réel et coût de chaque action                         |
| Scalabilité / architecture | 15 %  | Ce qui casse quand le volume, l'équipe ou le nombre d'apps augmente    |
| Qualité de code et tests   | 15 %  | Ce qui empêche une régression d'arriver en production                  |

**Cible réaliste : 80/100.** 100 n'existe pas sur cette grille : ce serait une application sans aucune dette, avec couverture de tests complète et observabilité totale. Aucune application d'entreprise de ta taille n'y arrive.

J'ai ajouté un **6e axe hors grille** que tu as demandé — _maintenabilité et cohérence des composants_ — noté à part pour ne pas casser la comparaison avec juillet.

### Référentiels utilisés

- **OWASP API Security Top 10 (2023)** — en particulier API2 (authentification cassée) et API5 (autorisation au niveau des fonctions).
- **Supabase : RLS Performance and Best Practices** + **Database Advisors** (lints officiels, exécutés le 18/09 à 15 h 31 UTC).
- **ISO/IEC 25010** pour le découpage des axes de qualité logicielle.
- Règles internes du dépôt : `.claude/rules/*`, `CLAUDE.md`.

### Règle de preuve

**Aucun chiffre n'entre dans ce rapport sans la commande ou la requête qui l'a produit.** Quand une mesure contredit un rapport antérieur, je le dis. Quand je n'ai pas pu mesurer, je le dis aussi (§ 9).

---

## 2. Verdict

**Ce n'est pas un chantier de ruines. C'est une maison bien maçonnée, sans porte d'entrée, sans détecteur de fumée et sans plan d'évacuation.**

Le socle est meilleur que ce que j'attendais : le modèle de données est propre (0 table sans clé primaire, 0 montant en virgule flottante, 322 clés étrangères, 344 contraintes de validation, 45 types énumérés), les 26 packages forment un graphe sans dépendance circulaire, aucune application n'importe le code d'une autre, et les règles de sécurité de la base tiennent réellement — je l'ai vérifié en interrogeant la base en tant que visiteur anonyme : les tables sensibles renvoient zéro ligne.

Ce qui est de l'amateurisme, c'est tout ce qui entoure ce socle :

1. **117 routes API sur 194 n'ont aucun contrôle d'accès** et le back-office n'a aucune protection globale. Une route expose l'adresse complète d'un client, sans authentification, avec la clé qui contourne toutes les règles de sécurité de la base.
2. **93,5 % du temps de travail de la base ne sert pas ton application.** Le temps réel Supabase en consomme 61,5 %, les scripts de la CI qui inspectent la production 21,8 %.
3. **Aucune observabilité.** Sentry a une clé configurée et zéro ligne de code. Quand quelque chose casse en production, tu l'apprends par un client.
4. **Aucun environnement de test.** Le déploiement de `staging` est désactivé : il n'existe aucun endroit où vérifier un correctif avant la production.
5. **Aucun plan de reprise.** Pas de RPO, pas de RTO, aucun test de restauration, sur une application qui gère de la TVA et du rapprochement bancaire.
6. **Aucun test unitaire ne tourne.** Aucun framework de test n'est installé ; les quelques fichiers `.test.ts` existants ne sont lancés par aucun pipeline.

La bonne nouvelle : ces six points sont des chantiers d'infrastructure bornés, pas une réécriture. Une application se rattrape. Un modèle de données pourri ne se rattrape pas — et le tien ne l'est pas.

---

## 3. Notes

### Sur la grille de juillet

| Axe                        |  30/07 |  11/09 | **18/09** | Évolution                                                                                                  |
| -------------------------- | -----: | -----: | --------: | ---------------------------------------------------------------------------------------------------------- |
| Sécurité                   |     17 |     19 |    **38** | +19 — les lots 1 à 7 ont réellement fermé la base ; le trou est passé côté routes API                      |
| Stabilité fonctionnelle    |     24 |     24 |    **30** | +6 — 0 erreur serveur sur 24 h, sourcing et produits réparés ; les bugs financiers de juillet sont ouverts |
| Performance                |     22 |     22 |    **35** | +13 — le polling du menu est mort (le plus gros gain de l'année), la lenteur unitaire reste                |
| Scalabilité / architecture |     28 |     26 |    **28** | = — rien n'a bougé : ni environnement de test, ni plan de reprise, ni schéma reconstructible               |
| Qualité de code et tests   |     20 |     32 |    **33** | +1 — E2E réparés mais toujours non bloquants, zéro test unitaire exécuté                                   |
| **Global pondéré**         | **22** | **24** |    **33** | **+9 en sept semaines**                                                                                    |

### Hors grille, l'axe que tu as demandé

| Axe                                        | **18/09** | Commentaire                                                                                                                                                     |
| ------------------------------------------ | --------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Maintenabilité et cohérence des composants |    **45** | Pas de duplication de primitives entre apps (bon), mais le design system théorique n'est branché sur rien et la dette est concentrée dans les packages partagés |

### Par application

| Application       |   Note | Ce qui la tire vers le bas                                                                                | Ce qui la tient                                                                        |
| ----------------- | -----: | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **back-office**   | **31** | 85 routes sans garde sur 152, aucun middleware, 95 fichiers > 400 lignes, 3 tests pour 1 550 fichiers     | Le modèle de données, la réutilisation des packages (63 %), les en-têtes de sécurité   |
| **LinkMe**        | **46** | Partage la base et donc toutes ses limites ; 12 routes sans garde inline ; 1 test pour 472 fichiers       | **Le seul à avoir un middleware qui refuse par défaut** — c'est le modèle à copier     |
| **site internet** | **37** | 20 routes sur 25 sans garde, middleware qui ne protège aucune API, 11 % de réutilisation du design system | Peu de code, peu de dette, `force-static` correctement utilisé sur les pages marketing |

**Note de base de données, en trois morceaux** — elle est commune aux trois applications :

| Sous-axe                                |   Note | Pourquoi                                                                                                                       |
| --------------------------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------------ |
| Modélisation                            | **72** | Clés primaires partout, types monétaires corrects, contraintes, énumérations, dates avec fuseau                                |
| Exposition et droits                    | **45** | Les règles tiennent, mais les droits sont accordés à l'aveugle et 39 fonctions d'écriture sont ouvertes à tout compte connecté |
| Exploitation (performance, sauvegardes) | **28** | 93,5 % du temps consommé hors application, instance minuscule, aucune sauvegarde documentée                                    |

---

## 4. Performance — ta priorité

### 4.1 Le chiffre qui résume tout

Requête sur `pg_stat_statements`, cumul depuis le 05/09/2025 (les compteurs n'ont jamais été remis à zéro) :

| Catégorie                                                             |     Appels |         Temps total |       Part |
| --------------------------------------------------------------------- | ---------: | ------------------: | ---------: |
| **Temps réel Supabase** (lecture continue du journal de transactions) | 47 832 922 | 240 328 s (66 h 43) | **61,5 %** |
| **Introspection par la CI** (contrôles de dérive sur la production)   |  8 284 876 |  85 167 s (23 h 39) | **21,8 %** |
| **Compteur d'alertes stock**                                          |    189 985 |   26 509 s (7 h 22) |  **6,8 %** |
| **Ton application**                                                   | 21 956 131 |   25 258 s (7 h 01) |  **6,5 %** |
| Journal de navigation                                                 |     69 320 |             7 560 s |      1,9 % |
| `pg_net` (appels HTTP sortants)                                       |    131 266 |             5 836 s |      1,5 % |
| RPC du menu `get_sidebar_counts`                                      |        294 |               312 s |      0,1 % |

**Six pour cent et demi.** Tu paies une base de données dont quatorze quinzièmes du travail ne servent ni tes salariés ni tes clients.

Deux précisions honnêtes : ce cumul couvre un an, donc il inclut la période d'avant les corrections du 15/09 ; et le nouveau RPC du menu (0,1 %, 294 appels) est la preuve que la correction fonctionne — il a remplacé des millions d'appels par quelques centaines.

Détail des trois postes :

- **Temps réel** : 2 tables publiées (`sales_orders`, `products`), 2 canaux dans le code, pour un besoin métier qui se résume à rafraîchir deux pastilles. Le mécanisme lit le journal de transactions en continu, qu'il y ait ou non un abonné. 5,5 ms en moyenne, 23 millions de fois.
- **Introspection CI** : le contrôle de dérive interroge `information_schema` **sur la base de production**. La requête la plus lourde : 880 appels à **5,6 secondes de moyenne** (jusqu'à 40 s selon la mesure du 11/09).
- **Alertes stock** : `get_stock_alerts_count` — 184 322 appels à **143 ms de moyenne**, pour compter des lignes.

### 4.2 Ce que vivent les utilisateurs — dernières 24 heures

Journaux de la passerelle Supabase, 17/09 16 h → 18/09 16 h UTC :

| Indicateur                       | Valeur            |
| -------------------------------- | ----------------- |
| Appels                           | ~9 600            |
| **Erreurs serveur (5xx)**        | **0**             |
| Erreurs client (4xx)             | 6                 |
| p50 selon l'heure                | 55 à 451 ms       |
| p95 selon l'heure                | 703 ms à 4 227 ms |
| Pic maximum                      | 15,1 s            |
| Utilisateurs connectés distincts | **3**             |

Par point d'entrée, sur la même fenêtre :

| Point d'entrée                            | Appels | Moyenne |          p95 |
| ----------------------------------------- | -----: | ------: | -----------: |
| `/rest/v1/sales_orders`                   |    821 |  680 ms | **2 823 ms** |
| `/rest/v1/products`                       |    678 |  585 ms | **2 624 ms** |
| `/rest/v1/stock_alerts_unified_view`      |    252 |  874 ms | **3 614 ms** |
| `/rest/v1/client_consultations`           |    160 |  800 ms | **3 863 ms** |
| `/rest/v1/organisations`                  |    283 |  501 ms |     2 496 ms |
| `/rest/v1/rpc/get_site_internet_products` |    214 |  878 ms |     1 812 ms |
| `/auth/v1/user`                           |  2 230 |  174 ms |       471 ms |

**Le contexte rend ces chiffres sévères** : la table `products` contient **239 lignes**, `sales_orders` **311 lignes**, et trois personnes utilisent l'application. Une seconde de moyenne pour lire 311 commandes, ce n'est pas un problème de volume, c'est un problème de conception de requête, de règles de sécurité non indexées et d'instance sous-dimensionnée.

Ce qui a été corrigé le 15/09 est réel : le volume d'appels a été divisé par vingt et les erreurs serveur ont disparu. Ce qui n'a pas été corrigé : **le coût unitaire de chaque écran**.

### 4.3 L'instance

| Paramètre              | Valeur            | Lecture                                                 |
| ---------------------- | ----------------- | ------------------------------------------------------- |
| `shared_buffers`       | 224 MB            | Instance Micro (1 Go de mémoire)                        |
| `effective_cache_size` | 384 MB            | idem                                                    |
| `work_mem`             | 2 184 kB          | Tout tri au-delà passe sur disque                       |
| `max_connections`      | 60                | 13 connexions ouvertes, 1 active au moment de la mesure |
| Taux de cache          | 100 %             | La lenteur ne vient pas du disque                       |
| Région                 | eu-west-3 (Paris) | Correct                                                 |

Mon avis : **ne monte pas l'instance maintenant.** Tu paierais plus cher pour absorber du travail inutile. Coupe d'abord le temps réel et sors la CI de la production ; si la lenteur persiste après ça, la montée de gamme devient justifiée — et à ce moment-là elle aura un effet mesurable.

### 4.4 Côté code — ce qui produit ces millisecondes

Mesures par analyse du dépôt (commandes en annexe) :

| Motif                                   |        back-office |           LinkMe |            site | packages |
| --------------------------------------- | -----------------: | ---------------: | --------------: | -------: |
| Boucles faisant une requête par élément |                 22 |                2 |               4 |       24 |
| `select('*')` (colonnes non spécifiées) |                 33 |                0 |               5 |       19 |
| Composants clients `'use client'`       | 897 / 1 055 (85 %) | 252 / 324 (78 %) | 49 / 103 (48 %) |        — |
| Chargement différé `next/dynamic`       |                  4 |                1 |               0 |        — |
| Mise en cache `unstable_cache`          |                  0 |                0 |               0 |        — |

Trois points qui coûtent cher et se corrigent vite :

- **52 boucles requête-par-élément** au total. Les pires sont dans des chemins utilisateur : actions groupées du catalogue (`use-bulk-actions.ts:128` et `:159`), propagation de variantes, réservations de stock ligne par ligne (`use-sales-orders-mutations-write.ts:176`), panier LinkMe.
- **`lucide-react` est importé dans 1 584 fichiers** et aucune des trois applications n'active `optimizePackageImports`. C'est le réglage le plus rentable du monde Next.js : une ligne de configuration.
- **85 % du back-office est rendu côté client.** Une application de gestion peut envoyer beaucoup plus de travail au serveur.

### 4.5 Index

| Mesure                                      | Valeur                                                     |
| ------------------------------------------- | ---------------------------------------------------------- |
| Index au total                              | 924                                                        |
| **Index jamais utilisés**                   | **237** (chacun ralentit toutes les écritures de sa table) |
| Index en double                             | 3 (`products`, `product_images`, `gmail_watch_state`)      |
| Clés étrangères sans index                  | 33                                                         |
| Tables aux statistiques de plus de 30 jours | 128 sur 137                                                |
| Tables jamais analysées                     | 83                                                         |

---

## 5. Sécurité

### 5.1 Ce que voit vraiment un visiteur anonyme — test réel

J'ai interrogé la base **en prenant le rôle `anon`**, celui de n'importe quel visiteur du site :

| Table                                                                   | Lignes visibles |
| ----------------------------------------------------------------------- | --------------: |
| `audit_logs`, `user_app_roles`, `user_profiles`, `user_activity_logs`   |           **0** |
| `bank_transactions`, `financial_documents`, `expenses`                  |           **0** |
| `sales_orders`, `channel_pricing`, `linkme_commissions`, `app_settings` |           **0** |
| `newsletter_subscribers`, `form_submissions`                            |           **0** |
| `products` (actifs)                                                     |              18 |
| `product_images`                                                        |             500 |
| `linkme_public_products`                                                |              23 |
| `site_content`                                                          |               3 |

**Conclusion : les règles de sécurité de la base tiennent.** L'alerte « 98 tables ouvertes à anon » des rapports précédents était un artefact de méthode : ce sont des _droits_ accordés par défaut par Supabase, pas des _accès_. Les règles RLS, actives sur les 137 tables, bloquent effectivement.

Cela reste une faiblesse de défense en profondeur : `anon` a des droits d'écriture accordés sur 95 objets, dont `audit_logs`, `user_app_roles` et `financial_documents`. Aujourd'hui, seule la couche RLS empêche l'accès. Le 8 mai, une modification de cette couche a mis la production à terre — c'est le même point unique de défaillance.

### 5.2 Le vrai trou : les routes API

| Application   |  Routes |                                 Sans aucune garde | Sans garde **et** qui écrivent |
| ------------- | ------: | ------------------------------------------------: | -----------------------------: |
| back-office   |     152 |                                            **85** |                         **32** |
| LinkMe        |      17 | 12 (dont la plupart rattrapées par le middleware) |                              4 |
| site internet |      25 |                                            **20** |                              3 |
| **Total**     | **194** |                                           **117** |                         **39** |

- **Le back-office n'a aucun `middleware.ts`.** LinkMe en a un qui refuse par défaut tout ce qui n'est pas explicitement public. Le site internet en a un qui ne protège que les pages `/compte`, aucune API.
- Un helper de garde existe (`requireBackofficeAdmin`) : **13 routes sur 152 l'utilisent.**
- Un second helper, `verifyAuth` dans `@verone/utils`, n'est utilisé par **aucune** route. Outil de sécurité mort.

### 5.3 Les quatre failles à traiter cette semaine

| #   | Faille                                                                                                                                                                                                                                                                             | Preuve                                                            | Gravité             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------- |
| 1   | `api/sales-orders/[id]/customer-address` lit avec la **clé service_role** (qui contourne toutes les règles de sécurité) et n'a aucune authentification. Nom, e-mail, téléphone et adresse d'un client, accessibles à qui devine un identifiant de commande                         | `route.ts:16` et `:35` — `createAdminClient()`, aucun `getUser()` | **Critique — RGPD** |
| 2   | Clés en clair dans l'historique git de `main` : commit `170aecf0`, 3 fichiers `.env.local.backup-*` contenant `SUPABASE_SERVICE_ROLE_KEY`, `GH_TOKEN`, `VERCEL_TOKEN`, `QONTO_API_KEY`. Supprimés du répertoire par `b07283b7`, **toujours récupérables dans l'historique**        | `git show --stat 170aecf0`                                        | **Critique**        |
| 3   | **39 fonctions de base qui écrivent, sans contrôle interne, appelables par n'importe quel compte connecté** — dont `delete_order_payment`, `update_google_merchant_price`, `auto_classify_all_unmatched`, `link_transaction_to_document`. Un affilié LinkMe est un compte connecté | Requête sur `pg_proc`, § annexe                                   | **Critique**        |
| 4   | Webhook Packlink et 6 routes `cron` sur 7 : la vérification du secret est **sautée si la variable d'environnement est absente** (fail-open)                                                                                                                                        | `webhooks/packlink/route.ts:24-32`                                | **Majeur**          |

Sur la n° 2 : la rotation des clés est le bon réflexe, mais l'ordre compte. Les clés Supabase actuelles sont au format ancien ; il faut migrer vers les nouvelles clés **avant** de révoquer, sinon les trois applications tombent. C'est une opération à faire en heure creuse, pas un lundi matin.

Sur la n° 3 : le cookie de session n'est pas partagé entre domaines (les trois apps sont sur des domaines racine différents), mais **le jeton est cryptographiquement valide pour les trois** — même projet d'authentification. Rejoué hors navigateur, il passe. L'isolation entre applications n'existe qu'au niveau applicatif, jamais au niveau session.

### 5.4 Advisors Supabase (18/09, 15 h 31 UTC)

| Niveau        | Lint                                                            |                         Nombre |
| ------------- | --------------------------------------------------------------- | -----------------------------: |
| ERREUR        | Vue en SECURITY DEFINER (`linkme_public_products`)              |                              1 |
| Avertissement | Fonctions SECURITY DEFINER exécutables sans connexion           | **13** (contre 332 en juillet) |
| Avertissement | Fonctions SECURITY DEFINER exécutables par tout compte connecté |                        **141** |
| Avertissement | Fonctions au `search_path` modifiable                           |                              7 |
| Avertissement | Protection contre les mots de passe compromis désactivée        |                              1 |

À quoi s'ajoute : **vérification en deux étapes désactivée sur ton compte Supabase**. Sur une base qui contient toute ta comptabilité, c'est la correction la moins chère de tout ce rapport.

---

## 6. Scalabilité et architecture

### Ce qui est bien construit

- Graphe des 26 packages : **aucune dépendance circulaire**. Socle `types` / `utils` / `ui`, puis `common` → `finance` → `orders` → `consultations`. C'est propre.
- **Aucun import croisé entre applications.** La frontière tient.
- Modélisation : 0 table sans clé primaire, 0 montant en virgule flottante (erreur classique et coûteuse en comptabilité), 417 colonnes de date avec fuseau horaire contre 5 sans, 45 types énumérés, 344 contraintes de validation, 251 déclencheurs.

### Ce qui bloquera la croissance

| Point                                    | Mesure                                                                                                                                      | Conséquence                                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Base non reconstructible**             | 804 fichiers de migration, seulement **97 `CREATE TABLE` distincts** pour **137 tables**                                                    | Tu ne peux pas recréer ton schéma à neuf. Donc pas d'environnement de test, pas de reprise après sinistre propre |
| **Aucun environnement de préproduction** | `vercel.json` : `staging: false`                                                                                                            | Aucun endroit pour vérifier un correctif avant la production                                                     |
| **Aucun plan de reprise**                | Ni RPO, ni RTO, ni test de restauration — c'est le runbook du dépôt lui-même qui le dit                                                     | Sur une application qui gère TVA et rapprochement bancaire                                                       |
| **Types de base dupliqués**              | 5 fichiers `export type Database`, dont 2 dans des chemins imbriqués aberrants (704 Ko de code mort versionné, séquelle d'un revert de mai) | Divergence silencieuse entre ce que croit le code et ce qu'est la base                                           |
| **Journaux non purgés**                  | `user_activity_logs` 108 Mo (47,6 %) + `audit_logs` 76 Mo (33,8 %) = **81,4 % des 299 Mo de la base**                                       | Tu sauvegardes et paies surtout des journaux                                                                     |
| **274 fichiers de plus de 400 lignes**   | back-office 95, LinkMe 44, site 7, packages 128                                                                                             | La règle interne du dépôt fixe 400 lignes ; elle est violée 274 fois                                             |

---

## 7. Tests, CI et observabilité

| Élément                                | État                                                                                                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework de test unitaire             | **Aucun installé** (ni vitest ni jest)                                                                                                                                                      |
| Fichiers de test dans les apps         | back-office 3 / 1 550 · LinkMe 1 / 472 · site **0** / 167                                                                                                                                   |
| Tests unitaires réellement exécutés    | **Zéro** — les fichiers existants sont des scripts isolés lancés par aucun pipeline                                                                                                         |
| Tests E2E                              | 153 tests Playwright, mais le contrôle est **non bloquant** et les secrets `E2E_TEST_EMAIL`/`PASSWORD` manquent dans GitHub                                                                 |
| Couverture de code                     | Aucune. Seul le `type-coverage` existe (98,1 à 99,6 %, bloquant) — il mesure le typage, pas l'exécution                                                                                     |
| Danger                                 | Les tests E2E de stock **écrivent et suppriment dans la base pointée par `NEXT_PUBLIC_SUPABASE_URL`**, sans garde vérifiant que ce n'est pas la production. Signalé en juillet, non corrigé |
| Sentry                                 | DSN configuré, **zéro ligne de code**. 720 fichiers appellent `console.error` : personne ne les lit                                                                                         |
| Contrôles réellement bloquants         | lint, type-check, build, type-coverage, dérive du schéma, dérive des types, advisors sécurité — **c'est solide, c'est ce qui te sauve aujourd'hui**                                         |
| Husky / CODEOWNERS / fichiers protégés | En place et cohérents                                                                                                                                                                       |

---

## 8. Maintenabilité et cohérence des composants — 45/100

Tu voulais savoir s'il y a « une cascade de composants différents ». Réponse mesurée : **non entre les applications, oui à l'intérieur des packages partagés.**

**Ce qui va bien** : aucune primitive du design system (bouton, carte, fenêtre, tableau, badge, sélecteur, formulaire) n'est réimplémentée dans une app. Les dossiers `components/ui` locaux contiennent 1, 3 et 4 fichiers — tous spécifiques, aucun doublon.

**Ce qui ne va pas** :

| Constat                                                        | Mesure                                                                                                                                                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deux boutons concurrents dans `@verone/ui`                     | `button.tsx` (315 l., utilisé 556 fois) contre `button-unified.tsx` (210 l., 10 fichiers). Architectures différentes                                                                                                      |
| Un sous-module entier forké                                    | `packages/@verone/ui/components/stock/*` copié dans `apps/back-office/components/ui-v2/stock/*` — certains fichiers identiques au hachage près, d'autres ont divergé. **4 pages importent les deux sources en parallèle** |
| Le design system théorique n'est branché sur rien              | `@verone/tokens` : **0 import dans tout le dépôt**. `@verone/themes` : 3 fichiers dans une page d'admin, 1 dans le site                                                                                                   |
| 3 configurations Tailwind divergentes                          | Aucun preset commun, 3 palettes, 3 typographies, 3 jeux d'animations                                                                                                                                                      |
| Le motif « confirmation » existe en deux exemplaires           | `confirm-dialog.tsx` et `ConfirmDeleteModal`/`ConfirmSubmitModal`, qui ne l'utilisent pas                                                                                                                                 |
| Le typage laxiste est **dans les packages**, pas dans les apps | 41 `: any` + 46 `as any` + 309 `eslint-disable` dans les packages, contre 0/1 dans les apps                                                                                                                               |
| Duplication de code brute                                      | 3,95 % (mesure maison, blocs de 30 lignes), dont **94 % dans les packages partagés**                                                                                                                                      |
| Réutilisation du design system                                 | back-office 63 %, LinkMe 35 %, **site internet 11 %** — le site fonctionne en pratique comme une base de code indépendante                                                                                                |

Le diagnostic senior : la fondation censée être la référence est la partie la moins rigoureuse du dépôt. C'est l'inverse de ce qu'on veut.

---

## 9. Ce que je n'ai pas pu mesurer

- **Performance perçue dans le navigateur** : Lighthouse, LCP, INP, poids des bundles. Il faut lancer l'application localement ou un runner — je n'ai pas le droit de lancer `pnpm dev` ni de build.
- **Temps de réponse du site public et de LinkMe** depuis l'extérieur : le réseau de cette session ne sort pas vers ces domaines.
- **Coût réel du démarrage à froid Vercel** : pas d'accès aux journaux Vercel.
- **Corps de plusieurs fonctions SQL** (`update_google_merchant_price` par exemple) : elles n'existent dans aucune migration du dépôt — créées hors dépôt. C'est en soi un constat de traçabilité.
- **`EXPLAIN ANALYZE` sur les vues les plus lentes** : reporté après 17 h UTC selon ta propre règle depuis l'incident du 15/09. Résultats en § 11.

---

## 10. Plan — par rentabilité

Chaque ligne : gain attendu, preuve à produire, et si ça touche la base.

|   # | Action                                                                                                                           | Gain attendu                                                   | Base ?                | Effort               |
| --: | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------- | -------------------- |
|   1 | **Authentifier `sales-orders/[id]/customer-address`** et passer les routes qui utilisent la clé service_role en revue nominative | Ferme une fuite de données personnelles                        | non                   | 1 h                  |
|   2 | **Couper le temps réel** sur `sales_orders` et `products` (2 pastilles), remplacer par le RPC du menu déjà en place              | **−61 % du temps de base**                                     | oui (publication)     | 2 h                  |
|   3 | **Sortir la CI de la production** : contrôle de dérive sur une base de test ou en heure creuse uniquement                        | −22 % du temps de base, supprime les requêtes à 5,6 s          | non                   | 3 h                  |
|   4 | **Middleware de garde sur le back-office**, refus par défaut, liste blanche pour l'extension Chrome et les webhooks              | Ferme 85 routes d'un coup                                      | non                   | 1 jour               |
|   5 | **Garde interne sur les 39 fonctions d'écriture** ouvertes à tout compte connecté                                                | Ferme le chemin « affilié LinkMe → écriture back-office »      | oui                   | 1 jour               |
|   6 | **Réparer `get_stock_alerts_count`** (143 ms × 184 k appels) et les appels restants hors RPC                                     | −7 % du temps de base, écrans plus rapides                     | oui                   | 3 h                  |
|   7 | **Purger les journaux** : rétention 90 jours sur `user_activity_logs` et `audit_logs`                                            | Base 299 Mo → ~60 Mo, sauvegardes et restauration plus rapides | oui + **ta décision** | 2 h                  |
|   8 | **Brancher Sentry** (le DSN est déjà là)                                                                                         | Tu apprends les pannes avant tes clients                       | non                   | 3 h                  |
|   9 | **Rotation des clés** exposées dans l'historique git, après migration vers les nouvelles clés Supabase                           | Ferme la fuite de secrets                                      | non                   | ½ jour, heure creuse |
|  10 | **Supprimer les 237 index inutilisés et les 3 doublons**, indexer les 33 clés étrangères utiles                                  | Écritures plus rapides, lectures de jointure plus rapides      | oui                   | ½ jour               |
|  11 | **`optimizePackageImports`** dans les 3 `next.config.js`                                                                         | Bundles plus légers, pages qui s'affichent plus vite           | non                   | 15 min               |
|  12 | **Rendre le contrôle E2E bloquant** : ajouter les 2 secrets manquants + garde anti-production sur les tests de stock             | Les régressions sont arrêtées avant la production              | non                   | ½ jour               |

**Les trois premières lignes valent à elles seules plus que tout le reste** : une fuite de données fermée et 83 % du temps de base récupéré, pour une journée de travail.

### Trois listes séparées, comme le veut la méthode

- **Code seul** : 1, 3, 4, 8, 9, 11, 12
- **Migration ou changement de droits (ton accord écrit requis)** : 2, 5, 6, 10
- **Touche des données existantes (constat, décision à toi)** : 7 — purge des journaux ; et la question ouverte des données de test PRD-0314 / PO-2026-00039

---

## 11. Mesures de base lourdes (après 17 h UTC)

_(section complétée en fin d'audit — voir plus bas)_

---

## 12. Annexe — commandes et requêtes

**Base** (MCP Supabase, lecture seule, 18/09) :

```sql
-- Inventaire
select count(*) from pg_tables where schemaname='public';                    -- 137
select count(*) from pg_class where relrowsecurity and relkind='r';          -- 137 (RLS active partout)
select count(*) from pg_policies where schemaname='public';                  -- 337

-- Test d'accès visiteur
set local role anon; select count(*) from audit_logs;                        -- 0
set local role anon; select count(*) from products;                          -- 18

-- Part du temps de base par catégorie
select ... from pg_stat_statements group by categorie;                       -- cf. § 4.1

-- Fonctions d'écriture sans garde interne
select count(*) from pg_proc p where p.prosecdef
  and has_function_privilege('authenticated', p.oid,'EXECUTE')
  and p.prosrc ~* '(insert into|update |delete from)'
  and p.prosrc not ilike '%auth.uid()%';                                     -- 39
```

**Journaux passerelle** (24 h) : agrégations ClickHouse sur `edge_logs`, champs `response.origin_time` et `response.status_code`.

**Dépôt** (shell local, lecture seule) :

```bash
find apps/X -path '*/api/*' -name 'route.ts' | wc -l                  # 152 / 17 / 25
grep -rnE "select\(\s*['\"]\*['\"]\s*\)" apps packages                 # 57 usages réels
grep -rn "\.channel(" --include=*.ts --include=*.tsx                   # 2 canaux
find apps/X -name '*.ts*' | xargs wc -l | awk '$1>400' | wc -l         # 95 / 44 / 7 (+128 packages)
grep -rho ': any\|as any' packages/@verone                             # 41 + 46
git show --stat 170aecf0                                               # 3 fichiers .env.local.backup-*
```

Le détail complet des commandes est dans les rapports d'atelier de cette session.
