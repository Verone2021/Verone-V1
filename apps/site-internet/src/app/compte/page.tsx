import { redirect } from 'next/navigation';
import Link from 'next/link';

import type { Metadata } from 'next';
import {
  Heart,
  Key,
  LogOut,
  Package,
  Pencil,
  Trash2,
  User,
} from 'lucide-react';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/server';
import {
  deleteAccount,
  logout,
  updateProfile,
  changePassword,
} from '@/app/auth/actions';

export const metadata: Metadata = {
  title: 'Mon compte',
  robots: { index: false, follow: false },
};

interface SiteOrder {
  id: string;
  order_number: string | null;
  created_at: string;
  status: string;
  total_ttc: number;
  shipping_address: Record<string, string> | null;
  // Tracking info (from sales_order_shipments, NEVER includes shipping_cost)
  tracking_number?: string | null;
  tracking_url?: string | null;
  carrier_name?: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'En cours', color: 'bg-yellow-100 text-yellow-800' },
  validated: { label: 'Confirmee', color: 'bg-blue-100 text-blue-800' },
  partially_shipped: {
    label: 'En preparation',
    color: 'bg-orange-100 text-orange-800',
  },
  shipped: { label: 'Expediee', color: 'bg-orange-100 text-orange-800' },
  delivered: { label: 'Livree', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulee', color: 'bg-red-100 text-red-800' },
  closed: { label: 'Terminee', color: 'bg-gray-100 text-gray-800' },
};

