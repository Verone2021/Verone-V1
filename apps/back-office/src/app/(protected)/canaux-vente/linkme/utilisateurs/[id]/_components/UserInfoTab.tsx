'use client';

import { Badge, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Calendar, Mail, Phone, Shield, User } from 'lucide-react';

import type { LinkMeUser } from '../../../hooks/use-linkme-users';

interface UserInfoTabProps {
  user: LinkMeUser;
}

export function UserInfoTab({ user }: UserInfoTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Identite */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            Identite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Prénom</p>
              <p className="font-medium">{user.first_name ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nom</p>
              <p className="font-medium">{user.last_name ?? '-'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              Téléphone
            </p>
            <p className="font-medium">{user.phone ?? '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Compte */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            Compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              Email
            </p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {"Date d'inscription"}
            </p>
            <p className="font-medium">
              {new Date(user.role_created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Statut</p>
            <Badge
              variant={user.is_active ? 'default' : 'secondary'}
              className={
                user.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }
            >
              {user.is_active ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
