'use client';

import { useState, useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@verone/common';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@verone/ui';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@verone/ui';
import { Input, Textarea } from '@verone/ui';
import { ButtonV2, Checkbox } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  Package,
  Truck,
  MapPin,
  User,
  Mail,
  Phone,
  Search,
  AlertCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { PackagesBuilder, PackageData } from '../shipments/PackagesBuilder';
import type { PacklinkService } from '../shipments/ServiceSelector';
import { ServiceSelector } from '../shipments/ServiceSelector';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  quantity_shipped: number;
}

interface CreateShipmentModalProps {
  open: boolean;
  onClose: () => void;
  salesOrderId: string;
  onSuccess?: () => void;
}

// Schema validation avec packages
const shipmentSchema = z.object({
  // Destinataire
  recipient_name: z.string().min(1, 'Nom requis'),
  recipient_surname: z.string().optional(),
  recipient_email: z.string().email('Email invalide').min(1, 'Email requis'),
  recipient_phone: z.string().min(1, 'Téléphone requis'),

  // Adresse livraison
  shipping_street: z.string().min(1, 'Adresse requise'),
  shipping_city: z.string().min(1, 'Ville requise'),
  shipping_zip: z.string().min(1, 'Code postal requis'),
  shipping_country: z.string().min(1, 'Pays requis'),

  // Articles à expédier
  items: z
    .array(
      z.object({
        sales_order_item_id: z.string(),
        quantity: z.number().min(1),
        selected: z.boolean(),
      })
    )
    .refine(items => items.some(item => item.selected), {
      message: 'Vous devez sélectionner au moins un article',
    }),

  // Colis (packages)
  packages: z
    .array(
      z.object({
        width: z.number().min(1),
        height: z.number().min(1),
        length: z.number().min(1),
        weight: z.number().min(0.1),
      })
    )
    .min(1, 'Au moins un colis requis'),

  // Service Packlink
  service_id: z.number().min(1, 'Service Packlink requis'),

  // Notes
  notes: z.string().optional(),
});

type ShipmentFormData = z.infer<typeof shipmentSchema>;

