/**
 * ClientsSection - Clients particuliers du canal Site Internet
 *
 * Affiche les individual_customers avec source_type='site-internet'.
 * Ces clients sont crees automatiquement par le checkout Stripe.
 */

'use client';

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Search, Mail, Phone, MapPin } from 'lucide-react';

const supabase = createClient();

interface SiteCustomer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

function useSiteCustomers() {
  return useQuery({
    queryKey: ['site-internet-customers'],
    queryFn: async (): Promise<SiteCustomer[]> => {
      // Show customers created from site-internet (source_type = 'site-internet')
      const { data, error } = await supabase
        .from('individual_customers')
        .select(
          'id, first_name, last_name, email, phone, city, postal_code, country, is_active, created_at, source_type'
        )
        .eq('is_active', true)
        .eq('source_type', 'site-internet')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('[ClientsSection] Fetch error:', error);
        throw error;
      }

      return data ?? [];
    },
    staleTime: 300_000,
  });
}

export function ClientsSection() {
  const [search, setSearch] = useState('');
  const { data: customers, isLoading, error } = useSiteCustomers();

  const filtered =
    customers?.filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase();
      return (
        name.includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.phone?.includes(q) ?? false) ||
        (c.city?.toLowerCase().includes(q) ?? false)
      );
    }) ?? [];

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-red-600">
          Erreur lors du chargement des clients.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Clients du site internet
              </CardTitle>
              <CardDescription>
                Clients particuliers crees via le checkout du site (
                {customers?.length ?? 0} clients)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recherche */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, email, ville..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {search
                ? 'Aucun client ne correspond a la recherche.'
                : 'Aucun client site internet pour le moment.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Inscrit le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.first_name} {customer.last_name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <Mail className="h-3.5 w-3.5" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <Phone className="h-3.5 w-3.5" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(customer.city ?? customer.postal_code) && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <MapPin className="h-3.5 w-3.5" />
                            {[customer.postal_code, customer.city]
                              .filter(Boolean)
                              .join(' ')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {customer.created_at
                          ? format(
                              new Date(customer.created_at),
                              'dd MMM yyyy',
                              { locale: fr }
                            )
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
