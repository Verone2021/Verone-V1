/**
 * Packlink PRO Shipment Form
 * Formulaire standard conforme à la documentation Packlink officielle
 * Pré-remplit automatiquement les coordonnées client + expéditeur Vérone
 */

'use client';

import React, { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@verone/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Schema Zod pour le formulaire (correspond à validation.ts backend)
const addressSchema = z.object({
  name: z.string().min(1, 'Le prénom est obligatoire'),
  surname: z.string().min(1, 'Le nom de famille est obligatoire'),
  email: z.string().email('Email invalide'),
  phone: z
    .string()
    .min(10, 'Le téléphone doit contenir au moins 10 caractères'),
  street1: z.string().min(1, "L'adresse est obligatoire"),
  city: z.string().min(1, 'La ville est obligatoire'),
  zip_code: z.string().min(1, 'Le code postal est obligatoire'),
  country: z
    .string()
    .length(2, 'Le code pays doit être au format ISO (2 lettres)'),
  street2: z.string().optional(),
  company: z.string().optional(),
});

const packageSchema = z.object({
  weight: z.number().positive('Le poids doit être positif'),
  width: z.number().positive('La largeur doit être positive'),
  height: z.number().positive('La hauteur doit être positive'),
  length: z.number().positive('La longueur doit être positive'),
  quantity: z
    .number()
    .int()
    .positive('La quantité doit être un entier positif')
    .default(1),
});

const formSchema = z.object({
  from: addressSchema,
  to: addressSchema,
  packages: z.array(packageSchema).min(1, 'Au moins un colis est requis'),
  content: z.string(),
  contentvalue: z.number(),
});

type FormData = z.infer<typeof formSchema>;

interface PacklinkShipmentFormProps {
  salesOrderId: string;
  onSubmit: (data: FormData) => void | Promise<void>;
  isLoading?: boolean;
}

export function PacklinkShipmentForm({
  salesOrderId,
  onSubmit,
  isLoading = false,
}: PacklinkShipmentFormProps) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: {
        name: '',
        surname: '',
        email: '',
        phone: '',
        street1: '',
        city: '',
        zip_code: '',
        country: 'FR',
      },
      to: {
        name: '',
        surname: '',
        email: '',
        phone: '',
        street1: '',
        city: '',
        zip_code: '',
        country: 'FR',
      },
      packages: [
        {
          weight: 1,
          width: 10,
          height: 10,
          length: 10,
          quantity: 1,
        },
      ],
      content: 'Produits',
      contentvalue: 0,
    },
  });

  // Pré-remplissage automatique des coordonnées
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        // 1. Charger adresse client depuis API
        const response = await fetch(
          `/api/sales-orders/${salesOrderId}/customer-address`
        );
        if (response.ok) {
          const { address } = await response.json();

          // 2. Charger adresse expéditeur Vérone depuis .env
          const fromAddress = {
            name: process.env.NEXT_PUBLIC_VERONE_SENDER_NAME || 'Vérone',
            surname:
              process.env.NEXT_PUBLIC_VERONE_SENDER_SURNAME || 'Collections',
            email:
              process.env.NEXT_PUBLIC_VERONE_SENDER_EMAIL ||
              'contact@veronecollections.fr',
            phone:
              process.env.NEXT_PUBLIC_VERONE_SENDER_PHONE || '+33656720702',
            street1:
              process.env.NEXT_PUBLIC_VERONE_SENDER_STREET1 || '4 rue du Pérou',
            city: process.env.NEXT_PUBLIC_VERONE_SENDER_CITY || 'Massy',
            zip_code: process.env.NEXT_PUBLIC_VERONE_SENDER_ZIP || '91300',
            country: process.env.NEXT_PUBLIC_VERONE_SENDER_COUNTRY || 'FR',
          };

          // 3. Pré-remplir le formulaire
          form.reset({
            from: fromAddress,
            to: address,
            packages: [
              {
                weight: 1,
                width: 10,
                height: 10,
                length: 10,
                quantity: 1,
              },
            ],
            content: 'Produits',
            contentvalue: 0,
          });
        }
      } catch (error) {
        console.error('[PacklinkShipmentForm] Error loading addresses:', error);
      }
    };

    if (salesOrderId) {
      loadAddresses();
    }
  }, [salesOrderId, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* FROM - Expéditeur */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Expéditeur</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="from.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Jean" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="from.surname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Dupont" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="from.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="jean@example.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="from.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+33123456789" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="from.street1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="123 Rue de la Paix" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="from.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ville</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Paris" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="from.zip_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code postal</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="75001" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="from.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pays (ISO)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="FR" maxLength={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* TO - Destinataire */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Destinataire</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="to.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Marie" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="to.surname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Martin" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="to.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="marie@example.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="to.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+33987654321" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="to.street1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="456 Avenue Victor Hugo" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="to.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ville</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Lyon" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="to.zip_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code postal</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="69001" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="to.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pays (ISO)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="FR" maxLength={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* PACKAGES - Colis */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Colis</h3>

          <div className="grid grid-cols-5 gap-4">
            <FormField
              control={form.control}
              name="packages.0.weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poids (kg)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.1"
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="packages.0.width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Largeur (cm)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="1"
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="packages.0.height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hauteur (cm)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="1"
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="packages.0.length"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longueur (cm)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="1"
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="packages.0.quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantité</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="1"
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
