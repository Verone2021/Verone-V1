'use client';

import { useCallback, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Badge } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { AlertTriangle, Package, Save, Loader2, Truck } from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────

interface ProductShipping {
  id: string;
  name: string;
  price_ttc: number;
  weight: number | null;
  shipping_cost_estimate: number | null;
  shipping_class: string | null;
}

// ── Supabase ───────────────────────────────────────────────────

const supabase = createClient();

async function fetchProductsShipping(): Promise<ProductShipping[]> {
  const result = await supabase.rpc('get_site_internet_products');
  const { data, error } = result as {
    data: Array<{
      id: string;
      name: string;
      price_ttc: number;
      weight: number | null;
      shipping_cost_estimate: number | null;
      shipping_class: string | null;
    }> | null;
    error: Error | null;
  };

  if (error) throw error;
  return (data ?? []).map(p => ({
    id: p.id,
    name: p.name,
    price_ttc: p.price_ttc,
    weight: p.weight,
    shipping_cost_estimate: p.shipping_cost_estimate,
    shipping_class: p.shipping_class,
  }));
}

// ── Helpers ────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function getShippingClassLabel(cls: string | null): string {
  switch (cls) {
    case 'small':
      return 'Petit colis';
    case 'medium':
      return 'Colis moyen';
    case 'large':
      return 'Gros colis';
    case 'oversized':
      return 'Hors gabarit';
    default:
      return 'Standard';
  }
}

function getShippingClassColor(cls: string | null): string {
  switch (cls) {
    case 'small':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-blue-100 text-blue-800';
    case 'large':
      return 'bg-orange-100 text-orange-800';
    case 'oversized':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// ── Mutation hook ──────────────────────────────────────────────

function useShippingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      shippingCost,
      shippingClass,
    }: {
      productId: string;
      shippingCost: number | null;
      shippingClass: string;
    }) => {
      // Cast needed: shipping_cost_estimate exists in DB but not in generated Supabase types
      // TODO (session site-internet): regenerate types to remove this cast
      const updateData: Record<string, unknown> = {
        shipping_cost_estimate: shippingCost,
        shipping_class: shippingClass,
      };
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['products-shipping'],
      });
      toast.success('Cout expedition mis a jour');
    },
    onError: (err: Error) => {
      toast.error('Erreur : ' + err.message);
    },
  });
}

// ── Sub-components ─────────────────────────────────────────────

function ShippingCardLoading() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function ShippingCardError() {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-destructive text-sm">
          Erreur de chargement des produits
        </p>
      </CardContent>
    </Card>
  );
}

function ShippingClassSelect({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[130px] h-8">
        <SelectValue>
          <Badge className={getShippingClassColor(value)}>
            {getShippingClassLabel(value)}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="small">Petit colis</SelectItem>
        <SelectItem value="medium">Colis moyen</SelectItem>
        <SelectItem value="standard">Standard</SelectItem>
        <SelectItem value="large">Gros colis</SelectItem>
        <SelectItem value="oversized">Hors gabarit</SelectItem>
      </SelectContent>
    </Select>
  );
}

function ProductShippingRow({
  product,
  currentCost,
  currentClass,
  hasChanges,
  isPending,
  onCostChange,
  onClassChange,
  onSave,
}: {
  product: ProductShipping;
  currentCost: string;
  currentClass: string;
  hasChanges: boolean;
  isPending: boolean;
  onCostChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell className="text-right">
        {formatCurrency(product.price_ttc)}
      </TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">
        {product.weight != null ? `${product.weight} kg` : '—'}
      </TableCell>
      <TableCell>
        <ShippingClassSelect
          value={currentClass}
          onValueChange={onClassChange}
        />
      </TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="—"
          value={currentCost}
          onChange={e => onCostChange(e.target.value)}
          className="w-[100px] h-8 text-right ml-auto"
        />
      </TableCell>
      <TableCell>
        {hasChanges && (
          <button
            onClick={onSave}
            disabled={isPending}
            className="p-1.5 rounded hover:bg-muted transition-colors"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 text-green-600" />
            )}
          </button>
        )}
      </TableCell>
    </TableRow>
  );
}

function ShippingInfoBox() {
  return (
    <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
      <div className="flex items-center gap-2 mb-1">
        <Truck className="h-4 w-4" />
        <span className="font-medium">Comment sont calcules les frais</span>
      </div>
      <p>
        Le checkout prend le maximum entre le forfait de base et le supplement
        du produit le plus cher a expedier dans le panier. Si le panier depasse
        le seuil de gratuite, le forfait de base est offert mais le supplement
        produit s&apos;applique si superieur.
      </p>
    </div>
  );
}

