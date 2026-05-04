'use client';

import {
  Bookmark,
  Clock,
  Heart,
  Info,
  Menu,
  Search,
  ShoppingCart,
} from 'lucide-react';

import { PreviewCard } from './_PreviewCard';

const LUCIDE_ICONS = [Search, Heart, ShoppingCart, Bookmark, Clock, Info, Menu];

interface BrandAssets {
  wordmarkCharcoalOnWhite: string;
  wordmarkGoldOnWhite: string;
  wordmarkWhiteOnCharcoal: string;
  symbolCharcoalOnWhite: string;
  symbolGoldOnWhite: string;
  symbolWhiteOnCharcoal: string;
}

const VERONE_ASSETS: BrandAssets = {
  wordmarkCharcoalOnWhite:
    '/brand/verone/verone-wordmark-charcoal-on-white.jpg',
  wordmarkGoldOnWhite: '/brand/verone/verone-wordmark-gold-on-white.jpg',
  wordmarkWhiteOnCharcoal: '/brand/verone/verone-wordmark-white-on-black.jpg',
  symbolCharcoalOnWhite: '/brand/verone/verone-symbol-charcoal-on-white.jpg',
  symbolGoldOnWhite: '/brand/verone/verone-symbol-gold-on-white.jpg',
  symbolWhiteOnCharcoal: '/brand/verone/verone-symbol-white-on-black.jpg',
};

