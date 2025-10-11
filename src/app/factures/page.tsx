// =====================================================================
// Page: Liste des Factures
// Date: 2025-10-11
// Description: Page principale gestion factures avec filtres et pagination
// STATUS: DÉSACTIVÉ Phase 1 - Placeholder uniquement
// =====================================================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Lock } from 'lucide-react';
import { featureFlags } from '@/lib/feature-flags';

// =====================================================================
// METADATA
// =====================================================================

export const metadata = {
  title: 'Factures | Vérone Back Office',
  description: 'Gestion des factures clients - Système de facturation intégré Abby.fr',
};

// =====================================================================
// PAGE COMPONENT
// =====================================================================

export default function FacturesPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Factures</h1>
          <p className="text-muted-foreground mt-1">
            Gestion et suivi des factures clients
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton Rapport BFA */}
          <BFAReportModal />

          {/* Bouton Export (placeholder) */}
          <Button variant="outline" disabled>
            <FileText className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Factures envoyées</CardDescription>
            <CardTitle className="text-2xl">-</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En attente</CardDescription>
            <CardTitle className="text-2xl">-</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">À encaisser</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Payées</CardDescription>
            <CardTitle className="text-2xl">-</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>CA encaissé</CardDescription>
            <CardTitle className="text-2xl">-</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des factures avec suspense */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        }
      >
        <InvoicesList />
      </Suspense>
    </div>
  );
}
