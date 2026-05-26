'use client';

import { Badge, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Download, Globe, ShoppingBag } from 'lucide-react';

import {
  DevModeToggleIllustration,
  LoadUnpackedIllustration,
  PinIconIllustration,
} from './SourcingPluginChromeIllustrations';
import {
  ChromeUrlBarIllustration,
  DownloadIllustration,
  UnzipIllustration,
} from './SourcingPluginIllustrations';

const EXTENSION_ZIP_URL = '/extensions/verone-sourcing-extension.zip';
const EXTENSION_VERSION = '1.0.4';

const installSteps = [
  {
    title: '1. Télécharger le plugin',
    body: 'Cliquez sur le bouton « Télécharger le plugin » ci-dessus. Un fichier ZIP est enregistré dans votre dossier Téléchargements.',
    Illustration: DownloadIllustration,
  },
  {
    title: '2. Dézipper l’archive',
    body: 'Faites un clic droit sur le ZIP, puis « Extraire tout » (Windows) ou double-cliquez (Mac). Vous obtenez un dossier nommé verone-sourcing-extension.',
    Illustration: UnzipIllustration,
  },
  {
    title: '3. Ouvrir la page Extensions de Chrome',
    body: 'Dans Chrome, copiez chrome://extensions/ dans la barre d’adresse et appuyez sur Entrée.',
    Illustration: ChromeUrlBarIllustration,
  },
  {
    title: '4. Activer le mode développeur',
    body: 'En haut à droite de la page Extensions, basculez l’interrupteur « Mode développeur ».',
    Illustration: DevModeToggleIllustration,
  },
  {
    title: '5. Charger l’extension',
    body: 'Cliquez sur « Charger l’extension non empaquetée », puis sélectionnez le dossier dézippé à l’étape 2.',
    Illustration: LoadUnpackedIllustration,
  },
  {
    title: '6. Épingler l’icône',
    body: 'Cliquez sur l’icône puzzle dans la barre Chrome et épinglez « Verone Sourcing Import » pour la garder visible.',
    Illustration: PinIconIllustration,
  },
] as const;

const supportedSites = [
  {
    icon: ShoppingBag,
    name: 'Alibaba.com',
    quality: 'Extraction enrichie',
    detail: 'Produit + fournisseur complet (raison sociale, contact, pays)',
  },
  {
    icon: ShoppingBag,
    name: '1688.com',
    quality: 'Extraction enrichie',
    detail: 'Produit + fournisseur',
  },
  {
    icon: ShoppingBag,
    name: 'AliExpress',
    quality: 'Extraction enrichie',
    detail: 'Produit + photos + prix',
  },
  {
    icon: Globe,
    name: 'Autres sites e-commerce',
    quality: 'Extraction générique',
    detail: 'Nom, prix et images via OpenGraph / JSON-LD',
  },
] as const;

export function SourcingPluginTab(): JSX.Element {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle>Plugin navigateur Verone Sourcing</CardTitle>
                <Badge variant="secondary">v{EXTENSION_VERSION}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Installez l&apos;extension Chrome pour importer un produit
                Alibaba, 1688 ou AliExpress dans le back-office en un clic.
              </p>
            </div>
            <a
              href={EXTENSION_ZIP_URL}
              download="verone-sourcing-extension.zip"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 md:h-9 md:w-auto"
            >
              <Download className="h-5 w-5 md:h-4 md:w-4" />
              Télécharger le plugin
            </a>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Installation pas à pas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Compatible Chrome, Edge, Brave et tout navigateur basé sur Chromium.
          </p>
        </CardHeader>
        <CardContent>
          <ol className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {installSteps.map(step => {
              const Illustration = step.Illustration;
              return (
                <li
                  key={step.title}
                  className="flex flex-col gap-3 rounded-md border bg-card p-4"
                >
                  <Illustration />
                  <div className="space-y-1">
                    <p className="font-medium leading-tight">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comment l&apos;utiliser</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">1.</span> Naviguez sur une fiche
            produit Alibaba, 1688 ou AliExpress.
          </p>
          <p>
            <span className="font-medium">2.</span> Cliquez sur l&apos;icône
            Verone dans la barre du navigateur.
          </p>
          <p>
            <span className="font-medium">3.</span> Vérifiez les données
            extraites (nom, prix, photos, fournisseur) puis ajustez si besoin.
          </p>
          <p>
            <span className="font-medium">4.</span> Cliquez sur
            <span className="font-medium"> Importer dans Verone</span>. La fiche
            sourcing apparaît dans l&apos;onglet « Produits ».
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sites supportés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {supportedSites.map(site => {
              const Icon = site.icon;
              return (
                <div
                  key={site.name}
                  className="flex items-start gap-3 rounded-md border p-3"
                >
                  <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{site.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {site.quality}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {site.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mises à jour</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Quand une nouvelle version est publiée, retéléchargez le ZIP depuis
            cet onglet, dézippez-le dans le même dossier (en remplaçant
            l&apos;ancien), puis cliquez sur la flèche « Recharger » de
            l&apos;extension dans <code>chrome://extensions/</code>.
          </p>
          <p>
            Version actuelle&nbsp;:{' '}
            <span className="font-medium text-foreground">
              {EXTENSION_VERSION}
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
