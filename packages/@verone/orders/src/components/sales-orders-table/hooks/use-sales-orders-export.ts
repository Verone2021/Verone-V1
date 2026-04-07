import { useToast } from '@verone/common';

import type { SalesOrderStatus } from '../../../hooks/use-sales-orders';

interface UseSalesOrdersExportParams {
  channelId: string | null;
  activeTab: SalesOrderStatus | 'all';
  searchTerm: string;
  customerType: string;
  period: string;
}

export function useSalesOrdersExport({
  channelId,
  activeTab,
  searchTerm,
  customerType,
  period,
}: UseSalesOrdersExportParams) {
  const { toast } = useToast();

  const handleExportExcel = async () => {
    try {
      toast({
        title: 'Export en cours...',
        description: 'Generation du fichier Excel',
      });

      const response = await fetch('/api/sales-orders/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activeTab,
          customerType,
          period,
          searchTerm,
          channelId,
        }),
      });

      if (!response.ok) throw new Error('Erreur export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commandes-${channelId ? 'linkme-' : ''}${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export reussi',
        description: 'Le fichier Excel a ete telecharge',
      });
    } catch (error) {
      console.error('Erreur export Excel:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'exporter les commandes",
        variant: 'destructive',
      });
    }
  };

  return { handleExportExcel };
}
