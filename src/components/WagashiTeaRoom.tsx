'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { WAGASHI_LIST } from '../data/journalData';
import { WagashiItem } from '../types';
import { sounds } from '../utils/audio';

interface WagashiTeaRoomProps {
  onSelectDay: (day: number) => void;
  onEnterGarden: () => void;
  onBackToLanding: () => void;
}

export const WagashiTeaRoom: React.FC<WagashiTeaRoomProps> = ({
  onSelectDay,
  onEnterGarden,
  onBackToLanding,
}) => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [isPouring, setIsPouring] = useState(false);
  const [teaFilled, setTeaFilled] = useState(false);

  const handleWagashiClick = (item: WagashiItem) => {
    sounds.playFurinChime(0.6);
    sounds.playSoftClick();
    onSelectDay(item.day);
  };

  const handleTeapotClick = () => {
    if (isPouring) return;
    setIsPouring(true);
    sounds.playTeaPour(2.4);

    // Tea starts filling the cup as stream hits
    setTimeout(() => {
      setTeaFilled(true);
    }, 450);

    setTimeout(() => {
      sounds.playFurinChime(0.8);
      onEnterGarden();
    }, 3100);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden select-none flex flex-col justify-center items-center">
      {/* Background Checkered Tablecloth (matching 2.png) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/background-2.png"
          alt="Checkered Tablecloth Background"
          fill
          priority
          className="object-cover object-[center_55%] pointer-events-none"
        />
      </div>

      {/* Pink Table Runner (matching 2.png) */}
      <div className="absolute inset-x-0 top-[10%] bottom-[10%] z-0 pointer-events-none opacity-95">
        <Image
          src="/assets/background-2-runner.png"
          alt="Pink Table Runner"
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      {/* Top Left: Back to Windchime Veranda */}
      <div className="fixed top-5 left-5 z-50">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm border border-stone-200/80 shadow-sm text-stone-600 hover:text-stone-900 text-xs font-serif transition-all hover:scale-105 active:scale-95"
        >
          <span>🎐 Windchime Veranda</span>
        </button>
      </div>

      {/* Main Content Area (Layout matching 2.png) */}
      <div className="relative z-10 w-full max-w-[1500px] h-full flex flex-col md:flex-row items-center justify-between px-4 sm:px-8 md:px-12 py-8">

        {/* Left Side: 3x3 Wagashi Grid (Even bigger wagashi, clean without captions) */}
        <div className="w-full md:w-[56%] max-w-[840px] flex items-center justify-center">
          <div className="grid grid-cols-3 gap-0 w-full p-0">
            {WAGASHI_LIST.map((item) => {
              const isHovered = hoveredId === item.id;
              return (
                <div
                  key={item.id}
                  className="relative flex items-center justify-center group"
                  onMouseEnter={() => {
                    setHoveredId(item.id);
                    sounds.playSoftClick();
                  }}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <button
                    onClick={() => handleWagashiClick(item)}
                    className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-52 lg:h-52 xl:w-56 xl:h-56 flex items-center justify-center p-1 rounded-2xl transition-all duration-300 transform group-hover:scale-110 active:scale-95 cursor-pointer outline-none focus:outline-none"
                    aria-label={item.name}
                  >
                    {/* Soft halo on hover */}
                    <div
                      className={`absolute inset-2 rounded-full bg-pink-300/30 blur-2xl transition-opacity duration-300 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'
                        }`}
                    />

                    {/* Wagashi Image (Extra Large) */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 160px, 240px"
                        priority
                        className="object-contain filter drop-shadow-md transition-transform duration-300 group-hover:-translate-y-2"
                      />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Teapot & Teacup */}
        <div className="w-full md:w-[44%] h-[460px] md:h-[580px] lg:h-[660px] relative flex items-center justify-center overflow-visible">

          {/* Teapot (Upper Right, placed to the right edge) */}
          <div className="absolute top-1 right-[-10px] md:top-2 md:right-[-30px] lg:top-4 lg:right-[-40px] xl:right-[-50px] z-20">
            <button
              onClick={handleTeapotClick}
              disabled={isPouring}
              className={`group relative cursor-pointer outline-none focus:outline-none transition-transform duration-500 ${isPouring
                ? '-rotate-[26deg] translate-x-[-35px] translate-y-[22px]'
                : 'hover:scale-105 active:scale-95'
                }`}
              title="Click to pour tea and enter the Sakura garden"
            >
              {/* Glow when ready */}
              <div className="absolute inset-4 rounded-full bg-emerald-200/40 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative w-68 h-68 sm:w-80 sm:h-80 md:w-[400px] md:h-[400px] lg:w-[470px] lg:h-[470px] xl:w-[520px] xl:h-[520px]">
                <Image
                  src="/assets/drawn-japanese-teapot.png"
                  alt="Japanese Teapot"
                  fill
                  priority
                  className="object-contain filter drop-shadow-xl"
                />
              </div>
            </button>

            {/* Clean Pouring Stream (flowing into the teacup without glowing dots) */}
            {isPouring && (
              <div className="absolute top-[65%] left-[5%] w-3.5 h-48 z-30 pointer-events-none">
                <div className="w-3 h-full bg-linear-to-b from-tea-600/90 via-emerald-500/90 to-tea-700/85 rounded-full blur-[0.4px] animate-pulse transform -rotate-[22deg] shadow-xs" />
              </div>
            )}
          </div>

          {/* Teacup (Lower Left relative to Teapot, fills up smoothly without altering the cup rim or outer shadow) */}
          <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 lg:bottom-10 lg:left-12 z-10">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-60 lg:h-60 filter drop-shadow-md">

              {/* 1. Base Empty Ceramic Teacup (edges and saucer remain constant throughout) */}
              <Image
                src="/assets/drawn-japanese-teacup-empty.png"
                alt="Japanese Teacup"
                fill
                priority
                className="object-contain pointer-events-none"
              />

              {/* 2. Isolated Tea Liquid Layer (fills strictly inside the cup bowl r <= 23.9%, never touching or darkening edges) */}
              <div
                className="absolute inset-0 pointer-events-none transition-all duration-[1400ms] ease-out"
                style={{
                  clipPath: teaFilled
                    ? 'circle(23.9% at 50% 50%)'
                    : isPouring
                      ? 'circle(10% at 50% 50%)'
                      : 'circle(0% at 50% 50%)',
                  opacity: teaFilled ? 1 : isPouring ? 0.85 : 0,
                }}
              >
                <Image
                  src="/assets/tea-liquid.png"
                  alt="Green Tea Liquid"
                  fill
                  priority
                  className="object-contain"
                />
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
