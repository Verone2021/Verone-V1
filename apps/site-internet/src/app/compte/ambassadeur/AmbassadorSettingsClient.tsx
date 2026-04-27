'use client';

import { useCallback, useState } from 'react';

import Link from 'next/link';

import { createClient } from '@/lib/supabase/client';

// ============================================
// CGU
// ============================================

const CGU_VERSION = '2026-04-12-v1';

const CGU_TEXT = `CONDITIONS DU PROGRAMME AMBASSADEUR VERONE

1. OBJET
Ce programme vous permet de partager un code promotionnel unique. Lorsqu'un client utilise votre code, vous recevez une prime promotionnelle calculée sur le montant HT de la commande.

2. PRIME PROMOTIONNELLE
- Le taux de votre prime est défini lors de la création de votre compte ambassadeur.
- La prime est calculée sur le montant HT de chaque commande validée avec votre code.
- Les primes sont en statut "en attente" pendant 30 jours après la commande (délai de retour).
- Après 30 jours sans retour, la prime passe en statut "validée".

3. PAIEMENT
- Seuil minimum de retrait : 20 EUR (ou seuil personnalisé).
- Méthode : virement SEPA sur le compte bancaire renseigné dans votre profil.
- Les paiements sont effectués par l'équipe Vérone après validation.

4. OBLIGATIONS FISCALES
- En dessous de 305 EUR de primes par an : aucune déclaration nécessaire (art. 92 CGI).
- Au-dessus de 305 EUR/an : vous devez déclarer vos primes comme "revenus occasionnels".
- Si vos primes dépassent régulièrement 305 EUR/an, un numéro SIRET (auto-entrepreneur) sera requis.

5. DURÉE ET RÉSILIATION
- Le programme est valable sans limite de durée.
- Vérone peut désactiver votre compte ambassadeur à tout moment.
- Vous pouvez demander la désactivation à tout moment.

6. RESPONSABILITÉ
- Vous vous engagez à ne pas dénigrer la marque Vérone.
- Vous ne devez pas utiliser de méthodes trompeuses pour générer des ventes.`;

