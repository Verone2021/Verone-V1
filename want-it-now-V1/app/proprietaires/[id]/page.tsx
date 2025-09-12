import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { 
  ArrowLeft, 
  Edit, 
  Users, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Globe,
  FileText,
  Plus,
  AlertTriangle,
  CreditCard,
  Scale
} from 'lucide-react'

import { getProprietaireById, getAssocies } from '@/actions/proprietaires'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageLayout } from '@/components/layout/page-layout'
import { PageHeader } from '@/components/layout/page-shell'
import { AssociesManagerComplete } from '@/components/proprietaires/associes-manager-complete'

import {
  formatProprietaireNomComplet,
  formatProprietaireType,
  formatFormeJuridique,
  formatAdresseComplete,
  formatCapitalSocial,
  formatCapitalCompletion,
  formatNombreParts,
  calculateAge,
  getBrouillonBadgeColor,
  getBrouillonBadgeText,
  getTypeBadgeColor,
  getCapitalCompletionBadgeColor,
  canHaveAssocies,
  isProprietaireValide,
} from '@/lib/utils/proprietaires'

// ==============================================================================
// TYPES & INTERFACES
// ==============================================================================

interface PageProps {
  params: Promise<{
    id: string
  }>
}

// ==============================================================================
// METADATA
// ==============================================================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const proprietaire = await getProprietaireById(id)
  
  if (!proprietaire) {
    return {
      title: 'Propriétaire non trouvé | Want It Now',
    }
  }

  const nomComplet = formatProprietaireNomComplet(proprietaire)
  
  return {
    title: `${nomComplet} | Propriétaires | Want It Now`,
    description: `Détail du propriétaire ${nomComplet}`,
  }
}

// ==============================================================================
// LOADING COMPONENTS
// ==============================================================================

function ProprietaireDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse space-y-4">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-20 bg-gray-200 rounded"></div>
          <div className="flex-1">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="h-10 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
      
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

