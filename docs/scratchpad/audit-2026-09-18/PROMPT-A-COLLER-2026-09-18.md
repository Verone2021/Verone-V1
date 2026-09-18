# Prompt à coller dans Claude Code — 2026-09-18

Deux blocs, deux PR, dans cet ordre. Le premier ferme une fuite de données clients, le second nous rend
capables de voir ce qui casse chez les utilisateurs. Tu peux tout enchaîner sans m'attendre : je n'interviens
qu'au moment de fusionner.

## Ce que tu ne fais pas

- Aucun commit, push, PR ni fusion **fusionnée** sans mon ordre écrit. Tu ouvres les PR vers `staging`, tu t'arrêtes là.
- Aucune migration, aucune écriture en base dans ces deux blocs.
- Aucune rotation de clé, aucune purge d'historique git : **reporté, n'y touche pas**.
- Tu ne crées aucun compte externe et tu ne saisis aucun mot de passe. La clé PostHog, c'est moi qui la fournis.
- Rien en production entre 07 h et 17 h UTC un jour ouvré (ADR-041).

## Lecture préalable

- `docs/scratchpad/audit-2026-09-18/AUDIT-COMPLET-2026-09-18.md` — l'audit et ses preuves
- `docs/scratchpad/audit-2026-09-18/INCIDENT-2026-09-17-ecran-erreur.md` — l'incident qui motive le bloc 2
- `.claude/work/ACTIVE.md`, section « PLAN AUDIT 2026-09-18 »

---

# BLOC 1 — `[BO-SEC-PII-001]` : fermer la fuite d'adresses clients

**Une PR, une heure, rien d'autre dedans.**

## Le défaut

`apps/back-office/src/app/api/sales-orders/[id]/customer-address/route.ts` :

- ligne 16 : `import { createAdminClient }` — clé `service_role`, qui contourne **toutes** les règles de sécurité de la base ;
- ligne 35 : `const supabase = createAdminClient()` ;
- **aucun `getUser()`, aucune garde, nulle part dans le fichier ni dans ses imports.**

Résultat : un `GET` non authentifié avec un identifiant de commande renvoie le nom, l'e-mail, le téléphone et
l'adresse complète du client. Le back-office n'a pas de middleware, donc rien ne rattrape ça en amont.

## À faire

1. Ajouter la garde `requireBackofficeAdmin` (`apps/back-office/src/lib/guards/require-backoffice-admin.ts`,
   déjà utilisée par 13 routes) en tête du handler.
2. Repasser sur le client normal (`createServerClient`) si le `service_role` n'est pas strictement nécessaire.
   Si la RLS bloque une lecture légitime après ce changement, tu gardes `createAdminClient` **derrière** la
   garde et tu écris dans la PR pourquoi.
3. Produire l'inventaire **nominatif** des routes qui appellent `createAdminClient()` dans les 3 apps :
   un tableau `route | méthode | garde oui/non | écrit en base oui/non`.
   **Tu ne corriges pas les autres routes dans cette PR** — tu me rends la liste, je choisis l'ordre.

## Vérification

- `pnpm --filter @verone/back-office type-check` et `lint` verts.
- Un appel sans session doit répondre 401 ou 403. Prouve-le en local, mets la commande et la réponse dans la PR.

---

# BLOC 2 — `[BO-OBS-001]` : voir ce qui casse chez les utilisateurs

**Une PR. Trois applications touchées.**

## Pourquoi

Le 17/09 au soir et le 18/09, une collaboratrice (Chrome sous Windows) est restée bloquée sur l'écran rouge
« Erreur système Vérone », sans issue. Les journaux Supabase prouvent que sa session, ses droits et ses
requêtes étaient bons : **toutes ses requêtes répondaient 200**. L'erreur est née dans son navigateur — et
elle n'existe nulle part : ni Sentry, ni rejeu de session, ni capture d'erreur. Deux heures d'enquête pour
finir sur une hypothèse. C'est ça qu'on corrige.

## 2.1 — Brancher PostHog sur les 3 applications

Variables fournies par Roméo : `NEXT_PUBLIC_POSTHOG_KEY` et `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com`
(hébergement européen imposé : les rejeus contiendront des données de clients français).

Tu peux écrire tout le code **avant** de disposer de la clé : elle est lue à l'exécution, pas à la compilation.
Sans clé, rien ne s'initialise et l'application fonctionne normalement — c'est une exigence, pas un effet de bord.

1. `posthog-js` en dépendance de chaque app qui l'utilise. Initialisation dans un fournisseur client dédié
   `src/components/providers/posthog-provider.tsx`, monté le plus haut possible dans `app/layout.tsx`.
