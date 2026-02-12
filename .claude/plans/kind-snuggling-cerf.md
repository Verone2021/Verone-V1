# Plan : Filtres Avancés Commandes Clients + Correction Données Enseignes

## Contexte

La page Commandes Clients (`/commandes/clients`) a 5 filtres inline (statut, type client, periode, recherche, rapprochement bancaire). PR 174 a ajouté la distinction organisation/enseigne dans le filtre "type client". Mais :

1. **Données incorrectes** : 7 organisations Pokawa ont `enseigne_id = NULL` alors qu'elles appartiennent à l'enseigne Pokawa. Elles apparaissent dans "Organisations (indep.)" au lieu de "Enseignes".
2. **UX limitée** : Les filtres inline sont basiques. Pas de filtre par enseigne spécifique, pas de plage de prix, pas de multi-select statuts.

**Objectif** : Corriger les données + remplacer les 3 filtres inline (type client, période, rapprochement) par un modal "Filtres Avancés" avec plus d'options.

---

## Ce qui existe déjà (à réutiliser)

| Existant                           | Fichier                                                              | Usage                                                     |
| ---------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------- |
| `useActiveEnseignes()` hook        | `packages/@verone/organisations/src/hooks/use-enseignes.ts:464`      | Liste enseignes pour le Select                            |
| `MovementsFilters` (pattern modal) | `packages/@verone/stock/src/components/filters/MovementsFilters.tsx` | Pattern UX à suivre (local state + apply + reset + badge) |
| `showEnseigneFilter` prop          | `SalesOrdersTable.tsx:237`                                           | Déjà configuré dans la page clients                       |
| Enseigne parent Pokawa ID          | `de1bcbd7-0086-4632-aedb-ece0a5b3d358`                               | Pour la migration SQL                                     |

---

## Etapes d'implémentation

### Etape 1 : Migration SQL - Corriger 7 organisations Pokawa orphelines

**Fichier** : `supabase/migrations/YYYYMMDD_001_fix_pokawa_organisations_enseigne_id.sql`

**Actions** :

1. UPDATE 5 vraies organisations Pokawa pour leur attribuer `enseigne_id = 'de1bcbd7-0086-4632-aedb-ece0a5b3d358'` :
   - Pokawa Marseille Prado (PK PRADO)
   - Pokawa Cormeilles-en-Parisis (DESMAFOOD)
   - POKAWA AIX-EN-PROVENCE
   - Pokawa Mazarine - Paris 8
   - Pokawa Puteaux
2. DELETE 4 organisations de test "Pokawa Test E2E Propre" (doublons inutiles du 25 jan)

**Vérification** : Query SQL pour confirmer 0 organisations Pokawa avec `enseigne_id IS NULL`.

**Workflow migration 5 étapes** : Fichier SQL > execute_sql > tracking schema_migrations > advisors > types.

---

### Etape 2 : Créer le type `AdvancedFilters`

**Fichier** : `packages/@verone/orders/src/types/advanced-filters.ts`

**Contenu** :

```typescript
export interface AdvancedFilters {
  statuses?: SalesOrderStatus[]; // Multi-select statuts
  customerType?:
    | 'all'
    | 'individual'
    | 'professional'
    | 'organisation'
    | 'enseigne';
  enseigneId?: string | null; // Filtre enseigne spécifique
  priceRange?: { min: number | null; max: number | null };
  channelId?: string | null; // Canal de vente
  matchingFilter?: 'all' | 'matched' | 'unmatched';
}
```

Note : Le filtre `periodFilter` actuel (mois/trimestre/année) est supprimé - il est peu utile comparé à un vrai date range picker (évolution future).

---

### Etape 3 : Créer le composant `AdvancedFiltersModal`

**Fichier** : `packages/@verone/orders/src/components/modals/AdvancedFiltersModal.tsx`

**Pattern** : Suivre `MovementsFilters.tsx` (local state > apply > reset > badge count).

**Sections du modal** :

1. **Statuts** - Checkboxes multi-select (brouillon, validée, expédiée, livrée, clôturée, annulée)
2. **Type client** - Select (tous, particuliers, professionnels, organisations indep., enseignes) + Select enseigne conditionnel (utilise `useActiveEnseignes()`)
3. **Montant TTC** - 2 inputs number (min/max)
4. **Canal de vente** - Select (tous, LinkMe, Site Internet)
5. **Rapprochement bancaire** - Select (tous, rapprochées, non rapprochées)

**Footer** : Bouton "Réinitialiser" + Bouton "Appliquer (N)"

---

### Etape 4 : Intégrer dans `SalesOrdersTable.tsx`

**Fichier** : `packages/@verone/orders/src/components/SalesOrdersTable.tsx`

**Modifications** :

1. **Remplacer 3 états** (`customerTypeFilter`, `periodFilter`, `matchingFilter`) par 1 seul `advancedFilters: AdvancedFilters`
2. **Remplacer 3 Select inline** par 1 bouton "Filtres Avancés" avec badge compteur
3. **Adapter la logique `filteredOrders`** (useMemo) pour utiliser `advancedFilters` :
   - Statuts multi-select
   - Type client + enseigne spécifique
   - Plage de prix (min/max sur `total_ttc`)
   - Canal de vente (`channel_id`)
   - Rapprochement bancaire (inchangé)
4. **Garder** : recherche texte (inchangée), tri (inchangé), tabs statut (inchangées)

**Backward compatibility** : Les props `showCustomerTypeFilter`, `showPeriodFilter` deviennent inutilisées - on les garde temporairement pour ne pas casser les autres pages (fournisseurs).

---

### Etape 5 : Vérification

1. `pnpm --filter @verone/orders type-check` - TypeScript OK
2. `pnpm --filter @verone/orders build` - Build OK
3. Test manuel via Playwright MCP :
   - Page `/commandes/clients` > Bouton "Filtres Avancés" > Modal s'ouvre
   - Sélectionner "Enseignes" > Select enseigne apparaît > Choisir "Pokawa" > Seules commandes Pokawa
   - Tester plage prix min/max
   - Tester reset
   - Vérifier badge compteur
4. Vérifier que la page `/commandes/fournisseurs` fonctionne toujours (pas de régression)

---

## Fichiers impactés (résumé)

| Fichier                                                                     | Action                                          |
| --------------------------------------------------------------------------- | ----------------------------------------------- |
| `supabase/migrations/YYYYMMDD_001_fix_pokawa_organisations_enseigne_id.sql` | CREER                                           |
| `packages/@verone/orders/src/types/advanced-filters.ts`                     | CREER                                           |
| `packages/@verone/orders/src/components/modals/AdvancedFiltersModal.tsx`    | CREER                                           |
| `packages/@verone/orders/src/components/modals/index.ts`                    | MODIFIER (export)                               |
| `packages/@verone/orders/src/components/SalesOrdersTable.tsx`               | MODIFIER (remplacer 3 filtres inline par modal) |

## Estimation : ~4-5h
