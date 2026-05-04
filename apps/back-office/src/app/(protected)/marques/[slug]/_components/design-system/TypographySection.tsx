'use client';

import type { BrandTokens } from '@verone/themes';

import { PreviewCard } from './_PreviewCard';

export function TypographySection({ tokens }: { tokens: BrandTokens }) {
  return (
    <section className="space-y-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Typographie
      </h3>

      <PreviewCard label="Display — Wordmark (Balgin / DM Sans fallback)">
        <div
          className="flex items-center justify-center"
          style={{
            background: '#1d1d1b',
            color: '#FFFFFF',
            padding: '36px 32px',
          }}
        >
          <div
            style={{
              fontFamily: tokens.typography.fontDisplay,
              fontWeight: 300,
              fontSize: 64,
              letterSpacing: tokens.typography.tracking.display,
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            VÉRONE
          </div>
        </div>
        <p className="bg-gray-50/50 px-4 py-2 text-[11px] text-muted-foreground">
          CAPITALES uniquement · tracking 0.18em · font-stretch 125%
        </p>
      </PreviewCard>

      <PreviewCard label="Headings — Migra Extrabold (fallback Bodoni Moda)">
        <div className="space-y-3 bg-white p-5">
          <div
            style={{
              fontFamily: tokens.typography.fontHeading,
              fontWeight: 800,
              fontSize: 48,
              color: '#1d1d1b',
              lineHeight: 1.04,
              letterSpacing: '-0.005em',
            }}
          >
            Une lumière qui
            <br />
            dessine la pièce.
          </div>
          <div
            style={{
              fontFamily: tokens.typography.fontHeading,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 32,
              color: '#C9A961',
              lineHeight: 1.1,
            }}
          >
            Édition limitée.
          </div>
        </div>
        <p className="bg-gray-50/50 px-4 py-2 text-[11px] text-muted-foreground">
          H1 72 · H2 52 · H3 38 · H4 28 · italic accent éditorial
        </p>
      </PreviewCard>

      <PreviewCard label="Body & UI — Montserrat">
        <div className="space-y-3 bg-white p-5">
          <p
            style={{
              fontFamily: tokens.typography.fontBody,
              fontWeight: 300,
              fontSize: 17,
              lineHeight: 1.7,
              color: '#1d1d1b',
              margin: 0,
            }}
          >
            Lead 17 — Une console en travertin sculptée à la main dans un
            atelier toscan, finie à la cire d&apos;abeille.
          </p>
          <p
            style={{
              fontFamily: tokens.typography.fontBody,
              fontWeight: 400,
              fontSize: 15,
              lineHeight: 1.55,
              color: '#1d1d1b',
              margin: 0,
            }}
          >
            Body 15 — Lecture longue. Phrases descriptives qui laissent
            l&apos;objet parler. Aucun jargon marketing.
          </p>
          <p
            style={{
              fontFamily: tokens.typography.fontBody,
              fontSize: 13,
              color: '#9B9B98',
              margin: 0,
            }}
          >
            Caption 13 · gris perle — Sourcé en Italie · 8 pièces · livraison
            sur rendez-vous
          </p>
          <p
            style={{
              fontFamily: tokens.typography.fontBody,
              fontWeight: 500,
              fontSize: 11,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: '#9B9B98',
              margin: 0,
            }}
          >
            Eyebrow 11 · 0.32em — Édition signature
          </p>
        </div>
      </PreviewCard>

      <PreviewCard label="Échelle complète">
        <table
          className="w-full"
          style={{
            fontFamily: tokens.typography.fontBody,
            fontSize: 13,
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid #E6E5E2',
                color: '#9B9B98',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                fontSize: 10,
              }}
            >
              <th className="px-4 py-2 text-left">Token</th>
              <th className="text-left">Px</th>
              <th className="text-left">Family</th>
              <th className="text-left">Specimen</th>
            </tr>
          </thead>
          <tbody>
            <ScaleRow
              token="Display"
              px="112"
              family="Balgin / DM Sans"
              specimen="VÉRONE"
              specimenStyle={{
                fontFamily: tokens.typography.fontDisplay,
                fontWeight: 300,
                letterSpacing: '0.18em',
                fontSize: 18,
              }}
            />
            <ScaleRow
              token="H1"
              px="72"
              family="Migra / Bodoni"
              specimen="Aa Bb"
              specimenStyle={{
                fontFamily: tokens.typography.fontHeading,
                fontWeight: 800,
                fontSize: 22,
                lineHeight: 1,
              }}
            />
            <ScaleRow
              token="H2"
              px="52"
              family="Migra / Bodoni"
              specimen="Aa Bb"
              specimenStyle={{
                fontFamily: tokens.typography.fontHeading,
                fontWeight: 800,
                fontSize: 18,
              }}
            />
            <ScaleRow
              token="H3"
              px="38"
              family="Migra / Bodoni"
              specimen="Aa Bb"
              specimenStyle={{
                fontFamily: tokens.typography.fontHeading,
                fontWeight: 800,
                fontSize: 16,
              }}
            />
            <ScaleRow
              token="Body Lg"
              px="17"
              family="Montserrat 300"
              specimen="Aa Bb"
              specimenStyle={{
                fontFamily: tokens.typography.fontBody,
                fontWeight: 300,
              }}
            />
            <ScaleRow
              token="Body"
              px="15"
              family="Montserrat 400"
              specimen="Aa Bb"
              specimenStyle={{
                fontFamily: tokens.typography.fontBody,
              }}
            />
            <ScaleRow
              token="Caption"
              px="13"
              family="Montserrat 400"
              specimen="Aa Bb"
              specimenStyle={{
                fontFamily: tokens.typography.fontBody,
              }}
            />
            <ScaleRow
              token="Eyebrow"
              px="11/12"
              family="Montserrat 500"
              specimen="EYEBROW"
              specimenStyle={{
                fontFamily: tokens.typography.fontBody,
                fontWeight: 500,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                fontSize: 10,
              }}
              last
            />
          </tbody>
        </table>
      </PreviewCard>
    </section>
  );
}

function ScaleRow({
  token,
  px,
  family,
  specimen,
  specimenStyle,
  last,
}: {
  token: string;
  px: string;
  family: string;
  specimen: string;
  specimenStyle: React.CSSProperties;
  last?: boolean;
}) {
  return (
    <tr
      style={{
        borderBottom: last ? 'none' : '1px solid rgba(29,29,27,0.06)',
      }}
    >
      <td className="px-4 py-2">{token}</td>
      <td>{px}</td>
      <td>{family}</td>
      <td style={specimenStyle}>{specimen}</td>
    </tr>
  );
}
