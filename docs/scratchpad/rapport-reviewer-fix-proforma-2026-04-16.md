# Rapport reviewer — Fix bug proforma + rattrapage

**Date** : 2026-04-16
**Branche** : `fix/BO-FIN-005-audit-regressions-devis-facture`
**Auteur** : agent coordinateur
**Destinataire** : agent reviewer (Romeo souhaite validation indépendante avant commit/exécution)

---

## 1. Contexte

Romeo signale que les proformas (factures brouillon) créées depuis `/commandes/clients` (bouton œil → Générer facture) n'apparaissent plus sous le numéro de commande, alors que ça fonctionnait il y a quelques jours.

La page `/commandes/clients` (`SalesOrderTableRow.tsx:126-141`) affiche sous `order_number` :

- Le numéro de facture si `order.invoice_number` est rempli
- Le numéro de devis si `order.quote_number` est rempli et pas de facture finalisée

Le fetcher `use-sales-orders-fetch-list.ts:230-248` remplit `invoice_number` depuis `financial_documents` (table locale) where `sales_order_id IN (...) AND document_type='customer_invoice' AND deleted_at IS NULL`.

Donc : une proforma est visible sous sa commande **ssi une ligne `financial_documents` existe avec le bon `sales_order_id`**.

---

## 2. Diagnostic DB

Requête A — proformas customer_invoice draft actuelles :

```
1 ligne : document_number='PROFORMA-)-2026-04', sales_order_id=SO-2026-00153 (oui, liée)
```

Requête B — factures customer_invoice sans sales_order_id :

```
0 ligne
```

Requête C — factures Qonto draft (via GET /api/qonto/invoices?status=draft) :

```
10 proformas draft côté Qonto, dont 6 pour des commandes avril 2026 sans ligne locale
```

**Écart** : 5 proformas Qonto draft existent pour des commandes avril 2026, **sans ligne locale**. Donc la route POST `/api/qonto/invoices` a réussi la création Qonto mais échoué l'INSERT local.

## 3. Cause racine confirmée

`apps/back-office/src/app/api/qonto/invoices/route.ts:754` :

```ts
document_number: autoFinalize
  ? (finalizedInvoice.invoice_number ?? (finalizedInvoice as unknown as Record<string, unknown>).number as string)
  : `PROFORMA-${(customerName ?? 'CLIENT').split(' ').pop()?.toUpperCase() ?? 'CLIENT'}-${issueDate.slice(0, 4)}-${issueDate.slice(5, 7)}`,
```

Contrainte DB `unique_document_number_per_type ON (document_type, document_number)` :

- Client Pokawa avec trade_name avec espace final → `customerName.split(' ').pop()` = `")"` → document_number identique `PROFORMA-)-2026-04` pour toutes
- INSERT 1 passe (SO-2026-00153, 13 avril)
- INSERT 2-N violation unique → route retourne 500 (ligne 789-805), **mais facture Qonto déjà créée** → proforma orpheline

Commit coupable : `5739cc0c8 [BO-FIN-004]` (9 avril 2026).

---

## 4. Règles métier clarifiées par Romeo (16 avril)

1. **Une seule proforma draft par commande**. Si on re-clique "Générer facture" alors qu'une proforma existe déjà, la nouvelle écrase l'ancienne.
2. **Plusieurs devis possibles par commande** (si la contrainte DB le permet), sinon idem : régénération.
3. **MAJ auto commande → document** : quand on modifie une commande qui a un devis/proforma lié, ils doivent être régénérés automatiquement (sprint séparé à planifier, pas dans ce commit).

Comportement actuel du code (`route.ts:311-333`) : guard anti-doublon retourne 409 si une proforma existe déjà. **Incompatible** avec la règle #1 de Romeo.

---

## 5. Approche proposée (à valider)

### 5.1 Fix code — 1 ligne

```diff
- : `PROFORMA-${(customerName ?? 'CLIENT').split(' ').pop()?.toUpperCase() ?? 'CLIENT'}-${issueDate.slice(0, 4)}-${issueDate.slice(5, 7)}`,
+ : `PROFORMA-${typedOrder.order_number}`,
```

Résultat : `PROFORMA-SO-2026-00155`, unique par commande, pas de collision possible.

Type-check : PASS.

### 5.2 Modifier le guard anti-doublon (`route.ts:311-333`)

**Avant** (règle actuelle) : 409 si une proforma existe.
**Après** (règle Romeo) : si une proforma draft existe → supprimer (local + Qonto) puis continuer.

Pseudo-code proposé :

```ts
const { data: existingInvoices } = await supabase
  .from('financial_documents')
  .select('id, status, qonto_invoice_id')
  .eq('sales_order_id', salesOrderId)
  .eq('document_type', 'customer_invoice')
  .is('deleted_at', null);

for (const existing of existingInvoices ?? []) {
  if (existing.status === 'draft') {
    // Supprimer côté Qonto si possible
    if (existing.qonto_invoice_id) {
      try {
        await qontoClient.deleteClientInvoice(existing.qonto_invoice_id);
      } catch {
        /* log only */
      }
    }
    // Soft-delete local
    await supabase
      .from('financial_documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    // Proforma finalisée ou payée → on garde, on refuse la création
    return NextResponse.json(
      {
        success: false,
        error: `Facture finalisée existe déjà : ${existing.document_number}.`,
      },
      { status: 409 }
    );
  }
}
```

