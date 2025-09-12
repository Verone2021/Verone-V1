'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Copy,
  Home,
  Users,
  Bed,
  Bath,
  Square,
  Euro,
  Calendar,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Building,
  DoorOpen,
  Wifi,
  Car,
  TreePine,
  Waves,
  Dumbbell,
  ShieldCheck,
  Ban,
  Check,
  X,
  Eye
} from 'lucide-react'

import {
  getUnitesByPropriete,
  createUnite,
  updateUnite,
  deleteUnite,
  duplicateUnite,
  updateUniteStatutLocation,
  createMultipleUnites,
  getUnitesStats
} from '@/actions/proprietes-unites'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import * as RadixSelect from '@radix-ui/react-select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// =============================================
// TYPES
// =============================================

type UniteStatut = 'disponible' | 'louee' | 'renovation' | 'indisponible'

interface Unite {
  id: string
  propriete_id: string
  numero?: string
  nom: string
  type?: string
  description?: string
  surface_m2?: number
  nombre_pieces?: number
  nb_chambres?: number
  nb_sdb?: number
  capacite_max?: number
  nb_lits?: number
  etage?: number
  loyer?: number
  charges?: number
  depot_garantie?: number
  statut: UniteStatut
  est_louee: boolean
  date_disponibilite?: string
  amenities?: Record<string, boolean>
  regles?: Record<string, boolean>
  photos_count?: number
}

interface UnitesStats {
  total: number
  disponibles: number
  louees: number
  renovation: number
  indisponibles: number
  loyer_total: number
  loyer_moyen: number
  taux_occupation?: number
  revenus_mensuels?: number
}

interface UnitesManagerProps {
  proprieteId: string
  initialUnites?: Unite[]
  allowBulkCreate?: boolean
  onUnitesChange?: (unites: Unite[]) => void
}

// =============================================
// CONSTANTES
// =============================================

const UNITE_TYPES = [
  { value: 'studio', label: 'Studio', icon: Home },
  { value: 'appartement', label: 'Appartement', icon: Building },
  { value: 'chambre', label: 'Chambre', icon: Bed },
  { value: 'suite', label: 'Suite', icon: DoorOpen },
  { value: 'duplex', label: 'Duplex', icon: Building },
  { value: 'loft', label: 'Loft', icon: Building }
]

const STATUT_OPTIONS = [
  { value: 'disponible', label: 'Disponible', color: 'bg-green-500' },
  { value: 'louee', label: 'Louée', color: 'bg-red-500' },
  { value: 'renovation', label: 'En rénovation', color: 'bg-orange-500' },
  { value: 'indisponible', label: 'Indisponible', color: 'bg-gray-500' }
]

const AMENITIES_LIST = [
  { key: 'wifi', label: 'WiFi', icon: Wifi },
  { key: 'parking', label: 'Parking', icon: Car },
  { key: 'jardin', label: 'Jardin', icon: TreePine },
  { key: 'piscine', label: 'Piscine', icon: Waves },
  { key: 'gym', label: 'Salle de sport', icon: Dumbbell },
  { key: 'securite', label: 'Sécurité 24/7', icon: ShieldCheck }
]

const REGLES_LIST = [
  { key: 'animaux_autorises', label: 'Animaux autorisés' },
  { key: 'fumeur_autorise', label: 'Fumeurs autorisés' },
  { key: 'fetes_autorisees', label: 'Fêtes autorisées' },
  { key: 'enfants_bienvenus', label: 'Enfants bienvenus' }
]

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

