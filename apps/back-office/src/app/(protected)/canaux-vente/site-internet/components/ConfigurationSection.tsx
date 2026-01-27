/**
 * Composant: ConfigurationSection
 * Gestion configuration globale canal site internet (domaine, SEO, contact, analytics)
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { ErrorStateCard } from '@verone/ui';
import { Input } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Globe,
  Search,
  Mail,
  BarChart3,
  Upload,
  Loader2,
  Settings,
  CheckCircle2,
  Image as ImageIcon,
  Save,
} from 'lucide-react';

// Hooks
import {
  useSiteInternetConfig,
  useUpdateSiteInternetConfig,
  useUploadSiteLogo,
  useUpdateSiteInternetConfigJSON,
} from '../hooks/use-site-internet-config';

/**
 * Section Configuration Principale
 */
export function ConfigurationSection() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États locaux pour les formulaires
  const [identityForm, setIdentityForm] = useState({
    domain_url: '',
    site_name: '',
  });
  const [seoForm, setSeoForm] = useState({
    default_meta_title: '',
    default_meta_description: '',
    meta_keywords: '',
  });
  const [contactForm, setContactForm] = useState({
    contact_email: '',
    contact_phone: '',
  });
  const [analyticsForm, setAnalyticsForm] = useState({
    google_analytics_id: '',
    facebook_pixel_id: '',
    gtm_id: '',
  });

  // Hooks
  const {
    data: config,
    isLoading,
    isError,
    error,
    refetch,
  } = useSiteInternetConfig();
  const updateConfig = useUpdateSiteInternetConfig();
  const uploadLogo = useUploadSiteLogo();
  const updateConfigJSON = useUpdateSiteInternetConfigJSON();

  // Initialiser les formulaires avec les données existantes
  useEffect(() => {
    if (config) {
      setIdentityForm({
        domain_url: config.domain_url || '',
        site_name: config.site_name || '',
      });
      setSeoForm({
        default_meta_title: config.default_meta_title || '',
        default_meta_description: config.default_meta_description || '',
        meta_keywords: (config.meta_keywords || []).join(', '),
      });
      setContactForm({
        contact_email: config.contact_email || '',
        contact_phone: config.contact_phone || '',
      });
      setAnalyticsForm({
        google_analytics_id:
          config.config?.analytics?.google_analytics_id || '',
        facebook_pixel_id: '', // Not in config schema, placeholder
        gtm_id: config.config?.analytics?.google_tag_manager_id || '',
      });
    }
  }, [config]);

  // Handler: Sauvegarder identité site (memoized)
  const handleSaveIdentity = useCallback(async () => {
    try {
      await updateConfig.mutateAsync({
        domain_url: identityForm.domain_url,
        site_name: identityForm.site_name,
      });
      toast({
        title: 'Identité sauvegardée',
        description: 'Les informations du site ont été mises à jour.',
      });
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les informations.',
        variant: 'destructive',
      });
    }
  }, [identityForm, updateConfig, toast]);

  // Handler: Sauvegarder SEO (memoized)
  const handleSaveSEO = useCallback(async () => {
    try {
      await updateConfig.mutateAsync({
        default_meta_title: seoForm.default_meta_title,
        default_meta_description: seoForm.default_meta_description,
        meta_keywords: seoForm.meta_keywords
          .split(',')
          .map(k => k.trim())
          .filter(Boolean),
      });
      toast({
        title: 'SEO sauvegardé',
        description: 'Les paramètres SEO par défaut ont été mis à jour.',
      });
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres SEO.',
        variant: 'destructive',
      });
    }
  }, [seoForm, updateConfig, toast]);

  // Handler: Sauvegarder contact (memoized)
  const handleSaveContact = useCallback(async () => {
    try {
      await updateConfig.mutateAsync({
        contact_email: contactForm.contact_email,
        contact_phone: contactForm.contact_phone,
      });
      toast({
        title: 'Contact sauvegardé',
        description: 'Les informations de contact ont été mises à jour.',
      });
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les informations de contact.',
        variant: 'destructive',
      });
    }
  }, [contactForm, updateConfig, toast]);

  // Handler: Sauvegarder analytics (memoized)
  const handleSaveAnalytics = useCallback(async () => {
    try {
      await updateConfigJSON.mutateAsync({
        google_analytics_id: analyticsForm.google_analytics_id,
        facebook_pixel_id: analyticsForm.facebook_pixel_id,
        gtm_id: analyticsForm.gtm_id,
      });
      toast({
        title: 'Analytics sauvegardé',
        description: 'Les identifiants de tracking ont été mis à jour.',
      });
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les identifiants analytics.',
        variant: 'destructive',
      });
    }
  }, [analyticsForm, updateConfigJSON, toast]);

  // Handler: Upload logo (memoized)
  const handleLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validation
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Fichier invalide',
          description: 'Veuillez sélectionner une image (PNG, JPG, SVG)',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: 'La taille maximale est de 2 MB.',
          variant: 'destructive',
        });
        return;
      }

      try {
        await uploadLogo.mutateAsync(file);
        toast({
          title: 'Logo uploadé',
          description: 'Le logo du site a été mis à jour.',
        });
      } catch (_error) {
        toast({
          title: 'Erreur',
          description: "Impossible d'uploader le logo.",
          variant: 'destructive',
        });
      }
    },
    [uploadLogo, toast]
  );

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
            : 'Impossible de charger la configuration. Veuillez réessayer.'
        }
        variant="destructive"
        onRetry={() => {
          void refetch().catch(error => {
            console.error('[ConfigurationSection] Refetch failed:', error);
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
                Paramètres globaux du canal de vente site internet
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

      {/* Section 1: Identité du site */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <CardTitle>Identité du Site</CardTitle>
          </div>
          <CardDescription>
            Domaine, nom et logo de votre site e-commerce
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo du Site</Label>
            <div className="flex items-start gap-4">
              {config?.site_logo_url ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-md border bg-muted">
                  <img
                    src={config.site_logo_url}
                    alt="Logo site"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-md border bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    void handleLogoUpload(e).catch(error => {
                      console.error(
                        '[ConfigurationSection] Logo upload failed:',
                        error
                      );
                    });
                  }}
                />
                <ButtonV2
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLogo.isPending}
                >
                  {uploadLogo.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {config?.site_logo_url
                        ? 'Changer le logo'
                        : 'Uploader un logo'}
                    </>
                  )}
                </ButtonV2>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG ou SVG. Max 2 MB. Dimensions recommandées : 200x200
                  px
                </p>
              </div>
            </div>
          </div>

          {/* Nom du site */}
          <div className="space-y-2">
            <Label htmlFor="site-name">Nom du Site</Label>
            <Input
              id="site-name"
              placeholder="Ex: Vérone Déco"
              value={identityForm.site_name}
              onChange={e =>
                setIdentityForm({ ...identityForm, site_name: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Nom affiché dans le header et les meta tags
            </p>
          </div>

          {/* Domaine */}
          <div className="space-y-2">
            <Label htmlFor="domain">Domaine du Site</Label>
            <Input
              id="domain"
              placeholder="https://www.verone-deco.fr"
              value={identityForm.domain_url}
              onChange={e =>
                setIdentityForm({
                  ...identityForm,
                  domain_url: e.target.value,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              URL complète du site (avec https://)
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <ButtonV2
              onClick={() => {
                void handleSaveIdentity().catch(error => {
                  console.error(
                    '[ConfigurationSection] Save identity failed:',
                    error
                  );
                });
              }}
              disabled={updateConfig.isPending}
            >
              {updateConfig.isPending ? (
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

      {/* Section 2: SEO Global */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-purple-600" />
            <CardTitle>SEO Global</CardTitle>
          </div>
          <CardDescription>
            Paramètres SEO par défaut appliqués à toutes les pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Meta Title */}
          <div className="space-y-2">
            <Label htmlFor="meta-title">Meta Title par Défaut</Label>
            <Input
              id="meta-title"
              placeholder="Ex: Vérone Déco - Mobilier haut de gamme"
              value={seoForm.default_meta_title}
              onChange={e =>
                setSeoForm({ ...seoForm, default_meta_title: e.target.value })
              }
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">
              60 caractères max. Affiché dans les résultats Google.
            </p>
          </div>

          {/* Meta Description */}
          <div className="space-y-2">
            <Label htmlFor="meta-description">
              Meta Description par Défaut
            </Label>
            <Textarea
              id="meta-description"
              placeholder="Ex: Découvrez notre collection de mobilier d'intérieur haut de gamme..."
              value={seoForm.default_meta_description}
              onChange={e =>
                setSeoForm({
                  ...seoForm,
                  default_meta_description: e.target.value,
                })
              }
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground">
              160 caractères max. Description affichée dans les résultats
              Google.
            </p>
          </div>

          {/* Meta Keywords */}
          <div className="space-y-2">
            <Label htmlFor="meta-keywords">Meta Keywords</Label>
            <Input
              id="meta-keywords"
              placeholder="Ex: mobilier, décoration, haut de gamme"
              value={seoForm.meta_keywords}
              onChange={e =>
                setSeoForm({ ...seoForm, meta_keywords: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Mots-clés séparés par des virgules (impact SEO limité)
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <ButtonV2
              onClick={() => {
                void handleSaveSEO().catch(error => {
                  console.error(
                    '[ConfigurationSection] Save SEO failed:',
                    error
                  );
                });
              }}
              disabled={updateConfig.isPending}
            >
              {updateConfig.isPending ? (
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

      {/* Section 3: Contact */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-green-600" />
            <CardTitle>Informations de Contact</CardTitle>
          </div>
          <CardDescription>
            Contact affiché sur le site (footer, page contact)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email de Contact</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="contact@verone-deco.fr"
              value={contactForm.contact_email}
              onChange={e =>
                setContactForm({
                  ...contactForm,
                  contact_email: e.target.value,
                })
              }
            />
          </div>

          {/* Téléphone */}
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Téléphone de Contact</Label>
            <Input
              id="contact-phone"
              type="tel"
              placeholder="+33 1 23 45 67 89"
              value={contactForm.contact_phone}
              onChange={e =>
                setContactForm({
                  ...contactForm,
                  contact_phone: e.target.value,
                })
              }
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <ButtonV2
              onClick={() => {
                void handleSaveContact().catch(error => {
                  console.error(
                    '[ConfigurationSection] Save contact failed:',
                    error
                  );
                });
              }}
              disabled={updateConfig.isPending}
            >
              {updateConfig.isPending ? (
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

      {/* Section 4: Analytics & Tracking */}
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
          {/* Google Analytics */}
          <div className="space-y-2">
            <Label htmlFor="ga-id">Google Analytics ID</Label>
            <Input
              id="ga-id"
              placeholder="G-XXXXXXXXXX"
              value={analyticsForm.google_analytics_id}
              onChange={e =>
                setAnalyticsForm({
                  ...analyticsForm,
                  google_analytics_id: e.target.value,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Format : G-XXXXXXXXXX (Google Analytics 4)
            </p>
          </div>

          {/* Facebook Pixel */}
          <div className="space-y-2">
            <Label htmlFor="fb-pixel">Facebook Pixel ID</Label>
            <Input
              id="fb-pixel"
              placeholder="123456789012345"
              value={analyticsForm.facebook_pixel_id}
              onChange={e =>
                setAnalyticsForm({
                  ...analyticsForm,
                  facebook_pixel_id: e.target.value,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Identifiant numérique (15-16 chiffres)
            </p>
          </div>

          {/* Google Tag Manager */}
          <div className="space-y-2">
            <Label htmlFor="gtm-id">Google Tag Manager ID</Label>
            <Input
              id="gtm-id"
              placeholder="GTM-XXXXXXX"
              value={analyticsForm.gtm_id}
              onChange={e =>
                setAnalyticsForm({ ...analyticsForm, gtm_id: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Format : GTM-XXXXXXX
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <ButtonV2
              onClick={() => {
                void handleSaveAnalytics().catch(error => {
                  console.error(
                    '[ConfigurationSection] Save analytics failed:',
                    error
                  );
                });
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

      {/* Info Helper */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Configuration Centralisée
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Ces paramètres sont appliqués globalement à tout le site
                internet. Les paramètres SEO peuvent être surchargés au niveau
                de chaque produit, collection ou catégorie. Les identifiants
                analytics sont automatiquement injectés sur toutes les pages du
                site.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
