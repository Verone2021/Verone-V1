import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

import { createClient } from '@/lib/supabase/server';

import { AmbassadorSettingsClient } from './AmbassadorSettingsClient';

export const metadata: Metadata = {
  title: 'Paramètres ambassadeur',
  robots: { index: false, follow: false },
};

/**
 * Server component: fetche les données et détermine le mode (is_ambassador T/F).
 * Délègue l'interactivité à AmbassadorSettingsClient.
 */
export default async function AmbassadorSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch individual_customers row pour ce user (avec colonnes ambassador_*)
  // Les colonnes ambassador_* ne sont pas encore dans les types générés — cast needed
  let { data: customerRaw } = await supabase
    .from('individual_customers')
    .select('*')
    .eq('auth_user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!customerRaw) {
    ({ data: customerRaw } = await supabase
      .from('individual_customers')
      .select('*')
      .eq('email', user.email ?? '')
      .limit(1)
      .maybeSingle());
  }

  // Typage des champs ambassador_* hors schema généré
  const customer = customerRaw as
    | (typeof customerRaw & {
        is_ambassador: boolean | null;
        ambassador_commission_rate: number | null;
        ambassador_discount_rate: number | null;
        ambassador_iban: string | null;
        ambassador_bic: string | null;
        ambassador_bank_name: string | null;
        ambassador_account_holder_name: string | null;
        ambassador_siret: string | null;
        ambassador_siret_required: boolean | null;
        ambassador_notify_on_gain: boolean | null;
        ambassador_payout_threshold: number | null;
        ambassador_activated_at: string | null;
        ambassador_cgu_accepted_at: string | null;
        ambassador_cgu_version: string | null;
        ambassador_notes: string | null;
        ambassador_total_sales_generated: number | null;
        ambassador_total_primes_earned: number | null;
        ambassador_total_primes_paid: number | null;
        ambassador_current_balance: number | null;
        ambassador_annual_earnings_ytd: number | null;
      })
    | null;

  if (!customer) {
    // Pas de compte client — rediriger vers compte pour créer le profil
    redirect('/compte');
  }

  const isAmbassador = customer.is_ambassador === true;

  // Fetch codes si ambassadeur
  let codes: Array<{
    id: string;
    code: string;
    qr_code_url: string | null;
    usage_count: number;
    is_active: boolean;
  }> = [];

  if (isAmbassador) {
    const { data: codesData } = await supabase
      .from('ambassador_codes')
      .select('id, code, qr_code_url, usage_count, is_active')
      .eq('customer_id' as never, customer.id as never);
    codes = (codesData as typeof codes | null) ?? [];
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <h1 className="text-3xl font-playfair font-bold text-verone-black mb-2">
        Programme Ambassadeur
      </h1>
      <p className="text-sm text-verone-gray-500 mb-8">
        Recommandez Vérone à vos proches et gagnez des primes sur chaque vente
        générée.
      </p>

      <AmbassadorSettingsClient
        customerId={customer.id}
        isAmbassador={isAmbassador}
        commissionRate={customer.ambassador_commission_rate ?? 10}
        discountRate={customer.ambassador_discount_rate ?? 10}
        iban={customer.ambassador_iban ?? ''}
        bic={customer.ambassador_bic ?? ''}
        bankName={customer.ambassador_bank_name ?? ''}
        accountHolderName={customer.ambassador_account_holder_name ?? ''}
        siret={customer.ambassador_siret ?? ''}
        siretRequired={customer.ambassador_siret_required ?? false}
        notifyOnGain={customer.ambassador_notify_on_gain ?? true}
        payoutThreshold={customer.ambassador_payout_threshold ?? 20}
        cguAcceptedAt={customer.ambassador_cgu_accepted_at ?? null}
        cguVersion={customer.ambassador_cgu_version ?? null}
        codes={codes}
        totalSalesGenerated={customer.ambassador_total_sales_generated ?? 0}
        totalPrimesEarned={customer.ambassador_total_primes_earned ?? 0}
        currentBalance={customer.ambassador_current_balance ?? 0}
      />
    </div>
  );
}
