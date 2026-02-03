// Types pour les pièces/espaces - Basés sur standards immobiliers français
export type RoomType =
  // Pièces principales
  | 'salon'
  | 'salle_a_manger'
  | 'chambre'
  | 'bureau'
  | 'bibliotheque'
  | 'salon_sejour'

  // Pièces de service
  | 'cuisine'
  | 'salle_de_bain'
  | 'wc'
  | 'toilettes'
  | 'hall_entree'
  | 'couloir'
  | 'cellier'
  | 'buanderie'
  | 'dressing'
  | 'cave'
  | 'grenier'
  | 'garage'

  // Espaces extérieurs
  | 'terrasse'
  | 'balcon'
  | 'jardin'
  | 'veranda'
  | 'loggia'
  | 'cour'
  | 'patio'

  // Pièces spécialisées
  | 'salle_de_jeux'
  | 'salle_de_sport'
  | 'atelier'
  | 'mezzanine'
  | 'sous_sol';

// Configuration des pièces avec libellés et catégories
export interface RoomConfig {
  value: RoomType;
  label: string;
  category: 'principales' | 'service' | 'exterieures' | 'specialisees';
  description?: string;
}

// Configuration complète des pièces
export const ROOM_CONFIGS: RoomConfig[] = [
  // Pièces principales
  {
    value: 'salon',
    label: 'Salon',
    category: 'principales',
    description: 'Espace de détente et de réception',
  },
  {
    value: 'salle_a_manger',
    label: 'Salle à manger',
    category: 'principales',
    description: 'Espace repas principal',
  },
  {
    value: 'chambre',
    label: 'Chambre',
    category: 'principales',
    description: 'Chambre à coucher',
  },
  {
    value: 'bureau',
    label: 'Bureau',
    category: 'principales',
    description: 'Espace de travail',
  },
  {
    value: 'bibliotheque',
    label: 'Bibliothèque',
    category: 'principales',
    description: 'Espace lecture et rangement livres',
  },
  {
    value: 'salon_sejour',
    label: 'Salon-séjour',
    category: 'principales',
    description: 'Espace de vie ouvert',
  },

  // Pièces de service
  {
    value: 'cuisine',
    label: 'Cuisine',
    category: 'service',
    description: 'Espace préparation culinaire',
  },
  {
    value: 'salle_de_bain',
    label: 'Salle de bain',
    category: 'service',
    description: 'Espace hygiène avec baignoire/douche',
  },
  {
    value: 'wc',
    label: 'WC',
    category: 'service',
    description: 'Toilettes séparées',
  },
  {
    value: 'toilettes',
    label: 'Toilettes',
    category: 'service',
    description: 'Espace sanitaire',
  },
  {
    value: 'hall_entree',
    label: "Hall d'entrée",
    category: 'service',
    description: "Espace d'accueil",
  },
  {
    value: 'couloir',
    label: 'Couloir',
    category: 'service',
    description: 'Espace de circulation',
  },
  {
    value: 'cellier',
    label: 'Cellier',
    category: 'service',
    description: 'Espace de stockage alimentaire',
  },
  {
    value: 'buanderie',
    label: 'Buanderie',
    category: 'service',
    description: 'Espace lavage et repassage',
  },
  {
    value: 'dressing',
    label: 'Dressing',
    category: 'service',
    description: 'Espace rangement vêtements',
  },
  {
    value: 'cave',
    label: 'Cave',
    category: 'service',
    description: 'Espace de stockage en sous-sol',
  },
  {
    value: 'grenier',
    label: 'Grenier',
    category: 'service',
    description: 'Espace de stockage sous toiture',
  },
  {
    value: 'garage',
    label: 'Garage',
    category: 'service',
    description: 'Stationnement véhicules',
  },

  // Espaces extérieurs
  {
    value: 'terrasse',
    label: 'Terrasse',
    category: 'exterieures',
    description: 'Espace extérieur aménagé',
  },
  {
    value: 'balcon',
    label: 'Balcon',
    category: 'exterieures',
    description: 'Plateforme extérieure en hauteur',
  },
  {
    value: 'jardin',
    label: 'Jardin',
    category: 'exterieures',
    description: 'Espace vert extérieur',
  },
  {
    value: 'veranda',
    label: 'Véranda',
    category: 'exterieures',
    description: 'Espace vitré ouvert sur extérieur',
  },
  {
    value: 'loggia',
    label: 'Loggia',
    category: 'exterieures',
    description: 'Balcon couvert intégré',
  },
  {
    value: 'cour',
    label: 'Cour',
    category: 'exterieures',
    description: 'Espace extérieur clos',
  },
  {
    value: 'patio',
    label: 'Patio',
    category: 'exterieures',
    description: 'Cour intérieure',
  },

  // Pièces spécialisées
  {
    value: 'salle_de_jeux',
    label: 'Salle de jeux',
    category: 'specialisees',
    description: 'Espace récréatif',
  },
  {
    value: 'salle_de_sport',
    label: 'Salle de sport',
    category: 'specialisees',
    description: 'Espace fitness et exercice',
  },
  {
    value: 'atelier',
    label: 'Atelier',
    category: 'specialisees',
    description: 'Espace de bricolage et création',
  },
  {
    value: 'mezzanine',
    label: 'Mezzanine',
    category: 'specialisees',
    description: 'Étage intermédiaire',
  },
  {
    value: 'sous_sol',
    label: 'Sous-sol',
    category: 'specialisees',
    description: 'Niveau inférieur',
  },
];

// Groupes par catégorie pour affichage organisé
export const ROOM_CATEGORIES = {
  principales: 'Pièces principales',
  service: 'Pièces de service',
  exterieures: 'Espaces extérieurs',
  specialisees: 'Pièces spécialisées',
} as const;

// Helper functions
export const getRoomConfig = (roomType: RoomType): RoomConfig | undefined => {
  return ROOM_CONFIGS.find(config => config.value === roomType);
};

export const getRoomLabel = (roomType: RoomType): string => {
  const config = getRoomConfig(roomType);
  return config?.label ?? roomType;
};

export const getRoomsByCategory = (
  category: keyof typeof ROOM_CATEGORIES
): RoomConfig[] => {
  return ROOM_CONFIGS.filter(config => config.category === category);
};
