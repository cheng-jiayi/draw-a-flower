# Draw a Flower

An interactive, poetic web experience created for Vercel deployment, featuring traditional Japanese watercolor aesthetics, audio acoustics, and AI-powered flower sketch recognition.

## 🌸 Experience Journey

1. **Windchime Veranda (Page 1)**:
   - Japanese furin (windchime) resting against a watercolor sky.
   - Clicking triggers a physics sway animation accompanied by crystal glass chime acoustics (Web Audio API) and wind whisper.
   - Transitions into the traditional tea room.

2. **Wagashi & Tea Table (Page 2)**:
   - Green gingham tablecloth with textured pink washi runner.
   - **9 Japanese Wagashi sweets** in a 3x3 layout, each representing 1 day of a Japan journey:
     - Day 1: Sakura Mochi (桜餅)
     - Day 2: Cherry Monaka (桜最中)
     - Day 3: Strawberry Daifuku (苺大福)
     - Day 4: Bunny Manju (うさぎ饅頭)
     - Day 5: Sakura Nerikiri (桜練り切り)
     - Day 6: Sanshoku Dango (三色団子)
     - Day 7: Dorayaki (どら焼き)
     - Day 8: Mitarashi Dango (みたらし団子)
     - Day 9: Kashiwa Mochi (柏餅)
   - Clicking any wagashi navigates to that day's **Polaroid Collection**.
   - Clicking the Japanese teapot tilts it to pour fragrant sencha green tea into the teacup with soothing water trickling sounds and rising steam, then leads the user to the flower drawing sanctuary.

3. **Polaroid Journey (Page 3)**:
   - Day title screen with calligraphy `Day` and authentic handwritten digits (0–9).
   - 3-Polaroid display with watercolor frames, realistic shadows, and handwritten travel journal entries.
   - Navigation via watercolor sakura petal buttons (`sakura-petal.png`) and top-right pink seal return button (`round.png`).
   - Supports custom photo upload directly into any day's polaroid frames!

4. **Sakura Drawing Sanctuary & AI/ML Classification (Page 4)**:
   - Authentic washi craft paper canvas (`craft-paper.png`).
   - Watercolor brush palette: Sakura Pink, Crimson Rose, Pale Blossom, Golden Stamen, and Sumi Ink.
   - **AI/ML Flower Classifier**:
     - Evaluates radial harmonic Fourier power for petal detection ($k \in [4, 8]$ petals, specially calibrated for 5-petal sakura blossoms).
     - Radial symmetry and contour convexity analysis.
     - Differentiates flowers from random scribbles, text, geometrical shapes, lines, or cars.
     - Real-time floral resonance feedback meter and guidance tips.
     - Prevents release unless verified as a flower.

5. **Falling Blossom Wind Garden (Page 5)**:
   - Once verified, the hand-drawn flower is extracted with transparency and lifts into the breeze.
   - Real-time wind physics: blossoms tumble in 3D perspective across watercolor skies.
   - Interactive wind stirring on click or drag.
   - Allows drawing multiple flowers (they accumulate in the sky!).
   - Export and download your flower artwork as a Japanese postcard with a red hanko seal.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Technical Architecture & Engineering Highlights

### 1. Technology Stack
* **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18)
* **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing across domain models and canvas APIs)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Custom Japanese aesthetic palette, responsive typography, keyframe animations)
* **Deployment**: [Vercel](https://vercel.com/) (Static page optimization and edge asset delivery)

---

### 2. Architecture & State Management
* **Single-Page State Machine Flow**: Rather than multi-page routing that triggers browser reload flashes and disrupts Web Audio contexts, the application is orchestrated as an uninterrupted single-page state machine:
  $$\text{Landing (Windchime)} \;\longrightarrow\; \text{Tea Room} \;\longrightarrow\; \text{Polaroid Journal} \;\longrightarrow\; \text{Drawing Canvas} \;\longrightarrow\; \text{Blossom Garden}$$
* **Continuous Ambient Context**: Preserves background audio playback, user hand-drawn assets, and visual continuity across transitions with zero screen flashes or state desynchronization.

---

### 3. Procedural Audio Synthesis (Zero Audio File Overhead)
All auditory feedback in the experience is procedurally generated in real time via the **Web Audio API**—eliminating heavy external audio assets (MP3/WAV) and network latency:
* **Glass Windchime (*Furin*)**: Synthesized with harmonic sine oscillators tuned to traditional Japanese pentatonic pitches (1318 Hz to 2637 Hz), coupled with high-pass filtering and rapid exponential decay to simulate the crystalline timbre of resonant glass.
* **Tea Pouring & Ambient Wind**: Generated using procedurally populated white noise buffers fed through dynamic bandpass filters with pitch modulation to emulate liquid stream impacts and gust dynamics.
* **Paper Friction & Camera Shutter**: Modeled using transient noise bursts and dynamic gain envelope shaping.

---

### 4. Client-Side Computer Vision Flower Classifier
The drawing canvas features a **100% in-browser heuristic shape classification engine** that analyzes user strokes in real time without sending data to an external server or relying on heavy ML libraries:
* **Centroid & Polar Coordinate Projection**: Samples canvas pixels via `getImageData` to compute center of mass and projects all stroke coordinates into polar space $(\theta, r)$.
* **360° Angular Coverage Check**: Validates continuous radial distribution around the center, instantly rejecting lines, open scribbles, or one-sided marks.
* **Radial Valley & Lobe Detection**: Measures boundary distance gradients relative to the centroid. The algorithm searches for distinct alternating peaks (petal tips) and deep valleys (concave indentations between petals), enforcing a strict 4–8 petal count requirement while rejecting smooth circles, ovals, or solid squares.
* **Real-time Feedback**: Computes radial symmetry and circularity metrics to drive dynamic confidence indicators.

---

### 5. Interactive Particle & Wind Physics Engine
The final blossom wind garden features an interactive 2D canvas particle system running on a `requestAnimationFrame` delta-time loop:
* **3D Tumbling on 2D Canvas**: Petals simulate spatial 3D rotation and aerodynamic wobble using periodic horizontal scaling:
  $$\text{scaleX} = \cos(\text{tilt})$$
* **Interactive Wind Impulse**: Mouse clicks or touch gestures emit localized radial impulse vectors $(\vec{F} \propto \frac{\Delta \vec{p}}{\|\Delta \vec{p}\|})$ that scatter surrounding petals outward and trigger windchime chimes.
* **Asset Blending**: Hand-drawn user flowers are exported as transparent PNG data URLs, dynamically instantiated as custom particle textures, and seamlessly integrated into the falling petal simulation.

---

### 6. Track-Based Carousel with Seamless Snapping
The polaroid journal utilizes a custom track-based carousel built for silky smooth interactions:
* **5-Slot Virtual Sliding Window**: Pre-renders neighboring polaroid slots using circular modulo indexing `(index % total)`, supporting an arbitrary number of photos per day with infinite looping.
* **Snap-Back Translation**: Employs hardware-accelerated CSS transforms (`translateX`) during swipe/click animations, seamlessly resetting translation offsets without animation upon `transitionEnd` for infinite, glitch-free swiping.
