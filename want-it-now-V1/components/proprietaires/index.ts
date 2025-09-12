// ==============================================================================
// PROPRIETAIRES COMPONENTS BARREL EXPORT
// ==============================================================================

// Main Components
export { ProprietaireForm } from './proprietaire-form'
export { ProprietaireCard, ProprietaireCardCompact, ProprietaireCardMinimal } from './proprietaire-card'
export { ProprietaireSelector } from './proprietaire-selector'

// Associés Components
export { AssociesList, AssociesListCompact, AssociesListReadOnly } from './associes-list'

// UI Components
export { ProprietairesFilters, ProprietairesFiltersCompact, ProprietairesFiltersMinimal } from './proprietaires-filters'
export { ProprietairesStats, ProprietairesStatsCompact, ProprietairesStatsDetailed } from './proprietaires-stats'

// Hooks
export {
  useProprietaires,
  useProprietaireSearch,
  useActiveProprietaires,
  useCompletedProprietaires,
  usePersonnesPhysiques,
  usePersonnesMorales,
} from '../../hooks/use-proprietaires'

// Types (re-export for convenience)
export type {
  Proprietaire,
  Associe,
  CreateProprietaire,
  UpdateProprietaire,
  CreateAssocie,
  UpdateAssocie,
  ProprietaireType,
  FormeJuridique,
} from '../../lib/validations/proprietaires'