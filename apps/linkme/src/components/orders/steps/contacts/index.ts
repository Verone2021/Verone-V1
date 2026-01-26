/**
 * Contacts sub-components index
 *
 * @module contacts
 * @since 2026-01-20 (V2: BillingAddressSection remplace BillingOrgSection)
 */

// Selection components - Contacts (petites cartes)
export { ContactCard } from './ContactCard';
export { ContactGrid } from './ContactGrid';

// Selection components - Addresses (V2 - petites cartes)
export { AddressCard } from './AddressCard';
export { AddressGrid } from './AddressGrid';

// Existing components
export { ContactSelector } from './ContactSelector';
export { AddressForm } from './AddressForm';

// Section components (V2)
export {
  BillingAddressSection,
  type BillingAddressData,
  type BillingAddressMode,
} from './BillingAddressSection';
export { DeliverySection } from './DeliverySection';

// Legacy (deprecated - kept for reference, do not use)
// export { BillingOrgSection, type BillingOrgData } from './BillingOrgSection.legacy';
// export { OrganisationCard, type BillingOrganisation } from './OrganisationCard.legacy';
// export { OrganisationGrid } from './OrganisationGrid.legacy';
// export { BillingSection } from './BillingSection.legacy';
