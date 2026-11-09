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
    // Load petal asset
    const petal = new window.Image();
    petal.src = '/assets/sakura-petal.png';
    petalImgRef.current = petal;

    // Load custom flower images
    const loadedImgs: HTMLImageElement[] = [];
    flowerImages.forEach((src) => {
      const img = new window.Image();
      img.src = src;
      loadedImgs.push(img);
    });
    customImgRefs.current = loadedImgs;
    setFlowerCount(flowerImages.length);
  }, [flowerImages]);

  // Periodic chime in the wind
  useEffect(() => {
    const chimeInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        sounds.playFurinChime(0.4 + Math.random() * 0.4);
      }
    }, 7000);

    return () => clearInterval(chimeInterval);
  }, []);

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

    // Animation Loop
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const windMult =
        windIntensity === 'calm' ? 0.6 : windIntensity === 'gust' ? 2.2 : 1.2;

      particlesRef.current.forEach((p) => {
        // Physics update
        p.tilt += p.tiltSpeed;
        p.angle += p.angleSpeed;
        p.wobblePhase += dt * 2.0;

        const wobbleX = Math.sin(p.wobblePhase) * 1.5;
        p.x += (p.vx * windMult + wobbleX);
        p.y += p.vy * (windIntensity === 'calm' ? 0.7 : 1.0);

        // Reset if offscreen
        if (p.y > canvas.height + 60 || p.x > canvas.width + 60) {
          p.y = -60 - Math.random() * 100;
          p.x = Math.random() * (canvas.width * 1.1) - canvas.width * 0.2;
        }

        // Render particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        // Tumbling in 3D: scale along one axis simulates rotation towards viewer
        const scaleX = Math.cos(p.tilt);
        ctx.scale(scaleX, 1);
        ctx.globalAlpha = p.opacity;

        if (p.image && p.image.complete && p.image.naturalWidth > 0) {
          const w = p.baseSize;
          const h = p.baseSize * (p.image.naturalHeight / p.image.naturalWidth);
          ctx.drawImage(p.image, -w / 2, -h / 2, w, h);
        } else {
          // Fallback petal
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

  // Download Keepsake Postcard
  const handleDownloadKeepsake = () => {
    sounds.playFurinChime(0.8);
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 800);
    grad.addColorStop(0, '#eaf4fc');
    grad.addColorStop(1, '#fdeef2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 800);

    // Border
    ctx.strokeStyle = '#c48f9e';
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, 1140, 740);
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 45, 1110, 710);

    // Calligraphy Titles
    ctx.font = 'bold 38px "Playfair Display", Georgia, serif';
    ctx.fillStyle = '#6b3749';
    ctx.textAlign = 'center';
    ctx.fillText('Whisper of the Heart · 心のささやき', 600, 110);

    ctx.font = 'italic 20px "Playfair Display", Georgia, serif';
    ctx.fillStyle = '#8f6874';
    ctx.fillText('Handcrafted Cherry Blossom Keepsake', 600, 145);

    // Draw the latest flower in center
    const latestImg = customImgRefs.current[customImgRefs.current.length - 1];
    if (latestImg && latestImg.complete) {
      const size = 320;
      ctx.drawImage(latestImg, 600 - size / 2, 220, size, size);
    }

    // Japanese Hanko Stamp (Red Seal)
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(1030, 630, 70, 70);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(1034, 634, 62, 62);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Yu Mincho", serif';
    ctx.textAlign = 'center';
    ctx.fillText('桜', 1065, 660);
    ctx.fillText('華', 1065, 686);

    // Poetic Haiku
    ctx.font = 'italic 18px "Playfair Display", serif';
    ctx.fillStyle = '#615558';
    ctx.textAlign = 'center';
    ctx.fillText('“Petals drifting in the spring air, carrying silent wishes to the sky.”', 600, 680);

    // Trigger download
    const link = document.createElement('a');
    link.download = 'sakura-blossom-keepsake.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      onClick={handleStirWind}
      className="relative w-full h-screen overflow-hidden select-none bg-sky-50 flex flex-col justify-between"
    >
      {/* Background Watercolor Sky */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/background-long.png"
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
        className="absolute inset-0 z-10 pointer-events-none"
      />

      {/* Top Floating Controls */}
      <div className="relative z-30 flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBackToTeaRoom();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 hover:bg-white backdrop-blur-sm border border-stone-200 shadow-xs text-xs font-serif text-stone-700 transition-all hover:scale-105 active:scale-95"
          >
            <span>← Tea &amp; Wagashi Table</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBackToLanding();
            }}
            className="px-3 py-2 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm border border-stone-200 shadow-xs text-xs font-serif text-stone-600 transition-all"
          >
            🎐 Windchime
          </button>
        </div>

        {/* Center Title Badge */}
        <div className="text-center bg-white/70 backdrop-blur-sm px-5 py-2 rounded-full border border-pink-100/80 shadow-xs">
          <h1 className="text-sm md:text-base font-serif text-pink-900 font-medium">
            Cherry Blossoms in the Breeze · 桜吹雪
          </h1>
          <p className="text-[10px] font-serif text-stone-500 italic">
            Click or drag to stir the wind · {flowerCount} hand-drawn blossom{flowerCount > 1 ? 's' : ''} in the sky
          </p>
        </div>

        {/* Wind Speed Controls */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-full border border-stone-200 shadow-xs text-xs font-serif"
        >
          <span className="px-2 text-[10px] text-stone-400">Wind:</span>
          {(['calm', 'breeze', 'gust'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                sounds.playSoftClick();
                setWindIntensity(mode);
              }}
              className={`px-3 py-1 rounded-full capitalize text-xs transition-all ${
                windIntensity === mode
                  ? 'bg-pink-600 text-white font-medium shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Center Interactive Hint (fades out) */}
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

        <button
          onClick={handleDownloadKeepsake}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 hover:bg-white text-stone-700 text-xs md:text-sm font-serif border border-stone-300/80 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <span>📥 Save Keepsake Card</span>
        </button>
      </div>
    </div>
  );
};
