import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Rehearsal AI — Master Your Coding Interviews with Voice AI';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0b0f19 0%, #161e31 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 'bold',
            }}
          >
            R
          </div>
          <span style={{ fontSize: '36px', fontWeight: 'bold', letterSpacing: '-1px' }}>
            Rehearsal AI
          </span>
        </div>

        <div
          style={{
            fontSize: '56px',
            fontWeight: '800',
            textAlign: 'center',
            lineHeight: 1.15,
            letterSpacing: '-2px',
            maxWidth: '900px',
            marginBottom: '24px',
          }}
        >
          Master Your Coding Interviews Out Loud
        </div>

        <div
          style={{
            fontSize: '24px',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '750px',
            lineHeight: 1.4,
          }}
        >
          Real-time voice AI panels, sandboxed code execution, and LeetCode-style test cases.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

