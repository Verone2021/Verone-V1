'use client';

/**
 * PagesConfigurationSection - Configuration des pages LinkMe
 *
 * Permet de configurer les éléments visuels de chaque page LinkMe:
 * - Globe 3D (activation, vitesse de rotation)
 * - Futures options par page
 *
 * @module PagesConfigurationSection
 * @since 2026-01-06
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Label } from '@verone/ui';
import { Separator } from '@verone/ui';
import { Slider } from '@verone/ui';
import { Switch } from '@verone/ui';
import { Globe, Home, LogIn, Loader2, Package, Info } from 'lucide-react';

import {
  useLinkMePageConfigurations,
  useUpdateLinkMePageConfig,
  useGlobeStats,
  type LinkMePageConfiguration,
} from '../hooks/use-linkme-page-config';

// Mapping des icônes par page
const PAGE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  login: LogIn,
  dashboard: Home,
  catalogue: Package,
};

/**
 * Carte de configuration pour une page
 */
function PageConfigCard({
  config,
  onUpdate,
  isUpdating,
}: {
  config: LinkMePageConfiguration;
  onUpdate: (updates: {
    globe_enabled?: boolean;
    globe_rotation_speed?: number;
  }) => void;
  isUpdating: boolean;
}) {
  const PageIcon = PAGE_ICONS[config.page_id] ?? Globe;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2ECCC1]/10">
            <PageIcon className="h-5 w-5 text-[#2ECCC1]" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{config.page_name}</CardTitle>
            {config.page_description && (
              <CardDescription className="text-sm">
                {config.page_description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Section Globe 3D */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Globe className="h-4 w-4" />
            Globe 3D
          </div>

          {/* Toggle Globe */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Afficher le globe</Label>
              <p className="text-sm text-muted-foreground">
                Active le globe 3D interactif sur cette page
              </p>
            </div>
            <Switch
              checked={config.globe_enabled}
              onCheckedChange={(checked: boolean) =>
                onUpdate({ globe_enabled: checked })
              }
              disabled={isUpdating}
            />
          </div>

          <Separator />

          {/* Slider Vitesse */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Vitesse de rotation</Label>
              <span className="text-sm text-muted-foreground font-mono">
                {config.globe_rotation_speed.toFixed(3)}
              </span>
            </div>
            <Slider
              value={[config.globe_rotation_speed * 1000]}
              onValueChange={(value: number[]) =>
                onUpdate({ globe_rotation_speed: value[0] / 1000 })
              }
              min={1}
              max={10}
              step={1}
              disabled={isUpdating || !config.globe_enabled}
              className={!config.globe_enabled ? 'opacity-50' : ''}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Lent</span>
              <span>Rapide</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Section principale de configuration des pages
 */
export function PagesConfigurationSection(): JSX.Element {
  const {
    data: configurations,
    isLoading,
    error,
  } = useLinkMePageConfigurations();
  const { data: globeStats } = useGlobeStats();
  const updateMutation = useUpdateLinkMePageConfig();

  const handleUpdate = (
    pageId: string,
    updates: { globe_enabled?: boolean; globe_rotation_speed?: number }
  ): void => {
    updateMutation.mutate({ pageId, updates });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Erreur lors du chargement des configurations
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Globe */}
      {globeStats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-[#0A1628]">
                {globeStats.products}
              </div>
              <p className="text-sm text-muted-foreground">
                Produits sur le globe
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-[#0A1628]">
                {globeStats.organisations}
              </div>
              <p className="text-sm text-muted-foreground">
                Organisations sur le globe
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-[#2ECCC1]">
                {globeStats.total}
              </div>
              <p className="text-sm text-muted-foreground">Total items</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Configuration des pages LinkMe</p>
          <p className="text-blue-700 mt-1">
            Configurez l&apos;affichage du globe 3D et autres options pour
            chaque page de l&apos;application LinkMe.
          </p>
        </div>
      </div>

      {/* Liste des pages */}
      <div className="space-y-4">
        {configurations?.map(config => (
          <PageConfigCard
            key={config.page_id}
            config={config}
            onUpdate={updates => handleUpdate(config.page_id, updates)}
            isUpdating={updateMutation.isPending}
          />
        ))}
      </div>

      {/* Placeholder pour futures pages */}
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="font-medium">Autres pages</p>
          <p className="text-sm">
            Les configurations pour d&apos;autres pages (catalogue, profil,
            etc.) seront ajoutées ici.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default PagesConfigurationSection;