// ── Derived values helper ──────────────────────────────────────

type EditedValues = Record<string, { cost: string; cls: string }>;

function getRowValues(product: ProductShipping, editedValues: EditedValues) {
  const edited = editedValues[product.id];
  const currentCost =
    edited?.cost ??
    (product.shipping_cost_estimate != null
      ? String(product.shipping_cost_estimate)
      : '');
  const currentClass = edited?.cls ?? product.shipping_class ?? 'standard';
  const hasChanges =
    edited !== undefined && (edited.cost !== '' || edited.cls !== '');

  return { currentCost, currentClass, hasChanges };
}

// ── Edit state hook ────────────────────────────────────────────

function useShippingEdits() {
  const [editedValues, setEditedValues] = useState<EditedValues>({});
  const updateMutation = useShippingMutation();

  const handleCostChange = useCallback((productId: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        cost: value,
        cls: prev[productId]?.cls ?? '',
      },
    }));
  }, []);

  const handleClassChange = useCallback((productId: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        cost: prev[productId]?.cost ?? '',
        cls: value,
      },
    }));
  }, []);

  const handleSave = useCallback(
    (product: ProductShipping) => {
      const edited = editedValues[product.id];
      const costStr = edited?.cost ?? '';
      const cls = edited?.cls ?? product.shipping_class ?? 'standard';
      const cost = costStr === '' ? null : parseFloat(costStr);

      updateMutation.mutate({
        productId: product.id,
        shippingCost: cost,
        shippingClass: cls,
      });
    },
    [editedValues, updateMutation]
  );

  return {
    editedValues,
    updateMutation,
    handleCostChange,
    handleClassChange,
    handleSave,
  };
}

// ── Header sub-component ───────────────────────────────────────

function ShippingCardHeader({ noEstimateCount }: { noEstimateCount: number }) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Cout d&apos;expedition par produit
          </CardTitle>
          <CardDescription>
            Definissez le cout d&apos;expedition estime pour chaque produit. Le
            checkout utilisera le supplement le plus eleve du panier.
          </CardDescription>
        </div>
        {noEstimateCount > 0 && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            {noEstimateCount} sans estimation
          </Badge>
        )}
      </div>
    </CardHeader>
  );
}

// ── Table sub-component ────────────────────────────────────────

function ShippingProductTable({
  products,
  editedValues,
  isPending,
  onCostChange,
  onClassChange,
  onSave,
}: {
  products: ProductShipping[];
  editedValues: EditedValues;
  isPending: boolean;
  onCostChange: (productId: string, value: string) => void;
  onClassChange: (productId: string, value: string) => void;
  onSave: (product: ProductShipping) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produit</TableHead>
          <TableHead className="text-right">Prix TTC</TableHead>
          <TableHead className="text-right">Poids</TableHead>
          <TableHead>Classe</TableHead>
          <TableHead className="text-right">Cout expedition (EUR)</TableHead>
          <TableHead className="w-[60px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map(product => {
          const { currentCost, currentClass, hasChanges } = getRowValues(
            product,
            editedValues
          );
          return (
            <ProductShippingRow
              key={product.id}
              product={product}
              currentCost={currentCost}
              currentClass={currentClass}
              hasChanges={hasChanges}
              isPending={isPending}
              onCostChange={v => onCostChange(product.id, v)}
              onClassChange={v => onClassChange(product.id, v)}
              onSave={() => onSave(product)}
            />
          );
        })}
      </TableBody>
    </Table>
  );
}

// ── Component ──────────────────────────────────────────────────

export function ProductShippingCard() {
  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['products-shipping'],
    queryFn: fetchProductsShipping,
    staleTime: 60_000,
  });

  const {
    editedValues,
    updateMutation,
    handleCostChange,
    handleClassChange,
    handleSave,
  } = useShippingEdits();

  const noEstimateCount = products.filter(
    p => p.shipping_cost_estimate == null
  ).length;

  if (isLoading) return <ShippingCardLoading />;
  if (isError) return <ShippingCardError />;

  return (
    <Card>
      <ShippingCardHeader noEstimateCount={noEstimateCount} />
      <CardContent>
        <ShippingProductTable
          products={products}
          editedValues={editedValues}
          isPending={updateMutation.isPending}
          onCostChange={handleCostChange}
          onClassChange={handleClassChange}
          onSave={handleSave}
        />
        <ShippingInfoBox />
      </CardContent>
    </Card>
  );
}
