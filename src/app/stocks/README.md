# Module Stocks - Vérone Back Office

Gestion complète des stocks avec mouvements traçables, alertes et inventaires.

---

## Vue d'ensemble

Le module Stocks assure la traçabilité complète des mouvements de stock avec gestion automatisée des réserves, entrées, sorties et ajustements.

**Routes principales**: `/stocks`

---

## Structure Module

```
stocks/
├── page.tsx                    # Dashboard stocks (vue globale)
├── produits/                   # Liste produits avec niveaux stock
├── mouvements/                 # Historique mouvements
├── entrees/                    # Entrées stock (réceptions fournisseurs)
├── sorties/                    # Sorties stock (expéditions clients)
├── ajustements/                # Ajustements manuels (inventaires)
├── inventaire/                 # Gestion inventaires physiques
└── alertes/                    # Alertes stock (ruptures, minimum)
```

---

## Fonctionnalités

### Dashboard Stocks

#### KPIs Temps Réel

- Stock total valorisé
- Produits en rupture
- Produits sous seuil alerte
- Valeur stock immobilisée

#### Graphiques

- Évolution stock sur période
- Mouvements par type (IN, OUT, ADJUST, TRANSFER)
- Top produits mouvementés

**Refonte**: Session 2025-10-15 (Dashboard simplifié)

### Mouvements Stock

#### Types Mouvements

- **IN**: Entrées stock (réceptions fournisseurs, production)
- **OUT**: Sorties stock (expéditions clients, consommation)
- **ADJUST**: Ajustements manuels (inventaires, corrections)
- **TRANSFER**: Transferts entre emplacements

#### Traçabilité Complète

- Référence mouvement unique
- Horodatage précis (created_at)
- Utilisateur responsable (user_id)
- Raison mouvement (notes)
- Lien commande/organisation source

#### Validation Workflow

- **Réserve**: Stock réservé à VALIDEE (commande client)
- **Décrémentation**: Stock décrémenté à EXPEDIEE (commande client)
- **Incrémentation**: Stock incrémenté à RECUE (commande fournisseur)

### Alertes Stock

#### Types Alertes

- **Rupture stock**: Quantité = 0
- **Stock bas**: Quantité < seuil minimum
- **Stock excédentaire**: Quantité > seuil maximum (optionnel)

#### Notifications

- Centre notifications temps réel
- Alertes prioritaires (ruptures)
- Historique alertes résolues

### Inventaires

#### Fonctionnalités

- Création sessions inventaire
- Comptage physique vs théorique
- Génération ajustements automatiques
- Écarts valorisés
- Historique inventaires

---

## Business Rules

### Workflow Mouvements

#### Règles Automatiques (WORKFLOWS.md)

- **Réserve**: Stock réservé à `VALIDEE` (commande client)
- **Décrémente**: Stock décrémenté à `EXPEDIEE` (commande client)
- **Incrémente**: Stock incrémenté à `RECUE` (commande fournisseur)

#### Règles Validation

- Quantité > 0 obligatoire
- Type mouvement obligatoire (IN, OUT, ADJUST, TRANSFER)
- Référence unique générée automatiquement
- Audit trail complet (created_at, user_id)

### Valorisation Stock

#### Méthodes

- **CUMP** (Coût Unitaire Moyen Pondéré) - Par défaut
- **FIFO** (First In First Out) - Optionnel
- **Prix fixe** - Pour produits spécifiques

#### Calculs

- Valorisation totale: Σ(quantité × coût unitaire)
- Mises à jour automatiques à chaque mouvement

---

## Bugs Résolus (Sessions Précédentes)

### Bug Triplication Mouvements (2025-10-13)

- **Symptôme**: 3 mouvements créés au lieu de 1 (triggers concurrents)
- **Solution**: Correction triggers database
- **Tests**: Validation création mouvements uniques

### Bug RLS 403 Stocks (2025-10-13)

- **Symptôme**: Erreurs 403 lors accès mouvements
- **Solution**: Correction policies RLS
- **Tests**: Accès mouvements validé

### Bug Annulation Workflow Stocks (2025-10-14)

- **Symptôme**: Annulation commande ne libère pas stock
- **Solution**: Correction workflow annulation mouvements
- **Tests**: Libération stock validée

