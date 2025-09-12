#### **Synchronisation Automatique via Triggers PostgreSQL**

Pour maintenir la cohérence entre auth.users et public.profiles, l'utilisation de triggers PostgreSQL est la solution recommandée et la plus robuste.25

* Un **trigger AFTER INSERT ON auth.users** peut être créé pour insérer automatiquement une nouvelle entrée dans public.profiles chaque fois qu'un nouvel utilisateur s'inscrit via Supabase Auth.25 La fonction de trigger associée peut récupérer l'ID du nouvel utilisateur (  
  NEW.id), son email (NEW.email) et d'autres métadonnées fournies lors de l'inscription (par exemple, NEW.raw\_user\_meta\_data-\>\>'username') pour les insérer dans la table profiles.26  
* De même, un **trigger AFTER UPDATE ON auth.users** peut être mis en place pour mettre à jour les champs correspondants dans public.profiles si les métadonnées de l'utilisateur changent dans la table auth.users.25  
* Inversement, un **trigger BEFORE UPDATE ON public.profiles** peut synchroniser les changements de champs spécifiques de public.profiles vers auth.users.raw\_user\_meta\_data (par exemple, terms\_accepted\_at).25

Il est crucial que ces triggers soient définis comme SECURITY DEFINER et qu'ils utilisent un search\_path sécurisé pour éviter tout abus et garantir qu'ils s'exécutent avec les privilèges appropriés sans exposition à des vulnérabilités.25

## **5\. Développement d'Applications Next.js 15 avec Supabase**

Le développement d'applications avec Next.js 15 et Supabase tire parti des dernières avancées en matière d'architecture web pour créer des expériences utilisateur rapides et sécurisées.

### **5.1. Architecture Next.js 15 (App Router)**

Next.js 15, avec son App Router, introduit une architecture flexible et performante, notamment grâce à la distinction entre Server Components et Client Components.

#### **Composants Serveur et Client : Quand Utiliser Quoi?**

L'App Router de Next.js 13 et les versions ultérieures (y compris Next.js 15\) prennent en charge les Server Components (RSC) et les Client Components.40 Par défaut, tout est rendu côté serveur.42

* Les **Server Components** sont exécutés sur le serveur. Ils sont idéaux pour le fetching de données, l'exécution de logique métier sensible et les opérations directes avec la base de données. Ils ne peuvent pas accéder aux APIs du navigateur (comme window ou localStorage).40 Leur utilisation améliore les performances en réduisant la quantité de JavaScript envoyée au client.43  
* Les **Client Components** sont explicitement marqués avec la directive 'use client' en haut du fichier.40 Ils sont utilisés pour l'interactivité, les hooks React (tels que  
  useState et useEffect) et les événements du navigateur.40

Une bonne pratique fondamentale consiste à séparer clairement la logique serveur et client. Les Server Actions, qui sont des fonctions exécutées sur le serveur en réponse à un événement client (comme la soumission d'un formulaire), doivent être pures, prévisibles et ne jamais contenir de code client.40

La distinction entre Server et Client Components dans Next.js 15, via l'App Router, introduit une nouvelle dimension de complexité dans la gestion de l'état. Les Server Components, par leur nature, ne peuvent pas utiliser les hooks React traditionnels (useState, useEffect) ni les APIs du navigateur, ce qui signifie que des bibliothèques de gestion d'état client comme Zustand ne fonctionneront pas directement en leur sein.40 Cette contrainte force une séparation claire des préoccupations : l'état serveur (géré par le fetching de données via Server Actions ou la fonction

fetch dans des Server Components ou Route Handlers) et l'état client (géré par Zustand ou useState dans des Client Components marqués 'use client'). Une mauvaise séparation peut entraîner des erreurs silencieuses, une dégradation des performances ou des vulnérabilités de sécurité, par exemple en exposant des données sensibles côté client. Le package @supabase/ssr et l'utilisation de middlewares pour rafraîchir les tokens d'authentification dans les cookies sont des solutions spécifiques conçues pour gérer la complexité de l'authentification dans cet environnement hybride.45

#### **Routage (File-Based, Dynamique, Groupé)**

Next.js simplifie le routage grâce à des conventions basées sur le système de fichiers :

* Le **File-Based Routing** signifie que les routes sont définies automatiquement par la structure des dossiers dans le répertoire app/.2  
* Le **Dynamic Routing** permet de créer des routes qui capturent des paramètres dynamiques en utilisant des noms de fichiers comme \[id\].js ou \[slug\]/page.js.2  
* Le **Group Routing** permet de regrouper des routes liées en utilisant des structures de dossiers comme app/(group)/ pour améliorer la maintenabilité du projet.2  
* Les **API Routes** sont des fichiers situés sous pages/api/ ou app/api/route.js qui agissent comme des endpoints backend. Ils permettent d'interagir avec la base de données et d'exécuter de la logique côté serveur.2

### **5.2. Intégration Supabase Client**

L'intégration de Supabase dans une application Next.js est un processus direct.

#### **Configuration et Initialisation**

Pour commencer, il faut installer la bibliothèque client Supabase : npm install @supabase/supabase-js.2 Ensuite, le client Supabase doit être initialisé en utilisant les variables d'environnement

NEXT\_PUBLIC\_SUPABASE\_URL et NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY.2 Pour la gestion de l'authentification côté serveur dans l'App Router, le package

@supabase/ssr est recommandé car il gère les sessions utilisateur via les cookies, assurant une intégration fluide et sécurisée.2

#### **Accès aux Données via API Routes et Server Actions**

Next.js offre plusieurs façons d'interagir avec Supabase :

* Les **API Routes** permettent de définir la logique côté serveur pour les opérations CRUD (Create, Read, Update, Delete) avec Supabase.2 Par exemple, un fichier  
  pages/api/getUsers.js peut contenir la logique pour récupérer des utilisateurs via supabase.from('users').select('\*').2  
* Les **Server Actions** (introduites dans Next.js 15\) permettent d'appeler directement des fonctions de base de données (par exemple, prisma.user.create()) depuis les composants React. Il est crucial de se rappeler que ces actions s'exécutent sur le serveur.40 Pour des raisons de sécurité, toutes les entrées doivent être validées côté serveur, et il ne faut jamais faire confiance directement aux données provenant du client.40 En termes d'organisation, il est préférable de définir les Server Actions dans leurs propres modules (par exemple, dans un répertoire  
  actions/) et de les appeler depuis les Client Components, plutôt que de les déclarer directement à l'intérieur de ces derniers.40

### **5.3. Gestion d'État Frontend**

Une gestion d'état efficace est essentielle pour des applications frontend réactives et performantes.

#### **TanStack Query : Gestion des Requêtes et Mutations**

TanStack Query (anciennement React Query) est une bibliothèque incontournable pour la gestion de l'état serveur. Elle simplifie considérablement le fetching, le caching, la synchronisation et la mise à jour des données asynchrones dans les applications web.47

* Le hook useQuery est utilisé pour la récupération de données.  
* Le hook useMutation est conçu pour les opérations de création, mise à jour ou suppression de données, ainsi que pour les effets de bord côté serveur.48  
  * Le **flux de mutation** permet d'utiliser les options onSuccess, onError et onSettled pour gérer les effets de bord après l'exécution d'une mutation.48  
  * Pour la **mise à jour du cache** après une mutation, invalidateQueries (qui force une nouvelle récupération des données) ou setQueryData (qui permet de mettre à jour directement le cache) sont des outils puissants pour maintenir la cohérence de l'interface utilisateur.48  
  * Les **mises à jour optimistes** sont une technique avancée qui permet de mettre à jour l'interface utilisateur immédiatement après une action de l'utilisateur, avant même de recevoir la réponse du serveur. Cela améliore considérablement la perception de la réactivité et l'expérience utilisateur.49  
  * La fonction mutateAsync est utile pour les cas où une promesse est nécessaire pour composer des effets de bord séquentiels.48

L'optimisation de l'expérience utilisateur par la gestion intelligente du cache et des mutations est un aspect crucial. TanStack Query va au-delà du simple fetching de données ; il s'agit de gérer l'état serveur de manière à optimiser l'UX. Les "optimistic updates" 49 et les stratégies de revalidation (

