'use client';

import { useRouter } from 'next/navigation';

import { Badge, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Building2, ChevronRight, Link2, Shield, Users } from 'lucide-react';

import type { LinkMeUser } from '../../../hooks/use-linkme-users';
import {
  LINKME_ROLE_COLORS,
  LINKME_ROLE_LABELS,
  LINKME_ROLE_PERMISSIONS,
} from '../../../hooks/use-linkme-users';

interface UserAttachmentsTabProps {
  user: LinkMeUser;
}

export function UserAttachmentsTab({ user }: UserAttachmentsTabProps) {
  const router = useRouter();

  const roleLabel = LINKME_ROLE_LABELS[user.linkme_role] ?? user.linkme_role;
  const roleColor =
    LINKME_ROLE_COLORS[user.linkme_role] ?? 'bg-gray-100 text-gray-800';
  const rolePermissions = LINKME_ROLE_PERMISSIONS[user.linkme_role] ?? [];

  return (
    <div className="space-y-6">
      {/* Role et permissions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            Role et permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Role actuel :</span>
            <Badge className={`${roleColor} text-sm`}>{roleLabel}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Permissions :</p>
            <ul className="space-y-1">
              {rolePermissions.map((permission, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {permission}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Enseigne liee */}
      {user.enseigne_id && (
        <Card
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() =>
            router.push(`/canaux-vente/linkme/enseignes/${user.enseigne_id}`)
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Enseigne liée</p>
                  <p className="font-medium">
                    {user.enseigne_name ?? 'Enseigne'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organisation liee */}
      {user.organisation_id && (
        <Card
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() =>
            router.push(
              `/canaux-vente/linkme/organisations/${user.organisation_id}`
            )
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Organisation liée
                  </p>
                  <p className="font-medium">
                    {user.organisation_name ?? 'Organisation'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aucun rattachement */}
      {!user.enseigne_id && !user.organisation_id && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <Link2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-sm text-gray-500">
                {
                  "Cet utilisateur n'est rattaché à aucune enseigne ou organisation"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
