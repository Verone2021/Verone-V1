/**
 * API Route: GET /api/finance/export-justificatifs?year=2026&month=01&email=optional@email.com
 *
 * Exporte les justificatifs d'un mois donné :
 * - Sans email: retourne un ZIP téléchargeable
 * - Avec email: envoie le ZIP par email via Resend
 *
 * Source: bucket Supabase Storage "justificatifs"
 * Organisation: justificatifs/{year}/{month}/{txId}_{filename}
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Simple ZIP creation without external dependency
// Using a basic concatenation approach for small files
async function createSimpleZip(
  files: { name: string; data: ArrayBuffer }[]
): Promise<Buffer> {
  // For production, consider using archiver or jszip package
  // This is a minimal implementation using raw ZIP format
  const entries: Buffer[] = [];
  const centralDir: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, 'utf-8');
    const dataBuffer = Buffer.from(file.data);

    // Local file header (30 bytes + name + data)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(0, 8); // compression (store)
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0, 12); // mod date
    localHeader.writeUInt32LE(0, 14); // crc32 (0 for store)
    localHeader.writeUInt32LE(dataBuffer.length, 18); // compressed size
    localHeader.writeUInt32LE(dataBuffer.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuffer.length, 26); // name length
    localHeader.writeUInt16LE(0, 28); // extra length

    entries.push(localHeader, nameBuffer, dataBuffer);

    // Central directory entry
    const centralEntry = Buffer.alloc(46);
    centralEntry.writeUInt32LE(0x02014b50, 0); // signature
    centralEntry.writeUInt16LE(20, 4); // version made by
    centralEntry.writeUInt16LE(20, 6); // version needed
    centralEntry.writeUInt16LE(0, 8); // flags
    centralEntry.writeUInt16LE(0, 10); // compression
    centralEntry.writeUInt16LE(0, 12); // mod time
    centralEntry.writeUInt16LE(0, 14); // mod date
    centralEntry.writeUInt32LE(0, 16); // crc32
    centralEntry.writeUInt32LE(dataBuffer.length, 20); // compressed
    centralEntry.writeUInt32LE(dataBuffer.length, 24); // uncompressed
    centralEntry.writeUInt16LE(nameBuffer.length, 28); // name length
    centralEntry.writeUInt16LE(0, 30); // extra length
    centralEntry.writeUInt16LE(0, 32); // comment length
    centralEntry.writeUInt16LE(0, 34); // disk number
    centralEntry.writeUInt16LE(0, 36); // internal attrs
    centralEntry.writeUInt32LE(0, 38); // external attrs
    centralEntry.writeUInt32LE(offset, 42); // local header offset

    centralDir.push(centralEntry, nameBuffer);

    offset += localHeader.length + nameBuffer.length + dataBuffer.length;
  }

  // End of central directory
  const centralDirSize = centralDir.reduce((s, b) => s + b.length, 0);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0); // signature
  endRecord.writeUInt16LE(0, 4); // disk number
  endRecord.writeUInt16LE(0, 6); // central dir disk
  endRecord.writeUInt16LE(files.length, 8); // entries on disk
  endRecord.writeUInt16LE(files.length, 10); // total entries
  endRecord.writeUInt32LE(centralDirSize, 12); // central dir size
  endRecord.writeUInt32LE(offset, 16); // central dir offset
  endRecord.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...entries, ...centralDir, endRecord]);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 2. Params
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const email = searchParams.get('email');

    if (!year || !/^\d{4}$/.test(year)) {
      return NextResponse.json(
        { error: 'Paramètre year requis (YYYY)' },
        { status: 400 }
      );
    }

    // 3. List files in the bucket for the given year/month
    const basePath = month ? `${year}/${month}` : year;

    const { data: fileList, error: listError } = await supabase.storage
      .from('justificatifs')
      .list(basePath, { limit: 500 });

    if (listError) {
      return NextResponse.json(
        { error: `Erreur listing: ${listError.message}` },
        { status: 500 }
      );
    }

    // Filter to actual files (not folders)
    const files = (fileList ?? []).filter(f => f.id);

    if (files.length === 0) {
      return NextResponse.json(
        {
          error: `Aucun justificatif trouvé pour ${basePath}`,
          count: 0,
        },
        { status: 404 }
      );
    }

    // 4. Download all files
    const zipFiles: { name: string; data: ArrayBuffer }[] = [];

    for (const file of files) {
      const filePath = `${basePath}/${file.name}`;
      const { data, error: dlError } = await supabase.storage
        .from('justificatifs')
        .download(filePath);

      if (dlError || !data) {
        console.error(`[Export] Failed to download ${filePath}:`, dlError);
        continue;
      }

      zipFiles.push({
        name: file.name,
        data: await data.arrayBuffer(),
      });
    }

    if (zipFiles.length === 0) {
      return NextResponse.json(
        { error: 'Aucun fichier téléchargeable' },
        { status: 404 }
      );
    }

    // 5. Create ZIP
    const zipBuffer = await createSimpleZip(zipFiles);
    const filename = `justificatifs-${year}${month ? `-${month}` : ''}.zip`;

    // 6. If email specified, send via Resend
    if (email) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'Verone <noreply@verone.fr>',
          to: [email],
          subject: `Justificatifs comptables ${year}${month ? `/${month}` : ''}`,
          html: `
            <h2>Justificatifs comptables</h2>
            <p>Période : ${month ? `${month}/${year}` : year}</p>
            <p>Nombre de fichiers : ${zipFiles.length}</p>
            <p>Veuillez trouver ci-joint l'archive ZIP contenant les justificatifs.</p>
            <br/>
            <p><em>Envoyé automatiquement depuis Verone Back Office</em></p>
          `,
          attachments: [
            {
              filename,
              content: zipBuffer.toString('base64'),
            },
          ],
        });

        return NextResponse.json({
          success: true,
          message: `${zipFiles.length} justificatifs envoyés à ${email}`,
          filename,
        });
      } catch (emailError) {
        console.error('[Export] Email send error:', emailError);
        return NextResponse.json(
          {
            error:
              'ZIP créé mais envoi email échoué. Vérifiez la configuration Resend.',
          },
          { status: 500 }
        );
      }
    }

    // 7. Return ZIP as download
    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