invalidateQueries vs setQueryData) 48 permettent de rendre l'application plus réactive et plus rapide aux yeux de l'utilisateur. Cela réduit le temps d'attente perçu et améliore la fluidité de l'interface, même si les opérations réseau prennent du temps. C'est une application directe du principe "Make it fast" de Kent Beck. L'intégration de TanStack Query n'est pas seulement une commodité, mais une stratégie de performance et d'UX. Une bonne gestion du cache et des mutations peut avoir un impact direct sur la satisfaction de l'utilisateur et l'efficacité de l'application, en minimisant les données "obsolètes" et les requêtes redondantes.47

#### **Zustand : Patterns et Pièges pour la Gestion d'État Global**

Zustand est un gestionnaire d'état léger et efficace pour React, connu pour sa simplicité et sa petite taille.50

* **Bonnes Pratiques :** Il est recommandé de concevoir des stores petits et focalisés, chacun gérant une partie spécifique de l'état.50 Les actions doivent être modélisées comme des événements et contenir la logique métier, plutôt que de laisser cette logique dans les composants.50 L'utilisation de sélecteurs atomiques aide à prévenir les re-renders inutiles des composants.50 L'encapsulation des hooks et l'utilisation de middlewares (comme Immer pour la mutabilité simplifiée, Persist pour le stockage local automatique, et DevTools pour l'intégration avec les outils de débogage Redux) sont également des pratiques bénéfiques.50  
* **Pièges :** Il est crucial de ne pas stocker de données sensibles (comme les tokens d'authentification) directement dans l'état global côté client, car cela pourrait entraîner des fuites de données.44 Il faut également se rappeler que Zustand est une bibliothèque destinée aux Client Components React (  
  'use client') et ne fonctionne pas directement dans les Server Components.44

### **5.4. Composants UI avec Shadcn/ui : Bonnes Pratiques d'Intégration**

Shadcn/ui offre une approche flexible et personnalisable pour le développement d'interfaces utilisateur, s'intégrant parfaitement avec Tailwind CSS.43

* **Structure de Projet Propre :** Il est recommandé d'organiser les composants Shadcn/ui dans un répertoire dédié (/components/ui) et de séparer clairement les composants UI de la logique métier pour maintenir la clarté et la maintenabilité du projet.43  
* **Classes Utilitaire Tailwind :** Utiliser les classes utilitaires de Tailwind pour le style est la meilleure pratique, en évitant les styles inline, pour assurer la cohérence et la performance.43  
* **Optimisation pour Server Components :** Pour de meilleures performances, les composants Shadcn/ui doivent être utilisés à l'intérieur des Server Components chaque fois que possible, afin de minimiser le rendu côté client inutile.43  
* **Slots de Composants :** Tirer parti de la composition basée sur les slots, offerte par de nombreux composants Shadcn/ui, rend ces derniers plus réutilisables et flexibles.43  
* **Variantes pour la Flexibilité :** Étendre les composants avec des variantes Tailwind permet de créer des variations personnalisables de manière propre et maintenable.43  
* **Accessibilité (a11y) :** Il est essentiel de s'assurer que les composants supportent la navigation au clavier, les lecteurs d'écran et les attributs ARIA pour garantir la conformité en matière d'accessibilité. Des outils comme Axe DevTools peuvent aider à tester cette conformité.43  
* **Mises à Jour Régulières :** Maintenir les composants Shadcn/ui à jour (npx shadcn-ui@latest update \<component\>) permet de bénéficier des dernières améliorations et optimisations.43

## **6\. Feuille de Route "Senior-Dev" pour une Application SaaS Immobilière**

La feuille de route d'un développeur senior pour une application SaaS immobilière robuste est une application concrète des principes de développement agiles et de la philosophie "Database-as-Source-of-Truth". Elle structure le processus de développement en phases claires, garantissant une progression itérative et sécurisée.

### **6.1. Phases de Développement Détaillées**

La feuille de route est divisée en plusieurs phases, chacune avec des objectifs, des livrables et des outils spécifiques.

#### **Phase 0 – Boot (Outillage & CI/CD)**

Cette phase initiale est dédiée à la mise en place de l'environnement de développement et des outils fondamentaux. L'objectif est d'établir les "conventions" initiales (Convention over Configuration) pour le projet, assurant une base cohérente et maintenable. Cela inclut la création d'un dépôt GitHub, la configuration de Turborepo pour une architecture monorepo, l'installation d'ESLint et Prettier pour la qualité du code, et l'intégration de shadcn/ui. L'installation de Shadcn/ui dès cette phase permet de partager un socle UI/Data commun à travers l'application.43 Un projet Supabase vide est également initialisé. Les outils clés pour cette phase sont Node 20, pnpm, Vercel pour le déploiement continu, et le Supabase CLI pour la gestion de la base de données.29

#### **Phase 1 – Core DB (Briques “Owners ⇄ Shareholders ⇄ Properties ⇄ Units”)**

L'objectif de cette phase est de définir le cœur du modèle de données de l'application immobilière. C'est ici que le principe "Database-as-Source-of-Truth" est appliqué en priorité, combiné à l'approche "Vertical Slice First". Les livrables clés comprennent le Data Definition Language (DDL) pour les tables principales (Owners, Shareholders, Properties, Units), les migrations de base de données gérées via le Supabase CLI, la mise en place de la Row-Level Security (RLS) pour un accès granulaire, et l'écriture de tests pgTAP pour valider la logique de la base de données. La RLS est obligatoire et doit être basée sur l'user\_id puis le tenant\_id pour les applications multi-tenant.34 Les migrations doivent être idempotentes et testées par

pgTAP pour garantir la fiabilité des déploiements.30 Les outils utilisés sont Supabase SQL et un environnement de base de données PostgreSQL (par exemple, MCP server-postgres).

#### **Phase 2 – Shared UI (Layout, Sidebar, Theme, Auth stub)**

Cette phase vise à établir l'architecture UI partagée et à intégrer l'authentification de base. Les livrables comprennent la création d'un \<AppShell\> (le layout principal de l'application), une Sidebar, un thème UI (utilisant Tailwind CSS 43), et un "Auth stub" pour l'intégration de base de l'authentification Supabase.2 Des bibliothèques comme Headless UI, Zustand (pour la gestion de l'état global 50) et Tanstack Query (pour la gestion des requêtes de données 47) sont mises en place. Les outils principaux sont Next.js 14 (ou 15), shadcn/ui et Tailwind CSS 3\. Cette phase prépare le terrain pour les futures "vertical slices" en fournissant un squelette UI cohérent et en intégrant les mécanismes de gestion d'état et de données côté client.

#### **Phase 3 – Vertical Slices (x n)**

C'est la phase où la majeure partie du développement des fonctionnalités a lieu, en appliquant rigoureusement le principe de "vertical slice". L'objectif est de développer les fonctionnalités page par page. Chaque "slice" représente une fonctionnalité complète, allant des données à l'API, à l'interface utilisateur et aux tests.3 Les livrables clés incluent des pages comme la liste des propriétaires, un assistant de création/modification/suppression (CRUD) de propriétaires, et des vues détaillées des propriétaires avec des onglets. Chaque page est associée à une table spécifique et inclut les hooks, l'UI et les tests nécessaires. Les prompts Cursor et les tests Cypress E2E sont utilisés pour cette phase. Les prompts AI (Cursor/MCP) sont utilisés comme des spécifications fonctionnelles pour générer le code, permettant une livraison incrémentale de valeur.

#### **Phase 4 – Cross-cutting (Dashboard, RBAC, i18n, Accessibility)**

Cette phase se concentre sur l'implémentation des fonctionnalités transversales et de l'accès basé sur les rôles. Les livrables clés incluent des widgets de tableau de bord (KPI), la mise en œuvre de la RLS granulaire basée sur les rôles et les tenants, et des rapports d'accessibilité. Les outils utilisés sont les politiques Supabase (pour la RLS) et axe-playwright pour les tests d'accessibilité. Cette phase renforce la sécurité (RLS) et l'expérience utilisateur (accessibilité, internationalisation), avec une attention particulière à l'implémentation du RBAC s'appuyant sur des rôles personnalisés et des politiques RLS avancées.32

#### **Phase 5 – Polish & Ops (Observability & Cost)**

La dernière phase vise l'optimisation, la surveillance et la préparation de l'application pour une production à grande échelle. L'objectif est d'assurer la stabilité, la performance et la résilience du système en production. Les livrables clés incluent la mise en place d'OpenTelemetry pour la télémétrie, pgbouncer pour la gestion des connexions à la base de données, et des stratégies de sauvegarde Supabase. Les outils utilisés sont Grafana et Sentry pour la surveillance, ainsi que pg\_stat\_statements pour l'analyse des requêtes lentes.1 La surveillance des requêtes lentes via

pg\_stat\_statements est cruciale pour l'optimisation continue.1

La feuille de route "senior-dev" n'est pas une simple liste de tâches, mais une application structurée des principes clés du développement logiciel. Les phases 0 à 2 établissent les fondations (Convention over Configuration, Database-as-Source-of-Truth, outillage) avant de passer aux phases 3 et suivantes qui sont des "vertical slices" (approche itérative). L'ordre des phases, qui privilégie le noyau de la base de données avant l'interface utilisateur partagée, puis les tranches fonctionnelles, reflète la primauté de la base de données comme source de vérité et la nécessité de valider la logique métier au niveau le plus bas de la pile avant de construire l'interface utilisateur. Cette feuille de route est un modèle pour la gestion de projet et l'architecture, démontrant comment des principes abstraits se traduisent en étapes de développement concrètes et séquencées. Elle souligne l'importance de "verrouiller un petit périmètre" (données ↔ API ↔ UI) pour chaque itération, réduisant ainsi les risques et permettant une livraison incrémentale de valeur.

Le tableau suivant synthétise la feuille de route, offrant une vue d'ensemble claire des étapes et de leur alignement avec les principes fondamentaux. Il aide à visualiser la progression du projet et à comprendre la logique derrière la séquence des phases.

| Phase | Objectif Principal | Livrables Clés | Outils Principaux | Principes Directeurs Appliqués |
| :---- | :---- | :---- | :---- | :---- |
| **0 – Boot** | Mettre en place l'environnement et les outils fondamentaux. | Repo GitHub, Turborepo, ESLint, Prettier, shadcn/ui install, Supabase projet vide. | Node 20, pnpm, Vercel, Supabase CLI. | Convention over Configuration, Itératif. |
| **1 – Core DB** | Définir le cœur du modèle de données de l'application. | DDL, migrations, RLS, tests pgTAP pour Owners, Shareholders, Properties, Units. | Supabase SQL, MCP server-postgres. | Database-as-Source-of-Truth, Vertical Slice First. |
| **2 – Shared UI** | Mettre en place l'architecture UI partagée et l'authentification. | \<AppShell\>, Sidebar, Theme, Auth stub, Headless UI, Zustand store, tanstack query client. | Next.js 14/15, shadcn/ui, tailwind 3\. | Convention over Configuration, Itératif. |
| **3 – Vertical Slices (x n)** | Développer les fonctionnalités page par page. | Pages spécifiques (ex: Owners list, CRUD), hooks, UI, tests pour chaque tranche. | Prompts Cursor, Cypress E2E. | Vertical Slice First, Prompt Engineering \= Specs Fonctionnelles. |
| **4 – Cross-cutting** | Implémenter les fonctionnalités transversales et le RBAC. | Widgets KPI, RLS granulaire (rôles/tenants), rapport d'accessibilité. | Politiques Supabase (RLS), axe-playwright. | Row-Level Security, RBAC. |
| **5 – Polish & Ops** | Optimisation, surveillance et préparation à la production. | OpenTelemetry, pgbouncer, sauvegardes Supabase. | Grafana, Sentry, pg\_stat\_statements. | Observabilité, Scalabilité. |

### **6.2. Stratégie de Dialogue avec les Assistants IA (MCP / Cursor)**

Les outils d'intelligence artificielle comme MCP et Cursor sont des assistants puissants pour la génération de code, mais leur efficacité dépend directement de la précision et de la clarté des instructions fournies.

#### **Rôle de l'IA**

L'IA est un outil de génération de code qui amplifie la productivité des développeurs, mais elle nécessite une direction précise pour produire des résultats pertinents et fiables.11 Elle excelle dans la transformation d'instructions en requêtes SQL complexes ou dans l'optimisation de code existant.54

#### **Principes de Prompting**

Pour maximiser l'efficacité de l'IA, il est essentiel de structurer les prompts selon des principes clairs 11 :

* **Contexte :** Fournir un contexte métier et technique détaillé. Par exemple, décrire l'application comme un "SaaS multi-tenant qui gère propriétaires, actionnariat, biens, unités locatives, bookings & paiements".11  
* **Contraintes :** Spécifier les règles strictes et les exigences techniques. Cela inclut des éléments comme "Row Level Security obligatoire, basé sur user\_id puis sur tenant\_id", "les quotes-parts ne dépassent jamais 100 %", et "migrations idempotentes, testées par pgTAP".11  
* **Tâche :** Décrire clairement la tâche à accomplir. Un exemple pourrait être "générer (ou mettre à jour) la table properties, la table units et le pivot property\_ownership, avec déclencheurs de somme ≤ 100 % \+ indexes \+ seed minimal".11  
* **Critère d’Acceptation :** Indiquer précisément ce qui constitue un succès ou une livraison acceptable, comme "Demande-moi validation avant de toucher la prod".11

La longueur des prompts est également un facteur important : 150 à 300 mots sont souvent suffisants. Des prompts plus longs peuvent introduire des ambiguïtés pour le LLM, réduisant ainsi la qualité de la réponse. La spécificité et la concision sont donc des vertus clés.11

#### **Rôle de l'Humain**

Malgré l'aide de l'IA, le développeur humain conserve la responsabilité finale de la validation, de l'intégration et des tests du code généré. L'IA génère, mais l'humain valide et affine.53

L'utilisation de gabarits de prompt structurés (Contexte → Contraintes → Tâche → Critère d’Acceptation) transforme l'interaction avec l'IA d'une simple génération de code à une forme de spécification fonctionnelle incrémentale et testable.11 En demandant explicitement des livrables (migrations SQL, hooks, composants, tests) et une validation avant exécution, un mécanisme de contrôle qualité et de "test-driven development" est intégré directement dans le dialogue avec l'IA. Cela permet de "cacher les problèmes avant qu'ils ne s'aggravent".53 L'ingénierie de prompt n'est pas seulement une astuce pour obtenir du code, mais une compétence essentielle pour les développeurs seniors afin de diriger efficacement les outils d'IA, de garantir la qualité du code généré et d'intégrer l'IA dans un workflow de développement robuste et sûr.

Le tableau suivant est crucial pour le "manuel" car il fournit un guide pratique et réutilisable pour interagir avec les assistants IA. Il décompose la structure d'un prompt efficace, expliquant la raison d'être de chaque élément, ce qui est essentiel pour maximiser la qualité et la pertinence du code généré.

| Section du Prompt | Description | Exemples | Raison d'être (Pourquoi cette section est importante pour l'IA) |
| :---- | :---- | :---- | :---- |
| **\# \[Feature\]** | Titre concis et clair de la fonctionnalité à développer. | \# \[Feature\] Gestion des Propriétés | Donne un focus clair à l'IA, définissant le périmètre de la tâche. |
| **\#\# Contexte** | Fournit des informations métier et techniques essentielles pour que l'IA comprenne le domaine. | Application SaaS multi-tenant pour la gestion immobilière. Tables concernées : properties, units, property\_ownership. | Permet à l'IA de générer du code pertinent et adapté au domaine, évitant les solutions génériques. |
| **\#\# Objectif** | Décrit l'action ou le résultat attendu de la tâche. | CRUD complet pour les propriétés, incluant la gestion des unités locatives et des actionnaires. | Guide l'IA vers le type de logique à implémenter (création, lecture, mise à jour, suppression, agrégation, etc.). |
| **\#\# Contraintes** | Liste les règles strictes, les exigences de sécurité, de performance ou d'architecture. | \- RLS user/tenant obligatoire \- Les quotes-parts ne dépassent jamais 100 % \- Migrations SQL idempotentes et testées par pgTAP | Limite les "hallucinations" de l'IA et garantit que le code généré respecte les exigences non fonctionnelles critiques. |
| **\#\# Livraison attendue** | Spécifie les artefacts de code et les étapes de validation attendus. | 1\. SQL migration (filename) 2\. Seed minimal 3\. Hook React (api/\<feature\>.ts) 4\. Composant shadcn/ui prêt à brancher 5\. 2 tests Jest \+ 1 test Cypress \-\> Demande-moi “ok pour exécuter” avant la migration | Structure la réponse de l'IA, facilite l'intégration dans le workflow de développement et intègre des points de contrôle qualité. |

## **7\. Erreurs Courantes et Stratégies avec les Assistants IA (Cursor, MCP Claude Code)**

L'intégration des assistants IA comme Cursor et MCP Claude Code dans le processus de développement offre des gains de productivité significatifs, mais elle s'accompagne de pièges spécifiques, notamment en matière de développement de bases de données. Comprendre ces erreurs et adopter des stratégies proactives est essentiel pour les développeurs.

### **7.1. Pièges des Générateurs de Code IA**

Les grands modèles linguistiques (LLM) sont des "machines à pattern-matching" qui, bien que puissantes, peuvent "halluciner" des solutions qui semblent plausibles mais sont inexistantes ou générer du code inutilement complexe pour des problèmes simples.53 Cela peut entraîner des "boucles infernales de débogage", où la correction d'une erreur en introduit de nouvelles.53

Les limites fondamentales des LLM et leur impact sur la fiabilité sont un point crucial. Les "hallucinations" et les "solutions inutiles" des LLM ne sont pas des bugs mineurs, mais une conséquence directe de leur nature de "machines à pattern-matching" qui ne "comprennent" pas le contexte ou la logique profonde comme un humain.53 Cela signifie que l'IA peut produire du code syntaxiquement correct mais logiquement défaillant ou non sécurisé, car son "savoir" est basé sur des données d'entraînement qui peuvent être obsolètes ou incorrectes.55 Cela implique que la confiance aveugle en l'IA est dangereuse. Le rôle du développeur évolue vers celui d'un "pilote" ou d'un "architecte" qui dirige l'IA avec des spécifications précises, valide ses sorties et maintient la responsabilité finale du code. L'IA est un amplificateur, pas un substitut à l'expertise humaine.

Un problème majeur réside dans le **manque de contexte** de l'IA. Elle peut suggérer des bibliothèques obsolètes ou des recommandations qui violent les meilleures pratiques ou les protocoles de sécurité, car son entraînement se base sur des bases de code publiques dont la qualité et la fiabilité ne sont pas garanties.55

Des **risques de sécurité et de fuites de propriété intellectuelle** sont également présents. Les assistants IA peuvent générer du code non sécurisé, utiliser des dépendances non sûres ou mal gérer les données sensibles.55 Il existe un risque que l'IA renvoie le code de l'utilisateur à ses serveurs pour traitement, exposant potentiellement des clés API, des identifiants ou des algorithmes propriétaires.55 Pour atténuer ce risque, des fichiers sensibles peuvent être exclus via des

.cursorignore.57 Les modèles peuvent également stocker le code soumis 56, ce qui soulève des problèmes de conformité (par exemple, GDPR, HIPAA).56

La nécessité d'une stratégie de sécurité multicouche face aux risques de l'IA est primordiale. Les risques de sécurité liés à l'IA (fuite d'IP, code non sécurisé, conformité) sont exacerbés par la nature "boîte noire" de certains modèles et leur accès potentiel à des données sensibles.55 Cela renforce l'argument en faveur d'une sécurité multicouche. Par exemple, même si l'IA génère une politique RLS imparfaite, la "défense en profondeur" (RLS activé par défaut, validation manuelle, tests pgTAP) peut atténuer le risque. L'utilisation de

