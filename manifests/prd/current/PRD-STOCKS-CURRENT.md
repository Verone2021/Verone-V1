# PRD Stocks & Mouvements Current — État Actuel Implémenté

> **Version**: Production 2025-10-10
> **Statut**: ✅ OPÉRATIONNEL - EN PRODUCTION
> **Fichier Source**: `src/app/stocks/mouvements/page.tsx`
> **SLO Performance**: <3s chargement

---

## 🎯 Vue d'Ensemble

### Description Actuelle

Système de gestion stocks avec inventaire multi-emplacements, mouvements traçables (entrées, sorties, transferts, ajustements), filtres avancés, pagination, et statistiques temps réel.

### Scope Implémenté

- ✅ Inventaire multi-emplacements
- ✅ Mouvements stocks 4 types (entrée, sortie, transfert, ajustement)
- ✅ Traçabilité complète (motifs obligatoires)
- ✅ Filtres avancés (date, type, produit, emplacement)
- ✅ Pagination (10/25/50/100 par page)
- ✅ Statistiques temps réel
- ✅ Historique produit (modal détail)

---

## 📊 Features Implémentées

### 1. Types Mouvements Stock

```typescript
type MovementType =
  | 'entry' // Entrée stock (réception fournisseur, production)
  | 'exit' // Sortie stock (vente, consommation)
  | 'transfer' // Transfert inter-emplacements
  | 'adjustment'; // Ajustement inventaire (correction)
```

**Workflow** :

1. Créer mouvement (type, produit, quantité, emplacement, motif)
2. Validation automatique règles métier
3. Impact stock immédiat
4. Traçabilité persistée

### 2. Emplacements Multi-Sites

- ✅ Gestion emplacements multiples
- ✅ Stock par emplacement
- ✅ Transferts inter-emplacements
- **Table**: `stock_locations`
  - Colonnes: code, name, type (warehouse, store, virtual), address

### 3. Motifs Traçabilité (Obligatoires)

```typescript
// Motifs par type mouvement
entry_reasons = [
  'Réception fournisseur',
  'Retour client',
  'Production interne',
  'Transfert entrant',
  'Correction inventaire +',
];

exit_reasons = [
  'Vente client',
  'Transfert sortant',
  'Casse/Perte',
  'Échantillon',
  'Correction inventaire -',
];
```

**Business Rule**: Motif obligatoire pour traçabilité audit

### 4. Filtres Avancés

- ✅ Filtre date (de/à avec calendrier)
- ✅ Filtre type mouvement (multiple select)
- ✅ Filtre produit (autocomplete)
- ✅ Filtre emplacement
- ✅ Reset filtres rapide

### 5. Pagination Performante

- ✅ Tailles: 10, 25, 50, 100 lignes/page
- ✅ Navigation pages (prev, next, goto)
- ✅ Total mouvements affiché
- **État**: `pagination = { page, pageSize, total }`

### 6. Statistiques Temps Réel

```typescript
stats = {
  total_movements: number, // Total mouvements période
  total_entries: number, // Entrées stock
  total_exits: number, // Sorties stock
  total_transfers: number, // Transferts
  total_adjustments: number, // Ajustements
};
```

### 7. Historique Produit (Modal)

- ✅ Clic mouvement → modal détail produit
- ✅ Historique complet mouvements produit
- ✅ Timeline chronologique
- ✅ Stock actuel par emplacement

---

## 🎨 Design System Appliqué

### Composants UI

- **Table**: Dense (py-2.5) pour densité CRM
- **Filtres**: Advanced filters panel collapsible
- **Pagination**: Bottom sticky pagination bar
- **Stats Cards**: 5 KPIs mouvements

### Icons Lucide

- `TrendingUp` - Entrées
- `TrendingDown` - Sorties
- `RefreshCw` - Transferts
- `AlertTriangle` - Ajustements
- `Package` - Stock

---

## 🔧 Implémentation Technique

### Hook Principal

```typescript
const {
  movements, // StockMovement[] paginé
  stats, // Stats temps réel
  loading, // boolean
  error, // Error | null
  pagination, // { page, pageSize, total }
  applyFilters, // (filters) => void
  resetFilters, // () => void
  handlePageChange, // (page) => void
  handlePageSizeChange, // (size) => void
} = useStockMovements();
```