export function UnitesManager({
  proprieteId,
  initialUnites = [],
  allowBulkCreate = true,
  onUnitesChange
}: UnitesManagerProps) {
  // State
  const [unites, setUnites] = useState<Unite[]>(initialUnites)
  const [stats, setStats] = useState<UnitesStats | null>(null)
  const [isLoading, setIsLoading] = useState(!initialUnites.length)
  const [editingUnite, setEditingUnite] = useState<Unite | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isBulkCreating, setIsBulkCreating] = useState(false)
  const [expandedUnites, setExpandedUnites] = useState<string[]>([])

  // Chargement initial
  useEffect(() => {
    if (!initialUnites.length) {
      loadUnites()
    }
    loadStats()
  }, [proprieteId])

  const loadUnites = async () => {
    setIsLoading(true)
    const result = await getUnitesByPropriete(proprieteId)
    
    if (result.success && result.data) {
      setUnites(result.data)
      onUnitesChange?.(result.data)
    } else {
      toast.error(result.error || 'Erreur lors du chargement des unités')
    }
    
    setIsLoading(false)
  }

  const loadStats = async () => {
    const result = await getUnitesStats(proprieteId)
    if (result.success && result.data) {
      setStats(result.data)
    }
  }

  // =============================================
  // HANDLERS
  // =============================================

  const handleCreateUnite = async (data: Partial<Unite>) => {
    const result = await createUnite({
      propriete_id: proprieteId,
      nom: data.nom!,
      numero: data.numero,
      type: data.type,
      description: data.description,
      surface_m2: data.surface_m2,
      nombre_pieces: data.nombre_pieces,
      nb_chambres: data.nb_chambres,
      nb_sdb: data.nb_sdb,
      capacite_max: data.capacite_max,
      nb_lits: data.nb_lits,
      etage: data.etage,
      loyer: data.loyer,
      charges: data.charges,
      depot_garantie: data.depot_garantie,
      statut: data.statut || 'disponible',
      est_louee: false,
      amenities: data.amenities,
      regles: data.regles
    })

    if (result.success && result.data) {
      const updatedUnites = [...unites, result.data]
      setUnites(updatedUnites)
      onUnitesChange?.(updatedUnites)
      toast.success('Unité créée avec succès')
      setIsCreating(false)
      loadStats()
    } else {
      toast.error(result.error || 'Erreur lors de la création')
    }
  }

  const handleUpdateUnite = async (uniteId: string, data: Partial<Unite>) => {
    const result = await updateUnite(uniteId, data)

    if (result.success && result.data) {
      const updatedUnites = unites.map(u => 
        u.id === uniteId ? { ...u, ...result.data } : u
      )
      setUnites(updatedUnites)
      onUnitesChange?.(updatedUnites)
      toast.success('Unité mise à jour')
      setEditingUnite(null)
      loadStats()
    } else {
      toast.error(result.error || 'Erreur lors de la mise à jour')
    }
  }

  const handleDeleteUnite = async (uniteId: string) => {
    if (!confirm('Supprimer cette unité ?')) return

    const result = await deleteUnite(uniteId)

    if (result.success) {
      const updatedUnites = unites.filter(u => u.id !== uniteId)
      setUnites(updatedUnites)
      onUnitesChange?.(updatedUnites)
      toast.success('Unité supprimée')
      loadStats()
    } else {
      toast.error(result.error || 'Erreur lors de la suppression')
    }
  }

  const handleDuplicateUnite = async (uniteId: string) => {
    const unite = unites.find(u => u.id === uniteId)
    if (!unite) return

    const result = await duplicateUnite(uniteId, `${unite.nom} (copie)`)

    if (result.success && result.data) {
      const updatedUnites = [...unites, result.data]
      setUnites(updatedUnites)
      onUnitesChange?.(updatedUnites)
      toast.success('Unité dupliquée')
      loadStats()
    } else {
      toast.error(result.error || 'Erreur lors de la duplication')
    }
  }

  const handleToggleStatut = async (uniteId: string, estLouee: boolean) => {
    const result = await updateUniteStatutLocation(uniteId, estLouee)

    if (result.success && result.data) {
      const updatedUnites = unites.map(u => 
        u.id === uniteId ? result.data : u
      )
      setUnites(updatedUnites)
      onUnitesChange?.(updatedUnites)
      toast.success(result.message)
      loadStats()
    } else {
      toast.error(result.error || 'Erreur lors du changement de statut')
    }
  }

  const handleBulkCreate = async (count: number, template: Partial<Unite>) => {
    const result = await createMultipleUnites(proprieteId, count, template)

    if (result.success && result.data) {
      const updatedUnites = [...unites, ...result.data]
      setUnites(updatedUnites)
      onUnitesChange?.(updatedUnites)
      toast.success(result.message)
      setIsBulkCreating(false)
      loadStats()
    } else {
      toast.error(result.error || 'Erreur lors de la création multiple')
    }
  }

  // =============================================
  // RENDER
  // =============================================

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Gestion des unités
              </CardTitle>
              <CardDescription>
                {stats?.total || 0} unités au total
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {allowBulkCreate && unites.length === 0 && (
                <Button
                  variant="outline"
                  onClick={() => setIsBulkCreating(true)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Création multiple
                </Button>
              )}
              
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une unité
              </Button>
            </div>
          </div>
        </CardHeader>

        {stats && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard
                label="Disponibles"
                value={stats.disponibles}
                total={stats.total}
                color="text-green-600"
                icon={<Check className="h-4 w-4" />}
              />
              <StatsCard
                label="Louées"
                value={stats.louees}
                total={stats.total}
                color="text-red-600"
                icon={<Home className="h-4 w-4" />}
              />
              <StatsCard
                label="Loyer moyen"
                value={`${stats.loyer_moyen.toFixed(0)}€`}
                color="text-blue-600"
                icon={<Euro className="h-4 w-4" />}
              />
              <StatsCard
                label="Taux d'occupation"
                value={`${((stats.louees / (stats.total || 1)) * 100).toFixed(0)}%`}
                color="text-purple-600"
                icon={<Users className="h-4 w-4" />}
              />
            </div>

            {stats.total > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Occupation globale</span>
                  <span className="text-sm font-medium">
                    {stats.louees} / {stats.total} unités
                  </span>
                </div>
                <Progress 
                  value={(stats.louees / stats.total) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Liste des unités */}
      {unites.length > 0 ? (
        <div className="space-y-4">
          {unites.map((unite) => (
            <UniteCard
              key={unite.id}
              unite={unite}
              proprieteId={proprieteId}
              isExpanded={expandedUnites.includes(unite.id)}
              onToggleExpand={() => {
                setExpandedUnites(prev =>
                  prev.includes(unite.id)
                    ? prev.filter(id => id !== unite.id)
                    : [...prev, unite.id]
                )
              }}
              onEdit={() => setEditingUnite(unite)}
              onDelete={() => handleDeleteUnite(unite.id)}
              onDuplicate={() => handleDuplicateUnite(unite.id)}
              onToggleStatut={(estLouee) => handleToggleStatut(unite.id, estLouee)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">
              Aucune unité créée pour cette propriété
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer la première unité
              </Button>
              {allowBulkCreate && (
                <Button variant="outline" onClick={() => setIsBulkCreating(true)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Création multiple
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de création/édition */}
      {(isCreating || editingUnite) && (
        <UniteFormDialog
          unite={editingUnite}
          onSave={editingUnite 
            ? (data) => handleUpdateUnite(editingUnite.id, data)
            : handleCreateUnite
          }
          onClose={() => {
            setIsCreating(false)
            setEditingUnite(null)
          }}
        />
      )}

      {/* Dialog de création multiple */}
      {isBulkCreating && (
        <BulkCreateDialog
          onSave={handleBulkCreate}
          onClose={() => setIsBulkCreating(false)}
        />
      )}
    </div>
  )
}

// =============================================
// COMPOSANTS SECONDAIRES
// =============================================

function StatsCard({
  label,
  value,
  total,
  color,
  icon
}: {
  label: string
  value: string | number
  total?: number
  color: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={cn("p-1 rounded", color)}>{icon}</span>
      </div>
      <div className={cn("text-2xl font-bold", color)}>{value}</div>
    </div>
  )
}

function UniteCard({
  unite,
  proprieteId,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatut
}: {
  unite: Unite
  proprieteId: string
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onToggleStatut: (estLouee: boolean) => void
}) {
  const router = useRouter()
  const statutInfo = STATUT_OPTIONS.find(s => s.value === unite.statut)
  const typeInfo = UNITE_TYPES.find(t => t.value === unite.type)
  const TypeIcon = typeInfo?.icon || Home

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="p-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                unite.est_louee ? "bg-red-100" : "bg-green-100"
              )}>
                <TypeIcon className={cn(
                  "h-5 w-5",
                  unite.est_louee ? "text-red-600" : "text-green-600"
                )} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">
                    {unite.numero && `#${unite.numero} - `}{unite.nom}
                  </h4>
                  <Badge 
                    variant="outline"
                    className={cn("text-xs", statutInfo?.color, "text-white")}
                  >
                    {statutInfo?.label}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  {unite.surface_m2 && (
                    <span className="flex items-center gap-1">
                      <Square className="h-3 w-3" />
                      {unite.surface_m2}m²
                    </span>
                  )}
                  {unite.nb_chambres !== undefined && (
                    <span className="flex items-center gap-1">
                      <Bed className="h-3 w-3" />
                      {unite.nb_chambres} ch.
                    </span>
                  )}
                  {unite.capacite_max && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {unite.capacite_max} pers.
                    </span>
                  )}
                  {unite.loyer && (
                    <span className="flex items-center gap-1 font-medium text-gray-900">
                      <Euro className="h-3 w-3" />
                      {unite.loyer}€/mois
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={unite.est_louee}
              onCheckedChange={onToggleStatut}
              aria-label="Statut de location"
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => router.push(`/proprietes/${proprieteId}/unites/${unite.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Collapsible open={isExpanded}>
          <CollapsibleContent className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unite.description && (
                <div className="md:col-span-2">
                  <Label className="text-xs text-gray-500">Description</Label>
                  <p className="text-sm mt-1">{unite.description}</p>
                </div>
              )}

              <div>
                <Label className="text-xs text-gray-500">Détails</Label>
                <div className="space-y-1 mt-1">
                  {unite.nombre_pieces && (
                    <p className="text-sm">
                      <span className="text-gray-600">Pièces :</span> {unite.nombre_pieces}
                    </p>
                  )}
                  {unite.nb_sdb !== undefined && (
                    <p className="text-sm">
                      <span className="text-gray-600">Salles de bain :</span> {unite.nb_sdb}
                    </p>
                  )}
                  {unite.etage !== undefined && (
                    <p className="text-sm">
                      <span className="text-gray-600">Étage :</span> {unite.etage}
                    </p>
                  )}
                  {unite.nb_lits !== undefined && (
                    <p className="text-sm">
                      <span className="text-gray-600">Nombre de lits :</span> {unite.nb_lits}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Tarification</Label>
                <div className="space-y-1 mt-1">
                  {unite.loyer && (
                    <p className="text-sm">
                      <span className="text-gray-600">Loyer :</span> {unite.loyer}€/mois
                    </p>
                  )}
                  {unite.charges && (
                    <p className="text-sm">
                      <span className="text-gray-600">Charges :</span> {unite.charges}€/mois
                    </p>
                  )}
                  {unite.depot_garantie && (
                    <p className="text-sm">
                      <span className="text-gray-600">Dépôt de garantie :</span> {unite.depot_garantie}€
                    </p>
                  )}
                </div>
              </div>

              {unite.amenities && Object.keys(unite.amenities).length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500">Équipements</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(unite.amenities)
                      .filter(([_, value]) => value)
                      .map(([key]) => {
                        const amenity = AMENITIES_LIST.find(a => a.key === key)
                        return amenity ? (
                          <Badge key={key} variant="secondary" className="text-xs">
                            <amenity.icon className="h-3 w-3 mr-1" />
                            {amenity.label}
                          </Badge>
                        ) : null
                      })}
                  </div>
                </div>
              )}

              {unite.date_disponibilite && (
                <div>
                  <Label className="text-xs text-gray-500">Date de disponibilité</Label>
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(unite.date_disponibilite).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

function UniteFormDialog({
  unite,
  onSave,
  onClose
}: {
  unite?: Unite | null
  onSave: (data: Partial<Unite>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState<Partial<Unite>>({
    nom: unite?.nom || '',
    numero: unite?.numero || '',
    type: unite?.type || 'studio',
    description: unite?.description || '',
    surface_m2: unite?.surface_m2 || undefined,
    nombre_pieces: unite?.nombre_pieces || undefined,
    nb_chambres: unite?.nb_chambres || undefined,
    nb_sdb: unite?.nb_sdb || undefined,
    capacite_max: unite?.capacite_max || undefined,
    nb_lits: unite?.nb_lits || undefined,
    etage: unite?.etage || undefined,
    loyer: unite?.loyer || undefined,
    charges: unite?.charges || undefined,
    depot_garantie: unite?.depot_garantie || undefined,
    statut: unite?.statut || 'disponible',
    amenities: unite?.amenities || {},
    regles: unite?.regles || {}
  })

  const handleSubmit = () => {
    if (!formData.nom) {
      toast.error('Le nom est requis')
      return
    }
    onSave(formData)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {unite ? 'Modifier l\'unité' : 'Créer une nouvelle unité'}
          </DialogTitle>
          <DialogDescription>
            Renseignez les informations de l'unité locative
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 bg-white rounded-lg p-1">
          {/* Informations de base */}
          <div>
            <h3 className="font-medium mb-4">Informations générales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero">Numéro</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="Ex: A101, 2B..."
                />
              </div>

              <div>
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: Studio Jardin"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <RadixSelect.Root 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </RadixSelect.Root>
              </div>

              <div>
                <Label htmlFor="statut">Statut</Label>
                <RadixSelect.Root 
                  value={formData.statut} 
                  onValueChange={(value) => setFormData({ ...formData, statut: value as UniteStatut })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUT_OPTIONS.map(statut => (
                      <SelectItem key={statut.value} value={statut.value}>
                        {statut.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </RadixSelect.Root>
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de l'unité..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Caractéristiques */}
          <div>
            <h3 className="font-medium mb-4">Caractéristiques</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="surface">Surface (m²)</Label>
                <Input
                  id="surface"
                  type="number"
                  value={formData.surface_m2}
                  onChange={(e) => setFormData({ ...formData, surface_m2: parseFloat(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="pieces">Nombre de pièces</Label>
                <Input
                  id="pieces"
                  type="number"
                  value={formData.nombre_pieces}
                  onChange={(e) => setFormData({ ...formData, nombre_pieces: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="chambres">Chambres</Label>
                <Input
                  id="chambres"
                  type="number"
                  value={formData.nb_chambres}
                  onChange={(e) => setFormData({ ...formData, nb_chambres: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="sdb">Salles de bain</Label>
                <Input
                  id="sdb"
                  type="number"
                  value={formData.nb_sdb}
                  onChange={(e) => setFormData({ ...formData, nb_sdb: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="capacite">Capacité max</Label>
                <Input
                  id="capacite"
                  type="number"
                  value={formData.capacite_max}
                  onChange={(e) => setFormData({ ...formData, capacite_max: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="lits">Nombre de lits</Label>
                <Input
                  id="lits"
                  type="number"
                  value={formData.nb_lits}
                  onChange={(e) => setFormData({ ...formData, nb_lits: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="etage">Étage</Label>
                <Input
                  id="etage"
                  type="number"
                  value={formData.etage}
                  onChange={(e) => setFormData({ ...formData, etage: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Tarification */}
          <div>
            <h3 className="font-medium mb-4">Tarification</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="loyer">Loyer mensuel (€)</Label>
                <Input
                  id="loyer"
                  type="number"
                  value={formData.loyer}
                  onChange={(e) => setFormData({ ...formData, loyer: parseFloat(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="charges">Charges (€)</Label>
                <Input
                  id="charges"
                  type="number"
                  value={formData.charges}
                  onChange={(e) => setFormData({ ...formData, charges: parseFloat(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="depot">Dépôt de garantie (€)</Label>
                <Input
                  id="depot"
                  type="number"
                  value={formData.depot_garantie}
                  onChange={(e) => setFormData({ ...formData, depot_garantie: parseFloat(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Équipements */}
          <div>
            <h3 className="font-medium mb-4">Équipements</h3>
            <div className="grid grid-cols-2 gap-4">
              {AMENITIES_LIST.map(amenity => (
                <div key={amenity.key} className="flex items-center space-x-2">
                  <Switch
                    checked={formData.amenities?.[amenity.key] || false}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData,
                        amenities: {
                          ...formData.amenities,
                          [amenity.key]: checked
                        }
                      })
                    }
                  />
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <amenity.icon className="h-4 w-4" />
                    {amenity.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Règles */}
          <div>
            <h3 className="font-medium mb-4">Règles</h3>
            <div className="grid grid-cols-2 gap-4">
              {REGLES_LIST.map(regle => (
                <div key={regle.key} className="flex items-center space-x-2">
                  <Switch
                    checked={formData.regles?.[regle.key] || false}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData,
                        regles: {
                          ...formData.regles,
                          [regle.key]: checked
                        }
                      })
                    }
                  />
                  <Label className="cursor-pointer">{regle.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            {unite ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BulkCreateDialog({
  onSave,
  onClose
}: {
  onSave: (count: number, template: Partial<Unite>) => void
  onClose: () => void
}) {
  const [count, setCount] = useState(2)
  const [template, setTemplate] = useState<Partial<Unite>>({
    nom: 'Unité',
    type: 'studio',
    statut: 'disponible'
  })

  const handleSubmit = () => {
    if (count < 1 || count > 20) {
      toast.error('Le nombre doit être entre 1 et 20')
      return
    }
    onSave(count, template)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Création multiple d'unités</DialogTitle>
          <DialogDescription>
            Créez plusieurs unités similaires en une fois
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="count">Nombre d'unités à créer</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
            />
            <p className="text-xs text-gray-500 mt-1">Maximum 20 unités</p>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-4">Modèle d'unité</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-nom">Préfixe du nom</Label>
                <Input
                  id="template-nom"
                  value={template.nom}
                  onChange={(e) => setTemplate({ ...template, nom: e.target.value })}
                  placeholder="Ex: Studio, Appartement..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Les unités seront nommées "{template.nom} 1", "{template.nom} 2", etc.
                </p>
              </div>

              <div>
                <Label htmlFor="template-type">Type</Label>
                <RadixSelect.Root 
                  value={template.type} 
                  onValueChange={(value) => setTemplate({ ...template, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </RadixSelect.Root>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-surface">Surface (m²)</Label>
                  <Input
                    id="template-surface"
                    type="number"
                    value={template.surface_m2}
                    onChange={(e) => setTemplate({ ...template, surface_m2: parseFloat(e.target.value) })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="template-loyer">Loyer (€)</Label>
                  <Input
                    id="template-loyer"
                    type="number"
                    value={template.loyer}
                    onChange={(e) => setTemplate({ ...template, loyer: parseFloat(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              {count} unités seront créées avec les caractéristiques du modèle.
              Vous pourrez les modifier individuellement après création.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            Créer {count} unités
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}