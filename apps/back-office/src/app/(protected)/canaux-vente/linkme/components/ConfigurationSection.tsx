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

function ToggleRow({
  label,
  description,
  checked,
}: {
  label: string;
  description: string;
  checked: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} disabled />
    </div>
  );
}

function SectionCardHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <CardHeader>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>{title}</CardTitle>
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
              Bientôt
            </span>
          </div>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

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
const DEFAULT_CONFIG: LinkMeConfig = {
  welcomeEmailEnabled: true,
  commissionNotificationEnabled: true,
  weeklyReportEnabled: false,
  platformEnabled: true,
  registrationOpen: true,
  publicDomain: 'linkme-blue.vercel.app',
};

function DevBanner() {
  return (
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
  );
}

export function ConfigurationSection() {
  const config = DEFAULT_CONFIG;

  return (
    <div className="space-y-6">
      <DevBanner />

      <Card>
        <SectionCardHeader
          icon={Mail}
          title="Notifications Email"
          description="Configurez les emails automatiques envoyés aux affiliés"
        />
        <CardContent className="space-y-6 opacity-60">
          <ToggleRow
            label="Email de bienvenue"
            description="Envoyé lors de la validation d'un nouvel affilié"
            checked={config.welcomeEmailEnabled}
          />
          <Separator />
          <ToggleRow
            label="Notification de commission"
            description="Envoyé à chaque nouvelle vente générée"
            checked={config.commissionNotificationEnabled}
          />
          <Separator />
          <ToggleRow
            label="Rapport hebdomadaire"
            description="Résumé des ventes et commissions de la semaine"
            checked={config.weeklyReportEnabled}
          />
        </CardContent>
      </Card>

      <Card>
        <SectionCardHeader
          icon={Globe}
          title="Plateforme"
          description="Paramètres généraux de la plateforme LinkMe"
        />
        <CardContent className="space-y-6 opacity-60">
          <ToggleRow
            label="Plateforme activée"
            description="Désactivez pour mettre LinkMe en maintenance"
            checked={config.platformEnabled}
          />
          <Separator />
          <ToggleRow
            label="Inscriptions ouvertes"
            description="Autoriser les nouvelles demandes d'affiliation"
            checked={config.registrationOpen}
          />
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="publicDomain">Domaine public</Label>
            <Input
              id="publicDomain"
              value={config.publicDomain}
              placeholder="linkme-blue.vercel.app"
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
