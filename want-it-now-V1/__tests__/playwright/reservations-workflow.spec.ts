import { test, expect, Page } from '@playwright/test';
import { format, addDays } from 'date-fns';

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Helper functions
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[data-testid="email-input"]', 'admin@wantitnow.com');
  await page.fill('[data-testid="password-input"]', 'Test1234!');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/dashboard');
}

async function navigateToReservations(page: Page) {
  await page.goto(`${BASE_URL}/reservations`);
  await page.waitForSelector('[data-testid="reservations-page"]');
}

// Test Suite: Reservations System
test.describe('Reservations Channel Manager System', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // Test 1: Main reservations page shows property grid
  test('should display property grid with active contracts only', async ({ page }) => {
    await navigateToReservations(page);
    
    // Check page title and structure
    await expect(page.locator('h1')).toContainText('Gestion des Réservations');
    await expect(page.locator('text=Channel Manager')).toBeVisible();
    
    // Check stats cards are present
    await expect(page.locator('text=Propriétés Actives')).toBeVisible();
    await expect(page.locator('text=Réservations Actives')).toBeVisible();
    await expect(page.locator('text=Disponibles Aujourd\'hui')).toBeVisible();
    await expect(page.locator('text=Taux d\'Occupation')).toBeVisible();
    
    // Check search functionality
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await expect(searchInput).toBeVisible();
    
    // Check property cards are displayed (grid layout)
    const propertyCards = page.locator('[data-testid="property-card"]');
    const cardCount = await propertyCards.count();
    
    if (cardCount > 0) {
      // Verify first property card has required elements
      const firstCard = propertyCards.first();
      
      // Check for price badge
      await expect(firstCard.locator('text=/€\\/nuit/')).toBeVisible();
      
      // Check for status badge (Disponible or Occupé)
      const statusBadge = firstCard.locator('[data-testid="status-badge"]');
      await expect(statusBadge).toBeVisible();
      
      // Check for action buttons
      await expect(firstCard.locator('text=Calendrier')).toBeVisible();
      await expect(firstCard.locator('[data-testid="view-button"]')).toBeVisible();
      
      // Check commission info is displayed
      await expect(firstCard.locator('text=/\\d+% commission/')).toBeVisible();
    }
  });

  // Test 2: Search and filter functionality
  test('should filter properties by search term', async ({ page }) => {
    await navigateToReservations(page);
    
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    
    // Test search by property name
    await searchInput.fill('Villa');
    await page.waitForTimeout(500); // Debounce delay
    
    // Check filtered results
    const propertyCards = page.locator('[data-testid="property-card"]');
    const visibleCards = await propertyCards.count();
    
    // All visible cards should contain "Villa" in their text
    for (let i = 0; i < visibleCards; i++) {
      const cardText = await propertyCards.nth(i).textContent();
      expect(cardText?.toLowerCase()).toContain('villa');
    }
    
    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);
  });

  // Test 3: Navigate to property calendar
  test('should navigate to property-specific calendar', async ({ page }) => {
    await navigateToReservations(page);
    
    // Click on first property's calendar button
    const firstCalendarButton = page.locator('text=Calendrier').first();
    await firstCalendarButton.click();
    
    // Should navigate to calendar page
    await expect(page.url()).toContain('/reservations/');
    await expect(page.url()).toContain('/calendar');
    
    // Check calendar page elements
    await expect(page.locator('text=Calendrier - ')).toBeVisible();
    
    // Check month navigation
    await expect(page.locator('[data-testid="prev-month"]')).toBeVisible();
    await expect(page.locator('[data-testid="next-month"]')).toBeVisible();
    
    // Check calendar grid (7 columns for days of week)
    const dayHeaders = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    for (const day of dayHeaders) {
      await expect(page.locator(`text="${day}"`)).toBeVisible();
    }
    
    // Check legend
    await expect(page.locator('text=Disponible')).toBeVisible();
    await expect(page.locator('text=Réservé')).toBeVisible();
    await expect(page.locator('text=Bloqué')).toBeVisible();
    
    // Check action buttons (should appear when dates are selected)
    const firstDayCell = page.locator('[data-testid="calendar-day"]').first();
    await firstDayCell.click();
    
    // After selecting a date, action buttons should appear
    await expect(page.locator('text=jour(s) sélectionné(s)')).toBeVisible();
    await expect(page.locator('text=Modifier prix')).toBeVisible();
    await expect(page.locator('text=Bloquer')).toBeVisible();
    await expect(page.locator('text=Débloquer')).toBeVisible();
  });

  // Test 4: Dynamic pricing functionality
  test('should allow modifying prices for selected dates', async ({ page }) => {
    await navigateToReservations(page);
    
    // Navigate to calendar
    await page.locator('text=Calendrier').first().click();
    await page.waitForURL('**/calendar');
    
    // Select multiple dates by clicking
    const dayElements = page.locator('[data-testid="calendar-day"]');
    const dayCount = await dayElements.count();
    
    if (dayCount >= 3) {
      // Select 3 consecutive days
      await dayElements.nth(10).click();
      await dayElements.nth(11).click({ modifiers: ['Shift'] });
      await dayElements.nth(12).click({ modifiers: ['Shift'] });
      
      // Should show 3 days selected
      await expect(page.locator('text=3 jour(s) sélectionné(s)')).toBeVisible();
      
      // Click modify price button
      await page.click('text=Modifier prix');
      
      // Pricing modal should open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('text=Modifier les prix')).toBeVisible();
      
      // Fill in new price
      await page.fill('input[id="prix_nuit"]', '200');
      
      // Optional: Set weekend price
      await page.fill('input[id="prix_weekend"]', '250');
      
      // Set minimum stay
      await page.fill('input[id="sejour_minimum"]', '2');
      
      // Name the period
      await page.fill('input[id="nom_periode"]', 'Haute saison test');
      
      // Save changes
      await page.click('button:has-text("Enregistrer")');
      
      // Modal should close and success message appear
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
      await expect(page.locator('text=Prix mis à jour avec succès')).toBeVisible();
    }
  });

  // Test 5: Block and unblock dates
  test('should allow blocking and unblocking dates', async ({ page }) => {
    await navigateToReservations(page);
    
    // Navigate to calendar
    await page.locator('text=Calendrier').first().click();
    await page.waitForURL('**/calendar');
    
    // Select dates to block
    const dayElements = page.locator('[data-testid="calendar-day"]');
    await dayElements.nth(15).click();
    await dayElements.nth(16).click({ modifiers: ['Shift'] });
    
    // Click block button
    await page.click('text=Bloquer');
    
    // Block modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Bloquer les dates')).toBeVisible();
    
    // Select block type
    await page.click('[data-testid="block-type-select"]');
    await page.click('text=Maintenance');
    
    // Add reason
    await page.fill('input[id="raison"]', 'Travaux de rénovation');
    
    // Confirm blocking
    await page.click('button:has-text("Bloquer")');
    
    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // Success message
    await expect(page.locator('text=Dates bloquées avec succès')).toBeVisible();
    
    // Now test unblocking
    // Select the same dates again
    await dayElements.nth(15).click();
    await dayElements.nth(16).click({ modifiers: ['Shift'] });
    
    // Click unblock button
    await page.click('text=Débloquer');
    
    // Should show success message
    await expect(page.locator('text=Dates débloquées avec succès')).toBeVisible();
  });

  // Test 6: Create new reservation
  test('should create new reservation with automatic contract detection', async ({ page }) => {
    await navigateToReservations(page);
    
    // Click new reservation button
    await page.click('text=Nouvelle Réservation');
    await page.waitForURL('**/reservations/new');
    
    // Check that contract field is NOT present (contracts are auto-detected)
    await expect(page.locator('text=Contrat *')).not.toBeVisible();
    
    // Check info message about automatic contract detection
    await expect(page.locator('text=Propriétés avec contrats actifs')).toBeVisible();
    await expect(page.locator('text=/contrat.*automatiquement/i')).toBeVisible();
    
    // Step 1: Select property
    await page.click('[data-testid="property-select"]');
    await page.click('text=Villa Nice');
    
    // Set dates
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const dayAfter = format(addDays(new Date(), 3), 'yyyy-MM-dd');
    
    await page.fill('input[type="date"][id="date_arrivee"]', tomorrow);
    await page.fill('input[type="date"][id="date_depart"]', dayAfter);
    
    // Should show availability status
    await expect(page.locator('text=/Vérification|Disponible|Non disponible/')).toBeVisible();
    
    // Wait for availability check
    await page.waitForTimeout(1000);
    
    // Click next if available
    const nextButton = page.locator('button:has-text("Suivant")');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      
      // Step 2: Guest information
      await page.fill('input[id="voyageur_nom"]', 'Jean Dupont');
      await page.fill('input[id="voyageur_telephone"]', '+33612345678');
      await page.fill('input[id="voyageur_email"]', 'jean.dupont@test.com');
      
      // Number of guests
      await page.fill('input[id="nombre_adultes"]', '2');
      await page.fill('input[id="nombre_enfants"]', '1');
      
      // Click next
      await page.click('button:has-text("Suivant")');
      
      // Step 3: Pricing
      // Price should be pre-filled from property default
      const priceInput = page.locator('input[id="prix_nuit"]');
      const priceValue = await priceInput.inputValue();
      expect(Number(priceValue)).toBeGreaterThan(0);
      
      // Add cleaning fee
      await page.fill('input[id="frais_menage"]', '50');
      
      // Check total calculation
      await expect(page.locator('text=Total')).toBeVisible();
      
      // Add internal notes
      await page.fill('textarea[id="notes_internes"]', 'Réservation test Playwright');
      
      // Submit reservation
      await page.click('button:has-text("Créer la réservation")');
      
      // Should redirect to reservations list
      await page.waitForURL('**/reservations/**');
      
      // Success message or reservation in list
      await expect(page.locator('text=/Réservation créée|Jean Dupont/')).toBeVisible();
    }
  });

  // Test 7: View property reservations list
  test('should display property-specific reservations list', async ({ page }) => {
    await navigateToReservations(page);
    
    // Click view button on first property
    const viewButton = page.locator('[data-testid="view-button"]').first();
    await viewButton.click();
    
    // Should navigate to property reservations list
    await expect(page.url()).toContain('/list');
    
    // Check page elements
    await expect(page.locator('text=Réservations - Propriété')).toBeVisible();
    
    // Stats cards
    await expect(page.locator('text=Total réservations')).toBeVisible();
    await expect(page.locator('text=Confirmées')).toBeVisible();
    await expect(page.locator('text=En cours')).toBeVisible();
    await expect(page.locator('text=Revenus totaux')).toBeVisible();
    
    // Search and filters
    await expect(page.locator('input[placeholder*="Rechercher"]')).toBeVisible();
    await expect(page.locator('select:has-text("Tous les statuts")')).toBeVisible();
    
    // Export button
    await expect(page.locator('text=Export CSV')).toBeVisible();
    
    // Table headers if reservations exist
    const tableHeaders = ['Code', 'Voyageur', 'Dates', 'Source', 'Statut', 'Montant'];
    for (const header of tableHeaders) {
      const headerElement = page.locator(`th:has-text("${header}")`);
      if (await headerElement.isVisible()) {
        await expect(headerElement).toBeVisible();
      }
    }
  });

  // Test 8: Drag selection in calendar
  test('should support drag selection for date ranges', async ({ page }) => {
    await navigateToReservations(page);
    
    // Navigate to calendar
    await page.locator('text=Calendrier').first().click();
    await page.waitForURL('**/calendar');
    
    // Get calendar day elements
    const dayElements = page.locator('[data-testid="calendar-day"]');
    const dayCount = await dayElements.count();
    
    if (dayCount >= 5) {
      // Perform drag selection
      const startDay = dayElements.nth(10);
      const endDay = dayElements.nth(14);
      
      // Start drag from first day
      await startDay.hover();
      await page.mouse.down();
      
      // Drag to last day
      await endDay.hover();
      await page.mouse.up();
      
      // Should show 5 days selected
      await expect(page.locator('text=/5 jour\\(s\\) sélectionné/')).toBeVisible();
      
      // Action buttons should be visible
      await expect(page.locator('text=Modifier prix')).toBeVisible();
      await expect(page.locator('text=Bloquer')).toBeVisible();
    }
  });

  // Test 9: Calendar month navigation
  test('should navigate between months in calendar', async ({ page }) => {
    await navigateToReservations(page);
    
    // Navigate to calendar
    await page.locator('text=Calendrier').first().click();
    await page.waitForURL('**/calendar');
    
    // Get current month text
    const currentMonthElement = page.locator('h2:has-text(/[A-Za-zÀ-ÿ]+ \\d{4}/)');
    const currentMonth = await currentMonthElement.textContent();
    
    // Navigate to next month
    await page.click('[data-testid="next-month"]');
    await page.waitForTimeout(500);
    
    // Month should change
    const newMonth = await currentMonthElement.textContent();
    expect(newMonth).not.toBe(currentMonth);
    
    // Navigate to previous month
    await page.click('[data-testid="prev-month"]');
    await page.click('[data-testid="prev-month"]');
    await page.waitForTimeout(500);
    
    // Should be in a different month
    const previousMonth = await currentMonthElement.textContent();
    expect(previousMonth).not.toBe(currentMonth);
  });

  // Test 10: Commission calculation in new reservation
  test('should calculate commission based on contract percentage', async ({ page }) => {
    await navigateToReservations(page);
    
    // Create new reservation
    await page.click('text=Nouvelle Réservation');
    await page.waitForURL('**/reservations/new');
    
    // Select property with known commission
    await page.click('[data-testid="property-select"]');
    await page.click('text=/Contrat Variable \\d+%/');
    
    // Set dates
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const dayAfter = format(addDays(new Date(), 2), 'yyyy-MM-dd');
    
    await page.fill('input[type="date"][id="date_arrivee"]', tomorrow);
    await page.fill('input[type="date"][id="date_depart"]', dayAfter);
    
    // Go to pricing step
    await page.click('button:has-text("Suivant")');
    await page.fill('input[id="voyageur_nom"]', 'Test User');
    await page.fill('input[id="voyageur_telephone"]', '+33600000000');
    await page.click('button:has-text("Suivant")');
    
    // Check commission calculation
    await page.fill('input[id="prix_nuit"]', '100');
    
    // Should show total and commission
    await expect(page.locator('text=Total')).toBeVisible();
    await expect(page.locator('text=/Commission.*%/')).toBeVisible();
    
    // Verify commission is calculated (should be visible in summary)
    const commissionText = await page.locator('text=/Commission.*€/').textContent();
    expect(commissionText).toContain('€');
  });
});

