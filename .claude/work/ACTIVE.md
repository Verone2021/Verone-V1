# Plan Actif

**Branche**: `fix/multi-bugs-2026-01`
**Last sync**: 2026-01-15 (e8463feb)

## 📋 Session 2026-01-14/15 - Corrections Multiples

### ✅ Tâches Complétées (Résumé)

| Task ID | Description | Commit | Lignes |
|---------|-------------|--------|--------|
| LM-ORG-004 | Refonte gestion organisations (édition inline, filtres, routing) | cf890814 | ~400 |
| LM-SEL-003 | Optimisation UX sélections publiques (category bar, dropdown) | 8e482ddb | ~300 |
| LM-ORD-005 | Workflow création commande - Phases 1-5 (complet) | 8ef01629, 67b776e7 | ~150 |
| LM-ORD-004 | Pré-remplissage contacts - Phases 1-4 (code terminé) | 880af835, 9329ba7e | ~100 |
| LM-AUTH-001 | Fix spinner infini LinkMe | 20658534 | ~50 |
| Sentry Config | Migration Next.js 15 instrumentation | 8184e314, 125f3ee8 | ~80 |
| WEB-DEV-001 | Fix symlink node_modules/next | 25f97a3d | ~0 |
| LM-ORG-003 | Popup carte organisations (MapPopupCard) | 8a44b70f | ~100 |
| LM-ORD-006 | Refonte UX Sélection Produits (2 colonnes + filtres + pagination) | 59b9d2c9, df39f4a8 | ~700 |

**Temps total session**: ~12h
**Tests requis**: LM-SEL-003 (tests visuels par utilisateur)

---

## 🔄 Tâches Restantes (Par Ordre de Priorité)

### 🔴 HAUTE PRIORITÉ - BUG CRITIQUE

**1. LM-ORD-007** - Bug validation formulaire OrderFormUnified (BLOQUANT)
- Statut: 🔴 CRITIQUE - Aucune commande publique ne peut être créée
- Priorité: HAUTE (bug production)
- Voir section dédiée ci-dessous

### MOYENNE PRIORITÉ

**2. LM-ORD-004 (Phase 5)** - Tests Pré-remplissage (~10-15 min)
- Statut: Code terminé phases 1-4 ✅
- Reste: Tests manuels uniquement

**3. site-internet/.env.local** - Action manuelle
- `cp apps/back-office/.env.local apps/site-internet/.env.local`

---

## 📋 TASK: LM-ORD-007 — Bug Validation Formulaire Public LinkMe (CRITIQUE)

**Date**: 2026-01-15
**Statut**: 🔴 BLOQUANT
**Détecté par**: Tests manuels Playwright READ1

### Contexte

Test de création de commande depuis la sélection publique Pokawa (Collection Mobilier Pokawa).

**Flow testé**:
1. http://localhost:3002/s/collection-mobilier-pokawa
2. Ajouter 3 produits au panier (279,74 € TTC)
3. Ouvrir formulaire commande → "Oui (Nouveau restaurant)"
4. Remplir 4 étapes du formulaire:
   - Étape 1: Restaurant (Pokawa Test Paris, Rue de Rivoli Paris)
   - Étape 2: Propriétaire (Sophie Martin, sophie.martin@pokawa-test.fr)
   - Étape 3: Facturation (Pokawa Test SAS, SIRET 88888888800019)
   - Étape 4: Validation
5. Cocher checkbox "J'accepte les modalités..."
6. Cliquer "Valider le panier"
7. Modal de confirmation s'ouvre
8. Cocher checkbox finale
9. **Cliquer "Confirmer la commande" (bouton vert)**

### ❌ Problème

**Symptômes**:
1. ❌ Le bouton "Confirmer la commande" ne fait rien visuellement
2. ❌ Le modal de confirmation ne se ferme jamais
3. ❌ Aucun message de succès n'apparaît
4. ❌ Le panier n'est pas vidé
5. ❌ L'utilisateur reste bloqué sur le modal

### 🔍 Evidence Technique

**Network Requests** (3 appels RPC successifs):
```
POST /rest/v1/rpc/create_public_linkme_order => [200] (3 fois)
```

**Base de données**:
```sql
SELECT id, order_number, status, total_ttc, linkme_selection_id, created_at
FROM sales_orders
WHERE created_at > NOW() - INTERVAL '15 minutes';

-- Résultat: 0 rows
```

**Conclusion**:
- ✅ L'API répond 200 (succès apparent)
- ❌ **AUCUNE commande créée en base de données**
- ❌ Le front-end attend une réponse qui ne vient jamais ou ne la traite pas

### 📂 Fichiers Concernés

**Front-end**:
- `apps/linkme/src/components/OrderFormUnified.tsx`
  - Ligne ~1500-1900 : Modal de confirmation
  - Handler `onSubmit` ou `handleConfirmOrder`
  - Gestion de la réponse RPC

