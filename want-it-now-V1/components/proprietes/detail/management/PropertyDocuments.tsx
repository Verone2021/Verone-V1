'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Filter,
  Search,
  File,
  FileImage,
  FilePlus,
  Loader2,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  FolderOpen,
  Shield,
  Home,
  Receipt,
  Gavel,
  ClipboardCheck,
  AlertCircle
} from 'lucide-react'
import { cn, formatFileSize } from '@/lib/utils'
import { toast } from 'sonner'

interface PropertyDocumentsProps {
  propertyId: string
  canEdit?: boolean
  className?: string
}

interface Document {
  id: string
  nom: string
  type: string
  categorie: string
  taille: number
  date_upload: string
  uploaded_by: string
  url: string
  statut: 'valide' | 'expire' | 'en_attente'
}

// Document categories
const documentCategories = [
  { value: 'achat', label: 'Documents d\'achat', icon: Home },
  { value: 'legal', label: 'Documents légaux', icon: Gavel },
  { value: 'fiscal', label: 'Documents fiscaux', icon: Receipt },
  { value: 'technique', label: 'Documents techniques', icon: ClipboardCheck },
  { value: 'assurance', label: 'Assurances', icon: Shield },
  { value: 'autre', label: 'Autres', icon: FolderOpen },
]

// Sample documents (à remplacer par des vraies données)
const sampleDocuments: Document[] = [
  {
    id: '1',
    nom: 'Acte de vente.pdf',
    type: 'pdf',
    categorie: 'achat',
    taille: 2457600,
    date_upload: '2024-01-15',
    uploaded_by: 'Marie Dupont',
    url: '#',
    statut: 'valide'
  },
  {
    id: '2',
    nom: 'Diagnostic énergétique.pdf',
    type: 'pdf',
    categorie: 'technique',
    taille: 1234567,
    date_upload: '2024-01-10',
    uploaded_by: 'Jean Martin',
    url: '#',
    statut: 'valide'
  },
  {
    id: '3',
    nom: 'Assurance habitation 2024.pdf',
    type: 'pdf',
    categorie: 'assurance',
    taille: 987654,
    date_upload: '2024-01-05',
    uploaded_by: 'Marie Dupont',
    url: '#',
    statut: 'expire'
  },
  {
    id: '4',
    nom: 'Taxe foncière 2023.pdf',
    type: 'pdf',
    categorie: 'fiscal',
    taille: 543210,
    date_upload: '2023-12-20',
    uploaded_by: 'Jean Martin',
    url: '#',
    statut: 'valide'
  },
  {
    id: '5',
    nom: 'Plans architecte.jpg',
    type: 'image',
    categorie: 'technique',
    taille: 3456789,
    date_upload: '2023-12-15',
    uploaded_by: 'Marie Dupont',
    url: '#',
    statut: 'valide'
  },
]

export function PropertyDocuments({ 
  propertyId,
  canEdit = false,
  className 
}: PropertyDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>(sampleDocuments)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.nom.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || doc.categorie === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Group documents by category
  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.categorie]) {
      acc[doc.categorie] = []
    }
    acc[doc.categorie].push(doc)
    return acc
  }, {} as Record<string, Document[]>)

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newDocument: Document = {
        id: Date.now().toString(),
        nom: file.name,
        type: file.type.includes('image') ? 'image' : 'pdf',
        categorie: 'autre',
        taille: file.size,
        date_upload: new Date().toISOString().split('T')[0],
        uploaded_by: 'Current User',
        url: '#',
        statut: 'en_attente'
      }
      
      setDocuments([newDocument, ...documents])
      toast.success('Document ajouté avec succès')
      setUploadDialogOpen(false)
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du document')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    try {
      setDocuments(documents.filter(d => d.id !== docId))
      toast.success('Document supprimé')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const getStatusBadge = (statut: Document['statut']) => {
    const variants = {
      valide: { label: 'Valide', className: 'bg-green-100 text-green-700' },
      expire: { label: 'Expiré', className: 'bg-red-100 text-red-700' },
      en_attente: { label: 'En attente', className: 'bg-yellow-100 text-yellow-700' }
    }
    
    const variant = variants[statut]
    return (
      <Badge variant="outline" className={cn('border-0', variant.className)}>
        {variant.label}
      </Badge>
    )
  }

  const getCategoryIcon = (categorie: string) => {
    const category = documentCategories.find(c => c.value === categorie)
    const Icon = category?.icon || FolderOpen
    return <Icon className="w-4 h-4" />
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-copper" />
              Documents et pièces jointes
            </CardTitle>
            {canEdit && (
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Upload className="w-4 h-4" />
                    Ajouter un document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un document</DialogTitle>
                    <DialogDescription>
                      Téléchargez un document pour cette propriété
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="file">Fichier</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUpload(file)
                        }}
                        disabled={isUploading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie</Label>
                      <Select defaultValue="autre">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {documentCategories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {isUploading && (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher un document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {documentCategories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{documents.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Valides</p>
              <p className="text-2xl font-bold text-green-700">
                {documents.filter(d => d.statut === 'valide').length}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Expirés</p>
              <p className="text-2xl font-bold text-red-700">
                {documents.filter(d => d.statut === 'expire').length}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-2xl font-bold text-yellow-700">
                {documents.filter(d => d.statut === 'en_attente').length}
              </p>
            </div>
          </div>

          {/* Documents by category */}
          <div className="space-y-6">
            {Object.entries(groupedDocuments).map(([categorie, docs]) => {
              const category = documentCategories.find(c => c.value === categorie)
              const CategoryIcon = category?.icon || FolderOpen
              
              return (
                <div key={categorie}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <CategoryIcon className="w-4 h-4" />
                    {category?.label || 'Autres'}
                    <Badge variant="secondary" className="ml-2">
                      {docs.length}
                    </Badge>
                  </h3>
                  <div className="space-y-2">
                    {docs.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            {doc.type === 'image' ? (
                              <FileImage className="w-5 h-5 text-gray-600" />
                            ) : (
                              <FileText className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doc.nom}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(doc.date_upload).toLocaleDateString('fr-FR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {doc.uploaded_by}
                              </span>
                              <span>{formatFileSize(doc.taille)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(doc.statut)}
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="p-2">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="p-2">
                              <Download className="w-4 h-4" />
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 text-red-600 hover:text-red-700"
                                onClick={() => handleDelete(doc.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Aucun document trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}