import { redirect } from 'next/navigation';
import Link from 'next/link';

import { LogOut, Package, User } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/auth/actions';

export default async function ComptePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const metadata = user.user_metadata as Record<string, string | undefined>;
  const firstName = metadata.first_name ?? '';
  const lastName = metadata.last_name ?? '';
  const phone = metadata.phone ?? '';

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
              <span className="block px-4 py-2.5 bg-verone-gray-50 rounded-lg font-medium text-sm text-verone-black">
                Informations personnelles
              </span>
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
          {/* Personal info */}
          <div className="border border-verone-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-verone-black mb-6">
              Informations personnelles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-verone-gray-700 mb-1.5">
                  Prénom
                </label>
                <p className="px-4 py-3 bg-verone-gray-50 border border-verone-gray-200 rounded-lg text-sm">
                  {firstName || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-verone-gray-700 mb-1.5">
                  Nom
                </label>
                <p className="px-4 py-3 bg-verone-gray-50 border border-verone-gray-200 rounded-lg text-sm">
                  {lastName || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-verone-gray-700 mb-1.5">
                  Email
                </label>
                <p className="px-4 py-3 bg-verone-gray-50 border border-verone-gray-200 rounded-lg text-sm">
                  {user.email ?? '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-verone-gray-700 mb-1.5">
                  Téléphone
                </label>
                <p className="px-4 py-3 bg-verone-gray-50 border border-verone-gray-200 rounded-lg text-sm">
                  {phone || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Orders placeholder */}
          <div className="border border-verone-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-verone-black mb-6">
              Mes commandes
            </h2>
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
          </div>
        </div>
      </div>
    </div>
  );
}
