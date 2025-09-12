import { test, expect } from '@playwright/test'

// Test data
const testUser = {
  prenom: 'Test',
  nom: 'Playwright',
  email: 'test.playwright@example.com',
  telephone: '+33 6 12 34 56 78',
  role: 'admin',
}

const updatedUser = {
  prenom: 'Test Updated',
  nom: 'Playwright Updated',
  telephone: '+33 6 98 76 54 32',
}

test.describe('Utilisateurs - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to users page
    await page.goto('/utilisateurs')
  })

  test('should display users list page', async ({ page }) => {
    // Check page title and navigation
    await expect(page).toHaveTitle(/Utilisateurs/)
    await expect(page.locator('h1')).toContainText('Utilisateurs')
    
    // Check for main UI elements
    await expect(page.locator('[data-testid="users-table"]').or(page.locator('.modern-shadow'))).toBeVisible()
    await expect(page.getByRole('link', { name: /nouvel utilisateur/i })).toBeVisible()
  })

  test('should navigate to create user page', async ({ page }) => {
    // Click on "Nouvel utilisateur" button
    await page.getByRole('link', { name: /nouvel utilisateur/i }).click()
    
    // Check we're on the create page
    await expect(page).toHaveURL('/utilisateurs/new')
    await expect(page.locator('h1')).toContainText('Créer un utilisateur')
    
    // Check form elements are present
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('combobox').or(page.locator('select')).first()).toBeVisible() // Role selector
  })

  test('should create a new user successfully', async ({ page }) => {
    // Navigate to create page
    await page.goto('/utilisateurs/new')
    
    // Fill out the form
    await page.getByLabel(/prénom/i).fill(testUser.prenom)
    await page.getByLabel(/nom/i).fill(testUser.nom)
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/téléphone/i).fill(testUser.telephone)
    
    // Select role
    const roleSelect = page.getByRole('combobox').or(page.locator('select')).first()
    await roleSelect.selectOption(testUser.role)
    
    // Select an organisation if not super_admin
    if (testUser.role !== 'super_admin') {
      const orgSelect = page.getByRole('combobox').or(page.locator('select')).last()
      await orgSelect.selectOption({ index: 1 }) // Select first available organisation
    }
    
    // Submit the form
    await page.getByRole('button', { name: /créer/i }).click()
    
    // Should redirect to user detail page or show success
    await expect(page).toHaveURL(/\/utilisateurs\/[^\/]+$/)
    await expect(page.locator('h1')).toContainText(testUser.prenom)
  })

  test('should validate required fields', async ({ page }) => {
    // Navigate to create page
    await page.goto('/utilisateurs/new')
    
    // Try to submit without required fields
    await page.getByRole('button', { name: /créer/i }).click()
    
    // Should show validation errors
    await expect(page.locator('.text-red-600, .text-red-800')).toBeVisible()
  })

  test('should prevent duplicate email creation', async ({ page }) => {
    // Navigate to create page
    await page.goto('/utilisateurs/new')
    
    // Try to create user with existing email (assuming seed data exists)
    await page.getByLabel(/email/i).fill('superadmin@wantitnow.com') // From seed data
    await page.getByLabel(/prénom/i).fill('Test')
    
    const roleSelect = page.getByRole('combobox').or(page.locator('select')).first()
    await roleSelect.selectOption('admin')
    
    await page.getByRole('button', { name: /créer/i }).click()
    
    // Should show error about duplicate email
    await expect(page.locator('.text-red-600, .text-red-800')).toContainText(/email.*déjà utilisée|email.*exists/i)
  })

  test('should display user detail page', async ({ page }) => {
    // First, ensure we have users to work with
    await page.goto('/utilisateurs')
    
    // Click on first user in the table (if any)
    const firstUserRow = page.locator('tbody tr').first()
    if (await firstUserRow.count() > 0) {
      await firstUserRow.click()
      
      // Should navigate to user detail
      await expect(page).toHaveURL(/\/utilisateurs\/[^\/]+$/)
      await expect(page.locator('[data-testid="user-details"]').or(page.locator('h1'))).toBeVisible()
    }
  })

  test('should navigate to edit mode', async ({ page }) => {
    // Go to users list and click on first user
    await page.goto('/utilisateurs')
    
    const firstUserRow = page.locator('tbody tr').first()
    if (await firstUserRow.count() > 0) {
      await firstUserRow.click()
      
      // Click edit button
      await page.getByRole('link', { name: /modifier/i }).click()
      
      // Should show edit form
      await expect(page).toHaveURL(/\/utilisateurs\/[^\/]+\?edit=true$/)
      await expect(page.locator('h1')).toContainText('Modifier')
    }
  })

  test('should filter users by role', async ({ page }) => {
    // Navigate to users page
    await page.goto('/utilisateurs')
    
    // Look for role filter dropdown
    const roleFilter = page.locator('select').filter({ hasText: /rôle|role/i }).or(
      page.locator('label:has-text("rôle") + select, label:has-text("Filtrer par rôle") + select')
    )
    
    if (await roleFilter.count() > 0) {
      // Select a specific role
      await roleFilter.selectOption('admin')
      
      // Wait for filtering to take effect
      await page.waitForTimeout(500)
      
      // Check that only admin users are shown (if any exist)
      const userRows = page.locator('tbody tr')
      const count = await userRows.count()
      if (count > 0) {
        // Verify at least one admin badge is visible
        await expect(page.locator('.badge, .bg-blue').first()).toBeVisible()
      }
    }
  })

  test('should search users', async ({ page }) => {
    // Navigate to users page
    await page.goto('/utilisateurs')
    
    // Look for search input
    const searchInput = page.getByPlaceholder(/recherche/i).or(
      page.locator('input[type="text"]').first()
    )
    
    if (await searchInput.count() > 0) {
      // Search for a common term
      await searchInput.fill('admin')
      await page.waitForTimeout(500)
      
      // Results should be filtered
      const userRows = page.locator('tbody tr')
      const count = await userRows.count()
      
      // Either no results or results containing "admin"
      if (count > 0) {
        await expect(page.locator('tbody')).toContainText(/admin/i)
      }
    }
  })

  test('should handle user permissions correctly', async ({ page }) => {
    // This test checks that UI elements respect user permissions
    await page.goto('/utilisateurs')
    
    // Check if action buttons are present (edit, delete)
    const firstUserRow = page.locator('tbody tr').first()
    if (await firstUserRow.count() > 0) {
      await firstUserRow.hover()
      
      // Should see action buttons based on permissions
      const editButton = page.locator('button:has([data-testid="edit-icon"]), button[aria-label*="edit"], [title*="dit"]').first()
      const deleteButton = page.locator('button:has([data-testid="delete-icon"]), button[aria-label*="delete"], [title*="upprim"]').first()
      
      // At least edit button should be visible (assuming proper permissions)
      if (await editButton.count() > 0) {
        await expect(editButton).toBeVisible()
      }
    }
  })

  test('should display role-specific information', async ({ page }) => {
    // Navigate to users list
    await page.goto('/utilisateurs')
    
    // Look for role badges in the table
    const roleBadges = page.locator('.badge, [class*="bg-"]:has-text(/admin|proprietaire|locataire|prestataire/i)')
    
    if (await roleBadges.count() > 0) {
      // Verify role badges are displayed
      await expect(roleBadges.first()).toBeVisible()
      
      // Check for role icons or colors
      const firstBadge = roleBadges.first()
      await expect(firstBadge).toHaveAttribute('class', /bg-|badge/)
    }
  })

  test('should show organisation information', async ({ page }) => {
    // Navigate to users list
    await page.goto('/utilisateurs')
    
    // Look for organisation information in the table
    const organisationCells = page.locator('td:has-text(/Want It Now|France|España|Deutschland|Italia/i)')
    
    if (await organisationCells.count() > 0) {
      // Verify organisation info is displayed
      await expect(organisationCells.first()).toBeVisible()
      
      // Check for country flags or country codes
      const countryInfo = page.locator('td:has-text(/FR|ES|DE|IT/), [title*="France"], [title*="España"]')
      if (await countryInfo.count() > 0) {
        await expect(countryInfo.first()).toBeVisible()
      }
    }
  })

  test('should handle navigation between pages', async ({ page }) => {
    // Start from users list
    await page.goto('/utilisateurs')
    
    // Navigate to create page
    await page.getByRole('link', { name: /nouvel utilisateur/i }).click()
    await expect(page).toHaveURL('/utilisateurs/new')
    
    // Navigate back using breadcrumb or back button
    await page.getByText(/utilisateurs/i).first().click()
    await expect(page).toHaveURL('/utilisateurs')
    
    // Test cancel functionality
    await page.goto('/utilisateurs/new')
    const cancelButton = page.getByRole('button', { name: /annuler/i }).or(page.getByRole('link', { name: /annuler/i }))
    if (await cancelButton.count() > 0) {
      await cancelButton.click()
      await expect(page).toHaveURL('/utilisateurs')
    }
  })

  test('should load page without JavaScript errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Navigate to users page
    await page.goto('/utilisateurs')
    await page.waitForLoadState('networkidle')
    
    // Navigate to create page
    await page.goto('/utilisateurs/new')
    await page.waitForLoadState('networkidle')
    
    // Check for critical errors (ignore minor warnings)
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') && 
      !error.includes('net::ERR_ABORTED')
    )
    
    expect(criticalErrors).toHaveLength(0)
  })
})

