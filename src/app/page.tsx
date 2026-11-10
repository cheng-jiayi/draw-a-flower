'use client';

import React, { useState } from 'react';
import { WindchimeLanding } from '../components/WindchimeLanding';
import { WagashiTeaRoom } from '../components/WagashiTeaRoom';
import { PolaroidJournal } from '../components/PolaroidJournal';
import { SakuraDrawingCanvas } from '../components/SakuraDrawingCanvas';
import { BlossomWindGarden } from '../components/BlossomWindGarden';
import { sounds } from '../utils/audio';

type Scene = 'landing' | 'tearoom' | 'journal' | 'drawing' | 'garden';

export default function Home() {
  const [currentScene, setCurrentScene] = useState<Scene>('landing');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [flowerImages, setFlowerImages] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.setMuted(nextMuted);
    if (!nextMuted) {
      sounds.playFurinChime(0.5);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    setCurrentScene('journal');
  };

  const handleFlowerAccepted = (flowerDataUrl: string) => {
    setFlowerImages((prev) => [...prev, flowerDataUrl]);
    setCurrentScene('garden');
  };

  return (
    <main className="relative w-full h-screen overflow-y-auto overflow-x-hidden md:overflow-hidden">
      {/* Sound Mute / Unmute Toggle Button */}
      <button
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        className="fixed bottom-4 right-4 z-50 p-2.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm border border-stone-200/80 shadow-md text-stone-700 hover:text-stone-900 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
        title={isMuted ? 'Unmute Furin Chime & Ambience' : 'Mute Sound'}
      >
        <span className="text-sm">
          {isMuted ? '🔇' : '🎐'}
        </span>
      </button>

      {/* Dynamic Scene Rendering with Smooth Transitions */}
      {currentScene === 'landing' && (
        <WindchimeLanding onEnter={() => setCurrentScene('tearoom')} />
      )}

      {currentScene === 'tearoom' && (
        <WagashiTeaRoom
          onSelectDay={handleSelectDay}
          onEnterGarden={() => setCurrentScene('drawing')}
          onBackToLanding={() => setCurrentScene('landing')}
        />
      )}

      {currentScene === 'journal' && (
        <PolaroidJournal
          initialDay={selectedDay}
          onBackToTeaRoom={() => setCurrentScene('tearoom')}
          onGoToDrawing={() => setCurrentScene('drawing')}
        />
      )}

      {currentScene === 'drawing' && (
        <SakuraDrawingCanvas
          onFlowerAccepted={handleFlowerAccepted}
          onBackToTeaRoom={() => setCurrentScene('tearoom')}
        />
      )}

      {currentScene === 'garden' && (
        <BlossomWindGarden
          flowerImages={flowerImages}
          onDrawAnother={() => setCurrentScene('drawing')}
          onBackToTeaRoom={() => setCurrentScene('tearoom')}
          onBackToLanding={() => setCurrentScene('landing')}
        />
      )}
    </main>
  );
}

