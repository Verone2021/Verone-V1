"use client"

import { Button } from './button'
import { Edit } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StandardModifyButtonProps {
  onClick?: () => void
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export function StandardModifyButton({
  onClick,
  disabled = false,
  className,
  children
}: StandardModifyButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "text-xs px-2 py-1 h-6", // Taille standard uniformisée
        className
      )}
    >
      <Edit className="h-3 w-3 mr-1" />
      {children || "Modifier"}
    </Button>
  )
}