'use client';

import { useCallback, useState } from 'react';

import { useToast } from '@verone/common/hooks';
import {
  CustomerSelector,
  type UnifiedCustomer,
} from '@verone/orders/components/modals/customer-selector';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Briefcase, Loader2, Send } from 'lucide-react';

import {
  InvoiceServiceItemsSection,
  type IServiceItem,
} from './InvoiceCreateServiceModal/InvoiceServiceItemsSection';
import { InvoiceServiceOptionsSection } from './InvoiceCreateServiceModal/InvoiceServiceOptionsSection';
import { InvoiceServiceSuccessView } from './InvoiceCreateServiceModal/InvoiceServiceSuccessView';

interface IInvoiceCreateServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (invoiceId: string) => void;
}

type CreateStatus = 'idle' | 'creating' | 'success' | 'error';

interface ICreatedInvoice {
  id: string;
  invoice_number: string;
  pdf_url?: string;
  public_url?: string;
  total_amount: number;
  currency: string;
}

interface IServiceInvoiceApiResponse {
  success: boolean;
  error?: string;
  invoice: ICreatedInvoice;
}

function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(
    amount
  );
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function createDefaultItem(): IServiceItem {
  return {
    id: generateId(),
    title: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    vatRate: 0.2,
  };
}

export function InvoiceCreateServiceModal({
  open,
  onOpenChange,
  onSuccess,
}: IInvoiceCreateServiceModalProps): React.ReactNode {
  const { toast } = useToast();
  const [status, setStatus] = useState<CreateStatus>('idle');
  const [createdInvoice, setCreatedInvoice] = useState<ICreatedInvoice | null>(
    null
  );
  const [selectedCustomer, setSelectedCustomer] =
    useState<UnifiedCustomer | null>(null);
  const [items, setItems] = useState<IServiceItem[]>([createDefaultItem()]);
  const [paymentTerms, setPaymentTerms] = useState('net_30');
  const [reference, setReference] = useState('');
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const resetState = useCallback((): void => {
    setStatus('idle');
    setCreatedInvoice(null);
    setSelectedCustomer(null);
    setItems([createDefaultItem()]);
    setPaymentTerms('net_30');
    setReference('');
    setIssueDate(new Date().toISOString().split('T')[0]);
  }, []);

  const handleClose = useCallback((): void => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

  const handleAddItem = (): void => setItems([...items, createDefaultItem()]);
  const handleRemoveItem = (id: string): void => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };
  const handleItemChange = (
    id: string,
    field: keyof IServiceItem,
    value: string | number
  ): void => {
    setItems(
      items.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const calculateTotals = () => {
    const totalHT = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const totalVAT = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice * item.vatRate,
      0
    );
    return { totalHT, totalVAT, totalTTC: totalHT + totalVAT };
  };

  const handleCreateInvoice = async (): Promise<void> => {
    if (!selectedCustomer) return;
    const validItems = items.filter(
      item => item.title.trim() && item.unitPrice > 0
    );
    if (validItems.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Ajoutez au moins une prestation valide',
        variant: 'destructive',
      });
      return;
    }

    setStatus('creating');
    try {
      const clientType =
        selectedCustomer.type === 'professional'
          ? 'organization'
          : 'individual';
      const response = await fetch('/api/qonto/invoices/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedCustomer.id,
          clientType,
          items: validItems.map(item => ({
            title: item.title,
            description: item.description || undefined,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
          })),
          paymentTerms,
          reference: reference || undefined,
          issueDate,
          autoFinalize: false,
        }),
      });

      const data = (await response.json()) as IServiceInvoiceApiResponse;
      if (!response.ok || !data.success)
        throw new Error(data.error ?? 'Failed to create invoice');

      const localTotalTTC = validItems.reduce(
        (sum, item) =>
          sum + item.quantity * item.unitPrice * (1 + item.vatRate),
        0
      );
      setCreatedInvoice({
        ...data.invoice,
        total_amount: data.invoice.total_amount ?? localTotalTTC,
        invoice_number: data.invoice.invoice_number ?? 'Brouillon',
      });
      setStatus('success');
      toast({
        title: 'Facture créée',
        description: `Facture ${data.invoice.invoice_number ?? 'Brouillon'} créée avec succès`,
      });
      onSuccess?.(data.invoice.id);
    } catch (error) {
      setStatus('error');
      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Erreur lors de la création',
        variant: 'destructive',
      });
    }
  };

  const { totalHT, totalVAT, totalTTC } = calculateTotals();
  const isValid =
    selectedCustomer &&
    items.some(item => item.title.trim() && item.unitPrice > 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            {status === 'success'
              ? 'Facture créée'
              : 'Nouvelle facture de service'}
          </DialogTitle>
          <DialogDescription>
            {status === 'success'
              ? `Facture ${createdInvoice?.invoice_number} - ${formatAmount(createdInvoice?.total_amount ?? 0)}`
              : 'Créez une facture pour des prestations de services'}
          </DialogDescription>
        </DialogHeader>

        {status === 'success' && createdInvoice ? (
          <InvoiceServiceSuccessView
            createdInvoice={createdInvoice}
            formatAmount={formatAmount}
          />
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Client</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerSelector
                  selectedCustomer={selectedCustomer}
                  onCustomerChange={setSelectedCustomer}
                  disabled={status === 'creating'}
                />
              </CardContent>
            </Card>

            <InvoiceServiceItemsSection
              items={items}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onItemChange={handleItemChange}
              disabled={status === 'creating'}
            />

            <InvoiceServiceOptionsSection
              issueDate={issueDate}
              paymentTerms={paymentTerms}
              reference={reference}
              onIssueDateChange={setIssueDate}
              onPaymentTermsChange={setPaymentTerms}
              onReferenceChange={setReference}
            />

            <div className="flex justify-end">
              <div className="w-48 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total HT</span>
                  <span>{formatAmount(totalHT)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA</span>
                  <span>{formatAmount(totalVAT)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-bold">
                  <span>Total TTC</span>
                  <span>{formatAmount(totalTTC)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {status === 'success' ? (
            <Button onClick={handleClose}>Fermer</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={() => void handleCreateInvoice()}
                disabled={status === 'creating' || !isValid}
              >
                {status === 'creating' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Créer en brouillon
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
