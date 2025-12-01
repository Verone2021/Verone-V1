'use client';

// UI Components
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';

// Icons
import { Link2, ExternalLink } from 'lucide-react';

// Local Components
import { DashboardSection } from './components/DashboardSection';

/**
 * Page Canal LinkMe - Dashboard Principal
 *
 * Plateforme d'affiliation B2B2C permettant à des professionnels
 * de créer des "Sélections" (mini-boutiques) à partir du catalogue Vérone
 *
 * La navigation est maintenant gérée par la sidebar LinkMeSidebar
 */
export default function LinkMePage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Link2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Tableau de Bord LinkMe</h1>
              <p className="text-sm text-gray-500">
                Vue d'ensemble de la plateforme d'affiliation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Plateforme Active
            </Badge>
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => window.open('https://linkme.verone.fr', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir LinkMe
            </ButtonV2>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 p-6 overflow-auto">
        <DashboardSection />
      </div>
    </div>
  );
}
