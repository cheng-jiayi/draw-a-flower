'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { analyzeDrawing, extractFlowerArtwork } from '../utils/flowerClassifier';
import { FlowerAnalysisResult } from '../types';
import { sounds } from '../utils/audio';

interface SakuraDrawingCanvasProps {
  onFlowerAccepted: (flowerDataUrl: string) => void;
  onBackToTeaRoom: () => void;
}

const PALETTE = [
  { name: 'Sakura Pink', color: '#f78fb3', type: 'brush' },
  { name: 'Crimson Rose', color: '#cf1b49', type: 'brush' },
  { name: 'Pale Blossom', color: '#ffccd8', type: 'brush' },
  { name: 'Golden Stamen', color: '#f5cd79', type: 'brush' },
  { name: 'Sumi Ink', color: '#2f3542', type: 'brush' },
  { name: 'Eraser', color: '#000000', type: 'eraser' },
];

export const SakuraDrawingCanvas: React.FC<SakuraDrawingCanvasProps> = ({
  onFlowerAccepted,
  onBackToTeaRoom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(PALETTE[0].color);
  const [brushSize, setBrushSize] = useState(14);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [analysis, setAnalysis] = useState<FlowerAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [feedbackShake, setFeedbackShake] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = 640;
    canvas.height = 640;

    // Clear to transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Save initial blank state
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, []);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (currentColor === '#000000') {
      // Eraser
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 1.5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.closePath();
    ctx.globalCompositeOperation = 'source-over';

    // Push history
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), imgData]);

    // Quick subtle real-time analysis
    const result = analyzeDrawing(canvas);
    setAnalysis(result);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    sounds.playSoftClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = history.slice(0, -1);
    const prevData = newHistory[newHistory.length - 1];
    ctx.putImageData(prevData, 0, 0);
    setHistory(newHistory);

    const result = analyzeDrawing(canvas);
    setAnalysis(result);
  };

  const handleClear = () => {
    sounds.playSoftClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    setAnalysis(null);
  };

  const handleVerifyAndRelease = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsAnalyzing(true);
    sounds.playWindWhisper(1.5);

    setTimeout(() => {
      const result = analyzeDrawing(canvas);
      setAnalysis(result);
      setIsAnalyzing(false);

      if (result.isFlower) {
        sounds.playFurinChime(1.0);
        const flowerImg = extractFlowerArtwork(canvas);
        if (flowerImg) {
          onFlowerAccepted(flowerImg);
        }
      } else {
        sounds.playSoftClick();
        setFeedbackShake(true);
        setTimeout(() => setFeedbackShake(false), 700);
      }
    }, 400);
  };

  return (
    <div className="relative w-full min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 md:p-8 select-none overflow-x-hidden">
      {/* Background craft paper texture */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/craft-paper.png"
          alt="Craft Paper Background"
          fill
          priority
          className="object-cover object-center pointer-events-none"
        />
        <div className="absolute inset-0 bg-stone-900/10 backdrop-blur-[1px]" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between mb-4">
        <button
          onClick={onBackToTeaRoom}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm border border-stone-300/80 shadow-xs text-stone-700 text-xs font-serif transition-all"
        >
          <span>← Return to Tea Room</span>
        </button>

        <div className="text-center">
          <h2 className="text-base md:text-xl font-serif text-stone-800 tracking-wide font-medium">
            Sakura Drawing Sanctuary · 桜を描く
          </h2>
          <p className="text-[11px] font-serif text-stone-600 italic">
            Draw your cherry blossom flower. The AI will sense its petals and release it into the wind.
          </p>
        </div>

        <button
          onClick={() => setShowGuide(!showGuide)}
          className={`px-3 py-1.5 rounded-full text-xs font-serif border shadow-xs transition-all ${
            showGuide
              ? 'bg-pink-600 text-white border-pink-700'
              : 'bg-white/80 text-stone-600 border-stone-300 hover:bg-white'
          }`}
        >
          {showGuide ? 'Hide Outline' : '🌸 Show Guide'}
        </button>
      </div>

      {/* Main Workspace (Canvas + Tools + AI Feedback) */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col lg:flex-row items-center justify-center gap-6">
        
        {/* Drawing Canvas Board */}
        <div className="relative flex flex-col items-center">
          <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] md:w-[480px] md:h-[480px] bg-stone-50/90 rounded-2xl shadow-xl border-4 border-amber-900/10 overflow-hidden flex items-center justify-center">
            
            {/* Guide Sakura Silhouette (watermark) */}
            {showGuide && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
                <svg viewBox="0 0 200 200" className="w-[75%] h-[75%] stroke-pink-700 fill-none stroke-[2] stroke-dasharray-[4,4]">
                  {/* 5 Petal Sakura Outline */}
                  {[0, 72, 144, 216, 288].map((angle, i) => (
                    <path
                      key={i}
                      d="M 100,100 C 70,50 65,15 100,20 C 135,15 130,50 100,100"
                      transform={`rotate(${angle} 100 100)`}
                    />
                  ))}
                  <circle cx="100" cy="100" r="14" strokeWidth="1.5" />
                </svg>
              </div>
            )}

            {/* The Drawing Canvas */}
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="relative z-10 w-full h-full cursor-crosshair touch-none"
            />
          </div>

          {/* Canvas Bottom Quick Tools */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="px-3 py-1 rounded-full bg-white/80 hover:bg-white border border-stone-200 text-xs font-serif text-stone-700 disabled:opacity-40 transition-colors"
            >
              ↩ Undo
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1 rounded-full bg-white/80 hover:bg-white border border-stone-200 text-xs font-serif text-stone-700 transition-colors"
            >
              Clear Canvas
            </button>
            <span className="text-[11px] text-stone-500 font-serif italic">
              {history.length > 1 ? `${history.length - 1} strokes` : 'Blank canvas'}
            </span>
          </div>
        </div>

        {/* Right Side: Brushes, Colors & AI Analysis Panel */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          
          {/* Color Palette */}
          <div className="bg-white/85 backdrop-blur-sm p-4 rounded-xl border border-stone-200 shadow-sm">
            <span className="text-xs font-serif text-stone-700 font-semibold tracking-wider block mb-2">
              Watercolor Pigments
            </span>
            <div className="grid grid-cols-3 gap-2">
              {PALETTE.map((p) => {
                const isSelected = currentColor === p.color;
                return (
                  <button
                    key={p.name}
                    onClick={() => {
                      sounds.playSoftClick();
                      setCurrentColor(p.color);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50 shadow-xs'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{
                        backgroundColor: p.type === 'eraser' ? '#ffffff' : p.color,
                        boxShadow: isSelected ? '0 0 0 2px #f43f5e' : 'none',
                      }}
                    >
                      {p.type === 'eraser' && (
                        <span className="text-[10px] flex items-center justify-center">✕</span>
                      )}
                    </div>
                    <span className="text-[11px] font-serif text-stone-700 truncate">
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Brush Size Slider */}
            <div className="mt-4">
              <div className="flex justify-between text-xs font-serif text-stone-600 mb-1">
                <span>Brush Stroke</span>
                <span>{brushSize}px</span>
              </div>
              <input
                type="range"
                min="4"
                max="36"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>
          </div>

          {/* AI/ML Flower Recognition Panel */}
          <div
            className={`bg-white/90 backdrop-blur-sm p-4 rounded-xl border shadow-sm transition-all duration-300 ${
              feedbackShake ? 'animate-bounce border-rose-400 bg-rose-50/70' : 'border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-serif font-semibold text-stone-800 tracking-wider">
                AI Flower Classifier
              </span>
              <span
                className={`text-[10px] font-serif px-2 py-0.5 rounded-full ${
                  analysis?.isFlower
                    ? 'bg-emerald-100 text-emerald-800 font-semibold'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {analysis?.isFlower ? '🌸 Flower Confirmed' : 'Waiting for Flower'}
              </span>
            </div>

            {/* AI Confidence Meter */}
            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  analysis?.isFlower ? 'bg-pink-500' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.round((analysis?.confidence || 0) * 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-serif text-stone-500 mb-2">
              <span>Floral Resonance:</span>
              <span className="font-bold text-stone-700">
                {Math.round((analysis?.confidence || 0) * 100)}%
              </span>
            </div>

            {/* AI Detected Metrics */}
            {analysis && (
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-serif bg-stone-50 p-2 rounded-lg text-stone-600 mb-3">
                <div>
                  Petal Lobes: <span className="font-bold text-stone-800">{analysis.petalCount || '—'}</span>
                </div>
                <div>
                  Symmetry: <span className="font-bold text-stone-800">{Math.round(analysis.symmetryScore * 100)}%</span>
                </div>
              </div>
            )}

            {/* AI Explanation / Feedback Message */}
            <p className="text-xs font-serif text-stone-700 leading-relaxed min-h-[44px]">
              {analysis?.message || 'Draw petals radiating outwards from a center point to create your blossom.'}
            </p>

            {/* Action Button: Release to Wind */}
            <button
              onClick={handleVerifyAndRelease}
              disabled={isAnalyzing}
              className={`w-full mt-3 py-2.5 px-4 rounded-xl text-xs font-serif tracking-wider shadow-md transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 ${
                analysis?.isFlower
                  ? 'bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium hover:shadow-lg hover:scale-102'
                  : 'bg-stone-800 hover:bg-stone-900 text-white'
              }`}
            >
              {isAnalyzing ? (
                <span>AI Analyzing Blossom...</span>
              ) : analysis?.isFlower ? (
                <span>🍃 Release to the Wind</span>
              ) : (
                <span>Verify &amp; Release Blossom</span>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

