'use client';

/**
 * Page détail enseigne - Version professionnelle 2025
 *
 * Features:
 * - Header avec logo, nom, statut
 * - 4 KPIs business (organisations, CA total, CA moyen, villes)
 * - Répartition géographique avec barres CA
 * - Tableau organisations avec CA par membre
 * - Modal deux colonnes pour gestion organisations
 *
 * @module EnseigneDetailPage
 */

import { useState, useCallback, useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import {
  useEnseigne,
  useEnseignes,
  useEnseigneStats,
  useEnseigneMapData,
  OrganisationSelectorModal,
  EnseigneDetailHeader,
  EnseigneKPIGrid,
  EnseigneMapSection,
  EnseigneOrganisationsTable,
} from '@verone/organisations';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Label } from '@verone/ui';
import { Switch } from '@verone/ui';
import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  ArrowLeft,
  Loader2,
  Package,
  Building2,
  MapPin,
  Store,
  Sparkles,
  Globe,
  Phone,
  Plus,
  X,
  Mail,
  Users,
} from 'lucide-react';

import {
  ContactCardBO,
  CreateNewContactCard,
} from '../../../canaux-vente/linkme/components/contacts/ContactCardBO';
import {
  useEnseigneContactsBO,
  useCreateContactBO,
} from '../../../canaux-vente/linkme/hooks/use-organisation-contacts-bo';

// Interface pour les produits de l'enseigne
interface EnseigneProduct {
  id: string;
  name: string;
  sku: string | null;
  product_status: string;
  created_at: string | null;
  primary_image_url?: string | null;
}

// Interface pour les canaux de vente de l'enseigne
interface EnseigneChannel {
  code: 'linkme' | 'site-internet' | 'b2b';
  name: string;
  link: string;
  isActive: boolean;
}

