'use client';

import { useState, useEffect } from 'react';

import { useParams, useRouter } from 'next/navigation';

import {
  EnseigneDetailHeader,
  EnseigneKPIGrid,
  EnseigneMapSection,
  EnseigneOrganisationsTable,
  useEnseigne,
  useEnseigneStats,
  useEnseigneMapData,
} from '@verone/organisations';
import { ProductThumbnail } from '@verone/products';
import { Button, Badge, Input, Label } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@verone/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  ArrowLeft,
  Loader2,
  Building2,
  MapPin,
  Package,
  ShoppingBag,
  Eye,
  ShoppingCart,
  ChevronRight,
  FileText,
  Users,
  Phone,
  Plus,
  X,
  Mail,
} from 'lucide-react';

import {
  ContactCardBO,
  CreateNewContactCard,
} from '../../components/contacts/ContactCardBO';
import {
  useEnseigneContactsBO,
  useCreateContactBO,
} from '../../hooks/use-organisation-contacts-bo';

/**
 * Type pour les sélections de l'affilié
 */
interface EnseigneSelection {
  id: string;
  name: string;
  description: string | null;
  archived_at: string | null;
  products_count: number;
  views_count: number;
  orders_count: number;
  created_at: string;
}

/**
 * Hook pour récupérer les sélections d'une enseigne via l'affilié
 *
 * ARCHITECTURE: Cherche l'affilié via 2 chemins possibles:
 * 1. linkme_affiliates.enseigne_id = enseigneId (lien direct)
 * 2. linkme_affiliates.organisation_id → organisations.enseigne_id = enseigneId (via organisation)
 */
function useEnseigneSelections(enseigneId: string | null) {
  const [selections, setSelections] = useState<EnseigneSelection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enseigneId) {
      setLoading(false);
      return;
    }

    const fetchSelections = async () => {
      setLoading(true);
      const supabase = createClient();

      // CHEMIN 1: Chercher affilié avec enseigne_id direct
      let affiliateId: string | null = null;

      type AffiliateIdResult = { id: string };

      const { data: directAffiliate } = await supabase
        .from('linkme_affiliates')
        .select('id')
        .eq('enseigne_id', enseigneId)
        .single()
        .returns<AffiliateIdResult>();

      if (directAffiliate) {
        affiliateId = directAffiliate.id;
      } else {
        // CHEMIN 2: Chercher affilié via organisation.enseigne_id
        // D'abord trouver les organisations de cette enseigne
        type OrganisationIdResult = { id: string };

        const { data: orgs } = await supabase
          .from('organisations')
          .select('id')
          .eq('enseigne_id', enseigneId)
          .returns<OrganisationIdResult[]>();

        if (orgs && orgs.length > 0) {
          const orgIds = orgs.map(o => o.id);
          // Chercher un affilié lié à une de ces organisations
          const { data: orgAffiliate } = await supabase
            .from('linkme_affiliates')
            .select('id')
            .in('organisation_id', orgIds)
            .limit(1)
            .single()
            .returns<AffiliateIdResult>();

          if (orgAffiliate) {
            affiliateId = orgAffiliate.id;
          }
        }
      }

      if (!affiliateId) {
        setSelections([]);
        setLoading(false);
        return;
      }

      // Récupérer les sélections de cet affilié
      const { data, error } = await supabase
        .from('linkme_selections')
        .select(
          'id, name, description, archived_at, products_count, views_count, orders_count, created_at'
        )
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false })
        .returns<EnseigneSelection[]>();

      if (error) {
        console.error('[Enseignes] Erreur chargement sélections:', error);
        setSelections([]);
      } else {
        setSelections(data ?? []);
      }
      setLoading(false);
    };

    void fetchSelections().catch(error => {
      console.error('[useSelections] fetchSelections failed:', error);
    });
  }, [enseigneId]);

  return { selections, loading };
}

/**
 * Type pour les produits sourcés par enseigne
 */
interface EnseigneProduct {
  id: string;
  name: string;
  sku: string | null;
  supplier_reference: string | null;
  primary_image_url: string | null;
  created_at: string | null;
  created_by_affiliate: string | null;
}

/**
 * Hook pour récupérer les produits pour une enseigne
 * Sépare produits sur mesure (Vérone) et produits affiliés
 */
