'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { DAYS_JOURNAL } from '../data/journalData';
import { PolaroidPhoto } from '../types';
import { sounds } from '../utils/audio';

interface PolaroidJournalProps {
  initialDay: number;
  onBackToTeaRoom: () => void;
  onGoToDrawing: () => void;
}

export const PolaroidJournal: React.FC<PolaroidJournalProps> = ({
  initialDay,
  onBackToTeaRoom,
  onGoToDrawing,
}) => {
  const [currentDay, setCurrentDay] = useState<number>(initialDay);
  const [showDayTitle, setShowDayTitle] = useState<boolean>(true);
  const [activePhoto, setActivePhoto] = useState<PolaroidPhoto | null>(null);
  const [userPhotos, setUserPhotos] = useState<{ [day: number]: PolaroidPhoto[] }>({});

  const dayData = DAYS_JOURNAL.find((d) => d.day === currentDay) || DAYS_JOURNAL[0];
  const photos = [...(userPhotos[currentDay] || []), ...dayData.photos].slice(0, 3);

  const handlePrevDay = () => {
    sounds.playWindWhisper(1.0);
    sounds.playFurinChime(0.3);
    setCurrentDay((prev) => (prev > 1 ? prev - 1 : 9));
    setShowDayTitle(true);
    setTimeout(() => setShowDayTitle(false), 900);
  };

  const handleNextDay = () => {
    sounds.playWindWhisper(1.0);
    sounds.playFurinChime(0.3);
    setCurrentDay((prev) => (prev < 9 ? prev + 1 : 1));
    setShowDayTitle(true);
    setTimeout(() => setShowDayTitle(false), 900);
  };

  const handlePhotoClick = (photo: PolaroidPhoto) => {
    sounds.playShutter();
    setActivePhoto(photo);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        sounds.playShutter();
        const newPhoto: PolaroidPhoto = {
          id: `custom-${Date.now()}`,
          title: `My Memory · Day ${currentDay}`,
          caption: 'Handcrafted travel memory captured during our journey.',
          location: 'Japan Memory Journal',
          imageUrl: result,
          date: `Day ${currentDay} · Just now`,
        };
        setUserPhotos((prev) => ({
          ...prev,
          [currentDay]: [newPhoto, ...(prev[currentDay] || [])],
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-sky-50 flex flex-col justify-center items-center">
      {/* Background Watercolor Sky (matching 3.png & 4.png) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/background-3.png"
          alt="Watercolor Sky Background"
          fill
          priority
          className="object-cover object-center pointer-events-none"
        />
      </div>

      {/* Top Right Back Button (matching round.png in 3.png & 4.png) */}
      <div className="absolute top-6 right-6 md:top-8 md:right-10 z-30">
        <button
          onClick={() => {
            sounds.playSoftClick();
            onBackToTeaRoom();
          }}
          className="group relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center cursor-pointer outline-none focus:outline-none transition-transform duration-300 hover:scale-110 active:scale-95"
          title="Return to Tea Table"
        >
          {/* round.png asset */}
          <div className="relative w-full h-full">
            <Image
              src="/assets/round.png"
              alt="Back to Tea Table"
              fill
              className="object-contain filter drop-shadow-sm opacity-90 group-hover:opacity-100"
            />
          </div>
          <span className="absolute inset-0 flex items-center justify-center text-rose-800 text-xs font-serif font-semibold opacity-70 group-hover:opacity-100 transition-opacity">
            ✕
          </span>
        </button>
      </div>

      {/* Top Left Day Switcher Pill */}
      <div className="absolute top-6 left-6 md:top-8 md:left-10 z-30 flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-pink-100/80 shadow-xs">
          <span className="text-xs font-serif text-stone-500 uppercase tracking-widest">
            Journal of
          </span>
          <span className="text-xs font-serif font-bold text-pink-700">
            Day {currentDay}
          </span>
          <span className="text-xs text-stone-400">·</span>
          <span className="text-xs font-serif text-stone-600 italic">
            {dayData.wagashi.name}
          </span>
        </div>

        {/* Upload Button */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 hover:bg-white backdrop-blur-sm border border-stone-200/80 text-[11px] font-serif text-stone-600 hover:text-stone-900 cursor-pointer shadow-2xs transition-all">
          <span>+ Add Photo</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCustomUpload}
          />
        </label>
      </div>

      {/* Day Title Overlay Screen (matching 3.png) */}
      {showDayTitle && (
        <div
          onClick={() => setShowDayTitle(false)}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-sky-900/10 backdrop-blur-[2px] cursor-pointer animate-fade-in transition-opacity duration-700"
        >
          <div className="flex items-center justify-center gap-3 transform -translate-y-4">
            {/* Calligraphy 'Day' */}
            <div className="relative w-48 h-32 md:w-64 md:h-44">
              <Image
                src="/assets/day.png"
                alt="Day"
                fill
                priority
                className="object-contain filter drop-shadow-sm"
              />
            </div>
            {/* Calligraphy Number from cropped assets */}
            <div className="relative w-16 h-28 md:w-20 md:h-36">
              <Image
                src={`/assets/digits/${currentDay}.png`}
                alt={`Day ${currentDay}`}
                fill
                priority
                className="object-contain filter drop-shadow-sm"
              />
            </div>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.3em] font-serif text-pink-900/80">
            {dayData.theme}
          </p>
          <span className="mt-4 text-[11px] text-stone-500 font-serif italic">
            Tap anywhere to view polaroids
          </span>
        </div>
      )}

      {/* Main 3-Polaroid Container (Layout strictly matching 4.png) */}
      <div className="relative z-10 w-full max-w-6xl flex items-center justify-between px-2 md:px-8">
        
        {/* Left Arrow: Watercolor Sakura Petal (matching 4.png) */}
        <button
          onClick={handlePrevDay}
          className="group relative w-12 h-16 md:w-16 md:h-24 flex items-center justify-center cursor-pointer outline-none focus:outline-none transition-transform duration-300 hover:scale-115 active:scale-95"
          title="Previous Day"
        >
          <div className="relative w-full h-full transform -rotate-90 group-hover:-translate-x-1 transition-transform">
            <Image
              src="/assets/sakura-petal.png"
              alt="Previous Day"
              fill
              className="object-contain filter drop-shadow-sm opacity-85 group-hover:opacity-100"
            />
          </div>
        </button>

        {/* 3 Polaroids in a row (matching 4.png) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 px-2 md:px-4 py-8">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => handlePhotoClick(photo)}
              className="group cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:rotate-0"
              style={{
                transform: `rotate(${index === 0 ? -1.5 : index === 2 ? 1.8 : -0.5}deg)`,
              }}
            >
              {/* Polaroid Card */}
              <div className="bg-white p-3 pb-8 md:pb-10 rounded-xs shadow-lg hover:shadow-2xl border border-stone-100 transition-all duration-300 flex flex-col">
                {/* Photo Area */}
                <div className="relative w-full aspect-4/5 bg-stone-100 overflow-hidden rounded-xs">
                  <Image
                    src={photo.imageUrl}
                    alt={photo.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-pink-900/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Polaroid Bottom Margin with handwritten note */}
                <div className="mt-3 px-1 flex flex-col">
                  <span className="font-serif text-xs md:text-sm text-stone-800 tracking-wide font-medium truncate">
                    {photo.title}
                  </span>
                  <span className="text-[10px] md:text-[11px] font-serif text-stone-500 italic mt-0.5 truncate">
                    {photo.location}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Arrow: Watercolor Sakura Petal (matching 4.png) */}
        <button
          onClick={handleNextDay}
          className="group relative w-12 h-16 md:w-16 md:h-24 flex items-center justify-center cursor-pointer outline-none focus:outline-none transition-transform duration-300 hover:scale-115 active:scale-95"
          title="Next Day"
        >
          <div className="relative w-full h-full transform rotate-90 group-hover:translate-x-1 transition-transform">
            <Image
              src="/assets/sakura-petal.png"
              alt="Next Day"
              fill
              className="object-contain filter drop-shadow-sm opacity-85 group-hover:opacity-100"
            />
          </div>
        </button>

      </div>

      {/* Bottom Floating Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        {/* Day Jump Dots */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-pink-100/80 shadow-xs">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button
              key={d}
              onClick={() => {
                sounds.playSoftClick();
                setCurrentDay(d);
                setShowDayTitle(true);
                setTimeout(() => setShowDayTitle(false), 900);
              }}
              className={`w-5 h-5 rounded-full text-[10px] font-serif flex items-center justify-center transition-all ${
                currentDay === d
                  ? 'bg-pink-600 text-white font-bold scale-110 shadow-xs'
                  : 'text-stone-600 hover:bg-pink-100'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Draw a flower CTA button */}
        <button
          onClick={() => {
            sounds.playFurinChime(0.6);
            onGoToDrawing();
          }}
          className="px-4 py-1.5 rounded-full bg-linear-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white text-xs font-serif shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          🌸 Draw a Flower
        </button>
      </div>

      {/* Lightbox Modal for Full Photo View */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="bg-white p-4 md:p-6 pb-8 rounded-sm shadow-2xl max-w-lg w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full aspect-4/5 rounded-xs overflow-hidden bg-stone-100">
              <Image
                src={activePhoto.imageUrl}
                alt={activePhoto.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="mt-4 text-center w-full">
              <h3 className="font-serif text-lg text-stone-800 font-medium">
                {activePhoto.title}
              </h3>
              <p className="text-xs font-serif text-pink-700 italic mt-1">
                {activePhoto.location} · {activePhoto.date}
              </p>
              <p className="text-xs font-serif text-stone-600 mt-2 px-4 leading-relaxed">
                {activePhoto.caption}
              </p>
            </div>
            <button
              onClick={() => setActivePhoto(null)}
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
