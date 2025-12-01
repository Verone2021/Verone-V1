'use client';

import Image from 'next/image';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Switch,
  Badge,
  Skeleton,
} from '@verone/ui';
import { Building2, Package, Eye, EyeOff, Store } from 'lucide-react';
import { toast } from 'sonner';

import {
  useLinkMeSuppliers,
  useToggleLinkMeSupplierVisibility,
  type LinkMeSupplier,
} from '../../hooks/use-linkme-suppliers';

/**
 * Construit l'URL publique du logo depuis le chemin stocké en base
 */
function getLogoUrl(logoPath: string | null | undefined): string | null {
  if (!logoPath) return null;
  // Si c'est déjà une URL complète, la retourner
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return logoPath;
  }
  // Sinon, construire l'URL Supabase Storage
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organisation-logos/${logoPath}`;
}

/**
 * Page Fournisseurs LinkMe
 * Gère la visibilité des fournisseurs comme "partenaires" sur le site public
 * Route: /canaux-vente/linkme/catalogue/fournisseurs
 */
export default function LinkMeSuppliersPage() {
  const { data: suppliers, isLoading, error } = useLinkMeSuppliers();
  const toggleVisibility = useToggleLinkMeSupplierVisibility();

  const handleToggleVisibility = async (supplier: LinkMeSupplier) => {
    try {
      await toggleVisibility.mutateAsync({
        id: supplier.id,
        isVisible: !supplier.is_visible_as_partner,
      });
      toast.success(
        supplier.is_visible_as_partner
          ? `${supplier.supplier?.legal_name} masqué des partenaires`
          : `${supplier.supplier?.legal_name} visible comme partenaire`
      );
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Stats
  const totalSuppliers = suppliers?.length ?? 0;
  const visibleSuppliers =
    suppliers?.filter(s => s.is_visible_as_partner).length ?? 0;
  const totalProducts =
    suppliers?.reduce((acc, s) => acc + (s.products_count ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Store className="h-6 w-6" />
          Fournisseurs Partenaires
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez les fournisseurs visibles sur le site public LinkMe
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Fournisseurs
                </p>
                <p className="text-2xl font-bold">
                  {isLoading ? '-' : totalSuppliers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Eye className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Visibles comme Partenaires
                </p>
                <p className="text-2xl font-bold">
                  {isLoading ? '-' : visibleSuppliers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Produits au Catalogue
                </p>
                <p className="text-2xl font-bold">
                  {isLoading ? '-' : totalProducts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste Fournisseurs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Fournisseurs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Erreur lors du chargement des fournisseurs
            </div>
          ) : suppliers?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun fournisseur dans le catalogue LinkMe</p>
              <p className="text-sm mt-2">
                Les fournisseurs sont automatiquement ajoutés quand vous ajoutez
                leurs produits au catalogue.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {suppliers?.map(supplier => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Logo */}
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {getLogoUrl(supplier.supplier?.logo_url) ? (
                        <Image
                          src={getLogoUrl(supplier.supplier?.logo_url)!}
                          alt={supplier.supplier?.legal_name ?? 'Logo'}
                          width={48}
                          height={48}
                          className="object-contain"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <p className="font-medium">
                        {supplier.supplier?.legal_name ?? 'Fournisseur inconnu'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          <Package className="h-3 w-3 mr-1" />
                          {supplier.products_count ?? 0} produit
                          {(supplier.products_count ?? 0) > 1 ? 's' : ''}
                        </Badge>
                        {supplier.is_visible_as_partner ? (
                          <Badge variant="default" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            Visible
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Masqué
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      Partenaire
                    </span>
                    <Switch
                      checked={supplier.is_visible_as_partner}
                      onCheckedChange={() => handleToggleVisibility(supplier)}
                      disabled={toggleVisibility.isPending}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="p-2 bg-blue-500/10 rounded-lg h-fit">
              <Store className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Comment ça fonctionne ?</p>
              <p className="text-sm text-muted-foreground">
                Les fournisseurs sont automatiquement ajoutés à cette liste
                lorsque vous ajoutez un de leurs produits au catalogue LinkMe.
                Activez le switch &quot;Partenaire&quot; pour les faire
                apparaître dans la section Partenaires du site public.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