.cursorignore 57 est une mesure proactive pour protéger la propriété intellectuelle. Au-delà des bonnes pratiques de code, les entreprises doivent établir des politiques claires sur l'utilisation des outils d'IA, implémenter des règles de prévention de perte de données (DLP) et maintenir une vigilance constante sur les données transmises aux services d'IA. La sécurité doit être intégrée à chaque étape du workflow de développement assisté par l'IA.

Une **dépendance excessive** à l'IA peut réduire la compétence des développeurs, en particulier les juniors, qui pourraient se sentir incapables d'écrire du code de base sans l'aide de l'IA.55 Enfin, des

**problèmes d'intégration** peuvent survenir, l'IA générant parfois du code qui crée des incohérences de style ou de logique au sein d'une équipe.55 Des problèmes tels que les "race conditions", les incompatibilités d'endpoints API, les déséquilibres de schémas de base de données, la gestion des variables d'environnement et les problèmes de gestion des dépendances sont des défis courants.58

### **7.2. Erreurs Spécifiques aux Bases de Données (SQL, Schéma, RLS)**

Les assistants IA peuvent commettre des erreurs spécifiques au contexte des bases de données.

#### **Erreurs SQL**

* **Syntaxe :** Des fautes de frappe dans les mots-clés, des virgules ou des parenthèses manquantes.59  
* **Logique :** Utilisation d'opérateurs incorrects, de JOINs erronés ou de conditions brisées.59  
* **Référence :** Références à des tables ou des colonnes manquantes, ou à des champs mal nommés.59  
* **Mots-clés réservés :** Utilisation de mots-clés SQL réservés (comme USER ou ORDER) comme noms de colonnes ou d'alias sans utiliser la clause AS.60  
* **DISTINCT :** Une mauvaise compréhension de l'application de DISTINCT à une seule colonne au lieu de l'ensemble de la sélection.60  
* **LIMIT vs RANK() :** Utilisation incorrecte de LIMIT pour des problèmes de classement où RANK() ou DENSE\_RANK() seraient plus appropriés.60

