import { NextRequest, NextResponse } from 'next/server'
import { exportProprietes, exportProprietaires } from '@/actions/export'
import { getServerAuthData } from '@/lib/auth/server-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    // Vérifier l'authentification
    const authData = await getServerAuthData()
    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }
    
    const { type } = await params
    const body = await request.json()
    
    let result
    
    switch (type) {
      case 'proprietes':
        result = await exportProprietes(body)
        break
      case 'proprietaires':
        result = await exportProprietaires(body)
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Type d\'export non supporté' },
          { status: 400 }
        )
    }
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
    
    if (!result.data) {
      return NextResponse.json(
        { success: false, error: 'Aucune donnée générée' },
        { status: 500 }
      )
    }
    
    // Retourner le fichier
    return new NextResponse(result.data.content, {
      status: 200,
      headers: {
        'Content-Type': result.data.mimeType,
        'Content-Disposition': `attachment; filename="${result.data.filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
    
  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
      },
      { status: 500 }
    )
  }
}