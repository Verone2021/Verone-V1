# Audit Phase 4 — Régénération documents liés (R3 finance.md)

**Date** : 2026-04-20
**Sprint** : Préparation BO-FIN-009 Phase 4
**Objectif** : cartographier ce qui existe déjà avant de coder la détection/régénération auto.

---

## 1. Synthèse exécutive

**Excellente nouvelle** : Phase 4 est **déjà à 80% implémentée** via le sprint BO-FIN-029 merged récemment.

- **Backend** (routes régénération, versioning, soft-delete, superseded) : **100% FAIT**
- **Composants UI** (modal, badge, détection helper) : **100% créés** mais **non branchés**
- **Intégration UI** : **à faire** (ce qui reste de Phase 4)

**Scope restant** : brancher 3 composants existants aux bons endroits. Pas de nouveau backend, pas de migration.

---

## 2. Ce qui existe déjà (BO-FIN-029)

### 2.1 Routes backend (fonctionnelles)

| Route                                                             | Rôle                                                | Statut                  |
| ----------------------------------------------------------------- | --------------------------------------------------- | ----------------------- |
| `POST /api/qonto/quotes/by-order/[orderId]/regenerate`            | Régénère un devis draft après modification commande | ✅ Fait (390L, robuste) |
| `POST /api/qonto/invoices/by-order/[orderId]/regenerate-proforma` | Régénère une proforma draft                         | ✅ Fait                 |
| `GET /api/qonto/quotes/by-order/[orderId]`                        | Liste devis liés à une commande                     | ✅ Fait                 |
| `GET /api/qonto/invoices/by-order/[orderId]`                      | Liste factures liées à une commande                 | ✅ Fait                 |

**Comportement** :

- Soft-delete local atomique (`quote_status = 'superseded'` + `deleted_at = NOW()`)
- Delete Qonto non-bloquant (erreur loggée mais pas propagée)
- Refuse 409 si document finalisé/accepté existe (protection comptable R4)
- Incrémente `revision_number` (versioning)
- Préserve `customLines` et `notes` choisis par l'utilisateur
- Items recalculés depuis la commande (R1 + R2 + R6)

### 2.2 Migrations DB

| Migration                                          | Contenu                                               |
| -------------------------------------------------- | ----------------------------------------------------- |
| `20260427_financial_documents_revision_number.sql` | Colonne `revision_number` (versioning devis/factures) |
| `20260429_allow_superseded_quote_status.sql`       | Status `superseded` autorisé dans check constraint    |

### 2.3 Composants UI créés

#### `RegenerateDocumentConfirmModal` (`@verone/finance`, 220L)

- Modal de confirmation avant régénération
- Sélecteur de customLines à préserver (checkbox par ligne)
- Option "Conserver les notes"
- Prêt à l'emploi, **non branché actuellement**

#### `DocumentOutOfSyncBadge` (`@verone/finance`, 58L)

- Badge orange "Non synchronisé"
- Helper pur : `isDocumentOutOfSync(orderUpdatedAt, documentCreatedAt)` = true si `orderUpdatedAt > documentCreatedAt`
- N'affiche le badge QUE si document status = `draft` ET out-of-sync
- Prêt à l'emploi, **non branché actuellement**

### 2.4 Helper duplicate-guard

`apps/back-office/src/app/api/qonto/quotes/_lib/duplicate-guard.ts` :

- Anti-doublon : si devis draft existe → soft-delete superseded + delete Qonto
- Utilisé par la route POST /api/qonto/quotes (création depuis commande)

---

## 3. Ce qui reste à faire (scope Phase 4)

Le vrai travail restant est uniquement côté **intégration UI**.

### 3.1 Brancher `DocumentOutOfSyncBadge` sur les listes

**Cibles** :

- Liste `/factures` — Afficher badge sur factures draft out-of-sync
- Liste `/devis` — Afficher badge sur devis draft out-of-sync
- `QuotesSection` (page détail commande LinkMe) — Afficher badge par devis

**Données requises** : `orderUpdatedAt` (jointure `sales_orders.updated_at`) + `documentCreatedAt` + `documentStatus`

**Note** : certaines listes peuvent nécessiter d'enrichir la query pour inclure `sales_orders.updated_at`.

### 3.2 Brancher `RegenerateDocumentConfirmModal`

**2 options d'intégration** :

**Option A — Bouton manuel** (plus simple, moins intrusif) :

- Ajouter bouton "🔄 Re-synchroniser" sur chaque document draft out-of-sync dans les listes
- Clic → ouvre modal → POST vers route regenerate → toast succès

**Option B — Détection auto** (R3 strict) :

