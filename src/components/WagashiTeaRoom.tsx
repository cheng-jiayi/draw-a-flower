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
  const [hoveredWagashi, setHoveredWagashi] = useState<WagashiItem | null>(null);
  const [isPouring, setIsPouring] = useState(false);
  const [teaFilled, setTeaFilled] = useState(false);
  const [pourMessage, setPourMessage] = useState<string | null>(null);

  const handleWagashiClick = (item: WagashiItem) => {
    sounds.playFurinChime(0.6);
    sounds.playSoftClick();
    onSelectDay(item.day);
  };

  const handleTeapotClick = () => {
    if (isPouring) return;
    setIsPouring(true);
    sounds.playTeaPour(2.4);

    // Teacup filling animation
    setTimeout(() => {
      setTeaFilled(true);
      setPourMessage('Fresh sencha green tea is poured... Taking you to the Sakura Garden');
    }, 1200);

    setTimeout(() => {
      sounds.playFurinChime(0.8);
      onEnterGarden();
    }, 2800);
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
          className="object-cover object-center pointer-events-none"
        />
      </div>

      {/* Pink Table Runner (matching 2.png) */}
      <div className="absolute inset-x-0 top-[12%] bottom-[12%] z-0 pointer-events-none opacity-95">
        <Image
          src="/assets/background-2-runner.png"
          alt="Pink Table Runner"
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      {/* Top Bar Navigation */}
      <div className="absolute top-4 left-6 right-6 z-30 flex items-center justify-between">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-stone-200/80 shadow-xs text-stone-600 hover:text-stone-900 text-xs font-serif tracking-wider transition-all duration-200 hover:bg-white"
        >
          <span className="text-sm">←</span>
          <span>Windchime Veranda</span>
        </button>

        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500 font-serif">
            9 Days in Japan · Click a sweet to open the day&apos;s memories
          </p>
        </div>

        <div className="w-24 flex justify-end">
          <span className="text-xs text-stone-400 font-serif italic">Tea &amp; Wagashi</span>
        </div>
      </div>

      {/* Main Content Area (Layout matching 2.png) */}
      <div className="relative z-10 w-full max-w-6xl h-full flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-16">
        
        {/* Left Side: 3x3 Wagashi Grid (matching 2.png) */}
        <div className="w-full md:w-[54%] max-w-[560px] flex flex-col items-center">
          <div className="grid grid-cols-3 gap-3 md:gap-5 lg:gap-6 w-full p-4">
            {WAGASHI_LIST.map((item) => {
              const isHovered = hoveredWagashi?.id === item.id;
              return (
                <div
                  key={item.id}
                  className="relative flex flex-col items-center justify-center group"
                  onMouseEnter={() => {
                    setHoveredWagashi(item);
                    sounds.playSoftClick();
                  }}
                  onMouseLeave={() => setHoveredWagashi(null)}
                >
                  <button
                    onClick={() => handleWagashiClick(item)}
                    className="relative w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 flex items-center justify-center p-2 rounded-2xl transition-all duration-300 transform group-hover:scale-110 active:scale-95 cursor-pointer outline-none focus:outline-none"
                  >
                    {/* Soft halo on hover */}
                    <div
                      className={`absolute inset-0 rounded-full bg-pink-300/25 blur-lg transition-opacity duration-300 ${
                        isHovered ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    {/* Wagashi Image */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 100px, 140px"
                        priority
                        className="object-contain filter drop-shadow-md transition-transform duration-300 group-hover:-translate-y-1"
                      />
                    </div>

                    {/* Small Day Badge */}
                    <span className="absolute -top-1 -left-1 px-2 py-0.5 rounded-full bg-white/90 border border-pink-100 text-[10px] font-serif text-stone-600 shadow-2xs group-hover:bg-pink-500 group-hover:text-white transition-colors duration-200">
                      Day {item.day}
                    </span>
                  </button>

                  {/* Name Label */}
                  <span className="mt-1 text-center text-xs font-serif text-stone-700 tracking-wide group-hover:text-pink-700 transition-colors">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hover Details Card at bottom */}
          <div className="h-10 mt-2 flex items-center justify-center">
            {hoveredWagashi ? (
              <div className="px-4 py-1.5 rounded-full bg-white/85 backdrop-blur-sm border border-pink-100 shadow-sm text-center animate-fade-in">
                <span className="text-xs font-serif text-pink-800 font-medium">
                  Day {hoveredWagashi.day} · {hoveredWagashi.kanji} ({hoveredWagashi.name}):
                </span>{' '}
                <span className="text-xs font-serif text-stone-600 italic">
                  {hoveredWagashi.flavor}
                </span>
              </div>
            ) : (
              <p className="text-xs text-stone-500 font-serif italic opacity-75">
                Hover over a sweet to discover its story · Click to open Day Journal
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Teapot & Teacup (matching 2.png) */}
        <div className="w-full md:w-[42%] flex flex-col items-center justify-center relative min-h-[380px]">
          
          {/* Teapot */}
          <div className="relative mb-2">
            <button
              onClick={handleTeapotClick}
              disabled={isPouring}
              className={`group relative cursor-pointer outline-none focus:outline-none transition-transform duration-500 ${
                isPouring
                  ? '-rotate-[28deg] translate-x-[-24px] translate-y-[14px]'
                  : 'hover:scale-105 active:scale-95'
              }`}
              title="Click to pour tea and wander into the Sakura garden"
            >
              {/* Glow when ready */}
              <div className="absolute inset-0 rounded-full bg-emerald-200/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative w-44 h-44 md:w-56 md:h-56 lg:w-64 lg:h-64">
                <Image
                  src="/assets/drawn-japanese-teapot.png"
                  alt="Japanese Teapot"
                  fill
                  priority
                  className="object-contain filter drop-shadow-lg"
                />
              </div>

              {!isPouring && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-white/90 border border-emerald-100 shadow-xs text-[11px] font-serif text-emerald-800 group-hover:bg-emerald-50 transition-colors">
                  Tap teapot to pour tea
                </div>
              )}
            </button>

            {/* Dynamic Pouring Stream (when pouring) */}
            {isPouring && (
              <div className="absolute top-[68%] left-[10%] w-2 h-36 z-20 pointer-events-none">
                <div className="w-2.5 h-full bg-linear-to-b from-tea-600/80 via-emerald-400/90 to-tea-700/80 rounded-full blur-[0.6px] animate-pulse transform -rotate-[12deg] shadow-xs" />
                {/* Tea droplets */}
                <div className="absolute bottom-1 left-0 w-3 h-3 rounded-full bg-emerald-300/70 animate-ping" />
              </div>
            )}
          </div>

          {/* Teacup (with filling animation) */}
          <div className="relative mt-2">
            <div className="relative w-36 h-36 md:w-44 md:h-44 lg:w-48 lg:h-48">
              {/* Base Teacup */}
              <Image
                src="/assets/drawn-japanese-teacup.png"
                alt="Japanese Teacup"
                fill
                priority
                className="object-contain filter drop-shadow-md"
              />

              {/* Liquid fill overlay effect when tea is poured */}
              <div
                className={`absolute inset-[24%] rounded-full bg-linear-to-br from-emerald-400/60 via-tea-600/70 to-emerald-700/60 blur-[1px] transition-all duration-1000 ${
                  teaFilled ? 'opacity-90 scale-100' : 'opacity-0 scale-50'
                }`}
              />

              {/* Rising Steam when filled */}
              {teaFilled && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-8 bg-white/40 rounded-full blur-[1px] animate-float"
                      style={{
                        animationDelay: `${i * 0.35}s`,
                        animationDuration: '2.2s',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Toast / Status Prompt */}
          {pourMessage && (
            <div className="absolute -bottom-8 px-5 py-2 rounded-full bg-white/95 border border-pink-200 shadow-md text-stone-700 text-xs font-serif tracking-wider animate-bounce">
              🌸 {pourMessage}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
