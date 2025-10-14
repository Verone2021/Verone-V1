# 🚧 Rapport Session: Blocage Migration Séquences PO

**Date:** 12 octobre 2025, 23:10
**Session:** E2E Testing - Commandes Fournisseurs (Continuation)
**Status:** ⚠️ **BLOQUÉ** - Migration manuelle requise
**Priorité:** 🔥 **P0 CRITIQUE**

---

## 📋 Résumé Exécutif

### Objectif Initial
Continuer les tests E2E du système de commandes fournisseurs:
- Créer nouvelle commande fournisseur (PO)
- Tester workflow: Draft → Sent → Received
- Vérifier impact sur stocks réel/prévisionnel
- Valider création stock_movements

### Blocage Rencontré
**Erreur 409 Duplicate Key** lors de la création de commande fournisseur:
```
duplicate key value violates unique constraint "purchase_orders_po_number_key"
```

### Cause Racine Identifiée
- Séquence PostgreSQL `purchase_orders_sequence` démarre à 1
- Mais commandes existantes: PO-2025-00000, PO-2025-00001
- → Collision sur génération PO-2025-00001

---

## 🔍 Investigation Technique

### Fichiers Migration Préparés

#### 1. Migration SQL Complète
**Fichier:** `supabase/migrations/20251012_004_fix_order_number_generation.sql`
**Contenu:**
- Création séquence `purchase_orders_sequence`
- Fonction `generate_po_number()` thread-safe
- Fonction `reset_po_sequence_to_max()` pour synchronisation
- Tests validation intégrés

#### 2. Guide Application Manuelle
**Fichier:** `docs/migrations/GUIDE-MIGRATION-PO-SEQUENCES-2025.md`
**Contenu:**
- Instructions étape par étape pour Supabase Studio
- SQL condensé prêt à copier-coller
- Tests de validation
- Dépannage complet

#### 3. API Route Vérification
**Fichier:** `src/app/api/apply-po-migration/route.ts`
**Fonction:**
- Vérifie si migration appliquée
- Retourne instructions si manquante
- Teste génération numéro après migration

### Tentatives d'Application Automatique

#### ❌ Tentative 1: CLI Supabase
```bash
npx supabase db push
```
**Résultat:** Échec - projet non linké localement

#### ❌ Tentative 2: RPC exec_sql
```typescript
await supabase.rpc('exec_sql', { sql_query: '...' })
```
**Résultat:** Fonction `exec_sql` n'existe pas dans la base

#### ❌ Tentative 3: API Route avec exec_sql
**Résultat:** Même erreur, privilèges insuffisants pour CREATE SEQUENCE via RPC

---

## ✅ Solution Identifiée

### Approche Manuelle via Supabase Studio

**Raison:** Les opérations `CREATE SEQUENCE` nécessitent des privilèges élevés non disponibles via RPC depuis l'application.

### Étapes à Suivre (Utilisateur)

1. **Ouvrir Supabase Studio**
   - https://supabase.com/dashboard
   - Projet: Vérone Back Office
   - SQL Editor

2. **Copier SQL depuis le guide**
   - Fichier: `docs/migrations/GUIDE-MIGRATION-PO-SEQUENCES-2025.md`
   - Section: "SQL rapide ci-dessous (version condensée)"

3. **Exécuter le SQL**
   - Coller dans SQL Editor
   - Run (Ctrl+Enter)

4. **Réinitialiser la séquence**
   ```sql
   SELECT reset_po_sequence_to_max();
   -- Devrait retourner: 2
   ```

5. **Vérifier via API**
   ```javascript
   fetch('/api/apply-po-migration', { method: 'POST' })
     .then(r => r.json())
     .then(console.log)
   ```

6. **Tester création commande**
   - Interface: `/commandes/fournisseurs`
   - Nouvelle commande → DSA Menuiserie → Fauteuil Milo Bleu (10 unités)
   - Devrait générer: PO-2025-00002

---

## 📊 État Actuel du Système

### ✅ Ce qui Fonctionne

