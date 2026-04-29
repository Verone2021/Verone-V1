/**
 * Tests unitaires — Helper Cloudflare Images
 *
 * Exécution: npx tsx packages/@verone/utils/src/cloudflare/__tests__/images.test.ts
 *
 * @module cloudflare/images.test
 * @since 2026-04-21
 */

import { strict as assert } from 'node:assert';

// ============================================================================
// SETUP — Mock fetch + env vars
// ============================================================================

const mockFetchResponses: Array<{ ok: boolean; body: unknown }> = [];
let fetchCallCount = 0;
let lastFetchCall: { url: string; options: RequestInit } | null = null;

global.fetch = async (
  url: string | URL | Request,
  options?: RequestInit
): Promise<Response> => {
  fetchCallCount++;
  lastFetchCall = {
    url: url instanceof Request ? url.url : url.toString(),
    options: options ?? {},
  };
  const next = mockFetchResponses.shift();
  if (!next) {
    throw new Error('fetch mock: no response queued');
  }
  return {
    ok: next.ok,
    json: async () => next.body,
    status: next.ok ? 200 : 500,
  } as Response;
};

function queueFetchResponse(body: unknown, ok = true): void {
  mockFetchResponses.push({ ok, body });
}

function setEnvVars(overrides: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

const VALID_ENV = {
  CLOUDFLARE_ACCOUNT_ID: 'test-account-id',
  CLOUDFLARE_IMAGES_API_TOKEN: 'test-api-token',
  CLOUDFLARE_IMAGES_HASH: 'abc123hash',
};

const EMPTY_ENV: Record<string, undefined> = {
  CLOUDFLARE_ACCOUNT_ID: undefined,
  CLOUDFLARE_IMAGES_API_TOKEN: undefined,
  CLOUDFLARE_IMAGES_HASH: undefined,
  NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID: undefined,
  NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH: undefined,
};

// ============================================================================
// HELPERS
// ============================================================================

let passed = 0;
let failed = 0;
const errors: string[] = [];

async function test(
  name: string,
  fn: () => Promise<void> | void
): Promise<void> {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ ${name}: ${message}`);
    errors.push(`${name}: ${message}`);
    failed++;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  // Import du module (une seule fois, les env vars sont lues à l'appel des fonctions)
  const {
    isCloudflareConfigured,
    buildCloudflareImageUrl,
    uploadImageToCloudflare,
    deleteImageFromCloudflare,
    CloudflareNotConfiguredError,
  } = await import('../images.js');

  // ============================================================================
  // TESTS — isCloudflareConfigured
  // ============================================================================

  console.log('\n--- isCloudflareConfigured ---');

  await test('retourne false si env vars absentes', () => {
    setEnvVars(EMPTY_ENV);
    assert.equal(isCloudflareConfigured(), false);
  });

  await test('retourne true si env vars complètes', () => {
    setEnvVars(VALID_ENV);
    assert.equal(isCloudflareConfigured(), true);
  });

  // ============================================================================
  // TESTS — buildCloudflareImageUrl
  // ============================================================================

  console.log('\n--- buildCloudflareImageUrl ---');

  await test('construit URL avec variant par défaut (public, imagedelivery.net)', () => {
    setEnvVars(VALID_ENV);
    const url = buildCloudflareImageUrl('img-uuid-123');
    assert.equal(
      url,
      'https://imagedelivery.net/abc123hash/img-uuid-123/public'
    );
  });

  await test('construit URL avec variant thumbnail (imagedelivery.net)', () => {
    setEnvVars(VALID_ENV);
    const url = buildCloudflareImageUrl('img-uuid-123', 'thumbnail');
    assert.equal(
      url,
      'https://imagedelivery.net/abc123hash/img-uuid-123/thumbnail'
    );
  });

  await test('construit URL custom domain quand NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN=true', () => {
    setEnvVars({
      ...VALID_ENV,
      NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN: 'true',
    });
    const url = buildCloudflareImageUrl('img-uuid-123');
    assert.equal(
      url,
      'https://images.veronecollections.fr/abc123hash/img-uuid-123/public'
    );
    // Reset to avoid pollution
    setEnvVars({ NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN: undefined });
  });

  await test('lance CloudflareNotConfiguredError si hash absent', () => {
    setEnvVars(EMPTY_ENV);
    assert.throws(
      () => buildCloudflareImageUrl('img-uuid-123'),
      CloudflareNotConfiguredError
    );
  });

  // ============================================================================
  // TESTS — uploadImageToCloudflare
  // ============================================================================

  console.log('\n--- uploadImageToCloudflare ---');

  await test('upload réussi retourne CloudflareImageUploadResult', async () => {
    setEnvVars(VALID_ENV);
    fetchCallCount = 0;

    queueFetchResponse({
      success: true,
      result: {
        id: 'cf-img-001',
        filename: 'photo.jpg',
        uploaded: '2026-04-21T10:00:00Z',
        variants: [
          'https://images.veronecollections.fr/abc123hash/cf-img-001/public',
        ],
        meta: { ownerId: 'prod-001' },
      },
      errors: [],
    });

    const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
    const result = await uploadImageToCloudflare(blob, {
      ownerId: 'prod-001',
      ownerType: 'product',
    });

    assert.equal(result.id, 'cf-img-001');
    assert.equal(result.filename, 'photo.jpg');
    assert.equal(result.variants.length, 1);
    assert.equal(fetchCallCount, 1);
    assert.ok(lastFetchCall?.url.includes('/images/v1'));
    const headers = lastFetchCall?.options.headers as Record<string, string>;
    assert.equal(headers['Authorization'], 'Bearer test-api-token');
  });

  await test('lance une erreur si Cloudflare retourne success=false', async () => {
    setEnvVars(VALID_ENV);

    queueFetchResponse({
      success: false,
      errors: [{ message: 'File too large' }],
    });

    const blob = new Blob(['data'], { type: 'image/jpeg' });

    await assert.rejects(
      async () => await uploadImageToCloudflare(blob),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes('File too large'));
        return true;
      }
    );
  });

  await test('lance CloudflareNotConfiguredError si env vars absentes', async () => {
    setEnvVars(EMPTY_ENV);
    const blob = new Blob(['data'], { type: 'image/jpeg' });

    await assert.rejects(
      async () => await uploadImageToCloudflare(blob),
      CloudflareNotConfiguredError
    );
  });

  // ============================================================================
  // TESTS — deleteImageFromCloudflare
  // ============================================================================

  console.log('\n--- deleteImageFromCloudflare ---');

  await test('suppression réussie ne lance pas d erreur', async () => {
    setEnvVars(VALID_ENV);
    fetchCallCount = 0;

    queueFetchResponse({ success: true, errors: [] });

    await deleteImageFromCloudflare('cf-img-001');

    assert.equal(fetchCallCount, 1);
    assert.ok(lastFetchCall?.url.includes('/images/v1/cf-img-001'));
    assert.equal(lastFetchCall?.options.method, 'DELETE');
  });

  await test('lance une erreur si Cloudflare retourne success=false', async () => {
    setEnvVars(VALID_ENV);

    queueFetchResponse({
      success: false,
      errors: [{ message: 'Image not found' }],
    });

    await assert.rejects(
      async () => await deleteImageFromCloudflare('cf-img-999'),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes('Image not found'));
        return true;
      }
    );
  });

  // ============================================================================
  // RÉSUMÉ
  // ============================================================================

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Résultats: ${passed} passés, ${failed} échoués`);
  if (errors.length > 0) {
    console.error('Erreurs:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  } else {
    console.log('Tous les tests sont passés.');
  }
}

void main().catch(err => {
  console.error('Erreur fatale:', err instanceof Error ? err.message : err);
  process.exit(1);
});
