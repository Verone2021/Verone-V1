'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  AlertTriangle,
  Trash2,
  Eye,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Building2,
  FileText,
  Link2Off,
} from 'lucide-react';
import { toast } from 'sonner';

interface ResetPreview {
  organisations_to_delete: number;
  organisation_names: string[];
  rules_to_disable: number;
  transactions_to_unlink: number;
}

interface ResetResult {
  deleted_organisations: number;
  disabled_rules: number;
  unlinked_transactions: number;
}

export default function FinanceResetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<ResetPreview | null>(null);
  const [result, setResult] = useState<ResetResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Dry run - preview what will be deleted
  const handleDryRun = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Use standard Supabase RPC call pattern
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc(
        'reset_finance_auto_data',
        { p_dry_run: true }
      );

      if (error) throw new Error(error.message || String(error));

      const result = data as {
        dry_run?: boolean;
        preview?: ResetPreview;
      } | null;

      if (result?.preview) {
        setPreview(result.preview);
      } else {
        setPreview({
          organisations_to_delete: 0,
          organisation_names: [],
          rules_to_disable: 0,
          transactions_to_unlink: 0,
        });
      }
    } catch (err) {
      console.error('Dry run error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply reset
  const handleApplyReset = async () => {
    if (!preview) return;

    // Confirmation
    const confirmed = window.confirm(
      `Attention! Cette action va:\n\n` +
        `- Supprimer ${preview.organisations_to_delete} organisation(s) auto-creee(s)\n` +
        `- Desactiver ${preview.rules_to_disable} regle(s)\n` +
        `- Delier ${preview.transactions_to_unlink} transaction(s)\n\n` +
        `Cette action est irreversible. Continuer?`
    );

    if (!confirmed) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use standard Supabase RPC call pattern
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc(
        'reset_finance_auto_data',
        { p_dry_run: false }
      );

      if (error) throw new Error(error.message || String(error));

      const result = data as {
        dry_run?: boolean;
        success?: boolean;
        result?: ResetResult;
      } | null;

      if (result?.result) {
        setResult(result.result);
        setPreview(null);
        toast.success('Reset effectue avec succes');
      }
    } catch (err) {
      console.error('Reset error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast.error('Erreur lors du reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/finance/transactions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Reset Finance Auto-Data
            </h1>
            <p className="text-slate-600">
              Supprimer les organisations auto-creees et desactiver les regles
            </p>
          </div>
        </div>

        {/* Warning Card */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-lg">Attention</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-amber-800 text-sm space-y-2">
            <p>Cette action va:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Supprimer toutes les organisations avec source =
                &apos;transaction_linking&apos;
              </li>
              <li>Desactiver toutes les regles de matching</li>
              <li>Delier les transactions des organisations supprimees</li>
            </ul>
            <p className="font-medium">
              Les organisations manuelles ne seront PAS affectees.
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Commencez par un apercu avant d&apos;appliquer les changements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleDryRun}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && !preview ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Apercu (Dry Run)
              </Button>
              <Button
                variant="destructive"
                onClick={handleApplyReset}
                disabled={isLoading || !preview}
                className="flex-1"
              >
                {isLoading && preview ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Appliquer Reset
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Results */}
        {preview && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Apercu des changements</CardTitle>
                <Badge variant="warning">Simulation</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Organisations */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="font-medium">Organisations a supprimer</p>
                    <p className="text-sm text-slate-500">
                      Source: transaction_linking
                    </p>
                  </div>
                </div>
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  {preview.organisations_to_delete}
                </Badge>
              </div>

              {/* Organisation names */}
              {preview.organisation_names &&
                preview.organisation_names.length > 0 && (
                  <div className="pl-12 space-y-1">
                    {preview.organisation_names.slice(0, 10).map((name, i) => (
                      <p key={i} className="text-sm text-slate-600">
                        - {name}
                      </p>
                    ))}
                    {preview.organisation_names.length > 10 && (
                      <p className="text-sm text-slate-400 italic">
                        ... et {preview.organisation_names.length - 10} autres
                      </p>
                    )}
                  </div>
                )}

              <Separator />

              {/* Rules */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="font-medium">Regles a desactiver</p>
                    <p className="text-sm text-slate-500">
                      Toutes les regles actives
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {preview.rules_to_disable}
                </Badge>
              </div>

              <Separator />

              {/* Transactions */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Link2Off className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="font-medium">Transactions a delier</p>
                    <p className="text-sm text-slate-500">
                      Organisation sera mise a NULL
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {preview.transactions_to_unlink}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <CardTitle>Reset effectue avec succes</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-green-800">
              <p>
                <strong>{result.deleted_organisations}</strong> organisation(s)
                supprimee(s)
              </p>
              <p>
                <strong>{result.disabled_rules}</strong> regle(s) desactivee(s)
              </p>
              <p>
                <strong>{result.unlinked_transactions}</strong> transaction(s)
                deliee(s)
              </p>
              <Separator className="bg-green-200" />
              <Button
                variant="outline"
                onClick={() => router.push('/finance/transactions')}
                className="w-full"
              >
                Retour aux transactions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
