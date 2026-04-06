import { Badge } from '@verone/ui';

export function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-600">
          Brouillon
        </Badge>
      );
    case 'pending_approval':
      return (
        <Badge variant="outline" className="border-gray-300 text-black">
          En attente d&apos;approbation
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="outline" className="border-green-300 text-green-600">
          Approuvée
        </Badge>
      );
    case 'ordered':
      return (
        <Badge variant="outline" className="border-blue-300 text-blue-600">
          Commandée
        </Badge>
      );
    case 'delivered':
      return (
        <Badge variant="outline" className="border-purple-300 text-purple-600">
          Livrée
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="outline" className="border-gray-800 text-gray-800">
          Terminée
        </Badge>
      );
    default:
      return <Badge variant="outline">Inconnu</Badge>;
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
