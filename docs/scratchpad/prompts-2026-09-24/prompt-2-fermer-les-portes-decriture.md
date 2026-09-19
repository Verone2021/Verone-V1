# Prompt 2 — fermer les portes qui écrivent

`[BO-SEC-MW-001]` — une seule demande vers `staging`. Aucune migration.

## Où on en est

Le 19/09, huit **portes de lecture** du back-office ont été fermées : elles rendaient les factures,
les devis et les adresses clients à n'importe qui sur Internet. Vérifié avant : `/api/qonto/invoices`
renvoyait **200 et 41 factures** sans aucune connexion. Vérifié après : **401**.

Roméo avait choisi de s'arrêter là ce soir-là, pour ne pas risquer de casser la facturation.
**Ce qui reste ouvert, c'est l'écriture.** C'est ce prompt.

**Cause de fond, inchangée** : le back-office n'a **aucun `middleware.ts`**. `(protected)/layout.tsx`
protège les **pages**, jamais `src/app/api/**`. Toute route ajoutée est ouverte par défaut.

Inventaire à jour et vérifié : `docs/current/security/api-routes-guards.md`.
Règle à appliquer : `.claude/rules/api-guards.md`. Décision : ADR-046.

## Ce qui est encore ouvert, nominativement

**Écritures financières** — un inconnu peut créer, modifier ou supprimer des factures et devis :

```
POST    qonto/invoices/[id]/cancel
DELETE  qonto/invoices/[id]/delete
POST    qonto/invoices/[id]/sync-to-order
POST    qonto/sync-invoices
POST    quotes/[id]/finalize
POST    quotes/[id]/link-qonto
POST    quotes/[id]/push-to-qonto
POST    qonto/quotes/service
POST    qonto/quotes/from-invoice/[invoiceId]
POST    packlink/shipments/sync
```

**Envoi d'e-mails depuis le domaine Vérone** — relais de hameçonnage potentiel :

```
POST    emails/linkme-info-request       POST  emails/send-consultation
POST    emails/linkme-order-approved     POST  emails/send-document
POST    emails/linkme-order-rejected     POST  emails/send-order-documents
POST    emails/linkme-step4-confirmed
```

**Deux pièges, à traiter nommément** :

- `qonto/invoices/[id]/route.ts` : le fichier **contient** une garde, mais elle n'est posée que sur
  le `GET`. **Le `PATCH` reste ouvert.** C'est exactement le piège que l'inventaire signale : la
  présence d'une garde ne prouve pas qu'elle protège tout le fichier.
- `qonto/quotes/[id]/convert/route.ts` : `auth.getUser()` est appelé **ligne 111** et **son résultat
  n'est jamais testé**. La garde existe et ne bloque rien. Route d'écriture.

**Gardes qui s'effacent toutes seules** :

- `webhooks/packlink/route.ts:23-28` — la vérification de signature est **sautée** si
  `PACKLINK_WEBHOOK_SECRET` est absente.
- `apps/linkme/src/app/api/webhook/revolut/route.ts:38` — même défaut.
- `gmail/inbound/route.ts:174-192` — accepte son jeton **dans l'adresse** (`?token=`), donc dans les
  journaux du serveur, l'historique du navigateur et l'en-tête `Referer`.

## Ce que tu ne fais pas

- **Tu ne modifies aucune ligne de logique Qonto ou Packlink.** Tu ajoutes un contrôle en tête,
  rien d'autre. La facturation doit continuer de fonctionner : c'est la condition posée par Roméo.
- Aucune migration, aucune écriture en base.
- Tu ne fusionnes pas. Tu ouvres la demande, tu t'arrêtes.

## À faire, dans cet ordre

### Temps 1 — savoir qui frappe à la porte, avant de la verrouiller

C'est la leçon d'ADR-036 : **réparer avant de durcir**. Un verrou général posé sans connaître les
appelants casse quelque chose en silence.

