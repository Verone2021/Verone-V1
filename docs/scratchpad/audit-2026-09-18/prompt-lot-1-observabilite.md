# Prompt Claude Code — LOT 1 : voir ce qui casse chez les utilisateurs

`[BO-OBS-001]` — une seule PR vers `staging`, un bloc cohérent. Aucune touche à la base.

## Contexte

Le 17/09 au soir et le 18/09, une collaboratrice (Chrome / Windows) est restée bloquée sur l'écran rouge
« Erreur système Vérone », sans issue. Il a fallu deux heures de fouille dans les journaux Supabase pour
arriver à « c'est côté navigateur » — sans jamais obtenir l'erreur elle-même, parce que rien ne la capture.
Détail complet : `docs/scratchpad/audit-2026-09-18/INCIDENT-2026-09-17-ecran-erreur.md`.

Objectif du lot : la prochaine fois, on lit l'erreur et on rejoue la session.

## Règles

- Aucun commit, push, PR ni fusion sans ordre écrit de Roméo. PR vers `staging`, jamais `main`.
- Aucune migration, aucune écriture en base dans ce lot.
- Ne crée aucun compte externe, ne saisis aucun mot de passe : Roméo fournit la clé PostHog.
- Zéro `any`, pas de fichier > 400 lignes, les 5 techniques responsive si tu touches un écran.
- Plan et rapport scratchpad obligatoires (le lot touche plus de 3 fichiers et change un comportement visible).

## 1. Observabilité navigateur — PostHog

Clé fournie par Roméo dans le chat : `NEXT_PUBLIC_POSTHOG_KEY` et `NEXT_PUBLIC_POSTHOG_HOST`
(`https://eu.i.posthog.com` — hébergement européen obligatoire, données de clients français).

Sur les **trois** applications (`back-office`, `linkme`, `site-internet`) :

1. Dépendance `posthog-js` au niveau de l'app qui la consomme, initialisation dans un fournisseur client dédié
   (`src/components/providers/posthog-provider.tsx`), monté le plus haut possible.
2. **Ne rien initialiser si la clé est absente** : pas de plantage en local ni en CI, pas d'envoi depuis un
   environnement de développement (`process.env.NODE_ENV === 'production'` ET clé présente).
3. Réglages exigés :
   - capture des exceptions non rattrapées ET des rejets de promesse non gérés ;
   - rejeu de session **déclenché sur erreur uniquement** (pas d'enregistrement permanent) ;
   - console et requêtes réseau capturées dans le rejeu, **corps des requêtes exclus** ;
   - masquage de toutes les saisies (`maskAllInputs: true`) et des champs contenant un e-mail, un téléphone,
     une adresse ou un montant — un rejeu sert à voir un plantage, pas à lire les données d'un client ;
   - identification de l'utilisateur par son identifiant Supabase et son rôle (`app` + `role`), **jamais** par
     son e-mail en clair ;
   - version de l'application envoyée avec chaque événement (utilise `VERCEL_GIT_COMMIT_SHA`) — c'est ce qui
     permettra de dire « cette erreur date de la mise en ligne de 13 h 45 ».
4. Vérifie que la CSP du back-office (`src/lib/security/headers.ts`) autorise `eu.i.posthog.com` en
   `connect-src` — sinon tout est bloqué silencieusement.

## 2. Boucher le trou des filets d'erreur

`app/layout.tsx` rend `TooltipProvider > ReactQueryProvider > SupabaseProvider > AuthWrapper > children`.
Une erreur dans l'un de ces fournisseurs **saute par-dessus `app/error.tsx`** et tombe dans `global-error.tsx`,
qui démonte toute l'application. C'est ce que la collaboratrice a vu.

À faire :

1. Un composant client `ErrorBoundary` (classe React, `componentDidCatch`) dans
   `apps/back-office/src/components/providers/`, qui remonte l'erreur à PostHog puis affiche un écran avec
   **trois sorties réelles** : réessayer, recharger complètement la page (`location.reload(true)` équivalent),
   se déconnecter et revenir à `/login`.
2. Envelopper `AuthWrapper` et les fournisseurs avec ce garde-fou dans `app/layout.tsx`.
3. `global-error.tsx` et `error.tsx` : afficher **le code technique de l'erreur (`error.digest`) en production**
   aussi, pas seulement en développement, avec une phrase « communiquez ce code au support ». Aujourd'hui il est
   masqué en production : c'est exactement l'information qui manquait.
4. Même filet minimal sur `linkme` et `site-internet` (ils ont déjà un `error.tsx`, ajoute la remontée PostHog).

## 3. Interdire la traduction automatique

Le back-office est un outil interne en français. La traduction automatique de Chrome réécrit des nœuds de texte
et casse le rendu React — cause probable du plantage de la collaboratrice, dont la capture d'écran était en
portugais alors que le code est en français.

Dans `apps/back-office/src/app/layout.tsx` : `<html lang="fr" translate="no">`, classe `notranslate` sur le
`body`, et `<meta name="google" content="notranslate" />`. Idem sur `linkme`. **Pas sur `site-internet`** :
c'est un site public, la traduction y est un service rendu au visiteur.

## 4. Version périmée après une mise en ligne

Un onglet resté ouvert demande des fichiers supprimés par le déploiement suivant : `ChunkLoadError`, et
aujourd'hui « Réessayer » ne peut pas s'en sortir.

Dans l'`ErrorBoundary` : si le message correspond à un chargement de module échoué (`ChunkLoadError`,
`Loading chunk`, `Failed to fetch dynamically imported module`), recharger la page **une seule fois**
automatiquement (drapeau en `sessionStorage` pour ne pas boucler), et afficher « une nouvelle version vient
d'être publiée » si le rechargement ne suffit pas.

## 5. Ménage

`apps/back-office/src/app/api/logs/route.ts` écrit des fichiers JSON dans le système de fichiers de Vercel,
qui est éphémère et en lecture seule : cette route ne sert à rien et accepte n'importe quel appel anonyme.
Supprime-la, ainsi que `console-error-tracker` s'il n'est plus utilisé après le branchement de PostHog.

## 6. Vérification avant de rendre la main

1. `pnpm --filter @verone/back-office type-check`, `lint`, `build` verts sur les trois apps touchées.
2. Provoque une erreur volontaire sur une page de test locale : l'écran doit proposer les trois sorties, afficher
   le code technique, et l'erreur doit apparaître dans PostHog avec le rejeu de la session.
3. Vérifie dans le rejeu que **les champs de saisie sont masqués** et qu'aucun e-mail client n'est lisible.
4. Réponds à Roméo avec : le nombre de fichiers touchés, la preuve de l'erreur visible dans PostHog
   (capture ou identifiant d'événement), et ce que tu n'as pas pu vérifier.

## Ce que Roméo doit faire avant de lancer ce prompt

1. Créer le compte PostHog (gratuit, hébergement UE) et un projet par application ou un projet unique.
2. Coller les deux variables dans Vercel (les trois projets) et dans son `.env.local`.
3. Prévenir par écrit les deux salariées que les sessions du back-office sont enregistrées en cas d'erreur,
   avec masquage des saisies et conservation 30 jours.
