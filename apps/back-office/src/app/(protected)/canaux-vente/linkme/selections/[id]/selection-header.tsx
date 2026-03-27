'use client';

import { useRouter } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import {
  ArrowLeft,
  Save,
  Eye,
  Package,
  ShoppingCart,
  ExternalLink,
  Loader2,
} from 'lucide-react';

import type { ProductFormData } from './selection-types';

type SelectionSummary = {
  id: string;
  name: string;
  archived_at: string | null;
  slug: string | null;
  products_count?: number | null;
  views_count?: number | null;
  orders_count?: number | null;
  affiliate?: {
    display_name?: string | null;
  } | null;
};

type SelectionPageHeaderProps = {
  selection: SelectionSummary;
  formData: ProductFormData;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onFormChange: (updates: Partial<ProductFormData>) => void;
};

export function SelectionPageHeader({
  selection,
  formData,
  isDirty,
  isSaving,
  onSave,
  onFormChange,
}: SelectionPageHeaderProps) {
  const router = useRouter();

  return (
    <>
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{selection.name}</h1>
            <p className="text-muted-foreground">
              Par {selection.affiliate?.display_name ?? 'Affilié inconnu'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selection.archived_at === null && selection.slug && (
            <a
              href={`https://linkme-blue.vercel.app/s/${selection.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir la boutique
            </a>
          )}
          <Button onClick={onSave} disabled={!isDirty || isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Info + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SelectionInfoCard formData={formData} onFormChange={onFormChange} />
        <SelectionStatsCard selection={selection} />
      </div>
    </>
  );
}

type SelectionInfoCardProps = {
  formData: ProductFormData;
  onFormChange: (updates: Partial<ProductFormData>) => void;
};

function SelectionInfoCard({ formData, onFormChange }: SelectionInfoCardProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Informations</CardTitle>
        <CardDescription>Modifiez les détails de la sélection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => onFormChange({ name: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={e => onFormChange({ description: e.target.value })}
            rows={3}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="price-mode" className="font-medium">
              Affichage des prix
            </Label>
            <p className="text-sm text-muted-foreground">
              Choisissez comment les prix sont affichés aux clients
            </p>
          </div>
          <Select
            value={formData.price_display_mode}
            onValueChange={(value: 'HT' | 'TTC') =>
              onFormChange({ price_display_mode: value })
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TTC">TTC</SelectItem>
              <SelectItem value="HT">HT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

type SelectionStatsCardProps = {
  selection: SelectionSummary;
};

function SelectionStatsCard({ selection }: SelectionStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <Package className="h-5 w-5 text-primary" />
          <div>
            <p className="text-2xl font-bold">
              {selection.products_count ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Produits</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <Eye className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-2xl font-bold">{selection.views_count ?? 0}</p>
            <p className="text-sm text-muted-foreground">Vues</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <ShoppingCart className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-2xl font-bold">{selection.orders_count ?? 0}</p>
            <p className="text-sm text-muted-foreground">Commandes</p>
          </div>
        </div>
        <div className="pt-2">
          <Badge
            variant={selection.archived_at ? 'outline' : 'default'}
            className={
              selection.archived_at
                ? 'bg-gray-50 text-gray-500'
                : 'bg-green-100 text-green-700'
            }
          >
            {selection.archived_at ? 'Archivée' : 'Active'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