// Test Suite: Business Rules Validation
test.describe('Business Rules - Reservations Constraints', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // Test Property XOR Unit constraint
  test('should enforce property XOR unit exclusivity', async ({ page }) => {
    await page.goto(`${BASE_URL}/reservations/new`);
    
    // Try to select a property
    await page.click('[data-testid="property-select"]');
    const propertyOption = page.locator('text=/^(?!.*Studio).*Villa.*/').first();
    
    if (await propertyOption.isVisible()) {
      await propertyOption.click();
      
      // Verify that propriete_id is set and unite_id is empty
      const propertyValue = await page.locator('[data-testid="property-select"]').inputValue();
      expect(propertyValue).toContain('prop-');
    }
    
    // Now select a unit
    await page.click('[data-testid="property-select"]');
    const unitOption = page.locator('text=/Studio/').first();
    
    if (await unitOption.isVisible()) {
      await unitOption.click();
      
      // Verify that unite_id is set and propriete_id is cleared
      const unitValue = await page.locator('[data-testid="property-select"]').inputValue();
      expect(unitValue).toContain('unit-');
    }
  });

  // Test that only properties with active contracts are shown
  test('should only display properties with active contracts', async ({ page }) => {
    await navigateToReservations(page);
    
    // All displayed properties should have contract info
    const propertyCards = page.locator('[data-testid="property-card"]');
    const cardCount = await propertyCards.count();
    
    for (let i = 0; i < cardCount; i++) {
      const card = propertyCards.nth(i);
      
      // Each card should display commission percentage (indicates active contract)
      await expect(card.locator('text=/\\d+% commission/')).toBeVisible();
      
      // Contract type should be visible
      const contractInfo = await card.locator('text=/Contrat (fixe|variable)/i').textContent();
      expect(contractInfo).toBeTruthy();
    }
  });
});