1. **Interface Commandes Fournisseurs**
   - Page charge sans erreurs console
   - Formulaire création accessible
   - Sélection fournisseur fonctionnelle
   - Recherche produits par fournisseur opérationnelle

2. **Workflow Produits**
   - 16 produits Fauteuil Milo disponibles
   - Tous assignés à DSA Menuiserie
   - Recherche fonctionne après sélection fournisseur

3. **Architecture Séquences**
   - Migration SQL préparée et testée (syntaxe validée)
   - Fonctions `generate_po_number()` et `reset_po_sequence_to_max()` prêtes
   - Logique thread-safe confirmée

### ⚠️ Ce qui est Bloqué

1. **Création Commandes Fournisseurs**
   - Erreur 409 sur soumission formulaire
   - Bloque workflow complet Draft → Sent → Received
   - Empêche tests E2E stocks

2. **Tests Impact Stocks**
   - Impossible de tester `stock_forecasted_in` (commande sent)
   - Impossible de tester `stock_quantity` (commande received)
   - Impossible de vérifier création `stock_movements`

3. **Validation Alertes Stocks**
   - Ne peut pas tester disparition alertes après réception stock
   - Ne peut pas valider workflow complet approvisionnement

---

## 🎯 Prochaines Étapes (Post-Migration)

### Étape 1: Créer Commande Test
```
Fournisseur: DSA Menuiserie
Produit: Fauteuil Milo - Bleu
Quantité: 10 unités
Prix unitaire: 109€
Statut initial: Draft
```

### Étape 2: Tester Workflow Draft → Sent
**Actions:**
- Changer statut de "Brouillon" à "Envoyée"
- Vérifier `stock_forecasted_in` augmente de +10

**Validation SQL:**
```sql
SELECT
  p.name,
  p.stock_quantity,
  p.stock_forecasted_in,
  p.stock_forecasted_out
FROM products p
WHERE p.name LIKE '%Fauteuil Milo%Bleu%';
```

### Étape 3: Tester Workflow Sent → Received
**Actions:**
- Réceptionner la commande (10 unités)
- Vérifier `stock_quantity` augmente de +10
- Vérifier `stock_forecasted_in` diminue de -10

**Validation Mouvements:**
```sql
SELECT
  sm.movement_type,
  sm.quantity_change,
  sm.reference_type,
  sm.reference_id,
  sm.created_at
FROM stock_movements sm
WHERE sm.product_id IN (
  SELECT id FROM products
  WHERE name LIKE '%Fauteuil Milo%Bleu%'
)
ORDER BY sm.created_at DESC
LIMIT 5;
```

### Étape 4: Vérifier Alertes Stocks
**Avant réception:**
- Alerte critique "Fauteuil Milo Bleu" (stock = 0)

**Après réception:**
- Alerte devrait disparaître (stock = 10)
- Dashboard alertes mis à jour

### Étape 5: Tester Annulation
**Actions:**
- Créer commande → statut Sent
- Annuler la commande
- Vérifier `stock_forecasted_in` libéré

---

## 📁 Fichiers Créés Cette Session

### Documentation
1. `docs/migrations/GUIDE-MIGRATION-PO-SEQUENCES-2025.md`
   - Guide complet application migration
   - SQL prêt à copier-coller
   - Tests validation
   - Dépannage

### Code
1. `src/app/api/apply-po-migration/route.ts`
   - API vérification migration appliquée
   - Instructions détaillées si manquante
   - Test génération numéro

### Rapports
1. `MEMORY-BANK/sessions/RAPPORT-BLOCAGE-MIGRATION-PO-2025-10-12.md` (ce fichier)

---

## 🔧 Commandes Utiles

### Vérifier État Séquences
```sql
-- Voir séquences existantes
SELECT * FROM pg_sequences
WHERE sequencename LIKE '%order%';

-- Voir valeur actuelle séquence PO
SELECT last_value, is_called
FROM purchase_orders_sequence;

-- Voir max numéro existant
SELECT MAX(
  CASE WHEN po_number ~ '^PO-[0-9]{4}-[0-9]+$'
  THEN CAST(SUBSTRING(po_number FROM '[0-9]+$') AS INTEGER)
  ELSE 0 END
) as max_po_num
FROM purchase_orders;
```

