'use client';

import { Money } from '@verone/ui-business';

import { type BilanData, type BilanLine } from './useBilanData';

interface BilanActifTableProps {
  bilan: BilanData;
}

function renderAmount(amount: number) {
  return (
    <Money
      amount={amount}
      size="sm"
      className={amount === 0 ? 'text-muted-foreground' : ''}
    />
  );
}

function ActifRow({ line }: { line: BilanLine }) {
  return (
    <div
      className={`grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm ${line.isBold ? 'font-semibold bg-gray-50/30' : ''}`}
    >
      <div className={`col-span-4 ${line.indent ? 'pl-4' : ''}`}>
        {line.label}
      </div>
      <div className="col-span-2 text-right">
        {!line.isBold && renderAmount(line.brut)}
      </div>
      <div className="col-span-2 text-right">
        {!line.isBold && renderAmount(line.amortissement)}
      </div>
      <div className="col-span-2 text-right border-l pl-2">
        {!line.isBold && renderAmount(line.net)}
      </div>
      <div className="col-span-2 text-right">
        {!line.isBold && renderAmount(line.netN1)}
      </div>
    </div>
  );
}

export function BilanActifTable({ bilan }: BilanActifTableProps) {
  return (
    <div className="border rounded-xl bg-white overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b">
        <h2 className="font-bold text-sm uppercase tracking-wide">
          Bilan Actif
        </h2>
      </div>

      {/* Header colonnes exercice */}
      <div className="grid grid-cols-12 gap-2 px-5 py-2 text-xs font-medium text-muted-foreground border-b bg-gray-50/50">
        <div className="col-span-4" />
        <div className="col-span-4 text-center">Exercice {bilan.yearN}</div>
        <div className="col-span-2 text-center border-l">
          Exercice {bilan.yearN1}
        </div>
        <div className="col-span-2" />
      </div>
      <div className="grid grid-cols-12 gap-2 px-5 py-2 text-xs font-medium text-muted-foreground border-b">
        <div className="col-span-4" />
        <div className="col-span-2 text-right">Brut</div>
        <div className="col-span-2 text-right">Amortissements</div>
        <div className="col-span-2 text-right border-l pl-2">Net</div>
        <div className="col-span-2 text-right">Net</div>
      </div>

      {/* Lignes actif immobilise */}
      {bilan.actifLines.map((line, i) => (
        <ActifRow key={`ai-${i}`} line={line} />
      ))}

      {/* Lignes actif circulant */}
      {bilan.actifCirculantLines.map((line, i) => (
        <ActifRow key={`ac-${i}`} line={line} />
      ))}

      {/* Total actif et circulant */}
      <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm bg-gray-50/50">
        <div className="col-span-4 pl-4 font-medium">
          Total actif et circulant
        </div>
        <div className="col-span-2" />
        <div className="col-span-2" />
        <div className="col-span-2 text-right border-l pl-2">
          {renderAmount(bilan.totalActif)}
        </div>
        <div className="col-span-2 text-right">
          {renderAmount(bilan.totalActifN1)}
        </div>
      </div>

      {/* TOTAL ACTIF */}
      <div className="grid grid-cols-12 gap-2 px-5 py-3 text-sm font-bold bg-orange-50">
        <div className="col-span-4">TOTAL ACTIF</div>
        <div className="col-span-2" />
        <div className="col-span-2" />
        <div className="col-span-2 text-right border-l pl-2">
          <Money amount={bilan.totalActif} />
        </div>
        <div className="col-span-2 text-right">
          <Money amount={bilan.totalActifN1} />
        </div>
      </div>
    </div>
  );
}
