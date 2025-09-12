'use client'

import { useEffect, useState } from 'react'
import { ContratWizardMinimal } from '@/components/contrats/contrat-wizard-minimal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'

export default function ContratWizardMinimalWrapper() {
  const [proprietes, setProprietes] = useState<any[]>([])
  const [unites, setUnites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [totalProprietes, setTotalProprietes] = useState<number>(0)

  // Utiliser le hook d'auth SSR existant au lieu de créer un nouveau client
  const { user, profile, loading: authLoading } = useAuth()
  const supabase = createClient()

  // Fonction pour charger toutes les propriétés accessibles à l'utilisateur
  useEffect(() => {
    async function loadProperties() {
      try {
        setLoading(true)
        setError('')

        // Si auth SSR est encore en cours, attendre
        if (authLoading) {
          return
        }

        // Vérifier si utilisateur est connecté via SSR
        if (!user || !profile) {
          setError('Utilisateur non authentifié')
          return
        }

        setUserRole(profile.role)

        // Debug auth state
        console.log('🔍 [WRAPPER] État auth avant requête:', {
          hasUser: !!user,
          hasProfile: !!profile,
          userId: user?.id,
          profileRole: profile?.role,
          authLoading
        })

        // Charger les propriétés directement avec informations d'organisation
        // Les RLS vont automatiquement filtrer selon les droits d'accès
        // IMPORTANT: Filtrer les propriétés qui n'ont PAS de contrat actif
        console.log('🔄 [WRAPPER] Début requête propriétés disponibles (sans contrat actif)...')
        
        // Première étape: récupérer toutes les propriétés accessibles
        const { data: allProprietesData, error: propError } = await supabase
          .from('proprietes')
          .select(`
            id,
            nom,
            type,
            ville,
            pays,
            organisation_id,
            is_active,
            organisations!inner(id, nom, pays)
          `)
          .eq('is_active', true)
          .order('nom')
        
        if (propError) {
          console.error('❌ [WRAPPER] Erreur récupération propriétés:', propError)
          setError(`Erreur RLS: ${propError.message} (Code: ${propError.code})`)
          return
        }

        // Deuxième étape: récupérer les propriétés qui ont déjà un contrat actif (en cours)
        const today = new Date().toISOString().split('T')[0]
        const { data: contratsActifs, error: contractsError } = await supabase
          .from('contrats')
          .select('propriete_id, unite_id, date_debut, date_fin')
          .lte('date_debut', today) // Contrat déjà commencé
          .gte('date_fin', today)   // Contrat pas encore fini
        
        if (contractsError) {
          console.error('❌ [WRAPPER] Erreur récupération contrats actifs:', {
            message: contractsError.message || 'Message inconnu',
            code: contractsError.code || 'Code inconnu',
            details: contractsError.details || 'Pas de détails',
            hint: contractsError.hint || 'Pas d\'aide',
            supabaseError: contractsError
          })
          
          // Si erreur RLS ou permission, on continue sans filtrage
          console.warn('⚠️ [WRAPPER] Continuant sans filtrage contrats actifs (RLS ou permissions)')
        }

        // Filtrer les propriétés qui n'ont pas de contrat actif
        // Prendre en compte à la fois propriete_id et unite_id des contrats
        const proprietesWithActiveContracts = new Set()
        const unitesWithActiveContracts = new Set()
        
        contratsActifs?.forEach(contrat => {
          if (contrat.propriete_id) {
            proprietesWithActiveContracts.add(contrat.propriete_id)
          }
          if (contrat.unite_id) {
            unitesWithActiveContracts.add(contrat.unite_id)
          }
        })
        
        const proprietesData = allProprietesData?.filter(propriete => {
          // La propriété ne doit pas avoir de contrat actif direct
          return !proprietesWithActiveContracts.has(propriete.id)
        }) || []
        
        console.log('📊 [WRAPPER] Filtrage des propriétés:', {
          totalProprietes: allProprietesData?.length || 0,
          contratsActifs: contratsActifs?.length || 0,
          proprietesDisponibles: proprietesData.length,
          proprietesAvecContratsActifs: Array.from(proprietesWithActiveContracts),
          unitesAvecContratsActifs: Array.from(unitesWithActiveContracts),
          contratsDetails: contratsActifs?.map(c => ({
            propriete_id: c.propriete_id,
            unite_id: c.unite_id,
            periode: `${c.date_debut} → ${c.date_fin}`
          })) || []
        })

        // Log détaillé des propriétés disponibles
        if (proprietesData && proprietesData.length > 0) {
          console.log('🔍 [WRAPPER] Propriétés disponibles pour nouveau contrat:', {
            sample: proprietesData[0],
            keys: Object.keys(proprietesData[0]),
            hasOrganisations: !!proprietesData[0]?.organisations,
            organisationsStructure: proprietesData[0]?.organisations
          })
        }

        // Stocker le total pour affichage ultérieur
        setTotalProprietes(allProprietesData?.length || 0)

        if (!proprietesData || proprietesData.length === 0) {
          const totalProprietesCount = allProprietesData?.length || 0
          if (totalProprietesCount === 0) {
            setError('Aucune propriété accessible. Vous devez d\'abord créer une propriété.')
          } else {
            setError(`Aucune propriété disponible pour un nouveau contrat. Toutes les ${totalProprietesCount} propriété(s) ont déjà un contrat actif.`)
          }
          return
        }

        setProprietes(proprietesData)

        // Récupérer les unités actives pour toutes les propriétés
        const { data: unitesData, error: unitError } = await supabase
          .from('unites')
          .select(`
            id,
            nom,
            numero,
            propriete_id,
            is_active
          `)
          .eq('is_active', true)
          .order('nom')

        if (unitError) {
          console.error('Erreur récupération unités:', unitError)
          // Continuer même si les unités échouent
        } else {
          setUnites(unitesData || [])
        }

      } catch (err) {
        console.error('Erreur chargement propriétés:', err)
        setError('Erreur lors du chargement des propriétés')
      } finally {
        setLoading(false)
      }
    }

    loadProperties()
  }, [user, profile, authLoading, supabase])


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4841A] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des propriétés...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!proprietes.length) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert className={totalProprietes === 0 ? "border-yellow-200 bg-yellow-50" : "border-orange-200 bg-orange-50"}>
          <AlertCircle className={`h-4 w-4 ${totalProprietes === 0 ? 'text-yellow-600' : 'text-orange-600'}`} />
          <AlertDescription className={totalProprietes === 0 ? 'text-yellow-700' : 'text-orange-700'}>
            {totalProprietes === 0 ? (
              <>
                Aucune propriété accessible. Vous devez d'abord créer une propriété avant de pouvoir créer un contrat.
                {userRole === 'super_admin' 
                  ? ' En tant que super administrateur, vérifiez qu\'il existe des propriétés actives.' 
                  : ' Contactez votre administrateur si vous devriez avoir accès à des propriétés.'}
              </>
            ) : (
              <>
                <strong>Aucune propriété disponible pour un nouveau contrat.</strong>
                {' '}Toutes les {totalProprietes} propriété(s) ont déjà un contrat actif.
                {' '}Pour créer un nouveau contrat, attendez qu'un contrat existant expire ou créez une nouvelle propriété.
              </>
            )}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <ContratWizardMinimal
      proprietes={proprietes}
      unites={unites}
    />
  )
}