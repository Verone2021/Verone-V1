/**
 * Page /parametres/outils
 *
 * Outils internes mis à disposition du staff back-office. Aujourd'hui :
 * extension Chrome de sourcing produit.
 *
 * Accessible à tout staff back-office actif (incl. catalog_manager).
 *
 * @see BO-RBAC-CATALOG-MGR-001
 */
import Link from 'next/link';

import { Chrome, Download, Puzzle, ArrowLeft, ListChecks } from 'lucide-react';

import { ButtonUnified } from '@verone/ui';

export const dynamic = 'force-dynamic';

export default function OutilsPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="w-full px-4 sm:px-6 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Outils</h1>
            <p className="text-xs text-gray-500 mt-1">
              Extensions et utilitaires pour le staff Vérone
            </p>
          </div>
          <Link
            href="/parametres"
            className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Retour aux paramètres
          </Link>
        </div>

        <section className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Puzzle className="h-4 w-4" />
              Extension Chrome — Sourcing produit
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Importer en un clic des produits depuis Alibaba, 1688 ou
              AliExpress vers le back-office Vérone.
            </p>
          </div>

          <div className="px-5 py-5 space-y-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <Chrome className="h-3.5 w-3.5" />
                  Compatibilité
                </div>
                <ul className="mt-2 list-disc pl-5 text-xs text-gray-600 space-y-1">
                  <li>Google Chrome / Chromium / Brave / Edge</li>
                  <li>
                    Sites supportés : Alibaba, 1688, AliExpress, et tout site
                    avec Open Graph ou JSON-LD
                  </li>
                </ul>
              </div>
              <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <ListChecks className="h-3.5 w-3.5" />
                  Champs récupérés
                </div>
                <ul className="mt-2 list-disc pl-5 text-xs text-gray-600 space-y-1">
                  <li>Nom, description technique, marque</li>
                  <li>Prix d&apos;achat indicatif, MOQ, délai de production</li>
                  <li>Photos (jusqu&apos;à 10), dimensions, poids, matériau</li>
                  <li>Fournisseur (nom, pays, certifications)</li>
                </ul>
              </div>
            </div>

            <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3">
              <h3 className="text-xs font-semibold text-blue-900">
                Installation — 4 étapes
              </h3>
              <ol className="mt-2 list-decimal pl-5 text-xs text-blue-900 space-y-1">
                <li>
                  Télécharger l&apos;archive <code>.zip</code> via le bouton
                  ci-dessous, puis la décompresser dans un dossier dédié
                  (ex&nbsp;: <code>~/Verone/extensions/sourcing/</code>).
                </li>
                <li>
                  Ouvrir Chrome, aller sur <code>chrome://extensions/</code>,
                  activer le « Mode développeur » en haut à droite.
                </li>
                <li>
                  Cliquer sur « Charger l&apos;extension non empaquetée » et
                  sélectionner le dossier décompressé.
                </li>
                <li>
                  Épingler l&apos;icône Vérone à la barre Chrome (icône
                  puzzle&nbsp;→&nbsp;épingler) pour pouvoir importer en un clic
                  depuis n&apos;importe quelle page produit.
                </li>
              </ol>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-gray-500">
                L&apos;archive est générée à la volée à partir du code
                actuellement déployé. Toujours synchronisée avec la production.
              </div>
              <a
                href="/api/extensions/sourcing-chrome/download"
                download
                className="self-start sm:self-auto"
              >
                <ButtonUnified variant="primary">
                  <Download className="h-4 w-4" />
                  Télécharger l&apos;extension
                </ButtonUnified>
              </a>
            </div>

            <div className="rounded-md border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              <strong>Mise à jour</strong>&nbsp;: lorsque l&apos;extension
              évolue (nouvelle version), retéléchargez l&apos;archive et cliquez
              sur l&apos;icône «&nbsp;rafraîchir&nbsp;» dans
              <code> chrome://extensions/</code>. Les sessions ouvertes
              continuent de fonctionner sans interruption.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