#### **Erreurs de Conception de Schéma**

* **Diagramme Entité-Relation (ERD) obsolète ou incorrect :** Des diagrammes confus ou non mis à jour qui ne reflètent pas le modèle de données actuel.15  
* **Manque de planification préalable :** L'absence de conception en amont peut entraîner un schéma inapproprié, inefficace ou difficile à utiliser.15  
* **Incohérence :** Formatage et conventions de nommage incohérents pour les champs et les tables.15  
* **Clés incorrectes ou redondantes :** Des champs clés qui ne lient pas correctement les tables, ou des champs/tables redondants.15  
* **Sur-indexation :** Indexer trop de colonnes, ce qui crée un surcoût de traitement pour la base de données.15  
* **Conception par la mauvaise équipe :** Un schéma conçu sans la perspective des analystes de données peut le rendre inutilisable.15

#### **Erreurs de Migration de Schéma**

* **IF EXISTS abusif :** L'utilisation aveugle de cette clause peut masquer des problèmes logiques et introduire des anomalies.61  
* **statement\_timeout :** Des requêtes qui fonctionnent en développement peuvent atteindre le statement\_timeout en production à cause de tables plus grandes, entraînant des erreurs.61  
* **Changements massifs non batchés :** La mise à jour d'un trop grand nombre de lignes en une seule transaction peut entraîner des verrous exclusifs prolongés et bloquer d'autres opérations.61  
* **Verrous exclusifs prolongés :** Des transactions qui maintiennent des verrous exclusifs trop longtemps peuvent bloquer d'autres opérations de la base de données.61  
* **Clés étrangères (FK) ou contraintes ajoutées/supprimées sans précaution :** Cela peut entraîner des erreurs ou des blocages, nécessitant une approche en deux étapes.61  
* **Changement de type de données sans précaution :** Peut entraîner une perte de données ou des erreurs si les conversions ne sont pas gérées correctement.16

#### **Erreurs RLS avec AI**

