import {
  Building2,
  Tag,
  DollarSign,
  Camera,
  Ruler,
  Weight,
} from 'lucide-react';

// Options de filtres par champ manquant (onglet "À compléter")
export const MISSING_FIELD_OPTIONS = [
  { key: 'supplier', label: 'Fournisseur', icon: Building2 },
  { key: 'subcategory', label: 'Sous-catégorie', icon: Tag },
  { key: 'price', label: "Prix d'achat", icon: DollarSign },
  { key: 'photo', label: 'Photo', icon: Camera },
  { key: 'dimensions', label: 'Dimensions', icon: Ruler },
  { key: 'weight', label: 'Poids', icon: Weight },
] as const;

// Interface filtres - multi-niveaux (Famille > Catégorie > Sous-catégorie)
export interface Filters {
  search: string;
  families: string[];
  categories: string[];
  subcategories: string[];
  suppliers: string[];
  statuses: string[];
  missingFields: string[];
  stockLevels: string[];
  conditions: string[];
  completionLevels: string[];
}
