/**
 * GET /api/extensions/sourcing-chrome/download
 *
 * Streams the Verone Sourcing Chrome extension as a .zip built on the fly
 * from the live `/chrome-extension/` directory. The version segment of the
 * filename comes from the manifest.json so a download always matches the
 * code currently shipped on staging/main.
 *
 * Auth: any active back-office staff (catalog_manager, admin, owner).
 *
 * @see BO-RBAC-CATALOG-MGR-001
 */

import { NextResponse } from 'next/server';
import path from 'node:path';
import { promises as fs } from 'node:fs';

import archiver from 'archiver';

import { createServerClient } from '@verone/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ExtensionManifest {
  version?: string;
  name?: string;
}

async function readExtensionVersion(extensionDir: string): Promise<string> {
  try {
    const manifestRaw = await fs.readFile(
      path.join(extensionDir, 'manifest.json'),
      'utf-8'
    );
    const manifest = JSON.parse(manifestRaw) as ExtensionManifest;
    return manifest.version ?? '0.0.0';
  } catch (error) {
    console.error(
      '[extensions/sourcing-chrome] Failed to read manifest version:',
      error
    );
    return '0.0.0';
  }
}

export async function GET() {
  const supabase = await createServerClient('backoffice');

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: role, error: roleError } = await supabase
    .from('user_app_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('app', 'back-office')
    .eq('is_active', true)
    .maybeSingle();

  if (roleError || !role) {
    return NextResponse.json(
      { error: 'Accès refusé — staff back-office requis' },
      { status: 403 }
    );
  }

  // Resolve extension directory from the monorepo root.
  // process.cwd() in Vercel/Next.js production is the app directory
  // (apps/back-office), so we go three levels up to reach the repo root,
  // then into chrome-extension/.
  const extensionDir = path.resolve(
    process.cwd(),
    '..',
    '..',
    'chrome-extension'
  );

  try {
    await fs.access(extensionDir);
  } catch {
    return NextResponse.json(
      {
        error:
          'Extension introuvable sur le serveur. Contactez un administrateur.',
      },
      { status: 500 }
    );
  }

  const version = await readExtensionVersion(extensionDir);
  const filename = `verone-sourcing-v${version}.zip`;

  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = new ReadableStream({
    start(controller) {
      archive.on('data', chunk => {
        controller.enqueue(new Uint8Array(chunk));
      });
      archive.on('end', () => controller.close());
      archive.on('error', err => {
        console.error('[extensions/sourcing-chrome] archiver error:', err);
        controller.error(err);
      });

      archive
        .glob('**/*', {
          cwd: extensionDir,
          ignore: ['node_modules/**', '.git/**', '*.zip', '.DS_Store'],
          dot: false,
        })
        .finalize()
        .catch(err => {
          console.error('[extensions/sourcing-chrome] finalize error:', err);
          controller.error(err);
        });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
