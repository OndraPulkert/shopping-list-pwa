import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4338ca, #7c3aed)',
          borderRadius: 40,
        }}
      >
        {/* Shopping bag body */}
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          <rect x="8" y="42" width="94" height="62" rx="8" stroke="white" strokeWidth="9" />
          <path d="M28 42 Q28 14 55 14 Q82 14 82 42" stroke="white" strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M28 76 l18 16 36-30" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
