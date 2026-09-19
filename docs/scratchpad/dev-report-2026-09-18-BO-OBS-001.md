# Compte rendu — session du 2026-09-18 (soir) au 2026-09-19

**Demandes ouvertes** : #1185, #1186, #1187, #1188. **Aucune fusionnée** — Roméo décide.
**Aucune écriture en base.** Aucune migration. Aucune rotation de clé.

---

## 1. Les quatre demandes

| #        | Titre                                                  | Contenu                                                                                                                                                                                           | Contrôles |
| -------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| **1185** | `[SI-MAINT-001]` Fermer provisoirement la boutique     | Interrupteur `SITE_MAINTENANCE=1` → page d'attente en **HTTP 503 + Retry-After**. Webhook Stripe, tâches planifiées et sonde exemptés. Réouverture = retirer la variable                          | **verts** |
| **1186** | `[BO-SEC-GUARD-001]` Fermer les portes de lecture      | `requireBackofficeAdmin` sur 8 handlers `GET`. Zéro ligne de logique Qonto/Packlink touchée. Trousseau `docs/current/security/api-routes-guards.md`                                               | **verts** |
| **1187** | `[BO-OBS-001]` Voir ce qui casse chez les utilisateurs | PostHog (back-office + LinkMe), filet d'erreur au-dessus des fournisseurs, code technique visible en production, rechargement après nouvelle version, anti-traduction, suppression de `/api/logs` | en cours  |
| **1188** | `[INFRA-RULES-046]` La règle des gardes d'API          | `.claude/rules/api-guards.md` + ADR-046 + index. Demande dédiée, comme l'impose le `CLAUDE.md` racine                                                                                             | en cours  |

---

## 2. Bloc 1 — la fuite, et ce qui en a été fait

### La preuve

Appel depuis Internet, **sans aucune session**, 2026-09-18 16 h 45 UTC :

```
GET /api/qonto/invoices                → 200, 172 311 octets, 41 factures
                                         (client, contact_email, montants, invoice_url)
GET /api/qonto/quotes                  → 200, 27 597 octets
GET /api/packlink/shipments/pending    → 200, 1 331 octets
GET /api/sales-orders/<uuid>/customer-address
                                       → 404 « Commande introuvable »
                                         ← la requête part en base AVANT tout contrôle
```

**Cause racine** : le back-office n'a pas de `middleware.ts`. `(protected)/layout.tsx` couvre les
**pages**, jamais `src/app/api/**`.

### Le tableau demandé — routes portant la clé `service_role`

| Application   |  Routes | Avec clé `service_role` |          Dont sans aucune garde |
| ------------- | ------: | ----------------------: | ------------------------------: |
| back-office   |     152 |                      50 | **17** (25 avant cette session) |
| LinkMe        |      17 |                       5 |                               4 |
| site internet |      25 |                      10 |                               4 |
| **Total**     | **194** |                  **65** |                          **25** |

Détail nominatif, route par route, avec la colonne « garde oui/non » et « écrit en base » :
**`docs/current/security/api-routes-guards.md`**, livré dans la demande #1186.

### Les huit portes fermées

`qonto/invoices` (GET) · `qonto/invoices/[id]` (GET seul, PATCH intact) · `qonto/quotes` (GET) ·
`qonto/quotes/by-order/[orderId]` · `qonto/debug-counts` · `packlink/shipments/pending` ·
`exports/google-merchant-excel` (GET) · `sales-orders/[id]/customer-address`.

### Vérification

Sans session, en local : **401 sur les quatre routes testées**.
Avec session, dans le navigateur : factures 200 (41), devis 200 (41), expéditions 200 (2),
détail facture 200, devis d'une commande 200, adresse client 200.
À l'écran : Facturation, onglet Devis, Expéditions Clients — **inchangés, 0 nouvelle erreur**.

### `customer-address` — trois constats

