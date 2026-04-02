'use client';

/**
 * Echeancier Fiscal — Calendrier des obligations fiscales
 *
 * TVA CA3 (mensuel), Acomptes IS (trimestriel), CFE (annuel), DAS2 (annuel)
 */

import { useMemo, useState, useEffect, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Alert,
  AlertDescription,
} from '@verone/ui';
import { KpiCard, KpiGrid } from '@verone/ui-business';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Check,
  Info,
} from 'lucide-react';

interface FiscalObligation {
  id: string;
  label: string;
  description: string;
  frequency: 'mensuel' | 'trimestriel' | 'annuel';
  dueDate: Date;
  category: 'tva' | 'is' | 'cfe' | 'das2' | 'cloture' | 'greffe';
  action: string;
}

function getStatusBadge(dueDate: Date) {
  const now = new Date();
  const diff = dueDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return (
      <Badge variant="destructive" className="text-[10px]">
        En retard ({Math.abs(daysLeft)}j)
      </Badge>
    );
  }
  if (daysLeft <= 7) {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
        Urgent ({daysLeft}j)
      </Badge>
    );
  }
  if (daysLeft <= 30) {
    return (
      <Badge variant="outline" className="text-[10px]">
        {daysLeft}j
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px]">
      {daysLeft}j
    </Badge>
  );
}

function getCategoryColor(cat: string) {
  switch (cat) {
    case 'tva':
      return 'border-l-blue-500';
    case 'is':
      return 'border-l-purple-500';
    case 'cfe':
      return 'border-l-orange-500';
    case 'das2':
      return 'border-l-green-500';
    case 'cloture':
      return 'border-l-red-500';
    case 'greffe':
      return 'border-l-gray-500';
    default:
      return 'border-l-gray-300';
  }
}

