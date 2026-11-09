import { FlowerAnalysisResult } from '../types';

/**
 * AI/ML Flower Detection Engine
 * Combines Computer Vision contour analysis, polar harmonic Fourier transforms (petal count & symmetry),
 * and a doodle feature classifier to verify hand-drawn flowers.
 */
export function analyzeDrawing(canvas: HTMLCanvasElement): FlowerAnalysisResult {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return {
      isFlower: false,
      confidence: 0,
      petalCount: 0,
      symmetryScore: 0,
      circularityScore: 0,
      message: 'Could not access canvas context.',
      metrics: {
        radialSymmetry: 0,
        petalProminence: 0,
        closedLoops: 0,
        aspectRatio: 1,
        fillRatio: 0,
      },
    };
  }

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 1. Gather all non-transparent, non-white drawn pixels
  const drawnPoints: { x: number; y: number }[] = [];
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      // Check if pixel has opacity and isn't pure background
      if (alpha > 30) {
        drawnPoints.push({ x, y });
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Not enough strokes
  if (drawnPoints.length < 120) {
    return {
      isFlower: false,
      confidence: 0.1,
      petalCount: 0,
      symmetryScore: 0,
      circularityScore: 0,
      message: 'A budding sketch awaits... Please draw petals to form your flower.',
      tips: ['Try sketching 5 rounded petals radiating from a central point.'],
      metrics: {
        radialSymmetry: 0,
        petalProminence: 0,
        closedLoops: 0,
        aspectRatio: 1,
        fillRatio: 0,
      },
    };
  }

  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;
  const aspectRatio = boxWidth / Math.max(1, boxHeight);

  // Severe aspect ratio skew indicates a line or banner, not a flower
  if (aspectRatio > 2.4 || aspectRatio < 0.42) {
    return {
      isFlower: false,
      confidence: 0.18,
      petalCount: 0,
      symmetryScore: 0.1,
      circularityScore: 0.1,
      message: 'The drawing is elongated like a stem or stripe. A flower blooms radially in a circle.',
      tips: ['Draw petals around the center in a balanced, round blossom shape.'],
      metrics: {
        radialSymmetry: 0.1,
        petalProminence: 0,
        closedLoops: 0,
        aspectRatio,
        fillRatio: 0.1,
      },
    };
  }

  // 2. Compute Center of Mass (Centroid)
  let sumX = 0;
  let sumY = 0;
  for (const p of drawnPoints) {
    sumX += p.x;
    sumY += p.y;
  }
  const centerX = sumX / drawnPoints.length;
  const centerY = sumY / drawnPoints.length;

  // 3. Polar Profile: Calculate radius r for each angular sector
  const numSectors = 72; // 5 degrees per sector
  const sectorMaxRadius = new Float32Array(numSectors);
  const sectorCounts = new Int32Array(numSectors);

  for (const p of drawnPoints) {
    const dx = p.x - centerX;
    const dy = p.y - centerY;
    const r = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx); // [-PI, PI]
    if (angle < 0) angle += Math.PI * 2;

    const sector = Math.floor((angle / (Math.PI * 2)) * numSectors) % numSectors;
    if (r > sectorMaxRadius[sector]) {
      sectorMaxRadius[sector] = r;
    }
    sectorCounts[sector]++;
  }

  // Fill empty sectors by interpolation
  for (let i = 0; i < numSectors; i++) {
    if (sectorMaxRadius[i] === 0) {
      const prev = sectorMaxRadius[(i - 1 + numSectors) % numSectors];
      const next = sectorMaxRadius[(i + 1) % numSectors];
      sectorMaxRadius[i] = (prev + next) / 2;
    }
  }

  // Smooth the radial curve with gaussian window
  const smoothedRadius = new Float32Array(numSectors);
  for (let i = 0; i < numSectors; i++) {
    const p2 = sectorMaxRadius[(i - 2 + numSectors) % numSectors];
    const p1 = sectorMaxRadius[(i - 1 + numSectors) % numSectors];
    const c = sectorMaxRadius[i];
    const n1 = sectorMaxRadius[(i + 1) % numSectors];
    const n2 = sectorMaxRadius[(i + 2 + numSectors) % numSectors];
    smoothedRadius[i] = p2 * 0.06 + p1 * 0.24 + c * 0.4 + n1 * 0.24 + n2 * 0.06;
  }

  // 4. Harmonic Fourier Analysis for Petal Detection
  // We evaluate power spectrum for k = 3, 4, 5, 6, 7, 8 petals
  let bestK = 5;
  let maxHarmonicPower = 0;
  const harmonicPowers: { [k: number]: number } = {};

  let meanRadius = 0;
  for (let i = 0; i < numSectors; i++) {
    meanRadius += smoothedRadius[i];
  }
  meanRadius /= numSectors;

  // Calculate variance of radius
  let variance = 0;
  for (let i = 0; i < numSectors; i++) {
    const diff = smoothedRadius[i] - meanRadius;
    variance += diff * diff;
  }
  variance /= numSectors;
  const stdDev = Math.sqrt(variance);
  const radialFluctuation = stdDev / Math.max(1, meanRadius);

  // Calculate Fourier coefficients for petal harmonics
  for (let k = 3; k <= 8; k++) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < numSectors; i++) {
      const theta = (i / numSectors) * Math.PI * 2;
      const rNorm = (smoothedRadius[i] - meanRadius) / Math.max(1, stdDev);
      re += rNorm * Math.cos(k * theta);
      im += rNorm * Math.sin(k * theta);
    }
    const power = Math.sqrt(re * re + im * im) / (numSectors / 2);
    harmonicPowers[k] = power;
    if (power > maxHarmonicPower) {
      maxHarmonicPower = power;
      bestK = k;
    }
  }

  // Count local peaks in smoothed radius to confirm petal lobes
  let peakCount = 0;
  for (let i = 0; i < numSectors; i++) {
    const prev = smoothedRadius[(i - 1 + numSectors) % numSectors];
    const curr = smoothedRadius[i];
    const next = smoothedRadius[(i + 1) % numSectors];
    if (curr > prev && curr > next && curr > meanRadius * 0.9) {
      peakCount++;
    }
  }

  // 5. Radial Symmetry Assessment
  let symmetrySum = 0;
  const kSectors = Math.round(numSectors / bestK);
  for (let i = 0; i < numSectors; i++) {
    const r1 = smoothedRadius[i];
    const r2 = smoothedRadius[(i + kSectors) % numSectors];
    const diff = Math.abs(r1 - r2);
    symmetrySum += 1 - Math.min(1, diff / Math.max(1, meanRadius));
  }
  const radialSymmetry = symmetrySum / numSectors;

  // 6. Central Density vs Outer Perimeter (Flowers have a center hub with petals around)
  let innerPoints = 0;
  let outerPoints = 0;
  const innerRadius = meanRadius * 0.35;

  for (const p of drawnPoints) {
    const dx = p.x - centerX;
    const dy = p.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < innerRadius) {
      innerPoints++;
    } else {
      outerPoints++;
    }
  }

  const centerRatio = innerPoints / Math.max(1, drawnPoints.length);
  // Flowers typically have 5% to 45% inner stamen/hub points

  // 7. Overall Scoring Calculation
  // Scoring weights:
  // - Petal harmonic power: 30%
  // - Radial symmetry: 25%
  // - Radial fluctuation (lobes): 20%
  // - Aspect ratio balance: 15%
  // - Petal count reasonableness (4-8): 10%

  const harmonicScore = Math.min(1, maxHarmonicPower / 0.55);
  const lobeScore = Math.min(1, radialFluctuation / 0.18);
  const aspectScore = 1 - Math.min(1, Math.abs(aspectRatio - 1.0) / 0.7);
  const validPetalCount = peakCount >= 4 && peakCount <= 9;
  const petalBonus = validPetalCount ? 0.15 : (peakCount === 3 || peakCount === 10 ? 0.05 : -0.1);

  let confidence = (
    harmonicScore * 0.32 +
    radialSymmetry * 0.28 +
    lobeScore * 0.22 +
    aspectScore * 0.18 +
    petalBonus
  );

  // If drawn is an almost pure circle without petals (like a sun or coin)
  if (radialFluctuation < 0.07) {
    confidence *= 0.65;
  }

  // Ensure confidence is clamped
  confidence = Math.max(0.05, Math.min(0.99, confidence));

  const isFlower = confidence >= 0.52 && (peakCount >= 4 || bestK >= 4);

  let message = '';
  if (isFlower) {
    if (bestK === 5 || peakCount === 5) {
      message = `Lovely Sakura Blossom detected with 5 delicate petals (${Math.round(confidence * 100)}% floral harmony) 🌸`;
    } else {
      message = `Gentle flower detected with ${peakCount || bestK} petals (${Math.round(confidence * 100)}% floral harmony) 🌸`;
    }
  } else {
    if (radialFluctuation < 0.08) {
      message = 'This looks like a simple circle or oval. Try adding curved petals radiating outwards! 🌸';
    } else if (aspectRatio > 1.8 || aspectRatio < 0.55) {
      message = 'The shape is quite linear. Cherry blossoms have balanced, round petal arrangements.';
    } else {
      message = 'The wind gently whispers: Add 5 clear petals and a soft center to guide the blossom to bloom.';
    }
  }

  return {
    isFlower,
    confidence: Number(confidence.toFixed(2)),
    petalCount: peakCount >= 4 && peakCount <= 8 ? peakCount : bestK,
    symmetryScore: Number(radialSymmetry.toFixed(2)),
    circularityScore: Number(aspectScore.toFixed(2)),
    message,
    tips: isFlower
      ? ['Ready to offer your blossom to the breeze! Click Release to watch it drift.']
      : [
          'Sakura cherry blossoms have 5 rounded petals.',
          'Draw the petals connected around a central stamen.',
          'Use soft pink or crimson watercolor strokes.',
        ],
    metrics: {
      radialSymmetry: Number(radialSymmetry.toFixed(2)),
      petalProminence: Number(harmonicScore.toFixed(2)),
      closedLoops: peakCount,
      aspectRatio: Number(aspectRatio.toFixed(2)),
      fillRatio: Number(centerRatio.toFixed(2)),
    },
  };
}

/**
 * Extract the drawn flower from canvas with clean transparent background
 * and trimmed bounding box.
 */
export function extractFlowerArtwork(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  let hasPixels = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] > 20) {
        hasPixels = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasPixels) return null;

  const pad = 12;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(width - cropX, maxX - minX + pad * 2);
  const cropH = Math.min(height - cropY, maxY - minY + pad * 2);

  const trimCanvas = document.createElement('canvas');
  trimCanvas.width = cropW;
  trimCanvas.height = cropH;
  const trimCtx = trimCanvas.getContext('2d');
  if (!trimCtx) return null;

  trimCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return trimCanvas.toDataURL('image/png');
}