### Tables BDD

**Table Principale**: `stock_movements`

```sql
Colonnes clés:
- movement_type (entry|exit|transfer|adjustment)
- product_id (FK products)
- quantity (numeric, can be negative for exits)
- from_location_id (FK stock_locations, pour transfers)
- to_location_id (FK stock_locations)
- reason (text, obligatoire traçabilité)
- reference_document (commande, BL, facture)
- created_by (FK user_profiles)
- created_at (timestamp, audit trail)
```

**Table Secondaire**: `stock_locations`

```sql
Colonnes:
- code (unique, ex: WH-01, STORE-PARIS)
- name (nom emplacement)
- type (warehouse|store|virtual)
- address (text, nullable)
- is_active (boolean)
```

---

## 📋 Business Rules Appliquées

### Validation Mouvements

1. **Quantité** : Doit être > 0
2. **Motif** : Obligatoire (traçabilité audit)
3. **Emplacement** : Doit être actif (is_active = true)
4. **Produit** : Doit exister et être actif
5. **Stock suffisant** : Pour sorties (quantity_available >= quantity_exit)

### Workflow Transfert

```
1. Vérifier stock source >= quantité
2. Créer mouvement EXIT (from_location)
3. Créer mouvement ENTRY (to_location)
4. Mettre à jour stock_current (atomic)
5. Log traçabilité
```

### Calcul Stock Actuel

```sql
-- Stock actuel produit par emplacement
SELECT
  product_id,
  location_id,
  SUM(CASE
    WHEN movement_type IN ('entry', 'adjustment') AND quantity > 0 THEN quantity
    WHEN movement_type IN ('exit', 'adjustment') AND quantity < 0 THEN quantity
    WHEN movement_type = 'transfer' AND to_location_id = location_id THEN quantity
    WHEN movement_type = 'transfer' AND from_location_id = location_id THEN -quantity
    ELSE 0
  END) AS stock_current
FROM stock_movements
WHERE is_cancelled = false
GROUP BY product_id, location_id
```

**Business Rules Files**:

- `manifests/business-rules/stock-movements-workflow.md`
- `manifests/business-rules/stock-traceability-rules.md`

---

## 🚧 Limitations Connues & Roadmap

### Limitations Actuelles

- ❌ Pas de réservation stock (commandes validées)
- ❌ Pas d'alertes stock bas automatiques
- ❌ Pas de prévisions stock (forecasting)
- ❌ Pas d'import/export Excel mouvements

### Roadmap 2025-Q4

**Priorité 1** (1 mois):

- [ ] Alertes stock bas (notifications temps réel)
- [ ] Réservation stock commandes
- [ ] Export Excel mouvements

**Priorité 2** (3 mois):

- [ ] Rapports stocks détaillés (valeur stock, rotation)
- [ ] Prévisions stock (ML forecasting)
- [ ] Inventaire physique (scan barcode)

---

## 🔗 Dépendances & Relations

### Modules Liés

- **Catalogue** (`/catalogue`) - Produits référencés
- **Commandes** (`/commandes/clients`) - Sorties stock ventes
- **Réceptions** (`/achats/receptions`) - Entrées stock fournisseurs (future)

---

## 🧪 Tests & Validation

### Tests Actuels

- ✅ MCP Browser: 0 erreur console ✅
- ✅ Filtres fonctionnels
- ✅ Pagination testée
- ✅ Statistiques correctes

### Tests Manquants

- ⏳ Tests E2E (création mouvements, transferts)
- ⏳ Tests performance (10 000+ mouvements)

---

## 📚 Documentation Associée

### Fichiers Clés

- **Page**: `src/app/stocks/mouvements/page.tsx`
- **Hook**: `src/hooks/use-stock-movements.ts`
- **Business Rules**: `manifests/business-rules/stock-movements-workflow.md`

---

**Dernière Mise à Jour**: 2025-10-10
**Maintenu Par**: Équipe Vérone
**Next Review**: 2025-10-24 (alertes stock bas)
