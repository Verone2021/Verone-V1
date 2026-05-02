# Audit complet — Flow expéditions Packlink (archéologie + benchmark + solution livrable)

**Date** : 2026-04-22
**Contexte** : Romeo signale régressions massives sur la gestion des expéditions depuis une version antérieure. L'audit confirme : **8 composants UI clés ont été supprimés en nov 2025**, remplacés par un flow allégé en mars 2026 qui a perdu la majorité des fonctionnalités de suivi.

---

## 1. Archéologie Git — ce qui existait avant

### Timeline

| Date       | Commit      | Action                                                | Lignes                      | Impact                         |
| ---------- | ----------- | ----------------------------------------------------- | --------------------------- | ------------------------------ |
| 2025-11-12 | `60b93bc85` | **Création système multi-shipments Packlink complet** | +16795 / -13141             | Infrastructure complète        |
| 2025-11-14 | `e43c3ad46` | Multi-shipments Packlink + refactoring                | +N / -N                     | Renforcement                   |
| 2025-11-15 | `f6ed82796` | **SUPPRESSION TOTALE intégration Packlink**           | −7495 lignes                | 🚨 Régression massive          |
| 2025-11-19 | `5e32d60a6` | Re-suppression + enrichissement `stock_movements`     | -539 sur `use-shipments.ts` | Perte use-shipments hook riche |
| 2025-11-22 | `eeb466fff` | Migration Server Actions Next.js 15                   | -                           | Refactor technique             |
| 2026-03-21 | `625bc9b44` | **[SI-SHIP-002] Nouveau ShipmentWizard**              | Re-intégration minimale     |                                |
| 2026-03-23 | `6ca28bf0d` | Deploy Packlink shipping + notifications + badges     |                             |                                |
| 2026-03-25 | `f2c4ff31a` | Deploy staging → main                                 |                             |                                |

### Ce qui a été **SUPPRIMÉ** en nov 2025 (commit `f6ed82796`)

| Composant                                                                    | Lignes | Rôle                                                                                      |
| ---------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| `ShipmentCard.tsx`                                                           | 179    | Card par shipment avec status, tracking, actions (voir étiquette, copier tracking, etc.)  |
| `ShipmentsSection.tsx`                                                       | 232    | Liste des shipments dans la page commande                                                 |
| `ShipmentsSectionSimple.tsx`                                                 | 256    | Version alternative (liste simplifiée)                                                    |
| `CreateShipmentModal.tsx`                                                    | 845    | Wizard création complet (remplacé par actuel ShipmentWizard)                              |
| `PackagesBuilder.tsx`                                                        | 171    | UI pour créer plusieurs colis avec dimensions individuelles                               |
| `ServiceSelector.tsx`                                                        | 212    | Sélecteur transporteur avec filtres / tri                                                 |
| `PickupPointSelector.tsx`                                                    | 235    | Sélecteur point relais avec carte                                                         |
| `ShipmentStatusBadge.tsx`                                                    | 60     | Badge coloré selon `packlink_status` (a_payer / paye / in_transit / delivered / incident) |
| `setup-packlink-webhook.ts`                                                  | 246    | Script auto-enregistrement webhook                                                        |
| `README-WEBHOOKS.md`                                                         | 288    | Documentation webhooks                                                                    |
| Tests E2E `multi-shipments-workflow.spec.ts`                                 | 435    | Tests complets du flow                                                                    |
| Fixtures test                                                                | 246    | Données de test multi-shipments                                                           |
| Migrations SQL `20251112_001/002/003`                                        | 864    | Infrastructure DB multi-shipments                                                         |
| API routes `/api/sales-orders/[id]/shipments`, `/api/sales-shipments/create` | ~200   | Endpoints dédiés                                                                          |

**Total supprimé : ~4600 lignes de code + 2 migrations critiques + tests E2E complets.**

### Ce qui existe **AUJOURD'HUI**

| Composant                      | Lignes | Statut                                                 |
| ------------------------------ | ------ | ------------------------------------------------------ |
| `ShipmentWizard/` (6 étapes)   | ~500   | OK mais **bug silencieux** (ne log pas les erreurs DB) |
| `EditShipmentModal.tsx`        | ~150   | Édition inline tracking/carrier                        |
| `SalesOrderShipmentModal.tsx`  | ?      | À inspecter                                            |
| `OrderShipmentHistoryCard.tsx` | ?      | Historique basique                                     |
| `ShipmentHistorySection.tsx`   | ?      | Section historique                                     |

**Composants de présentation absents** : `ShipmentCard`, `ShipmentsSection`, `ShipmentStatusBadge`, `PackagesBuilder`, `ServiceSelector` riche.

**Impact utilisateur** :