* **Hypothèses erronées :** L'IA peut ignorer des exigences comme la confirmation d'email ou les configurations SMTP manquantes, entraînant des échecs d'authentification inattendus.62  
* **Absence d'authentification :** L'IA peut générer des politiques RLS qui nécessitent un utilisateur connecté, sans tenir compte du fait que l'application n'a pas encore d'authentification active, bloquant ainsi l'accès aux données.62  
* **Boucles infinies de débogage :** L'IA peut suggérer des solutions qui ne fonctionnent pas ou qui en créent de nouvelles, conduisant à des cycles de débogage frustrants et improductifs.62

### **7.3. Stratégies pour Guider l'IA : "Penser Simple", Prompts Structurés, Validation et Tests Rigoureux**

Pour exploiter efficacement les assistants IA et éviter les pièges, une approche disciplinée est nécessaire.

#### **"Enseigner à l'IA à penser simple"**

Il est crucial d'extraire les principes de sagesse du développement logiciel (comme SOLID, Domain-Driven Design, ou "Make it work, make it right, make it fast" de Kent Beck) et de les encoder en règles claires pour l'IA.53 Plutôt que de donner des instructions vagues comme "Ajouter l'authentification utilisateur à cette app", il est préférable d'opter pour une approche plus simple et décomposée : "Créer une valeur d'identité utilisateur. Créer un état d'authentification. Créer une fonction qui valide les identifiants. Garder ces éléments séparés.".53 De même, il est recommandé de séparer les sources de données, les transformations de données et la présentation de l'interface utilisateur en unités distinctes et composables.53

#### **Prompts Structurés et Contextuels**

L'utilisation de prompts qui laissent peu de place à l'interprétation est fondamentale. Le langage doit être spécifique et sans ambiguïté.11 Chaque prompt doit toujours inclure le Contexte, les Contraintes, la Tâche et les Critères d'Acceptation.11 Fournir un contexte hiérarchique et des exemples spécifiques au domaine peut considérablement améliorer la pertinence du code généré.11 Pour les tâches complexes, il est préférable de les décomposer en prompts plus petits et connectés, où chaque prompt construit sur le précédent.11

#### **Validation et Tests Rigoureux**

La validation et les tests sont la dernière ligne de défense contre le code généré par l'IA qui pourrait être incorrect ou non sécurisé.

* Les **tests unitaires**, bien que l'IA puisse parfois écrire des tests qui passent pour du code non fonctionnel, restent une première ligne de défense essentielle.53  
* Une **validation fréquente** du code généré est nécessaire, exigeant une vigilance constante de la part du développeur.53  
* Les **tests E2E (End-to-End)** avec des outils comme Cypress sont cruciaux pour valider le comportement de l'application de bout en bout.  
* Les **tests pgTAP** sont indispensables pour tester la base de données elle-même, y compris les tables, les colonnes, les politiques RLS et les fonctions.30  
* Il est impératif de **ne pas copier-coller immédiatement** le code généré ; il faut toujours l'analyser et le comprendre avant de l'intégrer.58  
* Avant de générer du code, demander à l'IA de fournir un **plan détaillé** des changements peut aider à anticiper les problèmes.58  
* L'utilisation de **plusieurs IA** et la comparaison de leurs réponses peuvent conduire à de meilleures solutions.58  
* Il est important d'**apprendre à traverser les blocages** ; les problèmes sont inévitables dans le développement, et la persévérance et l'apprentissage continu sont clés.58  
* Enfin, des outils d'optimisation SQL basés sur l'IA, comme AI2sql, peuvent aider à corriger les erreurs de syntaxe et à optimiser les requêtes.54

Le tableau suivant est essentiel pour le "manuel" car il compile les problèmes spécifiques rencontrés avec les assistants IA dans le contexte du développement de bases de données. Il offre des solutions concrètes, aidant les développeurs à anticiper et à mitiger les pièges, renforçant ainsi leur efficacité et la robustesse de leurs applications.

| Catégorie d'Erreur | Description de l'Erreur | Impact Potentiel | Stratégie de Prévention/Correction |
| :---- | :---- | :---- | :---- |
| **Générale IA** | Hallucinations, solutions inutiles/complexes, manque de contexte, suggestions obsolètes. | Perte de temps en débogage, code non maintenable, vulnérabilités. | "Enseigner à l'IA à penser simple", prompts structurés (contexte, contraintes, tâche, critères), validation humaine. |
| **Sécurité IA** | Génération de code non sécurisé, utilisation de dépendances non sûres, fuite de propriété intellectuelle. | Brèches de données, problèmes de conformité, perte de secrets. | Politiques claires d'utilisation de l'IA, .cursorignore pour exclure les fichiers sensibles, DLP, audits réguliers. |
| **SQL** | Erreurs de syntaxe, logique incorrecte (JOINs, conditions), références manquantes, mots-clés réservés mal utilisés. | Requêtes non fonctionnelles, données incorrectes, performance dégradée. | Utiliser des prompts précis, valider le SQL généré, utiliser des outils d'optimisation SQL AI. |
| **Schéma DB** | ERD obsolète, manque de planification, incohérence (nommage, formatage), clés incorrectes, sur-indexation. | Difficulté de maintenance, performance médiocre, données inutilisables. | Planification rigoureuse du schéma, conventions strictes, validation manuelle, tests d'indexation. |
| **Migration DB** | IF EXISTS abusif, statement\_timeout en production, changements massifs non batchés, verrous prolongés, FK/contraintes/types de données mal gérés. | Blocages de production, perte de données, incohérences de schéma. | Batcher les changements, utiliser supabase db diff, tester sur de grands volumes de données, approches en deux étapes pour FK/contraintes. |
| **RLS avec AI** | Hypothèses erronées (ex: confirmation email), absence d'authentification, boucles de débogage. | Accès non autorisé, données inaccessibles, perte de temps. | Tester RLS avec pgTAP pour différents utilisateurs, comprendre les flux d'authentification Supabase, valider les politiques générées par l'IA. |

## **8\. Tests et Observabilité**

La robustesse d'une application SaaS repose non seulement sur une conception solide, mais aussi sur des pratiques rigoureuses de test et d'observabilité. Ces éléments sont cruciaux pour garantir la qualité, la performance et la résilience en production.

### **8.1. Tests de Base de Données avec pgTAP**

pgTAP est un framework de test unitaire pour PostgreSQL, basé sur le "Test Anything Protocol" (TAP).31 Il permet de tester de petites parties du système, comme les tables de base de données, les colonnes, les fonctions et les politiques de sécurité.31

#### **Vue d'ensemble et Activation**

Pour utiliser pgTAP, l'extension doit d'abord être activée dans le tableau de bord Supabase.31 Une fois activé,

pgTAP offre un large éventail de fonctions de test.

#### **Types de Tests**

pgTAP permet de valider divers aspects de la base de données :

* **Tables :** Des fonctions comme has\_table(), has\_index() et has\_relation() vérifient l'existence et la structure des objets de la base de données.31  
* **Colonnes :** has\_column() et col\_is\_pk() permettent de tester la présence de colonnes spécifiques et de vérifier si elles sont des clés primaires.31  
* **Politiques RLS :** policies\_are() vérifie que les politiques attendues sont bien présentes sur une table, policy\_roles\_are() valide les rôles auxquels une politique s'applique, et policy\_cmd\_is() confirme la commande associée. La fonction results\_eq() est particulièrement utile pour tester que les politiques RLS retournent les données correctes en fonction du contexte utilisateur.31 Des utilitaires de test spécifiques à Supabase, tels que  
  tests.create\_supabase\_user(), tests.authenticate\_as(), et tests.get\_supabase\_uid(), simplifient les tests RLS en simulant différents contextes utilisateur.30 Il est également possible de vérifier que la RLS est activée sur toutes les tables nécessaires à l'aide de  
  tests.rls\_enabled().30  
* **Fonctions :** function\_returns() vérifie le type de retour d'une fonction, et is\_definer() teste si une fonction est définie comme security definer.31

#### **Bonnes Pratiques de Workflow**

Pour un workflow de test efficace avec pgTAP :

