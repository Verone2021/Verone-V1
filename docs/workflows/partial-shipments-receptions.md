# 📦 Réceptions et Expéditions Partielles - Vérone

**Date création** : 2025-10-18
**Version** : 1.0 (Phase 1.5)
**Migration associée** : `20251018_001_enable_partial_stock_movements.sql`
**Référence** : Inspiré des best practices Odoo & NetSuite 2025

---

## 📊 Vue d'Ensemble

Le système Vérone gère désormais les réceptions et expéditions partielles de manière automatique via triggers PostgreSQL. Les mouvements de stock sont mis à jour progressivement à chaque réception/expédition partielle, conformément aux standards ERP professionnels.

---

## 🏢 SCÉNARIO 1: Réceptions Partielles (Purchase Orders)

### Workflow Complet

```
ÉTAPE 1: Création & Confirmation Commande Fournisseur
┌──────────────────────────────────────────────────────┐
│ PO-2025-001: 100 unités commandées                   │
│ Status: draft → confirmed                            │
│                                                      │
│ ✅ Trigger automatique déclenché:                    │
│ - stock_forecasted_in += 100                         │
│ - stock_real = inchangé                              │
│ - stock_quantity = stock_real + forecasted_in - forecasted_out │
└──────────────────────────────────────────────────────┘

ÉTAPE 2: Première Réception Partielle (40 unités)
┌──────────────────────────────────────────────────────┐
│ Action utilisateur:                                  │
│ - Mettre quantity_received = 40 dans PO items        │
│ - Passer PO status = 'partially_received'            │
│                                                      │
│ ✅ Trigger automatique déclenché:                    │
│ - stock_forecasted_in -= 40 (retire prévisionnel)   │
│ - stock_real += 40 (ajoute au réel)                 │
│ - 2 mouvements stock créés:                          │
│   * OUT -40 (affects_forecast=true, type='in')       │
│   * IN +40 (affects_forecast=false)                  │
└──────────────────────────────────────────────────────┘

ÉTAPE 3: Deuxième Réception Partielle (+35 unités)
┌──────────────────────────────────────────────────────┐
│ Action utilisateur:                                  │
│ - Mettre quantity_received = 75 (40+35) total        │
│ - Garder status = 'partially_received'               │
│                                                      │
│ ✅ Trigger calcule DIFFÉRENCE (75-40=35):            │
│ - stock_forecasted_in -= 35                          │
│ - stock_real += 35                                   │
│ - Seulement 35 unités traitées (pas 75!)            │
└──────────────────────────────────────────────────────┘

ÉTAPE 4: Réception Finale (+25 unités)
┌──────────────────────────────────────────────────────┐
│ Action utilisateur:                                  │
│ - Mettre quantity_received = 100 (complet)           │
│ - Passer status = 'received'                         │
│                                                      │
│ ✅ Trigger calcule DIFFÉRENCE (100-75=25):           │
│ - stock_forecasted_in -= 25 (retourne à état initial)│
│ - stock_real += 25                                   │
│ - Status final: received (complet)                   │
└──────────────────────────────────────────────────────┘
```

### Exemple Chiffré

| Étape              | Action               | stock_real | forecasted_in | forecasted_out | stock_quantity |
| ------------------ | -------------------- | ---------- | ------------- | -------------- | -------------- |
| **Initial**        | -                    | 50         | 0             | 0              | 50             |
| **Confirmé PO**    | +100 prévisionnel    | 50         | 100           | 0              | 150            |
| **Reçu 40**        | Conversion partielle | 90         | 60            | 0              | 150            |
| **Reçu 75 total**  | +35 différentiel     | 125        | 25            | 0              | 150            |
| **Reçu 100 total** | +25 différentiel     | 150        | 0             | 0              | 150            |

### Points Clés

✅ **Différentiel automatique** : Le trigger calcule `new_qty - old_qty`
✅ **Pas de duplication** : Seulement les nouvelles unités sont traitées
✅ **Conversion progressive** : Prévisionnel → Réel au fur et à mesure
✅ **Historique complet** : Tous les mouvements tracés dans `stock_movements`

---

## 🚚 SCÉNARIO 2: Expéditions Partielles (Sales Orders)

### Workflow Complet

```
ÉTAPE 1: Confirmation Commande Client
┌──────────────────────────────────────────────────────┐
│ SO-2025-001: 50 unités commandées                    │
│ Status: draft → confirmed                            │
│                                                      │
│ ✅ Trigger automatique déclenché:                    │
│ - stock_forecasted_out += 50 (réservation)          │
│ - stock_real = inchangé                              │
│ - stock_quantity -= 50 (disponible réduit)           │
└──────────────────────────────────────────────────────┘

ÉTAPE 2: Première Expédition Partielle (20 unités)
┌──────────────────────────────────────────────────────┐
│ Action utilisateur:                                  │
│ - Mettre quantity_shipped = 20 dans SO items         │
│ - Passer SO status = 'partially_shipped'             │
│                                                      │
│ ✅ Trigger automatique déclenché:                    │
│ - stock_real -= 20 (sortie physique entrepôt)       │
│ - stock_forecasted_out = inchangé (reste réservé)    │
│ - 1 mouvement stock créé:                            │
│   * OUT -20 (affects_forecast=false)                 │
└──────────────────────────────────────────────────────┘

ÉTAPE 3: Deuxième Expédition Partielle (+15 unités)
┌──────────────────────────────────────────────────────┐
│ Action utilisateur:                                  │
│ - Mettre quantity_shipped = 35 (20+15) total         │
│ - Garder status = 'partially_shipped'                │
│                                                      │
│ ✅ Trigger calcule DIFFÉRENCE (35-20=15):            │
│ - stock_real -= 15                                   │
│ - Seulement 15 unités traitées                       │
└──────────────────────────────────────────────────────┘

ÉTAPE 4: Expédition Finale (+15 unités)
┌──────────────────────────────────────────────────────┐
│ Action utilisateur:                                  │
│ - Mettre quantity_shipped = 50 (complet)             │
│ - Passer status = 'shipped'                          │
│                                                      │
│ ✅ Trigger calcule DIFFÉRENCE (50-35=15):            │
│ - stock_real -= 15                                   │
│ - Status final: shipped (complet)                    │
└──────────────────────────────────────────────────────┘
```

