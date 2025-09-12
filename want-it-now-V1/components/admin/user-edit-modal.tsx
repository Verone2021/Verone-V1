'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, User, Phone, Check, X } from 'lucide-react'
import { toast } from 'sonner'

import { userProfileEditSchema, type UserProfileEditData } from '@/lib/validations/utilisateurs'
import { updateUserProfile } from '@/actions/utilisateurs'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface UserEditModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    nom: string | null
    prenom: string | null
    email: string
    telephone: string | null
  }
  onSuccess?: () => void
}

export function UserEditModal({ isOpen, onClose, user, onSuccess }: UserEditModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<UserProfileEditData>({
    resolver: zodResolver(userProfileEditSchema),
    defaultValues: {
      nom: user.nom || '',
      prenom: user.prenom || '',
      telephone: user.telephone || '',
    },
  })

  const onSubmit = async (data: UserProfileEditData) => {
    try {
      setIsLoading(true)

      const result = await updateUserProfile(user.id, data)

      if (result.success) {
        toast.success('Informations utilisateur mises à jour avec succès')
        form.reset(data) // Reset form with new values
        onSuccess?.() // Callback pour rafraîchir les données parent
        onClose()
      } else {
        toast.error(result.message || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      toast.error('Une erreur inattendue s\'est produite')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      form.reset() // Reset form to original values
      onClose()
    }
  }

  // Format phone number on blur
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return ''
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')
    
    // Format French mobile numbers
    if (digits.startsWith('33') && digits.length === 11) {
      return `+33 ${digits.slice(2, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`
    }
    
    // Format French landline numbers starting with 0
    if (digits.startsWith('0') && digits.length === 10) {
      return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`
    }
    
    return phone // Return as-is if no pattern matches
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-brand-copper" />
            Modifier les informations
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations personnelles de <strong>{user.email}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Prénom */}
              <FormField
                control={form.control}
                name="prenom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Prénom *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Jean"
                        disabled={isLoading}
                        className="bg-white border-gray-300 focus:border-brand-copper focus:ring-brand-copper/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nom */}
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Nom *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Dupont"
                        disabled={isLoading}
                        className="bg-white border-gray-300 focus:border-brand-copper focus:ring-brand-copper/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Téléphone */}
            <FormField
              control={form.control}
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone className="w-4 h-4" />
                    Téléphone
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="01 23 45 67 89"
                      disabled={isLoading}
                      className="bg-white border-gray-300 focus:border-brand-copper focus:ring-brand-copper/20"
                      {...field}
                      value={field.value || ''}
                      onBlur={(e) => {
                        const formatted = formatPhoneNumber(e.target.value)
                        field.onChange(formatted)
                        field.onBlur()
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-brand-copper hover:bg-brand-copper/90 text-white"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Mise à jour...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}