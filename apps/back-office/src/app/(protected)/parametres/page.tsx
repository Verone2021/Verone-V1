'use client';

import Link from 'next/link';

import {
  ArrowRight,
  FileText,
  Key,
  Mail,
  Settings,
  Shield,
  Users,
  Webhook,
} from 'lucide-react';

const adminLinks = [
  {
    title: 'Utilisateurs',
    description: 'Gestion des comptes et roles staff',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Templates email',
    description: 'Personnaliser les emails envoyes aux clients',
    href: '/parametres/emails',
    icon: Mail,
  },
  {
    title: 'Webhooks',
    description: 'Integrations et notifications externes',
    href: '/parametres/webhooks',
    icon: Webhook,
  },
  {
    title: 'Notifications',
    description: 'Configuration des alertes systeme',
    href: '/parametres/notifications',
    icon: Shield,
  },
];

const financeLinks = [
  {
    title: 'Cloture exercice',
    description: 'Preparation cloture annuelle et export FEC',
    href: '/finance/admin/cloture',
    icon: FileText,
  },
  {
    title: 'Bibliotheque comptable',
    description: 'Classement et archivage documents comptables',
    href: '/finance/bibliotheque',
    icon: Key,
  },
];

export default function ParametresPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Parametres</h1>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <Link
                href="/admin/users"
                className="text-gray-500 hover:text-gray-900"
              >
                Utilisateurs
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/parametres/emails"
                className="text-gray-500 hover:text-gray-900"
              >
                Emails
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/parametres/webhooks"
                className="text-gray-500 hover:text-gray-900"
              >
                Webhooks
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/parametres/notifications"
                className="text-gray-500 hover:text-gray-900"
              >
                Notifications
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/profile"
                className="text-gray-500 hover:text-gray-900"
              >
                Mon profil
              </Link>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {adminLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                      <link.icon className="h-5 w-5 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {link.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {link.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Administration & Finance */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Administration
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {financeLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                      <link.icon className="h-5 w-5 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {link.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {link.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Profil — lien vers page profil existante */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Mon compte
          </h2>
          <Link
            href="/profile"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all group block"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                  <Users className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Mon profil
                  </h3>
                  <p className="text-xs text-gray-500">
                    Informations personnelles, mot de passe, preferences
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