2. **N'initialise que si** la clé est présente **et** `process.env.NODE_ENV === 'production'`. Ni en local, ni en CI.
3. Réglages exigés :
   - capture des exceptions non rattrapées **et** des rejets de promesse non gérés ;
   - rejeu de session **déclenché uniquement quand une erreur survient** — pas d'enregistrement permanent ;
   - console et requêtes réseau capturées dans le rejeu, **corps des requêtes exclus** ;
   - `maskAllInputs: true`, plus masquage des textes qui contiennent e-mail, téléphone, adresse ou montant :
     un rejeu sert à voir un plantage, pas à lire la fiche d'un client ;
   - identification par l'identifiant Supabase **et** le rôle (`app`, `role`) — jamais l'e-mail en clair ;
   - version de l'application attachée à chaque événement via `VERCEL_GIT_COMMIT_SHA`, pour pouvoir dire
     « cette erreur date de la mise en ligne de 13 h 45 ».
4. CSP du back-office (`src/lib/security/headers.ts`) : autoriser `https://eu.i.posthog.com` en `connect-src`,
   sinon tout est bloqué en silence. Vérifie aussi `linkme` et `site-internet`.

## 2.2 — Boucher le trou des filets d'erreur

`apps/back-office/src/app/layout.tsx` rend `TooltipProvider > ReactQueryProvider > SupabaseProvider >
AuthWrapper > children`. Dans l'App Router, une erreur levée **dans** ces fournisseurs n'est pas attrapée par
`app/error.tsx` (ajouté le 18/09) : elle tombe dans `global-error.tsx`, qui démonte l'application entière.
« Réessayer » rejoue le même rendu, donc le même plantage. C'est exactement la boucle vécue par la collaboratrice.

1. Crée un `ErrorBoundary` client (classe React, `componentDidCatch`) dans
   `apps/back-office/src/components/providers/error-boundary.tsx`. Il remonte l'erreur à PostHog puis affiche
   un écran avec **trois sorties réelles** : réessayer · recharger complètement la page · se déconnecter et
   revenir à `/login`.
2. Enveloppe les fournisseurs **et** `AuthWrapper` avec lui dans `app/layout.tsx`.
3. `global-error.tsx` et `error.tsx` : afficher `error.digest` **aussi en production**, avec la phrase
   « communiquez ce code au support ». Aujourd'hui il n'apparaît qu'en développement — c'est précisément
   l'information qui nous a manqué.
4. Même remontée PostHog dans les `error.tsx` de `linkme` et `site-internet`.

## 2.3 — Interdire la traduction automatique (back-office et LinkMe)

La capture d'écran de l'incident est en portugais alors que le texte est écrit en français dans le code : Chrome
traduisait la page. La traduction automatique réécrit des nœuds de texte et casse le rendu React — cause connue,
cohérente avec « ça touche elle et pas moi ».

`<html lang="fr" translate="no">`, classe `notranslate` sur le `body`, `<meta name="google" content="notranslate" />`.
**Pas sur `site-internet`** : c'est un site public, la traduction y rend service au visiteur.

## 2.4 — Version périmée après une mise en ligne

Un onglet resté ouvert demande des fichiers supprimés par le déploiement suivant. Dans l'`ErrorBoundary` : si le
message ressemble à `ChunkLoadError`, `Loading chunk`, ou `Failed to fetch dynamically imported module`,
recharger la page **une seule fois** automatiquement (drapeau en `sessionStorage`, jamais de boucle), et afficher
« une nouvelle version vient d'être publiée » si le rechargement ne suffit pas.

## 2.5 — Ménage

Supprime `apps/back-office/src/app/api/logs/route.ts` : elle écrit des fichiers JSON dans le système de
fichiers de Vercel, qui est éphémère — elle n'a jamais rien conservé, et elle accepte n'importe quel appel
anonyme. Supprime `console-error-tracker` s'il devient inutile.

## Vérification du bloc 2

1. `type-check`, `lint`, `build` verts sur les trois applications.
2. Provoque une erreur volontaire sur une page de test locale : l'écran doit proposer les trois sorties et
   afficher le code technique.
3. Une fois la clé en place : l'erreur doit apparaître dans PostHog **avec le rejeu de la session**.
4. Ouvre ce rejeu et vérifie de tes yeux que **les saisies sont masquées** et qu'aucun e-mail client n'est lisible.
   Si ce n'est pas le cas, tu ne livres pas : tu corriges le masquage d'abord.

---

# Ce que je veux dans ton compte rendu

Un fichier `docs/scratchpad/dev-report-2026-09-18-BO-OBS-001.md` et un message court dans le chat, avec :

1. Les deux numéros de PR, et ce que contient chacune.
2. Pour le bloc 1 : le tableau des routes qui utilisent `createAdminClient()`, avec la colonne « garde oui/non ».
3. Pour le bloc 2 : la preuve que l'erreur de test est bien arrivée dans PostHog (identifiant d'événement ou capture).
4. Ce que tu n'as pas pu vérifier, et pourquoi.
5. Si tu découvres en chemin un défaut plus grave que ceux listés : tu t'arrêtes et tu me le dis, tu ne l'embarques pas dans la PR.
