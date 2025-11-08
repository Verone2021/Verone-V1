'use client';

import React, { useState } from 'react';

import {
  Shield,
  Crown,
  Users,
  Package,
  ShoppingCart,
  Eye,
  Info,
} from 'lucide-react';

import { Badge } from './badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

export type UserRole =
  | 'owner'
  | 'admin'
  | 'catalog_manager'
  | 'sales'
  | 'partner_manager';

interface RoleConfig {
  label: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  permissions: string[];
  bgClass: string;
  textClass: string;
  borderClass: string;
}

const roleConfigs: Record<UserRole, RoleConfig> = {
  owner: {
    label: 'Propriétaire',
    description: 'Accès complet à toutes les fonctionnalités du système',
    color: 'purple',
    icon: <Crown className="h-3 w-3" />,
    permissions: [
      'Gestion complète des utilisateurs',
      'Configuration système',
      'Accès à tous les modules',
      'Gestion des organisations',
      'Supervision complète',
      'Exports et rapports avancés',
    ],
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-800',
    borderClass: 'border-purple-200',
  },
  admin: {
    label: 'Administrateur',
    description: 'Gestion administrative avancée du système',
    color: 'blue',
    icon: <Shield className="h-3 w-3" />,
    permissions: [
      'Gestion des utilisateurs',
      'Configuration des modules',
      'Accès aux rapports',
      'Gestion des clients',
      'Supervision des commandes',
      'Paramètres avancés',
    ],
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-200',
  },
  catalog_manager: {
    label: 'Gestionnaire Catalogue',
    description: 'Gestion complète du catalogue produits',
    color: 'green',
    icon: <Package className="h-3 w-3" />,
    permissions: [
      'Création/modification produits',
      'Gestion des catégories',
      'Import/export catalogue',
      'Gestion des stocks',
      'Tarification produits',
      'Photos et médias',
    ],
    bgClass: 'bg-green-100',
    textClass: 'text-green-800',
    borderClass: 'border-green-200',
  },
  sales: {
    label: 'Commercial',
    description: 'Gestion des ventes et relations clients',
    color: 'orange',
    icon: <ShoppingCart className="h-3 w-3" />,
    permissions: [
      'Création des devis',
      'Gestion des commandes',
      'Suivi clients',
      'Consultation catalogue',
      'Génération de rapports vente',
      'Export catalogues clients',
    ],
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-900',
    borderClass: 'border-gray-200',
  },
  partner_manager: {
    label: 'Gestionnaire Partenaires',
    description: 'Gestion des partenaires et fournisseurs',
    color: 'indigo',
    icon: <Users className="h-3 w-3" />,
    permissions: [
      'Gestion des partenaires',
      'Coordination fournisseurs',
      'Accès catalogues partenaires',
      'Rapports partenariats',
      'Communication externe',
      'Gestion des accès partenaires',
    ],
    bgClass: 'bg-indigo-100',
    textClass: 'text-indigo-800',
    borderClass: 'border-indigo-200',
  },
};

interface RoleBadgeProps {
  role: UserRole;
  showDetails?: boolean;
  className?: string;
}

export function RoleBadge({
  role,
  showDetails = true,
  className = '',
}: RoleBadgeProps) {
  const config = roleConfigs[role];

  if (!showDetails) {
    return (
      <Badge
        className={`${config.bgClass} ${config.textClass} border ${config.borderClass} ${className}`}
      >
        <span className="flex items-center space-x-1">
          {config.icon}
          <span>{config.label}</span>
        </span>
      </Badge>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${config.bgClass} ${config.textClass} ${config.borderClass} ${className}`}
        >
          {config.icon}
          <span>{config.label}</span>
          <Info className="h-3 w-3 opacity-60" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {config.icon}
            <span>{config.label}</span>
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-black mb-2">
              Permissions et accès :
            </h4>
            <ul className="space-y-1">
              {config.permissions.map((permission, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-2 text-sm text-black opacity-80"
                >
                  <Eye className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>{permission}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={`p-3 rounded border ${config.borderClass} ${config.bgClass}`}
          >
            <p className={`text-xs ${config.textClass} opacity-90`}>
              Ce rôle donne accès aux fonctionnalités essentielles pour{' '}
              {config.label.toLowerCase()} au sein du système Vérone.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
