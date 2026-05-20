'use client';

/**
 * Page Profil — Facturation
 *
 * Permet à l'affilié LinkMe de gérer :
 * - Ses infos légales (raison sociale, SIRET, n° TVA, adresse de facturation)
 * - Son compte bancaire principal (IBAN, BIC, nom de la banque)
 * - Liste de ses demandes de paiement (lien vers la page demandes pour dépôt facture)
 *
 * Mobile-first (LinkMe = majoritairement mobile).
 *
 * @since 2026-05-19 [BO-LINKME-PR-003]
 */

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle,
  CreditCard,
  FileText,
  Loader2,
  MapPin,
  Save,
} from 'lucide-react';

import { useAuth } from '../../../../contexts/AuthContext';
import {
  useAffiliateBilling,
  useUpdateAffiliateBilling,
} from '../../../../lib/hooks/use-affiliate-billing';
import { useAffiliatePaymentRequests } from '../../../../lib/hooks/use-payment-requests';

interface BillingFormState {
  legalName: string;
  siret: string;
  vatNumber: string;
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingPostalCode: string;
  billingCity: string;
  billingCountry: string;
  iban: string;
  bic: string;
  bankName: string;
  accountHolderName: string;
}

const EMPTY_FORM: BillingFormState = {
  legalName: '',
  siret: '',
  vatNumber: '',
  billingAddressLine1: '',
  billingAddressLine2: '',
  billingPostalCode: '',
  billingCity: '',
  billingCountry: 'FR',
  iban: '',
  bic: '',
  bankName: '',
  accountHolderName: '',
};

