# Rapport — `[BO-AUTH-SESSION-002]` + `[BO-SOURCING-FORM-006]`

**Branche** : `fix/BO-AUTH-SESSION-002-middleware-et-filet` — PR #1173 vers `staging`
**Date** : 2026-09-17 soir → 2026-09-18
**Origine** : Roméo, 17/09 — « des collaborateurs n'arrivent pas à se connecter depuis Chrome depuis
la dernière mise à jour » + « impossible de créer un produit de sourcing, ça ne s'enregistre pas ».
Message à l'écran fourni par Roméo : « Erreur système Vérone — Une erreur inattendue s'est produite
dans l'application. [Réessayer] [Retour au Dashboard] ».

---

## 1. Diagnostic

### 1.1 L'écran « Erreur système Vérone »

Texte identifié mot pour mot dans `apps/back-office/src/app/global-error.tsx:34-42`. Ce n'est donc
pas un refus de connexion : c'est la frontière d'erreur **racine** de Next, celle qui démonte toute
l'application.

Trois défauts empilés :

| #   | Défaut                                                                                   | Preuve                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `(protected)/layout.tsx:79-86` jetait une exception quand la lecture du rôle échouait    | Ajouté la veille par `68888f88`                                                                                                                              |
| 2   | `(protected)/error.tsx`, ajouté par le même commit pour l'attraper, est au mauvais étage | Un `error.tsx` n'attrape pas les erreurs du `layout.tsx` de **son propre** segment ; la frontière suivante est `app/`, et `app/error.tsx` **n'existait pas** |
| 3   | `reset()` rejoue le même rendu serveur → même exception                                  | L'utilisateur était enfermé : seul « Retour au Dashboard » (navigation dure) sortait de la boucle                                                            |

### 1.2 La cause de fond : aucune session renouvelée côté serveur

`find apps -name middleware.ts` → **seuls `linkme` et `site-internet` en avaient un.** Le back-office
n'en avait aucun.

Conséquence : `packages/@verone/utils/src/supabase/server.ts:49-57` avale l'échec d'écriture des
cookies (normal dans un Server Component, mais cela suppose un middleware qui fait le travail). Il
n'y en avait pas → **le jeton n'était jamais renouvelé côté serveur**. Un onglet endormi revenait
avec un accès expiré. Chrome bride les minuteurs d'arrière-plan bien plus durement que Safari, d'où
le biais navigateur rapporté.

Effet de bord mesuré : `curl -D - https://verone-backoffice.vercel.app/dashboard` sans cookie
répondait **200** avec la redirection portée par le JavaScript (`NEXT_REDIRECT;replace;/login;307`),
et non un vrai 307 — la décision arrivait après le début du streaming.

### 1.3 Pistes écartées, avec preuve

- Droits SQL sur `user_app_roles` : intacts ; `is_back_office_privileged()`, `is_back_office_owner()`,
  `is_enseigne_admin_for()` toutes exécutables par `authenticated`.
- Doublons de rôle (piège `maybeSingle()` « multiple rows ») : aucun, 6 utilisateurs, tous `n = 1`.
- Taille de cookie (limite Chrome 4096 o) : session mesurée à ~2 000 o.
- API JavaScript trop récente pour un Chrome d'entreprise : 0 occurrence de `Object.groupBy`,
  `findLast`, `toSorted`, `structuredClone`, `Promise.withResolvers`…
- `RangeError: Invalid currency code` via « achat en dollars » : toutes les devises sont défaultées,
  et un throw dans les consultations serait attrapé par `consultations/error.tsx`.
- En-têtes de sécurité / CSP : identiques pour tous les navigateurs, `connect-src` correct.

### 1.4 Le formulaire de sourcing

Chemin : `SourcingQuickForm` → `hooks.ts` (validation) → `use-sourcing-create-update.ts:65-102`.

- Le `<form>` n'avait pas `noValidate`, et `ProductFieldsSection.tsx:62-75` gardait `type="url"` sur
  un champ devenu **facultatif** la veille. Une adresse sans `https://` bloque l'envoi au niveau du
  navigateur : **aucune requête, aucun message dans la page**.
- Même piège sur `type="number"` : « 12,50 » met le champ en `badInput`, `value` vaut `''`, le prix
  est perdu.
- `CHECK (length(name) >= 5)` sur `products` n'était pas reflété côté formulaire.

---

## 2. Ce qui a été fait

