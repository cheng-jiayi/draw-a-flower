'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { sounds } from '../utils/audio';

interface BlossomWindGardenProps {
  flowerImages: string[];
  onDrawAnother: () => void;
  onBackToTeaRoom: () => void;
  onBackToLanding: () => void;
}

interface Particle {
  id: number;
  image: HTMLImageElement | null;
  isCustom: boolean;
  x: number;
  y: number;
  baseSize: number;
  vx: number;
  vy: number;
  tilt: number;
  tiltSpeed: number;
  angle: number;
  angleSpeed: number;
  wobblePhase: number;
  opacity: number;
}

export const BlossomWindGarden: React.FC<BlossomWindGardenProps> = ({
  flowerImages,
  onDrawAnother,
  onBackToTeaRoom,
  onBackToLanding,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [windIntensity, setWindIntensity] = useState<'calm' | 'breeze' | 'gust'>('breeze');
  const [flowerCount, setFlowerCount] = useState(flowerImages.length);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const petalImgRef = useRef<HTMLImageElement | null>(null);
  const customImgRefs = useRef<HTMLImageElement[]>([]);

  // Preload custom flower images and petal asset
  useEffect(() => {
    const petal = new window.Image();
    petal.src = '/assets/sakura-petal.png';
    petalImgRef.current = petal;

    const loadedImgs: HTMLImageElement[] = [];
    flowerImages.forEach((src) => {
      const img = new window.Image();
      img.src = src;
      loadedImgs.push(img);
    });
    customImgRefs.current = loadedImgs;
    setFlowerCount(flowerImages.length);
  }, [flowerImages]);

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    const totalCount = 28 + flowerImages.length * 8;

    for (let i = 0; i < totalCount; i++) {
      const isCustom = i % 2 === 0 && customImgRefs.current.length > 0;
      const customImg = isCustom
        ? customImgRefs.current[Math.floor(Math.random() * customImgRefs.current.length)]
        : null;

      particles.push({
        id: i,
        image: isCustom ? customImg : petalImgRef.current,
        isCustom,
        x: Math.random() * (width + 200) - 100,
        y: Math.random() * (height + 200) - 200,
        baseSize: isCustom ? 45 + Math.random() * 40 : 20 + Math.random() * 25,
        vx: 0.8 + Math.random() * 1.6,
        vy: 0.9 + Math.random() * 1.4,
        tilt: Math.random() * Math.PI * 2,
        tiltSpeed: 0.015 + Math.random() * 0.03,
        angle: Math.random() * Math.PI * 2,
        angleSpeed: (Math.random() - 0.5) * 0.03,
        wobblePhase: Math.random() * Math.PI * 2,
        opacity: 0.7 + Math.random() * 0.3,
      });
    }

    particlesRef.current = particles;
  }, [flowerImages.length]);

  // Handle canvas resize and wind simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(canvas.width, canvas.height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const windMult =
        windIntensity === 'calm' ? 0.6 : windIntensity === 'gust' ? 2.2 : 1.2;

      particlesRef.current.forEach((p) => {
        p.tilt += p.tiltSpeed;
        p.angle += p.angleSpeed;
        p.wobblePhase += dt * 2.0;

        const wobbleX = Math.sin(p.wobblePhase) * 1.5;
        p.x += (p.vx * windMult + wobbleX);
        p.y += p.vy * (windIntensity === 'calm' ? 0.7 : 1.0);

        if (p.y > canvas.height + 60 || p.x > canvas.width + 60) {
          p.y = -60 - Math.random() * 100;
          p.x = Math.random() * (canvas.width * 1.1) - canvas.width * 0.2;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        const scaleX = Math.cos(p.tilt);
        ctx.scale(scaleX, 1);
        ctx.globalAlpha = p.opacity;

        if (p.image && p.image.complete && p.image.naturalWidth > 0) {
          const w = p.baseSize;
          const h = p.baseSize * (p.image.naturalHeight / p.image.naturalWidth);
          ctx.drawImage(p.image, -w / 2, -h / 2, w, h);
        } else {
          ctx.fillStyle = '#ffccd8';
          ctx.beginPath();
          ctx.ellipse(0, 0, p.baseSize * 0.4, p.baseSize * 0.25, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [windIntensity, initParticles]);

  // Stir the wind on click/drag
  const handleStirWind = (e: React.MouseEvent<HTMLDivElement>) => {
    sounds.playWindWhisper(1.8);
    sounds.playFurinChime(0.3);

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    particlesRef.current.forEach((p) => {
      const dx = p.x - clickX;
      const dy = p.y - clickY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 260) {
        p.vx += (dx / dist) * 4.5;
        p.vy -= 2.0;
        p.angleSpeed += (Math.random() - 0.5) * 0.15;
      }
    });
  };

  return (
    <div
      onClick={handleStirWind}
      className="relative w-full min-h-screen overflow-y-auto overflow-x-hidden md:h-screen md:overflow-hidden select-none bg-sky-50 flex flex-col justify-between pt-20 pb-20 md:py-6"
    >
      {/* Background Watercolor Sky */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/assets/background-3.png"
          alt="Watercolor Sky Landscape"
          fill
          priority
          className="object-cover object-center pointer-events-none"
        />
        <div className="absolute inset-0 bg-pink-50/20 backdrop-blur-[0.5px]" />
      </div>

      {/* Physics Falling Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-10 pointer-events-none"
      />

      {/* Top Left: Back to Wagashi & Tea */}
      <div className="fixed top-5 left-5 z-50 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBackToTeaRoom();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm border border-stone-200/80 shadow-sm text-stone-700 hover:text-stone-950 text-xs font-serif transition-all hover:scale-105 active:scale-95"
        >
          <span>🍵 Wagashi &amp; Tea</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBackToLanding();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm border border-stone-200/80 shadow-sm text-stone-600 hover:text-stone-900 text-xs font-serif transition-all hover:scale-105 active:scale-95"
        >
          <span>🎐 Windchime Veranda</span>
        </button>
      </div>

      {/* Top Right: Wind Speed Controls */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed top-5 right-5 z-50 flex items-center gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-full border border-stone-200/80 shadow-sm text-xs font-serif"
      >
        <span className="px-2 text-[10px] text-stone-400">Wind:</span>
        {(['calm', 'breeze', 'gust'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => {
              sounds.playSoftClick();
              setWindIntensity(mode);
            }}
            className={`px-3 py-1 rounded-full capitalize text-xs transition-all ${windIntensity === mode
              ? 'bg-pink-600 text-white font-medium shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
              }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Center Interactive Hint */}
      <div className="relative z-20 pointer-events-none text-center my-auto opacity-70">
        <p className="font-serif text-xs md:text-sm text-stone-600 tracking-widest drop-shadow-sm">
          Tap anywhere to stir the spring wind and scatter the petals
        </p>
      </div>

      {/* Bottom Action Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-30 flex items-center justify-center gap-4 p-6"
      >
        <button
          onClick={onDrawAnother}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-linear-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white text-xs md:text-sm font-serif shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <span>🌸 Draw Another Flower</span>
        </button>
      </div>
    </div>
  );
};
