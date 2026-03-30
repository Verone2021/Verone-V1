import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Users } from 'lucide-react';

export function ContactsInfoCard() {
  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Users className="h-5 w-5" />À Propos des Contacts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Fournisseurs</h4>
            <p className="text-blue-600">
              Contacts multiples par fournisseur avec rôles spécialisés :
              commercial, technique, facturation, contact principal.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-blue-700 mb-2">
              Clients Professionnels
            </h4>
            <p className="text-blue-600">
              Contacts d&apos;entreprises clientes. Les clients particuliers ont
              leurs données directement dans l&apos;organisation.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
