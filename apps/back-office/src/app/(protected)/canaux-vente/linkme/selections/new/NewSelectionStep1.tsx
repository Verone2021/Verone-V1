'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@verone/ui';
import { Info, User } from 'lucide-react';

import {
  LINKME_ROLE_COLORS,
  LINKME_ROLE_LABELS,
} from '../../hooks/use-linkme-users';
import type { LinkMeUser } from '../../hooks/use-linkme-users';

interface NewSelectionStep1Props {
  selectedUserId: string;
  onUserChange: (id: string) => void;
  selectionName: string;
  onNameChange: (v: string) => void;
  selectionDescription: string;
  onDescriptionChange: (v: string) => void;
  status: 'draft' | 'active';
  onStatusChange: (v: 'draft' | 'active') => void;
  usersLoading: boolean;
  eligibleUsers: LinkMeUser[];
  selectedUser: LinkMeUser | null;
}

export function NewSelectionStep1({
  selectedUserId,
  onUserChange,
  selectionName,
  onNameChange,
  selectionDescription,
  onDescriptionChange,
  status,
  onStatusChange,
  usersLoading,
  eligibleUsers,
  selectedUser,
}: NewSelectionStep1Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Étape 1 : Informations générales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="user">Utilisateur LinkMe *</Label>
          <Select value={selectedUserId} onValueChange={onUserChange}>
            <SelectTrigger id="user">
              <SelectValue placeholder="Sélectionner un utilisateur..." />
            </SelectTrigger>
            <SelectContent>
              {usersLoading ? (
                <SelectItem value="loading" disabled>
                  Chargement...
                </SelectItem>
              ) : (
                eligibleUsers.map(user => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>
                        {user.first_name} {user.last_name} ({user.email})
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${LINKME_ROLE_COLORS[user.linkme_role]}`}
                      >
                        {LINKME_ROLE_LABELS[user.linkme_role]}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {selectedUser && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-medium">
                  {selectedUser.organisation_name ??
                    selectedUser.enseigne_name ??
                    "Pas d'organisation"}
                </span>
                {selectedUser.enseigne_name &&
                  selectedUser.organisation_name && (
                    <span className="text-blue-400">
                      • Enseigne: {selectedUser.enseigne_name}
                    </span>
                  )}
              </div>
              {selectedUser.default_margin_rate && (
                <p className="text-blue-500 mt-1">
                  Marge par défaut: {selectedUser.default_margin_rate}%
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la sélection *</Label>
            <Input
              id="name"
              value={selectionName}
              onChange={e => onNameChange(e.target.value)}
              placeholder="Ex: Sélection Mobilier Bureau"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={status}
              onValueChange={v => onStatusChange(v as 'draft' | 'active')}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optionnelle)</Label>
          <Textarea
            id="description"
            value={selectionDescription}
            onChange={e => onDescriptionChange(e.target.value)}
            placeholder="Description de la sélection..."
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
