'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { DAYS_JOURNAL } from '../data/journalData';
import { PolaroidPhoto } from '../types';
import { sounds } from '../utils/audio';

interface PolaroidJournalProps {
  initialDay: number;
  onBackToTeaRoom: () => void;
  onGoToDrawing: () => void; // kept for interface compatibility
}

const GAP = 16; // px gap between cards
// Fixed slight rotation per photo index — stays consistent as the photo moves through slots
const ROTATIONS = [-2, 1.5, -1.2, 2, -1.8, 1, -2.5, 1.8, -0.8];

export const PolaroidJournal: React.FC<PolaroidJournalProps> = ({
  initialDay,
  onBackToTeaRoom,
}) => {
  const dayData = DAYS_JOURNAL.find((d) => d.day === initialDay) || DAYS_JOURNAL[0];
  const photos = dayData.photos;
  const total = photos.length;

  const [centerIndex, setCenterIndex] = useState(0);
  // Offset: 0 = idle; -unit = animated one step next; +unit = animated one step prev
  const [slideOffset, setSlideOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [withTransition, setWithTransition] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<PolaroidPhoto | null>(null);

  // Measure the clipping window to derive card width responsively
  const windowRef = useRef<HTMLDivElement>(null);
  const [cardW, setCardW] = useState(220);
  const unit = cardW + GAP;

  useEffect(() => {
    const measure = () => {
      if (windowRef.current) {
        const w = windowRef.current.offsetWidth;
        setCardW(Math.floor((w - GAP * 2) / 3));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (windowRef.current) ro.observe(windowRef.current);
    return () => ro.disconnect();
  }, []);

  // Touch swipe tracking
  const touchStartX = useRef(0);

  // 5 rendered slots: [ci-2, ci-1, ci, ci+1, ci+2]
  // Track base offset = -unit (puts slot-index-1 at x=0 of window → shows slots 1,2,3)
  const trackX = -unit + slideOffset;

  const slots = [-2, -1, 0, 1, 2].map((d, i) => ({
    photoIdx: (centerIndex + d + total * 10) % total,
    slotPos: i, // 0..4; slotPos 2 = center
  }));

  const goDir = useCallback(
    (dir: 1 | -1) => {
      if (animating || total <= 1) return;
      sounds.playWindWhisper(0.4);
      setAnimating(true);
      setWithTransition(true);
      setSlideOffset(-dir * unit); // dir 1 → slide left; dir -1 → slide right
    },
    [animating, total, unit],
  );

  const handleTransitionEnd = useCallback(() => {
    if (!animating) return;
    const dir = slideOffset < 0 ? 1 : -1;
    // Snap back without transition, update center
    setWithTransition(false);
    setSlideOffset(0);
    setCenterIndex((i) => (i + dir + total) % total);
    setAnimating(false);
  }, [animating, slideOffset, total]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40) goDir(1);
    else if (dx > 40) goDir(-1);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-sky-50 flex flex-col justify-center items-center">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/background-3.png"
          alt=""
          fill
          priority
          className="object-cover object-center pointer-events-none"
        />
      </div>

      {/* Top Center: Calligraphy Digit */}
      <div className="absolute top-2 md:top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="relative w-8 h-14 sm:w-10 sm:h-16 md:w-12 md:h-20">
          <Image
            src={`/assets/digits/${initialDay}.png`}
            alt={`Day ${initialDay}`}
            fill
            priority
            className="object-contain drop-shadow-sm animate-fade-in"
          />
        </div>
      </div>

      {/* Top Right: Back Button */}
      <div className="absolute top-6 right-6 md:top-8 md:right-10 z-30">
        <button
          onClick={() => { sounds.playSoftClick(); onBackToTeaRoom(); }}
          className="group relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center cursor-pointer outline-none focus:outline-none transition-transform hover:scale-110 active:scale-95"
          title="Return to Tea Table"
        >
          <div className="relative w-full h-full">
            <Image
              src="/assets/round.png"
              alt="Back"
              fill
              className="object-contain drop-shadow-sm opacity-90 group-hover:opacity-100"
            />
          </div>
          <span className="absolute inset-0 flex items-center justify-center text-rose-800 text-xs font-serif font-semibold opacity-70 group-hover:opacity-100 transition-opacity">
            ✕
          </span>
        </button>
      </div>

      {/* Carousel row: left petal | clip window | right petal */}
      <div className="relative z-10 flex items-center gap-2 md:gap-4 mt-14 md:mt-16 w-full max-w-4xl px-4 justify-center">

        {/* Left petal */}
        <button
          onClick={() => goDir(-1)}
          disabled={total <= 1}
          className="group relative w-10 h-14 md:w-14 md:h-20 flex-shrink-0 outline-none focus:outline-none transition-transform hover:scale-110 active:scale-95 disabled:opacity-20 disabled:cursor-default cursor-pointer"
          title="Previous"
        >
          <div className="relative w-full h-full -rotate-90 group-hover:-translate-x-0.5 transition-transform duration-200">
            <Image src="/assets/sakura-petal.png" alt="Prev" fill className="object-contain opacity-85 group-hover:opacity-100" />
          </div>
        </button>

        {/* Clipping window — width = exactly 3 cards + 2 gaps */}
        <div
          ref={windowRef}
          className="overflow-hidden flex-1"
          style={{ maxWidth: `${3 * 240 + 2 * GAP}px` }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Sliding track: 5 cards wide */}
          <div
            className="flex"
            style={{
              gap: `${GAP}px`,
              transform: `translateX(${trackX}px)`,
              transition: withTransition
                ? 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                : 'none',
              willChange: 'transform',
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {slots.map(({ photoIdx, slotPos }) => {
              const photo = photos[photoIdx];
              const isCenter = slotPos === 2;
              const rotation = ROTATIONS[photoIdx % ROTATIONS.length];

              return (
                <div
                  key={slotPos}
                  style={{
                    width: `${cardW}px`,
                    flexShrink: 0,
                    transform: `rotate(${rotation}deg)`,
                  }}
                  className="cursor-pointer"
                  onClick={() => {
                    if (animating) return;
                    if (isCenter) { sounds.playShutter(); setLightboxPhoto(photo); }
                    else if (slotPos < 2) goDir(-1);
                    else goDir(1);
                  }}
                >
                  <div className="bg-white p-3 pb-12 md:pb-14 rounded-xs shadow-lg border border-stone-100 hover:shadow-xl transition-shadow duration-300">
                    <div className="relative w-full aspect-[4/5] bg-stone-100 overflow-hidden rounded-xs">
                      <Image
                        src={photo.imageUrl}
                        alt={photo.title}
                        fill
                        sizes={`${cardW}px`}
                        className="object-cover object-center"
                      />
                    </div>
                    <div className="mt-2 px-1">
                      <p className="font-serif text-sm text-stone-800 tracking-wide font-medium leading-snug truncate">
                        {photo.title}
                      </p>
                      {isCenter && photo.caption && (
                        <p className="text-[10px] font-serif text-stone-500 italic mt-0.5 leading-relaxed line-clamp-2">
                          {photo.caption}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right petal */}
        <button
          onClick={() => goDir(1)}
          disabled={total <= 1}
          className="group relative w-10 h-14 md:w-14 md:h-20 flex-shrink-0 outline-none focus:outline-none transition-transform hover:scale-110 active:scale-95 disabled:opacity-20 disabled:cursor-default cursor-pointer"
          title="Next"
        >
          <div className="relative w-full h-full rotate-90 group-hover:translate-x-0.5 transition-transform duration-200">
            <Image src="/assets/sakura-petal.png" alt="Next" fill className="object-contain opacity-85 group-hover:opacity-100" />
          </div>
        </button>
      </div>

      {/* Counter dots */}
      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-pink-100/60 shadow-xs">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (animating) return;
                sounds.playSoftClick();
                // Animate toward target by stepping one at a time feels odd;
                // just snap directly for dot clicks
                setWithTransition(false);
                setSlideOffset(0);
                setCenterIndex(i);
              }}
              className={`rounded-full transition-all duration-200 ${
                i === centerIndex
                  ? 'w-4 h-2 bg-pink-500'
                  : 'w-2 h-2 bg-stone-300 hover:bg-pink-300'
              }`}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="bg-white p-4 md:p-6 pb-8 rounded-sm shadow-2xl max-w-lg w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full aspect-[4/5] rounded-xs overflow-hidden bg-stone-100">
              <Image src={lightboxPhoto.imageUrl} alt={lightboxPhoto.title} fill className="object-cover" />
            </div>
            <div className="mt-4 text-center w-full px-2">
              <h3 className="font-serif text-lg text-stone-800 font-medium leading-snug">
                {lightboxPhoto.title}
              </h3>
              {lightboxPhoto.caption && (
                <p className="text-xs font-serif text-stone-600 mt-2 leading-relaxed">
                  {lightboxPhoto.caption}
                </p>
              )}
              {lightboxPhoto.location && (
                <p className="text-[11px] font-serif text-pink-700 italic mt-1">
                  {lightboxPhoto.location}
                </p>
              )}
            </div>
            <button
              onClick={() => setLightboxPhoto(null)}
              className="mt-5 px-6 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-serif transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
