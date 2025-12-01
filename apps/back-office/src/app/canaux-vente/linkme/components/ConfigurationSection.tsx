'use client';

import { useState } from 'react';

import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Separator } from '@verone/ui';
import { Switch } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { useToast } from '@verone/common';
import {
  Settings,
  Percent,
  Mail,
  Globe,
  Bell,
  Save,
} from 'lucide-react';

interface LinkMeConfig {
  // Commission
  defaultCommissionRate: number;
  defaultMaxMarginRate: number;

  // Emails
  welcomeEmailEnabled: boolean;
  commissionNotificationEnabled: boolean;
  weeklyReportEnabled: boolean;

  // Platform
  platformEnabled: boolean;
  registrationOpen: boolean;
  publicDomain: string;
}

/**
 * ConfigurationSection - Paramètres LinkMe
 *
 * Fonctionnalités:
 * - Commission LinkMe par défaut (%)
 * - Plafond marge par défaut (%)
 * - Templates emails notifications
 * - Activation/désactivation plateforme
 */
export function ConfigurationSection() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Config state (in real app, fetch from DB or settings table)
  const [config, setConfig] = useState<LinkMeConfig>({
    defaultCommissionRate: 5,
    defaultMaxMarginRate: 20,
    welcomeEmailEnabled: true,
    commissionNotificationEnabled: true,
    weeklyReportEnabled: false,
    platformEnabled: true,
    registrationOpen: true,
    publicDomain: 'linkme.verone.fr',
  });

  async function handleSave() {
    setSaving(true);

    // Simulate save (in real app, save to DB)
    await new Promise(resolve => setTimeout(resolve, 500));

    toast({
      title: 'Configuration enregistrée',
      description: 'Les paramètres ont été mis à jour',
    });

    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Commission Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Commissions & Marges</CardTitle>
              <CardDescription>
                Paramètres par défaut pour les nouveaux affiliés
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultCommission">
                Commission LinkMe par défaut (%)
              </Label>
              <Input
                id="defaultCommission"
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={config.defaultCommissionRate}
                onChange={e =>
                  setConfig({
                    ...config,
                    defaultCommissionRate: Number(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Pourcentage prélevé par LinkMe sur chaque vente
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultMaxMargin">
                Plafond marge affilié par défaut (%)
              </Label>
              <Input
                id="defaultMaxMargin"
                type="number"
                min="0"
                max="100"
                step="1"
                value={config.defaultMaxMarginRate}
                onChange={e =>
                  setConfig({
                    ...config,
                    defaultMaxMarginRate: Number(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Marge maximum qu'un affilié peut appliquer sur le prix catalogue
              </p>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Exemple de calcul</h4>
            <p className="text-sm text-muted-foreground">
              Pour un produit à <strong>100€ HT</strong> catalogue :
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>
                • Prix vente max :{' '}
                <strong>
                  {(100 * (1 + config.defaultMaxMarginRate / 100)).toFixed(0)}€
                  HT
                </strong>{' '}
                (marge {config.defaultMaxMarginRate}%)
              </li>
              <li>
                • Commission LinkMe :{' '}
                <strong>{config.defaultCommissionRate}€</strong> (
                {config.defaultCommissionRate}% du prix catalogue)
              </li>
              <li>
                • Gain affilié max :{' '}
                <strong>
                  {(config.defaultMaxMarginRate - config.defaultCommissionRate).toFixed(
                    0
                  )}
                  €
                </strong>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Notifications Email</CardTitle>
              <CardDescription>
                Configurez les emails automatiques envoyés aux affiliés
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email de bienvenue</Label>
              <p className="text-sm text-muted-foreground">
                Envoyé lors de la validation d'un nouvel affilié
              </p>
            </div>
            <Switch
              checked={config.welcomeEmailEnabled}
              onCheckedChange={checked =>
                setConfig({ ...config, welcomeEmailEnabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notification de commission</Label>
              <p className="text-sm text-muted-foreground">
                Envoyé à chaque nouvelle vente générée
              </p>
            </div>
            <Switch
              checked={config.commissionNotificationEnabled}
              onCheckedChange={checked =>
                setConfig({ ...config, commissionNotificationEnabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Rapport hebdomadaire</Label>
              <p className="text-sm text-muted-foreground">
                Résumé des ventes et commissions de la semaine
              </p>
            </div>
            <Switch
              checked={config.weeklyReportEnabled}
              onCheckedChange={checked =>
                setConfig({ ...config, weeklyReportEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Plateforme</CardTitle>
              <CardDescription>
                Paramètres généraux de la plateforme LinkMe
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Plateforme activée</Label>
              <p className="text-sm text-muted-foreground">
                Désactivez pour mettre LinkMe en maintenance
              </p>
            </div>
            <Switch
              checked={config.platformEnabled}
              onCheckedChange={checked =>
                setConfig({ ...config, platformEnabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Inscriptions ouvertes</Label>
              <p className="text-sm text-muted-foreground">
                Autoriser les nouvelles demandes d'affiliation
              </p>
            </div>
            <Switch
              checked={config.registrationOpen}
              onCheckedChange={checked =>
                setConfig({ ...config, registrationOpen: checked })
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="publicDomain">Domaine public</Label>
            <Input
              id="publicDomain"
              value={config.publicDomain}
              onChange={e =>
                setConfig({ ...config, publicDomain: e.target.value })
              }
              placeholder="linkme.verone.fr"
            />
            <p className="text-xs text-muted-foreground">
              Domaine où la plateforme LinkMe est accessible
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <ButtonV2 onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </ButtonV2>
      </div>
    </div>
  );
}
