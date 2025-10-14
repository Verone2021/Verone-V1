# Améliorations Page Mouvements Stock - 2025-10-14

## Contexte
Amélioration de la page `/stocks/mouvements` pour distinguer les mouvements réels des prévisionnels et afficher les liens vers les commandes associées.

## Modifications Réalisées

### 1. **movements-filters.tsx** - Nouveaux Filtres
**Fichier**: `src/components/business/movements-filters.tsx`

**Ajouts**:
- Filtre "Type de Mouvement" permettant de choisir entre:
  - Tous les mouvements
  - Mouvements Réels (affects_forecast = false)
  - Mouvements Prévisionnels (affects_forecast = true)

- Filtre conditionnel "Direction Prévisionnel" (visible uniquement si "Prévisionnels" sélectionné):
  - Toutes directions
  - Entrées Prévues (forecast_type = 'in')
  - Sorties Prévues (forecast_type = 'out')

- Mise à jour du compteur de filtres actifs pour inclure les nouveaux filtres

**Localisation**: Lignes 247-293

### 2. **movements-table.tsx** - Colonne Commande Liée
**Fichier**: `src/components/business/movements-table.tsx`

**Ajouts**:
- Nouvelle colonne "Commande Liée" dans le tableau
- Affichage conditionnel:
  - **Commande Client** (reference_type = 'sales_order'): Lien vers `/ventes/commandes?highlight={id}`
  - **Commande Fournisseur** (reference_type = 'purchase_order'): Lien vers `/achats/commandes?highlight={id}`
  - Badge "Prév. IN/OUT" si mouvement prévisionnel
  - Tiret "-" si pas de commande liée

**Localisation**: Lignes 160, 222, 277-307

### 3. **movements-stats.tsx** - Statistiques Réel/Prévisionnel
**Fichier**: `src/components/business/movements-stats.tsx`

**Ajouts**:
- Deux nouvelles cartes statistiques affichées après les 4 métriques principales:
  1. **Mouvements Réels**: Comptage des mouvements avec affects_forecast = false
  2. **Mouvements Prévisionnels**: Comptage des mouvements avec affects_forecast = true

- Design cohérent avec border-black selon le design system Vérone

**Localisation**: Lignes 109-138

### 4. **use-movements-history.ts** - Support Backend
**Fichier**: `src/hooks/use-movements-history.ts`

**Modifications Interface MovementHistoryFilters**:
```typescript
affects_forecast?: boolean
forecast_type?: 'in' | 'out'
```

**Modifications Interface MovementsStats**:
```typescript
realMovements?: number
forecastMovements?: number
```

**Modifications fetchMovements()**:
- Ajout filtres `affects_forecast` et `forecast_type` dans les requêtes Supabase
- Localisation: Lignes 128-136

**Modifications fetchStats()**:
- Comptage séparé des mouvements réels vs prévisionnels
- Localisation: Lignes 275-284, 389-390

**Modifications exportMovements()**:
- Inclusion des nouveaux filtres dans l'export CSV
- Localisation: Lignes 453-459

## Tests Effectués
- ✅ Linting: Aucune erreur sur les fichiers modifiés
- ✅ Build: Compilation réussie sans erreurs
- ✅ Types: Interfaces TypeScript mises à jour correctement

## URLs des Commandes
- Commandes Clients: `/ventes/commandes?highlight={reference_id}`
- Commandes Fournisseurs: `/achats/commandes?highlight={reference_id}`

## Design System
- Respect des couleurs Vérone (noir, blanc, gris)
- Badges violet/purple pour indicateurs prévisionnels
- Border-black sur les cartes statistiques

## Notes Importantes
- Les liens commandes utilisent le paramètre `highlight` pour faciliter la navigation
- Les badges "Prév. IN/OUT" permettent d'identifier rapidement le type de mouvement prévisionnel
- Le filtre "Direction Prévisionnel" n'apparaît que si "Mouvements Prévisionnels" est sélectionné
- Les statistiques réel/prévisionnel sont calculées sur l'ensemble des mouvements (pas uniquement le mois en cours)
