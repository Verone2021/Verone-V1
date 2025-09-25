"use client"

import { useState } from "react"
import { Check, X, Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export type TestStatus = 'pending' | 'completed' | 'failed' | 'warning'

interface TestCheckboxProps {
  testId: string
  status: TestStatus
  onChange: (testId: string, newStatus: TestStatus) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100 border-gray-300',
    label: 'En attente'
  },
  completed: {
    icon: Check,
    color: 'text-white',
    bgColor: 'bg-black border-black',
    label: 'Validé'
  },
  failed: {
    icon: X,
    color: 'text-white',
    bgColor: 'bg-gray-600 border-gray-600',
    label: 'Échec'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-black',
    bgColor: 'bg-gray-200 border-gray-400',
    label: 'Attention'
  }
} as const

const SIZE_CONFIG = {
  sm: {
    container: 'h-4 w-4',
    icon: 'h-3 w-3'
  },
  md: {
    container: 'h-5 w-5',
    icon: 'h-4 w-4'
  },
  lg: {
    container: 'h-6 w-6',
    icon: 'h-5 w-5'
  }
} as const

export function TestCheckbox({
  testId,
  status,
  onChange,
  disabled = false,
  size = 'md',
  className
}: TestCheckboxProps) {
  const [isHovered, setIsHovered] = useState(false)

  const config = STATUS_CONFIG[status]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  // Cycle through statuses on click
  const handleClick = () => {
    if (disabled) return

    const statusCycle: TestStatus[] = ['pending', 'completed', 'failed', 'warning']
    const currentIndex = statusCycle.indexOf(status)
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length]

    onChange(testId, nextStatus)
  }

  // Quick actions for specific status
  const handleStatusAction = (newStatus: TestStatus, event: React.MouseEvent) => {
    event.stopPropagation()
    if (disabled) return
    onChange(testId, newStatus)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Main checkbox */}
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={disabled}
        className={cn(
          "relative flex items-center justify-center rounded border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2",
          sizeConfig.container,
          config.bgColor,
          disabled && "opacity-50 cursor-not-allowed hover:scale-100",
          isHovered && "shadow-md",
          className
        )}
        title={`${config.label} - Cliquer pour changer`}
        aria-label={`Test ${testId} - Statut: ${config.label}`}
      >
        <Icon className={cn(sizeConfig.icon, config.color)} />
      </button>

      {/* Quick action buttons (visible on hover) */}
      {isHovered && !disabled && size !== 'sm' && (
        <div className="flex items-center gap-1 ml-2">
          {/* Complete button */}
          <button
            type="button"
            onClick={(e) => handleStatusAction('completed', e)}
            className="flex items-center justify-center h-6 w-6 rounded border border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-150"
            title="Marquer comme validé"
            aria-label="Valider le test"
          >
            <Check className="h-3 w-3" />
          </button>

          {/* Fail button */}
          <button
            type="button"
            onClick={(e) => handleStatusAction('failed', e)}
            className="flex items-center justify-center h-6 w-6 rounded border border-gray-600 bg-white text-gray-600 hover:bg-gray-600 hover:text-white transition-colors duration-150"
            title="Marquer comme échoué"
            aria-label="Marquer le test en échec"
          >
            <X className="h-3 w-3" />
          </button>

          {/* Warning button */}
          <button
            type="button"
            onClick={(e) => handleStatusAction('warning', e)}
            className="flex items-center justify-center h-6 w-6 rounded border border-gray-400 bg-white text-gray-400 hover:bg-gray-400 hover:text-white transition-colors duration-150"
            title="Marquer avec attention"
            aria-label="Marquer le test en attention"
          >
            <AlertTriangle className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}

// Composant pour batch actions
interface TestBatchActionsProps {
  selectedTests: string[]
  onBatchAction: (testIds: string[], status: TestStatus) => void
  className?: string
}

export function TestBatchActions({
  selectedTests,
  onBatchAction,
  className
}: TestBatchActionsProps) {
  if (selectedTests.length === 0) return null

  return (
    <div className={cn("flex items-center gap-2 p-3 bg-gray-50 rounded border", className)}>
      <span className="text-sm text-gray-600">
        {selectedTests.length} test(s) sélectionné(s)
      </span>

      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => onBatchAction(selectedTests, 'completed')}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          <Check className="h-3 w-3" />
          Valider tout
        </button>

        <button
          onClick={() => onBatchAction(selectedTests, 'failed')}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          <X className="h-3 w-3" />
          Échouer tout
        </button>

        <button
          onClick={() => onBatchAction(selectedTests, 'pending')}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors"
        >
          <Clock className="h-3 w-3" />
          Remettre en attente
        </button>
      </div>
    </div>
  )
}

// Hook pour gérer sélection multiple
export function useTestSelection() {
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set())

  const toggleSelection = (testId: string) => {
    setSelectedTests(prev => {
      const newSet = new Set(prev)
      if (newSet.has(testId)) {
        newSet.delete(testId)
      } else {
        newSet.add(testId)
      }
      return newSet
    })
  }

  const selectAll = (testIds: string[]) => {
    setSelectedTests(new Set(testIds))
  }

  const clearSelection = () => {
    setSelectedTests(new Set())
  }

  const isSelected = (testId: string) => selectedTests.has(testId)

  return {
    selectedTests: Array.from(selectedTests),
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected
  }
}