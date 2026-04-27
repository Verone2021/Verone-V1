'use client';

import { useState } from 'react';

import { Badge, Button, Card } from '@verone/ui';
import { CreditCard, Loader2 } from 'lucide-react';

import {
  formatEur,
  usePendingPayouts,
  type PayableAmbassador,
} from '../../hooks/use-pending-payouts';

import { MarkPaidModal } from './MarkPaidModal';

// ============================================
// IBANMasked
// ============================================

function IbanMasked({ iban }: { iban: string | null }) {
  if (!iban) {
    return (
      <Badge variant="destructive" className="text-xs">
        IBAN manquant
      </Badge>
    );
  }
  const last4 = iban.slice(-4);
  const prefix = iban.slice(0, 4);
  return (
    <span className="font-mono text-sm">
      {prefix}••••••••{last4}
    </span>
  );
}

// ============================================
// PayoutRow (desktop)
// ============================================

interface PayoutRowProps {
  ambassador: PayableAmbassador;
  onMarkPaid: (ambassador: PayableAmbassador) => void;
}

function PayoutRow({ ambassador, onMarkPaid }: PayoutRowProps) {
  const validatedCount = ambassador.validatedAttributions.length;

  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      <td className="py-3 px-4 min-w-[180px]">
        <div>
          <div className="font-medium">
            {ambassador.first_name} {ambassador.last_name}
          </div>
          <div className="text-xs text-muted-foreground">
            {ambassador.email}
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-right w-[130px]">
        <span className="font-semibold text-green-700">
          {formatEur(ambassador.current_balance)}
        </span>
      </td>
      <td className="py-3 px-4 hidden lg:table-cell w-[200px]">
        <IbanMasked iban={ambassador.iban} />
      </td>
      <td className="py-3 px-4 hidden xl:table-cell text-center w-[110px]">
        {ambassador.siret_required ? (
          ambassador.siret ? (
            <Badge className="bg-green-100 text-green-700 text-xs">Oui</Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              Manquant
            </Badge>
          )
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </td>
      <td className="py-3 px-4 hidden lg:table-cell text-center w-[100px]">
        <span className="text-sm text-muted-foreground">
          {validatedCount} prime(s)
        </span>
      </td>
      <td className="py-3 px-4 text-center w-[120px]">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onMarkPaid(ambassador)}
          className="h-11 md:h-9 gap-1.5"
        >
          <CreditCard className="h-4 w-4" />
          <span className="hidden sm:inline">Payer</span>
        </Button>
      </td>
    </tr>
  );
}

// ============================================
// PayoutCard (mobile)
// ============================================

function PayoutCard({ ambassador, onMarkPaid }: PayoutRowProps) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">
            {ambassador.first_name} {ambassador.last_name}
          </div>
          <div className="text-xs text-muted-foreground">
            {ambassador.email}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-green-700 text-lg">
            {formatEur(ambassador.current_balance)}
          </div>
          <div className="text-xs text-muted-foreground">
            {ambassador.validatedAttributions.length} prime(s)
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <IbanMasked iban={ambassador.iban} />
        {ambassador.siret_required && !ambassador.siret && (
          <Badge variant="destructive" className="text-xs">
            SIRET manquant
          </Badge>
        )}
      </div>
      <Button
        onClick={() => onMarkPaid(ambassador)}
        className="w-full h-11"
        variant="outline"
      >
        <CreditCard className="h-4 w-4 mr-2" />
        Marquer payé
      </Button>
    </Card>
  );
}

// ============================================
// PayoutTable (main export)
// ============================================

export function PayoutTable() {
  const { data: ambassadors, isLoading, error } = usePendingPayouts();
  const [selected, setSelected] = useState<PayableAmbassador | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleMarkPaid = (ambassador: PayableAmbassador) => {
    setSelected(ambassador);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Erreur lors du chargement des paiements en attente.
      </div>
    );
  }

  const items = ambassadors ?? [];

  return (
    <>
      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {items.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">
            Aucun ambassadeur à payer pour le moment.
          </p>
        ) : (
          items.map(a => (
            <PayoutCard key={a.id} ambassador={a} onMarkPaid={handleMarkPaid} />
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <Card>
          <div className="w-full overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-2 px-4 text-left text-xs font-medium text-muted-foreground uppercase">
                    Ambassadeur
                  </th>
                  <th className="py-2 px-4 text-right text-xs font-medium text-muted-foreground uppercase">
                    Solde dispo
                  </th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">
                    IBAN
                  </th>
                  <th className="py-2 px-4 text-center text-xs font-medium text-muted-foreground uppercase hidden xl:table-cell">
                    SIRET requis
                  </th>
                  <th className="py-2 px-4 text-center text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">
                    Primes
                  </th>
                  <th className="py-2 px-4 text-center text-xs font-medium text-muted-foreground uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-muted-foreground"
                    >
                      Aucun ambassadeur à payer pour le moment.
                    </td>
                  </tr>
                ) : (
                  items.map(a => (
                    <PayoutRow
                      key={a.id}
                      ambassador={a}
                      onMarkPaid={handleMarkPaid}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <MarkPaidModal
        ambassador={selected}
        open={modalOpen}
        onOpenChange={open => {
          setModalOpen(open);
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
