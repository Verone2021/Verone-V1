'use client';

/**
 * Template PV Decision Associe Unique — SASU
 *
 * Genere automatiquement le PV d'approbation des comptes annuels
 * pre-rempli avec les donnees comptables de l'exercice.
 *
 * Regles legales (Code de commerce) :
 * - Art. L227-9 : decision de l'associe unique (pas d'AG en SASU)
 * - Delai : 6 mois apres cloture de l'exercice (30 juin pour exercice au 31/12)
 * - Depot Greffe : 1 mois apres approbation (2 mois si depot electronique)
 * - Documents a deposer : comptes annuels + decision d'affectation du resultat
 *
 * Sources :
 * - service-public.fr — Approbation des comptes SAS/SASU
 * - lecoindesentrepreneurs.fr — SASU approbation et affectation
 * - legalplace.fr — PV assemblee generale SASU
 */

import { useRef } from 'react';

import { Alert, AlertDescription } from '@verone/ui';
import { FileText, Download, Info, Calendar } from 'lucide-react';

interface CloturePVProps {
  selectedYear: string;
  totalRecettes: number;
  totalDepenses: number;
  resultat: number;
  tvaCollectee: number;
  tvaDeductible: number;
  tvaNette: number;
}

function fmt(n: number): string {
  return Math.abs(n).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CloturePV({
  selectedYear,
  totalRecettes,
  totalDepenses,
  resultat,
  tvaCollectee,
  tvaDeductible,
  tvaNette,
}: CloturePVProps) {
  const pvRef = useRef<HTMLDivElement>(null);
  const isBenefice = resultat >= 0;
  const deadlineDate = `30 juin ${parseInt(selectedYear) + 1}`;
  const depotDate = `31 juillet ${parseInt(selectedYear) + 1}`;

  const handlePrint = () => {
    if (!pvRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>PV Decision Associe Unique - Exercice ${selectedYear}</title>
      <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; color: #1a1a1a; }
        h1 { text-align: center; font-size: 18px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        h2 { font-size: 14px; margin-top: 24px; }
        .field { color: #c00; font-style: italic; }
        .amount { font-weight: bold; }
        .signature { margin-top: 60px; border-top: 1px solid #ccc; padding-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        td { padding: 4px 8px; border: 1px solid #ddd; }
        td:last-child { text-align: right; font-weight: bold; }
        @media print { body { margin: 0; } }
      </style></head><body>${pvRef.current.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      {/* Guide */}
      <Alert className="border-indigo-200 bg-indigo-50">
        <Info className="h-4 w-4 text-indigo-600" />
        <AlertDescription className="text-indigo-800 text-sm">
          <strong>PV de decision de l&apos;associe unique</strong> — En SASU,
          pas besoin d&apos;Assemblee Generale. L&apos;associe unique prend seul
          les decisions et les consigne dans un PV. Ce document doit etre redige
          dans les <strong>6 mois</strong> suivant la cloture (avant le{' '}
          <strong>{deadlineDate}</strong>), puis depose au Greffe dans le mois
          suivant (avant le <strong>{depotDate}</strong>, ou 2 mois si depot
          electronique sur infogreffe.fr).
        </AlertDescription>
      </Alert>

      {/* Echeances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3">
          <Calendar className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">Cloture exercice</p>
            <p className="text-sm font-medium">31 decembre {selectedYear}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3">
          <FileText className="h-4 w-4 text-amber-500" />
          <div>
            <p className="text-xs text-gray-500">Date limite approbation</p>
            <p className="text-sm font-medium">{deadlineDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3">
          <FileText className="h-4 w-4 text-red-500" />
          <div>
            <p className="text-xs text-gray-500">Date limite depot Greffe</p>
            <p className="text-sm font-medium">{depotDate}</p>
          </div>
        </div>
      </div>

      {/* Template PV */}
      <div className="border rounded-xl bg-white overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-600" />
            <h2 className="font-semibold text-sm">
              PV de decision — Approbation des comptes {selectedYear}
            </h2>
          </div>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" />
            Imprimer / PDF
          </button>
        </div>

        <div
          ref={pvRef}
          className="px-8 py-6 prose prose-sm max-w-none text-gray-800 leading-relaxed"
        >
          <h1>PROCES-VERBAL DE DECISION DE L&apos;ASSOCIE UNIQUE</h1>

          <p className="text-center text-sm text-gray-500">
            (Article L.227-9 du Code de commerce)
          </p>

          <h2>Identification de la societe</h2>
          <p>
            <span className="text-red-600 italic">[Denomination sociale]</span>,
            SASU au capital de{' '}
            <span className="text-red-600 italic">[montant]</span> euros,
            <br />
            Siege social :{' '}
            <span className="text-red-600 italic">[adresse]</span>,<br />
            Immatriculee au RCS de{' '}
            <span className="text-red-600 italic">[ville]</span> sous le numero{' '}
            <span className="text-red-600 italic">[SIREN]</span>.
          </p>

          <h2>Associe unique</h2>
          <p>
            <span className="text-red-600 italic">[Nom et prenom]</span>, ne(e)
            le <span className="text-red-600 italic">[date]</span>, demeurant{' '}
            <span className="text-red-600 italic">[adresse]</span>, associe
            unique de la societe.
          </p>

          <h2>Decision</h2>
          <p>
            L&apos;associe unique, agissant en lieu et place de l&apos;assemblee
            generale, a pris en date du{' '}
            <span className="text-red-600 italic">[date de la decision]</span>{' '}
            les decisions suivantes relatives a l&apos;exercice clos le 31
            decembre {selectedYear} :
          </p>

          <h2>Premiere resolution — Approbation des comptes annuels</h2>
          <p>
            L&apos;associe unique approuve les comptes annuels de
            l&apos;exercice clos le 31 decembre {selectedYear} tels qu&apos;ils
            lui ont ete presentes, faisant apparaitre :
          </p>

          <table>
            <tbody>
              <tr>
                <td>Chiffre d&apos;affaires (recettes TTC)</td>
                <td>{fmt(totalRecettes)} &euro;</td>
              </tr>
              <tr>
                <td>Total depenses TTC</td>
                <td>{fmt(totalDepenses)} &euro;</td>
              </tr>
              <tr>
                <td>
                  <strong>
                    {isBenefice ? 'Benefice' : 'Perte'} de l&apos;exercice
                  </strong>
                </td>
                <td>
                  <strong>
                    {isBenefice ? '' : '-'}
                    {fmt(resultat)} &euro;
                  </strong>
                </td>
              </tr>
              <tr>
                <td>TVA collectee</td>
                <td>{fmt(tvaCollectee)} &euro;</td>
              </tr>
              <tr>
                <td>TVA deductible</td>
                <td>{fmt(tvaDeductible)} &euro;</td>
              </tr>
              <tr>
                <td>TVA nette ({tvaNette >= 0 ? 'due' : 'credit'})</td>
                <td>{fmt(tvaNette)} &euro;</td>
              </tr>
            </tbody>
          </table>

          <h2>Deuxieme resolution — Affectation du resultat</h2>
          {isBenefice ? (
            <p>
              L&apos;associe unique decide d&apos;affecter le benefice de
              l&apos;exercice, soit <strong>{fmt(resultat)} &euro;</strong>, de
              la maniere suivante :
            </p>
          ) : (
            <p>
              L&apos;associe unique constate la perte de l&apos;exercice, soit{' '}
              <strong>{fmt(resultat)} &euro;</strong>, et decide de
              l&apos;affecter au compte &laquo; Report a nouveau debiteur
              &raquo;.
            </p>
          )}
          {isBenefice && (
            <ul>
              <li>
                Reserve legale (5% du benefice, plafonnee a 10% du capital) :{' '}
                <span className="text-red-600 italic">[montant]</span> &euro;
              </li>
              <li>
                Report a nouveau :{' '}
                <span className="text-red-600 italic">[montant]</span> &euro;
              </li>
              <li>
                Distribution de dividendes :{' '}
                <span className="text-red-600 italic">[montant ou neant]</span>{' '}
                &euro;
              </li>
            </ul>
          )}

          <h2>Troisieme resolution — Conventions reglementees</h2>
          <p>
            L&apos;associe unique prend acte qu&apos;aucune convention visee a
            l&apos;article L.227-10 du Code de commerce n&apos;a ete conclue au
            cours de l&apos;exercice{' '}
            <span className="text-red-600 italic">
              [ou : approuve les conventions suivantes : ...]
            </span>
            .
          </p>

          <h2>Quatrieme resolution — Quitus au president</h2>
          <p>
            L&apos;associe unique donne quitus entier et sans reserve au
            president pour sa gestion au cours de l&apos;exercice clos le 31
            decembre {selectedYear}.
          </p>

          <div className="signature">
            <p>
              Fait a <span className="text-red-600 italic">[ville]</span>, le{' '}
              <span className="text-red-600 italic">[date]</span>
            </p>
            <p className="mt-8">
              L&apos;associe unique,
              <br />
              <span className="text-red-600 italic">[Signature]</span>
            </p>
          </div>
        </div>
      </div>

      {/* Rappel depot Greffe */}
      <Alert className="border-amber-200 bg-amber-50">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 text-sm">
          <strong>Apres signature du PV</strong>, vous devez deposer au Greffe
          du tribunal de commerce :<br />
          1. Les comptes annuels (bilan, compte de resultat, annexe)
          <br />
          2. Le PV de decision d&apos;affectation du resultat
          <br />
          3. Le cas echeant, le rapport de gestion
          <br />
          Delai : 1 mois apres approbation (2 mois si depot electronique sur{' '}
          <strong>infogreffe.fr</strong>). Cout : environ 45 &euro; (depot
          electronique).
        </AlertDescription>
      </Alert>
    </div>
  );
}
