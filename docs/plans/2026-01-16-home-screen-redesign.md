# FitBlob Home Screen Redesign

## Overview
Redesign the home screen with a Gaming/Vibrant style featuring bold colors, glowing effects, and proper spacing for the 480x480 round display.

## Design: Circular Zones Layout

### Zone 1: Top Arc (y: 30-100)
- **Name**: White, 26px, centered at y:45 with subtle purple glow
- **Stage**: Gold/purple, 16px with star icon at y:75
- **Streak badge**: Top-right (x:380, y:35), orange gradient pill with flame icon

### Zone 2: Center (y: 120-320)
- **Blob position**: Centered at x:240, y:220
- **Aura ring**: Pulsing circle, affinity color at 50% opacity
- **Glow layer**: Radial glow behind blob at 30% opacity
- **Body**: Solid circle colored by dominant affinity
  - Speed: Cyan (0x00BFFF)
  - Power: Orange (0xFF6B35)
  - Endurance: Purple (0x9B59B6)
- **Eyes**: 15% of blob size with large white highlights
- **Optional**: Floating particles around blob

### Zone 3: Bottom Arc (y: 320-450)
- **Mood** (y:330): Emoji + text, color by mood state
- **XP Bar** (y:360): 280px wide, 16px tall, gradient purple with shimmer
- **Evolution label** (y:382): Gray 14px text below bar
- **Feed button** (y:405): 180x48 green gradient pill with glow
- **Daily goal** (y:445): Small gray footer text

## Color Palette
```
Background:     #0d0d1a → #1a1a2e
Primary Text:   #FFFFFF
Secondary Text: #888888
Accent Purple:  #9B59B6 / #E066FF (glow)
Accent Orange:  #FF6B35
Accent Cyan:    #00BFFF
Success Green:  #4CAF50
Warning:        #FF5722
```

## Animations
1. **Blob pulse**: Aura expands/contracts every 2s
2. **Button glow**: Pulses when XP available
3. **XP shimmer**: Gradient sweep every 3s

## Files to Modify
- `page/home/index.js` - Complete UI rebuild
- `lib/render.js` - Enhanced blob with glow/aura

## Technical Notes
- Use setInterval for animations
- Clean up intervals in onDestroy()
- Keep animations subtle for battery
