export interface WagashiItem {
  id: number;
  day: number;
  name: string;
  romaji: string;
  kanji: string;
  description: string;
  flavor: string;
  image: string;
}

export interface PolaroidPhoto {
  id: string;
  title: string;
  caption: string;
  location: string;
  imageUrl: string;
  date: string;
  aspectRatio?: 'portrait' | 'landscape';
}

export interface DayJournal {
  day: number;
  title: string;
  theme: string;
  wagashi: WagashiItem;
  photos: PolaroidPhoto[];
}

export interface FlowerAnalysisResult {
  isFlower: boolean;
  confidence: number;
  petalCount: number;
  symmetryScore: number;
  circularityScore: number;
  message: string;
  tips?: string[];
  metrics: {
    radialSymmetry: number;
    petalProminence: number;
    closedLoops: number;
    aspectRatio: number;
    fillRatio: number;
  };
}

export interface FloatingFlower {
  id: number;
  imageSrc: string;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  swayPhase: number;
  swaySpeed: number;
  opacity: number;
  scaleZ: number;
}

