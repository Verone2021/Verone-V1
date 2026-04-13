'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

// ============================================
// Types
// ============================================

interface AmbassadorProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  commission_rate: number;
  discount_rate: number;
  total_sales_generated: number;
  total_primes_earned: number;
  total_primes_paid: number;
  current_balance: number;
  annual_earnings_ytd: number;
  siret_required: boolean;
  cgu_accepted_at: string | null;
  cgu_version: string | null;
}

interface AmbassadorCode {
  id: string;
  code: string;
  qr_code_url: string | null;
  usage_count: number;
  is_active: boolean;
}

interface Attribution {
  id: string;
  order_total_ht: number;
  commission_rate: number;
  prime_amount: number;
  status: string;
  validation_date: string | null;
  created_at: string;
}

// ============================================
// CGU Modal
// ============================================

const CGU_VERSION = '2026-04-12-v1';
const CGU_TEXT = `
CONDITIONS DU PROGRAMME AMBASSADEUR VERONE

1. OBJET
Ce programme vous permet de partager un code promotionnel unique. Lorsqu'un client utilise votre code, vous recevez une prime promotionnelle calculee sur le montant HT de la commande.

2. PRIME PROMOTIONNELLE
- Le taux de votre prime est defini lors de la creation de votre compte ambassadeur.
- La prime est calculee sur le montant HT de chaque commande validee avec votre code.
- Les primes sont en statut "en attente" pendant 30 jours apres la commande (delai de retour).
- Apres 30 jours sans retour, la prime passe en statut "validee".

3. PAIEMENT
- Seuil minimum de retrait : 50 EUR.
- Methode : virement SEPA sur le compte bancaire renseigne dans votre profil.
- Les paiements sont effectues par l'equipe Verone apres validation.

4. OBLIGATIONS FISCALES
- En dessous de 305 EUR de primes par an : aucune declaration necessaire (art. 92 CGI).
- Au-dessus de 305 EUR/an : vous devez declarer vos primes comme "revenus occasionnels" (case 5KU du formulaire 2042).
- Si vos primes depassent regulierement 305 EUR/an, un numero SIRET (auto-entrepreneur) sera requis.

5. DUREE ET RESILIATION
- Le programme est valable sans limite de duree.
- Verone peut desactiver votre compte ambassadeur a tout moment.
- Vous pouvez demander la desactivation de votre compte a tout moment.

6. RESPONSABILITE
- Vous vous engagez a ne pas denigrer la marque Verone.
- Vous ne devez pas utiliser de methodes trompeuses pour generer des ventes.
`;