* **Hooks de Pré-test :** Créer un fichier de setup (par exemple, 000-setup-tests-hooks.sql) qui s'exécute en premier pour configurer l'environnement de test, y compris les extensions, les dépendances et les utilitaires de test partagés. Cette pratique réduit la duplication de code et assure la cohérence de l'environnement de test.30  
* **Environnements de Test Cohérents :** Il est crucial d'utiliser des données de test réalistes et des procédures de test matures. Cela est particulièrement important pour les migrations, afin de détecter les problèmes (comme les statement\_timeout sur de grandes tables) qui pourraient n'apparaître qu'en production.61  
* **Tests de Scénarios Complexes :** Pour les applications multi-tenant, il est essentiel de tester les permissions par rôle, les limitations de plan et l'isolation des données entre différentes organisations.30

Les tests de base de données avec pgTAP ne se limitent pas à valider la syntaxe SQL ou l'existence d'objets ; ils sont cruciaux pour tester la *logique métier* implémentée directement au niveau de la base de données via RLS, fonctions et triggers.30 Par exemple, tester qu'une politique RLS empêche réellement l'accès non autorisé ou qu'un trigger maintient une somme de quotes-parts inférieure ou égale à 100% garantit que les règles métier critiques sont appliquées de manière fiable au niveau le plus bas de la pile. La qualité de l'application SaaS dépend directement de la fiabilité de sa base de données. Les tests de base de données sont donc un investissement direct dans la robustesse et la conformité de l'application.

### **8.2. Surveillance et Audit**

L'observabilité est un pilier fondamental pour la gestion d'une application en production, permettant de détecter, diagnostiquer et résoudre les problèmes rapidement.

#### **Outils et Pratiques**

* **pg\_stat\_statements pour les Requêtes Lentes :** Cet outil est essentiel pour identifier et analyser les requêtes PostgreSQL qui consomment le plus de ressources ou qui sont lentes, permettant ainsi des optimisations ciblées.1  
* **Logs Supabase :** Le tableau de bord Supabase fournit des logs détaillés qui permettent d'auditer les appels de fonctions, les événements d'authentification et l'accès au stockage. Ces logs sont une ressource précieuse pour le débogage et la surveillance de la sécurité.1  
* **Intégration d'Outils Externes :** Pour une surveillance plus approfondie, notamment dans les environnements auto-hébergés, il est recommandé d'intégrer des outils d'observabilité externes comme Datadog, Grafana ou Sentry. Ces plateformes offrent des capacités d'agrégation de logs, de métriques et de traces distribuées.1  
* **Surveillance Continue :** La sécurité est un processus continu. Une surveillance constante de l'activité du système est nécessaire pour détecter les comportements suspects et les brèches potentielles en temps réel.33  
* **Audits Réguliers :** Des audits réguliers des triggers, des politiques RLS et des fonctions sont essentiels pour vérifier leur performance continue et leur pertinence par rapport aux exigences évolutives de l'application.22

L'observabilité est un pilier de la scalabilité et de la résilience. La surveillance (pg\_stat\_statements, logs Supabase, outils externes) et l'audit régulier ne sont pas des activités post-déploiement, mais des composants essentiels d'une stratégie de scalabilité et de résilience.1 Identifier les requêtes lentes tôt permet d'optimiser proactivement et d'éviter les goulots d'étranglement à mesure que la charge augmente. Les logs d'authentification et d'accès aux données sont vitaux pour la sécurité et la conformité. Une application SaaS robuste n'est pas seulement bien conçue, elle est aussi bien

*opérée*. L'observabilité permet de détecter les problèmes avant qu'ils n'impactent les utilisateurs, de comprendre le comportement du système sous charge et de prendre des décisions éclairées pour l'optimisation continue.

## **9\. Conclusion et Prochaines Étapes**

La construction d'une application SaaS robuste et performante avec Supabase et Next.js 15 est un processus complexe mais gratifiant, qui exige une compréhension approfondie des principes d'ingénierie logicielle et une attention méticuleuse aux détails techniques. Ce manuel a mis en lumière les meilleures pratiques pour naviguer dans cet écosystème.

En synthèse, les principes fondamentaux de l'approche "Itératif – Vertical Slice First", de la "Convention over Configuration", de la "Database-as-Source-of-Truth" et du "Prompt Engineering comme Spécifications Fonctionnelles" sont les fondations d'un développement efficace. Une base de données PostgreSQL robuste, caractérisée par une normalisation judicieuse, une indexation stratégique, des contraintes d'intégrité rigoureuses et une gestion transactionnelle maîtrisée, est le cœur de la fiabilité de l'application. La sécurité granulaire offerte par Supabase, notamment via la Row-Level Security (RLS) et une gestion des rôles utilisateurs bien définie, est essentielle pour protéger les données sensibles. L'intégration de l'authentification Supabase avec une table profiles personnalisée, synchronisée via des triggers, garantit une gestion cohérente des informations utilisateur.

Le développement efficace avec Next.js 15 s'appuie sur une compréhension claire de l'App Router, des Server Actions pour la logique côté serveur sécurisée, et de la gestion d'état frontend avec des outils comme TanStack Query pour les requêtes et mutations optimisées, et Zustand pour l'état global. L'utilisation de Shadcn/ui pour les composants UI, en suivant les bonnes pratiques d'intégration, assure une interface utilisateur cohérente et accessible.

Enfin, la collaboration avec les assistants IA comme Cursor et MCP Claude Code, bien que puissante, nécessite une approche disciplinée. La reconnaissance des pièges potentiels – tels que les hallucinations, les risques de sécurité et les erreurs spécifiques aux bases de données – est cruciale. Les stratégies pour guider l'IA, en "lui enseignant à penser simple" et en utilisant des prompts structurés, combinées à une validation et des tests rigoureux (y compris pgTAP pour la base de données), sont indispensables pour garantir la qualité et la sécurité du code généré.

L'approche du développeur senior dans ce contexte est celle d'un architecte et d'un chef d'orchestre. Il ne s'agit plus seulement d'écrire du code, mais de concevoir des systèmes résilients, de maîtriser les frameworks modernes, de garantir la sécurité à chaque couche, et de diriger intelligemment les outils d'IA pour amplifier la productivité sans compromettre la qualité. C'est un processus itératif qui exige une compréhension approfondie des principes d'ingénierie logicielle, une attention méticuleuse aux détails de la base de données, et une capacité à intégrer de nouvelles technologies de manière sûre et efficace.

Pour le lecteur, les prochaines étapes consistent à mettre en pratique les principes et les bonnes pratiques présentées dans ce manuel. L'expérimentation active avec Supabase CLI, la définition de schémas et de politiques RLS, l'implémentation de fonctions et triggers, et l'intégration de Next.js avec TanStack Query et Zustand sont des étapes clés. L'exploration des ressources supplémentaires mentionnées dans le user query et l'itération continue sur les processus de développement et de déploiement permettront d'affiner les compétences et de construire des applications SaaS véritablement robustes et scalables.

#### **Sources des citations**