- ❌ Pas de vue "toutes les expéditions de cette commande avec leur statut"
- ❌ Pas de badge coloré par statut Packlink (a_payer, paye, in_transit, delivered)
- ❌ Pas de boutons contextuels (Payer, Voir étiquette, Copier tracking)
- ❌ Pas de progression visuelle (50% si 15/30 expédiés)
- ❌ Wizard échoue silencieusement si l'INSERT DB plante

---

## 2. Benchmark CRM/ERP — standards du marché

### Odoo Inventory — Standard

- **1 Sales Order → N Delivery Orders** (comme les shipments chez Verone)
- Chaque Delivery Order a :
  - Status : draft / waiting / ready / done / cancelled
  - Backorder auto-créé si livraison partielle (système rigoureux pour éviter les pertes)
  - Tracking reference, carrier, tracking URL
  - Label PDF téléchargeable
  - Preview routing (from → to)
- UI : liste des DO dans la page SO avec **badges colorés par statut** + actions rapides
- Livraison partielle : quand on valide une DO avec qty < ordered, Odoo propose : "Créer un backorder ?" (le reste part en DO séparé)

### Shopify Admin — Fulfillments

- **Fulfillments** = équivalent de nos shipments
- Propriétés : status (open / pending / success / failure / cancelled), tracking_number, tracking_url, carrier
- UI dans Order : timeline avec tous les Fulfillments + statut + tracking cliquable
- Bouton "Track shipment" → ouvre page transporteur
- Bouton "Print label" → télécharge PDF
- Email auto au client quand fulfillment créé (configurable)

### NetSuite — Item Fulfillment

- Record type = Item Fulfillment (1 ou N par Sales Order)
- Workflow : Picked → Packed → Shipped
- Champs : carrier, tracking, label attached, delivery notes
- Vue Sales Order affiche **tableau des Item Fulfillments** avec statut + tracking

### SAP SD/MM — Delivery Documents

- **Outbound Delivery Document** (VL01N)
- Lien 1 Sales Order ↔ N Deliveries ↔ N Shipments
- Statuts multi-niveaux : Goods Issue (GI), Picking, Packing, Transport
- Integration transporteurs (Shipping Units, Handling Units)

### Cin7 / Katana (SMB-focused)

- Shipment tracking centralisé avec statuts clairs
- Email tracking automatique au client
- Multi-shipments par commande avec barre de progression

### Patterns convergents (standard)

1. **1 commande = N expéditions possibles**, chaque expédition tracée individuellement
2. **Badges colorés** par statut (5-6 statuts max pour simplicité)
3. **Progression %** affichée dans la commande (X sur Y items expédiés)
4. **Backorder automatique** si livraison partielle (reste créé comme nouvelle expé)
5. **Actions contextuelles** par expédition (payer / label / tracking / email client)
6. **Email tracking auto** au client (avec possibilité de renvoi manuel)
7. **Timeline événements** dans la commande (expédition créée le X, payée le Y, livrée le Z)

Verone avait **tout ça** en nov 2025 (commit `60b93bc85`). La version actuelle en a perdu 80%.

---

## 3. Bugs actifs aujourd'hui (confirmés par tests)

### Bug #1 — Wizard silencieux (confirmé par test)

- Shipment `UN2026PRO0001424092` existe chez Packlink pour SO-2026-00158 (confirmé par `GET /v1/shipments`)
- **0 row** en DB `sales_order_shipments` (confirmé SQL)
- Wizard affiche "Succès" + passe à step 7 même si INSERT DB échoue (code `useShipmentWizard.ts:425-438`)

### Bug #2 — Bouton "Demander compléments" caché sur validated

- `StatusActionsCard.tsx:50` → condition `status === 'draft' &&` masque tout le bloc actions
- Le bouton "Demander compléments" est inclus dans ce bloc → inaccessible dès que SO.status = validated
- Or il faut pouvoir réclamer des infos manquantes **à toutes les étapes** du cycle de vie commande

### Bug #3 — Aucune vue shipment dans la page détail commande

- `ShipmentsSection` supprimée en nov 2025, jamais remplacée
- L'utilisateur n'a **aucune visibilité** sur les shipments créés
- Même si le shipment est bien en DB, rien ne s'affiche sur la page SO

### Bug #4 — Pas de bouton "Payer sur Packlink"

- `StepSuccess.tsx:45` utilise `https://pro.packlink.fr/private/shipments/{ref}/create/address` pendant le wizard
- Ce lien **disparaît** après fermeture du wizard, aucun moyen de le retrouver depuis la page commande
- Impact : shipment créé mais non payable depuis Verone

### Bug #5 — Pas d'email tracking automatique visible

