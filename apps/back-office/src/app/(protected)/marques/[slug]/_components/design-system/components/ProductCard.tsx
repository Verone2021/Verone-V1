'use client';

import { PreviewCard } from '../_PreviewCard';

export function ProductCard() {
  return (
    <PreviewCard label="Card produit — default + hover (or, underline, zoom)">
      <div className="grid grid-cols-1 gap-8 bg-white p-5 sm:grid-cols-2">
        <ProductTile
          imageUrl="https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600"
          title="Console Travertine"
          meta="Édition limitée · Italie"
          price="2 480 €"
        />
        <ProductTile
          imageUrl="https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600"
          title="Lampe Astra"
          meta="Atelier Vérone · Paris"
          price="890 €"
          hover
        />
      </div>
    </PreviewCard>
  );
}

function ProductTile({
  imageUrl,
  title,
  meta,
  price,
  hover,
}: {
  imageUrl: string;
  title: string;
  meta: string;
  price: string;
  hover?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          aspectRatio: '4 / 5',
          backgroundImage: `url('${imageUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: hover ? '0 12px 40px -16px rgba(29,29,27,0.18)' : 'none',
          transform: hover ? 'scale(1.01)' : 'none',
        }}
      />
      <div className="pt-3">
        <div
          style={{
            fontFamily: '"Bodoni Moda", "Playfair Display", Georgia, serif',
            fontWeight: 800,
            fontSize: 20,
            color: hover ? '#C9A961' : '#1d1d1b',
            lineHeight: 1.1,
            borderBottom: hover ? '1px solid #C9A961' : 'none',
            display: 'inline-block',
            paddingBottom: hover ? 2 : 0,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 13,
            color: '#9B9B98',
            marginTop: 4,
          }}
        >
          {meta}
        </div>
        <div
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 13,
            color: '#1d1d1b',
            letterSpacing: '0.04em',
            marginTop: 8,
          }}
        >
          {price}
        </div>
      </div>
    </div>
  );
}