function formatAmountEUR(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export default function FacturationPage(): JSX.Element | null {
  const router = useRouter();
  const { user, linkMeRole, initializing } = useAuth();

  const {
    data: billing,
    isLoading: billingLoading,
    isError: billingError,
  } = useAffiliateBilling();

  const { data: requests = [] } = useAffiliatePaymentRequests();
  const updateMutation = useUpdateAffiliateBilling();

  const [form, setForm] = useState<BillingFormState>(EMPTY_FORM);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!initializing && !user) {
      router.push('/login');
    }
  }, [initializing, user, router]);

  useEffect(() => {
    if (billing) {
      setForm({
        legalName: billing.legalName ?? '',
        siret: billing.siret ?? '',
        vatNumber: billing.vatNumber ?? '',
        billingAddressLine1: billing.billingAddressLine1 ?? '',
        billingAddressLine2: billing.billingAddressLine2 ?? '',
        billingPostalCode: billing.billingPostalCode ?? '',
        billingCity: billing.billingCity ?? '',
        billingCountry: billing.billingCountry ?? 'FR',
        iban: billing.bankAccount?.iban ?? '',
        bic: billing.bankAccount?.bic ?? '',
        bankName: billing.bankAccount?.bankName ?? '',
        accountHolderName: billing.bankAccount?.accountHolderName ?? '',
      });
    }
  }, [billing]);

  useEffect(() => {
    if (updateMutation.isSuccess) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [updateMutation.isSuccess]);

  if (initializing || !user || !linkMeRole) {
    return null;
  }

  const setField = <K extends keyof BillingFormState>(
    key: K,
    value: BillingFormState[K]
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!billing?.organisationId) return;
    if (!form.legalName.trim()) return;

    updateMutation.mutate({
      organisationId: billing.organisationId,
      legalName: form.legalName.trim(),
      siret: form.siret.trim() || null,
      vatNumber: form.vatNumber.trim() || null,
      billingAddressLine1: form.billingAddressLine1.trim() || null,
      billingAddressLine2: form.billingAddressLine2.trim() || null,
      billingPostalCode: form.billingPostalCode.trim() || null,
      billingCity: form.billingCity.trim() || null,
      billingCountry: form.billingCountry || 'FR',
      iban: form.iban.trim() || null,
      bic: form.bic.trim() || null,
      bankName: form.bankName.trim() || null,
      accountHolderName: form.accountHolderName.trim() || null,
    });
  };

  const noOrganisation = !billingLoading && !billing;
  const isSaving = updateMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-10">
        <Link
          href="/profil"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au profil
        </Link>

        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
            Facturation
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Tes informations légales servent à Verone pour t&apos;envoyer tes
            paiements et émettre tes factures.
          </p>
        </header>

        {billingLoading && (
          <div className="flex items-center justify-center rounded-lg border bg-white p-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}

        {billingError && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <p>
              Erreur lors du chargement de tes informations. Réessaie dans
              quelques instants ou contacte le support.
            </p>
          </div>
        )}

        {noOrganisation && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <p>
              Ton compte n&apos;est pas encore rattaché à une organisation de
              facturation. Contacte ton interlocuteur Verone pour finaliser ton
              dossier — tu pourras ensuite déposer tes factures.
            </p>
          </div>
        )}

        {billing && (
          <>
            {showSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <CheckCircle className="h-5 w-5" />
                Informations enregistrées.
              </div>
            )}

            <section className="mb-6 rounded-lg border bg-white p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Informations légales
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Raison sociale *
                  </label>
                  <input
                    type="text"
                    value={form.legalName}
                    onChange={e => setField('legalName', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ex: POKAWA SAS"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      SIRET
                    </label>
                    <input
                      type="text"
                      value={form.siret}
                      onChange={e => setField('siret', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="14 chiffres"
                      maxLength={14}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      N° TVA intracommunautaire
                    </label>
                    <input
                      type="text"
                      value={form.vatNumber}
                      onChange={e => setField('vatNumber', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="FR12345678901"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-6 rounded-lg border bg-white p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Adresse de facturation
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={form.billingAddressLine1}
                    onChange={e =>
                      setField('billingAddressLine1', e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="N° et rue"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Complément
                  </label>
                  <input
                    type="text"
                    value={form.billingAddressLine2}
                    onChange={e =>
                      setField('billingAddressLine2', e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Bât., étage, etc."
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Code postal
                    </label>
                    <input
                      type="text"
                      value={form.billingPostalCode}
                      onChange={e =>
                        setField('billingPostalCode', e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="75001"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Ville
                    </label>
                    <input
                      type="text"
                      value={form.billingCity}
                      onChange={e => setField('billingCity', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Paris"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Pays
                  </label>
                  <select
                    value={form.billingCountry}
                    onChange={e => setField('billingCountry', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="FR">France</option>
                    <option value="BE">Belgique</option>
                    <option value="CH">Suisse</option>
                    <option value="LU">Luxembourg</option>
                    <option value="DE">Allemagne</option>
                    <option value="IT">Italie</option>
                    <option value="ES">Espagne</option>
                    <option value="NL">Pays-Bas</option>
                    <option value="PT">Portugal</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="mb-6 rounded-lg border bg-white p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Coordonnées bancaires
                </h2>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                Verone t&apos;envoie tes paiements de commissions sur ce compte.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Titulaire du compte
                  </label>
                  <input
                    type="text"
                    value={form.accountHolderName}
                    onChange={e =>
                      setField('accountHolderName', e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Nom apparaissant sur le RIB"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    IBAN
                  </label>
                  <input
                    type="text"
                    value={form.iban}
                    onChange={e => setField('iban', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="FR76 0000 0000 0000 0000 0000 000"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      BIC
                    </label>
                    <input
                      type="text"
                      value={form.bic}
                      onChange={e => setField('bic', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="BNPAFRPP"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Banque
                    </label>
                    <input
                      type="text"
                      value={form.bankName}
                      onChange={e => setField('bankName', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="BNP Paribas"
                    />
                  </div>
                </div>
              </div>
            </section>

            {updateMutation.isError && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">
                    Erreur lors de l&apos;enregistrement.
                  </p>
                  <p className="mt-1 text-xs">
                    {updateMutation.error instanceof Error
                      ? updateMutation.error.message
                      : 'Réessaie dans quelques instants.'}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !form.legalName.trim()}
              className="mb-8 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:w-auto"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer mes informations
            </button>

            <section className="rounded-lg border bg-white p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Mes demandes de paiement
                </h2>
              </div>

              {requests.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Aucune demande pour le moment. Une fois tes commissions
                  validées, tu pourras créer une demande de paiement depuis la
                  page{' '}
                  <Link
                    href="/commissions"
                    className="text-blue-600 hover:underline"
                  >
                    Commissions
                  </Link>
                  .
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {requests.slice(0, 10).map(req => (
                    <li
                      key={req.id}
                      className="flex flex-col gap-1 py-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {req.requestNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          Créée le {formatDate(req.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatAmountEUR(req.totalAmountTTC)}
                        </span>
                        <Link
                          href={`/commissions/demandes`}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Voir
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href="/commissions/demandes"
                className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                Toutes mes demandes →
              </Link>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