function CguModal({
  onAccept,
  onClose,
}: {
  onAccept: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-xl">
        <div className="p-6 border-b border-verone-gray-100">
          <h2 className="text-xl font-playfair font-semibold text-verone-black">
            Conditions du programme ambassadeur
          </h2>
          <p className="text-sm text-verone-gray-500 mt-1">
            Veuillez lire et accepter les conditions avant de continuer.
          </p>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <pre className="whitespace-pre-wrap text-sm text-verone-gray-700 font-sans leading-relaxed">
            {CGU_TEXT}
          </pre>
        </div>
        <div className="p-6 border-t border-verone-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-verone-gray-300 rounded-lg text-sm font-medium text-verone-gray-700 hover:bg-verone-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="px-6 py-2.5 bg-verone-black text-white rounded-lg text-sm font-medium hover:bg-verone-gray-800 transition-colors"
          >
            J&apos;accepte les conditions
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Toggle Switch (natif, design site-internet)
// ============================================

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-4 cursor-pointer">
      <div className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <div
          className={`h-6 w-11 rounded-full transition-colors ${
            checked ? 'bg-verone-black' : 'bg-verone-gray-200'
          }`}
        />
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-verone-black">{label}</p>
        {description && (
          <p className="text-xs text-verone-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

// ============================================
// Props
// ============================================

interface AmbassadorCode {
  id: string;
  code: string;
  qr_code_url: string | null;
  usage_count: number;
  is_active: boolean;
}

interface AmbassadorSettingsClientProps {
  customerId: string;
  isAmbassador: boolean;
  commissionRate: number;
  discountRate: number;
  iban: string;
  bic: string;
  bankName: string;
  accountHolderName: string;
  siret: string;
  siretRequired: boolean;
  notifyOnGain: boolean;
  payoutThreshold: number;
  cguAcceptedAt: string | null;
  cguVersion: string | null;
  codes: AmbassadorCode[];
  totalSalesGenerated: number;
  totalPrimesEarned: number;
  currentBalance: number;
}

// ============================================
// Mode A — Rejoindre le programme
// ============================================

function JoinSection({
  onActivate,
  isLoading,
}: {
  onActivate: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="border border-verone-gray-200 rounded-lg p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-4">
          <div className="text-3xl font-playfair font-bold text-verone-black mb-2">
            10%
          </div>
          <p className="text-sm text-verone-gray-600">
            de prime sur chaque vente générée
          </p>
        </div>
        <div className="text-center p-4">
          <div className="text-3xl font-playfair font-bold text-verone-black mb-2">
            10%
          </div>
          <p className="text-sm text-verone-gray-600">
            de réduction pour vos filleuls
          </p>
        </div>
        <div className="text-center p-4">
          <div className="text-3xl font-playfair font-bold text-verone-black mb-2">
            0€
          </div>
          <p className="text-sm text-verone-gray-600">
            sans minimum d&apos;engagement
          </p>
        </div>
      </div>

      <p className="text-sm text-verone-gray-600 leading-relaxed">
        En rejoignant le programme, vous recevrez un code promo unique à
        partager à vos proches. À chaque vente générée avec votre code, vous
        gagnez une prime virée sur votre compte bancaire.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onActivate}
          disabled={isLoading}
          className="px-6 py-2.5 bg-verone-black text-white rounded-lg text-sm font-medium hover:bg-verone-gray-800 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Activation...' : 'Devenir ambassadeur'}
        </button>
        <Link
          href="/ambassadeur"
          className="px-6 py-2.5 border border-verone-gray-300 rounded-lg text-sm font-medium text-verone-black hover:bg-verone-gray-50 transition-colors text-center"
        >
          En savoir plus
        </Link>
      </div>
    </div>
  );
}

// ============================================
// Mode B — Paramètres ambassadeur actif
// ============================================

interface ActiveSectionProps {
  customerId: string;
  commissionRate: number;
  discountRate: number;
  iban: string;
  bic: string;
  bankName: string;
  accountHolderName: string;
  siret: string;
  siretRequired: boolean;
  notifyOnGain: boolean;
  codes: AmbassadorCode[];
  totalSalesGenerated: number;
  totalPrimesEarned: number;
  currentBalance: number;
  onDeactivate: () => void;
  isDeactivating: boolean;
}

function ActiveSection({
  customerId,
  commissionRate,
  discountRate,
  iban,
  bic,
  bankName,
  accountHolderName,
  siret,
  siretRequired,
  notifyOnGain,
  codes,
  totalSalesGenerated,
  totalPrimesEarned,
  currentBalance,
  onDeactivate,
  isDeactivating,
}: ActiveSectionProps) {
  const [notify, setNotify] = useState(notifyOnGain);
  const [bankForm, setBankForm] = useState({
    iban,
    bic,
    bankName,
    accountHolderName,
    siret,
  });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(n);

  const inputClass =
    'w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm';

  const handleNotifyChange = useCallback(
    async (value: boolean) => {
      setNotify(value);
      const supabase = createClient();
      await supabase
        .from('individual_customers')
        .update({ ambassador_notify_on_gain: value } as never)
        .eq('id', customerId);
    },
    [customerId]
  );

  const handleBankSave = useCallback(async () => {
    setBankSaving(true);
    setBankSaved(false);
    const supabase = createClient();
    await supabase
      .from('individual_customers')
      .update({
        ambassador_iban: bankForm.iban || null,
        ambassador_bic: bankForm.bic || null,
        ambassador_bank_name: bankForm.bankName || null,
        ambassador_account_holder_name: bankForm.accountHolderName || null,
        ambassador_siret: bankForm.siret || null,
      } as never)
      .eq('id', customerId);
    setBankSaving(false);
    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 3000);
  }, [customerId, bankForm]);

  const mainCode = codes.find(c => c.is_active) ?? codes[0];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border border-verone-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-playfair font-bold text-verone-black">
            {fmt(totalSalesGenerated)}
          </div>
          <div className="text-xs text-verone-gray-500 mt-1">CA généré</div>
        </div>
        <div className="border border-verone-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-playfair font-bold text-green-700">
            {fmt(totalPrimesEarned)}
          </div>
          <div className="text-xs text-verone-gray-500 mt-1">
            Primes gagnées
          </div>
        </div>
        <div className="border border-verone-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-playfair font-bold text-blue-700">
            {fmt(currentBalance)}
          </div>
          <div className="text-xs text-verone-gray-500 mt-1">
            Solde disponible
          </div>
        </div>
      </div>

      {/* Code promo */}
      <div className="border border-verone-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-verone-black mb-4">
          Votre code ambassadeur
        </h2>
        {mainCode ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-verone-gray-50 rounded-lg">
              <code className="text-2xl font-bold font-mono tracking-wider text-verone-black flex-1">
                {mainCode.code}
              </code>
              <button
                type="button"
                onClick={() =>
                  void navigator.clipboard.writeText(mainCode.code)
                }
                className="px-3 py-1.5 border border-verone-gray-300 rounded-lg text-xs font-medium hover:bg-white transition-colors"
              >
                Copier
              </button>
            </div>
            <p className="text-sm text-verone-gray-600">
              {discountRate}% de réduction pour vos clients · {commissionRate}%
              de prime pour vous · {mainCode.usage_count} utilisation
              {mainCode.usage_count !== 1 ? 's' : ''}
            </p>
            {mainCode.qr_code_url && (
              <button
                type="button"
                onClick={() =>
                  void navigator.clipboard.writeText(mainCode.qr_code_url ?? '')
                }
                className="text-sm text-verone-gray-500 underline hover:text-verone-black transition-colors"
              >
                Copier le lien d&apos;affiliation
              </button>
            )}
            <div className="pt-2">
              <Link
                href="/ambassadeur"
                className="text-sm font-medium text-verone-black hover:underline"
              >
                Voir mon tableau de bord ambassadeur →
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-verone-gray-500">
            Aucun code actif pour le moment. Contactez l&apos;équipe Vérone.
          </p>
        )}
      </div>

      {/* Préférences */}
      <div className="border border-verone-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-verone-black mb-4">
          Préférences
        </h2>
        <ToggleSwitch
          checked={notify}
          onChange={v => void handleNotifyChange(v)}
          label="Recevoir un email à chaque gain"
          description="Nous vous enverrons un email chaque fois que vous gagnez une prime."
        />
      </div>

      {/* Coordonnées bancaires */}
      <div className="border border-verone-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-verone-black mb-4">
          Coordonnées bancaires
        </h2>
        <p className="text-sm text-verone-gray-500 mb-4">
          Nécessaires pour recevoir vos paiements par virement SEPA.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-verone-gray-700 mb-1.5">
              Titulaire du compte
            </label>
            <input
              type="text"
              value={bankForm.accountHolderName}
              onChange={e =>
                setBankForm(p => ({ ...p, accountHolderName: e.target.value }))
              }
              className={inputClass}
              placeholder="Marie Dupont"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-verone-gray-700 mb-1.5">
              IBAN
            </label>
            <input
              type="text"
              value={bankForm.iban}
              onChange={e => setBankForm(p => ({ ...p, iban: e.target.value }))}
              className={inputClass}
              placeholder="FR76 3000 6000 0112 3456 7890 189"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-verone-gray-700 mb-1.5">
                BIC
              </label>
              <input
                type="text"
                value={bankForm.bic}
                onChange={e =>
                  setBankForm(p => ({ ...p, bic: e.target.value }))
                }
                className={inputClass}
                placeholder="BNPAFRPP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-verone-gray-700 mb-1.5">
                Banque
              </label>
              <input
                type="text"
                value={bankForm.bankName}
                onChange={e =>
                  setBankForm(p => ({ ...p, bankName: e.target.value }))
                }
                className={inputClass}
                placeholder="BNP Paribas"
              />
            </div>
          </div>
          {siretRequired && (
            <div>
              <label className="block text-sm font-medium text-verone-gray-700 mb-1.5">
                SIRET{' '}
                <span className="text-orange-600 font-normal text-xs">
                  (requis — primes &gt; 305€/an)
                </span>
              </label>
              <input
                type="text"
                value={bankForm.siret}
                onChange={e =>
                  setBankForm(p => ({ ...p, siret: e.target.value }))
                }
                className={inputClass}
                placeholder="123 456 789 00012"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => void handleBankSave()}
            disabled={bankSaving}
            className="bg-verone-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-verone-gray-800 transition-colors text-sm disabled:opacity-50"
          >
            {bankSaving
              ? 'Enregistrement...'
              : bankSaved
                ? 'Enregistré !'
                : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Désactiver */}
      <div className="border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-verone-black mb-2">
          Désactiver mon statut ambassadeur
        </h2>
        <p className="text-sm text-verone-gray-500 mb-4">
          Votre code promo sera désactivé. Vous ne générerez plus de primes.
          Votre solde actuel reste disponible jusqu&apos;au prochain paiement.
        </p>
        <button
          type="button"
          onClick={onDeactivate}
          disabled={isDeactivating}
          className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {isDeactivating ? 'Désactivation...' : 'Désactiver'}
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main client component
// ============================================

export function AmbassadorSettingsClient({
  customerId,
  isAmbassador: initialIsAmbassador,
  commissionRate,
  discountRate,
  iban,
  bic,
  bankName,
  accountHolderName,
  siret,
  siretRequired,
  notifyOnGain,
  cguAcceptedAt,
  cguVersion,
  codes,
  totalSalesGenerated,
  totalPrimesEarned,
  currentBalance,
}: AmbassadorSettingsClientProps) {
  const [isAmbassador, setIsAmbassador] = useState(initialIsAmbassador);
  const [showCgu, setShowCgu] = useState(false);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // Afficher CGU si acceptation manquante pour un ambassadeur existant
  const cguPending =
    isAmbassador && (!cguAcceptedAt || cguVersion !== CGU_VERSION);

  const handleActivateClick = useCallback(() => {
    setShowCgu(true);
  }, []);

  const handleCguAccept = useCallback(async () => {
    setActivating(true);
    setShowCgu(false);
    const supabase = createClient();
    await supabase
      .from('individual_customers')
      .update({
        is_ambassador: true,
        ambassador_activated_at: new Date().toISOString(),
        ambassador_commission_rate: 10,
        ambassador_discount_rate: 10,
        ambassador_cgu_accepted_at: new Date().toISOString(),
        ambassador_cgu_version: CGU_VERSION,
      } as never)
      .eq('id', customerId);
    setIsAmbassador(true);
    setActivating(false);
    // Reload pour récupérer les codes générés (si trigger côté DB)
    window.location.href = '/ambassadeur';
  }, [customerId]);

  const handleCguAcceptExisting = useCallback(async () => {
    const supabase = createClient();
    await supabase
      .from('individual_customers')
      .update({
        ambassador_cgu_accepted_at: new Date().toISOString(),
        ambassador_cgu_version: CGU_VERSION,
      } as never)
      .eq('id', customerId);
    setShowCgu(false);
  }, [customerId]);

  const handleDeactivate = useCallback(async () => {
    if (
      !window.confirm(
        'Confirmer la désactivation de votre statut ambassadeur ?'
      )
    )
      return;
    setDeactivating(true);
    const supabase = createClient();
    await supabase
      .from('individual_customers')
      .update({ is_ambassador: false } as never)
      .eq('id', customerId);
    setIsAmbassador(false);
    setDeactivating(false);
  }, [customerId]);

  return (
    <>
      {(showCgu || cguPending) && (
        <CguModal
          onAccept={() =>
            void (cguPending ? handleCguAcceptExisting() : handleCguAccept())
          }
          onClose={() => {
            if (!cguPending) setShowCgu(false);
            // Si CGU requises pour un ambassadeur existant, on ne peut pas fermer sans accepter
          }}
        />
      )}

      {isAmbassador ? (
        <ActiveSection
          customerId={customerId}
          commissionRate={commissionRate}
          discountRate={discountRate}
          iban={iban}
          bic={bic}
          bankName={bankName}
          accountHolderName={accountHolderName}
          siret={siret}
          siretRequired={siretRequired}
          notifyOnGain={notifyOnGain}
          codes={codes}
          totalSalesGenerated={totalSalesGenerated}
          totalPrimesEarned={totalPrimesEarned}
          currentBalance={currentBalance}
          onDeactivate={() => void handleDeactivate()}
          isDeactivating={deactivating}
        />
      ) : (
        <JoinSection onActivate={handleActivateClick} isLoading={activating} />
      )}
    </>
  );
}
