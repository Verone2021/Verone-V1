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
import { Mail, Loader2, Save } from 'lucide-react';

import type { SiteInternetConfig } from '../../types';
import { useUpdateSiteInternetConfig } from '../../hooks/use-site-internet-config';

interface ContactConfigCardProps {
  config?: SiteInternetConfig | null;
}

export function ContactConfigCard({ config }: ContactConfigCardProps) {
  const { toast } = useToast();
  const updateConfig = useUpdateSiteInternetConfig();

  const [contactForm, setContactForm] = useState({
    contact_email: config?.contact_email ?? '',
    contact_phone: config?.contact_phone ?? '',
  });

  useEffect(() => {
    if (config) {
      setContactForm({
        contact_email: config.contact_email ?? '',
        contact_phone: config.contact_phone ?? '',
      });
    }
  }, [config]);

  const handleSave = useCallback(async () => {
    try {
      await updateConfig.mutateAsync(contactForm);
      toast({
        title: 'Contact sauvegarde',
        description: 'Les informations de contact ont ete mises a jour.',
      });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les informations de contact.',
        variant: 'destructive',
      });
    }
  }, [contactForm, updateConfig, toast]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-green-600" />
          <CardTitle>Informations de Contact</CardTitle>
        </div>
        <CardDescription>
          Contact affiche sur le site (footer, page contact)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email de Contact</Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="contact@verone-deco.fr"
            value={contactForm.contact_email}
            onChange={e =>
              setContactForm(prev => ({
                ...prev,
                contact_email: e.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Telephone de Contact</Label>
          <Input
            id="contact-phone"
            type="tel"
            placeholder="+33 1 23 45 67 89"
            value={contactForm.contact_phone}
            onChange={e =>
              setContactForm(prev => ({
                ...prev,
                contact_phone: e.target.value,
              }))
            }
          />
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
