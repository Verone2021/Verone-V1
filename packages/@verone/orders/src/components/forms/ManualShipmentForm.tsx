/**
 * Manual Shipment Form
 * Formulaire pour créer une expédition manuelle (interne, sans Packlink)
 */

'use client';

import React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@verone/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  carrier_name: z.string().min(1, 'Le nom du transporteur est obligatoire'),
  tracking_number: z.string().optional(),
  notes: z.string().optional(),
  estimated_delivery_at: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ManualShipmentFormProps {
  salesOrderId: string;
  onSubmit: (data: FormData) => void | Promise<void>;
  isLoading?: boolean;
}

export function ManualShipmentForm({
  salesOrderId,
  onSubmit,
  isLoading = false,
}: ManualShipmentFormProps) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      carrier_name: '',
      tracking_number: '',
      notes: '',
      estimated_delivery_at: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="carrier_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transporteur *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Colissimo, DPD, Chronopost..." />
              </FormControl>
              <FormDescription>
                Nom du transporteur utilisé pour cette expédition
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tracking_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de suivi</FormLabel>
              <FormControl>
                <Input {...field} placeholder="123456789" />
              </FormControl>
              <FormDescription>
                Numéro de tracking fourni par le transporteur (optionnel)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estimated_delivery_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date de livraison estimée</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormDescription>
                Date estimée de livraison (optionnel)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Notes additionnelles..."
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                Informations complémentaires sur cette expédition (optionnel)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Création...' : 'Créer expédition'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
