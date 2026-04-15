'use client';

import {
  getCompatibleRooms,
  type ProductForCharacteristics,
} from './product-fixed-characteristics-utils';

interface ProductCompatibleRoomsSectionProps {
  product: ProductForCharacteristics;
}

export function ProductCompatibleRoomsSection({
  product,
}: ProductCompatibleRoomsSectionProps) {
  const compatibleRooms = getCompatibleRooms(product);
  const hasInheritedRooms =
    product.variant_group?.suitable_rooms &&
    product.variant_group.suitable_rooms.length > 0;

  return (
    <div>
      <h4 className="text-sm font-medium text-black mb-2 opacity-70 flex items-center gap-2">
        {hasInheritedRooms
          ? '🏠 Pièces compatibles (héritées du groupe)'
          : 'Pièces de maison compatibles'}
        {hasInheritedRooms && product.variant_group_id && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
            🔒 Non modifiable ici
          </span>
        )}
      </h4>
      <div className="bg-green-50 p-3 rounded border border-green-200">
        <div className="flex flex-wrap gap-2">
          {compatibleRooms.map((room, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
            >
              {room}
            </span>
          ))}
        </div>
        <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
          {hasInheritedRooms ? (
            <>
              🏠 Pièces communes à toutes les variantes du groupe
              {product.variant_group_id && (
                <a
                  href={`/catalogue/variantes/${product.variant_group_id}`}
                  className="underline font-medium hover:text-green-800 ml-1"
                >
                  (modifier dans le groupe)
                </a>
              )}
            </>
          ) : (
            '🏠 Pièces déterminées automatiquement selon le type de produit'
          )}
        </div>
      </div>
    </div>
  );
}