export default function EnseigneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const enseigneId = params.id as string;

  const supabase = createClient();

  // Filtre annee pour KPIs
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Hooks donnees
  const {
    enseigne,
    loading,
    error,
    refetch: refetchEnseigne,
  } = useEnseigne(enseigneId);
  const {
    updateEnseigne,
    deleteEnseigne,
    linkOrganisationToEnseigne,
    unlinkOrganisationFromEnseigne,
  } = useEnseignes();
  const {
    stats,
    loading: statsLoading,
    refetch: refetchStats,
  } = useEnseigneStats(enseigneId, selectedYear);
  const { data: mapData, loading: mapLoading } = useEnseigneMapData(enseigneId);

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Contacts enseigne
  const { data: contactsData, isLoading: contactsLoading } =
    useEnseigneContactsBO(enseigneId);
  const createContactMutation = useCreateContactBO();
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    isBillingContact: false,
    isPrimaryContact: false,
    isCommercialContact: false,
    isTechnicalContact: false,
  });

  const handleCreateEnseigneContact = () => {
    if (!newContact.firstName || !newContact.lastName || !newContact.email)
      return;
    void createContactMutation
      .mutateAsync({
        enseigneId,
        firstName: newContact.firstName,
        lastName: newContact.lastName,
        email: newContact.email,
        phone: newContact.phone || undefined,
        title: newContact.title || undefined,
        isBillingContact: newContact.isBillingContact,
        isPrimaryContact: newContact.isPrimaryContact,
        isCommercialContact: newContact.isCommercialContact,
        isTechnicalContact: newContact.isTechnicalContact,
      })
      .then(() => {
        setShowCreateContact(false);
        setNewContact({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          title: '',
          isBillingContact: false,
          isPrimaryContact: false,
          isCommercialContact: false,
          isTechnicalContact: false,
        });
      })
      .catch((err: unknown) => {
        console.error('[EnseigneDetail] Create contact failed:', err);
      });
  };

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isOrganisationModalOpen, setIsOrganisationModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    is_active: true,
  });

  // État pour les produits de l'enseigne
  const [enseigneProducts, setEnseigneProducts] = useState<EnseigneProduct[]>(
    []
  );
  const [productsLoading, setProductsLoading] = useState(false);

  // État pour les canaux de vente de l'enseigne
  const [enseigneChannels, setEnseigneChannels] = useState<EnseigneChannel[]>(
    []
  );

  // Charger les produits de cette enseigne
  useEffect(() => {
    async function fetchEnseigneProducts() {
      if (!enseigneId) return;
      setProductsLoading(true);
      try {
        const { data } = await supabase
          .from('products')
          .select(
            `id, name, sku, product_status, created_at,
            product_images!left(public_url, is_primary)`
          )
          .eq('enseigne_id', enseigneId)
          .order('created_at', { ascending: false });

        // Mapper les données avec l'image primaire
        const mappedProducts: EnseigneProduct[] = (data ?? []).map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          product_status: p.product_status,
          created_at: p.created_at,
          primary_image_url:
            (
              p.product_images as { public_url: string; is_primary: boolean }[]
            )?.find(img => img.is_primary)?.public_url ?? null,
        }));
        setEnseigneProducts(mappedProducts);
      } catch (err) {
        console.error('Erreur chargement produits enseigne:', err);
      } finally {
        setProductsLoading(false);
      }
    }
    void fetchEnseigneProducts().catch(error => {
      console.error('[EnseigneDetail] Fetch products failed:', error);
    });
  }, [enseigneId, supabase]);

  // Charger les canaux de vente de cette enseigne
  useEffect(() => {
    async function fetchEnseigneChannels() {
      if (!enseigneId) return;

      const channels: EnseigneChannel[] = [];

      try {
        // 1. Vérifier si compte LinkMe existe
        // Requête: linkme_affiliates via organisations.enseigne_id
        const { data: linkmeAffiliate } = await supabase
          .from('linkme_affiliates')
          .select(
            `
            id,
            status,
            organisation:organisations!organisation_id(enseigne_id)
          `
          )
          .not('organisation_id', 'is', null)
          .single();

        // Vérifier si l'affiliate est lié à cette enseigne via son organisation
        if (linkmeAffiliate) {
          const org = linkmeAffiliate.organisation as {
            enseigne_id: string | null;
          };
          if (org?.enseigne_id === enseigneId) {
            channels.push({
              code: 'linkme',
              name: 'LinkMe',
              link: `/canaux-vente/linkme/enseignes/${enseigneId}`,
              isActive: linkmeAffiliate.status === 'active',
            });
          }
        }

        // 2. TODO: Vérifier autres canaux (Site Internet, etc.)
        // Pour l'instant, pas d'autres canaux implémentés

        setEnseigneChannels(channels);
      } catch (err) {
        console.error('Erreur chargement canaux enseigne:', err);
      }
    }
    void fetchEnseigneChannels().catch(error => {
      console.error('[EnseigneDetail] Fetch channels failed:', error);
    });
  }, [enseigneId, supabase]);

  // Refresh tout
  const handleRefresh = useCallback(() => {
    void refetchEnseigne().catch(error => {
      console.error('[EnseigneDetail] Refetch enseigne failed:', error);
    });
    void refetchStats().catch(error => {
      console.error('[EnseigneDetail] Refetch stats failed:', error);
    });
  }, [refetchEnseigne, refetchStats]);

  // Ouvrir modal édition
  const handleOpenEditModal = () => {
    if (enseigne) {
      setFormData({
        name: enseigne.name,
        description: enseigne.description ?? '',
        logo_url: enseigne.logo_url ?? '',
        is_active: enseigne.is_active,
      });
      setIsEditModalOpen(true);
    }
  };

  // Soumettre édition
  const handleSubmitEdit = async () => {
    if (!enseigne || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateEnseigne({
        id: enseigne.id,
        ...formData,
      });
      setIsEditModalOpen(false);
      handleRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supprimer enseigne
  const handleDelete = async () => {
    if (!enseigne) return;

    setIsSubmitting(true);
    try {
      const success = await deleteEnseigne(enseigne.id);
      if (success) {
        router.push('/contacts-organisations/enseignes');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sauvegarder organisations depuis le modal deux colonnes
  const handleSaveOrganisations = async (
    organisationIds: string[],
    parentId: string | null
  ): Promise<boolean> => {
    if (!enseigne) return false;

    try {
      // 1. Récupérer les IDs actuels
      const currentIds = new Set(enseigne.organisations?.map(o => o.id) ?? []);
      const newIds = new Set(organisationIds);

      // 2. Organisations à ajouter
      const toAdd = organisationIds.filter(id => !currentIds.has(id));

      // 3. Organisations à retirer
      const toRemove = [...currentIds].filter(id => !newIds.has(id));

      // 4. Exécuter les ajouts
      for (const orgId of toAdd) {
        const isParent = orgId === parentId;
        await linkOrganisationToEnseigne(orgId, enseigne.id, isParent);
      }

      // 5. Exécuter les retraits
      for (const orgId of toRemove) {
        await unlinkOrganisationFromEnseigne(orgId);
      }

      // 6. Mettre à jour le parent si changé
      // Si le parent a changé, mettre à jour les flags
      const currentParent = enseigne.organisations?.find(
        o => o.is_enseigne_parent
      );
      if (currentParent?.id !== parentId) {
        // Reset ancien parent
        if (currentParent && newIds.has(currentParent.id)) {
          await supabase
            .from('organisations')
            .update({ is_enseigne_parent: false })
            .eq('id', currentParent.id);
        }
        // Set nouveau parent
        if (parentId && newIds.has(parentId)) {
          await supabase
            .from('organisations')
            .update({ is_enseigne_parent: true })
            .eq('id', parentId);
        }
      }

      handleRefresh();
      return true;
    } catch (err) {
      console.error('Erreur sauvegarde organisations:', err);
      return false;
    }
  };

  // Retirer une organisation depuis le tableau
  const handleRemoveOrganisation = async (organisationId: string) => {
    await unlinkOrganisationFromEnseigne(organisationId);
    handleRefresh();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-24 bg-white rounded-lg border" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-white rounded-lg border" />
              ))}
            </div>
            <div className="h-64 bg-white rounded-lg border" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-red-600">
                <p className="text-lg font-medium">Erreur</p>
                <p className="mt-2">{error}</p>
                <Link href="/contacts-organisations/enseignes">
                  <ButtonV2 variant="ghost" className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour aux enseignes
                  </ButtonV2>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Not found state
  if (!enseigne) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium">Enseigne non trouvée</p>
                <p className="mt-2">
                  L'enseigne demandée n'existe pas ou a été supprimée.
                </p>
                <Link href="/contacts-organisations/enseignes">
                  <ButtonV2 variant="ghost" className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour aux enseignes
                  </ButtonV2>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <EnseigneDetailHeader
        enseigne={enseigne}
        onEdit={handleOpenEditModal}
        onManageOrganisations={() => setIsOrganisationModalOpen(true)}
      />

      {/* Contenu principal */}
      <div className="container mx-auto px-6 pt-4 space-y-4">
        {/* Section Canaux de Vente */}
        {enseigneChannels.length > 0 && (
          <Card className="border-purple-200 bg-purple-50/30">
            <CardContent className="py-3">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Canaux de vente:
                </span>
                <div className="flex flex-wrap gap-2">
                  {enseigneChannels.map(channel => (
                    <Link key={channel.code} href={channel.link}>
                      <Badge
                        variant={channel.isActive ? 'default' : 'outline'}
                        className={cn(
                          'cursor-pointer hover:opacity-80 transition-opacity',
                          channel.code === 'linkme' &&
                            'bg-purple-600 hover:bg-purple-700 text-white',
                          channel.code === 'site-internet' &&
                            'bg-blue-600 hover:bg-blue-700 text-white',
                          channel.code === 'b2b' &&
                            'bg-emerald-600 hover:bg-emerald-700 text-white'
                        )}
                      >
                        {channel.code === 'linkme' && (
                          <Sparkles className="h-3 w-3 mr-1" />
                        )}
                        {channel.code === 'site-internet' && (
                          <Globe className="h-3 w-3 mr-1" />
                        )}
                        {channel.code === 'b2b' && (
                          <Building2 className="h-3 w-3 mr-1" />
                        )}
                        {channel.name}
                        {!channel.isActive && (
                          <span className="ml-1 text-xs opacity-70">
                            (inactif)
                          </span>
                        )}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hook jaune - Organisation Mère */}
        {stats?.parentOrganisation && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-900">
                    {stats.parentOrganisation.trade_name ??
                      stats.parentOrganisation.legal_name}
                  </span>
                  <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                    Siege
                  </span>
                </div>
                {(stats.parentOrganisation.siret ??
                  stats.parentOrganisation.siren) && (
                  <div className="text-sm text-amber-800">
                    <span className="font-medium">
                      {stats.parentOrganisation.siret ? 'SIRET' : 'SIREN'}:
                    </span>{' '}
                    {stats.parentOrganisation.siret ??
                      stats.parentOrganisation.siren}
                  </div>
                )}
                {(stats.parentOrganisation.billing_address_line1 ??
                  stats.parentOrganisation.billing_postal_code ??
                  stats.parentOrganisation.billing_city) && (
                  <div className="flex items-center gap-1.5 text-sm text-amber-800">
                    <MapPin className="h-3.5 w-3.5" />
                    {[
                      stats.parentOrganisation.billing_address_line1,
                      stats.parentOrganisation.billing_postal_code,
                      stats.parentOrganisation.billing_city,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtre annee + KPIs */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-600">Indicateurs</h2>
          <div className="flex items-center gap-2">
            {[null, 2024, 2025, 2026].map(y => (
              <button
                key={y ?? 'all'}
                onClick={() => setSelectedYear(y)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                  selectedYear === y
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {y ?? 'Toutes'}
              </button>
            ))}
          </div>
        </div>
        <EnseigneKPIGrid stats={stats} loading={statsLoading} />

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            variant="underline"
            className="w-full justify-start border-b"
          >
            <TabsTrigger value="overview" variant="underline">
              <Building2 className="h-4 w-4 mr-2" />
              Vue d&apos;ensemble
            </TabsTrigger>
            <TabsTrigger value="contacts" variant="underline">
              <Phone className="h-4 w-4 mr-2" />
              Contacts ({contactsData?.contacts.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="geography" variant="underline">
              <MapPin className="h-4 w-4 mr-2" />
              Geographie
            </TabsTrigger>
            <TabsTrigger value="products" variant="underline">
              <Package className="h-4 w-4 mr-2" />
              Produits sources ({enseigneProducts.length})
            </TabsTrigger>
          </TabsList>

          {/* Onglet Vue d'ensemble */}
          <TabsContent value="overview" className="mt-4">
            <EnseigneOrganisationsTable
              organisations={stats?.organisationsWithRevenue ?? []}
              parentOrganisation={stats?.parentOrganisation ?? null}
              onAddOrganisations={() => setIsOrganisationModalOpen(true)}
              onRemoveOrganisation={async orgId => {
                try {
                  await handleRemoveOrganisation(orgId);
                } catch (error) {
                  console.error(
                    '[EnseigneDetail] Remove organisation failed:',
                    error
                  );
                }
              }}
              loading={statsLoading}
            />
          </TabsContent>

          {/* Onglet Contacts */}
          <TabsContent value="contacts" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-500" />
                    Contacts de l&apos;enseigne
                    <span className="text-sm font-normal text-gray-500">
                      ({contactsData?.contacts.length ?? 0})
                    </span>
                  </CardTitle>
                  <ButtonV2
                    size="sm"
                    onClick={() => setShowCreateContact(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nouveau contact
                  </ButtonV2>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Ces contacts sont partagés avec tous les restaurants de
                  l&apos;enseigne et visibles dans le formulaire de commande
                  LinkMe.
                </p>
              </CardHeader>
              <CardContent>
                {contactsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : !contactsData?.contacts.length ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-sm text-gray-500 mb-2">
                      Aucun contact pour cette enseigne
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      Les contacts enseigne sont visibles par tous les
                      restaurants lors de la création de commande.
                    </p>
                    <ButtonV2
                      variant="outline"
                      onClick={() => setShowCreateContact(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter un contact
                    </ButtonV2>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {contactsData.contacts.map(contact => (
                      <ContactCardBO
                        key={contact.id}
                        contact={contact}
                        showBadges
                      />
                    ))}
                    <CreateNewContactCard
                      onClick={() => setShowCreateContact(true)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Modal création contact enseigne */}
            <Dialog
              open={showCreateContact}
              onOpenChange={setShowCreateContact}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-500" />
                    Nouveau contact enseigne
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="ct-firstName">Prénom *</Label>
                      <Input
                        id="ct-firstName"
                        value={newContact.firstName}
                        onChange={e =>
                          setNewContact(prev => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        placeholder="Jean"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ct-lastName">Nom *</Label>
                      <Input
                        id="ct-lastName"
                        value={newContact.lastName}
                        onChange={e =>
                          setNewContact(prev => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        placeholder="Dupont"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ct-email">
                      <Mail className="h-3.5 w-3.5 inline mr-1" />
                      Email *
                    </Label>
                    <Input
                      id="ct-email"
                      type="email"
                      value={newContact.email}
                      onChange={e =>
                        setNewContact(prev => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="jean.dupont@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ct-phone">
                      <Phone className="h-3.5 w-3.5 inline mr-1" />
                      Téléphone
                    </Label>
                    <Input
                      id="ct-phone"
                      value={newContact.phone}
                      onChange={e =>
                        setNewContact(prev => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ct-title">Fonction</Label>
                    <Input
                      id="ct-title"
                      value={newContact.title}
                      onChange={e =>
                        setNewContact(prev => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Directeur commercial"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <ButtonV2
                    variant="outline"
                    onClick={() => setShowCreateContact(false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Annuler
                  </ButtonV2>
                  <ButtonV2
                    onClick={handleCreateEnseigneContact}
                    disabled={
                      !newContact.firstName ||
                      !newContact.lastName ||
                      !newContact.email ||
                      createContactMutation.isPending
                    }
                  >
                    {createContactMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    Créer
                  </ButtonV2>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Onglet Geographie - contenu rendu hors container, voir ci-dessous */}
          <TabsContent value="geography" className="mt-0" />

          {/* Onglet Produits sources */}
          <TabsContent value="products" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-500" />
                  Produits sources pour {enseigne.name}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({enseigneProducts.length} produit
                    {enseigneProducts.length > 1 ? 's' : ''})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : enseigneProducts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Aucun produit source pour cette enseigne
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {enseigneProducts.map(product => (
                      <Link
                        key={product.id}
                        href={`/catalogue/produits/${product.id}`}
                        className="group cursor-pointer"
                      >
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2 flex items-center justify-center group-hover:ring-2 ring-blue-500 transition-all">
                          {product.primary_image_url ? (
                            <Image
                              src={product.primary_image_url}
                              alt={product.name}
                              width={120}
                              height={120}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-gray-300" />
                          )}
                        </div>
                        <p className="text-xs font-medium truncate">
                          {product.name}
                        </p>
                        {product.sku && (
                          <p className="text-xs text-gray-500 truncate">
                            {product.sku}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Onglet Geographie - HORS container pour pleine largeur */}
      {activeTab === 'geography' && (
        <div className="px-6 pb-6">
          <EnseigneMapSection
            organisations={mapData?.organisations ?? []}
            totalOrganisations={mapData?.totalOrganisations ?? 0}
            propresCount={mapData?.propresCount ?? 0}
            franchisesCount={mapData?.franchisesCount ?? 0}
            withCoordinatesCount={mapData?.withCoordinatesCount ?? 0}
            loading={mapLoading}
            enseigneName={enseigne.name}
            onViewOrganisation={orgId =>
              router.push(`/contacts-organisations/organisations/${orgId}`)
            }
          />
        </div>
      )}

      {/* Modal Gestion Organisations (deux colonnes) */}
      <OrganisationSelectorModal
        open={isOrganisationModalOpen}
        onOpenChange={setIsOrganisationModalOpen}
        enseigne={enseigne}
        currentOrganisations={enseigne.organisations ?? []}
        onSave={handleSaveOrganisations}
        onSuccess={handleRefresh}
      />

      {/* Modal Édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier l'enseigne</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'enseigne
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Pokawa, Black and White..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">URL du logo</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={e =>
                  setFormData(prev => ({ ...prev, logo_url: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Enseigne active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={checked =>
                  setFormData(prev => ({ ...prev, is_active: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <ButtonV2 variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Annuler
            </ButtonV2>
            <ButtonV2
              onClick={() => {
                void handleSubmitEdit().catch(error => {
                  console.error('[EnseigneDetail] Submit edit failed:', error);
                });
              }}
              disabled={!formData.name.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Supprimer l'enseigne</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'enseigne "{enseigne.name}" ?
              Les organisations membres seront dissociées mais pas supprimées.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <ButtonV2
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="destructive"
              onClick={() => {
                void handleDelete().catch(error => {
                  console.error('[EnseigneDetail] Delete failed:', error);
                });
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
