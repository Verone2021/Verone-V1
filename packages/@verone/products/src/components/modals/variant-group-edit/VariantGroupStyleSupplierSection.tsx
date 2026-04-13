'use client';

import Link from 'next/link';

import { ROOM_TYPES, DECORATIVE_STYLES } from '@verone/types';
import {
  Checkbox,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { ExternalLink } from 'lucide-react';

interface Supplier {
  id: string;
  legal_name: string;
  trade_name: string | null;
}

interface VariantGroupStyleSupplierSectionProps {
  style: string;
  setStyle: (v: string) => void;
  suitableRooms: string[];
  setSuitableRooms: (v: string[]) => void;
  hasCommonSupplier: boolean;
  setHasCommonSupplier: (v: boolean) => void;
  supplierId: string | undefined;
  setSupplierId: (v: string | undefined) => void;
  suppliers: Supplier[];
  suppliersLoading: boolean;
}

export function VariantGroupStyleSupplierSection({
  style,
  setStyle,
  suitableRooms,
  setSuitableRooms,
  hasCommonSupplier,
  setHasCommonSupplier,
  supplierId,
  setSupplierId,
  suppliers,
  suppliersLoading,
}: VariantGroupStyleSupplierSectionProps) {
  return (
    <>
      {/* Style decoratif */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-sm font-medium">
          Style decoratif (optionnel)
        </Label>
        <p className="text-xs text-gray-600">
          Style commun a tous les produits du groupe
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DECORATIVE_STYLES.map(styleOption => {
            const Icon = styleOption.icon;
            return (
              <button
                key={styleOption.value}
                type="button"
                onClick={() =>
                  setStyle(style === styleOption.value ? '' : styleOption.value)
                }
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 text-center transition-all',
                  style === styleOption.value
                    ? 'border-black bg-black text-white shadow-md'
                    : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                )}
              >
                <Icon className="w-6 h-6" />
                <div className="space-y-1">
                  <div className="font-medium text-sm">{styleOption.label}</div>
                  <div
                    className={cn(
                      'text-xs',
                      style === styleOption.value
                        ? 'text-gray-200'
                        : 'text-gray-500'
                    )}
                  >
                    {styleOption.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pieces compatibles */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-sm font-medium">
          Pieces compatibles (optionnel)
        </Label>
        <p className="text-xs text-gray-600">
          Selectionnez les pieces ou ces produits peuvent etre utilises
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
          {ROOM_TYPES.map(room => (
            <div key={room.value} className="flex items-center space-x-2">
              <Checkbox
                id={`room-${room.value}`}
                checked={suitableRooms.includes(room.value)}
                onCheckedChange={checked => {
                  if (checked) {
                    setSuitableRooms([...suitableRooms, room.value]);
                  } else {
                    setSuitableRooms(
                      suitableRooms.filter(r => r !== room.value)
                    );
                  }
                }}
              />
              <Label
                htmlFor={`room-${room.value}`}
                className="text-xs cursor-pointer"
              >
                {room.label}
              </Label>
            </div>
          ))}
        </div>
        {suitableRooms.length > 0 && (
          <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
            {suitableRooms.length} piece{suitableRooms.length > 1 ? 's' : ''}{' '}
            selectionnee{suitableRooms.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Fournisseur commun */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="has-common-supplier"
            checked={hasCommonSupplier}
            onCheckedChange={checked => {
              setHasCommonSupplier(checked as boolean);
              if (!checked) setSupplierId(undefined);
            }}
          />
          <Label
            htmlFor="has-common-supplier"
            className="text-sm font-medium cursor-pointer"
          >
            Meme fournisseur pour tous les produits
          </Label>
        </div>
        <p className="text-xs text-gray-600 ml-6">
          Si cochee, tous les produits du groupe heriteront automatiquement du
          fournisseur selectionne
        </p>

        {hasCommonSupplier && (
          <div className="ml-6 space-y-2">
            <Label htmlFor="supplier" className="text-sm font-medium">
              Fournisseur commun <span className="text-red-500">*</span>
            </Label>
            <Select
              value={supplierId}
              onValueChange={setSupplierId}
              disabled={suppliersLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.legal_name ?? supplier.trade_name ?? 'Sans nom'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {supplierId && (
              <Link
                href={`/contacts-organisations/suppliers/${supplierId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Voir la fiche detail du fournisseur
              </Link>
            )}
            <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
              Ce fournisseur sera applique automatiquement a tous les produits
              du groupe
            </p>
          </div>
        )}
      </div>
    </>
  );
}
