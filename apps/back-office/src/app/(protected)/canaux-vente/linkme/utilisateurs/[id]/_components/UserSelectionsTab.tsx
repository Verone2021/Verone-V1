'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  ChevronRight,
  Eye,
  Loader2,
  Package,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react';

interface UserSelection {
  id: string;
  name: string;
  description: string | null;
  archived_at: string | null;
  products_count: number;
  views_count: number;
  orders_count: number;
  created_at: string;
}

function useUserSelections(
  enseigneId: string | null,
  organisationId: string | null
) {
  const [selections, setSelections] = useState<UserSelection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enseigneId && !organisationId) {
      setSelections([]);
      setLoading(false);
      return;
    }

    const fetchSelections = async () => {
      setLoading(true);
      const supabase = createClient();

      let affiliateId: string | null = null;

      if (enseigneId) {
        const { data: affiliate } = await supabase
          .from('linkme_affiliates')
          .select('id')
          .eq('enseigne_id', enseigneId)
          .limit(1)
          .single();
        affiliateId = affiliate?.id ?? null;
      }

      if (!affiliateId && organisationId) {
        const { data: affiliate } = await supabase
          .from('linkme_affiliates')
          .select('id')
          .eq('organisation_id', organisationId)
          .limit(1)
          .single();
        affiliateId = affiliate?.id ?? null;
      }

      if (!affiliateId) {
        setSelections([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('linkme_selections')
        .select(
          'id, name, description, archived_at, products_count, views_count, orders_count, created_at'
        )
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement sélections utilisateur:', error);
        setSelections([]);
      } else {
        setSelections((data ?? []) as UserSelection[]);
      }
      setLoading(false);
    };

    void fetchSelections().catch(error => {
      console.error('[useUserSelections] fetchSelections failed:', error);
    });
  }, [enseigneId, organisationId]);

  return { selections, loading };
}

interface UserSelectionsTabProps {
  enseigneId: string | null;
  organisationId: string | null;
}

export function UserSelectionsTab({
  enseigneId,
  organisationId,
}: UserSelectionsTabProps) {
  const router = useRouter();
  const { selections, loading } = useUserSelections(enseigneId, organisationId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <ShoppingBag className="h-5 w-5 mr-2 text-purple-500" />
          Sélections créées par cet utilisateur
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({selections.length} sélection{selections.length > 1 ? 's' : ''})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : selections.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-sm text-gray-500 mb-4">
              {"Cet utilisateur n'a créé aucune sélection"}
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/canaux-vente/linkme/selections')}
            >
              Voir toutes les sélections
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {selections.map(selection => {
              const isArchived = selection.archived_at !== null;
              const config = isArchived
                ? {
                    label: 'Archivée',
                    variant: 'outline' as const,
                    className: 'bg-gray-50 text-gray-500',
                  }
                : {
                    label: 'Active',
                    variant: 'default' as const,
                    className: 'bg-green-100 text-green-700',
                  };

              return (
                <div
                  key={selection.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                  onClick={() =>
                    router.push(
                      `/canaux-vente/linkme/selections/${selection.id}`
                    )
                  }
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{selection.name}</h3>
                      <Badge
                        variant={config.variant}
                        className={config.className}
                      >
                        {config.label}
                      </Badge>
                    </div>
                    {selection.description && (
                      <p className="text-sm text-gray-500 truncate mb-2">
                        {selection.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" />
                        {selection.products_count} produit
                        {selection.products_count > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {selection.views_count} vue
                        {selection.views_count > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <ShoppingCart className="h-3.5 w-3.5" />
                        {selection.orders_count} commande
                        {selection.orders_count > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
