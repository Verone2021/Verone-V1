// =====================================================================
// Page: Rapprochement Bancaire
// Date: 2025-10-11
// Description: Interface rapprochement manuel transactions bancaires ↔ factures
// STATUS: DÉSACTIVÉ Phase 1 - Placeholder uniquement
// =====================================================================

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { featureFlags } from '@verone/utils/feature-flags';
import { AlertCircle, Lock } from 'lucide-react';

// =====================================================================
// PAGE COMPONENT
// =====================================================================

export default function RapprochementPage() {
  // FEATURE FLAG: Finance module disabled for Phase 1
  if (!featureFlags.financeEnabled) {
    return (
      <div className="w-full py-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-orange-900">
                  Module Rapprochement Bancaire - Phase 2
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
                    Fonctionnalités Phase 2
                  </p>
                  <ul className="text-sm text-orange-700 list-disc list-inside mt-1">
                    <li>
                      Rapprochement automatique transactions Qonto ↔ factures
                    </li>
                    <li>Suggestions intelligentes avec score de confiance</li>
                    <li>Validation manuelle transactions non rapprochées</li>
                    <li>Export CSV pour comptabilité</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // CODE ORIGINAL DISPONIBLE DANS L'HISTORIQUE GIT - RÉACTIVATION PHASE 2
  return null;
}
