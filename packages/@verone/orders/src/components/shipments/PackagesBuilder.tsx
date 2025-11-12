'use client';

import { useState } from 'react';

import { ButtonUnified } from '@verone/ui';
import { Card } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Plus, Trash2, Package } from 'lucide-react';

export interface PackageData {
  width: number; // cm
  height: number; // cm
  length: number; // cm
  weight: number; // kg
}

interface PackagesBuilderProps {
  packages: PackageData[];
  onChange: (packages: PackageData[]) => void;
}

export function PackagesBuilder({ packages, onChange }: PackagesBuilderProps) {
  const addPackage = () => {
    onChange([
      ...packages,
      { width: 30, height: 30, length: 30, weight: 1 }, // Valeurs par défaut
    ]);
  };

  const removePackage = (index: number) => {
    onChange(packages.filter((_, i) => i !== index));
  };

  const updatePackage = (
    index: number,
    field: keyof PackageData,
    value: number
  ) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          Colis ({packages.length})
        </Label>
        <ButtonUnified
          type="button"
          variant="outline"
          size="sm"
          onClick={addPackage}
          icon={Plus}
        >
          Ajouter un colis
        </ButtonUnified>
      </div>

      <div className="space-y-3">
        {packages.map((pkg, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Colis {index + 1}</span>
              </div>
              {packages.length > 1 && (
                <ButtonUnified
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePackage(index)}
                  icon={Trash2}
                >
                  Supprimer
                </ButtonUnified>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Dimensions */}
              <div>
                <Label htmlFor={`width-${index}`} className="text-xs">
                  Largeur (cm)
                </Label>
                <Input
                  id={`width-${index}`}
                  type="number"
                  min="1"
                  value={pkg.width}
                  onChange={e =>
                    updatePackage(index, 'width', Number(e.target.value))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`height-${index}`} className="text-xs">
                  Hauteur (cm)
                </Label>
                <Input
                  id={`height-${index}`}
                  type="number"
                  min="1"
                  value={pkg.height}
                  onChange={e =>
                    updatePackage(index, 'height', Number(e.target.value))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`length-${index}`} className="text-xs">
                  Longueur (cm)
                </Label>
                <Input
                  id={`length-${index}`}
                  type="number"
                  min="1"
                  value={pkg.length}
                  onChange={e =>
                    updatePackage(index, 'length', Number(e.target.value))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`weight-${index}`} className="text-xs">
                  Poids (kg)
                </Label>
                <Input
                  id={`weight-${index}`}
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={pkg.weight}
                  onChange={e =>
                    updatePackage(index, 'weight', Number(e.target.value))
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Volume indicator */}
            <div className="mt-2 text-xs text-muted-foreground">
              Volume:{' '}
              {((pkg.width * pkg.height * pkg.length) / 1000000).toFixed(3)} m³
            </div>
          </Card>
        ))}
      </div>

      {packages.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Aucun colis ajouté</p>
          <p className="text-xs mt-1">
            Cliquez sur "Ajouter un colis" pour commencer
          </p>
        </div>
      )}
    </div>
  );
}