1. **Aucun écran ne l'appelle** : code mort resté branché sur Internet.
2. Repassée sur le **client normal** : les trois tables lues portent une règle
   `is_backoffice_user()` (vérifié en base), la clé passe-partout n'était pas nécessaire.
   Confirmé par un appel réel avec session → 200.
3. Contrôle de format d'identifiant ajouté, branche morte dupliquée retirée.

---

## 3. Bloc 2 — observabilité

### Ce qui est en place

- PostHog sur back-office et LinkMe. **Rien ne démarre** sans clé **et** hors production.
- Exceptions non rattrapées, rejets de promesse, erreurs de console.
- **Rejeu déclenché uniquement sur erreur**, jamais d'enregistrement permanent.
- Console et réseau dans le rejeu, **corps des requêtes exclus**.
- Masquage : toutes les saisies + e-mail, téléphone, adresse, code postal + ville, montant, IBAN.
- Identification par identifiant Supabase + rôle, **jamais l'e-mail**.
- Version de l'application sur chaque événement (`VERCEL_GIT_COMMIT_SHA`).
- CSP élargie aux deux hôtes PostHog — sans ça, blocage **silencieux**.
- `turbo.json` déclare les variables, sinon le cache partagé sert un build sans clé.

### Le filet d'erreur

Vraie limite d'erreur React (il n'en existait **aucune** dans le dépôt) au-dessus de toute la chaîne
de fournisseurs. Trois sorties : réessayer · recharger complètement · se déconnecter — la
déconnexion **déconnecte vraiment** avant la navigation dure.

Code technique (`error.digest`) **affiché aussi en production**, avec « communiquez ce code au
support », dans les deux écrans d'erreur et dans le composant partagé des 11 écrans protégés.

### Preuves à l'écran

| Provoqué                             | Résultat                                                         | Capture                                      |
| ------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------- |
| Erreur levée **dans un fournisseur** | les trois sorties s'affichent                                    | `20260919/obs-filet-fournisseurs-000400.png` |
| Erreur côté serveur                  | « Code technique : 2909516798 — Communiquez ce code au support » | —                                            |
| Bouton « Se déconnecter »            | ramène à l'écran de connexion                                    | —                                            |

Le code de test a été **entièrement retiré** avant le commit (page temporaire et déclenchement
provisoire dans un fournisseur) : vérifié par recherche, zéro trace.

### Contrôles durables ajoutés

- `apps/back-office/src/lib/observability/__tests__/posthog.test.ts` → **21 réussis** :
  11 textes sensibles masqués, 8 libellés d'interface conservés lisibles, règle « rien hors production ».
- `apps/site-internet/src/lib/__tests__/maintenance.test.ts` → **14 réussis**.

---

## 4. Ce que je n'ai pas pu vérifier

1. **L'erreur de test arrivée dans PostHog, avec son rejeu.** Le compte n'est pas encore créé : la
   page d'inscription a été ouverte dans Chrome (hébergement UE présélectionné), Roméo doit saisir
   ses identifiants lui-même. Rien ne s'initialise hors production de toute façon.
   **Je n'annoncerai pas ce bloc terminé avant d'avoir ouvert un rejeu et vérifié de mes yeux
   qu'aucun e-mail client n'y est lisible.**