- Après `updateOrderWithItems` / `updateOrder` sur commande draft, fetch les documents draft liés
- Si au moins un out-of-sync → ouvrir modal automatiquement avec OUI par défaut
- Si plusieurs docs draft → régénérer tous en cascade (1 modal, N POSTs séquentiels)

**Recommandation** : commencer par **Option A** (plus itératif). Si user feedback positif, ajouter Option B par-dessus. Option B seule est plus intrusive et peut créer du bruit UX si l'utilisateur fait plusieurs micro-modifications.

### 3.3 Historique des devis (question Romeo)

**Point soulevé par Romeo** : peut-on accéder à la page détail d'un devis superseded ?

**État actuel à vérifier** :

- Page `/factures/devis/[id]/page.tsx` existe et rend le détail d'un devis
- Quand un devis est superseded, il a `deleted_at != NULL` → la query qui fetch le devis doit EXCLURE le filtre `deleted_at IS NULL` pour que le détail reste accessible
- À confirmer : la page détail charge-t-elle avec ou sans filtre `deleted_at` ?

**Recommandation métier** : garder l'historique accessible **en lecture seule**. Un devis superseded/deleted doit être consultable dans l'historique de la commande, cliquable, mais clairement marqué "Remplacé par révision N".

**Scope estimé historique** : 1 fichier à modifier (query helper de la page détail devis) si bug détecté.

### 3.4 Liste des documents "actifs + historique" dans page détail commande

Dans `QuotesSection` (et son pendant factures), afficher :

- Devis **actif** (revision_number le plus élevé, non superseded) en haut
- Devis **historique** (superseded) en dessous, en gris, cliquables, badge "Révision N — remplacée"

---

## 4. Plan de travail recommandé (Phase 4 scope final)

### Étape 1 — Branchage badges (1h)

- Ajouter `DocumentOutOfSyncBadge` aux listes `/factures`, `/devis`, `QuotesSection`
- Enrichir les queries si `sales_orders.updated_at` manquant

### Étape 2 — Bouton "Re-synchroniser" + modal (1-2h)

- Ajouter bouton par document draft out-of-sync
- Brancher `RegenerateDocumentConfirmModal`
- Fetch vers `/api/qonto/{quotes|invoices}/by-order/[id]/{regenerate|regenerate-proforma}`
- Invalidate react-query après succès
- Toast succès

### Étape 3 — Vérifier historique devis (30min)

- Tester accès page détail devis superseded
- Si query exclut les soft-deleted : corriger en lecture seule
- Ajouter badge "Révision N" sur détail

### Étape 4 (optionnel) — Détection auto modale (1h)

- Hook post-mutation commande
- Si docs draft out-of-sync → ouvre modal automatiquement
- À faire seulement après validation Option A

### Hors scope (sessions futures)

- Cascade multi-documents (1 devis + 1 facture) si usage avéré
- Liste historique séparée par commande (si Romeo le veut)

---

## 5. Questions à clarifier avec Romeo

1. **Option A vs B** : commencer par bouton manuel, ou aller direct à la détection auto modale ?
2. **Cascade multi-docs** : doit-on régénérer devis + facture en 1 clic, ou traiter séparément ?
3. **Badge sur page détail commande** (`QuotesSection`) : prioritaire ou peut attendre ?

---

## 6. Risques et précautions

- **Faibles** : backend prouvé en production, composants UI déjà revus
- **Attention** : tester qu'un utilisateur qui a modifié une commande puis cliqué "Re-synchroniser" voit bien le nouveau devis (invalidation cache react-query)
- **Ne PAS toucher** : routes backend existantes (fonctionnelles), composants modal/badge (complets)

---

## 7. Sources consultées

- `apps/back-office/src/app/api/qonto/quotes/by-order/[orderId]/regenerate/route.ts` (390L)
- `apps/back-office/src/app/api/qonto/invoices/by-order/[orderId]/regenerate-proforma/route.ts`
- `packages/@verone/finance/src/components/RegenerateDocumentConfirmModal/index.tsx` (220L)
- `packages/@verone/finance/src/components/DocumentOutOfSyncBadge.tsx` (58L)
- `apps/back-office/src/app/api/qonto/quotes/_lib/duplicate-guard.ts`
- `supabase/migrations/20260427_financial_documents_revision_number.sql`
- `supabase/migrations/20260429_allow_superseded_quote_status.sql`
- `.claude/rules/finance.md` R3 + R4
- Grep complet : 2 composants créés, 0 consommateur actuel

---

**Conclusion** : Phase 4 beaucoup moins lourde qu'attendue. Le gros du travail (backend, migrations, UI components) est **déjà livré**. Il reste 2-4h d'intégration UI à répartir sur plusieurs commits.

Attente : validation Romeo sur Option A/B + cascade + historique.
