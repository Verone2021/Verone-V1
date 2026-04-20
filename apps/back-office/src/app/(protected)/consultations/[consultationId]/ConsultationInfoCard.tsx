'use client';

import type { ClientConsultation } from '@verone/consultations';
import { ConsultationImageGallery } from '@verone/consultations';
import { createClient } from '@verone/utils/supabase/client';
import { Calendar, User } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ConsultationInfoCardProps {
  consultation: ClientConsultation;
  consultationId: string;
  clientName: string;
}

export function ConsultationInfoCard({
  consultation,
  consultationId,
  clientName,
}: ConsultationInfoCardProps) {
  const [assignedUserName, setAssignedUserName] = useState<string | null>(null);

  useEffect(() => {
    if (!consultation.assigned_to) return;
    const supabase = createClient();
    void supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('user_id', consultation.assigned_to)
      .single()
      .then(({ data }) => {
        if (data) {
          setAssignedUserName(
            `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim()
          );
        }
      });
  }, [consultation.assigned_to]);

  return (
    <div className="space-y-3">
      {/* Card Photos */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-bold text-zinc-900">
            Photos de référence
          </h4>
        </div>
        <ConsultationImageGallery
          consultationId={consultationId}
          consultationTitle={clientName}
          consultationStatus={consultation.status}
          allowEdit
          className="w-full"
        />
      </div>

      {/* Card Client Info */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100">
        <h4 className="text-xs font-bold text-zinc-900 mb-3">
          Informations client
        </h4>
        <div className="grid grid-cols-2 gap-y-3 gap-x-2">
          <div>
            <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
              Client
            </p>
            <p className="text-xs font-semibold text-zinc-900 truncate">
              {clientName}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
              Email
            </p>
            <p
              className="text-xs font-semibold text-zinc-900 truncate"
              title={consultation.client_email}
            >
              {consultation.client_email}
            </p>
          </div>
          {consultation.client_phone && (
            <div>
              <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
                Téléphone
              </p>
              <p className="text-xs font-semibold text-zinc-900">
                {consultation.client_phone}
              </p>
            </div>
          )}
          <div>
            <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
              Canal
            </p>
            <p className="text-xs font-semibold text-zinc-900 capitalize">
              {consultation.source_channel}
            </p>
          </div>
          {consultation.tarif_maximum && (
            <div>
              <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
                Budget max
              </p>
              <p className="text-xs font-semibold text-zinc-900">
                {consultation.tarif_maximum}€
              </p>
            </div>
          )}
          <div>
            <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
              Créée le
            </p>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-zinc-400 flex-shrink-0" />
              <p className="text-xs font-semibold text-zinc-900">
                {new Date(consultation.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          {consultation.estimated_response_date && (
            <div>
              <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
                Réponse estimée
              </p>
              <p className="text-xs font-semibold text-zinc-900">
                {new Date(
                  consultation.estimated_response_date
                ).toLocaleDateString('fr-FR')}
              </p>
            </div>
          )}
          {consultation.assigned_to && (
            <div>
              <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
                Assignée à
              </p>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-zinc-400 flex-shrink-0" />
                <p className="text-xs font-semibold text-zinc-900 truncate">
                  {assignedUserName ?? consultation.assigned_to}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Description */}
      {consultation.descriptif && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100">
          <h4 className="text-xs font-bold text-zinc-900 mb-2">Description</h4>
          <div className="max-h-24 overflow-y-auto text-xs text-zinc-500 leading-tight [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {consultation.descriptif}
          </div>
        </div>
      )}

      {/* Notes internes */}
      {consultation.notes_internes && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100 border-l-4 border-l-amber-300">
          <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            Notes internes
          </h4>
          <p className="text-xs text-zinc-600 leading-tight">
            {consultation.notes_internes}
          </p>
        </div>
      )}
    </div>
  );
}