2. **`build` en local.** Les serveurs de développement de Roméo tournent sur les trois ports ; un
   build écraserait leur cache partagé. Couvert par les contrôles automatiques (verts sur #1185 et #1186).
3. **Le comportement réel de la page d'attente en ligne** : le site ne ferme qu'à la fusion de #1185.

---

## 5. Défauts trouvés en chemin, non embarqués

| Constat                                                                                                                                                    | Preuve                       | Pourquoi laissé                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------- |
| **~15 routes qui écrivent** (factures, devis Qonto) répondent sans connexion                                                                               | inventaire #1186             | Décision de Roméo : ne rien casser côté facturation ce soir |
| **7 routes `emails/*`** sans garde → relais d'envoi depuis le domaine Vérone                                                                               | inventaire #1186             | idem                                                        |
| `qonto/quotes/[id]/convert` appelle `getUser()` ligne 111 et **ne teste jamais le résultat**                                                               | lecture ligne à ligne        | correction d'une ligne, mais c'est une route d'écriture     |
| `webhooks/packlink` et `webhook/revolut` **sautent** leur vérification si la variable manque ; `gmail/inbound` accepte son jeton dans l'adresse            | audit du 18/09               | chantier sécurité dédié                                     |
| Le détail d'une commande demande `sales_orders.internal_notes`, **colonne inexistante en base** (vérifié) — 2 erreurs de console                           | requête `information_schema` | antérieur, sans rapport                                     |
| `scripts/check-config-integrity.sh` échoue déjà : références mortes + **erreur de syntaxe ligne 136**                                                      | exécution                    | antérieur, sans rapport                                     |
| Le dossier `docs/scratchpad/audit-2026-09-18/` n'était **pas suivi par git** et a disparu du disque en cours de session (récupéré depuis une mise de côté) | `git stash show`             | versionné dans #1186 pour qu'il ne disparaisse plus         |

---

## 6. Ce que Roméo doit faire

1. **Créer le compte PostHog** (page ouverte dans Chrome, hébergement UE). Je reprends la main
   ensuite pour la clé et le branchement sur les deux projets en ligne.
2. **Prévenir par écrit les deux salariées** que les sessions du back-office sont enregistrées en
   cas d'erreur, avec masquage des saisies. Obligation légale, je ne peux pas la faire à sa place.
3. **Donner l'ordre de fusion**, demande par demande. Ordre conseillé : **1185** (fermer la
   boutique) → **1186** (les serrures) → **1188** (la règle) → **1187** (observabilité, une fois la
   clé posée).

---

# ADDENDUM — mise en ligne et vérifications réelles (2026-09-19, 00 h → 01 h 45 Paris)

Roméo a donné l'ordre de tout passer sur `main`. Chaîne complète exécutée. Hors fenêtre
interdite (ADR-041) : 22 h 48 → 23 h 42 UTC, un vendredi.

## Ce qui a été mis en ligne

| Demande  | Sujet                                                | Fusionnée           |
| -------- | ---------------------------------------------------- | ------------------- |
| 1185     | `[SI-MAINT-001]` fermeture provisoire de la boutique | staging 22 h 48 UTC |
| 1186     | `[BO-SEC-GUARD-001]` 8 portes de lecture fermées     | staging             |
| 1188     | `[INFRA-RULES-046]` règle + ADR-046                  | staging             |
| 1187     | `[BO-OBS-001]` PostHog + filet d'erreur              | staging             |
| **1189** | **release `staging` → `main`**                       | **23 h 09 UTC**     |
| 1190     | `[BO-OBS-002]` le rejeu doit montrer l'AVANT         | staging             |
| **1191** | **release `staging` → `main`**                       | **23 h 42 UTC**     |

