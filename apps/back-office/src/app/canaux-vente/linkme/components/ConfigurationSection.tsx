'use client';

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
import { Mail, Globe, AlertCircle } from 'lucide-react';

interface LinkMeConfig {
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
 * - Templates emails notifications (hooks - bientôt disponible)
 * - Activation/désactivation plateforme (hooks - bientôt disponible)
 *
 * Note: Section "Commissions & Marges" supprimée - Les commissions sont
 * calculées par produit sur le prix catalogue général, pas globalement.
 */
export function ConfigurationSection() {
  // Config state (hooks - non connecté à la DB pour l'instant)
  // Ces valeurs sont juste pour l'affichage, pas fonctionnelles
  const config: LinkMeConfig = {
    welcomeEmailEnabled: true,
    commissionNotificationEnabled: true,
    weeklyReportEnabled: false,
    platformEnabled: true,
    registrationOpen: true,
    publicDomain: 'linkme.verone.fr',
  };

  return (
    <div className="space-y-6">
      {/* Bannière d'information */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Configuration en cours de développement</p>
          <p className="text-amber-700 mt-1">
            Les paramètres ci-dessous sont des hooks non connectés à la base de
            données. Ils seront activés dans une prochaine version.
          </p>
        </div>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Notifications Email</CardTitle>
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                  Bientôt
                </span>
              </div>
              <CardDescription>
                Configurez les emails automatiques envoyés aux affiliés
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 opacity-60">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email de bienvenue</Label>
              <p className="text-sm text-muted-foreground">
                Envoyé lors de la validation d'un nouvel affilié
              </p>
            </div>
            <Switch checked={config.welcomeEmailEnabled} disabled />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notification de commission</Label>
              <p className="text-sm text-muted-foreground">
                Envoyé à chaque nouvelle vente générée
              </p>
            </div>
            <Switch checked={config.commissionNotificationEnabled} disabled />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Rapport hebdomadaire</Label>
              <p className="text-sm text-muted-foreground">
                Résumé des ventes et commissions de la semaine
              </p>
            </div>
            <Switch checked={config.weeklyReportEnabled} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Plateforme</CardTitle>
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                  Bientôt
                </span>
              </div>
              <CardDescription>
                Paramètres généraux de la plateforme LinkMe
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 opacity-60">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Plateforme activée</Label>
              <p className="text-sm text-muted-foreground">
                Désactivez pour mettre LinkMe en maintenance
              </p>
            </div>
            <Switch checked={config.platformEnabled} disabled />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Inscriptions ouvertes</Label>
              <p className="text-sm text-muted-foreground">
                Autoriser les nouvelles demandes d'affiliation
              </p>
            </div>
            <Switch checked={config.registrationOpen} disabled />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="publicDomain">Domaine public</Label>
            <Input
              id="publicDomain"
              value={config.publicDomain}
              placeholder="linkme.verone.fr"
              disabled
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              Domaine où la plateforme LinkMe est accessible
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Note : Bouton sauvegarde masqué car paramètres non connectés */}
    </div>
  );
}
