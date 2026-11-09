'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { sounds } from '../utils/audio';

interface WindchimeLandingProps {
  onEnter: () => void;
}

export const WindchimeLanding: React.FC<WindchimeLandingProps> = ({ onEnter }) => {
  const [isSwaying, setIsSwaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleWindchimeClick = () => {
    if (isSwaying) return;
    setIsSwaying(true);
    setHasInteracted(true);

    // Play chime sound & wind whisper
    sounds.playFurinChime(1.0);
    sounds.playWindWhisper(2.5);

    // Staggered second chime as clapper swings back
    setTimeout(() => {
      sounds.playFurinChime(0.7);
    }, 600);

    setTimeout(() => {
      sounds.playFurinChime(0.4);
    }, 1300);

    // Proceed to next page after graceful sway
    setTimeout(() => {
      onEnter();
    }, 2200);
  };

  const handleWindchimeHover = () => {
    if (!isSwaying) {
      sounds.playFurinChime(0.25);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-sky-100 flex items-center justify-center">
      {/* Background watercolor sky (matching 1.png) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/background-1.png"
          alt="Watercolor Sky Background"
          fill
          priority
          className="object-cover object-center pointer-events-none"
        />
      </div>

      {/* Windchime Container (matching 1.png placement: top center-left) */}
      <div className="absolute top-0 left-1/2 -translate-x-[55%] z-20 flex flex-col items-center">
        <button
          onClick={handleWindchimeClick}
          onMouseEnter={handleWindchimeHover}
          aria-label="Japanese Sakura Windchime"
          className="group relative cursor-pointer outline-none focus:outline-none transition-transform duration-300 transform-gpu active:scale-95"
          style={{ transformOrigin: 'top center' }}
        >
          {/* Subtle glow on hover */}
          <div className="absolute inset-0 -top-6 rounded-full bg-pink-200/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* The Windchime Image with physics swaying animation */}
          <div
            className={`relative w-[210px] md:w-[260px] lg:w-[310px] h-[340px] md:h-[420px] lg:h-[500px] transition-transform ${
              isSwaying
                ? 'animate-swayIntense'
                : 'animate-sway group-hover:scale-[1.02]'
            }`}
            style={{ transformOrigin: 'top center' }}
          >
            <Image
              src="/assets/drawn-sakura-windchime.png"
              alt="Sakura Windchime"
              fill
              priority
              className="object-contain object-top drop-shadow-sm filter transition-all duration-300"
            />
          </div>

          {/* Gentle interactive prompt badge */}
          {!hasInteracted && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-pink-100/60 shadow-sm text-stone-600 text-xs tracking-widest font-serif opacity-80 group-hover:opacity-100 transition-all duration-300">
              Click to chime &amp; enter
            </div>
          )}
        </button>
      </div>

      {/* Calligraphy 'Japan' script (matching 1.png in bottom right) */}
      <div className="absolute bottom-8 right-8 md:bottom-12 md:right-16 z-10 w-[240px] md:w-[340px] lg:w-[420px] h-[140px] md:h-[200px] pointer-events-none">
        <Image
          src="/assets/japan.png"
          alt="Japan"
          fill
          priority
          className="object-contain object-right-bottom drop-shadow-sm opacity-95 transition-opacity duration-1000"
        />
      </div>

      {/* Drifting Petals in background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float opacity-40"
            style={{
              top: `${15 + i * 14}%`,
              left: `${10 + (i * 17) % 80}%`,
              animationDelay: `${i * 0.7}s`,
              transform: `scale(${0.4 + (i % 3) * 0.2}) rotate(${i * 45}deg)`,
            }}
          >
            <div className="w-8 h-8 relative">
              <Image
                src="/assets/sakura-petal.png"
                alt="Petal"
                fill
                className="object-contain"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
