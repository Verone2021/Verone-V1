'use client';

import { useState, useEffect } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { Button, Badge } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@verone/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  ArrowLeft,
  Loader2,
  User,
  Building2,
  Users,
  ShoppingBag,
  Mail,
  Phone,
  Calendar,
  Shield,
  Link2,
  Activity,
  Package,
  Eye,
  ShoppingCart,
  ChevronRight,
  Pencil,
} from 'lucide-react';

import { UserConfigModal } from '../../components/UserConfigModal';
import {
  useLinkMeUser,
  LINKME_ROLE_LABELS,
  LINKME_ROLE_COLORS,
  LINKME_ROLE_PERMISSIONS,
} from '../../hooks/use-linkme-users';

// Types
interface UserSelection {
  id: string;
  name: string;
  description: string | null;
  archived_at: string | null;
  products_count: number;
  views_count: number;
  orders_count: number;
  created_at: string;
}

interface UserStats {
  selectionsCount: number;
  ordersCount: number;
  totalCaHT: number;
}

/**
 * Hook pour récupérer les sélections liées à un utilisateur
 * Via son enseigne_id ou organisation_id → affilié → sélections
 */
function useUserSelections(
  enseigneId: string | null,
  organisationId: string | null
) {
  const [selections, setSelections] = useState<UserSelection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enseigneId && !organisationId) {
      setSelections([]);
      setLoading(false);
      return;
    }

    const fetchSelections = async () => {
      setLoading(true);
      const supabase = createClient();

      // Trouver l'affilié lié à l'enseigne ou organisation de l'utilisateur
      let affiliateId: string | null = null;

      if (enseigneId) {
        const { data: affiliate } = await supabase
          .from('linkme_affiliates')
          .select('id')
          .eq('enseigne_id', enseigneId)
          .limit(1)
          .single();
        affiliateId = affiliate?.id ?? null;
      }

      if (!affiliateId && organisationId) {
        const { data: affiliate } = await supabase
          .from('linkme_affiliates')
          .select('id')
          .eq('organisation_id', organisationId)
          .limit(1)
          .single();
        affiliateId = affiliate?.id ?? null;
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement sélections utilisateur:', error);
        setSelections([]);
      } else {
        setSelections((data ?? []) as UserSelection[]);
      }
      setLoading(false);
    };

    void fetchSelections().catch(error => {
      console.error('[useUserSelections] fetchSelections failed:', error);
    });
  }, [enseigneId, organisationId]);

  return { selections, loading };
}

/**
 * Hook pour calculer les stats d'un utilisateur
 * Via son enseigne_id ou organisation_id → affilié → stats
 */
function useUserStats(
  enseigneId: string | null,
  organisationId: string | null
) {
  const [stats, setStats] = useState<UserStats>({
    selectionsCount: 0,
    ordersCount: 0,
    totalCaHT: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enseigneId && !organisationId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      const supabase = createClient();

      // Trouver l'affilié lié à l'enseigne ou organisation
      let affiliateId: string | null = null;

      if (enseigneId) {
        const { data: affiliate } = await supabase
          .from('linkme_affiliates')
          .select('id')
          .eq('enseigne_id', enseigneId)
          .limit(1)
          .single();
        affiliateId = affiliate?.id ?? null;
      }

      if (!affiliateId && organisationId) {
        const { data: affiliate } = await supabase
          .from('linkme_affiliates')
          .select('id')
          .eq('organisation_id', organisationId)
          .limit(1)
          .single();
        affiliateId = affiliate?.id ?? null;
      }

      if (!affiliateId) {
        setStats({ selectionsCount: 0, ordersCount: 0, totalCaHT: 0 });
        setLoading(false);
        return;
      }

      // Compter les sélections de cet affilié
      const { count: selectionsCount } = await supabase
        .from('linkme_selections')
        .select('id', { count: 'exact', head: true })
        .eq('affiliate_id', affiliateId);

      // TODO: Calculer ordersCount et totalCaHT quand les commandes LinkMe seront implémentées

      setStats({
        selectionsCount: selectionsCount ?? 0,
        ordersCount: 0,
        totalCaHT: 0,
      });
      setLoading(false);
    };

    void fetchStats().catch(error => {
      console.error('[useUserStats] fetchStats failed:', error);
    });
  }, [enseigneId, organisationId]);

  return { stats, loading };
}

/**
 * Page détail utilisateur LinkMe
 */
