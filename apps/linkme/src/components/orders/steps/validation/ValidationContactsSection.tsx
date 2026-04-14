'use client';

/**
 * ValidationContactsSection - Section contacts dans la validation commande
 *
 * @module ValidationContactsSection
 * @since 2026-04-14
 */

import { FileText, Truck, User, Users } from 'lucide-react';

import type { OrderFormData } from '../../schemas/order-form.schema';
import { ValidationSectionWrapper } from './ValidationSectionWrapper';

interface ValidationContactsSectionProps {
  formData: OrderFormData;
  isOpen: boolean;
  onToggle: () => void;
}

export function ValidationContactsSection({
  formData,
  isOpen,
  onToggle,
}: ValidationContactsSectionProps) {
  const responsableName = formData.contacts.responsable.firstName
    ? `${formData.contacts.responsable.firstName} ${formData.contacts.responsable.lastName}`
    : 'Non renseigné';

  return (
    <ValidationSectionWrapper
      sectionKey="contacts"
      title="Contacts"
      subtitle={responsableName}
      icon={Users}
      iconBgClass="bg-amber-100"
      iconColorClass="text-amber-600"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        {/* Responsable */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <User className="h-4 w-4" />
            Responsable
          </div>
          {formData.contacts.responsable.firstName ? (
            <p className="text-sm text-gray-600 ml-6">
              {formData.contacts.responsable.firstName}{' '}
              {formData.contacts.responsable.lastName}
              <br />
              {formData.contacts.responsable.email}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic ml-6">
              Non renseigné — à compléter ultérieurement
            </p>
          )}
        </div>

        {/* Facturation */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <FileText className="h-4 w-4" />
            Facturation
          </div>
          {formData.contacts.billingContact?.mode === 'same_as_responsable' ? (
            <p className="text-sm text-gray-600 ml-6">
              {formData.contacts.responsable.firstName
                ? 'Même contact que responsable'
                : 'Non renseigné'}
            </p>
          ) : formData.contacts.billingContact?.contact?.firstName ? (
            <p className="text-sm text-gray-600 ml-6">
              {formData.contacts.billingContact.contact.firstName}{' '}
              {formData.contacts.billingContact.contact.lastName}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic ml-6">
              Non renseigné — à compléter ultérieurement
            </p>
          )}
        </div>

        {/* Livraison */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <Truck className="h-4 w-4" />
            Livraison
          </div>
          {formData.contacts.delivery.sameAsResponsable ? (
            <p className="text-sm text-gray-600 ml-6">
              {formData.contacts.responsable.firstName
                ? 'Même contact que responsable'
                : 'Non renseigné'}
            </p>
          ) : formData.contacts.delivery.contact?.firstName ? (
            <p className="text-sm text-gray-600 ml-6">
              {formData.contacts.delivery.contact.firstName}{' '}
              {formData.contacts.delivery.contact.lastName}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic ml-6">
              Non renseigné — à compléter ultérieurement
            </p>
          )}
        </div>
      </div>
    </ValidationSectionWrapper>
  );
}
