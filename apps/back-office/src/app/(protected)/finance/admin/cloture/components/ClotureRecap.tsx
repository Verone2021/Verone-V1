'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@verone/ui';
import { Money } from '@verone/ui-business';

interface ClotureRecapProps {
  selectedYear: string;
  totalRecettes: number;
  totalDepenses: number;
  resultat: number;
  tvaCollectee: number;
  tvaDeductible: number;
  tvaNette: number;
}

export function ClotureRecap({
  selectedYear,
  totalRecettes,
  totalDepenses,
  resultat,
  tvaCollectee,
  tvaDeductible,
  tvaNette,
}: ClotureRecapProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Récapitulatif exercice {selectedYear}
        </CardTitle>
        <CardDescription>
          Synthèse des données comptables pour transmission à
          l&apos;expert-comptable
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-2 gap-4 px-4 py-3 bg-muted/50 text-sm font-medium border-b">
            <div>Rubrique</div>
            <div className="text-right">Montant</div>
          </div>
          <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b">
            <div className="text-sm">
              Chiffre d&apos;affaires (recettes TTC)
            </div>
            <div className="text-right">
              <Money amount={totalRecettes} className="text-green-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b">
            <div className="text-sm">Total dépenses TTC</div>
            <div className="text-right">
              <Money amount={totalDepenses} className="text-red-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b bg-muted/30 font-bold">
            <div>Résultat brut ({resultat >= 0 ? 'bénéfice' : 'perte'})</div>
            <div className="text-right">
              <Money amount={resultat} colorize bold />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b">
            <div className="text-sm">TVA collectée</div>
            <div className="text-right">
              <Money amount={tvaCollectee} size="sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b">
            <div className="text-sm">TVA déductible</div>
            <div className="text-right">
              <Money amount={tvaDeductible} size="sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 px-4 py-3">
            <div className="text-sm font-medium">
              TVA nette ({tvaNette >= 0 ? 'à payer' : 'crédit'})
            </div>
            <div className="text-right">
              <Money amount={tvaNette} colorize />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