**Back-end (Supabase RPC)**:
- `supabase/migrations/**/*create_public_linkme_order*.sql`
- Function `create_public_linkme_order()`
- Probablement une transaction qui rollback silencieusement

### 🐛 Hypothèses

#### Hypothèse 1: Transaction Rollback Silencieux (Plus Probable)

La fonction RPC `create_public_linkme_order` :
- Démarre une transaction
- Rencontre une erreur (constraint violation, trigger failure, etc.)
- Rollback la transaction
- **Retourne quand même 200 au lieu de lever une exception**

**Points à vérifier**:
```sql
-- Dans la fonction create_public_linkme_order
-- Y a-t-il un EXCEPTION WHEN ... THEN RETURN NULL ?
-- Y a-t-il des INSERT/UPDATE qui échouent silencieusement ?
```

#### Hypothèse 2: Front-end Ne Gère Pas la Réponse

Le composant `OrderFormUnified.tsx`:
- Appelle la RPC via Supabase client
- Ne gère pas correctement la réponse (pas de `.then()` ou mauvais état)
- Ne ferme jamais le modal car attend un callback qui ne se déclenche jamais

**Points à vérifier**:
```typescript
// Dans OrderFormUnified.tsx
const handleConfirmOrder = async () => {
  const { data, error } = await supabase.rpc('create_public_linkme_order', {...});

  // Est-ce qu'il y a un setState() après ?
  // Est-ce qu'il y a une redirection ?
  // Est-ce qu'il y a une fermeture du modal ?
}
```

#### Hypothèse 3: Triggers Supabase Bloquants

Des triggers sur `sales_orders` ou tables liées:
- Déclenchés lors de l'INSERT
- Échouent (ex: validation métier, RLS policy)
- Causent un rollback de la transaction

**Points à vérifier**:
```sql
-- Lister tous les triggers sur sales_orders
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'sales_orders';
```

### 🔬 Steps to Reproduce (Complet)

1. Navigate to: http://localhost:3002/s/collection-mobilier-pokawa
2. Add 3 products to cart:
   - Plateau bois 20 x 30 cm (28,50 €)
   - Coussin beige (73,39 €)
   - Suspension raphia 5 (177,85 €)
3. Click cart button → "Commander" button
4. Select "Oui (Nouveau restaurant)"
5. Fill step 1: "Pokawa Test Paris", "Rue de Rivoli, 75001 Paris"
6. Fill step 2: "Restaurant propre", "Sophie Martin", "sophie.martin@pokawa-test.fr", "06 45 67 89 12"
7. Fill step 3: "Pokawa Test SAS", "88888888800019", "Rue de Rivoli, 75001 Paris"
8. Check terms checkbox → Click "Suivant"
9. **Modal "Confirmer la commande" appears**
10. Check final confirmation checkbox
11. **Click green "Confirmer la commande" button**
12. **ISSUE: Button does nothing, modal stays open, no order created**

### 🎯 Expected vs Actual

**Expected**:
- ✅ Modal closes
- ✅ Success toast: "Commande créée avec succès"
- ✅ Cart is emptied (badge goes from "3" to "0")
- ✅ Redirect to confirmation page or selection page
- ✅ Order created in `sales_orders` table with `status = 'draft'`

**Actual**:
- ❌ Modal stays open (stuck)
- ❌ No visual feedback
- ❌ Cart still has 3 items
- ❌ No redirect
- ❌ **0 orders in database**

### 📸 Screenshots

- `.claude/reports/test-formulaire-step1-restaurant.png` - Étape 1 OK
- `.claude/reports/test-formulaire-step2-proprietaire.png` - Étape 2 OK
- `.claude/reports/test-formulaire-step3-facturation.png` - Étape 3 OK
- `.claude/reports/test-formulaire-step4-validation.png` - Étape 4 OK
- `.claude/reports/test-modale-confirmation-finale.png` - Modal de confirmation (stuck)
- `.claude/reports/test-etat-final-apres-confirmation.png` - État après clic (aucun changement)

### 🔧 Plan de Correction (Priorité HAUTE)

#### Phase 1: Investigation Back-end (RPC Function)

1. **Lire la fonction RPC**:
   ```bash
   # Trouver le fichier de migration contenant create_public_linkme_order
   find supabase/migrations -name "*create_public_linkme_order*"
   ```

