'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Activity,
  Clock,
  User,
  Edit,
  Plus,
  Trash,
  Image,
  FileText,
  Euro,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Key,
  UserPlus,
  UserMinus,
  Calendar,
  Filter,
  Download,
  Shield,
  Home,
  Settings,
  Loader2
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface PropertyActivityLogProps {
  propertyId: string
  className?: string
}

interface ActivityItem {
  id: string
  type: 'creation' | 'update' | 'delete' | 'status_change' | 'photo' | 'document' | 'financial' | 'permission' | 'maintenance'
  action: string
  description: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  timestamp: string
  metadata?: {
    oldValue?: any
    newValue?: any
    amount?: number
    currency?: string
    documentName?: string
    photoCount?: number
    status?: string
  }
  importance: 'low' | 'medium' | 'high' | 'critical'
}

// Sample activity data (à remplacer par des vraies données)
const sampleActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'creation',
    action: 'Propriété créée',
    description: 'La propriété a été créée et ajoutée au système',
    user: {
      id: '1',
      name: 'Marie Dupont',
      email: 'marie.dupont@wantitnow.com',
    },
    timestamp: '2024-01-15T10:30:00',
    importance: 'high'
  },
  {
    id: '2',
    type: 'photo',
    action: 'Photos ajoutées',
    description: '5 nouvelles photos ont été ajoutées à la galerie',
    user: {
      id: '1',
      name: 'Marie Dupont',
      email: 'marie.dupont@wantitnow.com',
    },
    timestamp: '2024-01-16T14:20:00',
    metadata: {
      photoCount: 5
    },
    importance: 'medium'
  },
  {
    id: '3',
    type: 'status_change',
    action: 'Statut modifié',
    description: 'Le statut est passé de "Brouillon" à "Disponible"',
    user: {
      id: '2',
      name: 'Jean Martin',
      email: 'jean.martin@wantitnow.com',
    },
    timestamp: '2024-01-17T09:15:00',
    metadata: {
      oldValue: 'brouillon',
      newValue: 'disponible',
      status: 'disponible'
    },
    importance: 'high'
  },
  {
    id: '4',
    type: 'financial',
    action: 'Prix mis à jour',
    description: 'Le prix d\'acquisition a été modifié',
    user: {
      id: '2',
      name: 'Jean Martin',
      email: 'jean.martin@wantitnow.com',
    },
    timestamp: '2024-01-18T11:45:00',
    metadata: {
      oldValue: 450000,
      newValue: 475000,
      amount: 475000,
      currency: 'EUR'
    },
    importance: 'high'
  },
  {
    id: '5',
    type: 'document',
    action: 'Document ajouté',
    description: 'Acte de vente ajouté aux documents',
    user: {
      id: '1',
      name: 'Marie Dupont',
      email: 'marie.dupont@wantitnow.com',
    },
    timestamp: '2024-01-19T15:30:00',
    metadata: {
      documentName: 'Acte de vente.pdf'
    },
    importance: 'medium'
  },
  {
    id: '6',
    type: 'permission',
    action: 'Accès accordé',
    description: 'Accès en lecture accordé à Pierre Leroy',
    user: {
      id: '2',
      name: 'Jean Martin',
      email: 'jean.martin@wantitnow.com',
    },
    timestamp: '2024-01-20T10:00:00',
    importance: 'low'
  },
  {
    id: '7',
    type: 'maintenance',
    action: 'Maintenance planifiée',
    description: 'Inspection annuelle programmée pour le 15 février',
    user: {
      id: '1',
      name: 'Marie Dupont',
      email: 'marie.dupont@wantitnow.com',
    },
    timestamp: '2024-01-21T08:30:00',
    importance: 'medium'
  },
  {
    id: '8',
    type: 'update',
    action: 'Informations mises à jour',
    description: 'Surface habitable corrigée de 120m² à 125m²',
    user: {
      id: '2',
      name: 'Jean Martin',
      email: 'jean.martin@wantitnow.com',
    },
    timestamp: '2024-01-22T16:20:00',
    metadata: {
      oldValue: '120m²',
      newValue: '125m²'
    },
    importance: 'low'
  }
]