Pour **chacune** des routes listées :

1. `grep` de tous les appelants dans `apps/` et `packages/` ;
2. lire chaque appelant : appel depuis un écran protégé (donc porteur de la session), ou appel
   serveur, tâche planifiée, extension Chrome du sourcing ?
3. noter le résultat dans un tableau. **Les routes sans aucun appelant sont candidates à la
   suppression** — la règle dit qu'on mure une porte dont personne ne se sert.

### Temps 2 — le verrou général

Créer `apps/back-office/src/middleware.ts` : **refus par défaut sur `/api/*`**, avec liste blanche
explicite et **justifiée en commentaire**.

Le modèle existe déjà dans le dépôt : `apps/linkme/src/middleware.ts`. Copie sa structure.
Contrainte connue : pas d'import `@verone/*` dans un middleware (incompatible Edge), logique en ligne.

Doivent rester joignables — vérifie chacune avant de l'inscrire :

| Chemin                           | Qui appelle                  | Protection propre                       |
| -------------------------------- | ---------------------------- | --------------------------------------- |
| `/api/cron/meta-commerce-sync`   | tâche planifiée Vercel (4 h) | `CRON_SECRET`                           |
| `/api/cron/sync-comptabilite`    | tâche planifiée Vercel (5 h) | `CRON_SECRET`                           |
| `/api/gmail/watch/refresh`       | tâche planifiée Vercel (6 h) | `CRON_SECRET`                           |
| `/api/gmail/inbound`             | Google Pub/Sub               | jeton — **à passer en en-tête**         |
| `/api/webhooks/packlink`         | Packlink                     | signature — **à rendre obligatoire**    |
| `/api/sourcing/*`, `/api/brands` | extension Chrome du sourcing | jeton (CORS déclaré dans `vercel.json`) |
| `/api/csp-report`                | le navigateur lui-même       | aucune possible, par nature             |

**Toute autre route sous `/api/` doit exiger une session.** Si tu hésites sur une route, elle n'est
pas dans la liste blanche.

### Temps 3 — les gardes qui mentent

- `qonto/invoices/[id]` : poser la garde sur le `PATCH` aussi.
- `qonto/quotes/[id]/convert` : tester le résultat de `getUser()`. Trois lignes.
- Les trois gardes qui s'effacent : **variable absente = la route refuse**. Jamais l'inverse.
- `gmail/inbound` : jeton en en-tête, plus dans l'adresse.

### Temps 4 — tenir l'inventaire à jour

Mettre à jour `docs/current/security/api-routes-guards.md` : ce qui est fermé, ce qui reste, et
**comment ça a été vérifié**. Rappel de la règle du document : la colonne « serrure » dit qu'une
garde est _présente_, jamais qu'elle est _branchée_. Cette question se tranche en lisant le code ou
par un appel réel sans session.

## Vérification — c'est la partie qui décide

1. **Sans session, depuis Internet** : chaque route fermée répond **401**. Commandes et réponses
   copiées dans la demande.
2. **Les tâches planifiées et les webhooks répondent encore** : appel avec leur secret → pas 401.
3. **À l'écran, connecté, avant / après** : facturation (liste, ouverture, **création**, **envoi**),
   devis (liste, finalisation, conversion), expéditions, sourcing via l'extension Chrome.
   **Zéro erreur de console nouvelle.**
4. `type-check`, `lint`, `type-coverage` verts sur `@verone/back-office` (seuil 99,22).
5. Si un seul écran bronche : **tu annules et tu le dis**. Une facture qu'on ne peut plus émettre
   coûte plus cher que la faille qu'on ferme.

## Ce que Roméo doit décider

- **Supprimer ou garder** les routes sans aucun appelant (tu lui donnes la liste, il tranche).
- Si tu découvres qu'une route ouverte est appelée par quelque chose que personne n'avait identifié
  — un outil externe, un script, un automatisme — **tu t'arrêtes et tu lui demandes**.
