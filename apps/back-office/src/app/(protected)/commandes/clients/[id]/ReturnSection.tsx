'use client';

import { useState, useEffect, useCallback } from 'react';

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from '@verone/ui';
import { RotateCcw, Package, Loader2 } from 'lucide-react';

import { SalesOrderReturnModal } from '@verone/orders/components/modals/SalesOrderReturnModal';
import { useSalesReturns, type ReturnMovement } from '@verone/orders/hooks';

interface ReturnSectionProps {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
}

export function ReturnSection({
  orderId,
  orderNumber,
  orderStatus,
}: ReturnSectionProps) {
  const { loadReturnHistory } = useSalesReturns();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [returns, setReturns] = useState<ReturnMovement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Only show for shipped or delivered orders
  const canReturn = ['shipped', 'delivered'].includes(orderStatus);

  const refreshHistory = useCallback(() => {
    setLoadingHistory(true);
    void loadReturnHistory(orderId)
      .then(data => {
        setReturns(data);
      })
      .catch((err: unknown) => {
        console.error('[ReturnSection] Load history failed:', err);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [orderId, loadReturnHistory]);

  useEffect(() => {
    if (canReturn) {
      refreshHistory();
    }
  }, [canReturn, refreshHistory]);

  if (!canReturn) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Retours
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsModalOpen(true)}
            >
              <Package className="h-4 w-4 mr-2" />
              Retour produit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : returns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun retour enregistré
            </p>
          ) : (
            <div className="space-y-3">
              {returns.map(ret => (
                <div key={ret.id} className="border rounded-lg p-3 text-sm">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="font-medium">{ret.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ret.product_sku}
                      </p>
                    </div>
                    <Badge variant="secondary">+{ret.quantity_change}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(ret.performed_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {ret.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      {ret.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SalesOrderReturnModal
        order={{ id: orderId, order_number: orderNumber }}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshHistory}
      />
    </>
  );
}