2. **Analyser le code SQL**:
   - Chercher `EXCEPTION WHEN` (gestion d'erreurs silencieuse)
   - Vérifier les `INSERT INTO sales_orders` et tables liées
   - Vérifier les contraintes (FK, CHECK, UNIQUE)

3. **Tester la fonction directement en SQL**:
   ```sql
   SELECT create_public_linkme_order(
     p_selection_id := 'uuid-selection',
     p_items := '[...]',
     p_restaurant_data := '{...}',
     ...
   );
   ```

4. **Vérifier les triggers**:
   ```sql
   SELECT * FROM information_schema.triggers
   WHERE event_object_table IN ('sales_orders', 'sales_order_items', 'organisations');
   ```

#### Phase 2: Investigation Front-end (OrderFormUnified)

1. **Lire le handler de soumission**:
   ```typescript
   // apps/linkme/src/components/OrderFormUnified.tsx
   // Chercher handleConfirmOrder, onSubmit, ou supabase.rpc('create_public_linkme_order')
   ```

2. **Vérifier**:
   - Y a-t-il un `setIsOpen(false)` après succès ?
   - Y a-t-il une redirection (`router.push()`) ?
   - Y a-t-il un toast de succès ?
   - Y a-t-il un vidage du panier ?

3. **Ajouter des logs temporaires**:
   ```typescript
   console.log('🟢 Before RPC call');
   const { data, error } = await supabase.rpc(...);
   console.log('🔵 RPC result:', { data, error });
   ```

#### Phase 3: Fix

**Si problème RPC (back-end)**:
- Corriger la fonction pour qu'elle lève une exception en cas d'erreur
- Ou retourner un objet `{ success: boolean, order_id?: uuid, error?: string }`

**Si problème front-end**:
- Ajouter la fermeture du modal après succès
- Ajouter le toast de confirmation
- Vider le panier local
- Rediriger vers page de confirmation

### ⏱️ Effort Estimé

- Investigation: 30-45 min
- Fix: 15-30 min
- Tests: 15 min
- **TOTAL**: ~1h30

### 🚨 Impact Utilisateur

**Criticité**: 🔴 BLOQUANT

**Impact actuel**:
- ❌ **100% des commandes publiques échouent**
- ❌ Les utilisateurs non-authentifiés **ne peuvent pas commander**
- ❌ Expérience utilisateur catastrophique (bouton qui ne répond pas)
- ❌ Perte de CA potentielle

**Workaround**: AUCUN (les commandes publiques sont impossibles)

---

## 📋 TASK: LM-ORD-004 — Tests Pré-remplissage Contacts (Phase 5)

**Contexte**: Code terminé phases 1-4, tests requis

**Code implémenté**:
- ✅ Phase 1-2: Auto-fill CreateOrderModal (880af835)
- ✅ Phase 3: Pré-remplissage OrderFormUnified org existante (9329ba7e, lignes 238-259)
- ✅ Phase 4: LocalStorage cache (9329ba7e, lignes 262+)

**Fichiers**:
- `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`
- `apps/linkme/src/components/OrderFormUnified.tsx`

### Tests à effectuer (~10-15 min)

1. **CreateOrderModal** (utilisateur authentifié):
   - Se connecter sur http://localhost:3002
   - Aller dans /commandes → Nouvelle vente
   - Vérifier auto-fill des contacts depuis profil utilisateur

2. **OrderFormUnified** (sélection publique):
   - Aller sur une sélection publique (ex: /s/[id])
   - Sélectionner organisation existante
   - Vérifier pré-remplissage contacts depuis DB organisation

3. **Cache localStorage**:
   - Sélection publique → Nouveau restaurant
   - Remplir contacts → Valider commande
   - Créer nouvelle commande → Vérifier contacts pré-remplis depuis cache

### Checklist

- [ ] **LM-ORD-004-8**: Tester CreateOrderModal
- [ ] **LM-ORD-004-9**: Tester OrderFormUnified
- [ ] **LM-ORD-004-10**: Tester cache localStorage

---

## 📋 TASK: site-internet/.env.local — Synchronisation (Manuel)

**Contexte**: Fichier obsolète (9 nov 2024), manque variables récentes

**Action manuelle requise**:
```bash
# Backup de l'ancien
cp apps/site-internet/.env.local apps/site-internet/.env.local.backup-obsolete

# Copier depuis back-office (à jour)
cp apps/back-office/.env.local apps/site-internet/.env.local
```

**Variables manquantes**:
- `NEXT_PUBLIC_GEOAPIFY_API_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Autres variables ajoutées depuis novembre

---

## Regles

- Task ID obligatoire: `[APP]-[DOMAIN]-[NNN]`
- Bypass: `[NO-TASK]` (rare)
- Après commit avec Task ID: `pnpm plan:sync` puis `git commit -am "chore(plan): sync"`

---

## Notes

**Fichiers archivés**: `.claude/archive/plans-2026-01/ACTIVE-backup-*.md`

**Plans détaillés**:
- `.claude/work/PLAN-LM-ORD-006-PRODUCT-SELECTION-UX.md`
- `.claude/work/AUDIT-LM-ORD-005.md`
- `.claude/work/UX-NOTES-ANALYSIS.md`
- `.claude/work/RAPPORT-TESTS-2026-01-15.md`

**STATUT**: 🔴 **BUG CRITIQUE LM-ORD-007** bloque les commandes publiques. Le reste du code est terminé.
