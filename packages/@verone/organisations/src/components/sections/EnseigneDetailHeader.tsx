'use client';

/**
 * EnseigneDetailHeader - Header pour page détail enseigne
 *
 * Affiche :
 * - Logo enseigne (si présent)
 * - Nom enseigne
 * - Statut actif/inactif
 * - Boutons d'actions (modifier, gérer organisations)
 *
 * @module EnseigneDetailHeader
 */

import Image from 'next/image';
import Link from 'next/link';

import { ButtonV2 } from '@verone/ui';
import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  ArrowLeft,
  Building2,
  Edit,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import type { Enseigne } from '../../hooks/use-enseignes';

interface EnseigneDetailHeaderProps {
  enseigne: Enseigne;
  onEdit?: () => void;
  onManageOrganisations?: () => void;
  /** Callback pour navigation retour (prioritaire sur backUrl) */
  onBack?: () => void;
  /** URL de retour fallback si onBack non fourni */
  backUrl?: string;
  className?: string;
}

/**
 * Header pour la page détail enseigne
 * Pattern inspiré des pages produits/collections
 */
export function EnseigneDetailHeader({
  enseigne,
  onEdit,
  onManageOrganisations,
  onBack,
  backUrl = '/contacts-organisations/enseignes',
  className,
}: EnseigneDetailHeaderProps) {
  return (
    <div className={cn('border-b bg-white', className)}>
      <div className="px-6 py-4">
        {/* Breadcrumb / Back */}
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </button>
        ) : (
          <Link
            href={backUrl}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour aux enseignes
          </Link>
        )}

        {/* Main Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Logo ou icône */}
            <div className="relative flex-shrink-0">
              {enseigne.logo_url ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <Image
                    src={enseigne.logo_url}
                    alt={`Logo ${enseigne.name}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Nom et statut */}
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {enseigne.name}
                </h1>
                <Badge
                  variant={enseigne.is_active ? 'success' : 'secondary'}
                  className="flex items-center"
                >
                  {enseigne.is_active ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>
              {enseigne.description && (
                <p className="text-sm text-gray-500 mt-1 max-w-xl line-clamp-2">
                  {enseigne.description}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {enseigne.member_count || 0} organisation(s) membre(s)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {onManageOrganisations && (
              <ButtonV2 variant="outline" onClick={onManageOrganisations}>
                <Users className="h-4 w-4 mr-2" />
                Gérer organisations
              </ButtonV2>
            )}
            {onEdit && (
              <ButtonV2 onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </ButtonV2>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
