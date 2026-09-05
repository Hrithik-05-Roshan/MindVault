import React from 'react';

export const AtmosphericBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#08090d]"
    >
      {/* Dynamic ambient color orbs with deep atmospheric diffusion */}
      <div className="absolute -top-40 -left-40 w-[38rem] h-[38rem] rounded-full bg-indigo-900/18 blur-[120px]" />
      <div className="absolute top-1/4 -right-40 w-[42rem] h-[42rem] rounded-full bg-violet-950/22 blur-[140px]" />
      <div className="absolute top-2/3 left-1/4 w-[36rem] h-[36rem] rounded-full bg-amber-950/14 blur-[130px]" />
      <div className="absolute -bottom-40 right-1/3 w-[45rem] h-[45rem] rounded-full bg-blue-950/20 blur-[150px]" />
      
      {/* Subtle radial center ambient highlight for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 15%, rgba(99, 102, 241, 0.07) 0%, transparent 60%)',
        }}
      />

      {/* Subtle architectural grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Zero-dependency, GPU-friendly physical film grain overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04] mix-blend-screen pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="mindvault-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#mindvault-grain)" />
      </svg>
    </div>
  );
};
