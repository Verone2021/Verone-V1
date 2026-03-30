'use client';

import type { FinancialDocument } from '@verone/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Building2, Calendar, Tag } from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

interface ExpenseInfoCardsProps {
  document: FinancialDocument;
}

// =====================================================================
// COMPONENT
// =====================================================================

export function ExpenseInfoCards({ document }: ExpenseInfoCardsProps) {
  const category = document.description?.match(/\[([^\]]+)\]/)?.[1] ?? 'N/A';
  const partnerName = document.partner
    ? getOrganisationDisplayName(document.partner)
    : 'N/A';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-500">
            Catégorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-gray-400" />
            <p className="font-medium">{category}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-500">
            Fournisseur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-400" />
            <span className="font-medium">{partnerName}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-500">
            Date dépense
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="font-medium">
              {format(new Date(document.document_date), 'dd MMMM yyyy', {
                locale: fr,
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-500">
            Date échéance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="font-medium">
              {document.due_date
                ? format(new Date(document.due_date), 'dd MMMM yyyy', {
                    locale: fr,
                  })
                : 'Non définie'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
