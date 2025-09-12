'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, FileEdit, Loader2 } from 'lucide-react'
import { changeProprieteStatut } from '@/actions/proprietes'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ProprieteStatusControlsProps {
  proprieteId: string
  currentStatut: string
  isBrouillon: boolean
}

export function ProprieteStatusControls({ 
  proprieteId, 
  currentStatut, 
  isBrouillon 
}: ProprieteStatusControlsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleStatutChange = async (newStatus: 'brouillon' | 'disponible') => {
    setIsLoading(true)
    
    try {
      const result = await changeProprieteStatut(proprieteId, newStatus)
      
      if (result.success) {
        toast.success(
          newStatus === 'disponible' 
            ? 'Propriété marquée comme complète'
            : 'Propriété remise en brouillon'
        )
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors du changement de statut')
      }
    } catch (error) {
      console.error('Error changing status:', error)
      toast.error('Erreur lors du changement de statut')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Bouton : Marquer comme complète (si brouillon) */}
      {isBrouillon && (
        <Button 
          onClick={() => handleStatutChange('disponible')}
          disabled={isLoading}
          className="bg-[#2D5A27] hover:bg-[#1F3F1C] text-white"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          )}
          Marquer comme Complète
        </Button>
      )}
      
      {/* Bouton : Remettre en brouillon (si pas brouillon) */}
      {!isBrouillon && currentStatut !== 'brouillon' && (
        <Button 
          onClick={() => handleStatutChange('brouillon')}
          disabled={isLoading}
          variant="outline"
          className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileEdit className="w-4 h-4 mr-2" />
          )}
          Remettre en Brouillon
        </Button>
      )}
    </>
  )
}