'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '@/components/ui/form'
import { 
  Save, 
  X, 
  Percent, 
  Euro, 
  Calendar, 
  FileText,
  AlertCircle,
  Calculator,
  Loader2
} from 'lucide-react'
import { QuotiteWithProprietaire, updateProprietaireQuotite } from '@/actions/proprietes-quotites'
import { calculateQuotitePrixAcquisition } from '@/actions/proprietes'
import { toast } from 'sonner'

const quotiteEditSchema = z.object({
  pourcentage: z.number()
    .min(0.01, "La quotité doit être supérieure à 0%")
    .max(100, "La quotité ne peut pas dépasser 100%"),
  date_acquisition: z.string().optional(),
  prix_acquisition: z.number().optional().nullable(),
  frais_acquisition: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type QuotiteEditFormData = z.infer<typeof quotiteEditSchema>

interface QuotiteEditFormProps {
  quotite: QuotiteWithProprietaire
  proprieteId: string
}

export function QuotiteEditForm({ quotite, proprieteId }: QuotiteEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoCalculated, setAutoCalculated] = useState(false)
  
  const form = useForm<QuotiteEditFormData>({
    resolver: zodResolver(quotiteEditSchema),
    defaultValues: {
      pourcentage: quotite.pourcentage,
      date_acquisition: quotite.date_acquisition || '',
      prix_acquisition: quotite.prix_acquisition || null,
      frais_acquisition: quotite.frais_acquisition || null,
      notes: quotite.notes || '',
    }
  })

  const handleCancel = () => {
    router.push(`/proprietes/${proprieteId}`)
  }

  const handleAutoCalculate = async () => {
    setIsCalculating(true)
    setError(null)
    
    try {
      const pourcentage = form.getValues('pourcentage')
      if (!pourcentage || pourcentage <= 0) {
        toast.error('Veuillez d\'abord saisir un pourcentage valide')
        return
      }
      
      const result = await calculateQuotitePrixAcquisition(proprieteId, pourcentage)
      
      if (result.success && result.data !== null) {
        // Mettre à jour le champ prix_acquisition avec le calcul automatique
        form.setValue('prix_acquisition', result.data)
        setAutoCalculated(true)
        toast.success('Prix d\'acquisition calculé automatiquement')
      } else {
        toast.error('Impossible de calculer automatiquement. Données financières de la propriété manquantes.')
      }
    } catch (error) {
      console.error('Erreur lors du calcul automatique:', error)
      toast.error('Erreur lors du calcul automatique')
    } finally {
      setIsCalculating(false)
    }
  }

  const onSubmit = async (data: QuotiteEditFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Préparer les données pour l'update
      const updateData = {
        pourcentage: data.pourcentage,
        date_acquisition: data.date_acquisition || undefined,
        prix_acquisition: data.prix_acquisition || undefined,
        frais_acquisition: data.frais_acquisition || undefined,
        notes: data.notes || undefined,
      }
      
      const result = await updateProprietaireQuotite(quotite.id, updateData)
      
      if (result.success) {
        toast.success('Quotité mise à jour avec succès')
        router.push(`/proprietes/${proprieteId}`)
      } else {
        setError(result.error || 'Erreur lors de la mise à jour')
        toast.error(result.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inattendue'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-[#D4841A]" />
              Informations de la quotité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pourcentage */}
              <FormField
                control={form.control}
                name="pourcentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-[#D4841A]" />
                      Pourcentage de quotité *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="100"
                          className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11 pr-8"
                          placeholder="50.00"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                          %
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date d'acquisition */}
              <FormField
                control={form.control}
                name="date_acquisition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Date d'acquisition
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prix d'acquisition */}
              <FormField
                control={form.control}
                name="prix_acquisition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <Euro className="w-4 h-4 text-green-600" />
                        Prix d'acquisition
                        {autoCalculated && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            Calculé auto
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAutoCalculate}
                        disabled={isCalculating || isSubmitting}
                        className="h-6 px-2 text-xs hover:bg-[#D4841A]/10 hover:border-[#D4841A] hover:text-[#D4841A]"
                      >
                        {isCalculating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Calculator className="w-3 h-3 mr-1" />
                            Auto
                          </>
                        )}
                      </Button>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className={`bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11 pl-8 ${
                            autoCalculated ? 'border-green-200 bg-green-50/30' : ''
                          }`}
                          placeholder="150000.00"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value) || null)
                            if (autoCalculated) setAutoCalculated(false)
                          }}
                        />
                        <Euro className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>
                    </FormControl>
                    <div className="text-xs text-gray-500 mt-1">
                      Calcul auto basé sur : (prix_achat + frais_notaire + frais_annexes) × {form.watch('pourcentage')}%
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Frais d'acquisition */}
              <FormField
                control={form.control}
                name="frais_acquisition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Euro className="w-4 h-4 text-orange-600" />
                      Frais d'acquisition
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11 pl-8"
                          placeholder="15000.00"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                        />
                        <Euro className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[100px]"
                      placeholder="Notes sur cette quotité..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className="flex justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#D4841A] hover:bg-[#B8741A] text-white"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sauvegarde...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}