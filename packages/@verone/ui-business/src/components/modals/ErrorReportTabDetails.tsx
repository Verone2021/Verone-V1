'use client';

import type React from 'react';

import {
  Badge,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@verone/ui';
import { cn } from '@verone/utils';

import type {
  ErrorReport,
  ErrorSeverity,
  ErrorType,
  ReportStatus,
} from './error-report-modal.types';
import { ERROR_TYPE_CONFIG, SEVERITY_CONFIG } from './error-report-modal.types';

interface ErrorReportTabDetailsProps {
  formData: Partial<ErrorReport>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<ErrorReport>>>;
}

export function ErrorReportTabDetails({
  formData,
  setFormData,
}: ErrorReportTabDetailsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titre du problème *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={e =>
              setFormData(prev => ({ ...prev, title: e.target.value }))
            }
            placeholder="Ex: Bouton 'Valider' ne répond pas"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="errorType">Type d'erreur</Label>
          <Select
            value={formData.errorType}
            onValueChange={(value: ErrorType) =>
              setFormData(prev => ({ ...prev, errorType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ERROR_TYPE_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{config.label}</div>
                        <div className="text-xs text-gray-600">
                          {config.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="severity">Sévérité</Label>
          <Select
            value={formData.severity}
            onValueChange={(value: ErrorSeverity) =>
              setFormData(prev => ({ ...prev, severity: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <Badge className={cn('text-xs', config.color)}>
                      {config.label}
                    </Badge>
                    <span className="text-sm">{config.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select
            value={formData.status}
            onValueChange={(value: ReportStatus) =>
              setFormData(prev => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full" />
                  Ouvert
                </div>
              </SelectItem>
              <SelectItem value="in_progress">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-gray-500 rounded-full" />
                  En cours
                </div>
              </SelectItem>
              <SelectItem value="resolved">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  Résolu
                </div>
              </SelectItem>
              <SelectItem value="closed">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-gray-500 rounded-full" />
                  Fermé
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description détaillée *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e =>
            setFormData(prev => ({ ...prev, description: e.target.value }))
          }
          placeholder="Décrivez le problème en détail..."
          className="min-h-[100px]"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expected">Comportement attendu</Label>
          <Textarea
            id="expected"
            value={formData.expectedBehavior}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                expectedBehavior: e.target.value,
              }))
            }
            placeholder="Ce qui devrait se passer..."
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="actual">Comportement observé</Label>
          <Textarea
            id="actual"
            value={formData.actualBehavior}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                actualBehavior: e.target.value,
              }))
            }
            placeholder="Ce qui se passe réellement..."
            className="min-h-[80px]"
          />
        </div>
      </div>
    </div>
  );
}
