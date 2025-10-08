'use client'

import React, { useState, useEffect } from 'react'
import { CalendarDays, Filter, RotateCcw, Search, Users, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { MovementHistoryFilters } from '@/hooks/use-movements-history'
import { useStockMovements } from '@/hooks/use-stock-movements'
import { createClient } from '@/lib/supabase/client'

interface MovementsFiltersProps {
  filters: MovementHistoryFilters
  onFiltersChange: (filters: MovementHistoryFilters) => void
  onReset: () => void
  hasFilters: boolean
}

interface UserOption {
  id: string
  name: string
}

export function MovementsFilters({ filters, onFiltersChange, onReset, hasFilters }: MovementsFiltersProps) {
  const [localFilters, setLocalFilters] = useState<MovementHistoryFilters>(filters)
  const [showDateRange, setShowDateRange] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const { getReasonsByCategory } = useStockMovements()
  const reasonsByCategory = getReasonsByCategory()

  // Labels français professionnels pour les catégories
  const categoryLabels: Record<string, string> = {
    sorties_normales: 'Sorties Normales',
    pertes_degradations: 'Pertes & Dégradations',
    usage_commercial: 'Usage Commercial',
    rd_production: 'R&D & Production',
    retours_sav: 'Retours & SAV',
    ajustements: 'Ajustements',
    entrees_speciales: 'Entrées Spéciales'
  }

  // Charger les utilisateurs ayant effectué des mouvements
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true)
      try {
        const supabase = createClient()

        // Récupérer les utilisateurs uniques des mouvements
        const { data: movementUsers } = await supabase
          .from('stock_movements')
          .select('performed_by')
          .not('performed_by', 'is', null)

        if (!movementUsers || movementUsers.length === 0) {
          setUsers([])
          return
        }

        // Récupérer les IDs utilisateurs uniques
        const userIds = [...new Set(movementUsers.map(m => m.performed_by).filter(Boolean))]

        // Récupérer les profils utilisateurs
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds)

        if (userProfiles) {
          const uniqueUsers = userProfiles.map(profile => ({
            id: profile.user_id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Utilisateur inconnu'
          }))

          setUsers(uniqueUsers.sort((a, b) => a.name.localeCompare(b.name)))
        }
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error)
      } finally {
        setLoadingUsers(false)
      }
    }

    loadUsers()
  }, [])

  // Synchroniser avec les filtres externes
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Appliquer les filtres locaux
  const applyFilters = () => {
    onFiltersChange(localFilters)
  }

  // Raccourcis de dates
  const setDateRange = (range: 'today' | 'week' | 'month' | 'custom') => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (range) {
      case 'today':
        setLocalFilters(prev => ({
          ...prev,
          dateRange: {
            from: today,
            to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
          }
        }))
        break
      case 'week':
        const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000))
        setLocalFilters(prev => ({
          ...prev,
          dateRange: {
            from: weekStart,
            to: now
          }
        }))
        break
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        setLocalFilters(prev => ({
          ...prev,
          dateRange: {
            from: monthStart,
            to: now
          }
        }))
        break
      case 'custom':
        setShowDateRange(true)
        return
    }
    applyFilters()
  }

  // Toggle type de mouvement
  const toggleMovementType = (type: string) => {
    const currentTypes = localFilters.movementTypes || []
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type]

    setLocalFilters(prev => ({
      ...prev,
      movementTypes: newTypes.length > 0 ? newTypes : undefined
    }))
  }

  // Toggle motif
  const toggleReasonCode = (code: string) => {
    const currentCodes = localFilters.reasonCodes || []
    const newCodes = currentCodes.includes(code)
      ? currentCodes.filter(c => c !== code)
      : [...currentCodes, code]

    setLocalFilters(prev => ({
      ...prev,
      reasonCodes: newCodes.length > 0 ? newCodes : undefined
    }))
  }

  // Toggle utilisateur
  const toggleUser = (userId: string) => {
    const currentUsers = localFilters.userIds || []
    const newUsers = currentUsers.includes(userId)
      ? currentUsers.filter(u => u !== userId)
      : [...currentUsers, userId]

    setLocalFilters(prev => ({
      ...prev,
      userIds: newUsers.length > 0 ? newUsers : undefined
    }))
  }

  // Compter les filtres actifs
  const activeFiltersCount = [
    localFilters.dateRange,
    localFilters.movementTypes?.length,
    localFilters.reasonCodes?.length,
    localFilters.userIds?.length,
    localFilters.productSearch
  ].filter(Boolean).length

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filtres
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Filtrer l'historique des mouvements selon vos critères
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Recherche produit */}
        <div className="space-y-2">
          <Label htmlFor="product-search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Rechercher un produit
          </Label>
          <Input
            id="product-search"
            placeholder="Nom ou SKU du produit..."
            value={localFilters.productSearch || ''}
            onChange={(e) => setLocalFilters(prev => ({
              ...prev,
              productSearch: e.target.value || undefined
            }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>

        {/* Période */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Période
          </Label>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange('today')}
              className={localFilters.dateRange &&
                new Date(localFilters.dateRange.from).toDateString() === new Date().toDateString()
                ? 'bg-black text-white' : ''}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange('week')}
            >
              Cette semaine
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange('month')}
            >
              Ce mois
            </Button>
            <Popover open={showDateRange} onOpenChange={setShowDateRange}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Personnalisé
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={localFilters.dateRange ? {
                    from: localFilters.dateRange.from,
                    to: localFilters.dateRange.to
                  } : undefined}
                  onSelect={(range) => {
                    if (range?.from) {
                      setLocalFilters(prev => ({
                        ...prev,
                        dateRange: range.to ? {
                          from: range.from,
                          to: range.to
                        } : {
                          from: range.from,
                          to: range.from
                        }
                      }))
                    }
                  }}
                  numberOfMonths={2}
                />
                <div className="p-3 border-t">
                  <Button
                    onClick={() => {
                      setShowDateRange(false)
                      applyFilters()
                    }}
                    className="w-full"
                  >
                    Appliquer
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {localFilters.dateRange && (
            <div className="text-sm text-gray-600">
              Du {localFilters.dateRange.from.toLocaleDateString('fr-FR')} au{' '}
              {localFilters.dateRange.to.toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>

        {/* Types de mouvement */}
        <div className="space-y-3">
          <Label>Types de mouvement</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'IN', label: 'Entrées', color: 'bg-green-100 text-green-800' },
              { value: 'OUT', label: 'Sorties', color: 'bg-red-100 text-red-800' },
              { value: 'ADJUST', label: 'Ajustements', color: 'bg-blue-100 text-blue-800' },
              { value: 'TRANSFER', label: 'Transferts', color: 'bg-purple-100 text-purple-800' }
            ].map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type.value}`}
                  checked={localFilters.movementTypes?.includes(type.value) || false}
                  onCheckedChange={() => toggleMovementType(type.value)}
                />
                <Label
                  htmlFor={`type-${type.value}`}
                  className={`px-2 py-1 rounded text-xs font-medium ${type.color}`}
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Motifs */}
        <div className="space-y-3">
          <Label className="flex items-center justify-between">
            <span>Motifs</span>
            {localFilters.reasonCodes && localFilters.reasonCodes.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {localFilters.reasonCodes.length} sélectionné{localFilters.reasonCodes.length > 1 ? 's' : ''}
              </Badge>
            )}
          </Label>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {Object.entries(reasonsByCategory).map(([category, reasons]) => (
              <div key={category} className="space-y-2">
                <div className="text-sm font-semibold text-gray-900">
                  {categoryLabels[category] || category}
                </div>
                <div className="space-y-1.5 pl-4">
                  {reasons.map((reason) => (
                    <div key={reason.code} className="flex items-center space-x-2">
                      <Checkbox
                        id={`reason-${reason.code}`}
                        checked={localFilters.reasonCodes?.includes(reason.code) || false}
                        onCheckedChange={() => toggleReasonCode(reason.code)}
                      />
                      <Label
                        htmlFor={`reason-${reason.code}`}
                        className="text-sm cursor-pointer font-normal"
                      >
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Utilisateurs */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </Label>
          {loadingUsers ? (
            <div className="text-sm text-gray-500">Chargement...</div>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={localFilters.userIds?.includes(user.id) || false}
                    onCheckedChange={() => toggleUser(user.id)}
                  />
                  <Label
                    htmlFor={`user-${user.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {user.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={applyFilters} className="flex-1">
            <Filter className="h-4 w-4 mr-2" />
            Appliquer
          </Button>
          {hasFilters && (
            <Button variant="outline" onClick={onReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}