| Fichier                                                                                | Changement                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/back-office/src/middleware.ts`                                                   | **Nouveau.** Calqué sur `apps/linkme/src/middleware.ts` (autonome, aucun import `@verone/*` — contrainte Edge Runtime). Rafraîchit le cookie, renvoie un visiteur non connecté vers `/login?redirect=…` en **307 réel**. `/api/*` exclu du matcher. Ne lit **pas** le rôle (voir § 4). |
| `apps/back-office/src/app/error.tsx`                                                   | **Nouveau.** La frontière manquante au-dessus de `(protected)`. Deux sorties réelles : rejouer, ou repartir de la connexion.                                                                                                                                                           |
| `apps/back-office/src/app/(protected)/layout.tsx`                                      | Plus de `throw`. Échec de lecture du rôle → `console.error` avec le code PostgREST puis `redirect('/login?erreur=role')`. Rôle absent → `/unauthorized` au lieu de `/login` (où l'utilisateur se reconnectait en boucle).                                                              |
| `apps/back-office/src/app/login/page.tsx`                                              | `window.location.assign` au lieu de `router.push` (le routeur pouvait resservir une réponse mise en cache pendant la déconnexion) + message expliquant pourquoi on a été raccompagné ici.                                                                                              |
| `SourcingQuickForm.tsx`, `ProductFieldsSection.tsx`, `SupplierSection.tsx`, `hooks.ts` | `noValidate` ; `type="text"` + `inputMode` sur adresse et prix ; virgule acceptée ; nom ≥ 5 caractères ; défilement vers le premier champ fautif.                                                                                                                                      |
| `use-sourcing-create-update.ts`                                                        | Les refus de la base sont traduits en français ; l'erreur complète est journalisée.                                                                                                                                                                                                    |
| `@verone/utils/src/validation/form-inputs.ts`                                          | **Nouveau** : `normalizeUrl`, `isValidUrl`, `parseDecimalInput` + 15 tests. Exporté par un sous-chemin dédié (§ 3).                                                                                                                                                                    |
| `.github/workflows/quality.yml`                                                        | Voir § 3.                                                                                                                                                                                                                                                                              |

---

## 3. Deux défauts d'infrastructure réveillés en chemin

### 3.1 `@verone/utils/validation` traîne jsdom

Le tonneau réexporte `form-security`, qui importe `isomorphic-dompurify` → `jsdom`. L'importer depuis
un écran a fait entrer jsdom dans le graphe de LinkMe (via `@verone/notifications` →
`@verone/common` → `@verone/products`) et cassé la génération de sa page `/login` :
`ENOENT … .next/browser/default-stylesheet.css`.

Corrigé par un sous-chemin dédié `@verone/utils/validation/form-inputs`, et un commentaire dans le
tonneau pour que le prochain ne retombe pas dedans.

### 3.2 Les tests E2E ne testaient pas le serveur réel

Les trois jobs E2E démarraient le back-office avec `next start`. Next **refuse** cette combinaison
avec `output: 'standalone'` et le dit à chaque démarrage :

```
⚠ "next start" does not work with "output: standalone" configuration.
✓ Ready in 406ms
[TypeError: Cannot read properties of undefined (reading 'default')]   → /login = 500
```

Le serveur montait puis répondait 500 à tout, faute de pouvoir charger le module de middleware. Le
défaut dormait tant que le back-office n'avait pas de middleware. En en ajoutant un, **cinq jobs E2E
verts sont passés au rouge pour une raison étrangère au code testé**.

Deux corrections :

1. L'étape « Start back-office » affiche désormais le code HTTP et le journal de démarrage puis
   échoue **là où l'information existe**. Avant, elle laissait le job continuer et Playwright
   rapportait « Timed out waiting 120000ms from config.webServer » deux minutes plus tard — un
   message qui ne dit rien.
2. Les jobs lancent `node .next/standalone/…/server.js`, c'est-à-dire ce que Vercel exécute en
   production, avec `static/` et `public/` recopiés à côté comme la sortie autonome l'exige.

---

## 4. Décisions techniques assumées

- **Le middleware ne vérifie pas le rôle.** Première version : il le faisait, ce qui donnait deux
  requêtes base par navigation (middleware + layout) sur un chemin déjà mesuré comme chargé
  (768 appels d'authentification sur la seule heure de 16 h UTC le 17/09, avec des erreurs GoTrue).
  L'autorisation reste côté serveur dans le layout, qui **ne fait pas confiance** au middleware
  (CVE-2025-29927 : un middleware Next.js est contournable par un en-tête).
- **`/api/*` hors du matcher.** Les routes Qonto, webhooks Packlink/Revolut et e-mails sont immuables
  et portent leur propre contrôle. Les faire passer par le middleware aurait été un risque pur.
- **Le middleware laisse passer en cas de panne** (réseau, 5xx) plutôt que de déconnecter : la
  ceinture reste le layout.
- **Pas de Zod dans le formulaire de sourcing** : aucun autre champ n'en a, la validation manuelle
  existante a été étendue au lieu d'introduire un second modèle.

---

## 5. Vérifications

| Contrôle                                                                           | Résultat                                                                                                |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `pnpm --filter @verone/back-office type-check` / `lint`                            | vert                                                                                                    |
| `@verone/products`, `@verone/utils` type-check / lint                              | vert                                                                                                    |
| `npx tsx …/validation/form-inputs.test.ts`                                         | 15 / 15                                                                                                 |
| `/dashboard` sans session (serveur local)                                          | **307** vers `/login?redirect=/dashboard` (200 + JS auparavant)                                         |
| `/login`, `/`, `/unauthorized`                                                     | 200 — routes publiques non bloquées                                                                     |
| `/api/health`                                                                      | joignable, non filtré                                                                                   |
| Session existante → `/dashboard`                                                   | rendu complet, **0 erreur console**                                                                     |
| `/login?erreur=role`                                                               | message « Vos droits n'ont pas pu être vérifiés… », pas de boucle                                       |
| Création sourcing : nom « Test », adresse `zentrada.com/article/123`, prix `12,50` | le formulaire **envoie** et signale le seul vrai problème : « Le nom doit faire au moins 5 caractères » |
| Création sourcing valide                                                           | produit créé, `cost_price = 12.50`, `supplier_page_url = https://zentrada.com/article/123`              |

**Donnée de test** : un produit `ZZTEST a supprimer 17-09` (`SRC-MU610YHU`) a été créé en base réelle
puis **supprimé**. Aucune ligne liée (stock, alertes, images, prix canal, LinkMe). Empreinte avant et
après identiques : 6 produits sourcing, dernier daté du 15/09 13:58.

---

## 6. Reste à surveiller

- Le middleware ajoute **un** appel d'authentification par navigation (middleware + layout). C'est le
  prix de la vérification serveur ; à revoir dans la session performance (02 de la feuille de route)
  avec l'amplification déjà recensée (`force-dynamic` sur la racine, hooks clients).
- `apps/back-office/next.config.js:41` portait un commentaire mensonger (« Root redirect géré par
  middleware.ts ») depuis longtemps ; il est redevenu vrai.
