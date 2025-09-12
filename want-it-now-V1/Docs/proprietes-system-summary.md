# 🏠 Système de Gestion des Propriétés - Documentation Complète

## 📊 Vue d'ensemble

Le système de gestion des propriétés a été entièrement implémenté avec les fonctionnalités suivantes :

### ✅ Fonctionnalités Implémentées

1. **Base de données complète** (Migrations 080-083)
   - Tables : proprietes, unites, propriete_proprietaires, propriete_photos, unite_photos
   - Types enum : propriete_type, propriete_statut
   - Vues enrichies avec statistiques
   - Fonctions utilitaires (calcul quotités, permissions, etc.)
   - Politiques RLS avec respect des rôles

2. **Interface utilisateur**
   - Page liste avec KPIs et filtres
   - Wizard création 4 étapes
   - Page détail modulaire avec tabs
   - Gestion des quotités (propriétaires)
   - Support multi-unités pour immeubles

3. **Gestion des permissions**
   - Super admins : accès total
   - Admins : création/modification dans leur organisation et pays uniquement
   - Utilisateurs : lecture seule pour leur organisation

## 🗂 Structure des fichiers

### Migrations Database
```
supabase/migrations/
├── 080_create_proprietes_tables.sql       # Tables principales
├── 081_create_proprietes_views_functions.sql # Vues et fonctions
├── 082_create_proprietes_rls_policies.sql  # Politiques RLS initiales
└── 083_fix_proprietes_rls_policies.sql     # Correction RLS avec règles métier
```

### Pages
```
app/proprietes/
├── page.tsx                    # Liste des propriétés avec KPIs
├── new/page.tsx               # Wizard création (4 étapes)
├── [id]/page.tsx              # Détail propriété modulaire
└── [id]/edit/page.tsx         # Édition propriété
```

### Composants
```
components/proprietes/
├── propriete-breadcrumbs.tsx      # Navigation breadcrumb
├── propriete-kpi-cards.tsx        # Cartes KPI dashboard
├── propriete-tabs.tsx              # Navigation par tabs
├── proprietes-filters.tsx         # Filtres liste
├── proprietes-table.tsx           # Table avec actions
├── wizard/
│   ├── step-info-generale.tsx     # Étape 1: Infos générales
│   ├── step-localisation.tsx      # Étape 2: Localisation
│   ├── step-caracteristiques.tsx  # Étape 3: Caractéristiques
│   └── step-financier.tsx         # Étape 4: Infos financières
├── sections/
│   ├── propriete-info-section.tsx           # Section informations
│   ├── propriete-location-section.tsx       # Section localisation
│   ├── propriete-caracteristiques-section.tsx # Section caractéristiques
│   ├── propriete-tarifs-section.tsx         # Section tarifs/ROI
│   ├── propriete-quotites-section.tsx       # Section quotités
│   ├── propriete-photos-section.tsx         # Section photos
│   ├── propriete-unites-section.tsx         # Section unités
│   └── propriete-actions-section.tsx        # Section actions admin
└── dialogs/
    └── quotite-dialog.tsx          # Modal ajout propriétaire
```

### Backend
```
actions/proprietes.ts              # Server actions
lib/validations/proprietes.ts      # Schemas Zod
```

### Scripts de test
```
scripts/
├── test-proprietes-system.js      # Test système complet
└── create-test-proprietes.js      # Création données de test
```

## 🔑 Règles métier implémentées

### Permissions par rôle

| Rôle | Création | Modification | Lecture | Suppression |
|------|----------|--------------|---------|-------------|
| Super Admin | ✅ Toutes organisations | ✅ Toutes propriétés | ✅ Tout | ✅ Tout |
| Admin | ✅ Son organisation + pays | ✅ Son organisation | ✅ Son organisation | ❌ |
| Utilisateur | ❌ | ❌ | ✅ Son organisation | ❌ |

### Contraintes importantes
- Les admins ne peuvent créer des propriétés que dans le pays de leur organisation
- Les quotités doivent totaliser 100%
- Une propriété louée ou vendue ne peut pas être supprimée
- Référence auto-générée : PROP-YYYY-NNNNN

## 📈 Statuts de propriété

```typescript
enum propriete_statut {
  'brouillon',      // En cours de création
  'sourcing',       // Recherche active
  'evaluation',     // Analyse en cours
  'negociation',    // Négociation prix
  'achetee',        // Acquisition finalisée
  'disponible',     // Prête à louer
  'louee',          // Actuellement louée
  'vendue'          // Vendue
}
```

## 🏗 Types de propriété

```typescript
enum propriete_type {
  'appartement',
  'maison',
  'terrain',
  'immeuble',      // Multi-unités
  'commerce',
  'bureau',
  'entrepot',
  'parking',
  'autre'
}
```

## 🎯 Fonctionnalités clés

### 1. Gestion des quotités
- Ajout/suppression de propriétaires
- Calcul automatique du pourcentage restant
- Validation du total à 100%
- Affichage avec progress bar

### 2. Support multi-unités
- Pour les immeubles (type = 'immeuble', a_unites = true)
- Gestion individuelle des unités
- Calcul automatique du taux d'occupation
- Revenus totaux consolidés

### 3. Calculs financiers
- ROI automatique : (loyer_annuel / prix_acquisition) × 100
- Rendement moyen du portefeuille
- Valeur totale du patrimoine
- Revenus mensuels consolidés

### 4. Workflow de création
- Étape 1 : Informations générales (nom, type, statut)
- Étape 2 : Localisation (adresse complète, GPS optionnel)
- Étape 3 : Caractéristiques (surface, pièces, équipements)
- Étape 4 : Informations financières (prix, loyer, charges)

## 🚀 URLs disponibles

- `/proprietes` - Liste avec KPIs et filtres
- `/proprietes/new` - Wizard création
- `/proprietes/[id]` - Détail avec tabs modulaires
- `/proprietes/[id]/edit` - Édition complète

## 📊 Données de test

8 propriétés créées avec différents statuts :
- 3 louées (générant des revenus)
- 1 disponible
- 1 en négociation
- 1 en sourcing
- 1 en évaluation
- 1 achetée (immeuble avec 6 unités)

## 🔧 Commandes utiles

```bash
# Tester le système
npm run dev
node scripts/test-proprietes-system.js

# Créer des données de test
node scripts/create-test-proprietes.js

# Appliquer les migrations
psql $DATABASE_URL -f supabase/migrations/080_create_proprietes_tables.sql
psql $DATABASE_URL -f supabase/migrations/081_create_proprietes_views_functions.sql
psql $DATABASE_URL -f supabase/migrations/083_fix_proprietes_rls_policies.sql
```

## ✅ Système entièrement fonctionnel

Le système de gestion des propriétés est maintenant :
- ✅ Complètement implémenté
- ✅ Testé avec succès
- ✅ Documenté
- ✅ Prêt pour la production
- ✅ Respecte les règles métier définies
- ✅ Intégré avec le système d'authentification SSR
- ✅ Compatible avec les rôles existants