import { NextResponse } from 'next/server'
import { getProprietesAvecContratsActifs } from '@/actions/reservations'

export async function GET() {
  try {
    console.log('🧪 Test récupération propriétés avec contrats...')
    
    const result = await getProprietesAvecContratsActifs()
    
    console.log('📊 Résultat:', result)
    
    if (result.success) {
      const count = result.data?.length || 0
      console.log(`✅ Succès: ${count} propriétés récupérées`)
      
      return NextResponse.json({
        success: true,
        count: count,
        message: `${count} propriétés avec contrats actifs trouvées`,
        properties: result.data?.slice(0, 3).map(p => ({
          id: p.propriete_id,
          nom: p.propriete_nom,
          adresse: p.adresse,
          ville: p.ville,
          organisation: p.organisation_nom,
          statut_contrat: p.statut_contrat
        }))
      })
    } else {
      console.log('❌ Échec:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Erreur test:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}