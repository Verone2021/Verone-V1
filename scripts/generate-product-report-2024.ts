#!/usr/bin/env node
/**
 * Script de génération du rapport des produits vendus en 2024 (LinkMe uniquement)
 *
 * Objectif: Générer RAPPORT_PRODUITS_VENDUS_2024.md avec la liste de tous les produits
 * vendus via LinkMe en 2024, en s'assurant que le total TTC correspond exactement
 * aux 86 681,38 € des 40 factures LinkMe.
 *
 * Utilisation: pnpm tsx scripts/generate-product-report-2024.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Types pour les résultats SQL
interface ProductSold {
  product_id: string
  product_name: string
  product_sku: string | null
  total_quantity: number
  total_ht: number
  total_tva: number
  total_ttc: number
}

interface OrderCount {
  count: number
}

// Configuration Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables d\'environnement manquantes:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Formatage des montants en euros
function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

// Formatage des dates
function formatDate(): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

/**
 * Requête principale: récupère tous les produits vendus en 2024 via LinkMe
 * avec quantités et totaux agrégés
 */
async function fetchProductsSold(): Promise<ProductSold[]> {
  console.log('📊 Extraction des produits vendus en 2024 (LinkMe)...')

  const { data, error } = await supabase.rpc('get_linkme_products_2024')

  if (error) {
    console.error('❌ Erreur lors de l\'extraction:', error.message)
    throw error
  }

  if (!data || data.length === 0) {
    console.warn('⚠️  Aucun produit trouvé pour 2024')
    return []
  }

  console.log(`✓ ${data.length} produits extraits`)
  return data
}

/**
 * Compte le nombre de commandes LinkMe en 2024
 */
async function countLinkMeOrders(): Promise<number> {
  const { data, error, count } = await supabase
    .from('linkme_orders_enriched')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', '2024-01-01')
    .lt('created_at', '2025-01-01')
    .not('status', 'in', '(draft,cancelled)')

  if (error) {
    console.error('❌ Erreur lors du comptage des commandes:', error.message)
    return 0
  }

  return count || 0
}

/**
 * Génère le contenu Markdown du rapport
 */
function generateMarkdownReport(products: ProductSold[], orderCount: number): string {
  // Calcul des totaux
  const totalQuantity = products.reduce((sum, p) => sum + p.total_quantity, 0)
  const totalHT = products.reduce((sum, p) => sum + p.total_ht, 0)
  const totalTVA = products.reduce((sum, p) => sum + p.total_tva, 0)
  const totalTTC = products.reduce((sum, p) => sum + p.total_ttc, 0)

  const TARGET_TTC = 86681.38 // Montant cible des 40 factures LinkMe

  let markdown = `# RAPPORT PRODUITS VENDUS 2024 - LINKME

**Date d'extraction** : ${formatDate()}
**Source** : Base de données Supabase - Commandes LinkMe 2024

---

## SYNTHESE GENERALE

| Métrique | Valeur |
|----------|--------|
| Nombre de produits différents | ${products.length} |
| Quantité totale vendue | ${totalQuantity} unités |
| Chiffre d'affaires HT | ${formatEuro(totalHT)} |
| TVA totale | ${formatEuro(totalTVA)} |
| **Chiffre d'affaires TTC** | **${formatEuro(totalTTC)}** |

---

## PRODUITS VENDUS (par quantité décroissante)

| Produit | SKU | Quantité | Total HT | TVA | Total TTC |
|---------|-----|----------|----------|-----|-----------|
`

  // Trier par quantité décroissante
  const sortedProducts = [...products].sort((a, b) => b.total_quantity - a.total_quantity)

  sortedProducts.forEach((product) => {
    const sku = product.product_sku || 'N/A'
    markdown += `| ${product.product_name} | ${sku} | ${product.total_quantity} | ${formatEuro(product.total_ht)} | ${formatEuro(product.total_tva)} | ${formatEuro(product.total_ttc)} |\n`
  })

  markdown += `\n**TOTAL** : ${totalQuantity} unités - ${formatEuro(totalHT)} HT - ${formatEuro(totalTVA)} TVA - **${formatEuro(totalTTC)} TTC**\n\n`

  // Section vérification de cohérence
  const diff = Math.abs(totalTTC - TARGET_TTC)
  const coherenceIcon = diff < 1 ? '✅' : '⚠️'

  markdown += `---

## VERIFICATION COHERENCE

**Commandes LinkMe 2024 dans la base** :
- Nombre de commandes : ${orderCount}
- Montant total calculé : ${formatEuro(totalTTC)}

**Factures comptabilité (référence RAPPORT_FACTURES_2024.md)** :
- LinkMe : 40 factures
- Montant cible : ${formatEuro(TARGET_TTC)}

**Écart** : ${coherenceIcon} ${formatEuro(diff)} ${diff < 1 ? '(cohérent)' : '(à investiguer)'}

${diff >= 1 ? `
⚠️ **Action requise** : Un écart de ${formatEuro(diff)} a été détecté entre le total des produits vendus
et le montant des factures LinkMe. Vérifier:
1. Les commandes avec statut différent de 'validated', 'shipped', 'delivered'
2. Les produits avec variations de prix
3. Les remises ou frais supplémentaires non comptabilisés
` : ''}

---

*Rapport généré le ${formatDate()}*
`

  return markdown
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Génération du rapport des produits vendus 2024 (LinkMe)\n')

  try {
    // 1. Extraction des produits vendus
    const products = await fetchProductsSold()

    if (products.length === 0) {
      console.log('⚠️  Aucun produit à rapporter. Abandon.')
      process.exit(0)
    }

    // 2. Comptage des commandes
    const orderCount = await countLinkMeOrders()
    console.log(`✓ ${orderCount} commandes LinkMe 2024 trouvées\n`)

    // 3. Génération du rapport Markdown
    const reportContent = generateMarkdownReport(products, orderCount)

    // 4. Écriture du fichier
    const outputPath = path.join(process.cwd(), 'RAPPORT_PRODUITS_VENDUS_2024.md')
    fs.writeFileSync(outputPath, reportContent, 'utf-8')

    console.log('✅ Rapport généré avec succès !')
    console.log(`📄 Fichier : ${outputPath}`)

    // 5. Affichage du résumé
    const totalTTC = products.reduce((sum, p) => sum + p.total_ttc, 0)
    const targetTTC = 86681.38
    const diff = Math.abs(totalTTC - targetTTC)

    console.log('\n📊 RÉSUMÉ')
    console.log('─────────────────────────────────')
    console.log(`Produits différents : ${products.length}`)
    console.log(`Total TTC           : ${formatEuro(totalTTC)}`)
    console.log(`Cible (factures)    : ${formatEuro(targetTTC)}`)
    console.log(`Écart               : ${formatEuro(diff)} ${diff < 1 ? '✅' : '⚠️'}`)

  } catch (error) {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  }
}

// Exécution
main()