- Code webhook `/api/webhooks/packlink/route.ts:94-163` envoie un email via `/api/emails/shipping-notification`
- MAIS aucun moyen pour l'admin de re-déclencher manuellement
- Et aucun log visible de qui a reçu quoi / quand

### Bug #6 — Progression commande non mise à jour

- Dépend du bug #1 (row shipment absente → trigger `sync_quantity_shipped` ne fire pas)
- Même fixé, besoin d'afficher la progression visuellement (barre ou X/Y)

---

## 4. Solution livrable — Plan de rebuild complet

### Principe : ne pas restaurer aveuglément, reconstruire propre

Les 4600 lignes supprimées en nov contenaient du bon (composants UI) ET du mauvais (migrations obsolètes, API routes dupliquées). Ne **pas faire `git revert f6ed82796`**. Au lieu de ça, reconstruire avec l'archi actuelle.

### Phase 0 — Sauvetage immédiat (30 min)

Pour débloquer Romeo sur SO-2026-00158 :

1. INSERT manuel de la row `sales_order_shipments` liée au shipment orphelin `UN2026PRO0001424092`
2. Test : le statut SO bascule en `partially_shipped` grâce au trigger, progression correcte
3. Lien direct fourni vers Packlink pour paiement

### Phase 1 — Fix wizard critique (2 h) — **BO-BUG-SHIPMENT-001**

- Fichier : `useShipmentWizard.ts:handleCreateDraft` (lignes 345-446)
- Changements :
  1. Si `user?.id` null → afficher erreur auth explicite, PAS passer en success
  2. Si `dbResult.success === false` → afficher erreur + proposer rollback Packlink (`client.deleteShipment(ref)`)
  3. `setStep(7)` conditionnel : uniquement si DB **ET** Packlink ont réussi
  4. Écran d'erreur dédié avec :
     - Référence Packlink (si créée)
     - Raison DB (si échouée)
     - Action "Réessayer INSERT" (sans recréer Packlink) — ou "Annuler l'expédition Packlink + retry"

### Phase 2 — Restauration vue shipments dans page commande (4 h) — **BO-UI-SHIPMENT-VIEW-001**

Recréer ces 3 composants dans `packages/@verone/orders/src/components/sections/` :

**`ShipmentStatusBadge.tsx`** (~60 lignes) :

- Badge coloré selon `packlink_status` :
  - `a_payer` → 🟡 amber "À payer"
  - `paye` → 🔵 blue "Payé"
  - `in_transit` → 🟢 green "En transit"
  - `delivered` → 🟢 dark green "Livré"
  - `incident` → 🔴 red "Incident"
  - Manual (sans packlink_status) → 🟣 purple "Manuel"

**`ShipmentCard.tsx`** (~200 lignes) :

- Card complète par shipment avec :
  - Header : numéro interne + ShipmentStatusBadge + date
  - Infos : carrier_name, service, tracking_number (copier), tracking_url (ouvrir)
  - Items expédiés : liste produit + quantité
  - Adresse destination (résumé)
  - Actions contextuelles selon statut :
    - `a_payer` → 💳 "Payer sur Packlink" (lien direct `https://pro.packlink.fr/private/shipments/{id}/create/address`)
    - `paye` / `in_transit` → 📄 "Voir étiquette" + 📧 "Envoyer tracking email" + 📋 "Copier numéro suivi"
    - `delivered` → ✅ infos readonly + bouton "Marquer retour" si besoin
    - `incident` → ⚠️ bouton "Contacter Packlink" + notes incident
  - Timeline mini : created_at, updated_at, delivered_at

**`ShipmentsSection.tsx`** (~180 lignes) :

- Section "Expéditions (N)" dans la page détail commande
- Progression : "X / Y items expédiés" + barre visuelle
- Liste `ShipmentCard` triée par date desc
- Bouton global "+ Nouvelle expédition" (lance le wizard)
- Bouton "Tout expédier" si items restants

### Phase 3 — Correctif UX bouton "Demander compléments" (30 min) — **BO-UI-ORDER-ACTIONS-001**

- `StatusActionsCard.tsx:50` : découper en 2 blocs conditionnels
  - Bloc 1 (status === 'draft') : Approuver / Refuser
  - Bloc 2 (status !== 'cancelled') : Demander compléments (toujours visible pour draft + validated + partially_shipped + shipped)
- Le bouton appelle `onRequestInfo` qui existe déjà

### Phase 4 — Modal "Envoyer tracking par email" (3 h) — **BO-UI-SHIPMENT-EMAIL-001**

Voir audit précédent `audit-2026-04-22-packlink-tracking-email.md` section 3 :

