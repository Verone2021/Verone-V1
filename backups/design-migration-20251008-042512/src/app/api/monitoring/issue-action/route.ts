/**
 * 🔧 API Route - Actions Rapides sur Issues Sentry
 *
 * Endpoint pour effectuer des actions rapides sur les issues :
 * - Marquer comme résolu/non résolu
 * - Assigner à un utilisateur
 * - Modifier le niveau de priorité
 */

import { NextRequest, NextResponse } from 'next/server'

const SENTRY_API_URL = 'https://de.sentry.io/api/0'
const SENTRY_ORG = process.env.SENTRY_ORG || 'verone'
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN

/**
 * PUT - Effectuer une action sur une issue
 */
export async function PUT(request: NextRequest) {
  try {
    if (!SENTRY_AUTH_TOKEN) {
      console.error('❌ [API Issue Action] SENTRY_AUTH_TOKEN manquant')
      return NextResponse.json(
        { error: 'Configuration Sentry manquante' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { issueId, action, value } = body

    if (!issueId || !action) {
      return NextResponse.json(
        { error: 'Paramètres manquants: issueId et action requis' },
        { status: 400 }
      )
    }

    console.log(`🔧 [API Issue Action] Action ${action} sur issue ${issueId}`)

    let updateData: any = {}

    // Déterminer les données à envoyer selon l'action
    switch (action) {
      case 'resolve':
        updateData = { status: 'resolved' }
        break
      case 'unresolve':
        updateData = { status: 'unresolved' }
        break
      case 'ignore':
        updateData = { status: 'ignored' }
        break
      case 'assign':
        if (value) {
          updateData = { assignedTo: value }
        } else {
          updateData = { assignedTo: null } // Désassigner
        }
        break
      case 'bookmark':
        updateData = { isBookmarked: true }
        break
      case 'unbookmark':
        updateData = { isBookmarked: false }
        break
      default:
        return NextResponse.json(
          { error: `Action non supportée: ${action}` },
          { status: 400 }
        )
    }

    // Effectuer la requête vers l'API Sentry
    const response = await fetch(
      `${SENTRY_API_URL}/organizations/${SENTRY_ORG}/issues/${issueId}/`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      }
    )

    if (!response.ok) {
      console.error(`❌ [API Issue Action] Erreur Sentry: ${response.status}`)
      throw new Error(`Erreur API Sentry: ${response.status}`)
    }

    const updatedIssue = await response.json()

    console.log(`✅ [API Issue Action] Action ${action} réussie sur issue ${issueId}`)

    return NextResponse.json({
      success: true,
      message: `Action ${action} effectuée avec succès`,
      issue: updatedIssue
    })

  } catch (error) {
    console.error('💥 [API Issue Action] Erreur:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'exécution de l\'action',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

/**
 * POST - Actions en lot sur plusieurs issues
 */
export async function POST(request: NextRequest) {
  try {
    if (!SENTRY_AUTH_TOKEN) {
      return NextResponse.json(
        { error: 'Configuration Sentry manquante' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { issueIds, action, value } = body

    if (!issueIds || !Array.isArray(issueIds) || !action) {
      return NextResponse.json(
        { error: 'Paramètres manquants: issueIds (array) et action requis' },
        { status: 400 }
      )
    }

    console.log(`🔧 [API Issue Action Batch] Action ${action} sur ${issueIds.length} issues`)

    const results = []
    let successful = 0
    let failed = 0

    // Traitement en lot avec limitation de débit
    for (const issueId of issueIds) {
      try {
        const singleActionRequest = new NextRequest(request.url, {
          method: 'PUT',
          body: JSON.stringify({ issueId, action, value })
        })

        const result = await PUT(singleActionRequest)
        const resultJson = await result.json()

        if (result.ok) {
          successful++
          results.push({ issueId, success: true, data: resultJson })
        } else {
          failed++
          results.push({ issueId, success: false, error: resultJson.error })
        }

        // Pause pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        failed++
        results.push({
          issueId,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }
    }

    console.log(`✅ [API Issue Action Batch] Terminé: ${successful} succès, ${failed} échecs`)

    return NextResponse.json({
      success: true,
      message: `Action ${action} terminée: ${successful} succès, ${failed} échecs`,
      summary: { successful, failed, total: issueIds.length },
      results
    })

  } catch (error) {
    console.error('💥 [API Issue Action Batch] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'exécution des actions en lot' },
      { status: 500 }
    )
  }
}