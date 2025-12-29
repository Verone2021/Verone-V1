#!/usr/bin/env node
/**
 * Finance v2 Screenshots - Playwright Script
 *
 * Captures 3 screenshots for Finance v2 Phase A validation:
 * 1. Table + KPIs
 * 2. Side panel open
 * 3. Classification modal open
 *
 * Usage: node scripts/finance-v2-screenshots.mjs
 *
 * Prerequisites:
 * - Dev server running: npm run dev --filter=back-office
 * - Playwright installed: npx playwright install chromium
 */

import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const SCREENSHOTS_DIR = resolve(PROJECT_ROOT, '.playwright-mcp');
const BASE_URL = 'http://localhost:3000';
const PAGE_URL = `${BASE_URL}/finance/transactions?v2=true`;

// Ensure screenshots directory exists
if (!existsSync(SCREENSHOTS_DIR)) {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function main() {
  console.log('🎬 Finance v2 Screenshots Script');
  console.log('================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    // Reuse auth state if available
    storageState: existsSync(resolve(PROJECT_ROOT, '.playwright-auth.json'))
      ? resolve(PROJECT_ROOT, '.playwright-auth.json')
      : undefined,
  });

  const page = await context.newPage();

  try {
    // Navigate to page
    console.log(`📍 Navigating to ${PAGE_URL}...`);
    await page.goto(PAGE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Check if we're on login page
    const url = page.url();
    if (url.includes('/login') || url.includes('/auth')) {
      throw new Error(
        'AUTHENTICATION REQUIRED: Page redirected to login. ' +
        'Please run the app in browser first to authenticate, ' +
        'then export auth state to .playwright-auth.json'
      );
    }

    // Wait for page to be ready
    console.log('⏳ Waiting for page to load...');
    await page.waitForLoadState('networkidle');

    // Check for the v2 beta banner or transactions content
    const hasV2Content = await page.locator('[data-testid="tx-side-panel"], .beta-banner, [data-testid^="tx-row-"]').first().isVisible({ timeout: 10000 }).catch(() => false);

    if (!hasV2Content) {
      // Try waiting a bit more
      await page.waitForTimeout(3000);
    }

    // ============================================
    // Screenshot 1: Table + KPIs
    // ============================================
    console.log('📸 Taking screenshot 1: Table + KPIs...');
    const screenshot1Path = resolve(SCREENSHOTS_DIR, 'finance-v2-1-table-kpis.png');
    await page.screenshot({ path: screenshot1Path, fullPage: false });
    console.log(`   ✅ Saved: ${screenshot1Path}`);

    // ============================================
    // Screenshot 2: Side Panel Open
    // ============================================
    console.log('📸 Taking screenshot 2: Side panel...');

    // Find and click the first transaction row
    const txRow = page.locator('[data-testid^="tx-row-"]').first();
    const txRowExists = await txRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (!txRowExists) {
      throw new Error(
        'NO TRANSACTION ROWS FOUND: Could not find any elements with data-testid="tx-row-*". ' +
        'Check if transactions are loading correctly.'
      );
    }

    await txRow.click();

    // Wait for side panel to appear
    const sidePanel = page.locator('[data-testid="tx-side-panel"]');
    await sidePanel.waitFor({ state: 'visible', timeout: 5000 });

    await page.waitForTimeout(500); // Brief pause for animations

    const screenshot2Path = resolve(SCREENSHOTS_DIR, 'finance-v2-2-side-panel.png');
    await page.screenshot({ path: screenshot2Path, fullPage: false });
    console.log(`   ✅ Saved: ${screenshot2Path}`);

    // ============================================
    // Screenshot 3: Classification Modal Open
    // ============================================
    console.log('📸 Taking screenshot 3: Classification modal...');

    // Click the "Classer PCG" button
    const classifyBtn = page.locator('[data-testid="btn-classify-pcg"]');
    const classifyBtnExists = await classifyBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!classifyBtnExists) {
      throw new Error(
        'CLASSIFY BUTTON NOT FOUND: Could not find [data-testid="btn-classify-pcg"]. ' +
        'Check if the side panel opened correctly.'
      );
    }

    await classifyBtn.click();

    // Wait for modal to appear
    const modal = page.locator('[data-testid="modal-classify-pcg"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    await page.waitForTimeout(500); // Brief pause for animations

    const screenshot3Path = resolve(SCREENSHOTS_DIR, 'finance-v2-3-modal-classify.png');
    await page.screenshot({ path: screenshot3Path, fullPage: false });
    console.log(`   ✅ Saved: ${screenshot3Path}`);

    // ============================================
    // Summary
    // ============================================
    console.log('\n================================');
    console.log('✅ ALL 3 SCREENSHOTS CAPTURED SUCCESSFULLY');
    console.log('================================\n');
    console.log('Files:');
    console.log(`  1. ${screenshot1Path}`);
    console.log(`  2. ${screenshot2Path}`);
    console.log(`  3. ${screenshot3Path}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    // Take a debug screenshot
    const debugPath = resolve(SCREENSHOTS_DIR, 'finance-v2-DEBUG-error.png');
    await page.screenshot({ path: debugPath, fullPage: true });
    console.error(`   Debug screenshot saved: ${debugPath}`);

    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