function CguModal({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col shadow-xl">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            Conditions du programme ambassadeur
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Veuillez lire et accepter les conditions avant de continuer.
          </p>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
            {CGU_TEXT}
          </pre>
        </div>
        <div className="p-6 border-t flex justify-end">
          <button
            type="button"
            onClick={onAccept}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            J&apos;accepte les conditions
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Stats Card
// ============================================

function StatCard({
  label,
  value,
  color = 'gray',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    gray: 'text-gray-900',
    green: 'text-green-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl border p-5">
      <div
        className={`text-2xl font-bold ${colorClasses[color] ?? colorClasses.gray}`}
      >
        {value}
      </div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default function AmbassadorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AmbassadorProfile | null>(null);
  const [codes, setCodes] = useState<AmbassadorCode[]>([]);
  const [attributions, setAttributions] = useState<Attribution[]>([]);
  const [showCgu, setShowCgu] = useState(false);
  const [authError, setAuthError] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(n);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAuthError(true);
      setLoading(false);
      return;
    }

    // Fetch ambassador profile
    const { data: amb } = await supabase
      .from('site_ambassadors')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (!amb) {
      setAuthError(true);
      setLoading(false);
      return;
    }

    setProfile(amb as AmbassadorProfile);

    // Check CGU
    if (!amb.cgu_accepted_at || amb.cgu_version !== CGU_VERSION) {
      setShowCgu(true);
    }

    // Fetch codes
    const { data: codesData } = await supabase
      .from('ambassador_codes')
      .select('id, code, qr_code_url, usage_count, is_active')
      .eq('ambassador_id', amb.id);

    setCodes((codesData as AmbassadorCode[]) ?? []);

    // Fetch attributions
    const { data: attrData } = await supabase
      .from('ambassador_attributions')
      .select(
        'id, order_total_ht, commission_rate, prime_amount, status, validation_date, created_at'
      )
      .eq('ambassador_id', amb.id)
      .order('created_at', { ascending: false })
      .limit(50);

    setAttributions((attrData as Attribution[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const acceptCgu = useCallback(async () => {
    if (!profile) return;
    const supabase = createClient();
    await supabase
      .from('site_ambassadors')
      .update({
        cgu_accepted_at: new Date().toISOString(),
        cgu_version: CGU_VERSION,
      })
      .eq('id', profile.id);
    setShowCgu(false);
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-gray-900 rounded-full" />
      </div>
    );
  }

  if (authError || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acces non autorise
          </h1>
          <p className="text-gray-600">
            Cette page est reservee aux ambassadeurs Verone. Si vous etes
            ambassadeur, connectez-vous avec votre compte.
          </p>
          <a
            href="/auth/login"
            className="inline-block mt-4 px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Se connecter
          </a>
        </div>
      </div>
    );
  }

  const statusLabels: Record<string, { text: string; className: string }> = {
    pending: { text: 'En attente', className: 'bg-yellow-100 text-yellow-700' },
    validated: { text: 'Validee', className: 'bg-green-100 text-green-700' },
    cancelled: { text: 'Annulee', className: 'bg-red-100 text-red-700' },
    paid: { text: 'Payee', className: 'bg-blue-100 text-blue-700' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showCgu && <CguModal onAccept={() => void acceptCgu()} />}

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour {profile.first_name} !
          </h1>
          <p className="text-gray-500 mt-1">Votre espace ambassadeur Verone</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="CA genere"
            value={fmt(Number(profile.total_sales_generated))}
          />
          <StatCard
            label="Primes gagnees"
            value={fmt(Number(profile.total_primes_earned))}
            color="green"
          />
          <StatCard
            label="Solde disponible"
            value={fmt(Number(profile.current_balance))}
            color="blue"
          />
          <StatCard
            label="Primes payees"
            value={fmt(Number(profile.total_primes_paid))}
            color="orange"
          />
        </div>

        {/* SIRET Warning */}
        {profile.siret_required && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-sm text-orange-800 font-medium">
              Vos primes depassent 305 EUR cette annee. Un numero SIRET est
              requis pour continuer a recevoir des paiements. Contactez
              l&apos;equipe Verone.
            </p>
          </div>
        )}

        {/* Code promo + QR code */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Votre code promo</h2>
          {codes.length === 0 ? (
            <p className="text-gray-500">Aucun code attribue.</p>
          ) : (
            <div className="space-y-4">
              {codes.map(code => (
                <div
                  key={code.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <code className="text-2xl font-bold font-mono tracking-wider">
                      {code.code}
                    </code>
                    <p className="text-sm text-gray-500 mt-1">
                      {code.usage_count} utilisation
                      {code.usage_count !== 1 ? 's' : ''} ·{' '}
                      {profile.discount_rate}% de reduction pour vos clients ·{' '}
                      {profile.commission_rate}% de prime pour vous
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(code.code);
                      }}
                      className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      Copier le code
                    </button>
                    {code.qr_code_url && (
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(
                            code.qr_code_url ?? ''
                          );
                        }}
                        className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                      >
                        Copier le lien
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historique des ventes */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">
            Historique des ventes ({attributions.length})
          </h2>
          {attributions.length === 0 ? (
            <p className="text-gray-500">
              Aucune vente pour le moment. Partagez votre code pour commencer !
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500 uppercase">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-right">Montant HT</th>
                    <th className="py-2 px-3 text-center">Taux</th>
                    <th className="py-2 px-3 text-right">Prime</th>
                    <th className="py-2 px-3 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {attributions.map(attr => {
                    const status =
                      statusLabels[attr.status] ?? statusLabels.pending;
                    return (
                      <tr key={attr.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-3 text-sm">
                          {new Date(attr.created_at).toLocaleDateString(
                            'fr-FR'
                          )}
                        </td>
                        <td className="py-3 px-3 text-sm text-right">
                          {fmt(Number(attr.order_total_ht))}
                        </td>
                        <td className="py-3 px-3 text-sm text-center">
                          {attr.commission_rate}%
                        </td>
                        <td className="py-3 px-3 text-sm text-right font-medium">
                          {fmt(Number(attr.prime_amount))}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                          >
                            {status.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Conditions */}
        <div className="text-center text-xs text-gray-400 pb-8">
          <p>
            Programme ambassadeur Verone · Prime promotionnelle de parrainage ·{' '}
            <button
              type="button"
              onClick={() => setShowCgu(true)}
              className="underline hover:text-gray-600"
            >
              Voir les conditions
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