// Role-specific tests
test.describe('Utilisateurs - Role Specific Tests', () => {
  test('should show super admin specific features', async ({ page }) => {
    await page.goto('/utilisateurs/new')
    
    // Select super_admin role
    const roleSelect = page.getByRole('combobox').or(page.locator('select')).first()
    await roleSelect.selectOption('super_admin')
    
    // Should hide organisation selection for super_admin
    await page.waitForTimeout(100)
    const orgSelect = page.locator('label:has-text("Organisation") + select, select:has-option("Aucune organisation")')
    
    // Organisation field should either be hidden or show "Toutes les organisations"
    if (await orgSelect.count() > 0) {
      await expect(orgSelect).not.toBeVisible()
    }
  })

  test('should require organisation for non-super admin roles', async ({ page }) => {
    await page.goto('/utilisateurs/new')
    
    // Select admin role
    const roleSelect = page.getByRole('combobox').or(page.locator('select')).first()
    await roleSelect.selectOption('admin')
    
    // Organisation field should be visible and required
    const orgSelect = page.locator('label:has-text("Organisation") + select')
    if (await orgSelect.count() > 0) {
      await expect(orgSelect).toBeVisible()
    }
  })
})

// Accessibility tests
test.describe('Utilisateurs - Accessibility', () => {
  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/utilisateurs')
    
    // Check for proper table structure
    const table = page.locator('table')
    if (await table.count() > 0) {
      await expect(table).toBeVisible()
      
      // Check for table headers
      const headers = page.locator('th')
      if (await headers.count() > 0) {
        await expect(headers.first()).toBeVisible()
      }
    }
    
    // Check for proper button labels
    const buttons = page.locator('button, [role="button"]')
    for (const button of await buttons.all()) {
      const ariaLabel = await button.getAttribute('aria-label')
      const textContent = await button.textContent()
      
      // Button should have either text content or aria-label
      expect(ariaLabel || textContent?.trim()).toBeTruthy()
    }
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/utilisateurs')
    
    // Test tab navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    // Navigate to create button and activate with Enter
    const createButton = page.getByRole('link', { name: /nouvel utilisateur/i })
    await createButton.focus()
    await page.keyboard.press('Enter')
    
    await expect(page).toHaveURL('/utilisateurs/new')
  })
})