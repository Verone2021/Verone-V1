'use client';

import { useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage, Badge, Button } from '@verone/ui';
import { ArrowLeft, Mail, Pencil } from 'lucide-react';

import type { LinkMeUser } from '../../../hooks/use-linkme-users';
import {
  LINKME_ROLE_COLORS,
  LINKME_ROLE_LABELS,
} from '../../../hooks/use-linkme-users';

interface UserPageHeaderProps {
  user: LinkMeUser;
  onConfigureClick: () => void;
}

export function UserPageHeader({
  user,
  onConfigureClick,
}: UserPageHeaderProps) {
  const router = useRouter();

  const initials =
    [user.first_name?.[0], user.last_name?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase() || user.email[0].toUpperCase();

  const roleLabel = LINKME_ROLE_LABELS[user.linkme_role] ?? user.linkme_role;
  const roleColor =
    LINKME_ROLE_COLORS[user.linkme_role] ?? 'bg-gray-100 text-gray-800';

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar_url ?? undefined} alt={user.email} />
            <AvatarFallback className="text-lg bg-blue-100 text-blue-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.email}
              </h1>
              <Badge className={roleColor}>{roleLabel}</Badge>
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
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="default" size="sm" onClick={onConfigureClick}>
          <Pencil className="h-4 w-4 mr-2" />
          Configurer le profil
        </Button>
      </div>
    </div>
  );
}
