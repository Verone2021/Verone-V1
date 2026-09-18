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
