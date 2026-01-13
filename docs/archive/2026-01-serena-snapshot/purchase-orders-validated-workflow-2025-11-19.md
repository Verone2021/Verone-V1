# Purchase Orders - Workflow Validated (Ajout 2025-11-19)

**Date création** : 2025-11-19
**Type** : Règle métier critique
**Impact** : Système alertes stock + Workflow commandes fournisseurs

---

## 🎯 Contexte

Ajout du statut `validated` au workflow purchase orders pour supporter le système d'alertes stock à 3 couleurs.

### Problème Résolu

**Avant** (workflow 2 étapes) :

```
draft → received
 🔴  →    ✅
```

**Problème** : Pas d'état intermédiaire pour commandes en cours → alerte stock restait rouge même avec commande passée.

**Après** (workflow 3 étapes) :

```
draft → validated → received
 🔴  →    🟢     →    ✅
```

**Bénéfice** : Visibilité claire sur commandes en cours (alerte verte) avant réception.

---

## ✅ Workflow Correct Purchase Orders (3 ÉTAPES)

### Étape 1 : BROUILLON (draft)

- **Alerte stock** : 🔴 **ROUGE** (besoin approvisionnement)
- **Modifiable** : ✅ Tous les champs
- **Supprimable** : ✅ Oui
- **Impact stock** : ❌ Aucun

**Boutons disponibles** :

- Éditer
- Valider → `validated`
- Annuler → `cancelled`
- Supprimer

### Étape 2 : VALIDÉE (validated)

- **Alerte stock** : 🟢 **VERTE** (commande en cours)
- **Modifiable** : ⚠️ Limité (notes, dates)
- **Supprimable** : ❌ Non
- **Impact stock** : ✅ `stock_forecasted_in += quantity`

**Boutons disponibles** :

- Réceptionner → Modal réception
- Dévalider → `draft` (rollback stock)
- Annuler → `cancelled` (rollback stock)

### Étape 3 : RÉCEPTIONNÉE (received)

- **Alerte stock** : ✅ **DISPARAÎT** (besoin satisfait)
- **Modifiable** : ❌ Non
- **Supprimable** : ❌ Non
- **Impact stock** : ✅ `stock_forecasted_in -= quantity` + `stock_real += quantity`

**Boutons disponibles** : Aucun (commande fermée)

---

## 🚨 RÈGLE CRITIQUE : Ne PAS Utiliser 'sent' pour Fournisseurs

### ❌ INCORRECT (Erreur Fréquente)

```typescript
// ❌ NE PAS FAIRE
if (order.status === 'draft') {
  // Mauvais: utilise 'sent' pour fournisseurs
  await updateStatus(order.id, 'sent');
}
```

### ✅ CORRECT

```typescript
// ✅ TOUJOURS FAIRE
if (order.status === 'draft') {
  // Correct: utilise 'validated' pour fournisseurs
  await updateStatus(order.id, 'validated');
}
```

### Distinction Clients vs Fournisseurs

**FOURNISSEURS (Purchase Orders)** :

```
draft → validated → received
```

**CLIENTS (Sales Orders - legacy)** :

```
draft → validated → sent
```

Le statut `sent` existe dans l'enum pour compatibilité avec commandes clients, mais **NE DOIT PAS** être utilisé pour fournisseurs.

---

## 📋 Migration Appliquée

**Fichier** : `supabase/migrations/20251119_004_add_validated_status_to_purchase_orders.sql`

**Date application** : 2025-11-19

**Changements** :

- ✅ Ajout valeur 'validated' à enum `purchase_order_status`
- ✅ Commentaire documentation workflow 3 étapes
- ✅ Compatible contrainte existante `valid_workflow_timestamps`

**Commande** :

```bash
psql "postgresql://postgres.aorroydfjsrygmosnzrl:[ROTATION_REQUIRED]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" \
  -f supabase/migrations/20251119_004_add_validated_status_to_purchase_orders.sql
```

---

## ⚠️ DÉPENDANCES TRIGGERS STOCK (CRITIQUE)

**ATTENTION** : Le statut `validated` nécessite triggers stock mis à jour pour fonctionner correctement.

### Migrations Triggers Appliquées

#### 1. Migration Intégration `validated` (2025-11-19)