- Nouveau composant `SendTrackingEmailModal`
- Réutilise `OrganisationContactsManager` + `NewContactModal`
- Appelle endpoint existant `/api/emails/shipping-notification`
- Déclenché depuis `ShipmentCard` bouton "Envoyer tracking email"

### Phase 5 — Timeline événements + logs (2 h) — **BO-UI-SHIPMENT-TIMELINE-001**

- Table `shipment_events` (à créer, migration) : id, shipment_id, event_type, event_data jsonb, performed_by, created_at
- Hook `useShipmentEvents(shipment_id)`
- Composant `ShipmentTimeline` inline dans `ShipmentCard` (événements 5 derniers)
- Events écrits automatiquement sur INSERT/UPDATE shipments + par le webhook

### Phase 6 — Tests E2E (2 h) — **BO-TEST-SHIPMENT-E2E-001**

- Restaurer / recréer `tests/e2e/orders/multi-shipments-workflow.spec.ts`
- Couvrir :
  - Création wizard Packlink (5 étapes)
  - INSERT DB correct (row créée)
  - Rollback si DB fail (delete Packlink)
  - Re-création expédition partielle (15 puis 15)
  - Affichage ShipmentsSection
  - Bouton "Payer sur Packlink"
  - Modal "Envoyer tracking email"

### Phase 7 — Doc (30 min) — **BO-DOC-SHIPMENT-001**

- Restaurer / recréer `docs/current/modules/packlink-shipping-reference.md` (existe partiellement)
- Documenter :
  - Workflow complet (wizard → Packlink → webhook → DB)
  - Mapping statuts Packlink ↔ Verone
  - Troubleshooting (shipment orphelin, webhook non reçu, etc.)

---

## 5. Estimation totale

| Phase     | Sprint                          | Effort    | Prio               |
| --------- | ------------------------------- | --------- | ------------------ |
| 0         | Sauvetage SO-2026-00158         | 30 min    | **🔴 P0 immédiat** |
| 1         | Fix wizard critique             | 2 h       | **🔴 P0**          |
| 2         | Vue shipments page commande     | 4 h       | **🟠 P1**          |
| 3         | Fix bouton demander compléments | 30 min    | **🟠 P1**          |
| 4         | Modal email tracking            | 3 h       | 🟡 P2              |
| 5         | Timeline événements             | 2 h       | 🟡 P2              |
| 6         | Tests E2E                       | 2 h       | 🟡 P2              |
| 7         | Documentation                   | 30 min    | 🟢 P3              |
| **Total** |                                 | **~14 h** |                    |

### Stratégie de livraison

- **PR 1 — Hotfix** (P0, 2.5 h) : Phase 0 + 1 — débloque le flow actuel
- **PR 2 — UX reboot** (P1, 4.5 h) : Phase 2 + 3 — restore la vue shipments + corrige le bouton
- **PR 3 — Features** (P2, 7 h) : Phase 4 + 5 + 6 — email + timeline + tests
- **PR 4 — Doc** (P3, 30 min) : Phase 7

---

## 6. Questions ouvertes

1. **Migration `shipment_events`** pour la timeline : l'ajouter ou garder sans log pour commencer ?
2. **Rollback Packlink automatique** si INSERT DB échoue : acceptable de DELETE le shipment Packlink ? Ou mieux = garder Packlink et juste reessayer l'INSERT manuel ?
3. **Tests E2E** : priorité haute ou basse ? (ralentit la livraison mais protège des régressions futures)
4. **SO-2026-00158 orphelin** : je fais le sauvetage INSERT maintenant avec le `packlink_shipment_id = UN2026PRO0001424092` ? (5 min, débloque ton test immédiat)

---

## 7. Fichiers à modifier / créer

### Modifiés

- `packages/@verone/orders/src/components/forms/ShipmentWizard/useShipmentWizard.ts` (Phase 1)
- `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/components/StatusActionsCard.tsx` (Phase 3)
- `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/components/OrderPageColumns.tsx` (intégration ShipmentsSection)

### Créés

- `packages/@verone/orders/src/components/sections/ShipmentCard.tsx` (Phase 2)
- `packages/@verone/orders/src/components/sections/ShipmentsSection.tsx` (Phase 2)
- `packages/@verone/orders/src/components/badges/ShipmentStatusBadge.tsx` (Phase 2)
- `packages/@verone/orders/src/components/modals/SendTrackingEmailModal.tsx` (Phase 4)
- `packages/@verone/orders/src/hooks/use-sales-shipments/use-shipment-events.ts` (Phase 5)
- `supabase/migrations/YYYYMMDD_shipment_events.sql` (Phase 5, optionnel)
- `tests/e2e/orders/multi-shipments-workflow.spec.ts` (Phase 6)
- `docs/current/modules/packlink-shipping-reference.md` (Phase 7, compléter existant)
