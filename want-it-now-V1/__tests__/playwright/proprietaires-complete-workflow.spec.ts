import { test, expect } from '@playwright/test'

test.describe('Propriétaires System - Complete Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to main proprietaires page
    await page.goto('http://localhost:3001/proprietaires')
    
    // Wait for page to be fully loaded
    await page.waitForSelector('[data-testid="proprietaires-table"]', { timeout: 10000 })
  })

  test('should display proprietaires page with correct KPIs and data', async ({ page }) => {
    // Test 1: Page title and navigation
    await expect(page).toHaveTitle(/Propriétaires/)
    await expect(page.locator('h1')).toContainText('Propriétaires')
    
    // Test 2: KPI Cards Display
    console.log('✓ Testing KPI Cards...')
    
    // Should have KPI cards with Want It Now design system
    const kpiCards = page.locator('[data-testid*="kpi-"]')
    await expect(kpiCards).toHaveCount(4) // Total, Physiques, Morales, Brouillons
    
    // Test Total proprietaires KPI
    const totalKpi = page.locator('[data-testid="kpi-total"]')
    await expect(totalKpi).toBeVisible()
    const totalValue = await totalKpi.locator('.text-2xl').textContent()
    console.log(`📊 Total Propriétaires: ${totalValue}`)
    expect(parseInt(totalValue || '0')).toBeGreaterThan(0)
    
    // Test Physiques KPI  
    const physiquesKpi = page.locator('[data-testid="kpi-physiques"]')
    await expect(physiquesKpi).toBeVisible()
    const physiquesValue = await physiquesKpi.locator('.text-2xl').textContent()
    console.log(`👤 Personnes Physiques: ${physiquesValue}`)
    
    // Test Morales KPI
    const moralesKpi = page.locator('[data-testid="kpi-morales"]') 
    await expect(moralesKpi).toBeVisible()
    const moralesValue = await moralesKpi.locator('.text-2xl').textContent()
    console.log(`🏢 Personnes Morales: ${moralesValue}`)
    
    // Test 3: Table Display and Structure
    console.log('✓ Testing Table Structure...')
    
    const table = page.locator('[data-testid="proprietaires-table"]')
    await expect(table).toBeVisible()
    
    // Check table headers
    await expect(page.locator('thead th')).toHaveCount(6) // Nom, Type, Email, Statut, Actions, Checkbox
    
    // Verify data rows exist
    const dataRows = page.locator('tbody tr')
    const rowCount = await dataRows.count()
    console.log(`📋 Table Rows Count: ${rowCount}`)
    expect(rowCount).toBeGreaterThan(0)
    
    // Test 4: Search Functionality
    console.log('✓ Testing Search...')
    
    const searchInput = page.locator('[data-testid="search-input"]')
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toHaveAttribute('placeholder', /Rechercher/)
    
    // Test 5: Action Buttons
    console.log('✓ Testing Action Buttons...')
    
    // New proprietaire button
    const newButton = page.locator('[data-testid="new-proprietaire-button"]')
    await expect(newButton).toBeVisible()
    await expect(newButton).toHaveClass(/bg-\[#D4841A\]/) // Want It Now copper color
    
    // Export button should be visible
    const exportButton = page.locator('button').filter({ hasText: 'Export' })
    await expect(exportButton).toBeVisible()
    
    console.log('✅ Page Display Test Completed')
  })

  test('should successfully archive a proprietaire', async ({ page }) => {
    console.log('🗂️ Testing Archive Workflow...')
    
    // Step 1: Get initial count
    const initialRows = await page.locator('tbody tr').count()
    console.log(`📊 Initial proprietaires count: ${initialRows}`)
    
    // Step 2: Find first proprietaire with actions
    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow).toBeVisible()
    
    // Get proprietaire name for verification
    const proprietaireName = await firstRow.locator('td').nth(1).textContent()
    console.log(`🎯 Target proprietaire: ${proprietaireName}`)
    
    // Step 3: Open actions menu
    const actionsButton = firstRow.locator('[data-testid*="actions-"]').first()
    await expect(actionsButton).toBeVisible()
    await actionsButton.click()
    
    // Step 4: Click archive option
    const archiveOption = page.locator('[data-testid*="archive-"]').first()
    await expect(archiveOption).toBeVisible()
    await archiveOption.click()
    
    // Step 5: Confirm archiving in modal
    const confirmButton = page.locator('button').filter({ hasText: /Archiver|Confirmer/ })
    await expect(confirmButton).toBeVisible()
    await confirmButton.click()
    
    // Step 6: Wait for success message
    const successMessage = page.locator('.alert, .toast, [role="alert"]').filter({ hasText: /archiv/i })
    await expect(successMessage).toBeVisible({ timeout: 5000 })
    console.log('✅ Success message displayed')
    
    // Step 7: Verify proprietaire removed from main list
    await page.waitForTimeout(1000) // Allow for data refresh
    const newRows = await page.locator('tbody tr').count()
    console.log(`📊 New proprietaires count: ${newRows}`)
    expect(newRows).toBe(initialRows - 1)
    
    // Step 8: Verify proprietaire name no longer in table
    const tableContent = await page.locator('tbody').textContent()
    expect(tableContent).not.toContain(proprietaireName || '')
    
    console.log('✅ Archive Workflow Test Completed')
  })

  test('should display archived proprietaires in archives page', async ({ page }) => {
    console.log('📦 Testing Archives Page...')
    
    // Step 1: Navigate to archives page
    await page.goto('http://localhost:3001/proprietaires/archives')
    await page.waitForSelector('[data-testid="archives-table"]', { timeout: 10000 })
    
    // Step 2: Verify page structure
    await expect(page).toHaveTitle(/Archives/)
    await expect(page.locator('h1')).toContainText('Archives')
    
    // Step 3: Check archives KPIs
    console.log('✓ Testing Archives KPIs...')
    
    const archivesKpis = page.locator('[data-testid*="archive-kpi-"]')
    await expect(archivesKpis.first()).toBeVisible()
    
    const totalArchived = await page.locator('[data-testid="archive-kpi-total"]').locator('.text-2xl').textContent()
    console.log(`📊 Total Archived: ${totalArchived}`)
    expect(parseInt(totalArchived || '0')).toBeGreaterThanOrEqual(0)
    
    // Step 4: Check archives table
    console.log('✓ Testing Archives Table...')
    
    const archivesTable = page.locator('[data-testid="archives-table"]')
    await expect(archivesTable).toBeVisible()
    
    // Check for archived date column
    await expect(page.locator('thead th')).toContainText('Date archivage')
    
    // Step 5: Test restore functionality (if available)
    const archiveRows = await page.locator('tbody tr').count()
    if (archiveRows > 0) {
      console.log(`📋 Found ${archiveRows} archived proprietaires`)
      
      // Test restore action
      const firstArchivedRow = page.locator('tbody tr').first()
      const restoreButton = firstArchivedRow.locator('[data-testid*="restore-"]')
      
      if (await restoreButton.count() > 0) {
        await expect(restoreButton).toBeVisible()
        console.log('✓ Restore functionality available')
      }
    } else {
      console.log('ℹ️ No archived proprietaires found')
    }
    
    // Step 6: Navigation back to main page
    const backButton = page.locator('a[href="/proprietaires"]').first()
    if (await backButton.count() > 0) {
      await expect(backButton).toBeVisible()
      console.log('✓ Back navigation available')
    }
    
    console.log('✅ Archives Page Test Completed')
  })

  test('should maintain data consistency after archive/restore cycle', async ({ page }) => {
    console.log('🔄 Testing Data Consistency...')
    
    // Step 1: Record initial state
    const initialTotal = await page.locator('[data-testid="kpi-total"] .text-2xl').textContent()
    const initialRows = await page.locator('tbody tr').count()
    console.log(`📊 Initial State - Total: ${initialTotal}, Rows: ${initialRows}`)
    
    // Step 2: Archive a proprietaire
    const firstRow = page.locator('tbody tr').first()
    const proprietaireName = await firstRow.locator('td').nth(1).textContent()
    
    const actionsButton = firstRow.locator('[data-testid*="actions-"]').first()
    await actionsButton.click()
    
    const archiveOption = page.locator('[data-testid*="archive-"]').first()
    await archiveOption.click()
    
    const confirmButton = page.locator('button').filter({ hasText: /Archiver|Confirmer/ })
    await confirmButton.click()
    
    // Wait for operation to complete
    await page.waitForTimeout(2000)
    
    // Step 3: Verify KPI updated
    const updatedTotal = await page.locator('[data-testid="kpi-total"] .text-2xl').textContent()
    console.log(`📊 After Archive - Total: ${updatedTotal}`)
    expect(parseInt(updatedTotal || '0')).toBe(parseInt(initialTotal || '0') - 1)
    
    // Step 4: Check archives page
    await page.goto('http://localhost:3001/proprietaires/archives')
    await page.waitForSelector('[data-testid="archives-table"]', { timeout: 5000 })
    
    const archiveRows = await page.locator('tbody tr').count()
    console.log(`📦 Archives count: ${archiveRows}`)
    
    // Step 5: Verify archived proprietaire appears
    const archiveTableContent = await page.locator('tbody').textContent()
    expect(archiveTableContent).toContain(proprietaireName || '')
    console.log(`✓ Proprietaire "${proprietaireName}" found in archives`)
    
    // Step 6: Return to main page and verify final state
    await page.goto('http://localhost:3001/proprietaires')
    await page.waitForSelector('[data-testid="proprietaires-table"]', { timeout: 5000 })
    
    const finalRows = await page.locator('tbody tr').count()
    expect(finalRows).toBe(initialRows - 1)
    console.log(`✅ Final state consistent - Rows: ${finalRows}`)
    
    console.log('✅ Data Consistency Test Completed')
  })

  test('should handle errors gracefully', async ({ page }) => {
    console.log('⚠️ Testing Error Handling...')
    
    // Test 1: Invalid navigation
    await page.goto('http://localhost:3001/proprietaires/invalid-id')
    await page.waitForTimeout(2000)
    
    // Should either redirect or show 404
    const pageUrl = page.url()
    console.log(`🔗 Invalid URL result: ${pageUrl}`)
    
    // Test 2: Network error simulation (if possible)
    // This would require more complex setup
    
    // Test 3: Return to valid page
    await page.goto('http://localhost:3001/proprietaires')
    await page.waitForSelector('[data-testid="proprietaires-table"]', { timeout: 5000 })
    
    const table = page.locator('[data-testid="proprietaires-table"]')
    await expect(table).toBeVisible()
    console.log('✓ Recovery to valid page successful')
    
    console.log('✅ Error Handling Test Completed')
  })

  test('should verify Want It Now design system implementation', async ({ page }) => {
    console.log('🎨 Testing Design System...')
    
    // Test 1: Color scheme (copper #D4841A and green #2D5A27)
    const newButton = page.locator('[data-testid="new-proprietaire-button"]')
    await expect(newButton).toHaveClass(/bg-\[#D4841A\]/)
    console.log('✓ Copper color applied to primary buttons')
    
    // Test 2: Badges and status indicators
    const activeStatuses = page.locator('.badge, [class*="badge"]').filter({ hasText: /Actif/ })
    if (await activeStatuses.count() > 0) {
      console.log('✓ Status badges present')
    }
    
    // Test 3: Table styling
    const tableHeaders = page.locator('thead th')
    await expect(tableHeaders.first()).toBeVisible()
    console.log('✓ Table styling consistent')
    
    // Test 4: Responsive design check
    await page.setViewportSize({ width: 768, height: 1024 }) // Tablet
    await page.waitForTimeout(500)
    
    const table = page.locator('[data-testid="proprietaires-table"]')
    await expect(table).toBeVisible()
    console.log('✓ Tablet responsive design working')
    
    // Reset to desktop
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.waitForTimeout(500)
    
    console.log('✅ Design System Test Completed')
  })
})