export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  // Hooks pour données utilisateur
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useLinkMeUser(userId);

  // Hooks dépendants des données utilisateur (enseigne/organisation)
  const { selections, loading: selectionsLoading } = useUserSelections(
    user?.enseigne_id ?? null,
    user?.organisation_id ?? null
  );
  const { stats, loading: statsLoading } = useUserStats(
    user?.enseigne_id ?? null,
    user?.organisation_id ?? null
  );

  // État onglet actif
  const [activeTab, setActiveTab] = useState('infos');

  // État modal configuration
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Gestion erreur
  if (userError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500">
          Erreur lors du chargement de l&apos;utilisateur
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  // Chargement
  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Initiales pour l'avatar
  const initials =
    [user.first_name?.[0], user.last_name?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase() || user.email[0].toUpperCase();

  // Config du badge rôle
  const roleLabel = LINKME_ROLE_LABELS[user.linkme_role] ?? user.linkme_role;
  const roleColor =
    LINKME_ROLE_COLORS[user.linkme_role] ?? 'bg-gray-100 text-gray-800';
  const rolePermissions = LINKME_ROLE_PERMISSIONS[user.linkme_role] ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={user.avatar_url ?? undefined}
                alt={user.email}
              />
              <AvatarFallback className="text-lg bg-blue-100 text-blue-700">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.email}
                </h1>
                <Badge className={roleColor}>{roleLabel}</Badge>
                <Badge
                  variant={user.is_active ? 'default' : 'secondary'}
                  className={
                    user.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }
                >
                  {user.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsConfigModalOpen(true)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Configurer le profil
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Sélections créées
                </p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '-' : stats.selectionsCount}
                </p>
              </div>
              <ShoppingBag className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Commandes générées
                </p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '-' : stats.ordersCount}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CA Total HT</p>
                <p className="text-2xl font-bold">
                  {statsLoading
                    ? '-'
                    : new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(stats.totalCaHT)}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="underline" className="w-full justify-start border-b">
          <TabsTrigger value="infos" variant="underline">
            <User className="h-4 w-4 mr-2" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="rattachements" variant="underline">
            <Link2 className="h-4 w-4 mr-2" />
            Rattachements
          </TabsTrigger>
          <TabsTrigger value="selections" variant="underline">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Sélections ({selections.length})
          </TabsTrigger>
          <TabsTrigger value="activite" variant="underline">
            <Activity className="h-4 w-4 mr-2" />
            Activité
          </TabsTrigger>
        </TabsList>

        {/* Onglet Informations */}
        <TabsContent value="infos" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identité */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  Identité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Prénom</p>
                    <p className="font-medium">{user.first_name ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-medium">{user.last_name ?? '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    Téléphone
                  </p>
                  <p className="font-medium">{user.phone ?? '-'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Compte */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-500" />
                  Compte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Date d&apos;inscription
                  </p>
                  <p className="font-medium">
                    {new Date(user.role_created_at).toLocaleDateString(
                      'fr-FR',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge
                    variant={user.is_active ? 'default' : 'secondary'}
                    className={
                      user.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }
                  >
                    {user.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Rattachements */}
        <TabsContent value="rattachements" className="mt-6">
          <div className="space-y-6">
            {/* Rôle et permissions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-500" />
                  Rôle et permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Rôle actuel :
                  </span>
                  <Badge className={`${roleColor} text-sm`}>{roleLabel}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Permissions :
                  </p>
                  <ul className="space-y-1">
                    {rolePermissions.map((permission, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Enseigne liée */}
            {user.enseigne_id && (
              <Card
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() =>
                  router.push(
                    `/canaux-vente/linkme/enseignes/${user.enseigne_id}`
                  )
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Enseigne liée
                        </p>
                        <p className="font-medium">
                          {user.enseigne_name || 'Enseigne'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Organisation liée */}
            {user.organisation_id && (
              <Card
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() =>
                  router.push(
                    `/canaux-vente/linkme/organisations/${user.organisation_id}`
                  )
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Organisation liée
                        </p>
                        <p className="font-medium">
                          {user.organisation_name ?? 'Organisation'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Message si aucun rattachement */}
            {!user.enseigne_id && !user.organisation_id && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-4">
                    <Link2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-sm text-gray-500">
                      Cet utilisateur n&apos;est rattaché à aucune enseigne ou
                      organisation
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Onglet Sélections */}
        <TabsContent value="selections" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-purple-500" />
                Sélections créées par cet utilisateur
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
                    Cet utilisateur n&apos;a créé aucune sélection
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
                    const config = isArchived
                      ? {
                          label: 'Archivée',
                          variant: 'outline' as const,
                          className: 'bg-gray-50 text-gray-500',
                        }
                      : {
                          label: 'Active',
                          variant: 'default' as const,
                          className: 'bg-green-100 text-green-700',
                        };

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
                              variant={config.variant}
                              className={config.className}
                            >
                              {config.label}
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

        {/* Onglet Activité */}
        <TabsContent value="activite" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-500" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-sm text-gray-500">
                  L&apos;historique d&apos;activité sera disponible
                  prochainement
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Configuration */}
      <UserConfigModal
        isOpen={isConfigModalOpen}
        user={user}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}
