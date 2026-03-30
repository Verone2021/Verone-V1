export type DirectionFilter = 'in' | 'out' | 'all';

export function getTitle(direction: DirectionFilter): string {
  switch (direction) {
    case 'in':
      return 'Entrées de Stock Réelles';
    case 'out':
      return 'Sorties de Stock Réelles';
    default:
      return 'Tous les Mouvements de Stock Réels';
  }
}

export function getEmptyMessage(direction: DirectionFilter): string {
  switch (direction) {
    case 'in':
      return 'Aucune entrée de stock réelle';
    case 'out':
      return 'Aucune sortie de stock réelle';
    default:
      return 'Aucun mouvement de stock réel';
  }
}
