'use client';

import { useMemo, useState } from 'react';

import { Badge, ButtonV2, Card, CardContent, Input } from '@verone/ui';
import { Copy, Loader2, Plus, Search, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

import {
  useAmbassadors,
  useCreateAmbassadorAuth,
  useToggleAmbassadorActive,
  type Ambassador,
} from '../hooks/use-ambassadors';

import { CreateAmbassadorModal } from './CreateAmbassadorModal';
import { QrCodeInlineButton } from './QrCodeDisplay';

// ============================================
// Stats Grid
// ============================================

interface StatsGridProps {
  ambassadors: Ambassador[];
}

function StatsGrid({ ambassadors }: StatsGridProps) {
  const stats = useMemo(() => {
    const active = ambassadors.filter(a => a.is_active).length;
    const totalSales = ambassadors.reduce(
      (sum, a) => sum + Number(a.total_sales_generated),
      0
    );
    const totalPrimes = ambassadors.reduce(
      (sum, a) => sum + Number(a.total_primes_earned),
      0
    );
    const totalBalance = ambassadors.reduce(
      (sum, a) => sum + Number(a.current_balance),
      0
    );
    return {
      total: ambassadors.length,
      active,
      totalSales,
      totalPrimes,
      totalBalance,
    };
  }, [ambassadors]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Ambassadeurs</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-green-600">
            {stats.active}
          </div>
          <div className="text-sm text-muted-foreground">Actifs</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold">{fmt(stats.totalSales)}</div>
          <div className="text-sm text-muted-foreground">CA genere</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-blue-600">
            {fmt(stats.totalPrimes)}
          </div>
          <div className="text-sm text-muted-foreground">Primes totales</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-orange-600">
            {fmt(stats.totalBalance)}
          </div>
          <div className="text-sm text-muted-foreground">Solde a payer</div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Ambassador Table
// ============================================

interface AmbassadorRowProps {
  ambassador: Ambassador;
  onToggleActive: (id: string, isActive: boolean) => void;
  onCreateAuth: (id: string) => void;
  isCreatingAuth: boolean;
}

function AmbassadorRow({
  ambassador,
  onToggleActive,
  onCreateAuth,
  isCreatingAuth,
}: AmbassadorRowProps) {
  const code = ambassador.codes?.[0];
  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(n);

  const copyCode = () => {
    if (code?.code) {
      void navigator.clipboard.writeText(code.code);
      toast.success(`Code ${code.code} copie`);
    }
  };

  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      <td className="py-3 px-4">
        <div>
          <div className="font-medium">
            {ambassador.first_name} {ambassador.last_name}
          </div>
          <div className="text-xs text-muted-foreground">
            {ambassador.email}
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        {code ? (
          <div className="flex items-center gap-1">
            <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono">
              {code.code}
            </code>
            <button
              type="button"
              onClick={copyCode}
              className="p-1 hover:bg-muted rounded"
            >
              <Copy className="h-3 w-3" />
            </button>
            {code.qr_code_url && (
              <QrCodeInlineButton url={code.qr_code_url} code={code.code} />
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-sm">{ambassador.discount_rate}%</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-sm">{ambassador.commission_rate}%</span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-medium">
          {fmt(Number(ambassador.total_sales_generated))}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-sm">
          {fmt(Number(ambassador.current_balance))}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-sm">{code?.usage_count ?? 0}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <Badge
          variant={ambassador.is_active ? 'default' : 'secondary'}
          className={
            ambassador.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }
        >
          {ambassador.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      </td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-1">
          {!ambassador.auth_user_id && (
            <button
              type="button"
              onClick={() => onCreateAuth(ambassador.id)}
              disabled={isCreatingAuth}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
              title="Creer le compte de connexion"
            >
              Creer compte
            </button>
          )}
          <button
            type="button"
            onClick={() => onToggleActive(ambassador.id, !ambassador.is_active)}
            className="p-1.5 hover:bg-muted rounded"
            title={ambassador.is_active ? 'Desactiver' : 'Activer'}
          >
            {ambassador.is_active ? (
              <UserX className="h-4 w-4 text-red-500" />
            ) : (
              <UserCheck className="h-4 w-4 text-green-500" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ============================================
// Main Section
// ============================================

export function AmbassadorsSection() {
  const { data: ambassadors, isLoading } = useAmbassadors();
  const toggleActive = useToggleAmbassadorActive();
  const createAuth = useCreateAmbassadorAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!ambassadors) return [];
    if (!search) return ambassadors;
    const q = search.toLowerCase();
    return ambassadors.filter(
      a =>
        a.first_name.toLowerCase().includes(q) ||
        a.last_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.codes?.some(c => c.code.toLowerCase().includes(q))
    );
  }, [ambassadors, search]);

  const handleToggle = (id: string, isActive: boolean) => {
    void toggleActive.mutateAsync({ id, isActive }).catch(() => {
      toast.error('Erreur lors du changement de statut');
    });
  };

  const handleCreateAuth = (id: string) => {
    void createAuth.mutateAsync(id).catch((error: unknown) => {
      console.error('[Ambassadors] createAuth failed:', error);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatsGrid ambassadors={ambassadors ?? []} />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un ambassadeur..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <ButtonV2 onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel ambassadeur
        </ButtonV2>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-2 px-4 text-left text-xs font-medium text-muted-foreground uppercase">
                  Ambassadeur
                </th>
                <th className="py-2 px-4 text-left text-xs font-medium text-muted-foreground uppercase">
                  Code
                </th>
                <th className="py-2 px-4 text-center text-xs font-medium text-muted-foreground uppercase">
                  Reduc
                </th>
                <th className="py-2 px-4 text-center text-xs font-medium text-muted-foreground uppercase">
                  Prime
                </th>
                <th className="py-2 px-4 text-right text-xs font-medium text-muted-foreground uppercase">
                  CA genere
                </th>
                <th className="py-2 px-4 text-right text-xs font-medium text-muted-foreground uppercase">
                  Solde
                </th>
                <th className="py-2 px-4 text-center text-xs font-medium text-muted-foreground uppercase">
                  Ventes
                </th>
                <th className="py-2 px-4 text-center text-xs font-medium text-muted-foreground uppercase">
                  Statut
                </th>
                <th className="py-2 px-4 text-center text-xs font-medium text-muted-foreground uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {search
                      ? 'Aucun ambassadeur ne correspond a la recherche'
                      : 'Aucun ambassadeur pour le moment'}
                  </td>
                </tr>
              ) : (
                filtered.map(a => (
                  <AmbassadorRow
                    key={a.id}
                    ambassador={a}
                    onToggleActive={handleToggle}
                    onCreateAuth={handleCreateAuth}
                    isCreatingAuth={createAuth.isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CreateAmbassadorModal open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
