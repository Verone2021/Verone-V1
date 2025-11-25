'use client';

/**
 * Composant compact affichant l'historique des échantillons commandés pour un produit
 * Affiché dans la sidebar de la page détail produit catalogue
 */

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import { FlaskConical, Package } from 'lucide-react';

interface SampleHistoryCompactProps {
  productId: string;
  className?: string;
}

interface SampleStats {
  totalOrders: number;
  totalQuantity: number;
  lastOrderDate: string | null;
}

export function SampleHistoryCompact({
  productId,
  className,
}: SampleHistoryCompactProps) {
  const [stats, setStats] = useState<SampleStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSampleStats = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        const supabase = createClient();

        // Requête pour récupérer les stats d'échantillons de ce produit
        const { data, error } = await supabase
          .from('purchase_order_items')
          .select(
            `
            id,
            quantity,
            sample_type,
            purchase_order:purchase_orders!inner (
              id,
              created_at
            )
          `
          )
          .eq('product_id', productId)
          .not('sample_type', 'is', null);

        if (error) {
          console.error('Erreur récupération échantillons produit:', error);
          setStats(null);
          return;
        }

        if (!data || data.length === 0) {
          setStats({
            totalOrders: 0,
            totalQuantity: 0,
            lastOrderDate: null,
          });
          return;
        }

        // Calculer les stats
        const totalOrders = data.length;
        const totalQuantity = data.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        );

        // Trouver la date de la dernière commande
        const dates = data
          .map((item: any) => item.purchase_order?.created_at)
          .filter(Boolean)
          .sort(
            (a: string, b: string) =>
              new Date(b).getTime() - new Date(a).getTime()
          );

        const lastOrderDate = dates.length > 0 ? dates[0] : null;

        setStats({
          totalOrders,
          totalQuantity,
          lastOrderDate,
        });
      } catch (err) {
        console.error('Erreur fetchSampleStats:', err);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSampleStats();
  }, [productId]);

  // Ne rien afficher si pas de données ou en chargement
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-3 animate-pulse">
        <div className="h-4 bg-neutral-200 rounded w-24 mb-2" />
        <div className="h-6 bg-neutral-200 rounded w-12" />
      </div>
    );
  }

  // Ne rien afficher si aucun échantillon n'a été commandé
  if (!stats || stats.totalOrders === 0) {
    return null;
  }

  // Formater la date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      className={`bg-purple-50 rounded-lg shadow-sm border border-purple-200 p-3 ${className || ''}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <FlaskConical className="h-4 w-4 text-purple-600" />
        <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">
          Échantillons commandés
        </span>
      </div>

      <div className="flex items-baseline gap-3">
        <div className="flex items-center gap-1">
          <span className="text-2xl font-bold text-purple-700">
            {stats.totalOrders}
          </span>
          <span className="text-sm text-purple-600">
            commande{stats.totalOrders > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-1 text-sm text-purple-600">
          <Package className="h-3 w-3" />
          <span>
            {stats.totalQuantity} unité{stats.totalQuantity > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {stats.lastOrderDate && (
        <p className="text-xs text-purple-500 mt-1">
          Dernière commande : {formatDate(stats.lastOrderDate)}
        </p>
      )}
    </div>
  );
}
