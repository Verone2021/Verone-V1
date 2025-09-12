'use client'

import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  UserPlus,
  UserX,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import { processPendingAuthOperations } from '@/actions/auth-admin'

interface PendingOperation {
  operation_type: 'create' | 'delete'
  user_id: string
  email?: string
  created_at: string
}

interface PendingOperationsAlertProps {
  operations: PendingOperation[]
}

export function PendingOperationsAlert({ operations }: PendingOperationsAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  if (operations.length === 0) {
    return null
  }

  // Statistiques des opérations
  const createOps = operations.filter(op => op.operation_type === 'create')
  const deleteOps = operations.filter(op => op.operation_type === 'delete')

  // Traiter toutes les opérations en attente
  const handleProcessAll = async () => {
    setIsProcessing(true)
    try {
      const result = await processPendingAuthOperations()
      
      if (result.success) {
        const { processed, failed } = result.data!
        
        if (processed > 0) {
          toast.success(
            `✅ ${processed} opération(s) Auth traitée(s) avec succès`, 
            {
              description: failed > 0 ? `${failed} opération(s) ont échoué` : undefined
            }
          )
        }
        
        if (failed > 0) {
          toast.error(
            `❌ ${failed} opération(s) Auth ont échoué`, 
            {
              description: 'Vérifiez les logs pour plus de détails'
            }
          )
        }
        
        if (processed === 0 && failed === 0) {
          toast.info('ℹ️ Aucune opération à traiter')
        }
        
        // Recharger la page pour actualiser l'affichage
        setTimeout(() => window.location.reload(), 1000)
        
      } else {
        toast.error('Erreur lors du traitement des opérations', {
          description: result.error
        })
      }
    } catch (error) {
      console.error('Erreur traitement opérations:', error)
      toast.error('Erreur inattendue lors du traitement')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">
        Opérations Auth en attente
      </AlertTitle>
      <AlertDescription className="text-yellow-700">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>
                {operations.length} opération(s) en attente de traitement Auth
              </span>
              
              <div className="flex items-center space-x-2">
                {createOps.length > 0 && (
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    <UserPlus className="h-3 w-3 mr-1" />
                    {createOps.length} création(s)
                  </Badge>
                )}
                
                {deleteOps.length > 0 && (
                  <Badge variant="outline" className="text-red-700 border-red-300">
                    <UserX className="h-3 w-3 mr-1" />
                    {deleteOps.length} suppression(s)
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                onClick={handleProcessAll}
                disabled={isProcessing}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Traiter maintenant
                  </>
                )}
              </Button>
              
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>
          </div>

          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleContent className="space-y-2">
              <div className="border-t border-yellow-200 pt-3">
                <h4 className="font-medium text-yellow-800 mb-2">
                  Détail des opérations:
                </h4>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {operations.map((op, index) => (
                    <div 
                      key={`${op.user_id}-${op.operation_type}`}
                      className="flex items-center justify-between p-2 bg-white/50 rounded border border-yellow-100"
                    >
                      <div className="flex items-center space-x-3">
                        {op.operation_type === 'create' ? (
                          <UserPlus className="h-4 w-4 text-green-600" />
                        ) : (
                          <UserX className="h-4 w-4 text-red-600" />
                        )}
                        
                        <div className="text-sm">
                          <div className="font-medium">
                            {op.operation_type === 'create' ? 'Créer' : 'Supprimer'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {op.email || op.user_id}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {format(new Date(op.created_at), 'dd/MM HH:mm', { locale: fr })}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                  <div className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                    <div className="text-blue-800">
                      <p className="font-medium">Comment ça fonctionne</p>
                      <ul className="text-blue-700 mt-1 text-xs space-y-1">
                        <li>• Les triggers SQL détectent les créations/suppressions d'utilisateurs</li>
                        <li>• Les opérations sont mises en file d'attente</li>
                        <li>• Le bouton "Traiter maintenant" exécute les opérations Auth via l'API Admin</li>
                        <li>• Les comptes Auth sont créés/supprimés automatiquement</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </AlertDescription>
    </Alert>
  )
}