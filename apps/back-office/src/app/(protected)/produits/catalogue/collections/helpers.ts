// Helpers pour la page collections

export const formatCollectionStyle = (style?: string): string => {
  if (!style) return '';
  const styleMap: Record<string, string> = {
    minimaliste: 'Minimaliste',
    contemporain: 'Contemporain',
    moderne: 'Moderne',
    scandinave: 'Scandinave',
    industriel: 'Industriel',
    classique: 'Classique',
    boheme: 'Bohème',
    art_deco: 'Art Déco',
  };
  return styleMap[style] ?? style;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