export function BrandSection() {
  return (
    <section className="space-y-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Marque
      </h3>

      <PreviewCard label="Wordmark — fond clair">
        <div className="grid grid-cols-2 gap-px bg-[#E8E6E1]">
          <ImagePanel
            src={VERONE_ASSETS.wordmarkCharcoalOnWhite}
            alt="Wordmark Vérone charbon sur blanc"
            bg="#FFFFFF"
            note="Charbon · catalogue"
          />
          <ImagePanel
            src={VERONE_ASSETS.wordmarkGoldOnWhite}
            alt="Wordmark Vérone or sur blanc"
            bg="#FFFFFF"
            note="Or · accent éditorial"
          />
        </div>
      </PreviewCard>

      <PreviewCard label="Wordmark — fond charbon">
        <ImagePanel
          src={VERONE_ASSETS.wordmarkWhiteOnCharcoal}
          alt="Wordmark Vérone blanc sur charbon"
          bg="#1d1d1b"
          note="Hero · footer · papeterie premium"
          minHeight={140}
        />
      </PreviewCard>

      <PreviewCard label="Symbole monogramme V/A">
        <div className="grid grid-cols-3 gap-0">
          <ImagePanel
            src={VERONE_ASSETS.symbolCharcoalOnWhite}
            alt="Symbole charbon sur blanc"
            bg="#FFFFFF"
            note="Favicon · avatar"
            square
          />
          <ImagePanel
            src={VERONE_ASSETS.symbolWhiteOnCharcoal}
            alt="Symbole blanc sur charbon"
            bg="#1d1d1b"
            note="Hero · packaging"
            square
          />
          <ImagePanel
            src={VERONE_ASSETS.symbolGoldOnWhite}
            alt="Symbole or sur blanc"
            bg="#FFFFFF"
            note="Carte de visite"
            square
          />
        </div>
      </PreviewCard>

      <PreviewCard label="Damier signature — 2 variantes">
        <DamierVariant
          label="Variante 1 — charbon / blanc"
          note="Sobre · éditorial"
          labelColor="#1d1d1b"
          gridColor="#1d1d1b"
          baseColor="#FFFFFF"
        />
        <DamierVariant
          label="Variante 2 — charbon / or"
          note="Premium · papeterie"
          labelColor="#C9A961"
          gridColor="#C9A961"
          baseColor="#1d1d1b"
        />
      </PreviewCard>

      <PreviewCard label="Embossage doré — papeterie premium">
        <div
          className="flex items-center justify-center"
          style={{
            background: '#1d1d1b',
            minHeight: 140,
            padding: '24px 36px',
          }}
        >
          <div
            style={{
              fontFamily:
                '"Balgin", "DM Sans", "Cormorant Infant", system-ui, sans-serif',
              fontWeight: 300,
              fontSize: 48,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              background:
                'linear-gradient(180deg, #D4B86E 0%, #C9A961 50%, #B8954A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 1px 0 rgba(0,0,0,0.3)',
            }}
          >
            VÉRONE
          </div>
        </div>
      </PreviewCard>

      <PreviewCard label="Iconographie — Lucide (stroke 1.25)">
        <div
          className="flex flex-wrap items-center gap-6 bg-white p-4"
          style={{ color: '#1d1d1b' }}
        >
          {LUCIDE_ICONS.map((Icon, i) => (
            <Icon key={i} size={24} strokeWidth={1.25} />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Stroke 1.25–1.5 · couleur courante · or réservé états actifs · jamais
          d&apos;emoji.
        </p>
      </PreviewCard>

      <PreviewCard label="Voice & tone — exemples">
        <div className="space-y-3 bg-white p-4">
          <VoiceSample
            text="« Une lumière qui dessine la pièce. »"
            note="Hero · prose courte · italique éditorial"
            font='"Bodoni Moda", "Playfair Display", Georgia, serif'
            italic
            color="#1d1d1b"
            accent
          />
          <VoiceSample
            text="Console en travertin sculptée à la main dans un atelier toscan, finie à la cire d'abeille."
            note="Description produit — descriptive, jamais commerciale"
            font='"Montserrat", system-ui, sans-serif'
            color="#1d1d1b"
            accent
          />
          <VoiceSample
            text="Sourcé en Italie · 8 pièces · livraison sur rendez-vous"
            note="Meta — middle-dot séparateur · pas d'emoji"
            font='"Montserrat", system-ui, sans-serif'
            color="#9B9B98"
          />
        </div>
      </PreviewCard>
    </section>
  );
}

function ImagePanel({
  src,
  alt,
  bg,
  note,
  minHeight = 120,
  square,
}: {
  src: string;
  alt: string;
  bg: string;
  note: string;
  minHeight?: number;
  square?: boolean;
}) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        background: bg,
        minHeight: square ? undefined : minHeight,
        aspectRatio: square ? '1 / 1' : undefined,
        padding: '24px',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        style={{
          maxWidth: '70%',
          maxHeight: square ? '70%' : 80,
          objectFit: 'contain',
        }}
      />
      <span
        className="absolute bottom-1 right-2 text-[9px] uppercase tracking-[0.18em]"
        style={{
          color:
            bg.toUpperCase() === '#1D1D1B' || bg === '#1d1d1b'
              ? '#9B9B98'
              : '#9B9B98',
        }}
      >
        {note}
      </span>
    </div>
  );
}

function DamierVariant({
  label,
  note,
  labelColor,
  gridColor,
  baseColor,
}: {
  label: string;
  note: string;
  labelColor: string;
  gridColor: string;
  baseColor: string;
}) {
  return (
    <>
      <div className="flex items-center justify-between bg-white px-4 py-2">
        <span
          className="text-[10px] uppercase tracking-[0.32em]"
          style={{ color: labelColor }}
        >
          {label}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {note}
        </span>
      </div>
      <div
        style={{
          height: 130,
          backgroundImage: `linear-gradient(45deg,${gridColor} 25%,transparent 25%),linear-gradient(-45deg,${gridColor} 25%,transparent 25%),linear-gradient(45deg,transparent 75%,${gridColor} 75%),linear-gradient(-45deg,transparent 75%,${gridColor} 75%)`,
          backgroundSize: '12px 12px',
          backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
          backgroundColor: baseColor,
        }}
      />
    </>
  );
}

function VoiceSample({
  text,
  note,
  font,
  italic,
  color,
  accent,
}: {
  text: string;
  note: string;
  font: string;
  italic?: boolean;
  color: string;
  accent?: boolean;
}) {
  return (
    <div
      className="border-l-2 pl-4 py-1"
      style={{ borderColor: accent ? '#C9A961' : '#E6E5E2' }}
    >
      <div
        style={{
          fontFamily: font,
          fontStyle: italic ? 'italic' : 'normal',
          fontSize: italic ? 18 : 14,
          color,
          lineHeight: 1.4,
          fontWeight: italic ? 400 : 300,
        }}
      >
        {text}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{note}</div>
    </div>
  );
}
