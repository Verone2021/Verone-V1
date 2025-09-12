import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { createClient } from '@/lib/supabase/server'
import { AuthenticatedAppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

async function createTestContracts() {
  'use server'
  
  const supabase = createClient()
  
  try {
    // 1. Récupérer organisation de l'utilisateur
    const { data: orgs } = await supabase
      .from('organisations')
      .select('id')
      .limit(1)

    if (!orgs || orgs.length === 0) {
      throw new Error('Aucune organisation trouvée')
    }

    const organisationId = orgs[0].id

    // 2. Récupérer propriétés
    const { data: props } = await supabase
      .from('proprietes')
      .select('id, nom')
      .eq('organisation_id', organisationId)
      .limit(2)

    if (!props || props.length < 2) {
      throw new Error('Pas assez de propriétés disponibles')
    }

    // 3. Créer les contrats
    const contrat1 = {
      id: crypto.randomUUID(),
      organisation_id: organisationId,
      propriete_id: props[0].id,
      unite_id: null,
      type_contrat: 'fixe',
      date_emission: '2025-01-15',
      date_debut: '2025-03-01',
      date_fin: '2026-02-28',
      meuble: true,
      autorisation_sous_location: true,
      besoin_renovation: false,
      commission_pourcentage: 12
    }

    const contrat2 = {
      id: crypto.randomUUID(),
      organisation_id: organisationId,
      propriete_id: props[1].id,
      unite_id: null,
      type_contrat: 'variable',
      date_emission: '2025-01-10',
      date_debut: '2025-02-01',
      date_fin: '2026-01-31',
      meuble: true,
      autorisation_sous_location: true,
      besoin_renovation: false,
      commission_pourcentage: 10
    }

    // Insertion avec server client (respecte RLS)
    const { error: error1 } = await supabase
      .from('contrats')
      .insert(contrat1)

    const { error: error2 } = await supabase
      .from('contrats')
      .insert(contrat2)

    if (error1) throw error1
    if (error2) throw error2

    redirect('/contrats?inserted=success')
    
  } catch (error) {
    console.error('Erreur insertion:', error)
    redirect('/contrats?error=' + encodeURIComponent(error.message))
  }
}

export default async function TestInsertPage() {
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  const supabase = createClient()
  
  // Vérifier les données existantes
  const { data: contrats, count } = await supabase
    .from('contrats')
    .select('*', { count: 'exact' })

  const { data: proprietes } = await supabase
    .from('proprietes')
    .select('id, nom')
    .limit(5)

  return (
    <AuthenticatedAppShell>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Insertion Contrats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p><strong>Contrats existants:</strong> {count || 0}</p>
              <p><strong>Propriétés disponibles:</strong> {proprietes?.length || 0}</p>
            </div>
            
            {proprietes && proprietes.length >= 2 ? (
              <form action={createTestContracts}>
                <Button 
                  type="submit" 
                  className="bg-[#D4841A] hover:bg-[#B8741A] text-white"
                >
                  Créer 2 Contrats de Test
                </Button>
              </form>
            ) : (
              <div className="bg-red-50 p-4 rounded-lg text-red-700">
                Pas assez de propriétés disponibles pour créer les contrats
              </div>
            )}

            <div className="text-sm text-gray-600">
              <p>Propriétés disponibles:</p>
              <ul className="list-disc ml-4">
                {proprietes?.map(p => (
                  <li key={p.id}>{p.nom}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedAppShell>
  )
}