export default async function ProprietaireDetailPage({ params }: PageProps) {
  // Récupérer les données du propriétaire
  const { id } = await params
  const proprietaire = await getProprietaireById(id)
  
  if (!proprietaire) {
    notFound()
  }

  // Récupérer les associés si personne morale
  const associes = canHaveAssocies(proprietaire) 
    ? await getAssocies(proprietaire.id)
    : []

  const nomComplet = formatProprietaireNomComplet(proprietaire)
  const isValide = isProprietaireValide(proprietaire)

  return (
    <PageLayout 
      usePageShell={true}
      header={
        <PageHeader
          title={nomComplet}
          description={
            proprietaire.type === 'physique' 
              ? 'Personne physique' 
              : `${formatFormeJuridique(proprietaire.forme_juridique!)} - ${proprietaire.numero_identification}`
          }
          actions={
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={getTypeBadgeColor(proprietaire.type)}
                >
                  {formatProprietaireType(proprietaire.type)}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={getBrouillonBadgeColor(proprietaire.is_brouillon)}
                >
                  {getBrouillonBadgeText(proprietaire.is_brouillon)}
                </Badge>
              </div>
              <Link href="/proprietaires">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la liste
                </Button>
              </Link>
              <Link href={`/proprietaires/${proprietaire.id}/edit`}>
                <Button className="gradient-copper text-white">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </Link>
            </div>
          }
        />
      }
    >
      {/* Alert si brouillon */}
      {proprietaire.is_brouillon && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Ce propriétaire est en brouillon. Certaines informations peuvent être incomplètes.
          </AlertDescription>
        </Alert>
      )}

      {/* Alert si invalide */}
      {!isValide && !proprietaire.is_brouillon && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Ce propriétaire est incomplet. Veuillez renseigner toutes les informations obligatoires.
          </AlertDescription>
        </Alert>
      )}

      {/* Contenu principal en 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Colonne gauche (3/5) : Informations métier */}
        <div className="lg:col-span-3 space-y-6">
          {/* Informations principales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {proprietaire.type === 'physique' ? (
                  <Users className="h-5 w-5" />
                ) : (
                  <Building2 className="h-5 w-5" />
                )}
                <span>Informations principales</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Identité */}
              <div>
                <p className="font-medium text-gray-900">{nomComplet}</p>
                <p className="text-sm text-gray-500">
                  {formatProprietaireType(proprietaire.type)}
                </p>
              </div>

              {/* Détails spécifiques selon le type */}
              {proprietaire.type === 'physique' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    {proprietaire.date_naissance && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                          Né(e) le {new Date(proprietaire.date_naissance).toLocaleDateString('fr-FR')}
                          {proprietaire.lieu_naissance && ` à ${proprietaire.lieu_naissance}`}
                          <span className="text-gray-500 ml-1">
                            ({calculateAge(proprietaire.date_naissance)} ans)
                          </span>
                        </span>
                      </div>
                    )}
                    {proprietaire.nationalite && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span>Nationalité {proprietaire.nationalite}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {proprietaire.type === 'morale' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                      <Scale className="h-4 w-4 text-gray-400" />
                      <span>Informations juridiques</span>
                    </h4>
                    <div className="space-y-2 pl-6">
                      {proprietaire.forme_juridique && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-500">Forme juridique :</span>
                          <span className="font-medium">{formatFormeJuridique(proprietaire.forme_juridique)}</span>
                        </div>
                      )}
                      {proprietaire.numero_identification && (
                        <div className="flex items-center space-x-2 text-sm">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-500">N° identification :</span>
                          <span className="font-medium">{proprietaire.numero_identification}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Contact - Intégré dans informations principales */}
              {(proprietaire.email || proprietaire.telephone) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>Contact</span>
                    </h4>
                    <div className="space-y-2 pl-6">
                      {proprietaire.email && (
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-500">Email :</span>
                          <a 
                            href={`mailto:${proprietaire.email}`}
                            className="text-brand-copper hover:underline font-medium"
                          >
                            {proprietaire.email}
                          </a>
                        </div>
                      )}
                      {proprietaire.telephone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-500">Téléphone :</span>
                          <a 
                            href={`tel:${proprietaire.telephone}`}
                            className="text-brand-copper hover:underline font-medium"
                          >
                            {proprietaire.telephone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Adresse - Intégrée dans informations principales */}
              {(proprietaire.adresse || proprietaire.ville) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>Adresse</span>
                    </h4>
                    <div className="pl-6">
                      <p className="text-sm text-gray-700">
                        {formatAdresseComplete(proprietaire)}
                      </p>
                    </div>
                  </div>
                </>
              )}

            </CardContent>
          </Card>


          {/* Informations bancaires - Section dédiée pour tous les types */}
          {(proprietaire.iban || proprietaire.account_holder_name || proprietaire.bank_name || proprietaire.swift_bic) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-[#D4841A]" />
                  <span>Informations bancaires</span>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Informations nécessaires pour les virements SEPA et paiements internationaux
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {proprietaire.iban && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">IBAN :</span>
                      <span className="text-xs text-gray-500 bg-green-50 px-2 py-1 rounded">✓ SEPA</span>
                    </div>
                    <p className="font-mono text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {proprietaire.iban}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {proprietaire.account_holder_name && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-700">Nom du titulaire :</span>
                      <p className="text-sm text-gray-900 font-medium">{proprietaire.account_holder_name}</p>
                    </div>
                  )}
                  
                  {proprietaire.bank_name && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-700">Établissement bancaire :</span>
                      <p className="text-sm text-gray-900 font-medium">{proprietaire.bank_name}</p>
                    </div>
                  )}
                </div>
                
                {proprietaire.swift_bic && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Code BIC/SWIFT :</span>
                      <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">International</span>
                    </div>
                    <p className="font-mono text-sm text-gray-900 bg-blue-50 p-2 rounded border">
                      {proprietaire.swift_bic}
                    </p>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="text-amber-600 mt-0.5">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-800">Sécurité des données bancaires</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Ces informations sont strictement confidentielles et utilisées uniquement pour les virements SEPA autorisés.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Capital et associés (personne morale uniquement) */}
          {proprietaire.type === 'morale' && (
            <AssociesManagerComplete
              proprietaire={proprietaire}
              associes={associes}
            />
          )}
        </div>

        {/* Colonne droite (2/5) : Système & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Métadonnées système */}
          <Card>
            <CardHeader>
              <CardTitle>Informations système</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Créé le :</span>
                <p className="font-medium">
                  {new Date(proprietaire.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              
              <div>
                <span className="text-gray-500">Modifié le :</span>
                <p className="font-medium">
                  {new Date(proprietaire.updated_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div>
                <span className="text-gray-500">Statut :</span>
                <p className="font-medium">
                  {proprietaire.is_active ? '🟢 Actif' : '🔴 Inactif'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/proprietaires/${proprietaire.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier les informations
                </Link>
              </Button>
              
              {canHaveAssocies(proprietaire) && (
                <Button variant="outline" size="sm" className="w-full" disabled>
                  <Users className="h-4 w-4 mr-2" />
                  Gérer les associés (voir ci-contre)
                </Button>
              )}

              <Button variant="outline" size="sm" className="w-full" disabled>
                <Building2 className="h-4 w-4 mr-2" />
                Voir les propriétés (bientôt)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}