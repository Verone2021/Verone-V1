export { useContacts, type Contact } from './use-contacts';
export { useOrganisationTabCounts } from './use-organisation-tab-counts';
export {
  useOrganisations,
  useOrganisation,
  useCustomers,
  useSuppliers,
  type Organisation,
  type CreateOrganisationData,
  type UpdateOrganisationData,
} from './use-organisations';

// Re-export organisation utility functions
export {
  getOrganisationDisplayName,
  getOrganisationLegalName,
  getOrganisationTradeName,
} from '@/lib/utils/organisation-helpers';