// Test Suite: Performance and Accessibility
test.describe('Performance and Accessibility', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('calendar should handle large date ranges efficiently', async ({ page }) => {
    await navigateToReservations(page);
    await page.locator('text=Calendrier').first().click();
    
    // Measure time to navigate months
    const startTime = Date.now();
    
    // Navigate through 6 months
    for (let i = 0; i < 6; i++) {
      await page.click('[data-testid="next-month"]');
      await page.waitForTimeout(100);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Should complete in reasonable time (< 3 seconds for 6 months)
    expect(totalTime).toBeLessThan(3000);
  });

  test('should have proper keyboard navigation in calendar', async ({ page }) => {
    await navigateToReservations(page);
    await page.locator('text=Calendrier').first().click();
    
    // Focus on first calendar day
    const firstDay = page.locator('[data-testid="calendar-day"]').first();
    await firstDay.focus();
    
    // Navigate with keyboard
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space'); // Select
    
    // Should show selection
    await expect(page.locator('text=/1 jour\\(s\\) sélectionné/')).toBeVisible();
    
    // Tab navigation to buttons
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should focus on action buttons
    const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
    expect(focusedElement).toBeTruthy();
  });

  test('should have proper ARIA labels for accessibility', async ({ page }) => {
    await navigateToReservations(page);
    
    // Check main navigation has proper ARIA
    const navElement = page.locator('nav');
    await expect(navElement).toHaveAttribute('aria-label', /.+/);
    
    // Check form inputs have labels
    await page.click('text=Nouvelle Réservation');
    
    const inputs = page.locator('input[required]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      
      if (id) {
        // Should have corresponding label
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      }
    }
  });
});