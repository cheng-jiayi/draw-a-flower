# Draw a Flower · Whisper of the Heart (風鈴と桜)

An interactive, poetic web experience created for Vercel deployment, featuring traditional Japanese watercolor aesthetics, audio acoustics, and AI-powered flower sketch recognition.

## 🌸 Experience Journey

1. **Windchime Veranda (Page 1 - `1.png`)**:
   - Japanese furin (windchime) resting against a watercolor sky.
   - Clicking triggers a physics sway animation accompanied by crystal glass chime acoustics (Web Audio API) and wind whisper.
   - Transitions into the traditional tea room.

2. **Wagashi & Tea Table (Page 2 - `2.png`)**:
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

3. **Polaroid Journey (Pages 3 & 4 - `3.png` & `4.png`)**:
   - Day title screen with calligraphy `Day` and authentic handwritten digits (0–9).
   - 3-Polaroid display with watercolor frames, realistic shadows, and handwritten travel journal entries.
   - Navigation via watercolor sakura petal buttons (`sakura-petal.png`) and top-right pink seal return button (`round.png`).
   - Supports custom photo upload directly into any day's polaroid frames!

4. **Sakura Drawing Sanctuary & AI/ML Classification**:
   - Authentic washi craft paper canvas (`craft-paper.png`).
   - Watercolor brush palette: Sakura Pink, Crimson Rose, Pale Blossom, Golden Stamen, and Sumi Ink.
   - **AI/ML Flower Classifier**:
     - Evaluates radial harmonic Fourier power for petal detection ($k \in [4, 8]$ petals, specially calibrated for 5-petal sakura blossoms).
     - Radial symmetry and contour convexity analysis.
     - Differentiates flowers from random scribbles, text, geometrical shapes, lines, or cars.
     - Real-time floral resonance feedback meter and guidance tips.
     - Prevents release unless verified as a flower.

5. **Falling Blossom Wind Garden**:
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

## ☁️ Deploying to Vercel

1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com), click **Add New Project** and select this repository.
3. Framework Preset: **Next.js** (detected automatically).
4. Click **Deploy**!
