'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  RadixSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export interface ExportFilters {
  statut?: string[]
  type?: string[]
  ville?: string
  pays?: string
  date_debut?: string
  date_fin?: string
  is_active?: boolean
}

interface ExportButtonProps {
  exportType: 'proprietes' | 'proprietaires'
  title?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'icon'
  variant?: 'outline' | 'secondary' | 'primaryCopper' | 'primaryGreen' | 'destructive' | 'ghost'
}

const STATUT_OPTIONS = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'sourcing', label: 'Sourcing' },
  { value: 'evaluation', label: 'Évaluation' },
  { value: 'negociation', label: 'Négociation' },
  { value: 'achetee', label: 'Achetée' },
  { value: 'disponible', label: 'Disponible' },
  { value: 'louee', label: 'Louée' },
  { value: 'vendue', label: 'Vendue' },
]

const TYPE_PROPRIETE_OPTIONS = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'studio', label: 'Studio' },
  { value: 'loft', label: 'Loft' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'entrepot', label: 'Entrepôt' },
  { value: 'terrain', label: 'Terrain' },
]

const TYPE_PROPRIETAIRE_OPTIONS = [
  { value: 'physique', label: 'Personne physique' },
  { value: 'morale', label: 'Personne morale' },
]

export function ExportButton({ 
  exportType, 
  title, 
  className, 
  size = 'md',
  variant = 'outline'
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [format, setFormat] = useState<'csv' | 'excel'>('excel')
  const [filters, setFilters] = useState<ExportFilters>({})
  const [selectedStatuts, setSelectedStatuts] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  const handleExport = async () => {
    setIsLoading(true)
    
    try {
      const exportFilters: ExportFilters = {
        ...filters,
        ...(selectedStatuts.length > 0 && { statut: selectedStatuts }),
        ...(selectedTypes.length > 0 && { type: selectedTypes }),
      }
      
      const response = await fetch(`/api/export/${exportType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          filters: exportFilters,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'export')
      }
      
      // Télécharger le fichier
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || `export_${exportType}_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`Export ${format.toUpperCase()} réussi`)
      setIsOpen(false)
      
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'export')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleStatutChange = (statut: string, checked: boolean) => {
    if (checked) {
      setSelectedStatuts(prev => [...prev, statut])
    } else {
      setSelectedStatuts(prev => prev.filter(s => s !== statut))
    }
  }
  
  const handleTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedTypes(prev => [...prev, type])
    } else {
      setSelectedTypes(prev => prev.filter(t => t !== type))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={className}
        >
          <Download className="w-4 h-4 mr-2" />
          {title || 'Exporter'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-copper" />
            Exporter {exportType === 'proprietes' ? 'les propriétés' : 'les propriétaires'}
          </DialogTitle>
          <DialogDescription>
            Choisissez le format et les filtres pour votre export.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Format d&apos;export</Label>
            <Select value={format} onValueChange={(value: 'csv' | 'excel') => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel (.xlsx)
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CSV (.csv)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Filters Section */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Filtres (optionnel)</Label>
            
            {exportType === 'proprietes' && (
              <>
                {/* Statut Filter */}
                <div className="space-y-2">
                  <Label className="text-sm">Statuts</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUT_OPTIONS.map((statut) => (
                      <div key={statut.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`statut-${statut.value}`}
                          checked={selectedStatuts.includes(statut.value)}
                          onCheckedChange={(checked) => handleStatutChange(statut.value, !!checked)}
                        />
                        <Label htmlFor={`statut-${statut.value}`} className="text-sm font-normal">
                          {statut.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Type Filter */}
                <div className="space-y-2">
                  <Label className="text-sm">Types</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPE_PROPRIETE_OPTIONS.map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type.value}`}
                          checked={selectedTypes.includes(type.value)}
                          onCheckedChange={(checked) => handleTypeChange(type.value, !!checked)}
                        />
                        <Label htmlFor={`type-${type.value}`} className="text-sm font-normal">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {exportType === 'proprietaires' && (
              <div className="space-y-2">
                <Label className="text-sm">Types</Label>
                <div className="grid grid-cols-1 gap-2">
                  {TYPE_PROPRIETAIRE_OPTIONS.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type.value}`}
                        checked={selectedTypes.includes(type.value)}
                        onCheckedChange={(checked) => handleTypeChange(type.value, !!checked)}
                      />
                      <Label htmlFor={`type-${type.value}`} className="text-sm font-normal">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Location Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Ville</Label>
                <Input
                  placeholder="Filtrer par ville..."
                  value={filters.ville || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, ville: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Pays</Label>
                <Select value={filters.pays || 'ALL'} onValueChange={(value) => setFilters(prev => ({ ...prev, pays: value === 'ALL' ? undefined : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous pays</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="BE">Belgique</SelectItem>
                    <SelectItem value="CH">Suisse</SelectItem>
                    <SelectItem value="LU">Luxembourg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Date Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Date début</Label>
                <Input
                  type="date"
                  value={filters.date_debut || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_debut: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Date fin</Label>
                <Input
                  type="date"
                  value={filters.date_fin || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_fin: e.target.value }))}
                />
              </div>
            </div>
          </div>
          
          {/* Export Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleExport}
              disabled={isLoading}
              className="bg-copper hover:bg-copper-dark"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}