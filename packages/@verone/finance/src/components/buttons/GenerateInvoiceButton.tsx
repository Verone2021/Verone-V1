// =====================================================================
// Composant: GenerateInvoiceButton
// Date: 2025-10-11
// Description: Bouton génération facture depuis sales_order avec feedback
// =====================================================================

'use client';

import { useState } from 'react';

import { useToast } from '@verone/common/hooks';
import { ButtonV2 } from '@verone/ui';
import { FileText, Loader2 } from 'lucide-react';

// =====================================================================
// TYPE PROPS
// =====================================================================

interface GenerateInvoiceButtonProps {
  salesOrderId: string;
  orderNumber: string;
  onSuccess?: (invoiceId: string) => void;
  disabled?: boolean;
  variant?: 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

// =====================================================================
// TYPE RESPONSE API
// =====================================================================

interface GenerateInvoiceResponse {
  success: boolean;
  data?: {
    invoice: {
      id: string;
      abby_invoice_number: string;
      total_ttc: number;
      status: string;
    };
  };
  error?: string;
}

// =====================================================================
// COMPOSANT
// =====================================================================

export function GenerateInvoiceButton({
  salesOrderId,
  orderNumber,
  onSuccess,
  disabled = false,
  variant = 'secondary',
  size = 'md',
}: GenerateInvoiceButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Handler génération facture
  const handleGenerateInvoice = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salesOrderId,
        }),
      });

      const data = (await response.json()) as GenerateInvoiceResponse;

      if (!response.ok) {
        // Gestion erreurs spécifiques
        if (response.status === 404) {
          toast({
            title: 'Commande introuvable',
            description: `La commande ${orderNumber} n'existe pas.`,
            variant: 'destructive',
          });
          return;
        }

        if (response.status === 409) {
          toast({
            title: 'Facture déjà existante',
            description: `Une facture existe déjà pour la commande ${orderNumber}.`,
            variant: 'destructive',
          });
          return;
        }

        // Erreur générique
        throw new Error(data.error || 'Erreur génération facture');
      }

      // Succès
      if (data.success && data.data?.invoice) {
        const invoice = data.data.invoice;

        toast({
          title: 'Facture générée avec succès',
          description: `Facture ${invoice.abby_invoice_number} créée (${invoice.total_ttc}€ TTC)`,
        });

        // Callback succès (ex: refresh liste, navigation)
        onSuccess?.(invoice.id);
      }
    } catch (error) {
      console.error('Erreur génération facture:', error);

      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de générer la facture',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ButtonV2
      onClick={handleGenerateInvoice}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      icon={isLoading ? Loader2 : FileText}
      iconPosition="left"
      loading={isLoading}
    >
      {isLoading ? 'Génération...' : 'Générer facture'}
    </ButtonV2>
  );
}
