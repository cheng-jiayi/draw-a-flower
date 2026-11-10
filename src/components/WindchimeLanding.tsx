'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { sounds } from '../utils/audio';

interface WindchimeLandingProps {
  onEnter: () => void;
}

export const WindchimeLanding: React.FC<WindchimeLandingProps> = ({ onEnter }) => {
  const [isSwaying, setIsSwaying] = useState(false);

  const handleWindchimeClick = () => {
    if (isSwaying) return;
    setIsSwaying(true);

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
    <div className="relative w-full min-h-screen overflow-y-auto overflow-x-hidden md:h-screen md:overflow-hidden select-none bg-sky-100 flex items-center justify-center">
      {/* Background watercolor sky (matching 1.png) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/assets/background-1.png"
          alt="Watercolor Sky Background"
          fill
          priority
          className="object-cover object-center pointer-events-none"
        />
      </div>

      {/* Windchime Container (matching 1.png: hanging from top, prominent size) */}
      <div className="absolute top-0 left-1/2 -translate-x-[51%] z-20 flex flex-col items-center">
        <button
          onClick={handleWindchimeClick}
          onMouseEnter={handleWindchimeHover}
          aria-label="Japanese Sakura Windchime"
          className="group relative cursor-pointer outline-none focus:outline-none transition-transform duration-300 transform-gpu"
          style={{ transformOrigin: 'top center' }}
        >
          {/* Subtle glow on hover */}
          <div className="absolute inset-0 -top-6 rounded-full bg-pink-200/25 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* The Windchime Image with physics swaying animation */}
          <div
            className={`relative -mt-16 h-[105vh] w-[78vh] max-w-[110vw] max-h-none transition-transform ${isSwaying
                ? 'animate-swayIntense'
                : 'animate-sway group-hover:scale-[1.01]'
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
        </button>
      </div>

      {/* Calligraphy 'Japan' script (matching 1.png in bottom right) */}
      <div className="absolute bottom-6 right-6 md:bottom-10 md:right-14 z-10 w-[240px] md:w-[360px] lg:w-[440px] h-[140px] md:h-[210px] pointer-events-none">
        <Image
          src="/assets/japan.png"
          alt="Japan"
          fill
          priority
          className="object-contain object-right-bottom drop-shadow-sm opacity-95 transition-opacity duration-1000"
        />
      </div>
    </div>
  );
};