export default async function ComptePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const userMeta = user.user_metadata as Record<string, string | undefined>;
  const firstName = userMeta.first_name ?? '';
  const lastName = userMeta.last_name ?? '';
  const phone = userMeta.phone ?? '';

  // Fetch user orders from sales_orders (via auth_user_id link, fallback to email)
  const ordersClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Find customer by auth_user_id first, fallback to email
  let { data: customerData } = await ordersClient
    .from('individual_customers')
    .select('id')
    .eq('auth_user_id', user.id)
    .limit(1)
    .single();

  if (!customerData) {
    ({ data: customerData } = await ordersClient
      .from('individual_customers')
      .select('id')
      .eq('email', user.email ?? '')
      .limit(1)
      .single());
  }

  let orders: SiteOrder[] = [];
  if (customerData) {
    const { data: ordersData } = await ordersClient
      .from('sales_orders')
      .select(
        `id, order_number, created_at, status, total_ttc, shipping_address,
         sales_order_shipments(tracking_number, tracking_url, carrier_name)`
      )
      .eq('individual_customer_id', String(customerData.id))
      .eq('channel_id', '0c2639e9-df80-41fa-84d0-9da96a128f7f')
      .order('created_at', { ascending: false })
      .limit(10);

    // Flatten tracking info from first shipment with tracking
    // IMPORTANT: NEVER expose shipping_cost (Verone internal cost)
    orders = ((ordersData ?? []) as Array<Record<string, unknown>>).map(o => {
      const shipments = (o.sales_order_shipments ?? []) as Array<{
        tracking_number: string | null;
        tracking_url: string | null;
        carrier_name: string | null;
      }>;
      const withTracking = shipments.find(s => s.tracking_number);
      return {
        id: o.id as string,
        order_number: o.order_number as string | null,
        created_at: o.created_at as string,
        status: o.status as string,
        total_ttc: o.total_ttc as number,
        shipping_address: o.shipping_address as Record<string, string> | null,
        tracking_number: withTracking?.tracking_number ?? null,
        tracking_url: withTracking?.tracking_url ?? null,
        carrier_name: withTracking?.carrier_name ?? null,
      };
    });
  }

  const inputClass =
    'w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm';

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-playfair font-bold text-verone-black mb-8">
        Mon Compte
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="border border-verone-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-verone-gray-100">
              <div className="w-12 h-12 rounded-full bg-verone-gray-100 flex items-center justify-center">
                <User className="h-6 w-6 text-verone-gray-400" />
              </div>
              <div>
                <p className="font-medium text-verone-black">
                  {firstName} {lastName}
                </p>
                <p className="text-xs text-verone-gray-500">{user.email}</p>
              </div>
            </div>
            <nav className="space-y-1">
              <a
                href="#profil"
                className="flex items-center gap-2 px-4 py-2.5 bg-verone-gray-50 rounded-lg font-medium text-sm text-verone-black"
              >
                <Pencil className="h-3.5 w-3.5" />
                Informations personnelles
              </a>
              <Link
                href="/compte/favoris"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-verone-gray-600 hover:bg-verone-gray-50 transition-colors"
              >
                <Heart className="h-3.5 w-3.5" />
                Mes favoris
              </Link>
              <a
                href="#commandes"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-verone-gray-600 hover:bg-verone-gray-50 transition-colors"
              >
                <Package className="h-3.5 w-3.5" />
                Mes commandes
              </a>
              <a
                href="#securite"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-verone-gray-600 hover:bg-verone-gray-50 transition-colors"
              >
                <Key className="h-3.5 w-3.5" />
                Sécurité
              </a>
              <Link
                href="/catalogue"
                className="block px-4 py-2.5 rounded-lg text-sm text-verone-gray-600 hover:bg-verone-gray-50 transition-colors"
              >
                Continuer mes achats
              </Link>
              <form>
                <button
                  formAction={logout}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </form>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile edit form */}
          <div
            id="profil"
            className="border border-verone-gray-200 rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold text-verone-black mb-6">
              Informations personnelles
            </h2>
            <form action={updateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                  >
                    Prénom
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    defaultValue={firstName}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                  >
                    Nom
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    defaultValue={lastName}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-verone-gray-700 mb-1.5">
                  Email
                </label>
                <p className="px-4 py-3 bg-verone-gray-50 border border-verone-gray-200 rounded-lg text-sm text-verone-gray-500">
                  {user.email}
                </p>
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                >
                  Téléphone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={phone}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                className="bg-verone-black text-verone-white px-6 py-2.5 rounded-lg font-medium hover:bg-verone-gray-800 transition-colors text-sm"
              >
                Enregistrer les modifications
              </button>
            </form>
          </div>

          {/* Orders */}
          <div
            id="commandes"
            className="border border-verone-gray-200 rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold text-verone-black mb-6">
              Mes commandes
            </h2>
            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map(order => {
                  const status = STATUS_LABELS[order.status] ?? {
                    label: order.status,
                    color: 'bg-gray-100 text-gray-800',
                  };
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between border border-verone-gray-100 rounded-lg p-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-verone-black">
                          {order.order_number ?? 'Commande'} —{' '}
                          {new Date(order.created_at).toLocaleDateString(
                            'fr-FR',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )}
                        </p>
                        <p className="text-xs text-verone-gray-500 mt-0.5">
                          {Number(order.total_ttc).toFixed(2)} &euro;
                          {order.carrier_name && (
                            <span className="ml-2">— {order.carrier_name}</span>
                          )}
                        </p>
                        {order.tracking_number && (
                          <p className="text-xs text-verone-gray-500 mt-0.5">
                            Suivi :{' '}
                            {order.tracking_url ? (
                              <a
                                href={order.tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-verone-black underline hover:no-underline"
                              >
                                {order.tracking_number}
                              </a>
                            ) : (
                              order.tracking_number
                            )}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-10 w-10 text-verone-gray-300 mx-auto mb-3" />
                <p className="text-sm text-verone-gray-500">
                  Aucune commande pour le moment.
                </p>
                <Link
                  href="/catalogue"
                  className="mt-4 inline-block text-sm font-medium text-verone-black hover:underline"
                >
                  Découvrir notre catalogue
                </Link>
              </div>
            )}
          </div>

          {/* Change password */}
          <div
            id="securite"
            className="border border-verone-gray-200 rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold text-verone-black mb-6">
              Changer le mot de passe
            </h2>
            <form action={changePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                >
                  Nouveau mot de passe
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                  className={inputClass}
                  placeholder="Minimum 8 caractères"
                />
              </div>
              <button
                type="submit"
                className="bg-verone-black text-verone-white px-6 py-2.5 rounded-lg font-medium hover:bg-verone-gray-800 transition-colors text-sm"
              >
                Mettre à jour le mot de passe
              </button>
            </form>
          </div>

          {/* GDPR */}
          <div className="border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-verone-black mb-2">
              Supprimer mon compte
            </h2>
            <p className="text-sm text-verone-gray-500 mb-4">
              Conformément au RGPD, vous pouvez demander la suppression de votre
              compte et de toutes vos données personnelles. Cette action est
              irréversible.
            </p>
            <form>
              <button
                formAction={deleteAccount}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer mon compte
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
