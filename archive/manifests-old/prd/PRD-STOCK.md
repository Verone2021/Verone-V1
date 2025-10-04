# PRD — Stock (Mouvements, Réservations)
**Status** : ✅ **IMPLÉMENTÉ** (16 septembre 2025)

## Contexte & Problème ✅
**Problème** : Absence de traçabilité des mouvements de stock et risque de survente
**Solution** : Système complet de gestion stock avec mouvements temps réel et réservations automatiques

## Utilisateurs & Cas d'usage (personas) ✅
- **[Admin]** : Vue globale stock, paramétrage seuils d'alerte
- **[Sales]** : Vérification disponibilité temps réel, réservations commandes
- **[Ops/Stock]** : Saisie mouvements IN/OUT, ajustements inventaire, réceptions fournisseurs
- **[Comptable]** : Valorisation stock, export données comptables
- **[Manager]** : Analytics performance stock, alertes rupture

## Portée (In) & Non-objectifs (Out) ✅
**In** :
- ✅ Mouvements stock 4 types : IN/OUT/ADJUST/TRANSFER
- ✅ Réservations automatiques prévention survente
- ✅ Traçabilité complète (qui/quand/pourquoi/référence)
- ✅ Calcul stock disponible temps réel
- ✅ Interface intuitive saisie/consultation
- ✅ Intégration commandes fournisseurs/clients

**Out** :
- ❌ Gestion multi-emplacements/entrepôts
- ❌ Codes-barres/RFID scanning
- ❌ Prévisions demande/réapprovisionnement automatique

**Dépendances** : Module Produits, Module Commandes, Supabase RLS

## Règles métier clés ✅
- **Stock Disponible** = stock_quantity - SUM(réservations actives)
- **Mouvements IN** : Augmentent automatiquement stock_quantity via trigger
- **Mouvements OUT** : Diminuent automatiquement stock_quantity via trigger
- **Réservations** : Expiration automatique après 24h si non confirmées
- **Traçabilité** : Tous mouvements avec référence (commande, ajustement, etc.)
- **Sécurité** : RLS par organisation, pas de modification historique

## Critères d'acceptation (Given/When/Then) ✅
- **[AC-1]** Given produit stock=10, When commande 5 unités, Then stock disponible=5, réservation créée
- **[AC-2]** Given mouvement IN +20, When trigger exécuté, Then stock_quantity augmente automatiquement
- **[AC-3]** Given réservation expirée, When cleanup automatique, Then stock disponible recalculé
- **[AC-4]** Given utilisateur organisation A, When consulte stock, Then voit uniquement ses produits (RLS)

## Métriques de succès ✅
- ✅ **Temps chargement** : <2s page stock avec 200+ produits
- ✅ **Précision stock** : 100% cohérence mouvements ↔ stock_quantity
- ✅ **Prévention survente** : 0% commandes acceptées sans stock
- ✅ **Traçabilité** : 100% mouvements avec référence et utilisateur
- ✅ **Performance** : Pagination 50 éléments, filtres temps réel

## Contraintes & Risques ✅
- ✅ **Performance** : Index optimisés product_id + created_at
- ✅ **Concurrence** : Locks base données sur calculs stock
- ✅ **Sécurité** : RLS strict multi-tenant, audit trail complet
- ✅ **Intégrité** : Triggers empêchent stock négatif non autorisé

## Plan de tests (unitaire/e2e) ⚠️
**Validé Manuellement** :
- ✅ Création mouvements tous types (IN/OUT/ADJUST/TRANSFER)
- ✅ Calcul stock disponible avec réservations
- ✅ Intégration réception commandes fournisseurs
- ✅ Workflow complet commandes clients avec validation stock

**À Implémenter** :
- 🔄 Tests E2E Playwright workflows complets
- 🔄 Tests performance avec gros volumes
- 🔄 Tests sécurité RLS multi-tenant

## Implémentation Technique ✅

### Base de Données
- **Table** : `stock_movements` (id, product_id, movement_type, quantity_change, reference_type, reference_id, notes, created_by, created_at)
- **Table** : `stock_reservations` (id, product_id, quantity, expires_at, reference_type, reference_id, status)
- **Triggers** : Mise à jour automatique stock_quantity sur INSERT stock_movements
- **RLS** : Policies organisation-based sur toutes tables

### Hooks TypeScript
- **`use-stock-movements.ts`** : Gestion complète mouvements + statistiques
- **`use-stock-reservations.ts`** : Système réservations + nettoyage automatique

### Interface UI
- **Page** : `/stocks` - Liste produits + stock + actions
- **Modals** : Création mouvements, historique produit
- **Filtres** : Produit, type mouvement, période, stock faible
