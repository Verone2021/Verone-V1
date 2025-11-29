'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { useToast } from '@verone/common/hooks';
import { useCustomers } from '@verone/customers';
import { CreateIndividualCustomerModal } from '@verone/orders';
import { ButtonV2 } from '@verone/ui';
import { Input } from '@verone/ui';
import { Badge } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  User,
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Eye,
  Edit,
} from 'lucide-react';

export default function ClientsParticuliersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState('');

  // Charger uniquement les clients particuliers (individual)
  const { customers, loading, error, refetch } = useCustomers({
    customerType: 'individual',
    search: searchQuery || undefined,
  });

  const handleDelete = async (customerId: string, customerName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${customerName}" ?`)) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('individual_customers')
        .delete()
        .eq('id', customerId);

      if (deleteError) throw deleteError;

      toast({
        title: 'Client supprimé',
        description: `${customerName} a été supprimé avec succès.`,
      });

      refetch();
    } catch (err) {
      console.error('Erreur suppression client:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le client.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (
    customerId: string,
    currentStatus: boolean,
    customerName: string
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('individual_customers')
        .update({ is_active: !currentStatus })
        .eq('id', customerId);

      if (updateError) throw updateError;

      toast({
        title: currentStatus ? 'Client désactivé' : 'Client activé',
        description: `${customerName} a été ${currentStatus ? 'désactivé' : 'activé'}.`,
      });

      refetch();
    } catch (err) {
      console.error('Erreur changement statut:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">
            Chargement des clients particuliers...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur: {error}</p>
          <ButtonV2
            variant="primary"
            onClick={() => refetch()}
            className="mt-4"
          >
            Réessayer
          </ButtonV2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Clients Particuliers
            </h1>
            <p className="text-sm text-slate-600">
              Gestion des clients B2C (particuliers)
            </p>
          </div>
          <CreateIndividualCustomerModal
            onCustomerCreated={() => refetch()}
            trigger={
              <ButtonV2 variant="primary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau client
              </ButtonV2>
            }
          />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Barre de recherche et stats */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher par nom, prénom ou email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 border-slate-300"
            />
          </div>
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              {customers.length}
            </span>{' '}
            client{customers.length > 1 ? 's' : ''} particulier
            {customers.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Table des clients */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {customers.length === 0 ? (
            <div className="p-12 text-center">
              <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Aucun client particulier
              </h3>
              <p className="text-slate-500 mb-4">
                {searchQuery
                  ? 'Aucun résultat pour cette recherche.'
                  : 'Commencez par créer votre premier client particulier.'}
              </p>
              {!searchQuery && (
                <CreateIndividualCustomerModal
                  onCustomerCreated={() => refetch()}
                  trigger={
                    <ButtonV2 variant="primary" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un client
                    </ButtonV2>
                  }
                />
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map(customer => (
                  <TableRow key={customer.id}>
                    {/* Nom */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {customer.displayName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {customer.first_name} {customer.last_name}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact */}
                    <TableCell>
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Mail className="h-3 w-3" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Adresse */}
                    <TableCell>
                      {customer.city || customer.postal_code ? (
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {[customer.postal_code, customer.city]
                              .filter(Boolean)
                              .join(' ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </TableCell>

                    {/* Statut */}
                    <TableCell>
                      <Badge
                        variant={
                          (customer as any).is_active !== false
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {(customer as any).is_active !== false
                          ? 'Actif'
                          : 'Inactif'}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <ButtonV2 variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </ButtonV2>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleActive(
                                customer.id,
                                (customer as any).is_active !== false,
                                customer.displayName
                              )
                            }
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {(customer as any).is_active !== false
                              ? 'Désactiver'
                              : 'Activer'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDelete(customer.id, customer.displayName)
                            }
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
