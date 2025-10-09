/**
 * Force Dynamic Rendering Global Config
 * Appliqué à TOUTES les pages pour contourner bug Next.js 15 App Router
 * Bug: next/document chunks inclus malgré App Router uniquement
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0
