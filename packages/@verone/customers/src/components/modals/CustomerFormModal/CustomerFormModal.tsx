'use client';

import { useState, useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import type { AddressResult } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Separator } from '@verone/ui';

import { useOrganisations } from '@verone/organisations/hooks';

import {
  customerSchema,
  type CustomerFormData,
  type CustomerFormModalProps,
} from './schema';
import { AddressesSection } from './sections/AddressesSection';
import { CommercialSection } from './sections/CommercialSection';
import { ContactSection } from './sections/ContactSection';
import { EnseigneSection } from './sections/EnseigneSection';
import { EntrepriseSection } from './sections/EntrepriseSection';
import { LegalSection } from './sections/LegalSection';
import { NotesSection } from './sections/NotesSection';

export function CustomerFormModal({
  isOpen,
  onClose,
  onCustomerCreated,
  onCustomerUpdated,
  customer,
  mode = 'create',
}: CustomerFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createOrganisation, updateOrganisation } = useOrganisations();

  const form = useForm<CustomerFormData>({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any -- Type mismatch react-hook-form optionals vs Zod schema
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      country: 'FR',
      description: '',
      phone: '',
      website: '',
      is_active: true,
      customer_type: 'professional',
      legal_form: '',
      business_name: '',
      siren: '',
      siret: '',
      vat_number: '',
      payment_terms: '30',
      prepayment_required: false,
      currency: 'EUR',
      enseigne_id: null,
      is_enseigne_parent: false,
      ownership_type: null,
    },
  });

  useEffect(() => {
    if (mode === 'edit' && customer) {
      form.reset({
        name: customer.name ?? '',
        email: customer.email ?? '',
        country: customer.country ?? 'FR',
        description: customer.notes ?? '',
        phone: customer.phone ?? '',
        website: customer.website ?? '',
        is_active: customer.is_active ?? true,
        customer_type: 'professional',
        legal_form: customer.legal_form ?? '',
        business_name: customer.trade_name ?? '',
        siren: customer.siren ?? '',
        siret: customer.siret ?? '',
        vat_number: customer.vat_number ?? '',
        payment_terms:
          (customer.payment_terms as '0' | '30' | '60' | '90') ?? '30',
        prepayment_required: customer.prepayment_required ?? false,
        currency: customer.currency ?? 'EUR',
        enseigne_id: customer.enseigne_id ?? null,
        is_enseigne_parent: customer.is_enseigne_parent ?? false,
        ownership_type: customer.ownership_type ?? null,
      });
    }
  }, [mode, customer, form]);

  const handleSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);

    try {
      const customerData = {
        legal_name: data.name,
        trade_name: data.business_name ?? undefined,
        type: 'customer' as const,
        email: data.email ?? undefined,
        country: data.billing_country || data.country || 'FR',
        phone: data.phone ?? undefined,
        website: data.website ?? undefined,
        is_active: data.is_active,
        customer_type: data.customer_type,
        legal_form: data.legal_form ?? undefined,
        siren: data.siren ?? undefined,
        siret: data.siret ?? undefined,
        vat_number: data.vat_number ?? undefined,
        payment_terms: data.payment_terms ?? undefined,
        prepayment_required: data.prepayment_required,
        currency: data.currency,
        notes: data.description ?? undefined,
        enseigne_id: data.enseigne_id ?? undefined,
        is_enseigne_parent: data.is_enseigne_parent,
        ownership_type: data.ownership_type ?? undefined,
        billing_address_line1: data.billing_address_line1 ?? undefined,
        billing_address_line2: data.billing_address_line2 ?? undefined,
        billing_postal_code: data.billing_postal_code ?? undefined,
        billing_city: data.billing_city ?? undefined,
        billing_region: data.billing_region ?? undefined,
        billing_country: data.billing_country || 'FR',
        shipping_address_line1: data.shipping_address_line1 ?? undefined,
        shipping_address_line2: data.shipping_address_line2 ?? undefined,
        shipping_postal_code: data.shipping_postal_code ?? undefined,
        shipping_city: data.shipping_city ?? undefined,
        shipping_region: data.shipping_region ?? undefined,
        shipping_country: data.shipping_country || 'FR',
        has_different_shipping_address: data.has_different_shipping_address,
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
      };

      if (mode === 'edit' && customer) {
        const updated = await updateOrganisation({
          id: customer.id,
          ...customerData,
        });
        if (updated && onCustomerUpdated) {
          onCustomerUpdated(updated);
        }
      } else {
        const created = await createOrganisation(customerData);
        if (created && onCustomerCreated) {
          onCustomerCreated(created);
        }
      }

      form.reset();
      onClose();
    } catch (error) {
      console.error("❌ Erreur lors de l'opération sur le client:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleBillingAddressSelect = (address: AddressResult) => {
    form.setValue('billing_address_line1', address.streetAddress);
    form.setValue('billing_city', address.city);
    form.setValue('billing_postal_code', address.postalCode);
    form.setValue('billing_region', address.region ?? '');
    form.setValue('billing_country', address.countryCode ?? 'FR');
    if (!form.getValues('has_different_shipping_address')) {
      form.setValue('latitude', address.latitude || null);
      form.setValue('longitude', address.longitude || null);
    }
  };

  const handleShippingAddressSelect = (address: AddressResult) => {
    form.setValue('shipping_address_line1', address.streetAddress);
    form.setValue('shipping_city', address.city);
    form.setValue('shipping_postal_code', address.postalCode);
    form.setValue('shipping_region', address.region ?? '');
    form.setValue('shipping_country', address.countryCode ?? 'FR');
    form.setValue('latitude', address.latitude || null);
    form.setValue('longitude', address.longitude || null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5" />
            {mode === 'edit'
              ? 'Modifier le client professionnel'
              : 'Nouveau client professionnel'}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={e => {
            void form
              .handleSubmit(handleSubmit)(e)
              .catch((error: unknown) => {
                console.error('[CustomerFormModal] Submit failed:', error);
              });
          }}
          className="space-y-6"
        >
          <EnseigneSection form={form} />
          <Separator />
          <EntrepriseSection form={form} />
          <Separator />
          <LegalSection form={form} />
          <Separator />
          <AddressesSection
            form={form}
            onBillingAddressSelect={handleBillingAddressSelect}
            onShippingAddressSelect={handleShippingAddressSelect}
          />
          <Separator />
          <CommercialSection form={form} />
          <Separator />
          <ContactSection form={form} />
          <Separator />
          <NotesSection form={form} />
          <Separator />

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === 'edit' ? 'Mettre à jour' : 'Créer le client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
