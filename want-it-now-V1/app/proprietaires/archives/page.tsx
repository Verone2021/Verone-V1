import { getProprietairesArchives } from '@/actions/proprietaires'
import { ProprietairesArchivesTable } from '@/components/proprietaires/proprietaires-archives-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Archive, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function ProprietairesArchivesPage() {
  const proprietaires = await getProprietairesArchives()

  // Calculer le nombre de jours depuis l'archivage
  const proprietairesWithDays = proprietaires.map(proprietaire => {
    if (proprietaire.updated_at) {
      const archivedDate = new Date(proprietaire.updated_at)
      const today = new Date()
      const daysSinceArchive = Math.floor((today.getTime() - archivedDate.getTime()) / (1000 * 60 * 60 * 24))
      return {
        ...proprietaire,
        daysSinceArchive
      }
    }
    return {
      ...proprietaire,
      daysSinceArchive: 0
    }
  })

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/proprietaires">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Archive className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Archives Propriétaires</h1>
              <p className="text-gray-600">Propriétaires archivés avec dates de suppression</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              Statistiques Archives
            </CardTitle>
            <CardDescription>
              Informations sur les propriétaires archivés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{proprietaires.length}</div>
                <div className="text-sm text-gray-500">Total archivés</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">
                  {proprietairesWithDays.filter(p => p.daysSinceArchive <= 7).length}
                </div>
                <div className="text-sm text-blue-600">Cette semaine</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-900">
                  {proprietairesWithDays.filter(p => p.daysSinceArchive > 7 && p.daysSinceArchive <= 30).length}
                </div>
                <div className="text-sm text-yellow-600">Ce mois</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-900">
                  {proprietairesWithDays.filter(p => p.daysSinceArchive > 30).length}
                </div>
                <div className="text-sm text-red-600">Plus de 30 jours</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Archives Table */}
        <ProprietairesArchivesTable proprietaires={proprietairesWithDays} />
      </div>
    </div>
  )
}