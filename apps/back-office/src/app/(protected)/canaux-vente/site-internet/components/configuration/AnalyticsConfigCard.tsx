'use client';

import { useState, useEffect, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Input,
  ButtonV2,
} from '@verone/ui';
import { BarChart3, Loader2, Save } from 'lucide-react';

import type { SiteInternetConfig } from '../../types';
import { useUpdateSiteInternetConfigJSON } from '../../hooks/use-site-internet-config';

interface AnalyticsConfigCardProps {
  config?: SiteInternetConfig | null;
}

export function AnalyticsConfigCard({ config }: AnalyticsConfigCardProps) {
  const { toast } = useToast();
  const updateConfigJSON = useUpdateSiteInternetConfigJSON();

  const [analyticsForm, setAnalyticsForm] = useState({
    google_analytics_id: config?.config?.analytics?.google_analytics_id ?? '',
    facebook_pixel_id: '',
    gtm_id: config?.config?.analytics?.google_tag_manager_id ?? '',
  });

  useEffect(() => {
    if (config) {
      setAnalyticsForm({
        google_analytics_id:
          config.config?.analytics?.google_analytics_id ?? '',
        facebook_pixel_id: '',
        gtm_id: config.config?.analytics?.google_tag_manager_id ?? '',
      });
    }
  }, [config]);

  const handleSave = useCallback(async () => {
    try {
      await updateConfigJSON.mutateAsync({
        google_analytics_id: analyticsForm.google_analytics_id,
        facebook_pixel_id: analyticsForm.facebook_pixel_id,
        gtm_id: analyticsForm.gtm_id,
      });
      toast({
        title: 'Analytics sauvegarde',
        description: 'Les identifiants de tracking ont ete mis a jour.',
      });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les identifiants analytics.',
        variant: 'destructive',
      });
    }
  }, [analyticsForm, updateConfigJSON, toast]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-orange-600" />
          <CardTitle>Analytics & Tracking</CardTitle>
        </div>
        <CardDescription>
          Identifiants de tracking pour Google Analytics, Facebook Pixel, etc.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="ga-id">Google Analytics ID</Label>
          <Input
            id="ga-id"
            placeholder="G-XXXXXXXXXX"
            value={analyticsForm.google_analytics_id}
            onChange={e =>
              setAnalyticsForm(prev => ({
                ...prev,
                google_analytics_id: e.target.value,
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Format : G-XXXXXXXXXX (Google Analytics 4)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fb-pixel">Facebook Pixel ID</Label>
          <Input
            id="fb-pixel"
            placeholder="123456789012345"
            value={analyticsForm.facebook_pixel_id}
            onChange={e =>
              setAnalyticsForm(prev => ({
                ...prev,
                facebook_pixel_id: e.target.value,
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Identifiant numerique (15-16 chiffres)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gtm-id">Google Tag Manager ID</Label>
          <Input
            id="gtm-id"
            placeholder="GTM-XXXXXXX"
            value={analyticsForm.gtm_id}
            onChange={e =>
              setAnalyticsForm(prev => ({ ...prev, gtm_id: e.target.value }))
            }
          />
          <p className="text-xs text-muted-foreground">Format : GTM-XXXXXXX</p>
        </div>
        <div className="flex justify-end">
          <ButtonV2
            onClick={() => {
              void handleSave().catch(console.error);
            }}
            disabled={updateConfigJSON.isPending}
          >
            {updateConfigJSON.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder
              </>
            )}
          </ButtonV2>
        </div>
      </CardContent>
    </Card>
  );
}
