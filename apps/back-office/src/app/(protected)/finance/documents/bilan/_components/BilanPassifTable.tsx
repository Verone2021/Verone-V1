'use client';

import { Money } from '@verone/ui-business';

import { type BilanData, type BilanLine } from './useBilanData';

interface BilanPassifTableProps {
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

function PassifRow({ line }: { line: BilanLine }) {
  return (
    <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm">
      <div className={`col-span-6 ${line.indent ? 'pl-4' : ''}`}>
        {line.label}
      </div>
      <div className="col-span-3 text-right">{renderAmount(line.net)}</div>
      <div className="col-span-3 text-right">{renderAmount(line.netN1)}</div>
    </div>
  );
}

export function BilanPassifTable({ bilan }: BilanPassifTableProps) {
  return (
    <div className="border rounded-xl bg-white overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b">
        <h2 className="font-bold text-sm uppercase tracking-wide">
          Bilan Passif
        </h2>
      </div>

      {/* Header */}
      <div className="grid grid-cols-12 gap-2 px-5 py-2 text-xs font-medium text-muted-foreground border-b">
        <div className="col-span-6" />
        <div className="col-span-3 text-right">
          Exercice {bilan.yearN} (Net)
        </div>
        <div className="col-span-3 text-right">
          Exercice {bilan.yearN1} (Net)
        </div>
      </div>

      {/* Capitaux propres */}
      {bilan.passifLines.map((line, i) => (
        <PassifRow key={`p-${i}`} line={line} />
      ))}

      {/* Total Capitaux Propres */}
      <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm font-semibold bg-gray-50/50">
        <div className="col-span-6">Total Capitaux Propres</div>
        <div className="col-span-3 text-right">
          {renderAmount(bilan.totalCapitauxPropres)}
        </div>
        <div className="col-span-3 text-right">
          {renderAmount(bilan.totalCapitauxPropresN1)}
        </div>
      </div>

      {/* Dettes */}
      {bilan.dettesLines.map((line, i) => (
        <PassifRow key={`d-${i}`} line={line} />
      ))}

      {/* Total Dettes */}
      <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm font-semibold bg-gray-50/50">
        <div className="col-span-6">Total Dettes</div>
        <div className="col-span-3 text-right">
          {renderAmount(bilan.totalDettes)}
        </div>
        <div className="col-span-3 text-right">
          {renderAmount(bilan.totalDettesN1)}
        </div>
      </div>

      {/* Produits constates d'avance */}
      <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm">
        <div className="col-span-6 pl-4">Produits constates d&apos;avance</div>
        <div className="col-span-3 text-right">
          {renderAmount(bilan.produitsConstates)}
        </div>
        <div className="col-span-3 text-right">
          {renderAmount(bilan.produitsConstatesN1)}
        </div>
      </div>

      {/* TOTAL PASSIF */}
      <div className="grid grid-cols-12 gap-2 px-5 py-3 text-sm font-bold bg-orange-50">
        <div className="col-span-6">TOTAL PASSIF</div>
        <div className="col-span-3 text-right">
          <Money amount={bilan.totalPassif} />
        </div>
        <div className="col-span-3 text-right">
          <Money amount={bilan.totalPassifN1} />
        </div>
      </div>
    </div>
  );
}
