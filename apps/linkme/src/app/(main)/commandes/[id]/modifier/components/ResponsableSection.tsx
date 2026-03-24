'use client';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Card,
  Input,
  Label,
  cn,
} from '@verone/ui';
import { Plus, User } from 'lucide-react';

import { ContactCard } from '../../../../../../components/orders/steps/contacts/ContactCard';
import type { OrganisationContact } from '../../../../../../lib/hooks/use-organisation-contacts';
import type { ContactFormData } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface ResponsableSectionProps {
  resolvedResponsable: { name: string; email: string; phone: string };
  allContacts: OrganisationContact[];
  selectedResponsableId: string | null;
  showResponsableForm: boolean;
  responsableForm: ContactFormData;
  onSelectResponsable: (contactId: string) => void;
  onNewResponsable: () => void;
  onResponsableFormChange: (form: ContactFormData) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ResponsableSection({
  resolvedResponsable,
  allContacts,
  selectedResponsableId,
  showResponsableForm,
  responsableForm,
  onSelectResponsable,
  onNewResponsable,
  onResponsableFormChange,
}: ResponsableSectionProps) {
  return (
    <AccordionItem
      value="responsable"
      className="bg-white rounded-xl border shadow-sm"
    >
      <AccordionTrigger className="px-6 py-4 hover:no-underline">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-semibold text-[#183559]">
              Contact responsable
            </h2>
            <p className="text-sm text-gray-500">
              {resolvedResponsable.name || 'Non renseigne'}
              {resolvedResponsable.email
                ? ` | ${resolvedResponsable.email}`
                : ''}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6">
        <div className="space-y-4">
          {/* Contact cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allContacts.map(contact => (
              <ContactCard
                key={contact.id}
                contact={contact}
                isSelected={selectedResponsableId === contact.id}
                onClick={() => onSelectResponsable(contact.id)}
              />
            ))}

            {/* Create new card */}
            <Card
              className={cn(
                'p-3 cursor-pointer transition-all hover:shadow-md border-dashed',
                showResponsableForm
                  ? 'border-2 border-blue-500 bg-blue-50/50'
                  : 'hover:border-gray-400'
              )}
              onClick={onNewResponsable}
            >
              <div className="flex items-center justify-center gap-2 h-full min-h-[60px]">
                <Plus
                  className={cn(
                    'h-5 w-5',
                    showResponsableForm ? 'text-blue-500' : 'text-gray-400'
                  )}
                />
                <span
                  className={cn(
                    'font-medium text-sm',
                    showResponsableForm ? 'text-blue-600' : 'text-gray-600'
                  )}
                >
                  Nouveau contact
                </span>
              </div>
            </Card>
          </div>

          {/* Inline form for new contact */}
          {showResponsableForm && (
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Prenom *</Label>
                  <Input
                    value={responsableForm.firstName}
                    onChange={e =>
                      onResponsableFormChange({
                        ...responsableForm,
                        firstName: e.target.value,
                      })
                    }
                    placeholder="Jean"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nom *</Label>
                  <Input
                    value={responsableForm.lastName}
                    onChange={e =>
                      onResponsableFormChange({
                        ...responsableForm,
                        lastName: e.target.value,
                      })
                    }
                    placeholder="Dupont"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email *</Label>
                  <Input
                    type="email"
                    value={responsableForm.email}
                    onChange={e =>
                      onResponsableFormChange({
                        ...responsableForm,
                        email: e.target.value,
                      })
                    }
                    placeholder="jean@restaurant.fr"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Telephone</Label>
                  <Input
                    type="tel"
                    value={responsableForm.phone}
                    onChange={e =>
                      onResponsableFormChange({
                        ...responsableForm,
                        phone: e.target.value,
                      })
                    }
                    placeholder="06 12 34 56 78"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Poste</Label>
                  <Input
                    value={responsableForm.title}
                    onChange={e =>
                      onResponsableFormChange({
                        ...responsableForm,
                        title: e.target.value,
                      })
                    }
                    placeholder="Gerant"
                    className="h-9"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
