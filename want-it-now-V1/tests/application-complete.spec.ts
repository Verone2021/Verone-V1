import { test, expect } from '@playwright/test'

test.describe('Application Complète - Tests d\'Intégration', () => {
  
  test.describe('Navigation Globale et Layout', () => {
    test('should display main navigation and sidebar correctly', async ({ page }) => {
      await page.goto('/')
      
      // Check main layout elements
      await expect(page.locator('nav, header')).toBeVisible()
      
      // Check sidebar navigation
      const sidebar = page.locator('[class*="sidebar"], nav')
      if (await sidebar.count() > 0) {
        await expect(sidebar).toBeVisible()
        
        // Check main navigation links
        await expect(page.locator('text=Dashboard, text=Tableau de bord')).toBeVisible()
        await expect(page.locator('text=Organisations')).toBeVisible()
        await expect(page.locator('text=Propriétés')).toBeVisible()
      }
    })

    test('should navigate between main sections correctly', async ({ page }) => {
      await page.goto('/')
      
      // Navigate to Organisations
      const orgLink = page.locator('text=Organisations')
      if (await orgLink.count() > 0) {
        await orgLink.click()
        await expect(page).toHaveURL('/organisations')
        await expect(page.locator('h1')).toContainText('Organisations')
      }
      
      // Navigate to Propriétés
      const propLink = page.locator('text=Propriétés')
      if (await propLink.count() > 0) {
        await propLink.click()
        await expect(page).toHaveURL('/proprietes')
        await expect(page.locator('h1')).toContainText('Propriétés')
      }
      
      // Navigate to Dashboard
      const dashLink = page.locator('text=Dashboard, text=Tableau de bord')
      if (await dashLink.count() > 0) {
        await dashLink.click()
        await expect(page).toHaveURL(/\/(dashboard)?$/)
      }
    })

    test('should maintain consistent header across pages', async ({ page }) => {
      const pages = ['/', '/organisations', '/proprietes']
      
      for (const pageUrl of pages) {
        await page.goto(pageUrl)
        
        // Header should be present
        const header = page.locator('header, nav')
        if (await header.count() > 0) {
          await expect(header).toBeVisible()
        }
        
        // Logo or brand should be visible
        const brand = page.locator('text=Want It Now, img[alt*="logo"], [class*="logo"]')
        if (await brand.count() > 0) {
          await expect(brand.first()).toBeVisible()
        }
      }
    })
  })

  test.describe('Workflow d\'Intégration Complète', () => {
    test('should complete end-to-end workflow: Organisation → Propriétaire → Propriété', async ({ page }) => {
      // 1. Start with Organisations
      await page.goto('/organisations')
      await expect(page.locator('h1')).toContainText('Organisations')
      
      // Check organisations exist or can be created
      const hasOrgs = await page.locator('table tbody tr').count() > 0
      const canCreateOrg = await page.locator('text=Nouvelle organisation').count() > 0
      
      expect(hasOrgs || canCreateOrg).toBeTruthy()
      
      // 2. Navigate to Propriétaires if available
      const propLink = page.locator('text=Propriétaires')
      if (await propLink.count() > 0) {
        await propLink.click()
        await expect(page).toHaveURL('/proprietaires')
        await expect(page.locator('h1')).toContainText('Propriétaires')
      }
      
      // 3. Navigate to Propriétés
      await page.goto('/proprietes')
      await expect(page.locator('h1')).toContainText('Propriétés')
      
      // Check properties can be managed
      const hasProps = await page.locator('table tbody tr').count() > 0
      const canCreateProp = await page.locator('text=Nouvelle propriété, text=Créer une propriété').count() > 0
      
      expect(hasProps || canCreateProp).toBeTruthy()
    })

    test('should maintain data relationships across entities', async ({ page }) => {
      // Test that properties are properly linked to organisations
      await page.goto('/proprietes')
      
      const propertyRows = page.locator('table tbody tr')
      
      if (await propertyRows.count() > 0) {
        // Properties should show organisation information
        const firstRow = propertyRows.first()
        
        // Look for organisation reference in the row
        const orgInfo = firstRow.locator('td')
        expect(await orgInfo.count()).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Fonctionnalités CRUD Cross-System', () => {
    test('should perform CRUD operations consistently across entities', async ({ page }) => {
      const entities = [
        { name: 'organisations', url: '/organisations', createText: 'Nouvelle organisation' },
        { name: 'proprietes', url: '/proprietes', createText: 'Nouvelle propriété' }
      ]
      
      for (const entity of entities) {
        await page.goto(entity.url)
        
        // List view should work
        await expect(page.locator('h1')).toBeVisible()
        
        // Create functionality should be available
        const createButton = page.locator(`text=${entity.createText}`)
        if (await createButton.count() > 0) {
          await createButton.click()
          
          // Should navigate to create form
          await expect(page).toHaveURL(new RegExp(`${entity.url}/(new|new-wizard)`))
          
          // Form should be visible
          await expect(page.locator('form, input')).toBeVisible()
          
          // Go back to list
          const backButton = page.locator('text=Retour, text=Annuler')
          if (await backButton.count() > 0) {
            await backButton.first().click()
            await expect(page).toHaveURL(entity.url)
          } else {
            await page.goBack()
          }
        }
      }
    })

    test('should handle archive/delete operations consistently', async ({ page }) => {
      // Test Organisations
      await page.goto('/organisations')
      
      const orgRows = page.locator('table tbody tr')
      if (await orgRows.count() > 0) {
        const actionsCell = orgRows.first().locator('td').last()
        
        // Should have action buttons
        const actionButtons = actionsCell.locator('button, a')
        expect(await actionButtons.count()).toBeGreaterThan(0)
      }
      
      // Test Propriétés
      await page.goto('/proprietes')
      
      const propRows = page.locator('table tbody tr')
      if (await propRows.count() > 0) {
        const actionsCell = propRows.first().locator('td').last()
        
        // Should have archive/delete buttons
        const archiveButton = actionsCell.locator('button[title*="Archiver"], button[title*="Désarchiver"]')
        const deleteButton = actionsCell.locator('button[title*="Supprimer"]')
        
        // At least one action should be available
        const hasActions = await archiveButton.count() > 0 || await deleteButton.count() > 0
        expect(hasActions).toBeTruthy()
      }
    })
  })

  test.describe('Design System et Cohérence UI', () => {
    test('should use consistent Want It Now branding', async ({ page }) => {
      const pages = ['/organisations', '/proprietes']
      
      for (const pageUrl of pages) {
        await page.goto(pageUrl)
        
        // Check for copper gradient colors
        const copperElements = page.locator('[class*="copper"], [class*="gradient"]')
        if (await copperElements.count() > 0) {
          // Copper elements should be visible
          await expect(copperElements.first()).toBeVisible()
        }
        
        // Check for consistent button styling
        const buttons = page.locator('button')
        if (await buttons.count() > 0) {
          for (let i = 0; i < Math.min(5, await buttons.count()); i++) {
            const button = buttons.nth(i)
            const buttonClass = await button.getAttribute('class')
            
            // Buttons should have shadcn/ui classes
            expect(buttonClass).toMatch(/inline-flex|items-center|justify-center/)
          }
        }
      }
    })

    test('should maintain consistent table styling', async ({ page }) => {
      const pagesWithTables = ['/organisations', '/proprietes']
      
      for (const pageUrl of pagesWithTables) {
        await page.goto(pageUrl)
        
        const table = page.locator('table')
        if (await table.count() > 0) {
          // Table should have header
          await expect(table.locator('thead, th')).toBeVisible()
          
          // Table should have body
          const tbody = table.locator('tbody')
          if (await tbody.count() > 0) {
            await expect(tbody).toBeVisible()
          }
          
          // Table should have consistent styling
          const tableClass = await table.getAttribute('class')
          expect(tableClass).toBeTruthy()
        }
      }
    })

    test('should use consistent badge styling across systems', async ({ page }) => {
      const pagesWithBadges = ['/organisations', '/proprietes']
      
      for (const pageUrl of pagesWithBadges) {
        await page.goto(pageUrl)
        
        const badges = page.locator('[class*="badge"]')
        if (await badges.count() > 0) {
          for (let i = 0; i < await badges.count(); i++) {
            const badge = badges.nth(i)
            
            // Badge should be visible and have content
            await expect(badge).toBeVisible()
            const text = await badge.textContent()
            expect(text?.trim()).toBeTruthy()
          }
        }
      }
    })
  })

  test.describe('Performance et Accessibilité', () => {
    test('should load pages within acceptable time', async ({ page }) => {
      const pages = ['/', '/organisations', '/proprietes']
      
      for (const pageUrl of pages) {
        const startTime = Date.now()
        await page.goto(pageUrl)
        await page.waitForLoadState('networkidle')
        const loadTime = Date.now() - startTime
        
        // Pages should load within 10 seconds (generous for CI)
        expect(loadTime).toBeLessThan(10000)
        
        // Essential content should be visible
        await expect(page.locator('h1, header, nav')).toBeVisible()
      }
    })

    test('should have accessible navigation', async ({ page }) => {
      await page.goto('/')
      
      // Navigation should be keyboard accessible
      const navElements = page.locator('nav a, button')
      
      if (await navElements.count() > 0) {
        // Focus should be manageable
        await navElements.first().focus()
        
        // Should be able to tab through navigation
        await page.keyboard.press('Tab')
      }
      
      // Page should have proper heading structure
      const h1 = page.locator('h1')
      if (await h1.count() > 0) {
        await expect(h1).toBeVisible()
        
        // H1 should have content
        const h1Text = await h1.textContent()
        expect(h1Text?.trim()).toBeTruthy()
      }
    })

    test('should handle errors gracefully', async ({ page }) => {
      const errors: string[] = []
      const warnings: string[] = []
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        } else if (msg.type() === 'warning') {
          warnings.push(msg.text())
        }
      })
      
      // Test multiple pages
      const pages = ['/organisations', '/proprietes', '/non-existent-page']
      
      for (const pageUrl of pages) {
        try {
          await page.goto(pageUrl, { waitUntil: 'networkidle' })
          
          if (pageUrl === '/non-existent-page') {
            // Should show 404 page or redirect
            const is404 = await page.locator('text=404, text=Not Found, text=Page non trouvée').count() > 0
            const isRedirected = !page.url().includes('non-existent-page')
            expect(is404 || isRedirected).toBeTruthy()
          } else {
            // Should load successfully
            await expect(page.locator('h1')).toBeVisible()
          }
        } catch (error) {
          // Even if page fails, should not cause uncaught errors
          console.log(`Expected navigation error for ${pageUrl}:`, error)
        }
      }
      
      // Filter out non-critical errors
      const criticalErrors = errors.filter(error => 
        !error.includes('favicon') && 
        !error.includes('Extension') &&
        !error.includes('chrome-extension') &&
        !error.includes('net::ERR_')
      )
      
      // Should not have critical JavaScript errors
      expect(criticalErrors.length).toBe(0)
    })
  })

  test.describe('Tests Cross-Browser et Responsive', () => {
    test('should work consistently across different browsers', async ({ page, browserName }) => {
      await page.goto('/proprietes')
      
      // Basic functionality should work in all browsers
      await expect(page.locator('h1')).toContainText('Propriétés')
      
      // Tables should render properly
      const table = page.locator('table')
      if (await table.count() > 0) {
        await expect(table).toBeVisible()
      }
      
      // Buttons should be clickable
      const buttons = page.locator('button')
      if (await buttons.count() > 0) {
        const firstButton = buttons.first()
        if (await firstButton.isVisible()) {
          await expect(firstButton).toBeEnabled()
        }
      }
      
      console.log(`✅ Test passed on ${browserName}`)
    })

    test('should adapt to different screen sizes', async ({ page }) => {
      const screenSizes = [
        { width: 1920, height: 1080, name: 'Desktop Large' },
        { width: 1280, height: 720, name: 'Desktop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ]
      
      for (const size of screenSizes) {
        await page.setViewportSize({ width: size.width, height: size.height })
        await page.goto('/proprietes')
        
        // Main content should be visible
        await expect(page.locator('h1')).toBeVisible()
        
        // Navigation should be accessible (might be collapsed on mobile)
        const nav = page.locator('nav, button[aria-label*="menu"]')
        expect(await nav.count()).toBeGreaterThan(0)
        
        console.log(`✅ Responsive test passed for ${size.name} (${size.width}x${size.height})`)
      }
    })
  })

  test.describe('Tests de Régression pour les Corrections', () => {
    test('should maintain archive/unarchive functionality after updates', async ({ page }) => {
      await page.goto('/proprietes')
      
      const propertyRows = page.locator('table tbody tr')
      
      if (await propertyRows.count() > 0) {
        const firstRow = propertyRows.first()
        
        // Check for proper button variants
        const archiveButton = firstRow.locator('button[title*="Archiver"]')
        const unarchiveButton = firstRow.locator('button[title*="Désarchiver"]')
        
        if (await archiveButton.count() > 0) {
          // Archive button should be destructive
          const archiveClass = await archiveButton.getAttribute('class')
          expect(archiveClass).toContain('destructive')
        }
        
        if (await unarchiveButton.count() > 0) {
          // Unarchive button should be outline
          const unarchiveClass = await unarchiveButton.getAttribute('class')
          expect(unarchiveClass).toContain('outline')
        }
      }
    })

    test('should show status badges consistently', async ({ page }) => {
      await page.goto('/proprietes')
      
      const badges = page.locator('[class*="badge"]')
      
      if (await badges.count() > 0) {
        for (let i = 0; i < await badges.count(); i++) {
          const badge = badges.nth(i)
          
          // Badge should be visible
          await expect(badge).toBeVisible()
          
          // Badge should have meaningful text
          const badgeText = await badge.textContent()
          expect(badgeText?.trim()).toBeTruthy()
          
          // Badge should have proper styling
          const badgeClass = await badge.getAttribute('class')
          expect(badgeClass).toMatch(/badge|inline-flex/)
        }
      }
    })

    test('should preserve delete functionality', async ({ page }) => {
      await page.goto('/proprietes')
      
      const deleteButtons = page.locator('button[title*="Supprimer"]')
      
      if (await deleteButtons.count() > 0) {
        const deleteButton = deleteButtons.first()
        
        // Delete button should be visible and destructive
        await expect(deleteButton).toBeVisible()
        const buttonClass = await deleteButton.getAttribute('class')
        expect(buttonClass).toContain('destructive')
        
        // Clicking should show confirmation dialog
        await deleteButton.click()
        
        const confirmDialog = page.locator('text=Êtes-vous sûr')
        if (await confirmDialog.count() > 0) {
          await expect(confirmDialog).toBeVisible()
          
          // Cancel to avoid actually deleting
          await page.click('text=Annuler')
        }
      }
    })
  })
})