1. Best Practices for Securing and Scaling Supabase for Production ..., consulté le juillet 25, 2025, [https://medium.com/@firmanbrilian/best-practices-for-securing-and-scaling-supabase-for-production-data-workloads-4394aba9e868](https://medium.com/@firmanbrilian/best-practices-for-securing-and-scaling-supabase-for-production-data-workloads-4394aba9e868)  
2. Supabase Nextjs. Mastering Supabase with Next.js… | by Lior ..., consulté le juillet 25, 2025, [https://medium.com/@lior\_amsalem/supabase-nextjs-6ac9fb6459c5](https://medium.com/@lior_amsalem/supabase-nextjs-6ac9fb6459c5)  
3. What Is Vertical Slicing And Why It Is Important? \- Edworking, consulté le juillet 25, 2025, [https://edworking.com/blog/productivity/what-is-vertical-slicing-and-why-it-is-important](https://edworking.com/blog/productivity/what-is-vertical-slicing-and-why-it-is-important)  
4. What Is A Vertical Slice? Exploring Key Concepts And Benefits | GIANTY, consulté le juillet 25, 2025, [https://www.gianty.com/vertical-slice-game-development/](https://www.gianty.com/vertical-slice-game-development/)  
5. Vertical Slicing and How to Boost Value Delivery Right Now \- Agile Rant, consulté le juillet 25, 2025, [https://www.agilerant.info/vertical-slicing-to-boost-software-value/](https://www.agilerant.info/vertical-slicing-to-boost-software-value/)  
6. Agile Vertical Slicing: The Cake is a Lie, consulté le juillet 25, 2025, [https://www.agileambition.com/agile-verticalslicing/](https://www.agileambition.com/agile-verticalslicing/)  
7. Convention over configuration \- Wikipedia, consulté le juillet 25, 2025, [https://en.wikipedia.org/wiki/Convention\_over\_configuration](https://en.wikipedia.org/wiki/Convention_over_configuration)  
8. Convention over Configuration principle & example from SAP CC | by Nuray Fahri | Medium, consulté le juillet 25, 2025, [https://nurayfahri.medium.com/convention-over-configuration-principle-example-from-sap-cc-5469e3655e12](https://nurayfahri.medium.com/convention-over-configuration-principle-example-from-sap-cc-5469e3655e12)  
9. Single source of truth \- Wikipedia, consulté le juillet 25, 2025, [https://en.wikipedia.org/wiki/Single\_source\_of\_truth](https://en.wikipedia.org/wiki/Single_source_of_truth)  
10. What Is a Single Source of Truth? | System Design Glossary \- Mad Devs, consulté le juillet 25, 2025, [https://maddevs.io/glossary/single-source-of-truth/](https://maddevs.io/glossary/single-source-of-truth/)  
11. Prompt Engineering for LLMs | Best Technical Guide in 2025 \- Dextra Labs, consulté le juillet 25, 2025, [https://dextralabs.com/blog/prompt-engineering-for-llm/](https://dextralabs.com/blog/prompt-engineering-for-llm/)  
12. Prompt Engineering of LLM Prompt Engineering : r/PromptEngineering \- Reddit, consulté le juillet 25, 2025, [https://www.reddit.com/r/PromptEngineering/comments/1hv1ni9/prompt\_engineering\_of\_llm\_prompt\_engineering/](https://www.reddit.com/r/PromptEngineering/comments/1hv1ni9/prompt_engineering_of_llm_prompt_engineering/)  
13. Database Design Best Practices: Key Principles for Success, consulté le juillet 25, 2025, [https://blog.devart.com/database-design-best-practices.html](https://blog.devart.com/database-design-best-practices.html)  
14. Relational Database Best Practices \- Number Analytics, consulté le juillet 25, 2025, [https://www.numberanalytics.com/blog/relational-database-best-practices](https://www.numberanalytics.com/blog/relational-database-best-practices)  
15. 11 Database Schema Mistakes to Avoid | Blog \- Fivetran, consulté le juillet 25, 2025, [https://www.fivetran.com/blog/11-database-schema-mistakes-to-avoid](https://www.fivetran.com/blog/11-database-schema-mistakes-to-avoid)  
16. Tables and Data | Supabase Docs, consulté le juillet 25, 2025, [https://supabase.com/docs/guides/database/tables](https://supabase.com/docs/guides/database/tables)  
17. Documentation: 17: 41.12. Tips for Developing in PL/pgSQL \- PostgreSQL, consulté le juillet 25, 2025, [https://www.postgresql.org/docs/current/plpgsql-development-tips.html](https://www.postgresql.org/docs/current/plpgsql-development-tips.html)  
18. Boosting Performance: Optimizing PostgreSQL Functions | by mohyusufz \- Medium, consulté le juillet 25, 2025, [https://mohyusufz.medium.com/boosting-performance-optimizing-postgresql-functions-1295859b5069](https://mohyusufz.medium.com/boosting-performance-optimizing-postgresql-functions-1295859b5069)  
19. Documentation: 17: CREATE FUNCTION \- PostgreSQL, consulté le juillet 25, 2025, [https://www.postgresql.org/docs/current/sql-createfunction.html](https://www.postgresql.org/docs/current/sql-createfunction.html)  
20. Abusing SECURITY DEFINER functions in PostgreSQL, consulté le juillet 25, 2025, [https://www.cybertec-postgresql.com/en/abusing-security-definer-functions/](https://www.cybertec-postgresql.com/en/abusing-security-definer-functions/)  
21. Row Level Security | Supabase Docs, consulté le juillet 25, 2025, [https://supabase.com/docs/guides/database/postgres/row-level-security](https://supabase.com/docs/guides/database/postgres/row-level-security)  
22. How to Effectively Implement PostgreSQL Triggers: A ... \- Chat2DB, consulté le juillet 25, 2025, [https://chat2db.ai/resources/blog/how-to-implement-postgresql-triggers](https://chat2db.ai/resources/blog/how-to-implement-postgresql-triggers)  
23. PostgreSQL Trigger Fundamentals: Examples & Syntax \- Estuary, consulté le juillet 25, 2025, [https://estuary.dev/blog/postgresql-triggers/](https://estuary.dev/blog/postgresql-triggers/)  
24. Documentation: 17: 37.1. Overview of Trigger Behavior \- PostgreSQL, consulté le juillet 25, 2025, [https://www.postgresql.org/docs/current/trigger-definition.html](https://www.postgresql.org/docs/current/trigger-definition.html)  
25. Create a \`public.profile\` table and keep it in sync with supabase \`auth.users\` for selected fields in both directions. \- GitHub Gist, consulté le juillet 25, 2025, [https://gist.github.com/fnimick/37269e61f4e2374290b76554d8f994ab](https://gist.github.com/fnimick/37269e61f4e2374290b76554d8f994ab)  
26. How to Insert Usernames into Profiles Table Using Supabase Triggers \- Medium, consulté le juillet 25, 2025, [https://medium.com/@ctrlaltmonique/how-to-insert-usernames-into-profiles-table-using-supabase-triggers-ef14d98747da](https://medium.com/@ctrlaltmonique/how-to-insert-usernames-into-profiles-table-using-supabase-triggers-ef14d98747da)  
27. Documentation: 17: 3.2. Views \- PostgreSQL, consulté le juillet 25, 2025, [https://www.postgresql.org/docs/current/tutorial-views.html](https://www.postgresql.org/docs/current/tutorial-views.html)  
28. A Guide to PostgreSQL Views \- TigerData, consulté le juillet 25, 2025, [https://www.tigerdata.com/learn/guide-to-postgresql-views](https://www.tigerdata.com/learn/guide-to-postgresql-views)  
29. Local development with schema migrations | Supabase Docs, consulté le juillet 25, 2025, [https://supabase.com/docs/guides/local-development/overview](https://supabase.com/docs/guides/local-development/overview)  
30. Advanced pgTAP Testing | Supabase Docs, consulté le juillet 25, 2025, [https://supabase.com/docs/guides/local-development/testing/pgtap-extended](https://supabase.com/docs/guides/local-development/testing/pgtap-extended)  
31. pgTAP: Unit Testing | Supabase Docs, consulté le juillet 25, 2025, [https://supabase.com/docs/guides/database/extensions/pgtap](https://supabase.com/docs/guides/database/extensions/pgtap)  
32. How to Manage Row-Level Security Policies Effectively in Supabase | by Prospera Soft, consulté le juillet 25, 2025, [https://medium.com/@jay.digitalmarketing09/how-to-manage-row-level-security-policies-effectively-in-supabase-98c9dfbc2c01](https://medium.com/@jay.digitalmarketing09/how-to-manage-row-level-security-policies-effectively-in-supabase-98c9dfbc2c01)  
33. Best Security Practices in Supabase: A Comprehensive Guide ..., consulté le juillet 25, 2025, [https://www.supadex.app/blog/best-security-practices-in-supabase-a-comprehensive-guide](https://www.supadex.app/blog/best-security-practices-in-supabase-a-comprehensive-guide)  
34. row-level security policies in Supabase for a multitenant application \#149922 \- GitHub, consulté le juillet 25, 2025, [https://github.com/orgs/community/discussions/149922](https://github.com/orgs/community/discussions/149922)  
35. Optimizing RLS Performance with Supabase(postgres) | by AntStack Inc. \- Medium, consulté le juillet 25, 2025, [https://medium.com/@antstack/optimizing-rls-performance-with-supabase-postgres-fa4e2b6e196d](https://medium.com/@antstack/optimizing-rls-performance-with-supabase-postgres-fa4e2b6e196d)  
36. Access Control | Supabase Docs, consulté le juillet 25, 2025, [https://supabase.com/docs/guides/platform/access-control](https://supabase.com/docs/guides/platform/access-control)  
37. Role-Based Access Control (RBAC) | Supabase Features, consulté le juillet 25, 2025, [https://supabase.com/features/role-based-access-control](https://supabase.com/features/role-based-access-control)  
38. PostgreSQL Row-level Security (RLS) Limitations and Alternatives \- Bytebase, consulté le juillet 25, 2025, [https://www.bytebase.com/blog/postgres-row-level-security-limitations-and-alternatives/](https://www.bytebase.com/blog/postgres-row-level-security-limitations-and-alternatives/)  
39. Supabase Auth Reference to "profiles" not clear to me \- WeWeb Community, consulté le juillet 25, 2025, [https://community.weweb.io/t/supabase-auth-reference-to-profiles-not-clear-to-me/7568](https://community.weweb.io/t/supabase-auth-reference-to-profiles-not-clear-to-me/7568)  
40. Nextjs 15 — Actions Best Practice | by Lior Amsalem \- Medium, consulté le juillet 25, 2025, [https://medium.com/@lior\_amsalem/nextjs-15-actions-best-practice-207ef6a2e52a](https://medium.com/@lior_amsalem/nextjs-15-actions-best-practice-207ef6a2e52a)  
41. Next.js Docs: App Router, consulté le juillet 25, 2025, [https://nextjs.org/docs/app](https://nextjs.org/docs/app)  
42. Mastering Next.js App Router: Best Practices for Modern Web Apps \- Matthew Ovie Enamuotor, consulté le juillet 25, 2025, [https://www.oviematthew.com/blog/nextjs-app-router-best-practices](https://www.oviematthew.com/blog/nextjs-app-router-best-practices)  
43. Best Practices for Using shadcn/ui in Next.js | by rokhmad setiawan \- Akar Inti Teknologi, consulté le juillet 25, 2025, [https://insight.akarinti.tech/best-practices-for-using-shadcn-ui-in-next-js-2134108553ae](https://insight.akarinti.tech/best-practices-for-using-shadcn-ui-in-next-js-2134108553ae)  
44. Should I Use Global State Management or Call Supabase Auth on Demand in Next.js?, consulté le juillet 25, 2025, [https://www.reddit.com/r/nextjs/comments/1fv66vn/should\_i\_use\_global\_state\_management\_or\_call/](https://www.reddit.com/r/nextjs/comments/1fv66vn/should_i_use_global_state_management_or_call/)  
45. Build a User Management App with Next.js | Supabase Docs, consulté le juillet 25, 2025, [https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)  
46. Comprehensive Guide to Next.js 15 App Router | by Abdullah Muhammad \- Stackademic, consulté le juillet 25, 2025, [https://blog.stackademic.com/comprehensive-guide-to-next-js-15-app-router-64e967d700f8](https://blog.stackademic.com/comprehensive-guide-to-next-js-15-app-router-64e967d700f8)  
47. Overview | TanStack Query React Docs, consulté le juillet 25, 2025, [https://tanstack.com/query/v5/docs/react/overview](https://tanstack.com/query/v5/docs/react/overview)  
48. Mutations | TanStack Query React Docs, consulté le juillet 25, 2025, [https://tanstack.com/query/v5/docs/framework/react/guides/mutations](https://tanstack.com/query/v5/docs/framework/react/guides/mutations)  
49. Understanding Tanstack Query reactivity and best practices : r/react \- Reddit, consulté le juillet 25, 2025, [https://www.reddit.com/r/react/comments/1jm2gxz/understanding\_tanstack\_query\_reactivity\_and\_best/](https://www.reddit.com/r/react/comments/1jm2gxz/understanding_tanstack_query_reactivity_and_best/)  
50. 5 Zustand BEST Practices in 5 Minutes \- YouTube, consulté le juillet 25, 2025, [https://www.youtube.com/watch?v=6tEQ1nJZ51w](https://www.youtube.com/watch?v=6tEQ1nJZ51w)  
51. Best Practices for Using shadcn/ui in Next.js \- Akar Inti Teknologi, consulté le juillet 25, 2025, [https://akarinti.tech/id/insight/bestpracticesforusingshadcnuiinnextjs-id](https://akarinti.tech/id/insight/bestpracticesforusingshadcnuiinnextjs-id)  
52. Large-Scale React (Zustand) & Nest.js Project Structure and Best Practices \- Medium, consulté le juillet 25, 2025, [https://medium.com/@itsspss/large-scale-react-zustand-nest-js-project-structure-and-best-practices-93397fb473f4](https://medium.com/@itsspss/large-scale-react-zustand-nest-js-project-structure-and-best-practices-93397fb473f4)  
53. The problem with Claude Code and Cursor: The AI Coding "Death ..., consulté le juillet 25, 2025, [https://medium.com/white-prompt-blog/the-problem-with-claude-code-and-cursor-the-ai-coding-death-spiral-06b891091ba3](https://medium.com/white-prompt-blog/the-problem-with-claude-code-and-cursor-the-ai-coding-death-spiral-06b891091ba3)  
54. SQLAI.ai: Generate SQL Queries in Seconds for Free, consulté le juillet 25, 2025, [https://www.sqlai.ai/](https://www.sqlai.ai/)  
55. 6 limitations of AI code assistants and why developers should be cautious \- All Things Open, consulté le juillet 25, 2025, [https://allthingsopen.org/articles/ai-code-assistants-limitations](https://allthingsopen.org/articles/ai-code-assistants-limitations)  
56. Security Risk of AI code editors : r/cybersecurity \- Reddit, consulté le juillet 25, 2025, [https://www.reddit.com/r/cybersecurity/comments/1hx980d/security\_risk\_of\_ai\_code\_editors/](https://www.reddit.com/r/cybersecurity/comments/1hx980d/security_risk_of_ai_code_editors/)  
57. Security | Cursor \- The AI Code Editor, consulté le juillet 25, 2025, [https://cursor.com/security](https://cursor.com/security)  
58. What are mistakes newbies make with ai coding? : r/ChatGPTCoding \- Reddit, consulté le juillet 25, 2025, [https://www.reddit.com/r/ChatGPTCoding/comments/1irm2ol/what\_are\_mistakes\_newbies\_make\_with\_ai\_coding/](https://www.reddit.com/r/ChatGPTCoding/comments/1irm2ol/what_are_mistakes_newbies_make_with_ai_coding/)  
59. How to Fix SQL Errors with AI: Streamline Database Troubleshooting \- AI2sql, consulté le juillet 25, 2025, [https://ai2sql.io/ai-blog/how-to-fix-sql-errors-with-ai-streamline-database-troubleshooting](https://ai2sql.io/ai-blog/how-to-fix-sql-errors-with-ai-streamline-database-troubleshooting)  
60. Top Most Common SQL Coding Errors in Data Science \- StrataScratch, consulté le juillet 25, 2025, [https://www.stratascratch.com/blog/top-most-common-sql-coding-errors-in-data-science/](https://www.stratascratch.com/blog/top-most-common-sql-coding-errors-in-data-science/)  
61. Common DB schema change mistakes \- Postgres AI, consulté le juillet 25, 2025, [https://postgres.ai/blog/20220525-common-db-schema-change-mistakes](https://postgres.ai/blog/20220525-common-db-schema-change-mistakes)  
62. Supabase RLS Errors\! — Bolt.new & AI Assistants Just Looping\! : r/boltnewbuilders \- Reddit, consulté le juillet 25, 2025, [https://www.reddit.com/r/boltnewbuilders/comments/1ir8h5m/supabase\_rls\_errors\_boltnew\_ai\_assistants\_just/](https://www.reddit.com/r/boltnewbuilders/comments/1ir8h5m/supabase_rls_errors_boltnew_ai_assistants_just/)