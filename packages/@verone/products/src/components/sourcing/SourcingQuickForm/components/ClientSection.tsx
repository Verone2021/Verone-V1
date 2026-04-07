'use client';

import { useToast } from '@verone/common/hooks';
import { X, Link } from 'lucide-react';

import { ClientOrEnseigneSelector } from '../../ClientOrEnseigneSelector';
import { ConsultationSuggestions } from '../../consultation-suggestions';
import type { ProductFormData } from '../types';

interface ClientSectionProps {
  formData: ProductFormData;
  linkedConsultationId: string | null;
  onFieldChange: (updates: Partial<ProductFormData>) => void;
  onLinkedConsultationChange: (id: string | null) => void;
}

export function ClientSection({
  formData,
  linkedConsultationId,
  onFieldChange,
  onLinkedConsultationChange,
}: ClientSectionProps) {
  const { toast } = useToast();

  return (
    <>
      {/* Client destinataire */}
      <div className="space-y-2">
        <ClientOrEnseigneSelector
          enseigneId={formData.enseigne_id ?? null}
          organisationId={formData.assigned_client_id ?? null}
          onEnseigneChange={(enseigneId, _enseigneName, parentOrgId) => {
            onFieldChange({
              enseigne_id: enseigneId ?? '',
              assigned_client_id: parentOrgId ?? '',
            });
          }}
          onOrganisationChange={(organisationId, _organisationName) => {
            onFieldChange({
              assigned_client_id: organisationId ?? '',
              enseigne_id: '',
            });
          }}
          label="Client destinataire (facultatif)"
          required={false}
        />
        <p className="text-xs text-gray-500">
          <strong>Sourcing interne :</strong> Catalogue général (sans client
          assigné)
          <br />
          <strong>Sourcing client :</strong> Pour un client spécifique (enseigne
          ou organisation)
        </p>
      </div>

      {/* Suggestions de consultations si client assigné */}
      {formData.assigned_client_id && (
        <>
          {linkedConsultationId && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Link className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800 font-medium">
                Sera associé à une consultation
              </span>
              <button
                type="button"
                onClick={() => onLinkedConsultationChange(null)}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <ConsultationSuggestions
            clientId={formData.assigned_client_id}
            onLinkToConsultation={consultationId => {
              onLinkedConsultationChange(consultationId);
              toast({
                title: 'Consultation sélectionnée',
                description:
                  'Le produit sera associé à cette consultation après création',
              });
            }}
            className="bg-blue-50 border-blue-200"
          />
        </>
      )}
    </>
  );
}
