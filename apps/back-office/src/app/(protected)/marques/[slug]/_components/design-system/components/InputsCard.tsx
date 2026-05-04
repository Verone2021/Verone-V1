'use client';

import { PreviewCard } from '../_PreviewCard';

export function InputsCard() {
  return (
    <PreviewCard label="Inputs — border-bottom · label flottant">
      <div className="grid grid-cols-1 gap-9 bg-white p-5 sm:grid-cols-2">
        <div>
          <div style={{ position: 'relative', paddingTop: 18 }}>
            <input
              type="email"
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 15,
                width: '100%',
                background: 'transparent',
                border: 0,
                borderBottom: '1px solid #1d1d1b',
                padding: '8px 0',
                outline: 'none',
              }}
              readOnly
            />
            <label
              style={{
                position: 'absolute',
                left: 0,
                top: 22,
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 15,
                color: '#9B9B98',
              }}
            >
              Adresse e-mail
            </label>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Default</p>
        </div>
        <div>
          <div style={{ position: 'relative', paddingTop: 18 }}>
            <input
              type="email"
              defaultValue="claire@verone.fr"
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 15,
                width: '100%',
                background: 'transparent',
                border: 0,
                borderBottom: '1px solid #C9A961',
                padding: '8px 0',
                outline: 'none',
                color: '#1d1d1b',
              }}
              readOnly
            />
            <label
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 11,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: '#C9A961',
              }}
            >
              Adresse e-mail
            </label>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Filled / focus — label monte en or
          </p>
        </div>
      </div>
    </PreviewCard>
  );
}