export function CreateShipmentModal({
  open,
  onClose,
  salesOrderId,
  onSuccess,
}: CreateShipmentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Services Packlink
  const [services, setServices] = useState<PacklinkService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [servicesSearched, setServicesSearched] = useState(false);

  const form = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      recipient_name: '',
      recipient_surname: '',
      recipient_email: '',
      recipient_phone: '',
      shipping_street: '',
      shipping_city: '',
      shipping_zip: '',
      shipping_country: 'FR',
      items: [],
      packages: [{ width: 30, height: 30, length: 30, weight: 1 }],
      service_id: 0,
      notes: '',
    },
  });

  // Charger données commande + client quand modal s'ouvre
  useEffect(() => {
    if (!open) return;

    async function loadOrderAndCustomer() {
      setLoadingData(true);
      const supabase = createClient();

      try {
        // 1. Récupérer commande avec items
        const { data: order, error: orderError } = await supabase
          .from('sales_orders')
          .select(
            `
            id,
            order_number,
            customer_id,
            customer_type,
            shipping_address,
            sales_order_items (
              id,
              product_id,
              quantity,
              quantity_shipped,
              products (
                name
              )
            )
          `
          )
          .eq('id', salesOrderId)
          .single();

        if (orderError || !order) {
          toast({
            title: 'Erreur',
            description: 'Impossible de charger la commande',
            variant: 'destructive',
          });
          setLoadingData(false);
          return;
        }

        // 2. Préparer items avec quantités restantes
        const items = (order.sales_order_items as any[]).map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.products?.name || 'Produit inconnu',
          quantity: item.quantity,
          quantity_shipped: item.quantity_shipped || 0,
        }));

        const itemsWithRemaining = items.map(item => ({
          ...item,
          remaining: item.quantity - item.quantity_shipped,
        }));

        setOrderItems(itemsWithRemaining);

        // 3. Récupérer client selon type
        let customerName = '';
        let customerSurname = '';
        let customerEmail = '';
        let customerPhone = '';

        if (order.customer_type === 'organization' && order.customer_id) {
          const { data: org } = await supabase
            .from('organisations')
            .select('legal_name, trade_name, email, phone')
            .eq('id', order.customer_id)
            .single();

          if (org) {
            // Division du nom légal pour Packlink
            // Ex: "SARL Dupont Mobilier" → surname="SARL", name="Dupont Mobilier"
            const legalName = org.legal_name || org.trade_name || '';
            if (legalName) {
              const parts = legalName.split(' ', 2); // Split sur premier espace seulement
              if (parts.length > 1) {
                customerSurname = parts[0]; // "SARL", "SAS", "EURL", etc.
                customerName = parts.slice(1).join(' '); // Reste du nom
              } else {
                // Si pas d'espace, mettre tout dans name
                customerName = legalName;
              }
            }
            customerEmail = org.email || '';
            customerPhone = org.phone || '';
          }
        } else if (order.customer_type === 'individual' && order.customer_id) {
          const { data: individual } = await supabase
            .from('individual_customers')
            .select('first_name, last_name, email, phone')
            .eq('id', order.customer_id)
            .single();

          if (individual) {
            customerName = individual.first_name || '';
            customerSurname = individual.last_name || '';
            customerEmail = individual.email || '';
            customerPhone = individual.phone || '';
          }
        }

        // 4. Parser adresse livraison avec fallbacks intelligents
        const shippingAddr = order.shipping_address as any;
        let street = '';
        let city = '';
        let zip = '';
        let country = 'FR';

        if (typeof shippingAddr === 'string') {
          // Adresse en format texte - tentative d'extraction intelligente
          street = shippingAddr;

          // Tentative extraction code postal français (5 chiffres)
          const zipMatch = shippingAddr.match(/\b\d{5}\b/);
          if (zipMatch) {
            zip = zipMatch[0];
            // Essayer d'extraire la ville après le code postal
            const cityMatch = shippingAddr.match(
              /\d{5}\s+([A-ZÀ-Ü][a-zà-ü\s-]+)/i
            );
            if (cityMatch) {
              city = cityMatch[1].trim();
            }
          }

          // Si parsing incomplet, afficher un avertissement
          if (!city || !zip) {
            toast({
              title: 'Adresse incomplète détectée',
              description:
                "Veuillez vérifier et compléter l'adresse de livraison manuellement",
              variant: 'default',
            });
          }
        } else if (shippingAddr) {
          // Adresse structurée JSONB - multiples fallbacks
          street =
            shippingAddr.street1 ||
            shippingAddr.address ||
            shippingAddr.address_line1 ||
            '';
          city = shippingAddr.city || '';
          zip =
            shippingAddr.zip_code ||
            shippingAddr.postal_code ||
            shippingAddr.zipcode ||
            '';
          country = shippingAddr.country || 'FR';
        }

        // 5. Pré-remplir le formulaire
        form.reset({
          recipient_name: customerName,
          recipient_surname: customerSurname,
          recipient_email: customerEmail,
          recipient_phone: customerPhone,
          shipping_street: street,
          shipping_city: city,
          shipping_zip: zip,
          shipping_country: country,
          items: itemsWithRemaining.map(item => ({
            sales_order_item_id: item.id,
            quantity: item.remaining,
            selected: false,
          })),
          packages: [{ width: 30, height: 30, length: 30, weight: 1 }],
          service_id: 0,
          notes: '',
        });

        // 6. Reset services
        setServices([]);
        setServicesSearched(false);
        setServicesError(null);
      } catch (error) {
        console.error('[CreateShipmentModal] Load error:', error);
        toast({
          title: 'Erreur',
          description: 'Erreur lors du chargement des données',
          variant: 'destructive',
        });
      } finally {
        setLoadingData(false);
      }
    }

    loadOrderAndCustomer();
  }, [open, salesOrderId]);

  // Fonction de recherche des services Packlink
  const searchServices = async () => {
    setServicesLoading(true);
    setServicesError(null);

    try {
      // Récupérer les valeurs du formulaire
      const formValues = form.getValues();

      // Validation minimale
      if (
        !formValues.shipping_street ||
        !formValues.shipping_city ||
        !formValues.shipping_zip
      ) {
        setServicesError('Adresse de livraison incomplète');
        setServicesLoading(false);
        return;
      }

      if (!formValues.packages || formValues.packages.length === 0) {
        setServicesError('Au moins un colis requis');
        setServicesLoading(false);
        return;
      }

      // Préparer la requête avec expéditeur Vérone en dur
      const payload = {
        from: {
          street1: '4 rue du Pérou',
          city: 'Massy',
          zip_code: '91300',
          country: 'FR',
        },
        to: {
          street1: formValues.shipping_street,
          city: formValues.shipping_city,
          zip_code: formValues.shipping_zip,
          country: formValues.shipping_country,
        },
        packages: formValues.packages,
      };

      // Appeler l'API
      const response = await fetch('/api/packlink/search-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur recherche services');
      }

      const data = await response.json();
      setServices(data.services || []);
      setServicesSearched(true);

      if (!data.services || data.services.length === 0) {
        setServicesError('Aucun service disponible pour cette destination');
      }
    } catch (error) {
      console.error('[CreateShipmentModal] Search services error:', error);
      setServicesError(
        error instanceof Error ? error.message : 'Erreur recherche services'
      );
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  const handleSubmit = async (data: ShipmentFormData) => {
    setLoading(true);

    try {
      // Filtrer items sélectionnés
      const selectedItems = data.items
        .filter(item => item.selected)
        .map(item => ({
          sales_order_item_id: item.sales_order_item_id,
          quantity: item.quantity,
        }));

      if (selectedItems.length === 0) {
        toast({
          title: 'Erreur',
          description: 'Vous devez sélectionner au moins un article',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const payload = {
        sales_order_id: salesOrderId,
        items: selectedItems,
        packages: data.packages,
        service_id: data.service_id,
        recipient: {
          name: data.recipient_name,
          surname: data.recipient_surname || '',
          email: data.recipient_email,
          phone: data.recipient_phone,
        },
        shipping_address: {
          street1: data.shipping_street,
          city: data.shipping_city,
          zip_code: data.shipping_zip,
          country: data.shipping_country,
        },
        notes: data.notes,
      };

      // Appeler API création shipment
      const response = await fetch('/api/sales-shipments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur création expédition');
      }

      const result = await response.json();

      toast({
        title: 'Expédition créée',
        description: `Expédition créée avec succès. Référence: ${result.packlink?.shipment_reference || 'N/A'}`,
        variant: 'default',
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('[CreateShipmentModal] Error:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : "Impossible de créer l'expédition",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Créer une expédition
          </DialogTitle>
          <DialogDescription>
            Configurez l'expédition avec les informations du destinataire et les
            colis
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">Chargement des données...</p>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {/* SECTION 1: Informations destinataire */}
              <div className="space-y-4 border-b pb-6">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Destinataire</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recipient_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom / Raison sociale</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom du destinataire" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recipient_surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom (optionnel)</FormLabel>
                        <FormControl>
                          <Input placeholder="Prénom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recipient_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@exemple.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recipient_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Téléphone
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+33 6 12 34 56 78" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* SECTION 2: Adresse livraison */}
              <div className="space-y-4 border-b pb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">
                    Adresse de livraison
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="shipping_street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Input placeholder="12 rue de la Paix" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="shipping_city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ville</FormLabel>
                          <FormControl>
                            <Input placeholder="Paris" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shipping_zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code postal</FormLabel>
                          <FormControl>
                            <Input placeholder="75001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shipping_country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pays</FormLabel>
                          <FormControl>
                            <Input placeholder="FR" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Articles à expédier */}
              <div className="space-y-4 border-b pb-6">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Articles à expédier</h3>
                </div>

                <div className="border rounded-md divide-y">
                  {orderItems.map((item, index) => {
                    const remaining = item.quantity - item.quantity_shipped;
                    return (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name={`items.${index}.selected`}
                        render={({ field }) => (
                          <div className="p-4 flex items-center gap-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={remaining === 0}
                              />
                            </FormControl>

                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {item.product_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {remaining} unité{remaining > 1 ? 's' : ''}{' '}
                                restante{remaining > 1 ? 's' : ''}
                              </p>
                            </div>

                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field: quantityField }) => (
                                <FormItem className="w-24">
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={remaining}
                                      disabled={
                                        !form.watch(
                                          `items.${index}.selected`
                                        ) || remaining === 0
                                      }
                                      {...quantityField}
                                      onChange={e =>
                                        quantityField.onChange(
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      />
                    );
                  })}
                </div>
                {form.formState.errors.items?.root && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.items.root.message}
                  </p>
                )}
              </div>

              {/* SECTION 4: Colis (Packages) */}
              <div className="space-y-4 border-b pb-6">
                <PackagesBuilder
                  packages={form.watch('packages')}
                  onChange={packages => form.setValue('packages', packages)}
                />
                {form.formState.errors.packages && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.packages.message}
                  </p>
                )}
              </div>

              {/* SECTION 5: Services Packlink */}
              <div className="space-y-4 border-b pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">
                      Service de transport
                    </h3>
                  </div>
                  <ButtonV2
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={searchServices}
                    loading={servicesLoading}
                    icon={Search}
                  >
                    Rechercher services
                  </ButtonV2>
                </div>

                {/* Erreur recherche */}
                {servicesError && !servicesLoading && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">{servicesError}</p>
                  </div>
                )}

                {/* ServiceSelector */}
                {servicesSearched && (
                  <ServiceSelector
                    services={services}
                    selectedServiceId={form.watch('service_id')}
                    onSelect={serviceId =>
                      form.setValue('service_id', serviceId)
                    }
                    loading={servicesLoading}
                  />
                )}

                {/* Message si pas encore recherché */}
                {!servicesSearched && !servicesLoading && (
                  <div className="text-center py-8 border rounded-lg bg-muted/20">
                    <Truck className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground font-medium mb-1">
                      Cliquez sur "Rechercher services" pour voir les options
                      disponibles
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Les services seront recherchés selon l'adresse et les
                      colis configurés
                    </p>
                  </div>
                )}

                {form.formState.errors.service_id && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.service_id.message}
                  </p>
                )}
              </div>

              {/* SECTION 6: Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Instructions spéciales pour l'expédition..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <ButtonV2
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Annuler
                </ButtonV2>
                <ButtonV2 type="submit" loading={loading}>
                  <Package className="h-4 w-4 mr-2" />
                  Créer l'expédition
                </ButtonV2>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
