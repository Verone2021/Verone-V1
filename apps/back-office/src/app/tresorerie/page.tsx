/**
 * Page: Trésorerie Dashboard 360°
 * Route: /tresorerie
 * Description: Dashboard trésorerie complet avec Qonto + AR/AP unifiés
 *
 * Features:
 * - Soldes bancaires temps réel (Qonto multi-comptes)
 * - KPIs: Runway, Burn Rate, Cash Flow Net
 * - AR (Accounts Receivable) + AP (Accounts Payable)
 * - Prévisions 30/60/90 jours
 * - Graphique évolution trésorerie
 */

'use client';

import { TreasuryDashboard } from '@verone/finance/components';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { featureFlags } from '@verone/utils/feature-flags';
import { AlertCircle, Lock } from 'lucide-react';

export default function TresoreriePage() {
  // FEATURE FLAG: Finance module check
  if (!featureFlags.financeEnabled) {
    return (
      <div className="w-full py-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-orange-900">
                  Module Trésorerie - Désactivé
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Le module Finance doit être activé pour accéder à la
                  trésorerie
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
                    Fonctionnalités disponibles
                  </p>
                  <ul className="text-sm text-orange-700 list-disc list-inside mt-1">
                    <li>Intégration Qonto (comptes bancaires temps réel)</li>
                    <li>Prévisions trésorerie 30/60/90 jours</li>
                    <li>
                      KPIs AR (Accounts Receivable) + AP (Accounts Payable)
                    </li>
                    <li>Runway et Burn Rate automatiques</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <TreasuryDashboard />
    </div>
  );
}
