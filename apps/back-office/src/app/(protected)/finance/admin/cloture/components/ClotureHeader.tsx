'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Lock, Calendar } from 'lucide-react';

interface ClotureHeaderProps {
  selectedYear: string;
  years: number[];
  onYearChange: (year: string) => void;
}

export function ClotureHeader({
  selectedYear,
  years,
  onYearChange,
}: ClotureHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lock className="h-6 w-6" />
          Clôture d&apos;exercice
        </h1>
        <p className="text-muted-foreground">
          Préparation de la clôture comptable annuelle
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={String(year)}>
                Exercice {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
