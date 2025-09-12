'use client'

import { Button } from '@/components/ui/button'
import { 
  Eye, 
  Edit, 
  Trash2, 
  Power, 
  RotateCcw, 
  AlertTriangle, 
  Loader2 
} from 'lucide-react'

export interface ActionButtonsProps {
  item: {
    id: string
    is_active?: boolean
  }
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDeactivate?: (id: string) => void
  onReactivate?: (id: string) => void
  onHardDelete?: (id: string) => void
  permissions?: {
    canEdit?: boolean
    canDeactivate?: boolean
    canHardDelete?: boolean
  }
  isProcessing?: string | null
  viewPath?: string
  editPath?: string
}

export function ActionButtons({
  item,
  onView,
  onEdit,
  onDeactivate,
  onReactivate,
  onHardDelete,
  permissions = {
    canEdit: true,
    canDeactivate: true,
    canHardDelete: true
  },
  isProcessing,
  viewPath,
  editPath
}: ActionButtonsProps) {
  const isItemProcessing = isProcessing === item.id

  return (
    <div className="flex items-center space-x-2">
      {/* Voir - Toujours visible */}
      <Button 
        variant="outline" 
        size="sm" 
        className="p-2"
        onClick={() => onView?.(item.id)}
        title="Voir les détails"
      >
        <Eye size={16} />
        <span className="sr-only">Voir</span>
      </Button>

      {/* Modifier - Si autorisé */}
      {permissions.canEdit && (
        <Button 
          variant="outline" 
          size="sm" 
          className="p-2"
          onClick={() => onEdit?.(item.id)}
          title="Modifier"
        >
          <Edit size={16} />
          <span className="sr-only">Modifier</span>
        </Button>
      )}

      {/* Actions selon le statut */}
      {item.is_active ? (
        // Élément actif - bouton désactiver
        permissions.canDeactivate && (
          <Button
            variant="destructive"
            size="sm"
            className="p-2"
            onClick={() => onDeactivate?.(item.id)}
            disabled={isItemProcessing}
            title="Désactiver"
          >
            {isItemProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Power size={16} />
            )}
            <span className="sr-only">Désactiver</span>
          </Button>
        )
      ) : (
        // Élément inactif - boutons réactiver et supprimer
        <>
          {permissions.canDeactivate && (
            <Button
              variant="outline"
              size="sm"
              className="p-2"
              onClick={() => onReactivate?.(item.id)}
              disabled={isItemProcessing}
              title="Réactiver"
            >
              {isItemProcessing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RotateCcw size={16} />
              )}
              <span className="sr-only">Réactiver</span>
            </Button>
          )}
          
          {permissions.canHardDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="p-2"
              onClick={() => onHardDelete?.(item.id)}
              disabled={isItemProcessing}
              title="Supprimer définitivement"
            >
              {isItemProcessing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <AlertTriangle size={16} />
              )}
              <span className="sr-only">Supprimer définitivement</span>
            </Button>
          )}
        </>
      )}
    </div>
  )
}

// Version avec liens Next.js pour les routes
export interface ActionButtonsWithLinksProps extends Omit<ActionButtonsProps, 'onView' | 'onEdit'> {
  viewPath: string
  editPath?: string
}

export function ActionButtonsWithLinks({
  item,
  viewPath,
  editPath,
  onDeactivate,
  onReactivate,
  onHardDelete,
  permissions = {
    canEdit: true,
    canDeactivate: true,
    canHardDelete: true
  },
  isProcessing
}: ActionButtonsWithLinksProps) {
  const isItemProcessing = isProcessing === item.id

  return (
    <div className="flex items-center space-x-2">
      {/* Voir - Toujours visible */}
      <Button 
        variant="outline" 
        size="sm" 
        className="p-2"
        asChild
      >
        <a href={viewPath} title="Voir les détails">
          <Eye size={16} />
          <span className="sr-only">Voir</span>
        </a>
      </Button>

      {/* Modifier - Si autorisé et chemin fourni */}
      {permissions.canEdit && editPath && (
        <Button 
          variant="outline" 
          size="sm" 
          className="p-2"
          asChild
        >
          <a href={editPath} title="Modifier">
            <Edit size={16} />
            <span className="sr-only">Modifier</span>
          </a>
        </Button>
      )}

      {/* Actions selon le statut */}
      {item.is_active ? (
        // Élément actif - bouton désactiver
        permissions.canDeactivate && (
          <Button
            variant="destructive"
            size="sm"
            className="p-2"
            onClick={() => onDeactivate?.(item.id)}
            disabled={isItemProcessing}
            title="Désactiver"
          >
            {isItemProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Power size={16} />
            )}
            <span className="sr-only">Désactiver</span>
          </Button>
        )
      ) : (
        // Élément inactif - boutons réactiver et supprimer
        <>
          {permissions.canDeactivate && (
            <Button
              variant="outline"
              size="sm"
              className="p-2"
              onClick={() => onReactivate?.(item.id)}
              disabled={isItemProcessing}
              title="Réactiver"
            >
              {isItemProcessing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RotateCcw size={16} />
              )}
              <span className="sr-only">Réactiver</span>
            </Button>
          )}
          
          {permissions.canHardDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="p-2"
              onClick={() => onHardDelete?.(item.id)}
              disabled={isItemProcessing}
              title="Supprimer définitivement"
            >
              {isItemProcessing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <AlertTriangle size={16} />
              )}
              <span className="sr-only">Supprimer définitivement</span>
            </Button>
          )}
        </>
      )}
    </div>
  )
}