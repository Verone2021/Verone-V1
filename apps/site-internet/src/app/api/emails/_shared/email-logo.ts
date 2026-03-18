/**
 * Verone logo for email embedding via CID (Content-ID)
 * Uses Resend's recommended approach for inline images
 * Pattern copied from LinkMe's email-logo.ts
 * @see https://resend.com/docs/dashboard/emails/embed-inline-images
 */

import fs from 'fs';
import path from 'path';

// Logo in public/ — accessible via process.cwd() in Next.js API routes
const LOGO_PATH = path.join(process.cwd(), 'public', 'logo-verone.png');

/** CID reference to use in HTML: <img src="cid:verone-logo" /> */
export const LOGO_CID = 'verone-logo';

// Cache the base64 content to avoid re-reading the file on every email
let cachedContent: string | null = null;

/** Resend attachment config for inline logo. Returns null if file not found. */
export function getLogoAttachment(): {
  content: string;
  filename: string;
  contentId: string;
} | null {
  try {
    cachedContent ??= fs.readFileSync(LOGO_PATH).toString('base64');
    return {
      content: cachedContent,
      filename: 'logo-verone.png',
      contentId: LOGO_CID,
    };
  } catch (error) {
    console.error(
      '[email-logo] Failed to read logo file:',
      LOGO_PATH,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/** Returns logo as attachment array (empty if file not found). Convenient for Resend's attachments field. */
export function getLogoAttachments(): Array<{
  content: string;
  filename: string;
  contentId: string;
}> {
  const attachment = getLogoAttachment();
  return attachment ? [attachment] : [];
}
