"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Package,
  Link,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { ProductConsultationManager } from '../../components/business/product-consultation-manager'
import { useConsultations } from '../../hooks/use-consultations'
import { useToast } from '../../hooks/use-toast'

export default function ConsultationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { consultations, loading, fetchConsultations } = useConsultations()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  useEffect(() => {
    fetchConsultations()
  }, [])

  // Filtrer les consultations
  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch =
      consultation.organisation_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.descriptif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.client_email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || consultation.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || consultation.priority_level.toString() === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  // Grouper par statut
  const consultationsByStatus = {
    en_attente: filteredConsultations.filter(c => c.status === 'en_attente'),
    en_cours: filteredConsultations.filter(c => c.status === 'en_cours'),
    terminee: filteredConsultations.filter(c => c.status === 'terminee'),
    annulee: filteredConsultations.filter(c => c.status === 'annulee')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des consultations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-black">Consultations Clients</h1>
                <p className="text-gray-600">Gestion des consultations et associations produits</p>
              </div>
            </div>

            <Button
              onClick={() => router.push('/consultations/create')}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle consultation
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Onglet avec gestionnaire d'associations */}
        <Tabs defaultValue="associations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="associations">
              Gestion des associations produits-consultations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="associations">
            <ProductConsultationManager mode="overview" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}