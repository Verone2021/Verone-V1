'use client';

/**
 * InheritanceRulesCard — Bloc 5 du dashboard Caractéristiques.
 * 2 colonnes : HÉRITÉS (dynamique selon has_common_*) / SPÉCIFIQUES (fixes).
 * Lien vers le groupe si variant_group_id.
 */

import { Lock, User, ExternalLink } from 'lucide-react';

import type { Product } from '../types';

interface InheritanceRulesCardProps {
  product: Product;
}

interface TagChipProps {
  label: string;
  active?: boolean;
}

function TagChip({ label, active = true }: TagChipProps) {
  return (
    <span
      className={
        active
          ? 'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border border-blue-200 bg-blue-50 text-blue-700'
          : 'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border border-neutral-200 bg-neutral-50 text-neutral-500 opacity-50'
      }
    >
      {active && <Lock className="h-2 w-2" />}
      {label}
    </span>
  );
}

function SpecificChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border border-indigo-200 bg-indigo-50 text-indigo-700">
      <User className="h-2 w-2" />
      {label}
    </span>
  );
}

export function InheritanceRulesCard({ product }: InheritanceRulesCardProps) {
  const vg = product.variant_group;
  const hasGroup = product.variant_group_id != null;

  if (!hasGroup) {
    return (
      <div className="bg-blue-50/30 rounded-lg border border-blue-200 p-4">
        <h3 className="text-[10px] uppercase tracking-wide text-blue-600 font-medium mb-2">
          Règles d&apos;héritage
        </h3>
        <p className="text-xs text-blue-500 italic">
          Ce produit n&apos;appartient pas à un groupe de variantes — tous les
          champs sont spécifiques.
        </p>
      </div>
    );
  }

  // Tags hérités dynamiques selon has_common_*
  const inheritedTags = [
    {
      label: 'Dimensions',
      active:
        vg?.dimensions_length != null ||
        vg?.dimensions_width != null ||
        vg?.dimensions_height != null,
    },
    { label: 'Poids', active: vg?.has_common_weight === true },
    { label: 'Style décoratif', active: vg?.style != null },
    {
      label: 'Pièces compatibles',
      active: vg?.suitable_rooms != null && vg.suitable_rooms.length > 0,
    },
    {
      label: 'Prix de revient',
      active: vg?.has_common_cost_price === true,
    },
    { label: 'Fournisseur', active: vg?.has_common_supplier === true },
  ];

  const activeInherited = inheritedTags.filter(t => t.active);
  const inactiveInherited = inheritedTags.filter(t => !t.active);

  const specificTags = [
    'Attributs (color, matière…)',
    'Identification (marque, GTIN)',
    'État (condition)',
    'Vidéo produit',
    'Emballage',
  ];

  return (
    <div className="bg-blue-50/30 rounded-lg border border-blue-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] uppercase tracking-wide text-blue-600 font-medium">
          Règles d&apos;héritage
        </h3>
        {product.variant_group_id && (
          <a
            href={`/produits/catalogue/variantes/${product.variant_group_id}`}
            className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
          >
            Ouvrir le groupe {vg?.name ? `"${vg.name}"` : ''}
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Col Hérités */}
        <div>
          <p className="text-[9px] uppercase tracking-wide text-blue-500 font-medium mb-2 flex items-center gap-1">
            <Lock className="h-2.5 w-2.5" />
            Hérités du groupe
          </p>
          <div className="flex flex-wrap gap-1.5">
            {activeInherited.length > 0 ? (
              activeInherited.map(t => (
                <TagChip key={t.label} label={t.label} active />
              ))
            ) : (
              <span className="text-[10px] text-blue-400 italic">
                Aucun champ hérité
              </span>
            )}
            {inactiveInherited.map(t => (
              <TagChip key={t.label} label={t.label} active={false} />
            ))}
          </div>
        </div>

        {/* Col Spécifiques */}
        <div>
          <p className="text-[9px] uppercase tracking-wide text-indigo-600 font-medium mb-2 flex items-center gap-1">
            <User className="h-2.5 w-2.5" />
            Spécifiques à la variante
          </p>
          <div className="flex flex-wrap gap-1.5">
            {specificTags.map(label => (
              <SpecificChip key={label} label={label} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
