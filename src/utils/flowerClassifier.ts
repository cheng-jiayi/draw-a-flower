import { FlowerAnalysisResult } from '../types';

/**
 * AI/ML Flower Detection Engine
 * 
 * Analyzes hand-drawn canvas drawings using:
 * 1. 360° Polar Angular Coverage & Continuity (rejects one-sided scribbles, lines, crosses)
 * 2. Radial Undulation & Valley Depth Analysis (detects concave indentations between petal tips; rejects circles, ovals, solid blobs)
 * 3. Harmonic Fourier Decomposition (verifies rotational symmetry for k = 4, 5, 6, 7, 8 petals)
 * 4. Aspect Ratio & Centroid Balance
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

  // 1. Collect non-transparent drawn pixels (step 2 for performance)
  const drawnPoints: { x: number; y: number }[] = [];
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
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
  if (drawnPoints.length < 150) {
    return {
      isFlower: false,
      confidence: 0.05,
      petalCount: 0,
      symmetryScore: 0,
      circularityScore: 0,
      message: 'A budding sketch awaits... Please draw petals to form your flower.',
      tips: ['Draw 5 rounded petals radiating outwards from a central point.'],
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

  // Flowers must be roughly circular in overall envelope (0.60 to 1.65)
  if (aspectRatio > 1.7 || aspectRatio < 0.58) {
    return {
      isFlower: false,
      confidence: 0.15,
      petalCount: 0,
      symmetryScore: 0.1,
      circularityScore: 0.1,
      message: 'The drawing is elongated or skewed. Flowers have balanced, rounded petal arrangements.',
      tips: ['Draw petals evenly all around the center point in a balanced circle.'],
      metrics: {
        radialSymmetry: 0.1,
        petalProminence: 0,
        closedLoops: 0,
        aspectRatio: Number(aspectRatio.toFixed(2)),
        fillRatio: 0.1,
      },
    };
  }

  // 2. Centroid calculation
  let sumX = 0;
  let sumY = 0;
  for (const p of drawnPoints) {
    sumX += p.x;
    sumY += p.y;
  }
  const centerX = sumX / drawnPoints.length;
  const centerY = sumY / drawnPoints.length;

  // 3. Polar profile across 72 sectors (5° each)
  const numSectors = 72;
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

  // 4. Angular Coverage & Gap Analysis
  // Genuine flowers must bloom in nearly all directions around the center
  let filledSectors = 0;
  let maxConsecutiveEmpty = 0;
  let currentEmpty = 0;

  // Double loop to catch wrap-around gap across sector 0
  for (let i = 0; i < numSectors * 2; i++) {
    const idx = i % numSectors;
    if (sectorCounts[idx] > 0) {
      if (i < numSectors) filledSectors++;
      if (currentEmpty > maxConsecutiveEmpty) {
        maxConsecutiveEmpty = currentEmpty;
      }
      currentEmpty = 0;
    } else {
      currentEmpty++;
    }
  }

  const angularCoverage = filledSectors / numSectors;

  // Reject if petals are missing on one side (e.g. half a flower, letters, an "L" or smiley face)
  if (angularCoverage < 0.65 || maxConsecutiveEmpty > 12) { // 12 sectors = 60° continuous empty gap
    return {
      isFlower: false,
      confidence: 0.22,
      petalCount: 0,
      symmetryScore: 0.15,
      circularityScore: Number(angularCoverage.toFixed(2)),
      message: 'The drawing only covers part of the center. Draw petals radiating all the way around! 🌸',
      tips: ['Complete the circle by adding petals on all sides.'],
      metrics: {
        radialSymmetry: 0.15,
        petalProminence: 0,
        closedLoops: 0,
        aspectRatio: Number(aspectRatio.toFixed(2)),
        fillRatio: Number(angularCoverage.toFixed(2)),
      },
    };
  }

  // Interpolate small gaps for radial profile smoothing
  for (let i = 0; i < numSectors; i++) {
    if (sectorMaxRadius[i] === 0) {
      const prev = sectorMaxRadius[(i - 1 + numSectors) % numSectors];
      const next = sectorMaxRadius[(i + 1) % numSectors];
      sectorMaxRadius[i] = (prev + next) / 2;
    }
  }

  // Gaussian smooth the radial contour
  const smoothedRadius = new Float32Array(numSectors);
  for (let i = 0; i < numSectors; i++) {
    const p2 = sectorMaxRadius[(i - 2 + numSectors) % numSectors];
    const p1 = sectorMaxRadius[(i - 1 + numSectors) % numSectors];
    const c = sectorMaxRadius[i];
    const n1 = sectorMaxRadius[(i + 1) % numSectors];
    const n2 = sectorMaxRadius[(i + 2 + numSectors) % numSectors];
    smoothedRadius[i] = p2 * 0.06 + p1 * 0.24 + c * 0.4 + n1 * 0.24 + n2 * 0.06;
  }

  let meanRadius = 0;
  for (let i = 0; i < numSectors; i++) {
    meanRadius += smoothedRadius[i];
  }
  meanRadius /= numSectors;

  // 5. Detect Real Petal Peaks & Deep Valleys
  // A true flower has prominent peaks (petal tips) separated by valleys (indentations)
  interface LobePeak {
    index: number;
    peakRadius: number;
    valleyDepth: number;
  }

  const detectedPeaks: LobePeak[] = [];
  const valleyLookahead = 6; // Look ~30 degrees in each direction

  for (let i = 0; i < numSectors; i++) {
    const curr = smoothedRadius[i];
    const prev = smoothedRadius[(i - 1 + numSectors) % numSectors];
    const next = smoothedRadius[(i + 1) % numSectors];

    // Local peak that is reasonably prominent
    if (curr > prev && curr > next && curr >= meanRadius * 0.85) {
      // Find lowest valley to the left and right within lookahead window
      let leftMin = curr;
      for (let s = 1; s <= valleyLookahead; s++) {
        const val = smoothedRadius[(i - s + numSectors) % numSectors];
        if (val < leftMin) leftMin = val;
      }

      let rightMin = curr;
      for (let s = 1; s <= valleyLookahead; s++) {
        const val = smoothedRadius[(i + s) % numSectors];
        if (val < rightMin) rightMin = val;
      }

      const valleyDropLeft = (curr - leftMin) / Math.max(1, curr);
      const valleyDropRight = (curr - rightMin) / Math.max(1, curr);
      const averageDrop = (valleyDropLeft + valleyDropRight) / 2;

      // Only count if there is a distinct indentation on both sides (> 14% drop)
      if (valleyDropLeft > 0.12 && valleyDropRight > 0.12 && averageDrop >= 0.15) {
        detectedPeaks.push({
          index: i,
          peakRadius: curr,
          valleyDepth: averageDrop,
        });
      }
    }
  }

  // Merge peaks that are too close together (< 25 degrees apart)
  const filteredPeaks: LobePeak[] = [];
  for (let i = 0; i < detectedPeaks.length; i++) {
    const p = detectedPeaks[i];
    if (filteredPeaks.length === 0) {
      filteredPeaks.push(p);
    } else {
      const last = filteredPeaks[filteredPeaks.length - 1];
      const dist = p.index - last.index;
      if (dist < 5) { // within 25 degrees
        // Keep the one with higher peak radius
        if (p.peakRadius > last.peakRadius) {
          filteredPeaks[filteredPeaks.length - 1] = p;
        }
      } else {
        filteredPeaks.push(p);
      }
    }
  }

  // Check wrap-around distance between first and last peak
  if (filteredPeaks.length > 1) {
    const first = filteredPeaks[0];
    const last = filteredPeaks[filteredPeaks.length - 1];
    if (numSectors - last.index + first.index < 5) {
      if (first.peakRadius < last.peakRadius) {
        filteredPeaks.shift();
      } else {
        filteredPeaks.pop();
      }
    }
  }

  const peakCount = filteredPeaks.length;
  const avgValleyDepth = filteredPeaks.length > 0
    ? filteredPeaks.reduce((sum, p) => sum + p.valleyDepth, 0) / filteredPeaks.length
    : 0;

  // 6. Fourier Harmonic Analysis
  // Calculate variance of radius
  let variance = 0;
  for (let i = 0; i < numSectors; i++) {
    const diff = smoothedRadius[i] - meanRadius;
    variance += diff * diff;
  }
  variance /= numSectors;
  const stdDev = Math.sqrt(variance);

  let bestK = 5;
  let maxHarmonicPower = 0;
  const harmonicPowers: { [k: number]: number } = {};

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

  // 7. Radial Symmetry Assessment based on best harmonic
  let symmetrySum = 0;
  const kSectors = Math.round(numSectors / bestK);
  for (let i = 0; i < numSectors; i++) {
    const r1 = smoothedRadius[i];
    const r2 = smoothedRadius[(i + kSectors) % numSectors];
    const diff = Math.abs(r1 - r2);
    symmetrySum += 1 - Math.min(1, diff / Math.max(1, meanRadius));
  }
  const radialSymmetry = symmetrySum / numSectors;

  // 8. Composite Scoring
  const aspectScore = 1 - Math.min(1, Math.abs(aspectRatio - 1.0) / 0.5);
  const harmonicScore = Math.min(1, maxHarmonicPower / 0.6);
  const valleyScore = Math.min(1, avgValleyDepth / 0.28);
  const coverageScore = Math.min(1, angularCoverage / 0.85);

  let confidence = (
    harmonicScore * 0.30 +
    valleyScore * 0.30 +
    radialSymmetry * 0.20 +
    coverageScore * 0.10 +
    aspectScore * 0.10
  );

  // Sakura Bonus: exactly 5 distinct petals
  if (peakCount === 5 || (peakCount >= 4 && peakCount <= 6 && bestK === 5)) {
    confidence = Math.min(0.99, confidence + 0.10);
  }

  // Penalize if no clear petal indentations (solid circle / smooth oval / face / coin)
  if (avgValleyDepth < 0.14) {
    confidence *= 0.45;
  }

  // Penalize if too few or too many peaks
  if (peakCount < 4 || peakCount > 8) {
    confidence *= 0.55;
  }

  confidence = Math.max(0.05, Math.min(0.98, confidence));

  // STRICT Pass Gating:
  // Must satisfy:
  // - Petal count between 4 and 8
  // - Minimum valley depth >= 0.15 (clear indentations between petals)
  // - Adequate angular coverage >= 70%
  // - Overall confidence >= 0.65
  const isFlower = (
    confidence >= 0.65 &&
    peakCount >= 4 &&
    peakCount <= 8 &&
    avgValleyDepth >= 0.15 &&
    angularCoverage >= 0.70 &&
    aspectRatio >= 0.65 &&
    aspectRatio <= 1.55
  );

  // Construct helpful, specific feedback messages
  let message = '';
  if (isFlower) {
    if (peakCount === 5 || bestK === 5) {
      message = `Lovely Sakura Blossom detected with 5 delicate petals (${Math.round(confidence * 100)}% floral harmony) 🌸`;
    } else {
      message = `Gentle flower detected with ${peakCount} petals (${Math.round(confidence * 100)}% floral harmony) 🌸`;
    }
  } else {
    if (avgValleyDepth < 0.14) {
      message = 'This looks like a solid circle or round shape. Draw distinct petals with curved dips between them! 🌸';
    } else if (peakCount < 4) {
      message = `Detected ${peakCount || 0} lobe(s). A Sakura blossom needs 5 clear petals radiating from the center.`;
    } else if (peakCount > 8) {
      message = 'Too many jagged lines detected. Try drawing 5 smooth, rounded petals around the center.';
    } else if (aspectRatio > 1.6 || aspectRatio < 0.62) {
      message = 'The shape is quite elongated. Cherry blossoms have balanced, round petal arrangements.';
    } else {
      message = 'The wind gently whispers: Add 5 clear petals with indentations between them around a soft center.';
    }
  }

  return {
    isFlower,
    confidence: Number(confidence.toFixed(2)),
    petalCount: peakCount >= 4 && peakCount <= 8 ? peakCount : (bestK >= 4 && bestK <= 8 ? bestK : 5),
    symmetryScore: Number(radialSymmetry.toFixed(2)),
    circularityScore: Number(aspectScore.toFixed(2)),
    message,
    tips: isFlower
      ? ['Ready to offer your blossom to the breeze! Click Release to watch it drift.']
      : [
          'Sakura cherry blossoms have 5 rounded petals.',
          'Draw clear curved indentations (valleys) where petals meet.',
          'Draw petals evenly all the way around the central stamen.',
        ],
    metrics: {
      radialSymmetry: Number(radialSymmetry.toFixed(2)),
      petalProminence: Number(harmonicScore.toFixed(2)),
      closedLoops: peakCount,
      aspectRatio: Number(aspectRatio.toFixed(2)),
      fillRatio: Number(avgValleyDepth.toFixed(2)),
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