export function PropertyActivityLog({ 
  propertyId,
  className 
}: PropertyActivityLogProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(sampleActivities)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterImportance, setFilterImportance] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesType = filterType === 'all' || activity.type === filterType
    const matchesImportance = filterImportance === 'all' || activity.importance === filterImportance
    return matchesType && matchesImportance
  })

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((acc, activity) => {
    const date = new Date(activity.timestamp).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(activity)
    return acc
  }, {} as Record<string, ActivityItem[]>)

  const getActivityIcon = (type: ActivityItem['type']) => {
    const icons = {
      creation: <Plus className="w-4 h-4" />,
      update: <Edit className="w-4 h-4" />,
      delete: <Trash className="w-4 h-4" />,
      status_change: <RefreshCw className="w-4 h-4" />,
      photo: <Image className="w-4 h-4" />,
      document: <FileText className="w-4 h-4" />,
      financial: <Euro className="w-4 h-4" />,
      permission: <Shield className="w-4 h-4" />,
      maintenance: <Settings className="w-4 h-4" />
    }
    return icons[type] || <Activity className="w-4 h-4" />
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    const colors = {
      creation: 'bg-green-100 text-green-700',
      update: 'bg-blue-100 text-blue-700',
      delete: 'bg-red-100 text-red-700',
      status_change: 'bg-purple-100 text-purple-700',
      photo: 'bg-indigo-100 text-indigo-700',
      document: 'bg-yellow-100 text-yellow-700',
      financial: 'bg-emerald-100 text-emerald-700',
      permission: 'bg-pink-100 text-pink-700',
      maintenance: 'bg-orange-100 text-orange-700'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const getImportanceBadge = (importance: ActivityItem['importance']) => {
    const variants = {
      low: { label: 'Faible', className: 'bg-gray-100 text-gray-600' },
      medium: { label: 'Moyenne', className: 'bg-blue-100 text-blue-700' },
      high: { label: 'Haute', className: 'bg-orange-100 text-orange-700' },
      critical: { label: 'Critique', className: 'bg-red-100 text-red-700' }
    }
    
    const variant = variants[importance]
    return (
      <Badge variant="outline" className={cn('border-0 text-xs', variant.className)}>
        {variant.label}
      </Badge>
    )
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleExport = () => {
    toast.info('Export de l\'historique à implémenter')
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-copper" />
              Historique d'activité
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type d'activité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les activités</SelectItem>
                  <SelectItem value="creation">Création</SelectItem>
                  <SelectItem value="update">Mise à jour</SelectItem>
                  <SelectItem value="status_change">Changement de statut</SelectItem>
                  <SelectItem value="photo">Photos</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="financial">Financier</SelectItem>
                  <SelectItem value="permission">Permissions</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterImportance} onValueChange={setFilterImportance}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Importance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toute importance</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Activity Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Total activités</p>
              <p className="text-2xl font-bold">{activities.length}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Aujourd'hui</p>
              <p className="text-2xl font-bold text-blue-700">
                {activities.filter(a => {
                  const today = new Date().toDateString()
                  const activityDate = new Date(a.timestamp).toDateString()
                  return today === activityDate
                }).length}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Cette semaine</p>
              <p className="text-2xl font-bold text-green-700">
                {activities.filter(a => {
                  const now = new Date()
                  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                  const activityDate = new Date(a.timestamp)
                  return activityDate >= weekAgo && activityDate <= now
                }).length}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Haute importance</p>
              <p className="text-2xl font-bold text-orange-700">
                {activities.filter(a => a.importance === 'high' || a.importance === 'critical').length}
              </p>
            </div>
          </div>

          {/* Activity Timeline */}
          <ScrollArea className="h-[600px] pr-4">
            {Object.entries(groupedActivities).length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Aucune activité trouvée</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedActivities).map(([date, dateActivities]) => (
                  <div key={date}>
                    <div className="sticky top-0 bg-white z-10 pb-2">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {date}
                      </h3>
                    </div>
                    
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
                      
                      {/* Activity items */}
                      <div className="space-y-4">
                        {dateActivities.map((activity, index) => (
                          <div key={activity.id} className="relative flex gap-4">
                            {/* Timeline dot */}
                            <div className="relative z-10 mt-1">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                getActivityColor(activity.type)
                              )}>
                                {getActivityIcon(activity.type)}
                              </div>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 bg-white border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-medium text-sm">{activity.action}</h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {activity.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getImportanceBadge(activity.importance)}
                                  <span className="text-xs text-gray-500">
                                    {formatTimestamp(activity.timestamp)}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Metadata */}
                              {activity.metadata && (
                                <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                                  {activity.metadata.oldValue && activity.metadata.newValue && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-500">Changement:</span>
                                      <span className="line-through text-red-600">
                                        {typeof activity.metadata.oldValue === 'number' 
                                          ? formatCurrency(activity.metadata.oldValue)
                                          : activity.metadata.oldValue}
                                      </span>
                                      <span>→</span>
                                      <span className="font-medium text-green-600">
                                        {typeof activity.metadata.newValue === 'number' 
                                          ? formatCurrency(activity.metadata.newValue)
                                          : activity.metadata.newValue}
                                      </span>
                                    </div>
                                  )}
                                  {activity.metadata.documentName && (
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-3 h-3" />
                                      <span>{activity.metadata.documentName}</span>
                                    </div>
                                  )}
                                  {activity.metadata.photoCount && (
                                    <div className="flex items-center gap-2">
                                      <Image className="w-3 h-3" />
                                      <span>{activity.metadata.photoCount} photo(s)</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* User info */}
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={activity.user.avatar} />
                                  <AvatarFallback>
                                    {activity.user.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span className="font-medium">{activity.user.name}</span>
                                  <span>•</span>
                                  <span>{activity.user.email}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}