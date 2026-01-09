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
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  Plus,
  Send,
  Trash2,
  Briefcase,
} from 'lucide-react';

interface IServiceItem {
  id: string;
  title: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

interface IQuoteCreateServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (quoteId: string) => void;
}

type CreateStatus = 'idle' | 'creating' | 'success' | 'error';

interface CreatedQuote {
  id: string;
  quote_number: string;
  pdf_url?: string;
  public_url?: string;
  total_amount: number;
  currency: string;
}

function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function QuoteCreateServiceModal({
  open,
  onOpenChange,
  onSuccess,
}: IQuoteCreateServiceModalProps): React.ReactNode {
  const { toast } = useToast();
  const [status, setStatus] = useState<CreateStatus>('idle');
  // SUPPRIMÉ: autoFinalize - JAMAIS de finalisation automatique
  // Les devis sont TOUJOURS créés en brouillon
  const [createdQuote, setCreatedQuote] = useState<CreatedQuote | null>(null);

  // Client selection - using CustomerSelector
  const [selectedCustomer, setSelectedCustomer] =
    useState<UnifiedCustomer | null>(null);

  // Service items
  const [items, setItems] = useState<IServiceItem[]>([
    {
      id: generateId(),
      title: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: 0.2,
    },
  ]);

  // Quote options
  const [validityDays, setValidityDays] = useState<string>('30');
  const [reference, setReference] = useState<string>('');

  const resetState = useCallback((): void => {
    setStatus('idle');
    setCreatedQuote(null);
    setSelectedCustomer(null);
    setItems([
      {
        id: generateId(),
        title: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        vatRate: 0.2,
      },
    ]);
    setValidityDays('30');
    setReference('');
  }, []);

  const handleClose = useCallback((): void => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

  const handleAddItem = (): void => {
    setItems([
      ...items,
      {
        id: generateId(),
        title: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        vatRate: 0.2,
      },
    ]);
  };

  const handleRemoveItem = (id: string): void => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
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
    const totalTTC = totalHT + totalVAT;
    return { totalHT, totalVAT, totalTTC };
  };

  const handleCreateClick = (): void => {
    // Toujours créer en brouillon - pas de confirmation nécessaire
    void handleCreateQuote();
  };

  const handleCreateQuote = async (): Promise<void> => {
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
      // Map customer type for API
      const clientType =
        selectedCustomer.type === 'professional'
          ? 'organisation'
          : 'individual';

      const response = await fetch('/api/qonto/quotes/service', {
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
          validityDays: Number(validityDays),
          reference: reference || undefined,
          // FORCÉ: autoFinalize = false - TOUJOURS brouillon
          autoFinalize: false,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create quote');
      }

      setCreatedQuote(data.quote);
      setStatus('success');
      toast({
        title: 'Devis créé',
        description: `Devis ${data.quote.quote_number} créé avec succès`,
      });
      onSuccess?.(data.quote.id);
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

  const handleDownloadPdf = async (): Promise<void> => {
    if (!createdQuote?.id) return;

    try {
      const response = await fetch(`/api/qonto/quotes/${createdQuote.id}/pdf`);

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis-${createdQuote.quote_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'PDF téléchargé',
        description: 'Le devis a été téléchargé',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le PDF',
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
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            {status === 'success' ? 'Devis créé' : 'Nouveau devis de service'}
          </DialogTitle>
          <DialogDescription>
            {status === 'success'
              ? `Devis ${createdQuote?.quote_number} - ${formatAmount(createdQuote?.total_amount || 0)}`
              : 'Créez un devis pour des prestations de services'}
          </DialogDescription>
        </DialogHeader>

        {status === 'success' && createdQuote ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Devis créé avec succès
                </p>
                <p className="text-sm text-green-600">
                  N° {createdQuote.quote_number} -{' '}
                  {formatAmount(createdQuote.total_amount)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={!createdQuote.pdf_url}
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger PDF
              </Button>

              {createdQuote.public_url && (
                <Button variant="outline" asChild>
                  <a
                    href={createdQuote.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Voir sur Qonto
                  </a>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Client selection - using CustomerSelector component */}
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

            {/* Service items */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Prestations</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleAddItem}>
                    <Plus className="mr-1 h-4 w-4" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="space-y-2 rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Prestation {index + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Input
                        placeholder="Titre de la prestation"
                        value={item.title}
                        onChange={e =>
                          handleItemChange(item.id, 'title', e.target.value)
                        }
                      />
                      <Input
                        placeholder="Description (optionnel)"
                        value={item.description}
                        onChange={e =>
                          handleItemChange(
                            item.id,
                            'description',
                            e.target.value
                          )
                        }
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Quantité</Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e =>
                              handleItemChange(
                                item.id,
                                'quantity',
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Prix HT (€)</Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitPrice}
                            onChange={e =>
                              handleItemChange(
                                item.id,
                                'unitPrice',
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">TVA</Label>
                          <Select
                            value={String(item.vatRate)}
                            onValueChange={v =>
                              handleItemChange(item.id, 'vatRate', Number(v))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="0.055">5.5%</SelectItem>
                              <SelectItem value="0.1">10%</SelectItem>
                              <SelectItem value="0.2">20%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Options */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Validité du devis</Label>
                    <Select
                      value={validityDays}
                      onValueChange={setValidityDays}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 jours</SelectItem>
                        <SelectItem value="30">30 jours</SelectItem>
                        <SelectItem value="60">60 jours</SelectItem>
                        <SelectItem value="90">90 jours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Référence (optionnel)</Label>
                    <Input
                      placeholder="Ex: Projet 2026-001"
                      value={reference}
                      onChange={e => setReference(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Totaux */}
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

            {/* SUPPRIMÉ: Checkbox autoFinalize - Les devis sont TOUJOURS créés en brouillon */}
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
                onClick={handleCreateClick}
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
      {/* SUPPRIMÉ: AlertDialog de confirmation - Plus de finalisation automatique */}
    </Dialog>
  );
}
