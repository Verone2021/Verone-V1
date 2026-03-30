import {
  Archive,
  ArchiveRestore,
  Eye,
  Mail,
  Phone,
  Trash2,
  Users,
} from 'lucide-react';

import {
  getOrganisationDisplayName,
  type Organisation,
} from '@verone/organisations';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';

import type { Contact, FilterRole, FilterType } from './types';
import { getContactRoles, getOrganisationTypeInfo } from './utils';

interface ContactsTableProps {
  contacts: Contact[];
  loading: boolean;
  searchTerm: string;
  filterType: FilterType;
  filterRole: FilterRole;
  onArchive: (contact: Contact) => Promise<void>;
  onDelete: (contact: Contact) => Promise<void>;
}

export function ContactsTable({
  contacts,
  loading,
  searchTerm,
  filterType,
  filterRole,
  onArchive,
  onDelete,
}: ContactsTableProps) {
  const isFiltered = filterType !== 'all' || filterRole !== 'all';

  return (
    <Card className="border">
      <CardHeader>
        <CardTitle>
          {contacts.length} contact{contacts.length > 1 ? 's' : ''}
          {isFiltered && (
            <span className="text-gray-500 font-normal">
              {' '}
              (filtré{contacts.length > 1 ? 's' : ''})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Chargement des contacts...</div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm
                ? 'Aucun contact trouvé pour cette recherche'
                : 'Aucun contact enregistré'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Contact
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Organisation
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Rôles
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Coordonnées
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Statut
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contacts.map(contact => {
                  const orgTypeInfo = getOrganisationTypeInfo(
                    contact.organisation?.type ?? ''
                  );
                  return (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-medium text-black">
                            {contact.first_name} {contact.last_name}
                          </span>
                          {contact.title && (
                            <p className="text-sm text-gray-500">
                              {contact.title}
                            </p>
                          )}
                          {contact.department && (
                            <p className="text-xs text-gray-400">
                              {contact.department}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className="font-medium text-black">
                            {contact.organisation &&
                              getOrganisationDisplayName(
                                contact.organisation as Organisation
                              )}
                          </span>
                          <Badge
                            variant="outline"
                            className={orgTypeInfo.color}
                          >
                            <div className="flex items-center gap-1">
                              {orgTypeInfo.icon}
                              {orgTypeInfo.label}
                            </div>
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {getContactRoles(contact)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {contact.email}
                          </div>
                          {contact.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-2" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={
                            contact.is_active
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }
                        >
                          {contact.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <ButtonV2
                            variant={!contact.is_active ? 'success' : 'danger'}
                            size="sm"
                            onClick={() => {
                              void onArchive(contact).catch(error => {
                                console.error(
                                  '[ContactsTable] onArchive failed:',
                                  error
                                );
                              });
                            }}
                          >
                            {!contact.is_active ? (
                              <ArchiveRestore className="h-4 w-4" />
                            ) : (
                              <Archive className="h-4 w-4" />
                            )}
                          </ButtonV2>
                          <ButtonV2
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              void onDelete(contact).catch(error => {
                                console.error(
                                  '[ContactsTable] onDelete failed:',
                                  error
                                );
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </ButtonV2>
                          <ButtonV2 variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </ButtonV2>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
