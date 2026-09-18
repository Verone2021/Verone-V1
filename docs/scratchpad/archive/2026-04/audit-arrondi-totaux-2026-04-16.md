# Audit arrondi totaux DB ↔ Qonto — 2026-04-16

**Statut** : audit read-only, aucun fix appliqué.
**Branche** : `fix/BO-FIN-005-audit-regressions-devis-facture`
**Déclencheur** : Romeo refuse la tolérance au centime près. Stop rattrapage. Audit cause racine avant tout fix.

---

## Synthèse exécutive

**Cause racine confirmée** : deux méthodes d'arrondi différentes.

- **DB (trigger `recalc_sales_order_on_charges_change`)** : `ROUND(SUM(q × p × (1+tva)), 2)` → **round-per-total**
- **Qonto (calcul interne)** : `SUM(ROUND(q × p × (1+tva), 2))` → **round-per-line**

Écart d'1 centime systématique quand la somme des parties fractionnaires (ex: 177.852, 53.312, 5.648…) bascule différemment selon l'ordre d'arrondi.

**Bug secondaire confirmé** : `total_ht` stocké = HT items only (frais exclus). `total_ttc` inclut les frais. `tva_amount` calculé par soustraction absorbe donc les frais HT → taux TVA apparent faux (jusqu'à 40% au lieu de 20% sur certaines commandes).

**Scope DB** :

- 160 sales_orders au total
- 131 (82%) avec des frais shipping/handling/insurance
- **134 (84%) avec `tva_amount` structurellement incohérent** (diff >0.02 avec `total_ht × 0.2`)

---

## A1 — Calcul DB

### Code applicatif (pas d'arrondi explicite)

`packages/@verone/orders/src/hooks/use-sales-orders-mutations-write.ts:74-81` :

```ts
const totalHT = data.items.reduce(
  (sum, item) =>
    sum +
    item.quantity *
      item.unit_price_ht *
      (1 - (item.discount_percentage ?? 0) / 100),
  0
);
const totalTTC = totalHT * (1 + 0.2);
```

- Pas de ROUND. Les valeurs écrites en DB sont castées par Postgres en `numeric(12,2)` → arrondi implicite à la fin.
- Frais non inclus dans totalTTC ici.

### Trigger DB — `recalc_sales_order_on_charges_change`

Se déclenche sur UPDATE sales_orders quand shipping/handling/insurance/fees_vat_rate changent :

```sql
SELECT
  COALESCE(SUM(quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100)
              * (1 + COALESCE(tax_rate, 0.2))), 0),
  COALESCE(SUM(COALESCE(eco_tax, 0) * quantity), 0)
INTO v_items_ttc, v_eco_tax_total
FROM sales_order_items
WHERE sales_order_id = NEW.id;

v_fees_vat_rate := COALESCE(NEW.fees_vat_rate, 0.2);
v_total_charges_ht := COALESCE(NEW.shipping_cost_ht, 0) + COALESCE(NEW.insurance_cost_ht, 0) + COALESCE(NEW.handling_cost_ht, 0);

NEW.total_ttc := ROUND(v_items_ttc + (v_eco_tax_total * (1 + v_fees_vat_rate))
                       + (v_total_charges_ht * (1 + v_fees_vat_rate)), 2);
```

→ **ROUND à la fin uniquement**. Pas d'arrondi par ligne.
→ `total_ht` n'est PAS recalculé ici, il garde la valeur du INSERT initial (items HT only).
→ `tva_amount` n'est PAS écrit ici — il n'existe pas comme colonne calculée dans sales_orders (n'est que dans financial_documents).

### Calcul financial_documents

`apps/back-office/src/app/api/qonto/invoices/route.ts:720-728` (route from-order) :

```ts
let totalHt = 0;
let totalVat = 0;
for (const item of items) {
  const lineHt = (item.unit_price_ht ?? 0) * (item.quantity_num ?? 1);
  const lineVat = lineHt * (item.vat_rate_num ?? 0.2);
  totalHt += lineHt;
  totalVat += lineVat;
}
const totalTtc = totalHt + totalVat;
```

→ **Round-per-total aussi** (JS float, cast numeric(12,2) à l'INSERT).
→ Note : ce calcul diffère du trigger (pas de multiplication par `(1+tax_rate)` en une passe).

---

## A2 — Calcul Qonto

### Doc Qonto (constat empirique)

Qonto reçoit items via API :

```
unitPrice.value: "148.21"  (string HT)
quantity:        "6"
vatRate:         "0.2"
```

Qonto calcule côté serveur. Pas de total envoyé par nous.

### Observation empirique

Pour SO-2026-00124, Qonto renvoie total 3639.40. DB stocke 3639.41. Calcul ligne par ligne (voir A4) confirme que Qonto fait **round-per-line à 2 décimales**.

### Code d'envoi

`apps/back-office/src/app/api/qonto/quotes/route.helpers.ts:260-298` et équivalent invoices : on envoie chaque item + frais (shipping/handling/insurance) comme ligne séparée à Qonto. Qonto totalise.

---

## A3 — Règle d'arrondi

| Système                        | Méthode                                         | Conséquence                 |
| ------------------------------ | ----------------------------------------------- | --------------------------- |
| DB (trigger)                   | `ROUND(SUM(total_brut_float), 2)`               | round-per-total             |
| DB (route financial_documents) | Cast numeric(12,2) à l'insert après somme float | round-per-total (implicite) |
| Qonto                          | `SUM(ROUND(line_ttc, 2))`                       | round-per-line              |

**Quand ça colle** : toutes les lignes ont un TTC déjà aux centimes (ex: 571.68 = 30 × 15.88 × 1.2, pas de décimal tronquable).

**Quand ça diverge** : dès qu'une ligne a un TTC > 2 décimales (ex: 177.852 = 6 × 148.21 × 1.2 → round 177.85, truncature de 0.002 ; sommé avec autres décimales perdues, accumule 1 cent d'écart).

---

## A4 — Exemple concret SO-2026-00124

### Items (12 lignes, tva 20%, pas de remise)

| Qté   | Prix HT | Ligne HT    | Ligne TTC brut | Round-per-line |
| ----- | ------- | ----------- | -------------- | -------------- |
| 6     | 148.21  | 889.26      | 1067.112       | 1067.11        |
| 4     | 66.64   | 266.56      | 319.872        | 319.87         |
| 1     | 28.24   | 28.24       | 33.888         | 33.89          |
| 30    | 15.88   | 476.40      | 571.68         | 571.68         |
| 3     | 30.58   | 91.74       | 110.088        | 110.09         |
| 3     | 25.18   | 75.54       | 90.648         | 90.65          |
| 3     | 24.59   | 73.77       | 88.524         | 88.52          |
| 5     | 65.08   | 325.40      | 390.48         | 390.48         |
| 1     | 127.25  | 127.25      | 152.70         | 152.70         |
| 1     | 38.12   | 38.12       | 45.744         | 45.74          |
| 1     | 42.35   | 42.35       | 50.82          | 50.82          |
| 1     | 148.21  | 148.21      | 177.852        | 177.85         |
| **Σ** |         | **2582.84** | **3099.408**   | **3099.40**    |

Frais shipping 450.00 HT × 1.2 = 540.00 TTC.

- **DB (round-per-total)** : `ROUND(3099.408 + 540.00, 2)` = **3639.41** ✓ correspond au DB
- **Qonto (round-per-line)** : `3099.40 + 540.00` = **3639.40** ✓ correspond au Qonto

**Écart : 0.01 € expliqué par la ligne 177.852** (tronqué à 177.85, perte de 0.002) et la ligne 45.744 (tronquée à 45.74, perte de 0.004). Cumul = 0.010 → +0.01 côté DB.

---

## A5 — Structure total_ht / tva_amount

### Confirmation bug #1

Schéma sales_orders : `total_ht` stocké lors du INSERT applicatif avec items HT **uniquement** (cf A1). Le trigger `recalc_sales_order_on_charges_change` recalcule `total_ttc` (avec frais) mais **ne recalcule PAS `total_ht`**.

Conséquence : `tva_amount` implicite (`total_ttc - total_ht`) absorbe la HT des frais :

- SO-2026-00124 : total_ht=2582.84, total_ttc=3639.41, "tva" implicite=1056.57 — dont 450 HT frais + 90 TVA frais + 516.57 TVA items. Taux apparent 40%.

### Scope (mesure DB)

```
Total sales_orders       : 160
Avec frais (shipping/…)  : 131 (82%)
TVA structurellement KO  : 134 (84%)    -- critère: |tva_implicite - total_ht×0.2| > 0.02
```

### financial_documents

Pour chaque proforma locale rattrapée (7 lignes actuelles), on a copié `total_ht`/`tva_amount` directement depuis sales_orders → elles héritent du même bug structurel.

---

## A6 — Chronologie docs anciens

```
Tous les financial_documents actuels ont fd.created_at > so.created_at.
Aucun document local antérieur à sa commande.
```

Backfill du 2026-02-24 02:36:26 pour F-2026-005 à F-2026-016 (onze factures) : SO de nov 2025 à fév 2026 rattachées en masse. Cohérent avec le déploiement du système `financial_documents`.

**Conclusion A6** : pas de trace d'ancien workflow "devis d'abord, commande après" dans les documents **locaux**. Il peut en exister côté Qonto (proformas orphelines antérieures à leur SO) mais pas observé dans la batch actuelle. Aucun écart Qonto↔DB constaté ne s'explique par "ancien workflow".

---

## A7 — Workflow actuel création devis

`apps/back-office/src/app/api/qonto/quotes/route.ts:263-283` :

```ts
if (!salesOrderId && !customer) {
  return 400 "salesOrderId ou customer est requis";
}
if (!salesOrderId && (!customLines || customLines.length === 0)) {
  return 400 "customLines est requis pour un devis standalone (sans commande)";
}
```

→ **Workflow "devis standalone sans commande" ENCORE AUTORISÉ** dans la route API.
→ `body.customer = { customerId, customerType }` + `customLines` → devis sans SO.

**Consumer actuel** : `QuoteFormModal` (devis de service) envoie ce cas (voir commit `950931fd8`).

**Contre-exemple** : `QuoteCreateFromOrderModal` envoie toujours `salesOrderId` (FLOW A).

**Conséquence pour R5** : à implémenter dans BO-FIN-009 Phase 5, la route doit distinguer "service" (OK sans SO) et "tout le reste" (SO obligatoire). Le concept "devis service sans commande" doit rester autorisé (c'est l'exception mentionnée par Romeo).

---

## Nouvelles règles métier (source : Romeo, 2026-04-16)

### R1 — ZERO DISCORDANCE

Total commande = total devis lié = total facture liée. Aucun centime d'écart toléré.

### R2 — MODIFICATION PRIX VERROUILLÉE dans modal devis/facture

Quand on édite un devis/facture lié à une commande, les prix items sont **non éditables**.
Pour changer un prix → modifier la commande. La commande est la source de vérité.
**Why** : éviter désynchronisation ; la commande porte le prix négocié.

### R3 — DÉTECTION AUTO MODIFICATION COMMANDE

Quand une commande ayant un devis/facture draft lié est modifiée, un modal doit proposer "Un devis/facture lié existe. Regénérer avec les nouveaux montants ?" (OUI par défaut).
**Why** : garantir R1 ; supprimer la dérive.

### R4 — REGÉNÉRATION = ÉCRASEMENT (déjà en place)

Guard ajouté aujourd'hui dans `route.ts` : si proforma draft existe → delete Qonto + soft-delete local → re-création.

### R5 — SOURCE DE VÉRITÉ UNIQUE = COMMANDE

Un devis/facture ne peut exister que si une commande préexiste.
Exception unique : factures de service (`sales_order_id NULL, invoice_source='crm'`) via route `/api/qonto/invoices/service`.
**Impact** : à implémenter côté route POST `/api/qonto/quotes` (actuellement autorise standalone).

### R6 — VERROUILLAGE PAR STATUT COMMANDE

- Commande status `draft` → modifiable, devis/facture associés modifiables (via regénération R3)
- Commande status `validated` et + → **NON MODIFIABLE**, docs liés non modifiables non plus
- Seule action possible sur commande validée = annulation (`cancelled`)

### R7 — HYPOTHÈSE DOCS ANCIENS

Les commandes anciennes peuvent avoir des écarts historiques (ancien workflow). Vérifié A6 : aucun cas trouvé dans les 7 proformas actuelles. Les docs créés **après** BO-FIN-009 doivent avoir zéro écart.

---

## Plan de fix — Sprint BO-FIN-009

**À implémenter dans un sprint dédié, pas dans ce commit.**

### Phase 1 — Aligner méthode d'arrondi (round-per-line strict)

**Objectif** : DB calcule comme Qonto.

**Changements** :

1. Trigger `recalc_sales_order_on_charges_change` : remplacer `ROUND(SUM(...), 2)` par `SUM(ROUND(line_ttc, 2))` via CTE.
2. Même changement dans le calcul `financial_documents` de `route.ts` (from-order) et `route.service.ts`.
3. Recalculer également `total_ht` correctement (`SUM(ROUND(line_ht, 2))` + frais HT) et `tva_amount` (`total_ttc - total_ht`), de sorte que `tva_amount` soit la vraie TVA.

**Risque** : backfill de toutes les commandes existantes → tests non-régression obligatoires sur KPIs, exports TVA, rapports comptables.

### Phase 2 — Verrouiller édition prix dans modals devis/facture (R2)

**Objectif** : champs prix items en readonly dans `QuoteCreateFromOrderModal`, `InvoiceCreateFromOrderModal`, et leurs modals d'édition.

**Changements** :

- `QuoteItemsTable.tsx`, `InvoiceItemsSection.tsx` : attribute `readOnly` + visual `disabled` sur les inputs de prix
- Retirer les handlers `onChange` de prix
- Garder édition possible pour : `customLines` (ajout de lignes libres hors commande — à débattre)

### Phase 3 — Verrouillage modifications selon statut commande (R6)

**Objectif** : bloquer tout UPDATE de prix/items/frais sur commande non-draft.

**Changements** :

- Route/hook `updateOrderWithItems` : check `status === 'draft'` avant update, sinon 403
- UI : désactiver boutons d'édition sur commandes ≥ validated
- Exception : champ `notes` et champs logistique (date livraison) restent éditables ?

### Phase 4 — Trigger détection modification commande + modal regénération (R3)

**Objectif** : quand une commande avec devis/facture draft liée est modifiée, proposer regénération auto.

**Options** :

- **(a) Frontend** : hook `useSalesOrder`, détecter changement + appel à un endpoint `/api/qonto/quotes/by-order/[id]/regenerate`
- **(b) Trigger DB** : NOTIFY channel quand sales_order total_ttc change, frontend écoute
- **(c) Migration** : seulement après Phase 3 (commandes validées gelées)

### Phase 5 — Bloquer création devis/facture sans commande (R5)

**Objectif** : route POST `/api/qonto/quotes` refuse si pas de `salesOrderId`, sauf `isServiceMode: true` (nouveau flag).

**Changements** :

- Route : ajouter distinction `kind: 'from-order' | 'service'`
- UI `QuoteFormModal` : envoyer `kind: 'service'` explicitement
- Retirer le chemin `standaloneCustomer` pour les devis non-service

### Phase 6 — Badge visuel d'alerte discordance (BO-FIN-011, filet de sécurité)

**Objectif** : avant que Phase 1 soit déployée, afficher badge warning sur facture/devis si `total_ttc_local != total_ttc_qonto` > 0.01.

**Changements** :

- Composant badge dans `InvoicesTable.tsx`, `SalesOrderTableRow.tsx`
- Fetch ajouter le `total_ttc` Qonto (via enrichment)
- Design : pastille orange "⚠ écart X cents"

---

## Risques

1. **Phase 1 / backfill totaux** : `tva_amount` va changer pour ~134 commandes. Si des exports comptables ou déclarations TVA ont été faits sur les anciennes valeurs, risque de désalignement historique. **Pré-requis** : audit consommateurs de `tva_amount` avant exécution.

2. **Phase 2 / édition prix** : si des utilisateurs s'attendaient à éditer le prix ligne par ligne dans le modal facture, ils seront bloqués. Communication métier requise.

3. **Phase 4 / regénération auto** : si la commande a plusieurs docs liés (1 devis + 1 facture), faut-il regénérer les deux ? Règle métier à clarifier.

4. **Proformas déjà rattrapées aujourd'hui (7 lignes)** : elles héritent des bugs #1 et #2. Soit on les corrige en Phase 1, soit on les laisse comme docs historiques (R7).

---

## État actuel DB (pour référence)

7 proformas customer_invoice draft :

| Doc                    | SO            | DB TTC  | Qonto TTC | Écart |
| ---------------------- | ------------- | ------- | --------- | ----- |
| PROFORMA-SO-2026-00124 | SO-2026-00124 | 3639.41 | 3639.40   | +0.01 |
| PROFORMA-SO-2026-00150 | SO-2026-00150 | 1134.00 | 1134.00   | 0     |
| PROFORMA-SO-2026-00151 | SO-2026-00151 | 3876.68 | 3876.67   | +0.01 |
| PROFORMA-SO-2026-00152 | SO-2026-00152 | 3913.56 | 3913.56   | 0     |
| PROFORMA-SO-2026-00153 | SO-2026-00153 | 2944.45 | 2944.46   | -0.01 |
| PROFORMA-SO-2026-00154 | SO-2026-00154 | 3214.58 | 3214.59   | -0.01 |
| PROFORMA-SO-2026-00155 | SO-2026-00155 | 2075.69 | 2075.69   | 0     |

4 écarts / 7 = 57% des proformas.

2 proformas Qonto draft orphelines (pas en DB locale) :

- `019cd35e-…` F-2026-017-PROFORMA Pokawa Besançon 283.92 → match SO-2026-00117 (pas rattrapée)
- `019d018a-…` F-2026-018-PROFORMA HNL POKA EXPRESS -579.46 → avoir, pas de match propre

---

## TODO après validation audit

1. Romeo relit ce scratchpad, valide le plan BO-FIN-009 en 6 phases
2. Ajout sprints dans `.claude/work/ACTIVE.md` :
   - BO-FIN-009 : alignement arrondi + verrouillages (6 phases ci-dessus)
   - BO-FIN-010 : badges différenciation devis/proforma/facture (déjà demandé séparément)
   - BO-FIN-011 : badge visuel alerte discordance (Phase 6 BO-FIN-009, peut être sprint indépendant en filet de sécurité)
3. Puis commit du fix actuel (route.ts : format `PROFORMA-${order_number}` + guard écrasement draft). Stash P0 resté de côté.

**Rien n'est poussé. Rien n'est fixé. Attente relecture Romeo.**