### Exemple Chiffré

| Étape                | Action           | stock_real | forecasted_out | stock_quantity |
| -------------------- | ---------------- | ---------- | -------------- | -------------- |
| **Initial**          | -                | 100        | 0              | 100            |
| **Confirmé SO**      | +50 réservé      | 100        | 50             | 50             |
| **Expédié 20**       | Sortie partielle | 80         | 50             | 30             |
| **Expédié 35 total** | +15 différentiel | 65         | 50             | 15             |
| **Expédié 50 total** | +15 différentiel | 50         | 50             | 0              |

### Points Clés

✅ **Sortie physique immédiate** : Décrémente `stock_real` directement
✅ **Réservation maintenue** : `stock_forecasted_out` reste inchangé
✅ **Gestion warehouse_exit_at** : Timestamp automatique enregistré
✅ **Notes descriptives** : "Expédition partielle - 35/50 unités expédiées"

---

## 🔧 Utilisation Interface Utilisateur

### Pour les Réceptions Partielles (PO)

1. **Accéder à la commande** : `/commandes/fournisseurs` → Ouvrir PO
2. **Modifier quantité reçue** : Dans chaque ligne item, mettre `quantity_received`
3. **Changer statut** : Sélectionner "Partiellement reçue" dans dropdown
4. **Valider** : Le trigger s'exécute automatiquement
5. **Vérifier** : Consulter stock produit (`/produits/catalogue`)

### Pour les Expéditions Partielles (SO)

1. **Accéder à la commande** : `/commandes/clients` → Ouvrir SO
2. **Enregistrer expédition** : Utiliser bouton "Enregistrer expédition"
3. **Saisir quantités** : Pour chaque produit, quantité expédiée
4. **Statut automatique** : Le système passe en "partially_shipped" si partiel
5. **Stock mis à jour** : Automatiquement via trigger

---

## 📊 Mouvements Stock Créés

### Réception Partielle

```sql
-- Mouvement 1: Retrait prévisionnel
{
  movement_type: 'OUT',
  quantity_change: -40,
  affects_forecast: true,
  forecast_type: 'in',
  notes: 'Réception partielle - Annulation prévisionnel 40/100 unités'
}

-- Mouvement 2: Ajout réel
{
  movement_type: 'IN',
  quantity_change: 40,
  affects_forecast: false,
  forecast_type: null,
  notes: 'Réception partielle - 40/100 unités reçues (Commande PO-2025-001)'
}
```

### Expédition Partielle

```sql
-- Mouvement unique: Sortie réel
{
  movement_type: 'OUT',
  quantity_change: -20,
  affects_forecast: false,
  forecast_type: null,
  notes: 'Expédition partielle - 20/50 unités expédiées'
}
```

---

## ⚠️ Limitations Phase 1.5

### Ce qui est GÉRÉ ✅

- Réceptions partielles multiples (PO)
- Expéditions partielles multiples (SO)
- Calcul différentiel automatique
- Traçabilité complète
- Conversion progressive prévisionnel → réel

### Ce qui est PRÉVU Phase 2 📅

- ❌ **Backorders automatiques** (sous-commandes)
- ❌ **Interface dédiée réceptions** (écran scan code-barres)
- ❌ **Suggestions automatiques** ("Créer backorder?")
- ❌ **Reports expéditions groupées** (par transporteur)
- ❌ **Liens tracking numéros colis** (intégration Colissimo/Chronopost)

---

## 🐛 Troubleshooting

### Problème: Stock ne se met pas à jour

**Causes possibles** :

1. Status PO/SO pas changé en `partially_received` ou `partially_shipped`
2. Colonne `quantity_received` ou `quantity_shipped` pas remplie
3. Trigger désactivé (vérifier `pg_trigger`)

**Solution** :

```sql
-- Vérifier triggers actifs
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname IN ('purchase_order_forecast_trigger', 'trigger_sales_order_stock');

-- Vérifier derniers mouvements stock
SELECT * FROM stock_movements
WHERE product_id = '<product_id>'
ORDER BY performed_at DESC
LIMIT 10;
```

### Problème: Duplication mouvements stock

**Cause** : Trigger exécuté plusieurs fois (UPDATE en boucle)

**Solution** : Utiliser quantity\_\* EXACTE totale, pas incrémentale

```typescript
// ❌ INCORRECT
quantity_received += 40; // Ne pas incrémenter

// ✅ CORRECT
quantity_received = 40; // 1ère réception
quantity_received = 75; // 2ème réception (40+35)
```

---

## 📚 Références

- **Migration** : `supabase/migrations/20251018_001_enable_partial_stock_movements.sql`
- **Tests** : `TASKS/test-partial-movements-scenarios.sql`
- **Triggers** : `docs/database/triggers.md`
- **Best Practices Odoo** : Recherche 2025-10-18
- **Session Report** : `MEMORY-BANK/sessions/PARTIAL-MOVEMENTS-2025-10-18.md`

---

**Retour** : [Workflows](/Users/romeodossantos/verone-back-office-V1/docs/workflows/README.md) | [Index](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