Un conflit sur `turbo.json` (les variables de #1185 et celles de #1187) résolu en gardant les deux.

## Preuves en production — avant / après

Appels depuis Internet, **sans aucune session** :

| Adresse                                     | Avant                                | Après                                              |
| ------------------------------------------- | ------------------------------------ | -------------------------------------------------- |
| `/api/qonto/invoices`                       | **200, 172 311 octets, 41 factures** | **401** `{"success":false,"error":"Acces refuse"}` |
| `/api/qonto/quotes`                         | **200, 27 597 octets**               | **401**                                            |
| `/api/packlink/shipments/pending`           | **200, 1 331 octets**                | **401**                                            |
| `/api/sales-orders/<uuid>/customer-address` | 404 (requête partie en base)         | **401** avant toute requête                        |
| `/api/qonto/quotes/by-order/<uuid>`         | 200                                  | **401**                                            |
| `www.veronecollections.fr`                  | 200                                  | **503** + `Retry-After: 3600`                      |

**Aucune régression** : écran Facturation en production, connecté — 41 factures, 72 196,82 € de
total, onglets Devis (41) et Avoirs (5). Capture :
`.playwright-mcp/screenshots/20260919/prod-factures-apres-release-011500.png`.

**Boutique fermée proprement** : page « la boutique est momentanément fermée / nous revenons très
vite / contact@veronecollections.fr », `cache-control: no-store`, catalogue en 503.
**Le webhook de paiement Stripe répond toujours** (400 « signature manquante » = joignable, ce
n'est pas la page d'attente) : aucune commande déjà payée n'est perdue.

**Anti-traduction actif** : le code servi contient `<html lang="fr" … translate="no">` et la classe
`notranslate` sur le `body`.

## PostHog — ce qui marche, et le défaut trouvé en testant

Compte `romeo@veronecollections.fr`, **région UE**, organisation Vérone, projet **278462**,
conservation des rejeus **30 jours**.

**Ce qui est prouvé** : erreur volontaire provoquée en production → PostHog a chargé
`exception-autocapture.js` avec la bonne clé, envoyé les événements sur `eu.i.posthog.com/i/v0/e/`,
et l'interface affiche bien **`Exception`**, **`Identify`** et **`Set person properties`** —
l'utilisateur identifié par `100d2439-0f52-46b1-9c30-ad7934b44719`, **un identifiant Supabase,
jamais un e-mail**.

**Le défaut trouvé** : **aucun rejeu n'a été créé**. Deux causes :

1. l'enregistrement n'était déclenché que par nos propres filets React — une erreur captée
   directement par PostHog ne produisait rien ;
2. et quand il se déclenchait, il commençait **au** plantage : on aurait vu l'écran figé, jamais
   ce qui l'a cassé. C'est exactement l'information qui a manqué le 17/09.

**Corrigé** (`[BO-OBS-002]`, demande #1190) : déclencheur sur l'événement `$exception` configuré
côté projet — l'enregistreur garde une fenêtre glissante **en mémoire** et ne persiste que si une
erreur survient. L'exigence « pas d'enregistrement permanent » reste tenue.

Deux réglages invisibles ont dû être corrigés à la main, et méritent d'être connus :

- **« Record user sessions » était désactivé par défaut.** Sans lui, `startSessionRecording()` ne
  fait strictement rien.
- **Le déclencheur ne peut pas être posé sur un projet neuf** : la liste d'événements est vide tant
  qu'aucune erreur n'a été reçue. D'où l'ordre : brancher → provoquer une erreur → configurer.

## Défaut trouvé dans mon propre travail, et corrigé

La demande #1187 affirmait que `turbo.json` déclarait les variables PostHog. **C'était faux** :
le remplacement visait une ligne qui n'existait que sur une autre branche, et je n'avais pas relu
le résultat. Sans correction, **Turbo filtre les variables non déclarées et elles n'arrivent jamais
à l'application** — le journal de construction Vercel le dit explicitement. Corrigé avec
vérification après écriture, et rectifié publiquement en commentaire de la demande.

## Où sont rangées les clés

| Emplacement                                                    | Contenu                                                   |
| -------------------------------------------------------------- | --------------------------------------------------------- |
| Vercel `verone-back-office` et `linkme` (production + preview) | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`     |
| `apps/*/.env.local` (hors suivi git)                           | idem                                                      |
| `apps/*/.env.example` (versionné)                              | **les noms seulement** — ADR-034                          |
| `turbo.json > tasks.build.env`                                 | déclarées, sinon filtrées                                 |
| `.claude/local/OPERATIONS-RUNBOOK.md`                          | compte, région, réglages à ne pas casser, arrêt d'urgence |
| Mémoire agent                                                  | `posthog-observabilite`                                   |

Rien sur `veronecollections-fr`. La clé `phc_…` **n'est pas un secret** : PostHog la qualifie de
« write-only key, safe to use in public apps », elle part dans le code envoyé au navigateur.

---

# ADDENDUM 2 — le masquage, vérifié à l'œil (2026-09-19, 03 h Paris)

## Ce qui a été trouvé en ouvrant un vrai rejeu

**Le masquage ne fonctionnait pas.** Le rejeu de l'écran Facturation laissait lire en clair :

> MONSIEUR LAURENT DANIEL LEJOSNE · Pokawa Lille flandres · MT Solutions ·
> POKE 18EME (Pokawa Custine) · 557,28 € · 1 970,29 €

Aucune lecture de code ne l'aurait montré. Il fallait ouvrir l'enregistrement et regarder.

### Deux défauts distincts

1. **`maskTextFn` n'était jamais appelée.** La documentation de la bibliothèque est explicite :
   _« Session replay masks input values by default (see `maskAllInputs`), but it does not mask other
   DOM text or images. »_ Sans `maskTextSelector`, la fonction de masquage est du code mort. Elle
   était écrite, testée, et ne servait à rien.
2. **Aucune expression régulière ne reconnaît un NOM.** Les motifs attrapaient e-mail, téléphone,
   adresse, montant, IBAN — et passaient à côté de « Pokawa Lille flandres ». Ce n'est pas une
   question d'affiner le motif.

### La correction — `[BO-OBS-003]`, demande #1192

Masquage **par emplacement autant que par motif** :

- tout texte dans une **cellule de tableau** (ou un élément `data-posthog-mask`) → masqué **sans
  condition** ;
- les motifs sensibles restent masqués **partout**, y compris hors tableau ;
- l'**habillage de l'interface** reste lisible.

Compromis assumé : diagnostiquer un plantage demande de voir **quel écran, quels boutons, quelle
navigation** — jamais le contenu des tableaux.

## Vérification finale, à l'œil, sur le rejeu en production

Capture : `.playwright-mcp/screenshots/20260919/posthog-rejeu-masquage-verifie.jpg`

| Élément                                                                     | Dans le rejeu |
| --------------------------------------------------------------------------- | ------------- |
| Les 4 totaux en euros (72 196,82 € …)                                       | **`●●●`**     |
| Nom du client, colonne Client                                               | **`•••`**     |
| Montant, date, échéance, statut, paiement                                   | **`•••`**     |
| Numéro de facture, numéro de commande                                       | **`•••`**     |
| Titre « Facturation », boutons, onglets                                     | lisibles      |
| Compteurs « Factures 41 », « Devis 41 », « Brouillons 6 », « 41 résultats » | lisibles      |
| Adresse de la page, barre latérale, icônes d'action                         | lisibles      |

**Aucune donnée client n'est lisible. L'écran reste diagnosticable.**

## Le reste du dispositif, vérifié en production

- **Le rejeu contient l'avant** : navigation et défilement effectués **avant** l'erreur, puis
  l'erreur ; l'envoi vers `eu.i.posthog.com/s/` ne part **qu'après** l'erreur.
- **Aucun enregistrement permanent** : 3 sessions enregistrées au total, correspondant aux
  3 erreurs de test. Toute la navigation normale de la nuit n'a produit **aucun** rejeu.
- **Le rapport d'erreur est précis** : message, navigateur (**Chrome 153**), système
  (**Mac OS X 10.15.7**), pile d'appels, nombre d'occurrences, de sessions et d'utilisateurs,
  et le rejeu rattaché.
- **Identification** : `100d2439-0f52-46b1-9c30-ad7934b44719` — identifiant Supabase, **jamais
  l'e-mail**.

## Ce qui n'a pas pu être fait

**L'enregistrement de test qui contient les données non masquées n'a pas pu être supprimé.** Il
n'apparaît pas dans la liste des enregistrements (session trop courte pour le filtre par défaut),
seulement depuis la fiche d'erreur, qui n'offre pas de suppression. Il est dans le compte de Roméo,
hébergé en Europe, et **s'efface automatiquement au bout de 30 jours**. Signalé plutôt que tu.

## Reste à faire par Roméo

**Prévenir par écrit les deux salariées.** Texte prêt à envoyer :
`docs/scratchpad/message-salariees-enregistrement-sessions.md`.
