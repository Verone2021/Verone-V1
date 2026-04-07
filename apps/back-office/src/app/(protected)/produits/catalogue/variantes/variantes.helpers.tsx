import { Package, Palette, Ruler, Layers } from 'lucide-react';

export const formatVariantType = (type?: string): string => {
  if (!type) return '';
  const typeMap: Record<string, string> = {
    color: 'Couleur',
    material: 'Matériau',
  };
  return typeMap[type] ?? type;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const getVariantTypeIcon = (type?: string) => {
  switch (type) {
    case 'color':
      return <Palette className="h-4 w-4 text-purple-600" />;
    case 'size':
      return <Ruler className="h-4 w-4 text-blue-600" />;
    case 'material':
      return <Layers className="h-4 w-4 text-green-600" />;
    case 'pattern':
      return <Layers className="h-4 w-4 text-black" />;
    default:
      return <Package className="h-4 w-4 text-gray-600" />;
  }
};
