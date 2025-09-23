"use client"

import { useState, useEffect } from 'react'
import { Search, Users, Check, ChevronDown } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'
import { createClient } from '../../lib/supabase/client'

interface Client {
  id: string
  name: string
  type: string
  email?: string
  city?: string
}

interface ClientAssignmentSelectorProps {
  value?: string // client_id
  onChange: (clientId: string, client: Client) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  required?: boolean
}

export function ClientAssignmentSelector({
  value,
  onChange,
  placeholder = "Rechercher un client...",
  disabled = false,
  className,
  label = "Client assigné",
  required = false
}: ClientAssignmentSelectorProps) {
  const supabase = createClient()

  // États du composant
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Charger les clients professionnels
  useEffect(() => {
    loadClients()
  }, [])

  // Charger le client sélectionné si fourni
  useEffect(() => {
    if (value && !selectedClient) {
      loadSelectedClient(value)
    }
  }, [value])

  // Filtrer les clients selon le terme de recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients)
    } else {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.city?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredClients(filtered)
    }
  }, [searchTerm, clients])

  const loadClients = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('organisations')
        .select(`
          id,
          name,
          type,
          email,
          city
        `)
        .eq('type', 'customer') // Seulement les clients professionnels
        .order('name')

      if (error) throw error

      setClients(data || [])
    } catch (err) {
      console.error('❌ Erreur chargement clients:', err)
      setError('Erreur de chargement des clients')
    } finally {
      setLoading(false)
    }
  }

  const loadSelectedClient = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('organisations')
        .select(`
          id,
          name,
          type,
          email,
          city
        `)
        .eq('id', clientId)
        .single()

      if (error) throw error

      if (data) {
        setSelectedClient(data)
      }
    } catch (err) {
      console.error('❌ Erreur chargement client sélectionné:', err)
    }
  }

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setSearchTerm('')
    setIsOpen(false)
    onChange(client.id, client)
  }

  const handleClear = () => {
    setSelectedClient(null)
    setSearchTerm('')
    onChange('', {} as Client)
  }

  if (loading && clients.length === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-sm font-medium">
            {label} {required && '*'}
          </Label>
        )}
        <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
          Chargement des clients...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-sm font-medium">
            {label} {required && '*'}
          </Label>
        )}
        <div className="w-full p-3 border border-red-300 rounded-md bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && '*'}
        </Label>
      )}

      {/* Sélecteur principal */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full justify-between text-left font-normal",
            !selectedClient && "text-gray-500"
          )}
        >
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-gray-400" />
            {selectedClient ? (
              <div className="flex flex-col">
                <span className="font-medium">{selectedClient.name}</span>
                {selectedClient.email && (
                  <span className="text-xs text-gray-500">
                    {selectedClient.email}
                  </span>
                )}
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 opacity-50 transition-transform",
            isOpen && "rotate-180"
          )} />
        </Button>

        {/* Bouton de suppression si client sélectionné */}
        {selectedClient && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
          >
            ×
          </Button>
        )}
      </div>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Champ de recherche */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email ou ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          {/* Liste des clients */}
          <div className="max-h-60 overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm ? 'Aucun client trouvé' : 'Aucun client disponible'}
              </div>
            ) : (
              <div className="py-1">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleClientSelect(client)}
                    className={cn(
                      "w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between",
                      selectedClient?.id === client.id && "bg-gray-50"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {client.name}
                      </span>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {client.email && (
                          <span>{client.email}</span>
                        )}
                        {client.city && (
                          <>
                            {client.email && <span>•</span>}
                            <span>{client.city}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {selectedClient?.id === client.id && (
                      <Check className="h-4 w-4 text-black" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {clients.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="w-full text-gray-600"
              >
                Fermer
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}