Question reviewer : la suppression Qonto d'une proforma draft passée dans Qonto nécessite-t-elle un autre appel ? Route `DELETE /api/qonto/invoices/[id]/delete` existe (vérifié `find ... invoices/[id]/delete`).

### 5.3 Rattrapage — 5 INSERTs + 1 soft-delete doublon

Mapping Qonto → sales_orders (via `client_name + total_ttc + issue_date`) :

| Commande      | Qonto ID                             | document_date | total_ttc |
| ------------- | ------------------------------------ | ------------- | --------- |
| SO-2026-00150 | 019d728a-e37e-7cd6-b870-13fed80e361c | 2026-04-09    | 1134.00   |
| SO-2026-00151 | 019d77e7-e1fa-753d-96c1-2a30fe396860 | 2026-04-10    | 3876.67   |
| SO-2026-00152 | 019d77e6-bd42-79df-8508-47d2ef80589a | 2026-04-10    | 3913.56   |
| SO-2026-00154 | 019d77e8-b2b9-7e34-8597-63b88b00b32f | 2026-04-10    | 3214.59   |
| SO-2026-00155 | 019d77e8-e885-7f3a-8980-114790b8cb4b | 2026-04-10    | 2075.69   |

SQL complet dans `docs/scratchpad/fix-proforma-orphelines-2026-04-16.md` section "Script SQL de rattrapage".

Contrainte `check_totals_coherent` vérifiée pour les 5 lignes.
`created_by` = `100d2439-0f52-46b1-9c30-ad7934b44719` (veronebyromeo@gmail.com, id réel).

**Doublon SO-2026-00153** : Romeo a dit "supprimer les doublons". Actions :

- Supprimer côté Qonto le doublon `019d77e8-64d5-7102-96ee-f6f5028a74dd` (via DELETE route ou UI Qonto)
- Garder la proforma existante locale `PROFORMA-)-2026-04`, OU la renommer en `PROFORMA-SO-2026-00153` pour cohérence. **Décision Romeo en attente.**

### 5.4 Pas dans ce commit

- FLOW C (MAJ auto commande → document) : sprint séparé
- Insertion des `financial_document_items` pour les 5 rattrapages : non inclus (page détail proforma affichera liste vide ; les données sont dans la commande liée)
- Fix P0 (route `/api/qonto/invoices/service` fake UUID) : en attente, commit séparé
- Fix adresses shipping fetcher liste : P1, commit séparé
- Fix format slug nom client pour proforma (P2 initial) : **obsolète** car remplacé par format SO-XXXXX unique

---

## 6. Risques identifiés

1. **Suppression Qonto** : si la nouvelle logique 5.2 supprime une proforma Qonto draft, c'est irréversible côté Qonto. Acceptable (Romeo valide l'écrasement).

2. **Proformas anciennes hors période** : les drafts Qonto existants avant ce commit n'ont pas le nouveau format `PROFORMA-SO-XXXXX`. Le rattrapage 5.3 utilise le nouveau format → cohérence. Les proformas futures créées via UI utiliseront le nouveau format.

3. **Proforma `PROFORMA-)-2026-04` actuelle sur SO-2026-00153** : garde-t-on le nom cassé ou renomme-t-on ? Renommer casse l'historique du document_number, mais améliore la lisibilité.

4. **Cas où `typedOrder.order_number` serait null** : impossible, `order_number` est NOT NULL en DB (colonne obligatoire sur sales_orders, cf schéma). À confirmer avec le reviewer.

---

## 7. Questions pour le reviewer

**Q1.** Approche fix (5.1) — format `PROFORMA-${typedOrder.order_number}` suffisant pour garantir l'unicité ? Préfères-tu un format alternatif (ex: `PROFORMA-SO-2026-00155-001` pour permettre versions futures) ?

**Q2.** Approche guard (5.2) — écrasement auto des drafts existants OK, ou préférerais-tu une route dédiée `POST /api/qonto/invoices/[id]/regenerate` ?

**Q3.** Rattrapage (5.3) — OK pour INSERT direct en DB sans passer par la route API ? Ou tu veux une route `POST /api/qonto/invoices/backfill` ?

**Q4.** Items (5.4) — on laisse vides ou tu veux que j'insère `financial_document_items` depuis `sales_order_items` ?

**Q5.** Renommage `PROFORMA-)-2026-04` → `PROFORMA-SO-2026-00153` : oui/non ?

---

## 8. État des fichiers

### Modifiés (non-commit)

- `apps/back-office/src/app/api/qonto/invoices/service/route.ts` (P0, fix fake UUID — **hors scope ce commit**, à sortir de la branche)
- `apps/back-office/src/app/api/qonto/invoices/route.ts` (fix format PROFORMA — scope ce commit)

### Créés (docs)

- `docs/scratchpad/audit-regressions-devis-facture-2026-04-16.md` (audit initial)
- `docs/scratchpad/fix-proforma-orphelines-2026-04-16.md` (fix + rattrapage)
- `docs/scratchpad/rapport-reviewer-fix-proforma-2026-04-16.md` (ce fichier)

### À faire (en attente validation)

- Ajouter logique écrasement draft existant (5.2)
- Exécuter 5 INSERTs SQL rattrapage (5.3)
- Décider renommage `PROFORMA-)-2026-04`
- Supprimer côté Qonto le doublon `019d77e8-64d5-...`

### Pas touché

- Base de données (lectures seulement, aucun INSERT/UPDATE/DELETE)
- Qonto API (lectures seulement via GET /api/qonto/invoices)
- Autres branches
