'use client';

/**
 * Page de confirmation après soumission du formulaire de contact unifié.
 * Affiche le lien Calendly adapté au type de profil (ou un fallback).
 *
 * @module contact/ContactConfirmation
 * @since 2026-06-05 - LINKME-CONTACT-001
 */

import { CheckCircle2, CalendarCheck, ArrowRight } from 'lucide-react';

import {
  CALENDLY_CTA_LABELS,
  type ProfileType,
} from './contact-form.constants';

interface IContactConfirmationProps {
  submittedType: ProfileType | null;
  calendlyUrl: string | null;
  onReset: () => void;
}

export function ContactConfirmation({
  submittedType,
  calendlyUrl,
  onReset,
}: IContactConfirmationProps): JSX.Element {
  const ctaLabel = submittedType
    ? CALENDLY_CTA_LABELS[submittedType]
    : 'Réserver un créneau';

  return (
    <div className="py-16 lg:py-24 bg-gray-50/50">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-6 lg:p-10 border border-green-200 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#183559] mb-2">
            Demande bien reçue !
          </h1>
          <p className="text-[#183559]/70 mb-8">
            On revient vers toi sous 24h. Tu peux aussi réserver directement un
            créneau pour qu’on en discute.
          </p>

          {calendlyUrl ? (
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/90 text-white font-semibold rounded-xl hover:from-[#4CA9A6] hover:to-[#4CA9A6]/90 transition-all shadow-lg hover:shadow-xl"
            >
              <CalendarCheck className="h-5 w-5" />
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <p className="text-sm text-[#183559]/50">
              On te recontacte très vite par email.
            </p>
          )}

          <div className="mt-8">
            <button
              onClick={onReset}
              className="text-sm font-semibold text-[#5DBEBB] hover:text-[#4CA9A6]"
            >
              Envoyer une autre demande
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
