import { Building, Phone, UserCheck, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';

import type { ContactStats } from './types';

interface ContactsStatsProps {
  stats: ContactStats;
}

export function ContactsStats({ stats }: ContactsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <Card className="border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Contacts
          </CardTitle>
          <Users className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">
            {stats.totalContacts}
          </div>
          <p className="text-xs text-gray-500">Contacts enregistrés</p>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Fournisseurs
          </CardTitle>
          <Building className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.supplierContacts}
          </div>
          <p className="text-xs text-gray-500">Contacts fournisseurs</p>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Clients Pro
          </CardTitle>
          <Users className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.customerContacts}
          </div>
          <p className="text-xs text-gray-500">Contacts clients pros</p>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Principaux
          </CardTitle>
          <UserCheck className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {stats.primaryContacts}
          </div>
          <p className="text-xs text-gray-500">Contacts principaux</p>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Actifs
          </CardTitle>
          <Phone className="h-4 w-4 text-gray-900" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">
            {stats.activeContacts}
          </div>
          <p className="text-xs text-gray-500">Contacts actifs</p>
        </CardContent>
      </Card>
    </div>
  );
}
