'use client';

/**
 * Formulaire de contact unifié - LinkMe
 *
 * Un seul formulaire pour toutes les demandes entrantes (créateur, pro,
 * enseigne, fournisseur). Champ conditionnel « mode logistique » si fournisseur.
 * À la soumission : POST /api/contact/unified (email Resend + WhatsApp).
 * Page de confirmation (ContactConfirmation) avec lien Calendly adapté.
 *
 * Le type de profil peut être présélectionné via le query param `?type=`.
 *
 * @module ContactForm
 * @since 2026-01-23
 * @updated 2026-06-05 - LINKME-CONTACT-001 : formulaire unifié + Calendly.
 */

import { useEffect, useRef, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { Send, AlertCircle, Clock } from 'lucide-react';

import { ContactConfirmation } from './ContactConfirmation';
import {
  INITIAL_FORM,
  PROFILE_OPTIONS,
  LOGISTICS_OPTIONS,
  normalizeType,
  type FormStatus,
  type IFormData,
  type ProfileType,
} from './contact-form.constants';

const INPUT_CLASS =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5DBEBB]/50 focus:border-[#5DBEBB] transition-colors';

export function ContactForm(): JSX.Element {
  const searchParams = useSearchParams();
  const initialType = normalizeType(searchParams.get('type'));

  const [form, setForm] = useState<IFormData>({
    ...INITIAL_FORM,
    profileType: initialType,
  });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [submittedType, setSubmittedType] = useState<ProfileType | null>(null);
  const [calendlyUrl, setCalendlyUrl] = useState<string | null>(null);

  // Anti-spam : champ piège invisible + horodatage d'affichage du formulaire.
  // L'horodatage est posé au montage (et non au rendu) car la page est
  // prérendue statiquement : une valeur calculée au build serait figée.
  const [trapValue, setTrapValue] = useState('');
  const formLoadedAtRef = useRef(0);

  useEffect(() => {
    formLoadedAtRef.current = Date.now();
  }, []);

  // Champ fautif quand la soumission est bloquée côté navigateur.
  const [fieldError, setFieldError] = useState<
    'profileType' | 'logisticsMode' | null
  >(null);

  // La page est prérendue statiquement : au premier rendu client, le paramètre
  // `?type=` de l'URL n'est pas encore connu de l'état initial. On l'applique
  // après montage, sans écraser un choix déjà fait par le visiteur.
  useEffect(() => {
    if (!initialType) return;
    setForm(prev =>
      prev.profileType ? prev : { ...prev, profileType: initialType }
    );
  }, [initialType]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setFieldError(null);

    if (!form.profileType) {
      setFieldError('profileType');
      setStatus('error');
      return;
    }
    if (form.profileType === 'fournisseur' && !form.logisticsMode) {
      setFieldError('logisticsMode');
      setStatus('error');
      return;
    }
    setStatus('loading');

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        profileType: form.profileType,
        logisticsMode:
          form.profileType === 'fournisseur' && form.logisticsMode
            ? form.logisticsMode
            : undefined,
        message: form.message || undefined,
        company: trapValue || undefined,
        formLoadedAt: formLoadedAtRef.current || undefined,
      };

      const response = await fetch('/api/contact/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Erreur lors de l’envoi');

      const result = (await response.json()) as { calendlyUrl?: string | null };
      setSubmittedType(form.profileType);
      setCalendlyUrl(result.calendlyUrl ?? null);
      setStatus('success');
      setForm({ ...INITIAL_FORM, profileType: form.profileType });
    } catch (error) {
      console.error('[ContactForm] envoi échoué:', error);
      setStatus('error');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (status === 'success') {
    return (
      <ContactConfirmation
        submittedType={submittedType}
        calendlyUrl={calendlyUrl}
        onReset={() => {
          setStatus('idle');
          setSubmittedType(null);
          setCalendlyUrl(null);
        }}
      />
    );
  }

  return (
    <div className="py-16 lg:py-24 bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 lg:mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#183559] mb-4">
            Parlons de{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] to-[#7E84C0] bg-clip-text text-transparent">
              votre projet
            </span>
          </h1>
          <p className="text-lg text-[#183559]/60 max-w-2xl mx-auto">
            Un seul formulaire pour toutes les demandes. Dites-nous qui vous
            êtes — on vous oriente vers le bon interlocuteur.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-[#5DBEBB] font-medium">
            <Clock className="h-4 w-4" />
            Réponse sous 24h (jours ouvrés)
          </p>
        </div>

        <form
          onSubmit={e => void handleSubmit(e)}
          className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100"
        >
          {status === 'error' && fieldError === null && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 text-sm">
                  L&apos;envoi n&apos;a pas abouti
                </p>
                <p className="text-sm text-red-700">
                  Votre demande n&apos;a pas pu être transmise. Réessayez dans
                  un instant, ou écrivez-nous à contact@linkme.network.
                </p>
              </div>
            </div>
          )}

          {/* Champ piège anti-spam : invisible et inaccessible aux humains,
              rempli par les robots qui parcourent le DOM. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0">
            <label htmlFor="company">Société (ne pas remplir)</label>
            <input
              type="text"
              id="company"
              name="company"
              value={trapValue}
              onChange={e => setTrapValue(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* Type de profil */}
          <fieldset className="mb-6">
            <legend className="block text-sm font-medium text-[#183559] mb-3">
              Je suis… *
            </legend>
            <div className="grid sm:grid-cols-2 gap-3">
              {PROFILE_OPTIONS.map(opt => {
                const selected = form.profileType === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                      selected
                        ? 'border-[#5DBEBB] bg-[#5DBEBB]/5 ring-1 ring-[#5DBEBB]/40'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="profileType"
                      value={opt.value}
                      checked={selected}
                      onChange={() =>
                        setForm(prev => ({
                          ...prev,
                          profileType: opt.value,
                          logisticsMode:
                            opt.value === 'fournisseur'
                              ? prev.logisticsMode
                              : '',
                        }))
                      }
                      className="mt-1 h-4 w-4 accent-[#5DBEBB]"
                      required
                    />
                    <span>
                      <span className="block text-sm font-semibold text-[#183559]">
                        {opt.title}
                      </span>
                      <span className="block text-xs text-[#183559]/60">
                        {opt.hint}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {fieldError === 'profileType' && (
              <p className="mt-2 flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                Choisissez le profil qui vous correspond pour continuer.
              </p>
            )}
          </fieldset>

          {/* Mode logistique (conditionnel fournisseur) */}
          {form.profileType === 'fournisseur' && (
            <fieldset className="mb-6 rounded-xl bg-gray-50/70 border border-gray-100 p-4">
              <legend className="px-2 text-sm font-medium text-[#183559]">
                Mode logistique *
              </legend>
              <div className="space-y-2 mt-1">
                {LOGISTICS_OPTIONS.map(opt => {
                  const selected = form.logisticsMode === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        selected
                          ? 'border-[#5DBEBB] bg-white'
                          : 'border-transparent hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="logisticsMode"
                        value={opt.value}
                        checked={selected}
                        onChange={() =>
                          setForm(prev => ({
                            ...prev,
                            logisticsMode: opt.value,
                          }))
                        }
                        className="mt-0.5 h-4 w-4 accent-[#5DBEBB]"
                        required
                      />
                      <span className="text-sm text-[#183559]/80">
                        {opt.label}
                      </span>
                    </label>
                  );
                })}
              </div>
              {fieldError === 'logisticsMode' && (
                <p className="mt-2 flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  Précisez comment vous gérez la logistique.
                </p>
              )}
            </fieldset>
          )}

          {/* Identité */}
          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-[#183559] mb-2"
              >
                Prénom *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                className={INPUT_CLASS}
                placeholder="Jean"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-[#183559] mb-2"
              >
                Nom *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                className={INPUT_CLASS}
                placeholder="Dupont"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#183559] mb-2"
              >
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className={INPUT_CLASS}
                placeholder="jean@entreprise.com"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-[#183559] mb-2"
              >
                Téléphone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={INPUT_CLASS}
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="message"
              className="block text-sm font-medium text-[#183559] mb-2"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={5}
              className={`${INPUT_CLASS} resize-none`}
              placeholder="Parlez-nous de votre projet (optionnel)…"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/90 text-white font-semibold rounded-xl hover:from-[#4CA9A6] hover:to-[#4CA9A6]/90 transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {status === 'loading' ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Envoi en cours…
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Envoyer ma demande
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
