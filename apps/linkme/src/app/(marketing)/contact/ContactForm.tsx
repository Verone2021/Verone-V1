'use client';

/**
 * Composant formulaire de contact - LinkMe
 *
 * @module ContactForm
 * @since 2026-01-23
 */

import { useState } from 'react';

import { Mail, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

interface IFormData {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
}

const INITIAL_FORM: IFormData = {
  name: '',
  email: '',
  company: '',
  subject: '',
  message: '',
};

const SUBJECTS = [
  'Devenir affilié',
  'Partenariat enseigne',
  'Question sur la plateforme',
  'Support technique',
  'Autre',
];

export function ContactForm(): JSX.Element {
  const [form, setForm] = useState<IFormData>(INITIAL_FORM);
  const [status, setStatus] = useState<FormStatus>('idle');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/contact/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error('Erreur lors de l envoi');

      setStatus('success');
      setForm(INITIAL_FORM);
    } catch (error) {
      console.error('Erreur contact form:', error);
      setStatus('error');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ): void => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#183559] mb-4">
            Contactez-nous
          </h1>
          <p className="text-lg text-[#183559]/70 max-w-xl mx-auto">
            Une question ? Un projet ? Notre equipe est la pour vous
            accompagner.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-[#183559] to-[#183559]/90 text-white rounded-2xl p-8">
              <h2 className="text-xl font-semibold mb-6">Nos coordonnees</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Email</p>
                    <a
                      href="mailto:contact@verone.io"
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      contact@verone.io
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Adresse</p>
                    <p className="text-white/70">France</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="font-medium mb-3">Heures d&apos;ouverture</h3>
                <p className="text-white/70 text-sm">
                  Lundi - Vendredi: 9h - 18h
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            {status === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Message envoye !
                </h3>
                <p className="text-green-700">
                  Nous avons bien recu votre message et vous repondrons dans les
                  plus brefs delais.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-6 text-green-600 hover:text-green-800 font-medium"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form
                onSubmit={e => void handleSubmit(e)}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
              >
                {status === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">
                        Erreur lors de l&apos;envoi
                      </p>
                      <p className="text-sm text-red-700">
                        Veuillez reessayer ou nous contacter directement par
                        email.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-[#183559] mb-2"
                    >
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DBEBB]/50 focus:border-[#5DBEBB] transition-colors"
                      placeholder="Jean Dupont"
                    />
                  </div>
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DBEBB]/50 focus:border-[#5DBEBB] transition-colors"
                      placeholder="jean@entreprise.com"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-[#183559] mb-2"
                    >
                      Entreprise
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DBEBB]/50 focus:border-[#5DBEBB] transition-colors"
                      placeholder="Ma Societe"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-[#183559] mb-2"
                    >
                      Sujet *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DBEBB]/50 focus:border-[#5DBEBB] transition-colors bg-white"
                    >
                      <option value="">Selectionnez un sujet</option>
                      {SUBJECTS.map(subject => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-[#183559] mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DBEBB]/50 focus:border-[#5DBEBB] transition-colors resize-none"
                    placeholder="Decrivez votre projet ou votre question..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#5DBEBB] text-white font-semibold rounded-lg hover:bg-[#4CA9A6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Envoyer le message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
