# Dynamic Pixel Art Backgrounds Design

**Date:** 2026-01-17
**Status:** Design Complete
**Feature:** Full-screen circular pixel art landscapes that respond to blob affinity and evolution stage

---

## Core Concept

Full-screen circular pixel art landscapes (120×120 base resolution) that dynamically respond to your blob's affinity and evolution stage. Each landscape features subtle 2-4 frame ambient animations with independent randomized timing for organic movement.

The background tells the story of your creature's personality (affinity) and journey (evolution stage), creating an immersive world that evolves alongside your blob.

---

## The 7 Biomes

### Pure Affinities

1. **Lightning Storms** (Speed)
   - Electric bolts, dramatic storm clouds
   - Color palette: Blue/cyan (#00BFFF, #87CEEB, #4169E1)
   - Elements: Lightning bolts, wind streaks, charged clouds

2. **Volcanic Terrain** (Power)
   - Lava flows, rocky ground, fire elements
   - Color palette: Orange/red (#FF6B35, #FF4500, #8B0000)
   - Elements: Molten lava, rocky terrain, glowing cracks

3. **Deep Forest** (Endurance)
   - Dense trees, steady growth, nature theme
   - Color palette: Purple/green (#9B59B6, #2ECC71, #27AE60)
   - Elements: Trees, foliage, natural growth patterns

### Hybrid Affinities

4. **Storm Over Volcano** (Speed + Power)
   - Lightning in sky, volcanic ground below
   - Vertical composition: Storm clouds above, lava below
   - Blends blue/cyan with orange/red

5. **Geothermal Grove** (Power + Endurance)
   - Trees growing from volcanic rock, steam vents
   - Nature meets fire: Glowing trees, ember leaves
   - Blends orange/red with purple/green

6. **Electric Forest** (Speed + Endurance)
   - Lightning arcing between trees, charged atmosphere
   - Energy crackling through vegetation
   - Blends blue/cyan with purple/green

### Balanced State

7. **Shifting Aurora** (All Balanced)
   - Northern lights effect cycling through all affinity colors
   - Abstract, mystical atmosphere
   - Represents undefined/transitional state

---

## Evolution Progression (Minimal to Epic)

Each biome evolves across 6 stages, increasing in complexity and detail:

| Stage | Name | Visual Complexity | Creation Time |
|-------|------|-------------------|---------------|
| 1 | Egg | Very simple, few pixels, basic shapes | 10-15 mins |
| 2 | Hatchling | A few more elements appear | 15-20 mins |
| 3 | Juvenile | Clear features, recognizable landscape | 15-20 mins |
| 4 | Mature | Rich detail, multiple layers | 20-25 mins |
| 5 | Apex | Complex, dramatic scenes | 25-30 mins |
| 6 | Transcendent | Fully detailed masterpiece, most epic | 30-45 mins |

### Examples of Stage Progression

**Lightning Storms:**
- Stage 1: Few cloud pixels, single small bolt
- Stage 3: Multiple clouds, 2-3 bolt positions, wind lines
- Stage 6: Full storm system, multiple branching bolts, dramatic clouds, electric particles

**Volcanic Terrain:**
- Stage 1: Simple ground line, tiny lava glow
- Stage 3: Rocky terrain, lava stream, glowing cracks
- Stage 6: Full volcano, flowing lava rivers, smoke, glowing ember particles

**Deep Forest:**
- Stage 1: 2-3 simple tree shapes
- Stage 3: Multiple layered trees, ground detail, canopy
- Stage 6: Dense forest, depth layers, magical glow effects, detailed foliage

---

## Technical Specifications

### Asset Details

- **File Format**: Pre-pixelated PNG sprites
- **Base Resolution**: 120×120 pixels
- **Runtime Scaling**: Nearest-neighbor to device resolution
- **Supported Devices**: 480×480, 390×390, 360×360 (any round ZeppOS display)
- **Color Depth**: 24-bit RGB with transparency
- **File Size**: ~20KB per sprite (compressed PNG)
- **Total Assets**: 7 biomes × 6 stages × 3 frames avg = ~126 sprites
- **Total Storage**: ~2.5MB

### File Naming Convention

```
backgrounds/
├── lightning_stage1_frame1.png
├── lightning_stage1_frame2.png
├── lightning_stage1_frame3.png
├── lightning_stage2_frame1.png
...
├── volcano_stage6_frame3.png
├── forest_stage6_frame3.png
├── storm_volcano_stage1_frame1.png
...
└── aurora_stage6_frame4.png
```

### Biome Selection Logic (Threshold-Based Zones)

```javascript
function calculateBiome(speed, power, endurance) {
  // Calculate total and percentages
  const total = speed + power + endurance;
  const speedPct = (speed / total) * 100;
  const powerPct = (power / total) * 100;
  const endurancePct = (endurance / total) * 100;

  // Find dominant affinity
  const max = Math.max(speedPct, powerPct, endurancePct);

  // Pure biome if one affinity > 50%
  if (max > 50) {
    if (speedPct === max) return "lightning_storms";
    if (powerPct === max) return "volcanic_terrain";
    if (endurancePct === max) return "deep_forest";
  }

  // Hybrid biomes when two affinities close (within 15 points)
  if (Math.abs(speedPct - powerPct) <= 15 &&
      speedPct + powerPct > endurancePct + 20) {
    return "storm_over_volcano";
  }

  if (Math.abs(powerPct - endurancePct) <= 15 &&
      powerPct + endurancePct > speedPct + 20) {
    return "geothermal_grove";
  }

  if (Math.abs(speedPct - endurancePct) <= 15 &&
      speedPct + endurancePct > powerPct + 20) {
    return "electric_forest";
  }

  // Balanced state (all within 20 points)
  if (Math.abs(speedPct - powerPct) <= 20 &&
      Math.abs(powerPct - endurancePct) <= 20) {
    return "shifting_aurora";
  }

  // Fallback to dominant
  if (speedPct === max) return "lightning_storms";
  if (powerPct === max) return "volcanic_terrain";
  return "deep_forest";
}
```

### Hysteresis to Prevent Oscillation

To prevent rapid biome switching when affinities fluctuate:
- Require 5-10 point difference from current biome to trigger change
- Check biome on feed events, not every render
- Cache current biome in creature state

```javascript
function shouldChangeBiome(currentBiome, newBiome, affinities) {
  if (currentBiome === newBiome) return false;

  // Require clear shift (not just 1-2 point difference)
  const threshold = 10; // points

  // Implementation depends on specific affinity values
  // This prevents flickering between similar states
  return true; // Simplified
}
```

---

## Animation System

### Frame Specifications

**Animation Types by Biome:**

| Biome | Frames | Animation Description |
|-------|--------|----------------------|
| Lightning Storms | 3-4 | Lightning bolt positions change, clouds shift |
| Volcanic Terrain | 3 | Lava bubbles, glow intensity shifts |
| Deep Forest | 2-3 | Leaves sway, tree shadows shift |
| Storm Over Volcano | 4 | Lightning + lava animations combined |
| Geothermal Grove | 3 | Steam pulses, ember glow shifts |
| Electric Forest | 3-4 | Lightning arcs + leaf movement |
| Shifting Aurora | 4 | Colors cycle through spectrum |

### Timing Logic (Independent Randomized)

Each landscape instance gets:
- Random initial delay: 0-1000ms
- Random frame duration: 2000-3000ms per frame
- Loops continuously while on screen

```javascript
class BackgroundAnimator {
  constructor(biome, stage) {
    this.biome = biome;
    this.stage = stage;
    this.currentFrame = 1;
    this.frameCount = this.getFrameCount(biome);
    this.interval = null;
  }

  start(widget) {
    // Random initial delay
    const initialDelay = Math.random() * 1000;

    setTimeout(() => {
      this.interval = setInterval(() => {
        this.currentFrame = (this.currentFrame % this.frameCount) + 1;
        const src = `backgrounds/${this.biome}_stage${this.stage}_frame${this.currentFrame}.png`;
        widget.setProperty(hmUI.prop.SRC, src);
      }, 2000 + Math.random() * 1000); // 2-3 seconds randomized
    }, initialDelay);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
```

### Performance Optimization

- Only one background renders at a time
- Frame switching updates image source only (no canvas redraw)
- Intervals pause when app in background
- Clean up all intervals in `onDestroy()` lifecycle
- Maximum 4 frames per biome keeps memory low

---

## Rendering Architecture

### Layer Stack (Bottom to Top)

1. **Background Layer** (z-index: 0)
   - Animated landscape sprite scaled to device size
   - Full-screen circular composition

2. **Blob Layer** (z-index: 1)
   - Creature always renders on top
   - Centered in display

3. **UI Layer** (z-index: 2)
   - Text, buttons, XP bar
   - Slight transparency or shadows for readability over backgrounds

### ZeppOS Implementation

```javascript
// page/home/index.js

let backgroundWidget;
let backgroundAnimator;

function renderBackground(biome, stage) {
  // Create or update background widget
  if (!backgroundWidget) {
    backgroundWidget = hmUI.createWidget(hmUI.widget.IMG, {
      x: 0,
      y: 0,
      w: 480,
      h: 480,
      src: `backgrounds/${biome}_stage${stage}_frame1.png`,
      image_rendering: 'pixelated' // Nearest-neighbor scaling
    });
  }

  // Start animation
  if (backgroundAnimator) {
    backgroundAnimator.stop();
  }
  backgroundAnimator = new BackgroundAnimator(biome, stage);
  backgroundAnimator.start(backgroundWidget);
}

function onDestroy() {
  // Clean up
  if (backgroundAnimator) {
    backgroundAnimator.stop();
  }
}
```

### Device Resolution Handling

```javascript
function getDeviceScale() {
  const deviceWidth = hmSetting.getDeviceInfo().width;
  return deviceWidth / 120; // Base resolution is 120×120
}

function scaleBackground() {
  const scale = getDeviceScale();
  const scaledSize = 120 * scale;

  // Center on screen if needed
  const offset = (deviceWidth - scaledSize) / 2;

  return {
    x: offset,
    y: offset,
    w: scaledSize,
    h: scaledSize
  };
}
```

**Supported Resolutions:**
- 480×480 (4x scale) - T-Rex 3, most Zepp OS watches
- 390×390 (3.25x scale) - Some Amazfit models
- 360×360 (3x scale) - Smaller round displays
- Future resolutions automatically supported via scaling logic

---

## Asset Creation Workflow

### Tools

- **Recommended**: [Aseprite](https://www.aseprite.org/) - Professional pixel art editor with animation support
- **Free Alternative**: [Piskel](https://www.piskelapp.com/) - Browser-based pixel editor
- **Export**: PNG with transparency, no metadata

### Creation Process

**For each biome:**

1. **Create Stage 6 (Transcendent) first** - 30-45 mins
   - This is your target "epic" version
   - Full detail, complex elements, rich atmosphere
   - Sets the visual benchmark

2. **Create Stage 1 (Egg)** - 10-15 mins
   - Simplest version: basic shapes, minimal elements
   - Should be clearly recognizable but sparse

3. **Interpolate Stages 2-5** - 15-20 mins each
   - Gradually add elements from Stage 1 → Stage 6
   - Stage 2: 1-2 new elements
   - Stage 3: Recognizable landscape features
   - Stage 4: Rich detail starting
   - Stage 5: Almost as complex as Stage 6

4. **Add Animation Frames** - 10 mins per frame
   - Create 2-4 variants per stage
   - Move key elements slightly:
     - Lightning: Reposition bolt pixels
     - Volcano: Shift lava glow
     - Forest: Adjust leaf/branch positions
   - Keep changes subtle

### Example: Lightning Storms Stage Breakdown

**Stage 1 (Egg):**
- 5-6 cloud pixels at top
- Single 3-pixel lightning bolt
- Dark gradient background (2-3 colors)

**Stage 3 (Juvenile):**
- Multiple cloud formations (15-20 pixels)
- 2-3 lightning bolts with branches
- Wind streak effects (3-4 lines)
- More dramatic sky gradient

**Stage 6 (Transcendent):**
- Full storm system (40-50 cloud pixels)
- 4-5 complex branching lightning bolts
- Rain streaks, wind particles
- Electric glow effects around bolts
- Multi-layer cloud depth
- Dramatic lighting effects

### Time Estimate

- **Per biome**: ~6 stages × 25 mins avg + 3 frames × 6 stages × 10 mins = 330 mins (~5.5 hours)
- **Total project**: 7 biomes × 5.5 hours = ~38-40 hours of pixel art work
- Can be done incrementally (one biome at a time, test as you go)

### Quality Checklist

- [ ] Circular composition works well (no important details cut off at edges)
- [ ] Clear visual distinction between biomes at all stages
- [ ] Smooth progression from minimal (Stage 1) to epic (Stage 6)
- [ ] Animation frames have subtle but noticeable changes
- [ ] Colors match affinity palettes
- [ ] Readable at 120×120 and scaled sizes
- [ ] File sizes optimized (<25KB per sprite)

---

## Integration with Existing Aayu Systems

### Storage Updates

Add to creature state in `lib/storage.js`:

```javascript
{
  // Existing fields...
  id: "blob_001",
  stage: 3,
  affinities: { speed: 45, power: 62, endurance: 38 },

  // New background fields
  currentBiome: "volcanic_terrain",     // Current biome type
  lastBiomeUpdate: 1705400000000,       // Timestamp of last biome change
  biomeTransitionQueued: false          // Flag for smooth transitions
}
```

### Files to Modify

**New Files:**
- `assets/backgrounds/` - Directory with 126 sprite files
- `lib/background.js` - Background rendering and animation logic

**Modified Files:**
- `page/home/index.js` - Add background rendering before blob
- `lib/affinity.js` - Add `calculateBiome()` function
- `lib/creature.js` - Update biome state on affinity changes
- `lib/render.js` - Integrate background layer in render pipeline

### Home Screen Layout Update

Current home screen with new background layer:

```
┌─────────────────────────────────┐
│  [Dynamic Background - Full]    │  ← New: Animated landscape
│    Name          Streak Badge   │  ← Existing UI
│                                 │
│        Stage                    │
│                                 │
│          ◉ ◉                    │
│         (███)                   │  ← Blob (now on top of background)
│          ~~~                    │
│                                 │
│      😊 Happy                   │
│   ▓▓▓▓▓▓▓▓░░░░ 72%             │  ← XP bar
│   200 / 500 XP to Mature       │
│                                 │
│     [Feed Button]               │  ← Green gradient button
│                                 │
│  Daily Goal: 8,432 / 10,000    │
└─────────────────────────────────┘
```

**UI Readability Enhancements:**
- Add subtle text shadows or glows for readability
- XP bar with semi-opaque background
- Feed button with solid background (not transparent)
- Consider darkening background slightly behind UI elements

---

## Edge Cases & Error Handling

### Missing Sprite Files

```javascript
function loadBackgroundSprite(biome, stage, frame) {
  const path = `backgrounds/${biome}_stage${stage}_frame${frame}.png`;

  try {
    // Attempt to load sprite
    return path;
  } catch (error) {
    console.error(`Missing sprite: ${path}`);

    // Fallback to solid gradient matching affinity
    return getFallbackGradient(biome);
  }
}

function getFallbackGradient(biome) {
  const gradients = {
    lightning_storms: "gradient_blue",
    volcanic_terrain: "gradient_orange",
    deep_forest: "gradient_purple",
    // ... etc
  };

  return gradients[biome] || "gradient_neutral";
}
```

### Biome Oscillation Prevention

If affinities fluctuate (48% vs 52%), don't change landscape daily:

```javascript
function updateBiomeIfNeeded(creature, newAffinities) {
  const newBiome = calculateBiome(
    newAffinities.speed,
    newAffinities.power,
    newAffinities.endurance
  );

  // Require significant change to switch biomes
  if (newBiome === creature.currentBiome) {
    return false; // No change
  }

  // Check if change is significant (5-10 point threshold)
  const changeSignificant = checkAffinityShift(
    creature.affinities,
    newAffinities,
    threshold = 10
  );

  if (changeSignificant) {
    creature.currentBiome = newBiome;
    creature.lastBiomeUpdate = Date.now();
    creature.biomeTransitionQueued = true;
    return true;
  }

  return false; // Change too small, keep current biome
}
```

### Evolution Moment Handling

Special handling when blob evolves:

```javascript
function onEvolution(creature, newStage) {
  // Pause background animation briefly
  backgroundAnimator.stop();

  // Flash or ripple effect
  playTransitionEffect("evolution");

  // Wait 1 second
  setTimeout(() => {
    // Update to new stage background
    renderBackground(creature.currentBiome, newStage);
  }, 1000);
}
```

### First Launch Experience

```javascript
function initializeFirstTime() {
  // Start with neutral balanced state
  creature.currentBiome = "shifting_aurora";
  creature.stage = 1; // Egg

  // After first feed, calculate actual biome
  onFirstFeed(() => {
    const biome = calculateBiome(
      creature.affinities.speed,
      creature.affinities.power,
      creature.affinities.endurance
    );

    creature.currentBiome = biome;
    creature.biomeTransitionQueued = true;

    // Show "Your world is awakening..." message
    showMessage("Your world takes shape...");
  });
}
```

### Performance Degradation

```javascript
let frameRate = 60;
let animationEnabled = true;

function monitorPerformance() {
  if (frameRate < 30) {
    // Reduce animation frame rate
    backgroundAnimator.setFrameDuration(4000); // Slower
  }

  if (frameRate < 20) {
    // Disable background animation entirely
    backgroundAnimator.stop();
    animationEnabled = false;

    // Show static background only
    showMessage("Performance mode: Animations paused");
  }
}

// Settings option
function toggleBackgroundAnimation(enabled) {
  animationEnabled = enabled;
  if (!enabled) {
    backgroundAnimator.stop();
  } else {
    backgroundAnimator.start(backgroundWidget);
  }
}
```

### Storage Optimization

With ~2.5MB of sprites:

```javascript
// Lazy loading strategy
let loadedBiomes = new Set();

function loadBiomeSprites(biome, stage) {
  const key = `${biome}_stage${stage}`;

  if (loadedBiomes.has(key)) {
    return; // Already loaded
  }

  // Load only current stage sprites
  for (let frame = 1; frame <= getFrameCount(biome); frame++) {
    preloadImage(`backgrounds/${biome}_stage${stage}_frame${frame}.png`);
  }

  loadedBiomes.add(key);

  // Unload old biomes if memory constrained
  if (loadedBiomes.size > 3) {
    unloadOldestBiome();
  }
}
```

---

## Testing Checklist

### Visual Testing
- [ ] All 42 landscapes (7 biomes × 6 stages) render correctly
- [ ] Circular composition looks good at edges (no cut-off details)
- [ ] Blob remains clearly visible over all backgrounds
- [ ] UI text readable over all backgrounds
- [ ] Colors match affinity palettes

### Animation Testing
- [ ] All frame loops cycle smoothly (no stuttering)
- [ ] Independent timing creates organic feel (not synchronized)
- [ ] No memory leaks after extended runtime
- [ ] Proper cleanup when navigating away from home screen
- [ ] Animations pause when app in background

### Logic Testing
- [ ] Biome changes at correct affinity thresholds
- [ ] Hysteresis prevents rapid oscillation
- [ ] Evolution triggers correct stage update
- [ ] First launch shows aurora → biome transition
- [ ] Hybrid biomes appear when affinities balanced

### Performance Testing
- [ ] No dropped frames on target devices
- [ ] Battery impact acceptable (<5% additional drain)
- [ ] Loading time under 2 seconds
- [ ] Smooth blob animations maintained
- [ ] Works on 480×480, 390×390, 360×360 displays

### Edge Case Testing
- [ ] Missing sprite fallback works correctly
- [ ] Performance degradation handled gracefully
- [ ] Storage limits don't cause crashes
- [ ] First-time experience flows smoothly

---

## Success Criteria

1. **Immersive**: Backgrounds make the blob feel like it lives in a real world
2. **Meaningful**: Landscape clearly reflects blob's affinity and growth
3. **Performant**: No impact on blob animations or app responsiveness
4. **Polished**: Smooth animations, clean transitions, no glitches
5. **Scalable**: Works across all ZeppOS devices automatically

---

## Future Enhancements (Post-v1)

These are deferred but noted for consideration:

- **Weather effects**: Rain, snow, fog overlays based on mood
- **Day/night cycle**: Subtle lighting changes based on time of day
- **Rare biome variants**: Ultra-rare landscape mutations at high evolution
- **Parallax scrolling**: Multiple depth layers with touch-drag interaction
- **Seasonal themes**: Limited-time backgrounds for holidays/events
- **User customization**: Unlock ability to manually select favorite backgrounds
- **Interactive elements**: Tap background to trigger small effects (lightning strike, lava burst)

---

## Implementation Priority

**Phase 1** (Core):
1. Implement biome selection logic
2. Create Stage 1 & Stage 6 for all 7 biomes (basic + epic only)
3. Integrate static backgrounds on home screen
4. Test threshold system with manual affinity changes

**Phase 2** (Animation):
1. Add 2-3 animation frames per existing landscape
2. Implement animation system with randomized timing
3. Test performance and optimize

**Phase 3** (Complete):
1. Fill in Stages 2-5 for all biomes
2. Polish transitions and edge cases
3. Multi-device resolution testing
4. Final optimization and cleanup

Total estimated time: 40-50 hours (can be done incrementally)
