# Home Page RPG Design

## Overview

Transform the Home page with RPG-style visual polish while maintaining responsive design for all ZeppOS devices (360px - 480px screens).

## Responsive Design Approach

- Use `px()` function for all dimensions (scales from 480px baseline)
- Get actual screen dimensions via `getDeviceInfo()` - don't wrap in `px()`
- Safe margins for round screen edges: `px(60)` on sides
- All elements centered horizontally using `CX = W / 2`

## Section 1: Top Area - Name Banner & Stage Badge

### Name Banner (Y: ~50-90px)
- Decorative horizontal banner/plate centered at top
- Dark card background (`bgCard: 0x12121a`) with subtle border
- Creature name in primary white text, ~24px font
- Small decorative accent lines on left and right sides
- Rounded corners for pill/banner shape
- Width: ~200px, Height: ~36px

### Stage Badge (Y: ~95-130px)
- Positioned directly below name banner
- Shows stage name (Hatchling, Juvenile, Adult, etc.)
- Color-coded border/glow based on dominant affinity:
  - Speed → Blue (`0x00BFFF`)
  - Power → Orange (`0xFF6B35`)
  - Endurance → Purple (`0x9B59B6`)
- Compact pill shape with icon + stage name
- If streak > 0, show flame icon + number beside badge
- Width: ~130px, Height: ~28px

## Section 2: Creature Pedestal Area

### Glowing Pedestal Base (Y: ~280-320px)
- Elliptical shape beneath blob creating "standing on platform" effect
- Three layered rings for depth:
  1. Outer glow ring - Large, soft (affinity glow color ~20% intensity)
  2. Middle ring - Darker shade of affinity color
  3. Inner platform - Solid dark surface (`bgCard`)
- Pedestal width: ~60% of blob size
- Height compressed to ~30% for ellipse effect
- Scales with blob size (STAGE_SIZES multiplier)

### Blob Display Area (Y: ~210px center)
- Blob remains at current position (BLOB_Y = H * 0.44)
- Existing animations preserved (breathing, bobbing, blinking)
- Affinity-based shape and colors unchanged

### Ambient Aura
- Subtle outer glow behind blob
- Matches dominant affinity color at low opacity
- Pulses with breathing animation

## Section 3: Bottom Area

### Mood Display (Y: ~330-355px)
- Icon + text format: "Happy!" / "Content" / "Needs love"
- Text color matches mood state (green/gray/orange)
- Centered, compact single line
- Subtle glow when mood high (>=70)

### XP Progress Bar (Y: ~365-385px)
- Width: ~260px
- Decorative diamond end caps on both ends
- Dark background track with rounded corners
- Fill color matches dominant affinity
- Shimmer highlight line along top edge
- XP text below: "{current}/{threshold} XP"

### Feed Button (Y: ~415-455px)
- Available state: Pulsing glow, pill-shaped, affinity border
- Text: "Feed +{XP}" with icon
- Success green background
- Fed state: "Fed Today" status badge (no button)
- No activity: "Get active to feed!" muted text

### Page Indicator Dots (Y: ~465px)
- 5 dots for 5 pages
- Active dot (index 0): Larger, white, glow ring
- Inactive dots: Smaller, muted gray

## Color Palette

```javascript
const COLORS = {
  bgDark: 0x08080c,
  bgCard: 0x12121a,
  bgCardLight: 0x1a1a24,

  textPrimary: 0xFFFFFF,
  textSecondary: 0xB0B0C0,
  textMuted: 0x606070,

  speed: 0x00BFFF,
  speedDark: 0x005580,
  speedGlow: 0x002840,

  power: 0xFF6B35,
  powerDark: 0x993F1F,
  powerGlow: 0x4d1f0f,

  endurance: 0x9B59B6,
  enduranceDark: 0x5D356D,
  enduranceGlow: 0x2e1a36,

  success: 0x4CAF50,
  successDark: 0x2E7D32,
  gold: 0xFFD700
}
```

## Implementation Notes

1. Keep existing animation system intact
2. Pedestal elements added to `staticWidgets` array
3. Aura glow can be part of `blobWidgets` to animate with blob
4. All new elements use `px()` function
5. Test on 480px, 454px, and 360px screen widths
