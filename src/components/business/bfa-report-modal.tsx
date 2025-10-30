// =====================================================================
// Composant: BFAReportModal
// Date: 2025-10-11
// Description: Modal rapport BFA (Bonus Fin d'Année) avec tableaux détaillés
// =====================================================================

'use client';

import { useState } from 'react';
import { ButtonV2 } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, Download, TrendingUp } from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

interface BFACustomer {
  organisation_id: string;
  organisation_name: string;
  annual_revenue_ht: number;
  bfa_rate: number;
  bfa_amount: number;
}

interface BFASummary {
  fiscalYear: number;
  totalCustomers: number;
  totalRevenue: number;
  totalBFA: number;
  averageRate: number;
}

interface BFAReportData {
  success: boolean;
  data?: {
    fiscalYear: number;
    summary: BFASummary;
    customers: BFACustomer[];
  };
  error?: string;
}

// =====================================================================
// COMPOSANT
// =====================================================================

export function BFAReportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<BFAReportData['data'] | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const { toast } = useToast();

  // Générer années disponibles (5 dernières années)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Fetch rapport BFA
  const fetchBFAReport = async (year: string) => {
    setIsLoading(true);
    setReportData(null);

    try {
      const response = await fetch(`/api/reports/bfa/${year}`);
      const data = (await response.json()) as BFAReportData;

      if (!response.ok) {
        throw new Error(data.error || 'Erreur chargement rapport BFA');
      }

      if (data.success && data.data) {
        setReportData(data.data);
      }
    } catch (error) {
      console.error('Erreur fetch rapport BFA:', error);

      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Impossible de charger le rapport BFA',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler changement année
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    fetchBFAReport(year);
  };

  // Handler ouverture modal
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !reportData) {
      // Charger données au premier affichage
      fetchBFAReport(selectedYear);
    }
  };

  // Formater montant
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Formater taux
  const formatRate = (rate: number) => {
    return `${rate.toFixed(1)}%`;
  };

  // Déterminer badge variant selon taux
  const getRateBadgeVariant = (rate: number): 'secondary' | 'secondary' | 'outline' => {
    if (rate >= 7) return 'secondary';
    if (rate >= 3) return 'secondary';
    return 'outline';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <ButtonV2 variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Rapport BFA
        </ButtonV2>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rapport Bonus Fin d'Année (BFA)</DialogTitle>
          <DialogDescription>
            Calcul automatique des bonus clients selon chiffre d'affaires annuel
          </DialogDescription>
        </DialogHeader>

        {/* Sélecteur année */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Année fiscale:</label>
          <Select value={selectedYear} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Rapport chargé */}
        {!isLoading && reportData && (
          <div className="space-y-6">
            {/* Résumé statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Clients éligibles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.summary.totalCustomers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    CA Total HT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatAmount(reportData.summary.totalRevenue)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    BFA Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatAmount(reportData.summary.totalBFA)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Taux moyen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <div className="text-2xl font-bold">
                      {formatRate(reportData.summary.averageRate)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tableau détaillé par client */}
            <div>
              <h3 className="mb-3 text-lg font-semibold">Détail par client</h3>

              {reportData.customers.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-lg font-medium">Aucun client éligible</p>
                    <p className="text-sm text-muted-foreground">
                      Aucun client n'a atteint le seuil minimum de 5 000€ HT en {selectedYear}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">CA Annuel HT</TableHead>
                        <TableHead className="text-center">Taux BFA</TableHead>
                        <TableHead className="text-right">Montant BFA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.customers.map((customer) => (
                        <TableRow key={customer.organisation_id}>
                          <TableCell className="font-medium">
                            {customer.organisation_name}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatAmount(customer.annual_revenue_ht)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getRateBadgeVariant(customer.bfa_rate)}>
                              {formatRate(customer.bfa_rate)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-green-600">
                            {formatAmount(customer.bfa_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <ButtonV2 variant="outline" onClick={() => setIsOpen(false)}>
                Fermer
              </ButtonV2>
              <ButtonV2 disabled={reportData.customers.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Exporter PDF
              </ButtonV2>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
