'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  ErrorStateCard,
  ButtonV2,
} from '@verone/ui';
import { Loader2, CheckCircle2, Settings } from 'lucide-react';

import {
  useSiteInternetConfig,
  useUpdateSiteInternetConfigJSON,
} from '../hooks/use-site-internet-config';
import type { Json } from '@verone/types';

import { IdentityConfigCard } from './configuration/IdentityConfigCard';
import { SeoConfigCard } from './configuration/SeoConfigCard';
import { ContactConfigCard } from './configuration/ContactConfigCard';
import { AnalyticsConfigCard } from './configuration/AnalyticsConfigCard';
import { ProductShippingCard } from './ProductShippingCard';
import { ShippingConfigCard } from './ShippingConfigCard';

/**
 * Section Configuration Principale — orchestrateur
 */
export function ConfigurationSection() {
  const {
    data: config,
    isLoading,
    isError,
    error,
    refetch,
  } = useSiteInternetConfig();
  const updateConfigJSON = useUpdateSiteInternetConfigJSON();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <ErrorStateCard
        title="Erreur de chargement"
        message={
          error instanceof Error
            ? error.message
            : 'Impossible de charger la configuration. Veuillez reessayer.'
        }
        variant="destructive"
        onRetry={() => {
          void refetch().catch(err => {
            console.error('[ConfigurationSection] Refetch failed:', err);
          });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuration Site Internet</CardTitle>
              <CardDescription>
                Parametres globaux du canal de vente site internet
              </CardDescription>
            </div>
            {config && (
              <Badge variant="outline" className="gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Canal actif
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <IdentityConfigCard config={config} />
      <SeoConfigCard config={config} />
      <ContactConfigCard config={config} />
      <AnalyticsConfigCard config={config} />

      {/* Livraison */}
      <ShippingConfigCard
        config={config}
        onSave={async shippingConfig => {
          await updateConfigJSON.mutateAsync({
            shipping: shippingConfig as unknown as Json,
          } as Json);
        }}
        isSaving={updateConfigJSON.isPending}
      />

      <ProductShippingCard />

      {/* Info Helper */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Configuration Centralisee
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Ces parametres sont appliques globalement a tout le site
                internet. Les parametres SEO peuvent etre surcharges au niveau
                de chaque produit, collection ou categorie. Les identifiants
                analytics sont automatiquement injectes sur toutes les pages du
                site.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
