import { test, expect } from '@playwright/test'

test('application loads successfully', async ({ page }) => {
  await page.goto('/')
  
  // Check that the page loads without errors
  await expect(page).toHaveTitle(/Want It Now/i)
  
  // Check that basic content is present
  await expect(page.locator('body')).toBeVisible()
})

test('design system components work', async ({ page }) => {
  await page.goto('/')
  
  // Test basic UI components if they exist on the homepage
  // This will be expanded as we add more pages
  
  // Check that the page doesn't have JavaScript errors
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  
  await page.waitForTimeout(2000)
  expect(errors.length).toBe(0)
})