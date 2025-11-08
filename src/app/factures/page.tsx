// =====================================================================
// Page: Liste des Factures
// Date: 2025-10-11
// Description: Page principale gestion factures avec filtres et pagination
// STATUS: DÉSACTIVÉ Phase 1 - Placeholder uniquement
// =====================================================================

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { AlertCircle, Lock } from 'lucide-react';

import { featureFlags } from '@/lib/feature-flags';

// =====================================================================
// METADATA
// =====================================================================

export const metadata = {
  title: 'Factures | Vérone Back Office',
  description:
    'Gestion des factures clients - Système de facturation intégré Abby.fr',
};

// =====================================================================
// PAGE COMPONENT
// =====================================================================

export default function FacturesPage() {
  // FEATURE FLAG: Finance module disabled for Phase 1
  if (!featureFlags.financeEnabled) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-orange-900">
                  Module Finance - Phase 2
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Ce module sera disponible après le déploiement Phase 1
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-900">
                    Phase 1 (Actuelle)
                  </p>
                  <p className="text-sm text-orange-700">
                    Sourcing • Catalogue • Organisations • Stock • Commandes
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-900">
                    Phase 2 (Prochainement)
                  </p>
                  <p className="text-sm text-orange-700">
                    Facturation • Trésorerie • Rapprochement bancaire •
                    Intégrations (Qonto, Abby)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // CODE ORIGINAL - Ce code sera réactivé en Phase 2
  return null;
}
