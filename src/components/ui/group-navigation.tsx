"use client"

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import Link from 'next/link'

interface GroupNavigationProps {
  currentGroupId: string
  groups: Array<{
    id: string
    name: string
  }>
  className?: string
}

export function GroupNavigation({ currentGroupId, groups, className }: GroupNavigationProps) {
  const currentIndex = groups.findIndex(group => group.id === currentGroupId)
  const prevGroup = currentIndex > 0 ? groups[currentIndex - 1] : null
  const nextGroup = currentIndex < groups.length - 1 ? groups[currentIndex + 1] : null

  if (groups.length <= 1) return null

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-2">
        {prevGroup ? (
          <Link href={`/catalogue/product-groups/${prevGroup.id}`}>
            <ButtonV2 variant="outline" size="sm" className="flex items-center space-x-1">
              <ChevronLeft className="h-4 w-4" />
              <span className="truncate max-w-[120px]">{prevGroup.name}</span>
            </ButtonV2>
          </Link>
        ) : (
          <ButtonV2 variant="outline" size="sm" disabled className="flex items-center space-x-1">
            <ChevronLeft className="h-4 w-4" />
            <span>Précédent</span>
          </ButtonV2>
        )}
      </div>

      <div className="text-sm text-gray-600">
        {currentIndex + 1} sur {groups.length}
      </div>

      <div className="flex items-center space-x-2">
        {nextGroup ? (
          <Link href={`/catalogue/product-groups/${nextGroup.id}`}>
            <ButtonV2 variant="outline" size="sm" className="flex items-center space-x-1">
              <span className="truncate max-w-[120px]">{nextGroup.name}</span>
              <ChevronRight className="h-4 w-4" />
            </ButtonV2>
          </Link>
        ) : (
          <ButtonV2 variant="outline" size="sm" disabled className="flex items-center space-x-1">
            <span>Suivant</span>
            <ChevronRight className="h-4 w-4" />
          </ButtonV2>
        )}
      </div>
    </div>
  )
}