**Fichier** : `supabase/migrations/20251119_005_update_triggers_for_validated_status.sql`

**Modifications** :

- ✅ `handle_purchase_order_forecast()` - Détecte maintenant `validated` en plus de `confirmed`
- ✅ `validate_stock_alerts_on_purchase_order_validation()` - Détecte `validated` pour validation alertes

**Impact** :

- `draft → validated` créera mouvements `stock_forecasted_in` (alerte 🔴→🟢)
- `validated → cancelled` annulera mouvements (alerte 🟢→🔴)
- `validated → received` convertira `forecasted → real` (alerte 🟢→✅)

#### 2. Bug #1 (P0) - Calcul Stock Prévisionnel Alertes (2025-11-13)

**Fichier** : `supabase/migrations/20251113_001_fix_stock_alert_forecasted_calculation.sql`

**Problème corrigé** :

- Alertes utilisaient `stock_real < min_stock` au lieu de stock prévisionnel
- Causait faux positifs (alertes alors que stock prévu suffisant) et faux négatifs (pas d'alerte alors que stock prévu insuffisant)

**Solution** :

```sql
v_forecasted_stock := stock_real - stock_forecasted_out + stock_forecasted_in;
IF v_forecasted_stock <= min_stock THEN -- alerte
```

#### 3. Bug #2 (P0) - Libération Forecasted à l'Expédition (2025-11-13)

**Fichier** : `supabase/migrations/20251113_002_fix_sales_order_release_forecasted_on_shipment.sql`

**Problème corrigé** :

- `forecasted_out` non libéré lors expédition Sales Order
- Causait double comptabilisation (stock réel déduit + forecasted_out toujours compté)

**Solution** :

- Libérer `forecasted_out` AVANT créer mouvement réel lors expédition

#### 4. Data Fix Bug #2 (2025-11-13)

**Fichier** : `supabase/migrations/20251113_003_data_fix_release_forecasted_shipped_orders.sql`

**Correction** : Libération `forecasted_out` pour commandes expédiées avant correction Bug #2

**Résultat** : 0 items à corriger (aucune donnée historique corrompue)

### Documentation Bugs Triggers

**Rapport complet** : `docs/audits/2025-11/RAPPORT-AUDIT-TRIGGERS-STOCK-2025-11-12.md`

**Contenu** (1902 lignes) :

- 7 bugs identifiés (2 P0, 2 P1, 3 P2)
- Migrations correctives pour chaque bug
- Tests validation SQL
- Impact business et solutions

**Bugs restants (non critiques)** :

- Bug #4 (P1) : Déjà corrigé dans version actuelle `handle_purchase_order_forecast()`
- Bugs #5-#7 (P2) : Performance/concurrence - non bloquants pour workflow `validated`

### Validation Finale

**Fonctions triggers à jour** :

```sql
-- Vérifier triggers actifs
SELECT tgname, tgenabled, proname
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'purchase_orders'::regclass
  AND (proname LIKE '%forecast%' OR proname LIKE '%alert%');
```

**Résultat attendu** :

- `trigger_purchase_order_forecast` → `handle_purchase_order_forecast` (enabled)
- `trigger_validate_stock_alerts_on_purchase_order_validation` → `validate_stock_alerts_on_purchase_order_validation` (enabled)

### Workflow Stock Complet

```
draft → validated → received
  ↓         ↓          ↓
🔴 ROUGE  🟢 VERT   ✅ OK

draft:
  - Alerte ROUGE
  - stock_forecasted_in = 0

validated:
  - Alerte VERTE
  - stock_forecasted_in += quantity  ← Trigger handle_purchase_order_forecast()

received:
  - Alerte DISPARAÎT
  - stock_forecasted_in -= quantity
  - stock_real += quantity
```

---

## 🎨 Code Modifié

### 1. Types TypeScript

**Fichiers** :

- `packages/@verone/orders/src/hooks/use-purchase-orders.ts`
- `apps/back-office/src/app/actions/purchase-orders.ts`

```typescript
export type PurchaseOrderStatus =
  | 'draft'
  | 'validated' // ✅ AJOUTÉ
  | 'sent'
  | 'confirmed'
  | 'partially_received'
  | 'received'
  | 'cancelled';
```

### 2. Server Action (Timestamps)

**Fichier** : `apps/back-office/src/app/actions/purchase-orders.ts`

```typescript
if (newStatus === 'validated') {
  // ✅ VALIDATION : rouge → vert (alerte stock)
  updateFields.validated_at = new Date().toISOString();
  updateFields.validated_by = userId;
}
```

### 3. Page UI (Boutons)

**Fichier** : `apps/back-office/src/app/commandes/fournisseurs/page.tsx`

**Modification bouton "Valider"** :

```typescript
// AVANT (❌ INCORRECT)
<IconButton
  label="Valider (envoyer au fournisseur)"
  onClick={() => handleStatusChange(order.id, 'sent')}  // ❌
/>

// APRÈS (✅ CORRECT)
<IconButton
  label="Valider la commande"
  onClick={() => handleStatusChange(order.id, 'validated')}  // ✅
/>
```

**Ajout section 'validated'** :

```typescript
{order.status === 'validated' && (
  <>
    <IconButton icon={Truck} label="Réceptionner la commande" />
    <IconButton icon={RotateCcw} label="Dévalider (retour brouillon)" />
    <IconButton icon={Ban} label="Annuler la commande" />
  </>
)}
```

**Ajout onglet** :

```typescript
<TabsList className="grid w-full grid-cols-8">  {/* +1 colonne */}
  <TabsTrigger value="draft">Brouillon ({tabCounts.draft})</TabsTrigger>
  <TabsTrigger value="validated">Validée ({tabCounts.validated})</TabsTrigger>  {/* ✅ NOUVEAU */}
  {/* ... autres onglets */}
</TabsList>
```

---

## 🧪 Tests Validation

### Test 1 : Workflow Complet

```gherkin
GIVEN commande en draft avec 50 unités
AND alerte stock 🔴 ROUGE

WHEN je clique "Valider la commande"
THEN statut passe à 'validated'
AND alerte stock passe à 🟢 VERTE
AND stock_forecasted_in += 50

WHEN je réceptionne complètement
THEN statut passe à 'received'
AND alerte stock disparaît
AND stock_real += 50
```

### Test 2 : Annulation depuis Validated

```gherkin
GIVEN commande validated (alerte 🟢 VERTE)
AND stock_forecasted_in = +50

WHEN je clique "Annuler la commande"
THEN statut passe à 'cancelled'
AND alerte stock repasse à 🔴 ROUGE
AND stock_forecasted_in -= 50 (rollback)
AND bouton "Commander" réactivé
```

### Test 3 : Onglet Validated

```gherkin
GIVEN 3 commandes : 1 draft, 1 validated, 1 received

WHEN je clique onglet "Validée"
THEN seule la commande validated s'affiche
AND compteur affiche (1)
```

---

## 📚 Documentation Complète

**Fichier principal** : `docs/business-rules/07-commandes/fournisseurs/PURCHASE-ORDER-WORKFLOW-COMPLET.md`

**Contenu** (900+ lignes) :

- Workflow 3 phases détaillé
- Règles métier validation
- Système alertes stock (🔴🟢✅)
- Règles annulation
- Réceptions partielles
- UI/UX (boutons, onglets, modals)
- Tests fonctionnels

---

## 🚫 Règle Anti-Docker (Rappel)

**NE JAMAIS UTILISER** :

- ❌ Docker Desktop
- ❌ `supabase start` (nécessite Docker)
- ❌ `supabase db push` (nécessite Docker local)
- ❌ `supabase db reset` (nécessite Docker)

**TOUJOURS UTILISER** :

- ✅ `psql` direct avec connection string
- ✅ Dashboard Supabase pour SQL
- ✅ `npx supabase@latest gen types` (remote)

**Référence** : `.serena/memories/vercel-workflow-no-docker.md`

---

## ✅ Checklist Validation

- [x] Migration SQL appliquée via psql
- [x] Types TypeScript régénérés (validated présent ligne 8342)
- [x] Code modifié (types, Server Action, UI)
- [x] Documentation créée (PURCHASE-ORDER-WORKFLOW-COMPLET.md)
- [x] Mémoire Serena créée (ce fichier)
- [ ] Tests manuels validés
- [ ] Build passé sans erreurs
- [ ] Aucune erreur console

---

**Auteur** : Romeo Dos Santos (via Claude Code)
**Date** : 2025-11-19
**Version** : 1.0.0
