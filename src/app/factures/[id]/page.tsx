// =====================================================================
// Page: Détail Facture
// Date: 2025-10-11
// Description: Page détail facture avec historique paiements et actions
// =====================================================================

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PaymentForm } from '@/components/business/payment-form';
import { ButtonV2 } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, DollarSign, FileText, Loader2 } from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

interface InvoiceDetails {
  id: string;
  abby_invoice_number: string;
  abby_invoice_id: string;
  sales_order_id: string;
  total_ht: number;
  tva_amount: number;
  total_ttc: number;
  amount_paid: number;
  status: string;
  issue_date: string;
  due_date: string;
  notes: string | null;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

// =====================================================================
// METADATA
// =====================================================================

export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Facture ${params.id} | Vérone Back Office`,
    description: 'Détail et historique de la facture',
  };
}

// =====================================================================
// PAGE COMPONENT
// =====================================================================

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  // FEATURE FLAG: Finance module disabled for Phase 1
  const { featureFlags } = await import('@/lib/feature-flags');
  
  if (!featureFlags.financeEnabled) {
    const { Card, CardContent, CardDescription, CardHeader, CardTitle } = await import('@/components/ui/card');
    const { AlertCircle, Lock } = await import('lucide-react');
    
    return (
      <div className="container mx-auto py-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-orange-900">Module Finance - Phase 2</CardTitle>
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
                  <p className="font-medium text-orange-900">Phase 1 (Actuelle)</p>
                  <p className="text-sm text-orange-700">
                    Sourcing • Catalogue • Organisations • Stock • Commandes
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-900">Phase 2 (Prochainement)</p>
                  <p className="text-sm text-orange-700">
                    Facturation • Trésorerie • Rapprochement bancaire • Intégrations (Qonto, Abby)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // CODE ORIGINAL DISPONIBLE DANS L'HISTORIQUE GIT - RÉACTIVATION PHASE 2
  // Pour réactiver, voir git log et restaurer le code depuis le commit précédent
  return null;
}
