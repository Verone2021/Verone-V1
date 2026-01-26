import { test, expect, CREDENTIALS, generateTestProductName, generateTestCustomerName } from '../../fixtures';

/**
 * E2E Tests: Data Consistency (Back-Office ↔ LinkMe)
 * Validates that data is consistent across both applications (SSOT)
 */

test.describe('Data Consistency: BO ↔ LinkMe', () => {
  test.afterAll(async ({ db }) => {
    // Cleanup test data after all tests
    await db.cleanupTestData();
  });

  test('1.1: BO product visible in LinkMe catalog', async ({ page, loginBackOffice, loginLinkMe, db }) => {
    // Step 1: Login to Back-Office and create product
    await loginBackOffice();

    // Navigate to products page
    await page.goto('http://localhost:3000/produits');
    await page.waitForLoadState('networkidle');

    // Click "Nouveau produit" button
    await page.click('text=Nouveau produit');
    await page.waitForURL('**/produits/nouveau');

    // Fill product form
    const productName = generateTestProductName('BO Product');
    await page.fill('[data-testid="product-name"]', productName);
    await page.fill(
      '[data-testid="product-description"]',
      'Product created from Back-Office'
    );
    await page.fill('[data-testid="product-prix-ht"]', '150');

    // Select enseigne (Pokawa)
    await page.selectOption('[data-testid="product-enseigne"]', {
      label: 'Pokawa',
    });

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for product to be created
    await page.waitForURL(/\/produits\/[a-f0-9-]+$/);

    // Get product ID from URL
    const productUrl = page.url();
    const productId = productUrl.split('/').pop()!;

    // Step 2: Verify product exists in database
    const product = await db.getProductById(productId);
    expect(product.name).toBe(productName);
    expect(product.prix_ht).toBe(150);

    // Step 3: Login to LinkMe as Pokawa
    await loginLinkMe(CREDENTIALS.pokawa.email, CREDENTIALS.pokawa.password);

    // Navigate to catalogue
    await page.goto('http://localhost:3002/catalogue');
    await page.waitForLoadState('networkidle');

    // Step 4: Verify product is visible in catalogue
    const productCard = page.locator(`text=${productName}`);
    await expect(productCard).toBeVisible({ timeout: 10000 });

    // Verify price is displayed
    await expect(page.locator('text=150')).toBeVisible();
  });

  test('1.2: Commission calculation matches BO and LinkMe', async ({
    page,
    loginLinkMe,
    loginBackOffice,
    db,
  }) => {
    // Step 1: Create test product with known commission rate
    const channelId = await db.getLinkmeeChannelId();

    // Get Pokawa affiliate ID
    const pokawa = await db.getAffiliateByEnseigneId(
      '550e8400-e29b-41d4-a716-446655440000' // Pokawa enseigne ID
    );

    const productId = await db.createTestProduct({
      name: generateTestProductName('Commission Test'),
      description: 'Product for commission calculation test',
      affiliate_payout_ht: 100,
      store_at_verone: false,
      enseigne_id: '550e8400-e29b-41d4-a716-446655440000',
      affiliate_commission_rate: 15, // 15% commission
    });

    // Step 2: Login to LinkMe and create order
    await loginLinkMe(CREDENTIALS.pokawa.email, CREDENTIALS.pokawa.password);

    // Navigate to catalogue
    await page.goto('http://localhost:3002/catalogue');
    await page.waitForLoadState('networkidle');

    // Add product to cart
    const productCard = page.locator(`text=Commission Test`).first();
    await productCard.click();

    // Wait for product detail page
    await page.waitForURL(/\/catalogue\/[a-f0-9-]+$/);

    // Click "Ajouter au panier"
    await page.click('button:has-text("Ajouter au panier")');

    // Navigate to cart
    await page.goto('http://localhost:3002/panier');

    // Proceed to checkout
    await page.click('button:has-text("Commander")');

    // Fill customer info
    await page.fill('[data-testid="customer-name"]', generateTestCustomerName());
    await page.fill('[data-testid="customer-email"]', 'test@verone-e2e.fr');

    // Submit order
    await page.click('button[type="submit"]');

    // Wait for order confirmation
    await page.waitForURL('**/commandes/confirmation');

    // Get order ID from URL
    const orderUrl = page.url();
    const orderId = orderUrl.split('=').pop()!;

    // Step 3: Wait for commission to be calculated (trigger execution)
    await db.waitForCondition(
      async () => {
        try {
          const commission = await db.getCommissionByOrderId(orderId);
          return commission.status === 'validated';
        } catch {
          return false;
        }
      },
      15000,
      1000
    );

    // Step 4: Get commission from database
    const commission = await db.getCommissionByOrderId(orderId);
    const expectedCommission = 100 * 0.15; // affiliate_payout_ht * commission_rate

    expect(commission.affiliate_commission).toBe(expectedCommission);

    // Step 5: Login to Back-Office and verify commission
    await loginBackOffice();

    // Navigate to commissions page
    await page.goto('http://localhost:3000/finance/commissions-affilies');
    await page.waitForLoadState('networkidle');

    // Find commission row
    const commissionRow = page.locator(`text=${orderId}`).first();
    await expect(commissionRow).toBeVisible({ timeout: 10000 });

    // Verify commission amount is displayed
    await expect(page.locator(`text=${expectedCommission}`)).toBeVisible();
  });

  test('1.3: LinkMe order visible in BO with correct channel', async ({
    page,
    loginLinkMe,
    loginBackOffice,
    db,
  }) => {
    // Step 1: Get LinkMe channel ID
    const linkmeeChannelId = await db.getLinkmeeChannelId();

    // Step 2: Login to LinkMe and create order
    await loginLinkMe(CREDENTIALS.pokawa.email, CREDENTIALS.pokawa.password);

    // Navigate to catalogue
    await page.goto('http://localhost:3002/catalogue');
    await page.waitForLoadState('networkidle');

    // Click first product
    await page.locator('button:has-text("Ajouter au panier")').first().click();

    // Navigate to cart
    await page.goto('http://localhost:3002/panier');

    // Proceed to checkout
    await page.click('button:has-text("Commander")');

    // Fill customer info
    const customerName = generateTestCustomerName();
    await page.fill('[data-testid="customer-name"]', customerName);
    await page.fill('[data-testid="customer-email"]', 'test-linkme@verone-e2e.fr');

    // Submit order
    await page.click('button[type="submit"]');

    // Wait for order confirmation
    await page.waitForURL('**/commandes/confirmation');

    // Get order ID from URL
    const orderUrl = page.url();
    const orderId = orderUrl.split('=').pop()!;

    // Step 3: Verify order in database
    const order = await db.getOrderById(orderId);
    expect(order.channel_id).toBe(linkmeeChannelId);
    expect(order.customer_name).toBe(customerName);

    // Step 4: Login to Back-Office and verify order
    await loginBackOffice();

    // Navigate to orders page
    await page.goto('http://localhost:3000/commandes');
    await page.waitForLoadState('networkidle');

    // Search for order by customer name
    await page.fill('[data-testid="search-orders"]', customerName);
    await page.waitForTimeout(1000); // Wait for search to complete

    // Find order row
    const orderRow = page.locator(`text=${customerName}`).first();
    await expect(orderRow).toBeVisible({ timeout: 10000 });

    // Verify channel badge shows "LinkMe"
    await expect(page.locator('text=LinkMe')).toBeVisible();
  });

  test('1.4: Affiliate organization visible in BO and LinkMe', async ({
    page,
    loginLinkMe,
    loginBackOffice,
  }) => {
    // Step 1: Login to LinkMe as independent organization
    await loginLinkMe(CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);

    // Navigate to profile or organization page
    await page.goto('http://localhost:3002/profile');
    await page.waitForLoadState('networkidle');

    // Get organization name from UI
    const orgName = await page
      .locator('[data-testid="organization-name"]')
      .textContent();
    expect(orgName).toBeTruthy();

    // Step 2: Login to Back-Office
    await loginBackOffice();

    // Navigate to affiliates page
    await page.goto('http://localhost:3000/partenaires/affilies');
    await page.waitForLoadState('networkidle');

    // Step 3: Search for organization
    await page.fill('[data-testid="search-affiliates"]', orgName || 'Test');
    await page.waitForTimeout(1000);

    // Verify organization is visible
    const orgRow = page.locator(`text=${orgName}`).first();
    await expect(orgRow).toBeVisible({ timeout: 10000 });

    // Verify email matches
    await expect(page.locator(`text=${CREDENTIALS.testOrg.email}`)).toBeVisible();
  });
});
