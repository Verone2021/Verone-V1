/**
 * Contacts & Addresses Components - Back-office LinkMe
 *
 * Exports all components for Step 5 (Contacts & Addresses)
 *
 * @module linkme-contacts
 * @since 2026-01-20
 */

export { ContactCardBO, CreateNewContactCard } from './ContactCardBO';
export {
  OrganisationAddressCard,
  EnseigneParentCard,
  CreateNewAddressCard,
} from './OrganisationAddressCard';
export { NewContactForm, type NewContactFormData } from './NewContactForm';
export { NewAddressForm, type NewAddressFormData } from './NewAddressForm';
export {
  ContactsAddressesSection,
  type ContactsAddressesData,
  type SelectedContact,
  type SelectedAddress,
} from './ContactsAddressesSection';