### 3 Bugs Stocks Critiques (2025-10-14)

- **Solution**: Corrections multiples (non détaillé)
- **Tests**: Tests E2E stocks validés

---

## Tests Validés (Sessions Précédentes)

### Tests E2E Stocks (2025-10-13)

- ✅ Création mouvements IN/OUT/ADJUST
- ✅ Workflow réserve/décrémentation
- ✅ Triplication mouvements résolue
- ✅ RLS 403 errors résolus

### Tests Annulation (2025-10-14)

- ✅ Annulation commande libère stock
- ✅ Mouvements correctement annulés

---

## Sécurité

### RLS Policies

**Tables stocks**:

- `stock_movements` (mouvements)
- `product_stock` (niveaux stock)
- `stock_alerts` (alertes)
- `inventory_sessions` (inventaires)

**Authentification**:

- SELECT: `authenticated`
- INSERT/UPDATE: `stock_manager`, `inventory_manager`
- DELETE: `admin`
- ADJUST: `inventory_manager` uniquement

---

## Performance

### Optimisations en Place

- Index database (product_id, movement_type, created_at)
- Pagination mouvements (50 items/page)
- Cache SWR (2 min revalidation pour données dynamiques)
- Requêtes optimisées (SELECT colonnes essentielles)

### SLOs Estimés

- **Dashboard stocks**: <2s (non mesuré Phase 4)
- **Liste mouvements**: <2s (non mesuré)
- **Création mouvement**: <1s (non mesuré)

---

## Fichiers Critiques

### Hooks Custom

- `use-stock-movements.ts` (gestion mouvements)
- `use-product-stock.ts` (niveaux stock)
- `use-stock-alerts.ts` (alertes)
- `use-inventory-sessions.ts` (inventaires)

### Composants Business

- `stock-movement-form.tsx` (création mouvements)
- `movement-card.tsx` (affichage mouvement - Session 2025-10-14)
- `inventory-card.tsx` (affichage inventaire - Session 2025-10-14)
- `stock-alert-badge.tsx` (badges alertes)

### API Routes

- `api/stock-movements/create/route.ts` (création mouvement)
- `api/inventory/adjust/route.ts` (ajustements inventaire)

---

## Intégrations

### Module Commandes

- Création mouvements automatiques (OUT à EXPEDIEE)
- Réservation stock (VALIDEE)
- Libération stock (ANNULEE)

### Module Catalogue

- Niveaux stock par produit
- Seuils alertes (minimum, maximum)
- Disponibilité produits temps réel

### Module Organisation

- Mouvements liés organisations (fournisseurs, clients)
- Historique mouvements par organisation

---

## Composants Créés (Session 2025-10-14)

### MovementCard

- Affichage mouvement avec icônes typées
- Couleurs selon type (IN vert, OUT rouge, etc.)
- Informations complètes (quantité, produit, date, utilisateur)

### InventoryCard

- Affichage session inventaire
- Écarts valorisés
- Statuts (en cours, terminé, validé)

---

## Prochaines Étapes

### Court Terme (1 semaine)

1. Tests E2E workflows complets (GROUPE 6)
2. Validation performance dashboard (<2s)
3. Tests alertes multiples

### Moyen Terme (2 semaines)

1. Optimisation requêtes mouvements (index supplémentaires)
2. Amélioration UX inventaires (comptage mobile)
3. Export mouvements CSV/Excel

### Long Terme (1 mois)

1. Gestion multi-emplacements (warehouses)
2. Transferts inter-sites
3. Analytics prédictifs (prévisions ruptures)

---

## Documentation Connexe

- **Business Rules**: `/manifests/business-rules/WORKFLOWS.md`
- **Rapports Sessions**: `/MEMORY-BANK/sessions/RAPPORT-SESSION-*-STOCKS-*.md`
- **Code Review**: `/MEMORY-BANK/sessions/RAPPORT-PHASE-3-CODE-REVIEW-2025-10-16.md`

---

**Module maintenu par**: Vérone System Orchestrator
**Dernière mise à jour**: 2025-10-16
**Statut**: ✅ Fonctionnel (Tests sessions précédentes validés, Refonte 2025-10-15 complète)