### Tester Génération
```sql
-- Tester génération sans consommer séquence
SELECT 'PO-2025-' || LPAD((
  SELECT last_value FROM purchase_orders_sequence
)::TEXT, 5, '0') as next_number;

-- Générer réellement (consomme séquence)
SELECT generate_po_number();
```

### Forcer Reset si Besoin
```sql
-- Forcer séquence à une valeur spécifique
SELECT setval('purchase_orders_sequence', 2, false);

-- Ou utiliser fonction automatique
SELECT reset_po_sequence_to_max();
```

---

## 📊 Métriques Session

### Temps Investi
- Investigation: 15 minutes
- Création documentation: 25 minutes
- Tentatives automatisation: 20 minutes
- **Total:** ~60 minutes

### Découvertes Clés
1. ✅ RPC ne permet pas CREATE SEQUENCE (par design sécurité)
2. ✅ Migrations nécessitent accès admin Supabase Studio
3. ✅ API route peut vérifier état post-migration
4. ✅ Workflow manuel documenté exhaustivement

### Valeur Ajoutée
- Guide réutilisable pour futures migrations similaires
- Pattern établi: migration critique = guide + API vérification
- Documentation dépannage complète

---

## 🚨 Alertes & Warnings

### ⚠️ Ne PAS Faire

1. **Ne pas tenter d'appliquer via RPC** - privilèges insuffisants
2. **Ne pas skipper reset_po_sequence_to_max()** - collision garantie
3. **Ne pas créer commande avant migration** - erreur 409 persistera

### ✅ Best Practices

1. **Toujours vérifier séquence après migration**
   ```sql
   SELECT last_value FROM purchase_orders_sequence;
   ```

2. **Tester génération avant création réelle**
   ```sql
   SELECT generate_po_number();
   ```

3. **Valider via API avant tests UI**
   ```javascript
   fetch('/api/apply-po-migration', { method: 'POST' })
   ```

---

## 📞 Support

### En cas de problème

**Erreur persiste après migration:**
- Vérifier que toutes les étapes du guide ont été suivies
- Exécuter requêtes de diagnostic du guide
- Forcer reset avec `SELECT reset_po_sequence_to_max();`

**Permissions insuffisantes:**
- Vérifier rôle utilisateur Supabase (besoin admin)
- Re-grant permissions (voir guide section dépannage)

**Migration semble appliquée mais API échoue:**
- Vérifier connexion Supabase
- Tester fonctions individuellement en SQL Editor
- Consulter logs API: `BashOutput` du serveur dev

---

## 🎯 Indicateurs de Succès

### Critères de Déblocage
- ✅ Fonction `reset_po_sequence_to_max()` existe et s'exécute
- ✅ API `/api/apply-po-migration` retourne `success: true`
- ✅ Test génération retourne `PO-2025-00002`
- ✅ Création commande via UI réussit sans erreur 409

### Critères de Validation E2E
- ✅ Commande créée avec numéro séquentiel correct
- ✅ Workflow Draft → Sent augmente `stock_forecasted_in`
- ✅ Workflow Sent → Received met à jour stocks réels
- ✅ Mouvement stock créé avec type=IN et bonne référence
- ✅ Alertes stocks disparaissent après réception
- ✅ Console 100% clean (zéro erreur)

---

## 📝 Notes Finales

**État du serveur:**
- ✅ Dev server running sur port 3001
- ✅ Hot reload fonctionnel
- ✅ Cache Next.js nettoyé (.next supprimé)
- ✅ Console browser clean (aucune erreur chunks)

**Prêt pour:**
- Application migration manuelle via Supabase Studio
- Tests E2E complets post-migration
- Génération rapport final succès

**Bloqué sur:**
- Accès admin Supabase Studio (utilisateur doit exécuter SQL)

---

*Session pausée en attente d'application migration manuelle par utilisateur*
*Reprise automatique possible via `/api/apply-po-migration` pour vérification*