function generateObligations(year: number): FiscalObligation[] {
  const obligations: FiscalObligation[] = [];

  // TVA CA3 mensuelle (avant le 19-24 du mois suivant)
  for (let month = 0; month < 12; month++) {
    const monthNames = [
      'Janvier',
      'Fevrier',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Aout',
      'Septembre',
      'Octobre',
      'Novembre',
      'Decembre',
    ];
    const dueMonth = month + 1; // mois suivant
    const dueYear = dueMonth > 11 ? year + 1 : year;
    const dueMonthIdx = dueMonth % 12;
    obligations.push({
      id: `tva-${year}-${month}`,
      label: `TVA CA3 ${monthNames[month]} ${year}`,
      description: `Declaration et paiement TVA du mois de ${monthNames[month]}`,
      frequency: 'mensuel',
      dueDate: new Date(dueYear, dueMonthIdx, 19),
      category: 'tva',
      action: 'Declarer sur impots.gouv.fr (espace professionnel)',
    });
  }

  // Acomptes IS trimestriels
  const isQuarters = [
    { label: '1er acompte IS', month: 2, day: 15 },
    { label: '2eme acompte IS', month: 5, day: 15 },
    { label: '3eme acompte IS', month: 8, day: 15 },
    { label: '4eme acompte IS', month: 11, day: 15 },
  ];
  isQuarters.forEach((q, i) => {
    obligations.push({
      id: `is-acompte-${year}-${i}`,
      label: `${q.label} ${year}`,
      description:
        "25% de l'IS de l'exercice precedent. Dispense si IS < 3 000 €.",
      frequency: 'trimestriel',
      dueDate: new Date(year, q.month, q.day),
      category: 'is',
      action: 'Paiement sur impots.gouv.fr',
    });
  });

  // Solde IS (15 du 4ème mois après clôture = 15 avril N+1 pour clôture 31/12/N)
  obligations.push({
    id: `is-solde-${year}`,
    label: `Solde IS exercice ${year - 1}`,
    description: 'IS du - acomptes verses. Teledeclaration obligatoire.',
    frequency: 'annuel',
    dueDate: new Date(year, 3, 15),
    category: 'is',
    action: 'Liasse fiscale 2065 + paiement sur impots.gouv.fr',
  });

  // CFE (décembre)
  obligations.push({
    id: `cfe-${year}`,
    label: `CFE ${year}`,
    description: 'Cotisation Fonciere des Entreprises. Paiement en ligne.',
    frequency: 'annuel',
    dueDate: new Date(year, 11, 15),
    category: 'cfe',
    action: 'Paiement sur impots.gouv.fr',
  });

  // DAS2 (31 janvier N+1)
  obligations.push({
    id: `das2-${year}`,
    label: `DAS2 exercice ${year - 1}`,
    description:
      'Declaration honoraires verses > 1 200 € (avocats, consultants...).',
    frequency: 'annuel',
    dueDate: new Date(year, 0, 31),
    category: 'das2',
    action: 'Declaration sur impots.gouv.fr ou jedeclare.com',
  });

  // Clôture + Liasse fiscale (3 mois après clôture + 15j EDI)
  obligations.push({
    id: `cloture-${year}`,
    label: `Cloture exercice ${year - 1}`,
    description:
      'Bilan, Compte de resultat, Annexe, Liasse fiscale 2065+2050-2059.',
    frequency: 'annuel',
    dueDate: new Date(year, 3, 15),
    category: 'cloture',
    action:
      'Preparer dans Finance > Documents, exporter FEC, transmettre liasse',
  });

  // Approbation comptes + Dépôt Greffe (6 mois après clôture)
  obligations.push({
    id: `greffe-${year}`,
    label: `Depot comptes ${year - 1} au Greffe`,
    description: 'PV decision associe unique + depot comptes annuels.',
    frequency: 'annuel',
    dueDate: new Date(year, 6, 31),
    category: 'greffe',
    action: 'Depot sur infogreffe.fr (option confidentialite disponible)',
  });

  return obligations.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

function useFiscalDone() {
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  const fetchDone = useCallback(async () => {
    const supabase = createClient();
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    const { data } = await (supabase as { from: CallableFunction })
      .from('fiscal_obligations_done')
      .select('obligation_id');
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    if (data) {
      setDoneIds(
        new Set((data as { obligation_id: string }[]).map(d => d.obligation_id))
      );
    }
  }, []);

  const markDone = useCallback(async (obligationId: string) => {
    const supabase = createClient();
    /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    await (supabase as { from: CallableFunction })
      .from('fiscal_obligations_done')
      .upsert({ obligation_id: obligationId });
    /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    setDoneIds(prev => new Set([...prev, obligationId]));
  }, []);

  const markUndone = useCallback(async (obligationId: string) => {
    const supabase = createClient();
    /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    await (supabase as { from: CallableFunction })
      .from('fiscal_obligations_done')
      .delete()
      .eq('obligation_id', obligationId);
    /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    setDoneIds(prev => {
      const next = new Set(prev);
      next.delete(obligationId);
      return next;
    });
  }, []);

  useEffect(() => {
    void fetchDone();
  }, [fetchDone]);

  return { doneIds, markDone, markUndone };
}

export default function EcheancierFiscalPage() {
  const currentYear = new Date().getFullYear();
  const now = new Date();
  const { doneIds, markDone, markUndone } = useFiscalDone();

  const obligations = useMemo(
    () => generateObligations(currentYear),
    [currentYear]
  );

  const upcoming = obligations.filter(
    o => o.dueDate >= now && !doneIds.has(o.id)
  );
  const overdue = obligations.filter(
    o =>
      o.dueDate < now &&
      o.dueDate.getFullYear() === currentYear &&
      !doneIds.has(o.id)
  );
  const done = obligations.filter(o => doneIds.has(o.id));
  const nextDue = upcoming[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Echeancier fiscal</h1>
        <p className="text-sm text-muted-foreground">
          Obligations fiscales {currentYear} — SASU regime reel normal IS
        </p>
      </div>

      <KpiGrid columns={4}>
        <KpiCard
          title="Prochaine echeance"
          value={
            nextDue
              ? nextDue.dueDate.toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                })
              : '-'
          }
          icon={<Calendar className="h-4 w-4" />}
        />
        <KpiCard
          title="En retard"
          value={overdue.length}
          valueType="number"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={overdue.length > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          title="A venir (30j)"
          value={
            upcoming.filter(o => {
              const diff = o.dueDate.getTime() - now.getTime();
              return diff <= 30 * 24 * 60 * 60 * 1000;
            }).length
          }
          valueType="number"
          icon={<Clock className="h-4 w-4" />}
        />
        <KpiCard
          title={`Total ${currentYear}`}
          value={obligations.length}
          valueType="number"
          icon={<FileText className="h-4 w-4" />}
        />
      </KpiGrid>

      {/* Guide */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Comment ca marche ?</strong> Chaque obligation affiche sa date
          limite et ou la faire. Quand c&apos;est fait, cliquez sur{' '}
          <strong>Marquer fait</strong>. Les declarations se font sur{' '}
          <strong>impots.gouv.fr</strong> (espace professionnel). Le systeme ne
          declare pas automatiquement — c&apos;est vous qui declarez, puis vous
          confirmez ici.
        </AlertDescription>
      </Alert>

      {/* Overdue */}
      {overdue.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              En retard ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdue.map(o => (
              <div
                key={o.id}
                className={`flex items-center justify-between p-3 rounded-lg border border-l-4 ${getCategoryColor(o.category)} bg-red-50/50`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{o.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.description}
                  </p>
                  <p className="text-xs text-red-600 mt-1">{o.action}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {o.dueDate.toLocaleDateString('fr-FR')}
                    </p>
                    {getStatusBadge(o.dueDate)}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    onClick={() => {
                      void markDone(o.id);
                    }}
                  >
                    <Check className="h-3 w-3" />
                    Fait
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />A venir ({upcoming.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcoming.map(o => (
            <div
              key={o.id}
              className={`flex items-center justify-between p-3 rounded-lg border border-l-4 ${getCategoryColor(o.category)} hover:bg-gray-50 transition-colors`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{o.label}</p>
                <p className="text-xs text-muted-foreground">{o.description}</p>
                <p className="text-xs text-blue-600 mt-1">{o.action}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {o.dueDate.toLocaleDateString('fr-FR')}
                  </p>
                  {getStatusBadge(o.dueDate)}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs"
                  onClick={() => {
                    void markDone(o.id);
                  }}
                >
                  <Check className="h-3 w-3" />
                  Fait
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Done */}
      {done.length > 0 && (
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completees ({done.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {done.map(o => (
              <div
                key={o.id}
                className="flex items-center justify-between p-3 rounded-lg border border-l-4 border-l-green-500 bg-green-50/30 opacity-75"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm line-through text-muted-foreground">
                    {o.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {o.dueDate.toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-xs text-muted-foreground"
                  onClick={() => {
                    void markUndone(o.id);
                  }}
                >
                  Annuler
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
