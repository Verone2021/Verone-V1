import { useState, useCallback } from 'react';

import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/shared/modules/common/hooks';

// =============================================
// AGING REPORT - ANALYSE VIEILLISSEMENT STOCK
// Inspiré de Odoo, ERPNext, SAP
// =============================================

// Tranches temporelles standard ERP
export const AGING_BUCKETS = [
  { id: '0-30', label: '0-30 jours', min: 0, max: 30, color: 'bg-green-100' },
  { id: '31-60', label: '31-60 jours', min: 31, max: 60, color: 'bg-blue-100' },
  {
    id: '61-90',
    label: '61-90 jours',
    min: 61,
    max: 90,
    color: 'bg-yellow-100',
  },
  {
    id: '91-180',
    label: '91-180 jours',
    min: 91,
    max: 180,
    color: 'bg-orange-100',
  },
  {
    id: '180+',
    label: '180+ jours',
    min: 181,
    max: Infinity,
    color: 'bg-red-100',
  },
] as const;

interface ProductWithAge {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  cost_price: number;
  last_movement_date: string | null;
  age_days: number;
  value: number;
  bucket: string;
}

interface AgingBucketData {
  bucket_id: string;
  label: string;
  count: number;
  quantity: number;
  value: number;
  percentage: number;
  color: string;
}

export interface AgingReportData {
  summary: {
    total_products: number;
    total_quantity: number;
    total_value: number;
    average_age_days: number;
    percent_over_90_days: number;
    immobilized_value: number; // Valeur stock > 90 jours
  };
  buckets: AgingBucketData[];
  top_oldest: ProductWithAge[];
  generated_at: string;
}

export function useAgingReport() {
  const [report, setReport] = useState<AgingReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const generateReport = useCallback(
    async (dateFrom?: string, dateTo?: string) => {
      setLoading(true);
      setError(null);

      try {
        const today = new Date();

        // ============================================
        // QUERY 1: Récupérer tous les produits non archivés avec stock
        // ============================================
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, sku, stock_quantity, cost_price')
          .is('archived_at', null)
          .gt('stock_quantity', 0);

        if (productsError) throw productsError;

        // ============================================
        // QUERY 2: Récupérer le dernier mouvement pour chaque produit
        // ============================================
        const productIds = products.map(p => p.id);

        const { data: lastMovements, error: movementsError } = await supabase
          .from('stock_movements')
          .select('product_id, performed_at')
          .in('product_id', productIds)
          .or('affects_forecast.is.null,affects_forecast.is.false') // ✅ BEST PRACTICE: is pour boolean et null
          .order('performed_at', { ascending: false });

        if (movementsError) throw movementsError;

        // Créer un map des derniers mouvements par produit
        const lastMovementMap = new Map<string, string>();
        lastMovements?.forEach(mov => {
          if (!lastMovementMap.has(mov.product_id)) {
            lastMovementMap.set(mov.product_id, mov.performed_at);
          }
        });

        // ============================================
        // CALCUL DE L'ÂGE DE CHAQUE PRODUIT
        // ============================================
        const productsWithAge: ProductWithAge[] = products.map(product => {
          const lastMovementDate = lastMovementMap.get(product.id);
          const ageMs = lastMovementDate
            ? today.getTime() - new Date(lastMovementDate).getTime()
            : today.getTime(); // Si pas de mouvement, considérer depuis début

          const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
          const value =
            (product.stock_quantity || 0) * (product.cost_price || 0);

          // Déterminer la tranche (bucket)
          const bucket =
            AGING_BUCKETS.find(b => ageDays >= b.min && ageDays <= b.max)?.id ||
            '180+';

          return {
            id: product.id,
            name: product.name || 'Sans nom',
            sku: product.sku || '',
            stock_quantity: product.stock_quantity || 0,
            cost_price: product.cost_price || 0,
            last_movement_date: lastMovementDate || null,
            age_days: ageDays,
            value,
            bucket,
          };
        });

        // ============================================
        // CALCUL DES MÉTRIQUES PAR TRANCHE
        // ============================================
        const bucketStats = AGING_BUCKETS.map(bucket => {
          const productsInBucket = productsWithAge.filter(
            p => p.bucket === bucket.id
          );

          return {
            bucket_id: bucket.id,
            label: bucket.label,
            count: productsInBucket.length,
            quantity: productsInBucket.reduce(
              (sum, p) => sum + p.stock_quantity,
              0
            ),
            value: productsInBucket.reduce((sum, p) => sum + p.value, 0),
            percentage: 0, // Calculé après
            color: bucket.color,
          };
        });

        // Calcul des pourcentages
        const totalValue = bucketStats.reduce((sum, b) => sum + b.value, 0);
        bucketStats.forEach(bucket => {
          bucket.percentage =
            totalValue > 0 ? (bucket.value / totalValue) * 100 : 0;
        });

        // ============================================
        // CALCUL DES MÉTRIQUES GLOBALES
        // ============================================
        const totalProducts = productsWithAge.length;
        const totalQuantity = productsWithAge.reduce(
          (sum, p) => sum + p.stock_quantity,
          0
        );
        const averageAge =
          totalProducts > 0
            ? productsWithAge.reduce((sum, p) => sum + p.age_days, 0) /
              totalProducts
            : 0;

        // Produits > 90 jours
        const productsOver90Days = productsWithAge.filter(p => p.age_days > 90);
        const percentOver90Days =
          totalProducts > 0
            ? (productsOver90Days.length / totalProducts) * 100
            : 0;

        // Valeur immobilisée (stock > 90 jours)
        const immobilizedValue = productsOver90Days.reduce(
          (sum, p) => sum + p.value,
          0
        );

        // ============================================
        // TOP 20 PRODUITS LES PLUS ANCIENS
        // ============================================
        const topOldest = productsWithAge
          .sort((a, b) => b.age_days - a.age_days)
          .slice(0, 20);

        // ============================================
        // CONSTRUCTION DU RAPPORT
        // ============================================
        const reportData: AgingReportData = {
          summary: {
            total_products: totalProducts,
            total_quantity: totalQuantity,
            total_value: totalValue,
            average_age_days: Math.round(averageAge),
            percent_over_90_days: Math.round(percentOver90Days * 10) / 10,
            immobilized_value: immobilizedValue,
          },
          buckets: bucketStats,
          top_oldest: topOldest,
          generated_at: new Date().toISOString(),
        };

        setReport(reportData);
        return reportData;
      } catch (err: any) {
        const errorMessage =
          err.message || 'Erreur lors de la génération du rapport aging';
        setError(errorMessage);
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  return {
    report,
    loading,
    error,
    generateReport,
  };
}
