"use client"

import { memo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSalesChannels } from '@/shared/modules/finance/hooks'
import { Loader2 } from "lucide-react"
import { cn } from '@/lib/utils'

interface ChannelSelectorProps {
  value: string | null
  onValueChange: (value: string | null) => void
  className?: string
  placeholder?: string
  showAllOption?: boolean
}

/**
 * Composant ChannelSelector - Dropdown sélection canal de vente
 *
 * Intégré avec le hook useSalesChannels pour récupérer les canaux actifs.
 * Utilisé pour filtrer/afficher les prix selon le canal sélectionné.
 *
 * @param value - ID canal sélectionné (null = tous canaux/prix de base)
 * @param onValueChange - Callback changement sélection
 * @param className - Classes CSS additionnelles
 * @param placeholder - Texte placeholder
 * @param showAllOption - Afficher option "Tous les canaux"
 */
export const ChannelSelector = memo(function ChannelSelector({
  value,
  onValueChange,
  className,
  placeholder = "Sélectionner un canal",
  showAllOption = true
}: ChannelSelectorProps) {
  const { data: channels, isLoading, error } = useSalesChannels()

  if (error) {
    return (
      <div className={cn("text-sm text-red-600", className)}>
        Erreur chargement canaux
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-gray-600", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Chargement...</span>
      </div>
    )
  }

  return (
    <Select
      value={value || "all"}
      onValueChange={(val) => onValueChange(val === "all" ? null : val)}
    >
      <SelectTrigger className={cn("w-full sm:w-[200px]", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <span className="font-medium">Tous les canaux</span>
              <span className="text-xs text-gray-500">(Prix catalogue)</span>
            </div>
          </SelectItem>
        )}

        {channels?.map((channel: any) => (
          <SelectItem key={channel.id} value={channel.id}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{channel.name}</span>
              {channel.default_discount_rate && channel.default_discount_rate > 0 && (
                <span className="text-xs text-green-600">
                  -{(channel.default_discount_rate * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})
