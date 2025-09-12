import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Utiliser le service role pour contourner RLS temporairement pour debug
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_ACCESS_TOKEN!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log('🔍 Debug propriétés avec service role...')
    
    // Compter toutes les propriétés
    const { count: totalCount, error: countError } = await supabase
      .from('proprietes')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('Erreur count:', countError)
    }
    
    // Récupérer quelques propriétés
    const { data: proprietes, error: propError } = await supabase
      .from('proprietes')
      .select('id, nom, organisation_id')
      .limit(10)
    
    if (propError) {
      console.error('Erreur propriétés:', propError)
    }
    
    // Compter organisations
    const { count: orgCount, error: orgCountError } = await supabase
      .from('organisations')
      .select('*', { count: 'exact', head: true })
    
    if (orgCountError) {
      console.error('Erreur org count:', orgCountError)
    }
    
    // Récupérer quelques organisations
    const { data: organisations, error: orgError } = await supabase
      .from('organisations')
      .select('id, nom')
      .limit(5)
    
    if (orgError) {
      console.error('Erreur organisations:', orgError)
    }
    
    console.log(`📊 Found ${totalCount} propriétés et ${orgCount} organisations`)
    
    return NextResponse.json({
      success: true,
      stats: {
        total_proprietes: totalCount,
        total_organisations: orgCount
      },
      sample_proprietes: proprietes,
      sample_organisations: organisations,
      message: "Debug data retrieved with service role"
    })
    
  } catch (error) {
    console.error('❌ Erreur debug:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}