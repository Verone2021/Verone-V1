'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, List } from 'lucide-react'

interface ContractsViewToggleProps {
  view: 'table' | 'cards'
  onViewChange: (view: 'table' | 'cards') => void
}

export function ContractsViewToggle({ view, onViewChange }: ContractsViewToggleProps) {
  return (
    <Card className="inline-flex p-1">
      <Button
        variant={view === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('table')}
        className={`${
          view === 'table' 
            ? 'bg-[#D4841A] hover:bg-[#B8741A] text-white' 
            : 'hover:bg-gray-100'
        }`}
      >
        <Table className="h-4 w-4 mr-2" />
        Tableau
      </Button>
      <Button
        variant={view === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('cards')}
        className={`${
          view === 'cards' 
            ? 'bg-[#D4841A] hover:bg-[#B8741A] text-white' 
            : 'hover:bg-gray-100'
        }`}
      >
        <List className="h-4 w-4 mr-2" />
        Cards
      </Button>
    </Card>
  )
}