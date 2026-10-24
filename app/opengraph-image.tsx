import { ImageResponse } from 'next/og'

export const alt = 'Rifornio — Fai rifornimento dove conviene davvero'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#09090b',
          backgroundImage:
            'radial-gradient(circle at 80% 20%, #064e3b 0%, #022c22 45%, #09090b 80%)',
          padding: '60px 70px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: '#059669',
              color: '#ffffff',
              fontSize: '28px',
              fontWeight: 'bold',
            }}
          >
            ⛽
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '28px',
                fontWeight: '900',
                letterSpacing: '-0.02em',
                color: '#ffffff',
              }}
            >
              Rifornio
            </span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#34d399',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              rifornio.it
            </span>
          </div>
        </div>

        {/* Center Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(5, 150, 105, 0.25)',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              color: '#6ee7b7',
              fontSize: '15px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              alignSelf: 'flex-start',
            }}
          >
            ● La prima guida al risparmio reale al volante
          </div>

          <h1
            style={{
              fontSize: '56px',
              fontWeight: '900',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              margin: 0,
              maxWidth: '960px',
            }}
          >
            Fai rifornimento dove conviene davvero.
          </h1>

          <p
            style={{
              fontSize: '24px',
              lineHeight: 1.45,
              color: '#a1a1aa',
              margin: 0,
              maxWidth: '880px',
            }}
          >
            Il distributore con il prezzo più basso non è sempre la scelta
            migliore. Calcola i litri netti effettivi dopo il viaggio.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '10px',
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              color: '#e4e4e7',
              fontSize: '15px',
              fontWeight: '700',
            }}
          >
            ★ Litri netti calcolati
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '10px',
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              color: '#e4e4e7',
              fontSize: '15px',
              fontWeight: '700',
            }}
          >
            📍 Vicino a me & Lungo il percorso
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '10px',
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              color: '#e4e4e7',
              fontSize: '15px',
              fontWeight: '700',
            }}
          >
            🇮🇹 Dati Open Data MIMIT
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '10px',
              backgroundColor: '#064e3b',
              border: '1px solid #059669',
              color: '#a7f3d0',
              fontSize: '15px',
              fontWeight: '700',
              marginLeft: 'auto',
            }}
          >
            📱 App Android & iOS
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
