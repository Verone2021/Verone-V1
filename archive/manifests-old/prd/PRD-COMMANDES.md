# PRD — Commandes (Fournisseurs + Clients)
**Status** : ✅ **IMPLÉMENTÉ** (16 septembre 2025)

## Contexte & Problème ✅
**Problème** : Absence de workflow structuré commandes, risque erreurs saisie, pas de traçabilité
**Solution** : Système complet gestion commandes fournisseurs et clients avec workflows stricts et intégration stock

## Utilisateurs & Cas d'usage (personas) ✅
- **[Admin]** : Vue globale commandes, paramétrage workflow, accès tous statuts
- **[Sales]** : Création commandes clients, suivi pipeline, validation disponibilité stock
- **[Achats/Procurement]** : Commandes fournisseurs, négociation, suivi livraisons
- **[Ops/Stock]** : Réception marchandises, expédition commandes, mouvements stock
- **[Comptable]** : Valorisation commandes, rapprochement factures, exports comptables

## Portée (In) & Non-objectifs (Out) ✅

### **Commandes Fournisseurs (Purchase Orders)**
**In** :
- ✅ Workflow : draft → sent → confirmed → partially_received → received
- ✅ Génération automatique numéros PO
- ✅ Sélection produits avec prix fournisseur
- ✅ Calculs automatiques totaux HT/TTC
- ✅ Réception partielle/totale avec mouvements stock
- ✅ Traçabilité utilisateurs + timestamps workflow
- ✅ **Auto-remplissage adresse livraison** : Pré-remplissage automatique depuis fiche fournisseur

### **Commandes Clients (Sales Orders)**
**In** :
- ✅ Workflow : draft → confirmed → shipped → delivered
- ✅ Validation stock disponible temps réel
- ✅ Réservations automatiques prévention survente
- ✅ Expédition avec mouvements OUT automatiques
- ✅ Interface responsive avec recherche produits
- ✅ **Auto-remplissage adresses** : Pré-remplissage automatique livraison + facturation depuis fiche client

**Out** :
- ❌ Génération devis PDF (prochaine phase)
- ❌ Intégration systèmes comptables externes
- ❌ Gestion multi-devises
- ❌ Remises complexes/règles tarifaires avancées

**Dépendances** : Module Stock, Module Produits, Module Organisations, Supabase RLS

## Règles métier clés ✅

### **Commandes Fournisseurs**
- **Numérotation** : Auto-incrémentée PO-YYYY-NNNN via fonction generate_po_number()
- **Workflow Strict** : Pas de retour arrière statuts, timestamps automatiques
- **Réception** : Mouvement stock IN automatique + recalcul statut commande
- **Validation** : Seules commandes draft peuvent être modifiées/supprimées

### **Commandes Clients**
- **Stock Obligatoire** : Commande refusée si stock insuffisant
- **Réservations** : Création automatique à la confirmation, libération à l'annulation
- **Expédition** : Mouvement stock OUT automatique + mise à jour réservations
- **Cohérence** : Stock disponible = stock_quantity - réservations actives

## Critères d'acceptation (Given/When/Then) ✅
- **[AC-1]** Given commande fournisseur draft, When envoi fournisseur, Then statut=sent + timestamp + user_id
- **[AC-2]** Given réception 50% items, When validation, Then statut=partially_received + mouvements stock
- **[AC-3]** Given commande client stock insuffisant, When validation, Then erreur + blocage commande
- **[AC-4]** Given commande client confirmée, When expédition, Then stock OUT + réservation libérée
- **[AC-5]** Given utilisateur organisation A, When consulte commandes, Then voit uniquement ses commandes (RLS)
- **[AC-6]** Given sélection client avec adresse, When création commande, Then bouton "Utiliser adresse client" visible
- **[AC-7]** Given clic "Utiliser adresse client", When auto-remplissage, Then livraison + facturation pré-remplies
- **[AC-8]** Given modification adresse commande, When sauvegarde, Then organisation.address inchangée (isolation)

## Métriques de succès ✅
- ✅ **Temps chargement** : <2s listes commandes avec 100+ entrées
- ✅ **Validation stock** : 100% contrôle disponibilité avant confirmation
- ✅ **Cohérence stock** : 0% incohérence réservations ↔ stock disponible
- ✅ **Workflow integrity** : 100% transitions statuts respectées
- ✅ **UX saisie** : Recherche produits <500ms, autocomplete réactive
- ✅ **Auto-remplissage adresses** : <100ms détection + copie, >90% taux utilisation

## Contraintes & Risques ✅
- ✅ **Performance** : Index optimisés organisation + statut + dates
- ✅ **Concurrence** : Locks durant validation stock + création réservations
- ✅ **Sécurité** : RLS strict multi-tenant, audit trail complet workflows
- ✅ **Intégrité** : Contraintes FK empêchent orphelins, triggers cohérence stock

## Plan de tests (unitaire/e2e) ⚠️
**Validé Manuellement** :
- ✅ Workflow complet commandes fournisseurs (draft → received)
- ✅ Workflow complet commandes clients avec validation stock
- ✅ Réceptions partielles avec calculs automatiques
- ✅ Prévention survente via réservations
- ✅ RLS isolation organisations

**À Implémenter** :
- 🔄 Tests E2E Playwright scenarios complets
- 🔄 Tests charge avec volumes importants
- 🔄 Tests concurrence multiple utilisateurs
- 🔄 Tests intégrité données post-migrations

## Implémentation Technique ✅

### Base de Données

#### **Commandes Fournisseurs**
- **Table** : `purchase_orders` (id, po_number, supplier_id, status, totaux, dates_workflow, users_workflow)
- **Table** : `purchase_order_items` (id, purchase_order_id, product_id, quantités, prix, dates)
- **Fonction** : `generate_po_number()` - Numérotation automatique thread-safe

#### **Commandes Clients**
- **Table** : `sales_orders` (id, so_number, customer_id, status, totaux, dates_workflow)
- **Table** : `sales_order_items` (id, sales_order_id, product_id, quantités, prix, stock_reserved)
- **Intégration** : `stock_reservations` pour prévention survente

#### **Sécurité & Performance**
- **RLS** : Policies organisation-based sur toutes tables commandes
- **Index** : Composite (organisation_id, status, created_at) pour filtres fréquents
- **Triggers** : Validation cohérence stock lors INSERT/UPDATE items

### Hooks TypeScript
- **`use-purchase-orders.ts`** : Workflow complet PO + réceptions
- **`use-sales-orders.ts`** : Workflow SO + validation stock temps réel
- **Intégration** : `use-stock-movements.ts` pour mouvements automatiques

### Interface UI

#### **Commandes Fournisseurs (/commandes/fournisseurs)**
- **Liste** : Filtres statut/fournisseur/période + actions rapides
- **Formulaire** : Recherche produits + calculs temps réel
- **Modal Réception** : Saisie quantités + validation business

#### **Commandes Clients (/commandes/clients)**
- **Liste** : Vue pipeline + alertes stock
- **Formulaire** : Validation stock live + UX préventive
- **Workflow Visual** : Statuts progression + actions contextuelles

### Performance & UX
- **Pagination** : 25 commandes par page avec lazy loading
- **Recherche** : Debouncing 300ms + cache client
- **Validation** : Temps réel côté client + confirmation serveur
- **Responsive** : Mobile-first design, touch-friendly actions
