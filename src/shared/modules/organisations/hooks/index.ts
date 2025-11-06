export { useContacts, type Contact } from './use-contacts';
export { useOrganisationTabCounts } from './use-organisation-tab-counts';
export { useOrganisations, useOrganisation, useCustomers, useSuppliers } from './use-organisations';

// Re-export organisation utility functions
export {
  getOrganisationDisplayName,
  getOrganisationLegalName,
  getOrganisationTradeName
} from '@/lib/utils/organisation-helpers';

// Re-export types
export type { Organisation } from './use-organisations';
