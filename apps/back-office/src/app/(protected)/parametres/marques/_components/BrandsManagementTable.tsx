'use client';

import { useEffect, useState } from 'react';

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Pencil, ExternalLink } from 'lucide-react';

import { BrandEditModal, type BrandRow } from './BrandEditModal';

export function BrandsManagementTable() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BrandRow | null>(null);

  const fetchBrands = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('brands')
      .select(
        'id, slug, name, description, brand_color, logo_url, social_handles, website_url, is_active, display_order'
      )
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[BrandsManagementTable] fetch failed:', error);
      setBrands([]);
    } else {
      setBrands((data ?? []) as BrandRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchBrands().catch(err =>
      console.error('[BrandsManagementTable] init failed:', err)
    );
  }, []);

  const handleSaved = () => {
    setEditing(null);
    void fetchBrands().catch(err =>
      console.error('[BrandsManagementTable] refetch failed:', err)
    );
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Chargement…</p>;
  }

  return (
    <>
      {/* Mobile : cartes empilées */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {brands.map(brand => (
          <BrandCard
            key={brand.id}
            brand={brand}
            onEdit={() => setEditing(brand)}
          />
        ))}
      </div>

      {/* Desktop : tableau */}
      <div className="hidden md:block w-full overflow-x-auto rounded border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">Couleur</TableHead>
              <TableHead className="min-w-[140px]">Marque</TableHead>
              <TableHead className="hidden lg:table-cell">Slug</TableHead>
              <TableHead className="hidden xl:table-cell">Site web</TableHead>
              <TableHead className="hidden 2xl:table-cell">Statut</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map(brand => (
              <TableRow key={brand.id}>
                <TableCell>
                  <ColorDot color={brand.brand_color} />
                </TableCell>
                <TableCell className="font-medium">{brand.name}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  <code className="text-xs text-gray-600">{brand.slug}</code>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {brand.website_url ? (
                    <a
                      href={brand.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      {brand.website_url
                        .replace(/^https?:\/\//, '')
                        .slice(0, 30)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      non défini
                    </span>
                  )}
                </TableCell>
                <TableCell className="hidden 2xl:table-cell">
                  {brand.is_active ? (
                    <span className="text-xs text-emerald-600">Actif</span>
                  ) : (
                    <span className="text-xs text-gray-500">Inactif</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(brand)}
                    className="h-9 gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Éditer</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <BrandEditModal
          brand={editing}
          open={editing !== null}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

function BrandCard({ brand, onEdit }: { brand: BrandRow; onEdit: () => void }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ColorDot color={brand.brand_color} />
          <span className="font-medium text-sm">{brand.name}</span>
        </div>
        <span className="text-[10px] text-gray-400">
          {brand.is_active ? 'Actif' : 'Inactif'}
        </span>
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        <div>
          <span className="font-medium">Slug :</span> <code>{brand.slug}</code>
        </div>
        {brand.website_url && (
          <div className="truncate">
            <span className="font-medium">Site :</span> {brand.website_url}
          </div>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        className="h-11 w-full gap-1"
      >
        <Pencil className="h-4 w-4" />
        <span>Éditer</span>
      </Button>
    </div>
  );
}

function ColorDot({ color }: { color: string | null }) {
  return (
    <span
      className="inline-block h-4 w-4 rounded-full border border-gray-300"
      style={color ? { backgroundColor: color } : undefined}
      title={color ?? 'Aucune couleur définie'}
    />
  );
}