function useEnseigneProducts(enseigneId: string | null) {
  const [surMesure, setSurMesure] = useState<EnseigneProduct[]>([]);
  const [affilies, setAffilies] = useState<EnseigneProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enseigneId) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      const supabase = createClient();

      type ProductWithImages = {
        id: string;
        name: string;
        sku: string | null;
        supplier_reference: string | null;
        created_at: string | null;
        created_by_affiliate: string | null;
        product_images: Array<{
          public_url: string;
          is_primary: boolean;
        }> | null;
      };

      // Query ALL products for this enseigne with created_by_affiliate to distinguish
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          id,
          name,
          sku,
          supplier_reference,
          created_at,
          created_by_affiliate,
          product_images!left(public_url, is_primary)
        `
        )
        .eq('enseigne_id', enseigneId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(100)
        .returns<ProductWithImages[]>();

      if (error) {
        console.error(
          '[Enseignes] Erreur chargement produits enseigne:',
          error
        );
        setSurMesure([]);
        setAffilies([]);
      } else {
        // Transform and separate products
        const allProducts = (data ?? []).map(p => {
          const primaryImg = (p.product_images ?? []).find(
            img => img.is_primary
          );
          return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            supplier_reference: p.supplier_reference,
            created_at: p.created_at,
            created_by_affiliate: p.created_by_affiliate,
            primary_image_url: primaryImg?.public_url ?? null,
          };
        });

        // Produits sur mesure = créés par Vérone (pas d'affiliate)
        setSurMesure(allProducts.filter(p => !p.created_by_affiliate));
        // Produits affiliés = créés par l'affilié lui-même
        setAffilies(allProducts.filter(p => p.created_by_affiliate));
      }
      setLoading(false);
    };

    void fetchProducts().catch(error => {
      console.error('[useProducts] fetchProducts failed:', error);
    });
  }, [enseigneId]);

  return { surMesure, affilies, loading };
}

/**
 * Page détail enseigne LinkMe
 * Affiche toutes les informations agrégées d'une enseigne avec onglets
 */
export default function EnseigneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Hooks pour données enseigne
  const {
    enseigne,
    loading: enseigneLoading,
    error: enseigneError,
  } = useEnseigne(id);
  const { stats, loading: statsLoading } = useEnseigneStats(id);
  const { data: mapData, loading: mapLoading } = useEnseigneMapData(id);
  const {
    surMesure,
    affilies,
    loading: productsLoading,
  } = useEnseigneProducts(id);
  const { selections, loading: selectionsLoading } = useEnseigneSelections(id);

  // Contacts enseigne
  const { data: contactsData, isLoading: contactsLoading } =
    useEnseigneContactsBO(id);
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

  const handleCreateContact = () => {
    if (!newContact.firstName || !newContact.lastName || !newContact.email)
      return;
    void createContactMutation
      .mutateAsync({
        enseigneId: id,
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
      .catch((error: unknown) => {
        console.error('[EnseigneDetail] Create contact failed:', error);
      });
  };

  // État onglet actif
  const [activeTab, setActiveTab] = useState('infos');

  // Gestion erreur
  if (enseigneError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500">Erreur : {enseigneError}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  // Chargement
  if (enseigneLoading || !enseigne) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton retour (sans bouton Modifier pour LinkMe) */}
      <EnseigneDetailHeader enseigne={enseigne} onBack={() => router.back()} />

      {/* KPIs */}
      <EnseigneKPIGrid stats={stats} loading={statsLoading} />

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="underline" className="w-full justify-start border-b">
          <TabsTrigger value="infos" variant="underline">
            <FileText className="h-4 w-4 mr-2" />
            Informations personnelles
          </TabsTrigger>
          <TabsTrigger value="organisations" variant="underline">
            <Users className="h-4 w-4 mr-2" />
            Organisation
          </TabsTrigger>
          <TabsTrigger value="contacts" variant="underline">
            <Phone className="h-4 w-4 mr-2" />
            Contacts ({contactsData?.contacts.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="geography" variant="underline">
            <MapPin className="h-4 w-4 mr-2" />
            Géographie
          </TabsTrigger>
          <TabsTrigger value="products" variant="underline">
            <Package className="h-4 w-4 mr-2" />
            Produits ({surMesure.length + affilies.length})
          </TabsTrigger>
          <TabsTrigger value="selections" variant="underline">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Sélections ({selections.length})
          </TabsTrigger>
        </TabsList>

        {/* Onglet Organisations */}
        <TabsContent value="organisations" className="mt-6">
          {/* Tableau organisations membres */}
          <EnseigneOrganisationsTable
            organisations={stats?.organisationsWithRevenue ?? []}
            parentOrganisation={stats?.parentOrganisation ?? null}
            loading={statsLoading}
            enseigneId={id}
            onAddOrganisations={() => {
              // TODO: Modal ajout organisations
              console.warn('Add organisations to enseigne:', enseigne.id);
            }}
          />
        </TabsContent>

        {/* Onglet Contacts */}
        <TabsContent value="contacts" className="mt-6">
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
                <Button size="sm" onClick={() => setShowCreateContact(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nouveau contact
                </Button>
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
                    Les contacts enseigne sont visibles par tous les restaurants
                    de l&apos;enseigne lors de la création de commande.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateContact(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter un contact
                  </Button>
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

          {/* Modal création contact */}
          <Dialog open={showCreateContact} onOpenChange={setShowCreateContact}>
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
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
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
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
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
                  <Label htmlFor="email">
                    <Mail className="h-3.5 w-3.5 inline mr-1" />
                    Email *
                  </Label>
                  <Input
                    id="email"
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
                  <Label htmlFor="phone">
                    <Phone className="h-3.5 w-3.5 inline mr-1" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
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
                  <Label htmlFor="title">Fonction</Label>
                  <Input
                    id="title"
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
                {/* Rôles */}
                <div>
                  <Label className="mb-2 block">Rôles</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={newContact.isPrimaryContact}
                        onCheckedChange={(checked: boolean) =>
                          setNewContact(prev => ({
                            ...prev,
                            isPrimaryContact: checked,
                          }))
                        }
                      />
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-100 text-green-700">
                        Responsable
                      </span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={newContact.isBillingContact}
                        onCheckedChange={(checked: boolean) =>
                          setNewContact(prev => ({
                            ...prev,
                            isBillingContact: checked,
                          }))
                        }
                      />
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700">
                        Facturation
                      </span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={newContact.isCommercialContact}
                        onCheckedChange={(checked: boolean) =>
                          setNewContact(prev => ({
                            ...prev,
                            isCommercialContact: checked,
                          }))
                        }
                      />
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-orange-100 text-orange-700">
                        Commercial
                      </span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={newContact.isTechnicalContact}
                        onCheckedChange={(checked: boolean) =>
                          setNewContact(prev => ({
                            ...prev,
                            isTechnicalContact: checked,
                          }))
                        }
                      />
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-violet-100 text-violet-700">
                        Technique
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateContact(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateContact}
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
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Onglet Informations personnelles */}
        <TabsContent value="infos" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                Informations de l&apos;enseigne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Colonne 1 : Infos enseigne */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Nom de l&apos;enseigne
                    </p>
                    <p className="font-medium">{enseigne.name}</p>
                  </div>
                  {enseigne.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Description
                      </p>
                      <p className="font-medium">{enseigne.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge
                      variant={enseigne.is_active ? 'default' : 'secondary'}
                      className={
                        enseigne.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }
                    >
                      {enseigne.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                {/* Colonne 2 : Infos siège (organisation mère) */}
                {stats?.parentOrganisation && (
                  <div className="space-y-4 border-l pl-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-amber-600" />
                      <span className="font-medium text-amber-900">
                        Organisation Siège
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Raison sociale
                      </p>
                      <p className="font-medium">
                        {stats.parentOrganisation.legal_name ??
                          stats.parentOrganisation.trade_name ??
                          '-'}
                      </p>
                    </div>
                    {stats.parentOrganisation.trade_name &&
                      stats.parentOrganisation.trade_name !==
                        stats.parentOrganisation.legal_name && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Nom commercial
                          </p>
                          <p className="font-medium">
                            {stats.parentOrganisation.trade_name}
                          </p>
                        </div>
                      )}
                    {(stats.parentOrganisation.siret ??
                      stats.parentOrganisation.siren) && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {stats.parentOrganisation.siret ? 'SIRET' : 'SIREN'}
                        </p>
                        <p className="font-medium">
                          {stats.parentOrganisation.siret ??
                            stats.parentOrganisation.siren}
                        </p>
                      </div>
                    )}
                    {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- Intentional boolean OR to check if any address field exists */}
                    {(stats.parentOrganisation.billing_address_line1 ||
                      stats.parentOrganisation.city) && (
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          Adresse
                        </p>
                        <p className="font-medium">
                          {[
                            stats.parentOrganisation.billing_address_line1,
                            stats.parentOrganisation.billing_postal_code,
                            stats.parentOrganisation.billing_city ??
                              stats.parentOrganisation.city,
                          ]
                            .filter(Boolean)
                            .join(', ') || '-'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Géographie */}
        <TabsContent value="geography" className="mt-6">
          <EnseigneMapSection
            organisations={mapData?.organisations ?? []}
            totalOrganisations={mapData?.totalOrganisations ?? 0}
            propresCount={mapData?.propresCount ?? 0}
            franchisesCount={mapData?.franchisesCount ?? 0}
            withCoordinatesCount={mapData?.withCoordinatesCount ?? 0}
            loading={mapLoading}
            className="max-w-none"
            onViewOrganisation={orgId =>
              router.push(`/contacts-organisations/organisations/${orgId}`)
            }
          />
        </TabsContent>

        {/* Onglet Produits avec sous-onglets */}
        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-500" />
                Produits pour {enseigne.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <Tabs defaultValue="sur-mesure" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="sur-mesure">
                      Produits sur mesure ({surMesure.length})
                    </TabsTrigger>
                    <TabsTrigger value="affilies">
                      Produits affiliés ({affilies.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Sous-onglet: Produits sur mesure (créés par Vérone) */}
                  <TabsContent value="sur-mesure">
                    {surMesure.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        Aucun produit sur mesure pour cette enseigne
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {surMesure.map(product => (
                          <div
                            key={product.id}
                            className="group cursor-pointer"
                            onClick={() =>
                              router.push(`/catalogue/produits/${product.id}`)
                            }
                          >
                            <ProductThumbnail
                              src={product.primary_image_url}
                              alt={product.name}
                              size="lg"
                              className="group-hover:ring-2 ring-blue-500 transition-all"
                            />
                            <p className="mt-2 text-xs font-medium truncate">
                              {product.name}
                            </p>
                            {product.supplier_reference && (
                              <p className="text-xs text-gray-500 truncate">
                                {product.supplier_reference}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Sous-onglet: Produits affiliés (créés par l'affilié) */}
                  <TabsContent value="affilies">
                    {affilies.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        Aucun produit créé par l&apos;affilié
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {affilies.map(product => (
                          <div
                            key={product.id}
                            className="group cursor-pointer"
                            onClick={() =>
                              router.push(`/catalogue/produits/${product.id}`)
                            }
                          >
                            <ProductThumbnail
                              src={product.primary_image_url}
                              alt={product.name}
                              size="lg"
                              className="group-hover:ring-2 ring-purple-500 transition-all"
                            />
                            <p className="mt-2 text-xs font-medium truncate">
                              {product.name}
                            </p>
                            {product.sku && (
                              <p className="text-xs text-gray-500 truncate">
                                {product.sku}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Sélections */}
        <TabsContent value="selections" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-purple-500" />
                Sélections de produits
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({selections.length} sélection
                  {selections.length > 1 ? 's' : ''})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : selections.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-sm text-gray-500 mb-4">
                    Aucune sélection pour cette enseigne
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push('/canaux-vente/linkme/selections')
                    }
                  >
                    Voir toutes les sélections
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selections.map(selection => {
                    const isArchived = selection.archived_at !== null;

                    return (
                      <div
                        key={selection.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                        onClick={() =>
                          router.push(
                            `/canaux-vente/linkme/selections/${selection.id}`
                          )
                        }
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">
                              {selection.name}
                            </h3>
                            <Badge
                              variant={isArchived ? 'outline' : 'default'}
                              className={
                                isArchived
                                  ? 'bg-gray-50 text-gray-500'
                                  : 'bg-green-100 text-green-700'
                              }
                            >
                              {isArchived ? 'Archivée' : 'Active'}
                            </Badge>
                          </div>
                          {selection.description && (
                            <p className="text-sm text-gray-500 truncate mb-2">
                              {selection.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Package className="h-3.5 w-3.5" />
                              {selection.products_count} produit
                              {selection.products_count > 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              {selection.views_count} vue
                              {selection.views_count > 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <ShoppingCart className="h-3.5 w-3.5" />
                              {selection.orders_count} commande
                              {selection.orders_count > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
