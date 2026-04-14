'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

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
import { Globe, Upload, Loader2, Save, Image as ImageIcon } from 'lucide-react';

import type { SiteInternetConfig } from '../../types';
import {
  useUpdateSiteInternetConfig,
  useUploadSiteLogo,
} from '../../hooks/use-site-internet-config';

interface IdentityConfigCardProps {
  config?: SiteInternetConfig | null;
}

export function IdentityConfigCard({ config }: IdentityConfigCardProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateConfig = useUpdateSiteInternetConfig();
  const uploadLogo = useUploadSiteLogo();

  const [identityForm, setIdentityForm] = useState({
    domain_url: config?.domain_url ?? '',
    site_name: config?.site_name ?? '',
  });

  useEffect(() => {
    if (config) {
      setIdentityForm({
        domain_url: config.domain_url ?? '',
        site_name: config.site_name ?? '',
      });
    }
  }, [config]);

  const handleLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Fichier invalide',
          description: 'Veuillez selectionner une image (PNG, JPG, SVG)',
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
          title: 'Logo uploade',
          description: 'Le logo du site a ete mis a jour.',
        });
      } catch {
        toast({
          title: 'Erreur',
          description: "Impossible d'uploader le logo.",
          variant: 'destructive',
        });
      }
    },
    [uploadLogo, toast]
  );

  const handleSave = useCallback(async () => {
    try {
      await updateConfig.mutateAsync(identityForm);
      toast({
        title: 'Identite sauvegardee',
        description: 'Les informations du site ont ete mises a jour.',
      });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les informations.',
        variant: 'destructive',
      });
    }
  }, [identityForm, updateConfig, toast]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          <CardTitle>Identite du Site</CardTitle>
        </div>
        <CardDescription>
          Domaine, nom et logo de votre site e-commerce
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Logo du Site</Label>
          <div className="flex items-start gap-4">
            {config?.site_logo_url ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-md border bg-muted">
                <Image
                  src={config.site_logo_url}
                  alt="Logo site"
                  width={80}
                  height={80}
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
                  void handleLogoUpload(e).catch(console.error);
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
                PNG, JPG ou SVG. Max 2 MB.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-name">Nom du Site</Label>
          <Input
            id="site-name"
            placeholder="Ex: Verone Deco"
            value={identityForm.site_name}
            onChange={e =>
              setIdentityForm(prev => ({ ...prev, site_name: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="domain">Domaine du Site</Label>
          <Input
            id="domain"
            placeholder="https://www.verone-deco.fr"
            value={identityForm.domain_url}
            onChange={e =>
              setIdentityForm(prev => ({ ...prev, domain_url: e.target.value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            URL complete du site (avec https://)
          </p>
        </div>
        <div className="flex justify-end">
          <ButtonV2
            onClick={() => {
              void handleSave().catch(console.error);
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
  );
}
