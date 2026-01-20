# Module Contacts & Organisations - Vérone Back Office

Gestion centralisée des organisations (clients, fournisseurs, partenaires) et contacts avec relations polymorphiques.

---

## Vue d'ensemble

Le module Contacts & Organisations centralise la gestion du CRM Vérone avec une architecture polymorphique permettant de gérer clients, fournisseurs et partenaires dans une structure unifiée.

**Routes principales**: `/contacts-organisations`

---

## Structure Module

```
contacts-organisations/
├── page.tsx                    # Dashboard organisations (vue globale)
├── customers/                  # Clients
│   ├── page.tsx               # Liste clients
│   └── [id]/                  # Détail client
├── suppliers/                 # Fournisseurs
│   ├── page.tsx               # Liste fournisseurs
│   └── [id]/                  # Détail fournisseur
├── partners/                  # Partenaires commerciaux
│   ├── page.tsx               # Liste partenaires
│   └── [id]/                  # Détail partenaire
└── contacts/                  # Contacts individuels
    ├── page.tsx               # Liste contacts
    └── [id]/                  # Détail contact
```

---

## Fonctionnalités

### Organisations

#### Types d'Organisations

- **Clients** (Customers): Organisations acheteuses
- **Fournisseurs** (Suppliers): Organisations vendeuses
- **Partenaires** (Partners): Organisations collaboratrices

#### Architecture Polymorphique

- Table unique `organisations` avec champ `type`
- Relations polymorphiques avec commandes, contacts, documents
- Gestion centralisée avec vues typées

#### Informations Organisations

- Informations légales (SIRET, TVA, forme juridique)
- Adresses (facturation, livraison, multiple)
- Coordonnées (téléphone, email, site web)
- Conditions commerciales (remises, délais, MOQ)
- Statut (actif, inactif, suspendu)

### Contacts

#### Types Contacts

- Contacts liés organisations (polymorphic)
- Contacts indépendants
- Contacts multi-organisations

#### Informations Contacts

- Identité (civilité, prénom, nom)
- Fonction et département
- Coordonnées (email, téléphone, mobile)
- Préférences communication
- Notes et historique interactions

### Gestion Relations

#### Relations Organisations

- Hiérarchies (filiales, maisons-mères)
- Partenariats commerciaux
- Historique commandes
- Historique paiements

#### Relations Contacts

- Contacts principaux organisations
- Contacts secondaires
- Historique communications
- Tâches et rappels

---

## Business Rules

### Validation Organisations

#### Champs Obligatoires

- Nom organisation
- Type organisation (customer, supplier, partner)
- Email ou téléphone (au moins un)

#### Champs Conditionnels

- SIRET: Obligatoire si France
- TVA intra: Si société assujettie TVA
- Conditions commerciales: Si client avec pricing custom

### Polymorphic Relations

#### Pattern Architecture

```typescript
// Relations polymorphiques
organisation_type: 'customer' | 'supplier' | 'partner'
related_to_id: string (organisation.id)
related_to_type: string (organisation_type)

// Exemple commandes
sales_orders.customer_id → organisations (type: customer)
purchase_orders.supplier_id → organisations (type: supplier)
```

#### Validation Code Review (Phase 3)

- ✅ Polymorphic relations bien gérées
- ✅ Filters typés strictement
- Hook `use-organisations.ts` validé (score 9/10)

---

## Bugs Résolus (Sessions Précédentes)

### Bug Formulaire Organisations (2025-10-15)

- **Symptôme**: Tag Mismatch Button/ButtonV2 (commit `8a472bd`)
- **Solution**: Migration complète ButtonV2
- **Tests**: Formulaire organisations validé

---

## Sécurité

### RLS Policies

**Tables organisations**:

- `organisations` (table principale)
- `organisation_contacts` (relations contacts)
- `organisation_addresses` (adresses multiples)

**Authentification**:

- SELECT: `authenticated`
- INSERT/UPDATE: `crm_manager`, `sales_manager`
- DELETE: `admin`

### RGPD Compliance

#### Données Personnelles

- Consentement contact (opt-in email, phone)
- Droit à l'oubli (suppression contacts)
- Export données personnelles (GDPR)
- Historique modifications (audit trail)

#### Anonymisation

- Anonymisation contacts inactifs >3 ans
- Conservation légale minimale (factures, contrats)

---

## Performance

### Optimisations en Place

- Pagination listes (50 organisations/page)
- Cache SWR (5 min revalidation)
- Index database (type, status, created_at)
- Queries optimisées (SELECT colonnes essentielles)

### SLOs Estimés

- **Liste organisations**: <2s (non mesuré Phase 4)
- **Détail organisation**: <1s (non mesuré)
- **Recherche organisations**: <500ms (non mesuré)

---

## Fichiers Critiques

### Hooks Custom

- `use-organisations.ts` (gestion organisations, score 9/10 Code Review)
- `use-customers.ts` (vue clients)
- `use-suppliers.ts` (vue fournisseurs)
- `use-contacts.ts` (gestion contacts)

### Composants Business

- `organisation-form.tsx` (formulaire organisations)
- `contact-form.tsx` (formulaire contacts)
- `organisation-card.tsx` (affichage organisation)
- `contact-list.tsx` (liste contacts organisation)

### Validation Code Review (Phase 3)

- ✅ Polymorphic relations bien gérées
- ✅ Filters typés strictement
- ✅ Error handling robuste

---

## Intégrations

### Module Commandes

- Clients liés commandes ventes (sales_orders)
- Fournisseurs liés commandes achats (purchase_orders)
- Historique commandes par organisation

### Module Facturation

- Adresses facturation/livraison
- Conditions paiement par organisation
- Historique factures clients/fournisseurs

### Module Stocks

- Mouvements liés fournisseurs (réceptions)
- Mouvements liés clients (expéditions)
- Statistiques stock par organisation

### Module Catalogue

- Pricing custom clients (B2B)
- Catalogues partagés (collections)
- Produits fournisseurs (sourcing)

---

## Prochaines Étapes

### Court Terme (1 semaine)

1. Tests E2E workflows complets (création/édition)
2. Validation performance listes (<2s)
3. Tests recherche avancée

### Moyen Terme (2 semaines)

1. Optimisation requêtes SQL (SELECT spécifiques)
2. Amélioration UX formulaires (autocomplete adresses)
3. Export organisations CSV/Excel

### Long Terme (1 mois)

1. Analytics organisations (CA, fréquence commandes)
2. Segmentation clients avancée (RFM)
3. Intégration CRM externe (API)

---

## Documentation Connexe

- **Business Rules**: `/docs/engineering/business-rules/` (si existant)
- **Code Review**: `/MEMORY-BANK/sessions/RAPPORT-PHASE-3-CODE-REVIEW-2025-10-16.md`
- **Rapports Sessions**: `/MEMORY-BANK/sessions/` (sessions CRM)

---

**Module maintenu par**: Vérone System Orchestrator
**Dernière mise à jour**: 2025-10-16
**Statut**: ✅ Fonctionnel (Architecture polymorphique validée, Code Review 9/10)
