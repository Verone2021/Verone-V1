'use client';

import { useState } from 'react';

import { useToast } from '@verone/common/hooks';
import { useCustomers } from '@verone/customers';
import { CreateIndividualCustomerModal } from '@verone/orders';
import { ButtonV2, IconButton } from '@verone/ui';
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
import {
  User,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Eye,
  Archive,
  ArchiveRestore,
} from 'lucide-react';

export default function ClientsParticuliersPage() {
  const { toast } = useToast();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Charger uniquement les clients particuliers (individual)
  const { customers, loading, error, refetch } = useCustomers({
    customerType: 'individual',
    search: searchQuery ?? undefined,
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

      await refetch();
    } catch (err) {
      console.error('Erreur suppression client:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le client.',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (customerId: string, customerName: string) => {
    try {
      const { error: updateError } = await supabase
        .from('individual_customers')
        .update({ is_active: false })
        .eq('id', customerId);

      if (updateError) throw updateError;

      toast({
        title: 'Client archivé',
        description: `${customerName} a été archivé.`,
      });

      await refetch();
    } catch (err) {
      console.error('Erreur archivage:', err);
      toast({
        title: 'Erreur',
        description: "Impossible d'archiver le client.",
        variant: 'destructive',
      });
    }
  };

  const handleUnarchive = async (customerId: string, customerName: string) => {
    try {
      const { error: updateError } = await supabase
        .from('individual_customers')
        .update({ is_active: true })
        .eq('id', customerId);

      if (updateError) throw updateError;

      toast({
        title: 'Client restauré',
        description: `${customerName} a été restauré.`,
      });

      await refetch();
    } catch (err) {
      console.error('Erreur restauration:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de restaurer le client.',
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
            onClick={() => {
              void refetch().catch(error => {
                console.error('[ClientsParticuliers] Refetch failed:', error);
              });
            }}
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
            onCustomerCreated={() => {
              void refetch().catch(error => {
                console.error('[ClientsParticuliers] Refetch failed:', error);
              });
            }}
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
        {/* Onglets Actifs/Archivés */}
        <div className="flex gap-2">
          <ButtonV2
            variant={activeTab === 'active' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('active')}
          >
            Actifs
          </ButtonV2>
          <ButtonV2
            variant={activeTab === 'archived' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('archived')}
          >
            Archivés
          </ButtonV2>
        </div>

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
              {
                customers.filter(c =>
                  activeTab === 'active'
                    ? (c as any).is_active !== false
                    : (c as any).is_active === false
                ).length
              }
            </span>{' '}
            client{customers.length > 1 ? 's' : ''}{' '}
            {activeTab === 'active' ? 'actif' : 'archivé'}
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
                  onCustomerCreated={() => {
                    void refetch().catch(error => {
                      console.error(
                        '[ClientsParticuliers] Refetch failed:',
                        error
                      );
                    });
                  }}
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers
                  .filter(c =>
                    activeTab === 'active'
                      ? (c as any).is_active !== false
                      : (c as any).is_active === false
                  )
                  .map(customer => (
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

                      {/* Actions - Pattern Catalogue IconButton */}
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          {activeTab === 'active' ? (
                            <>
                              {/* Bouton Voir */}
                              <IconButton
                                variant="outline"
                                size="sm"
                                icon={Eye}
                                label="Voir détails"
                                onClick={() => {
                                  toast({
                                    title: 'Détails client',
                                    description: `Fonctionnalité à venir pour ${customer.displayName}`,
                                  });
                                }}
                              />
                              {/* Bouton Archiver */}
                              <IconButton
                                variant="danger"
                                size="sm"
                                icon={Archive}
                                label="Archiver"
                                onClick={() => {
                                  void handleArchive(
                                    customer.id,
                                    customer.displayName
                                  ).catch(error => {
                                    console.error(
                                      '[ClientsParticuliers] Archive failed:',
                                      error
                                    );
                                  });
                                }}
                              />
                            </>
                          ) : (
                            <>
                              {/* Bouton Restaurer */}
                              <IconButton
                                variant="success"
                                size="sm"
                                icon={ArchiveRestore}
                                label="Restaurer"
                                onClick={() => {
                                  void handleUnarchive(
                                    customer.id,
                                    customer.displayName
                                  ).catch(error => {
                                    console.error(
                                      '[ClientsParticuliers] Unarchive failed:',
                                      error
                                    );
                                  });
                                }}
                              />
                              {/* Bouton Supprimer */}
                              <IconButton
                                variant="danger"
                                size="sm"
                                icon={Trash2}
                                label="Supprimer définitivement"
                                onClick={() => {
                                  void handleDelete(
                                    customer.id,
                                    customer.displayName
                                  ).catch(error => {
                                    console.error(
                                      '[ClientsParticuliers] Delete failed:',
                                      error
                                    );
                                  });
                                }}
                              />
                            </>
                          )}
                        </div>
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
