// Affinity-Based Blob Shape Definitions for FitBlob
// Zepp OS Widget-based shape rendering

import * as hmUI from '@zos/ui'

// Colors for each affinity
export const AFFINITY_COLORS = {
  speed: {
    primary: 0x00BFFF,    // Cyan
    accent: 0x87CEEB,     // Light blue
    trail: 0x006080,      // Dark cyan
    glow: 0x003344,       // Deep blue glow
    electric: 0xFFFF00    // Electric yellow
  },
  power: {
    primary: 0xFF6B35,    // Orange
    accent: 0xFFAA00,     // Gold orange
    spike: 0xCC4400,      // Dark orange
    glow: 0x441100,       // Deep red glow
    flame: 0xFF4444       // Bright flame
  },
  endurance: {
    primary: 0x9B59B6,    // Purple
    accent: 0xBB8FCE,     // Light purple
    ring: 0x4A235A,       // Dark purple
    glow: 0x1a0a22,       // Deep purple glow
    crystal: 0xE8D5FF     // Crystal shine
  },
  balanced: {
    primary: 0xCCCCCC,    // Gray
    accent: 0xFFFFFF,     // White
    secondary: 0x888888,  // Medium gray
    glow: 0x222222,       // Dark glow
    shine: 0xFFFFFF       // White shine
  }
}

// Evolution stage names for reference
const STAGE_NAMES = {
  1: 'Egg',
  2: 'Hatchling',
  3: 'Juvenile',
  4: 'Mature',
  5: 'Apex',
  6: 'Transcendent'
}

// Stage affects shape intensity
const STAGE_INTENSITY = {
  1: 0.3,   // Egg: very subtle
  2: 0.5,   // Hatchling: subtle
  3: 0.7,   // Juvenile: noticeable
  4: 0.9,   // Mature: strong
  5: 1.0,   // Apex: full expression
  6: 1.2    // Transcendent: enhanced
}

/**
 * Determine dominant affinity type
 * @param {object} affinities - { speed, power, endurance }
 * @returns {string} Shape type: 'speed', 'power', 'endurance', or 'balanced'
 */
export function getShapeType(affinities) {
  const { speed, power, endurance } = affinities
  const max = Math.max(speed, power, endurance)
  const threshold = max - 10 // Within 10 points considered tied

  const dominant = []
  if (speed >= threshold) dominant.push('speed')
  if (power >= threshold) dominant.push('power')
  if (endurance >= threshold) dominant.push('endurance')

  if (dominant.length === 1) return dominant[0]
  if (dominant.length >= 2) return 'balanced' // Mixed or all balanced
  return 'balanced'
}

/**
 * Get color palette for creature
 * @param {object} affinities - Creature affinities
 * @returns {object} Color palette
 */
export function getColorPalette(affinities) {
  const type = getShapeType(affinities)
  return AFFINITY_COLORS[type]
}

/**
 * Create Speed blob shape - streamlined, horizontal oval with motion trails
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {number} size - Base size
 * @param {number} stage - Evolution stage (1-6)
 * @param {function} px - Pixel scaling function
 * @returns {array} Array of widget objects
 */
export function createSpeedBlob(x, y, size, stage, px) {
  const widgets = []
  const intensity = STAGE_INTENSITY[stage] || 1.0
  const colors = AFFINITY_COLORS.speed

  // Main body: horizontal oval (wider than tall)
  const bodyW = Math.round(size * (1 + 0.15 * intensity))
  const bodyH = Math.round(size * (1 - 0.1 * intensity))

  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - bodyW / 2,
    y: y - bodyH / 2,
    w: bodyW,
    h: bodyH,
    radius: bodyH / 2,
    color: colors.primary
  }))

  // Motion trail dots (intensity determines count)
  const trailCount = Math.min(3, Math.ceil(intensity * 3))
  for (let i = 1; i <= trailCount; i++) {
    const trailSize = Math.max(px(4), Math.round(px(10) / i))
    const trailX = x - bodyW / 2 - px(10 * i)

    widgets.unshift(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: trailX - trailSize / 2,
      y: y - trailSize / 2,
      w: trailSize,
      h: trailSize,
      radius: trailSize / 2,
      color: colors.trail
    }))
  }

  return widgets
}

/**
 * Create Power blob shape - bulky, squared corners with spikes
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {number} size - Base size
 * @param {number} stage - Evolution stage (1-6)
 * @param {function} px - Pixel scaling function
 * @returns {array} Array of widget objects
 */
export function createPowerBlob(x, y, size, stage, px) {
  const widgets = []
  const intensity = STAGE_INTENSITY[stage] || 1.0
  const colors = AFFINITY_COLORS.power

  // Main body: slightly larger, more squared
  const bodySize = Math.round(size * (1 + 0.05 * intensity))
  const cornerRadius = Math.round(bodySize / (2 + intensity)) // Less rounded = more angular

  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - bodySize / 2,
    y: y - bodySize / 2,
    w: bodySize,
    h: bodySize,
    radius: cornerRadius,
    color: colors.primary
  }))

  // Spike accents (intensity determines count and size)
  const spikeCount = Math.min(4, Math.ceil(intensity * 4))
  const spikeSize = Math.round(px(8) * intensity)
  const spikeDistance = bodySize / 2 + px(2)

  const spikePositions = [
    { dx: 0, dy: -spikeDistance },           // Top
    { dx: spikeDistance, dy: 0 },            // Right
    { dx: 0, dy: spikeDistance },            // Bottom
    { dx: -spikeDistance, dy: 0 }            // Left
  ]

  for (let i = 0; i < spikeCount; i++) {
    const pos = spikePositions[i]
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + pos.dx - spikeSize / 2,
      y: y + pos.dy - spikeSize / 2,
      w: spikeSize,
      h: spikeSize,
      radius: px(2),
      color: colors.spike
    }))
  }

  return widgets
}

/**
 * Create Endurance blob shape - stable, vertical oval with grounding base
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {number} size - Base size
 * @param {number} stage - Evolution stage (1-6)
 * @param {function} px - Pixel scaling function
 * @returns {array} Array of widget objects
 */
export function createEnduranceBlob(x, y, size, stage, px) {
  const widgets = []
  const intensity = STAGE_INTENSITY[stage] || 1.0
  const colors = AFFINITY_COLORS.endurance

  // Stability ring behind (subtle outer glow)
  if (intensity >= 0.5) {
    const ringSize = Math.round(size + px(16) * intensity)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - ringSize / 2,
      y: y - ringSize / 2,
      w: ringSize,
      h: ringSize,
      radius: ringSize / 2,
      color: colors.ring
    }))
  }

  // Main body: vertical oval (taller than wide)
  const bodyW = Math.round(size * (1 - 0.05 * intensity))
  const bodyH = Math.round(size * (1 + 0.1 * intensity))

  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - bodyW / 2,
    y: y - bodyH / 2,
    w: bodyW,
    h: bodyH,
    radius: bodyW / 2,
    color: colors.primary
  }))

  // Grounding base (wider bottom accent)
  if (intensity >= 0.3) {
    const baseW = Math.round(bodyW * 0.7 * intensity)
    const baseH = px(6)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - baseW / 2,
      y: y + bodyH / 2 - baseH / 2,
      w: baseW,
      h: baseH,
      radius: baseH / 2,
      color: colors.accent
    }))
  }

  return widgets
}

/**
 * Create Balanced blob shape - neutral circular
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {number} size - Base size
 * @param {number} stage - Evolution stage (1-6)
 * @param {function} px - Pixel scaling function
 * @returns {array} Array of widget objects
 */
export function createBalancedBlob(x, y, size, stage, px) {
  const widgets = []
  const colors = AFFINITY_COLORS.balanced

  // Simple circular body
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - size / 2,
    y: y - size / 2,
    w: size,
    h: size,
    radius: size / 2,
    color: colors.primary
  }))

  return widgets
}

/**
 * Create blob body based on affinity type
 * @param {object} affinities - Creature affinities
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {number} size - Base size
 * @param {number} stage - Evolution stage (1-6)
 * @param {function} px - Pixel scaling function
 * @returns {array} Array of widget objects for body
 */
export function createBlobBody(affinities, x, y, size, stage, px) {
  const type = getShapeType(affinities)

  switch (type) {
    case 'speed':
      return createSpeedBlob(x, y, size, stage, px)
    case 'power':
      return createPowerBlob(x, y, size, stage, px)
    case 'endurance':
      return createEnduranceBlob(x, y, size, stage, px)
    default:
      return createBalancedBlob(x, y, size, stage, px)
  }
}

/**
 * Create blob eyes
 * @param {number} x - Blob center X
 * @param {number} y - Blob center Y
 * @param {number} size - Blob size
 * @param {string} mood - 'happy', 'neutral', or 'sad'
 * @param {function} px - Pixel scaling function
 * @returns {array} Array of widget objects for eyes
 */
export function createBlobEyes(x, y, size, mood, px) {
  const widgets = []

  const eyeSize = Math.round(size * 0.12)
  const eyeSpacing = Math.round(size * 0.3)
  const eyeY = y - Math.round(size * 0.05)

  // Mood affects eye height
  const eyeH = mood === 'sad' ? Math.round(eyeSize * 0.5) : eyeSize

  // Left eye
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - eyeSpacing / 2 - eyeSize / 2,
    y: eyeY - eyeH / 2,
    w: eyeSize,
    h: eyeH,
    radius: eyeSize / 2,
    color: 0x000000
  }))

  // Right eye
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x + eyeSpacing / 2 - eyeSize / 2,
    y: eyeY - eyeH / 2,
    w: eyeSize,
    h: eyeH,
    radius: eyeSize / 2,
    color: 0x000000
  }))

  // Eye highlights
  const hlSize = Math.round(eyeSize * 0.4)
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - eyeSpacing / 2 - eyeSize / 4,
    y: eyeY - eyeH / 3,
    w: hlSize,
    h: hlSize,
    radius: hlSize / 2,
    color: 0xFFFFFF
  }))
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x + eyeSpacing / 2 - eyeSize / 4,
    y: eyeY - eyeH / 3,
    w: hlSize,
    h: hlSize,
    radius: hlSize / 2,
    color: 0xFFFFFF
  }))

  return widgets
}

/**
 * Create blob mouth based on mood
 * @param {number} x - Blob center X
 * @param {number} y - Blob center Y
 * @param {number} size - Blob size
 * @param {string} mood - 'happy', 'neutral', or 'sad'
 * @param {function} px - Pixel scaling function
 * @returns {array} Array of widget objects for mouth
 */
export function createBlobMouth(x, y, size, mood, px) {
  const widgets = []

  if (mood === 'happy') {
    const mouthW = Math.round(size * 0.2)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - mouthW / 2,
      y: y + Math.round(size * 0.15),
      w: mouthW,
      h: px(4),
      radius: px(2),
      color: 0x000000
    }))
  }

  return widgets
}

/**
 * Create body highlight
 * @param {number} x - Blob center X
 * @param {number} y - Blob center Y
 * @param {number} size - Blob size
 * @param {function} px - Pixel scaling function
 * @returns {array} Array of widget objects
 */
export function createBlobHighlight(x, y, size, px) {
  const widgets = []

  const highlightSize = Math.round(size * 0.25)
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - size / 4,
    y: y - size / 3,
    w: highlightSize,
    h: Math.round(highlightSize * 0.6),
    radius: Math.round(highlightSize * 0.3),
    color: 0xFFFFFF
  }))

  return widgets
}

// ==================== TRAIT HELPERS ====================

/**
 * Blend two colors together
 * @param {number} color1 - First color
 * @param {number} color2 - Second color
 * @param {number} ratio - Blend ratio (0 = color1, 1 = color2)
 * @returns {number} Blended color
 */
export function blendColors(color1, color2, ratio) {
  const r1 = (color1 >> 16) & 0xFF
  const g1 = (color1 >> 8) & 0xFF
  const b1 = color1 & 0xFF

  const r2 = (color2 >> 16) & 0xFF
  const g2 = (color2 >> 8) & 0xFF
  const b2 = color2 & 0xFF

  const r = Math.round(r1 + (r2 - r1) * ratio)
  const g = Math.round(g1 + (g2 - g1) * ratio)
  const b = Math.round(b1 + (b2 - b1) * ratio)

  return (r << 16) | (g << 8) | b
}

/**
 * Get a darker shade of a color
 * @param {number} color - Hex color value
 * @param {number} factor - Darkness factor (0 = black, 1 = original)
 * @returns {number} Darkened color
 */
export function getDarkerColor(color, factor) {
  const r = Math.round(((color >> 16) & 0xFF) * factor)
  const g = Math.round(((color >> 8) & 0xFF) * factor)
  const b = Math.round((color & 0xFF) * factor)
  return (r << 16) | (g << 8) | b
}

/**
 * Convert HSV to RGB hex color
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-1)
 * @param {number} v - Value (0-1)
 * @returns {number} RGB hex color
 */
export function hsvToHex(h, s, v) {
  const c = v * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = v - c

  let r, g, b
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  const rInt = Math.round((r + m) * 255)
  const gInt = Math.round((g + m) * 255)
  const bInt = Math.round((b + m) * 255)

  return (rInt << 16) | (gInt << 8) | bInt
}

// ==================== TRAIT COLORS ====================

const TRAIT_COLORS = {
  color_shift_blue: 0x00BFFF,
  color_shift_red: 0xFF4444,
  golden_form: 0xFFD700
}

/**
 * Apply color shift traits to a base color
 * @param {number} baseColor - Original color
 * @param {array} activeTraits - Active trait IDs
 * @returns {number} Modified color
 */
export function applyColorTraits(baseColor, activeTraits) {
  if (!activeTraits || activeTraits.length === 0) return baseColor

  // Golden form takes priority (full override)
  if (activeTraits.includes('golden_form')) {
    return TRAIT_COLORS.golden_form
  }

  // Color shifts blend at 40%
  if (activeTraits.includes('color_shift_blue')) {
    return blendColors(baseColor, TRAIT_COLORS.color_shift_blue, 0.4)
  }
  if (activeTraits.includes('color_shift_red')) {
    return blendColors(baseColor, TRAIT_COLORS.color_shift_red, 0.4)
  }

  return baseColor
}

/**
 * Get eye size multiplier from active traits
 * @param {array} activeTraits - Active trait IDs
 * @returns {number} Size multiplier
 */
export function getEyeSizeMultiplier(activeTraits) {
  if (!activeTraits || activeTraits.length === 0) return 1.0

  if (activeTraits.includes('big_eyes')) return 1.5
  if (activeTraits.includes('small_eyes')) return 0.6

  return 1.0
}

// ==================== TRAIT VISUAL EFFECTS ====================

/**
 * Create glow aura effect behind blob
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} size - Blob size
 * @param {number} color - Base color
 * @param {number} frame - Animation frame (0-19 for 10fps 2s cycle)
 * @param {function} px - Pixel scaling function
 * @returns {array} Widget array
 */
export function createGlowAura(x, y, size, color, frame, px) {
  const widgets = []

  // Pulse scale based on frame (synced with breathing)
  const pulsePhase = Math.sin((frame / 20) * Math.PI * 2)
  const pulseScale = 1 + pulsePhase * 0.05

  const auraSize = Math.round((size + px(20)) * pulseScale)
  const auraColor = getDarkerColor(color, 0.3)

  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - auraSize / 2,
    y: y - auraSize / 2,
    w: auraSize,
    h: auraSize,
    radius: auraSize / 2,
    color: auraColor
  }))

  return widgets
}

/**
 * Create rainbow aura effect (color cycling)
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} size - Blob size
 * @param {number} frame - Animation frame
 * @param {function} px - Pixel scaling function
 * @returns {array} Widget array
 */
export function createRainbowAura(x, y, size, frame, px) {
  const widgets = []

  // Cycle through hues
  const hue = (frame * 18) % 360 // Full cycle over 20 frames

  // Pulse scale
  const pulsePhase = Math.sin((frame / 20) * Math.PI * 2)
  const pulseScale = 1 + pulsePhase * 0.05

  const auraSize = Math.round((size + px(20)) * pulseScale)
  const auraColor = hsvToHex(hue, 0.7, 0.5)

  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - auraSize / 2,
    y: y - auraSize / 2,
    w: auraSize,
    h: auraSize,
    radius: auraSize / 2,
    color: auraColor
  }))

  return widgets
}

/**
 * Create orbiting particles effect
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} size - Blob size
 * @param {number} color - Particle color
 * @param {number} frame - Animation frame
 * @param {function} px - Pixel scaling function
 * @returns {array} Widget array
 */
export function createParticles(x, y, size, color, frame, px) {
  const widgets = []
  const particleCount = 6
  const particleSize = px(4)
  const orbitRadius = size * 0.7

  // 120 degrees per second at 10fps = 12 degrees per frame
  const baseAngle = (frame * 12) * (Math.PI / 180)

  for (let i = 0; i < particleCount; i++) {
    const angle = baseAngle + (i / particleCount) * Math.PI * 2
    const px2 = x + Math.cos(angle) * orbitRadius
    const py = y + Math.sin(angle) * orbitRadius

    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: px2 - particleSize / 2,
      y: py - particleSize / 2,
      w: particleSize,
      h: particleSize,
      radius: particleSize / 2,
      color: color
    }))
  }

  return widgets
}

/**
 * Create small horns on top of blob
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} size - Blob size
 * @param {number} color - Body color
 * @param {function} px - Pixel scaling function
 * @returns {array} Widget array
 */
export function createHorns(x, y, size, color, px) {
  const widgets = []
  const hornColor = getDarkerColor(color, 0.7)
  const hornW = px(8)
  const hornH = px(12)
  const spacing = size * 0.3

  // Left horn (rotated rectangle approximation)
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - spacing - hornW / 2,
    y: y - size / 2 - hornH + px(4),
    w: hornW,
    h: hornH,
    radius: px(2),
    color: hornColor
  }))

  // Right horn
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x + spacing - hornW / 2,
    y: y - size / 2 - hornH + px(4),
    w: hornW,
    h: hornH,
    radius: px(2),
    color: hornColor
  }))

  return widgets
}

/**
 * Create glowing core in center of blob
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} size - Blob size
 * @param {number} frame - Animation frame
 * @param {function} px - Pixel scaling function
 * @returns {array} Widget array
 */
export function createGlowingCore(x, y, size, frame, px) {
  const widgets = []

  // Pulse brightness
  const pulsePhase = Math.sin((frame / 10) * Math.PI * 2)
  const pulseScale = 1 + pulsePhase * 0.1

  const coreSize = Math.round(size * 0.3 * pulseScale)

  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - coreSize / 2,
    y: y - coreSize / 2,
    w: coreSize,
    h: coreSize,
    radius: coreSize / 2,
    color: 0xFFFFFF
  }))

  return widgets
}

// ==================== MODIFIED BLOB EYES ====================

/**
 * Create blob eyes with trait support
 * @param {number} x - Blob center X
 * @param {number} y - Blob center Y
 * @param {number} size - Blob size
 * @param {string} mood - 'happy', 'neutral', or 'sad'
 * @param {function} px - Pixel scaling function
 * @param {number} sizeMultiplier - Eye size multiplier from traits
 * @returns {array} Array of widget objects for eyes
 */
export function createBlobEyesWithTraits(x, y, size, mood, px, sizeMultiplier = 1.0) {
  const widgets = []

  const baseEyeSize = Math.round(size * 0.12 * sizeMultiplier)
  const eyeSize = Math.max(px(4), baseEyeSize)
  const eyeSpacing = Math.round(size * 0.3)
  const eyeY = y - Math.round(size * 0.05)

  // Mood affects eye height
  const eyeH = mood === 'sad' ? Math.round(eyeSize * 0.5) : eyeSize

  // Left eye
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - eyeSpacing / 2 - eyeSize / 2,
    y: eyeY - eyeH / 2,
    w: eyeSize,
    h: eyeH,
    radius: eyeSize / 2,
    color: 0x000000
  }))

  // Right eye
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x + eyeSpacing / 2 - eyeSize / 2,
    y: eyeY - eyeH / 2,
    w: eyeSize,
    h: eyeH,
    radius: eyeSize / 2,
    color: 0x000000
  }))

  // Eye highlights
  const hlSize = Math.round(eyeSize * 0.4)
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - eyeSpacing / 2 - eyeSize / 4,
    y: eyeY - eyeH / 3,
    w: hlSize,
    h: hlSize,
    radius: hlSize / 2,
    color: 0xFFFFFF
  }))
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x + eyeSpacing / 2 - eyeSize / 4,
    y: eyeY - eyeH / 3,
    w: hlSize,
    h: hlSize,
    radius: hlSize / 2,
    color: 0xFFFFFF
  }))

  return widgets
}

// ==================== COMPLETE BLOB WITH TRAITS ====================

/**
 * Create complete blob with all elements including traits
 * NOW USES THE NEW FANTASY CREATURE EVOLUTION SYSTEM
 * @param {object} creature - Creature data
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {number} baseSize - Base size before stage scaling
 * @param {function} px - Pixel scaling function
 * @param {number} frame - Animation frame (for trait effects)
 * @returns {array} Array of all blob widgets
 */
export function createCompleteBlob(creature, x, y, baseSize, px, frame = 0) {
  // Dispatch to the appropriate creature form based on affinity and stage
  const type = getShapeType(creature.affinities)
  const mood = creature.mood >= 70 ? 'happy' : creature.mood >= 40 ? 'neutral' : 'sad'
  const stage = creature.stage || 1

  // Size scales slightly with stage
  const sizeMultiplier = 0.85 + (stage * 0.03)
  const size = Math.round(baseSize * sizeMultiplier)

  // Call the appropriate creature creation function
  switch (type) {
    case 'speed':
      return createSpeedCreatureForm(x, y, size, stage, px, mood)
    case 'power':
      return createPowerCreatureForm(x, y, size, stage, px, mood)
    case 'endurance':
      return createEnduranceCreatureForm(x, y, size, stage, px, mood)
    default:
      return createBalancedCreatureForm(x, y, size, stage, px, mood)
  }
}

// ============================================================
// FANTASY CREATURE FORMS - INLINE DEFINITIONS
// ============================================================

function addEyes(widgets, x, y, size, mood, px) {
  const eyeSize = Math.max(px(6), Math.round(size * 0.15))
  const eyeSpacing = Math.round(size * 0.3)
  const eyeH = mood === 'sad' ? Math.round(eyeSize * 0.5) : eyeSize

  // Left eye
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - eyeSpacing / 2 - eyeSize / 2, y: y - eyeH / 2,
    w: eyeSize, h: eyeH, radius: eyeSize / 2, color: 0x000000
  }))
  // Right eye
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x + eyeSpacing / 2 - eyeSize / 2, y: y - eyeH / 2,
    w: eyeSize, h: eyeH, radius: eyeSize / 2, color: 0x000000
  }))
  // Highlights
  const hlSize = Math.max(px(2), Math.round(eyeSize * 0.35))
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - eyeSpacing / 2 - eyeSize / 4, y: y - eyeH / 3,
    w: hlSize, h: hlSize, radius: hlSize / 2, color: 0xFFFFFF
  }))
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x + eyeSpacing / 2 - eyeSize / 4, y: y - eyeH / 3,
    w: hlSize, h: hlSize, radius: hlSize / 2, color: 0xFFFFFF
  }))
}

/**
 * SPEED creatures - Wind/Lightning theme
 */
function createSpeedCreatureForm(x, y, size, stage, px, mood) {
  const widgets = []
  const c = AFFINITY_COLORS.speed

  if (stage === 1) {
    // Wind Egg - oval with wispy marks
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.4, y: y - size * 0.5, w: size * 0.8, h: size,
      radius: size * 0.35, color: c.glow
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.32, y: y - size * 0.42, w: size * 0.64, h: size * 0.84,
      radius: size * 0.28, color: c.primary
    }))
    // Wind swirl marks
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(8), y: y - px(5), w: px(16), h: px(4), radius: px(2), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(5), y: y + px(3), w: px(12), h: px(3), radius: px(1), color: c.accent
    }))
  } else if (stage === 2) {
    // Breeze Blob - streamlined horizontal
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.5 - px(10), y: y - px(3), w: px(8), h: px(6), radius: px(3), color: c.trail
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.45, y: y - size * 0.35, w: size * 0.9, h: size * 0.7,
      radius: size * 0.3, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.15, y: y - size * 0.25, w: size * 0.2, h: size * 0.12,
      radius: px(4), color: 0xFFFFFF
    }))
    addEyes(widgets, x, y - px(2), size * 0.6, mood, px)
  } else if (stage === 3) {
    // Wind Sprite - wisp with tail
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(30), y: y + px(5), w: px(25), h: px(8), radius: px(4), color: c.trail
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.28, y: y - size * 0.35, w: size * 0.56, h: size * 0.7,
      radius: size * 0.22, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.2, y: y - size * 0.1, w: px(10), h: px(4), radius: px(2), color: c.accent
    }))
    addEyes(widgets, x, y - size * 0.15, size * 0.5, mood, px)
  } else if (stage === 4) {
    // Zephyr - bird-like
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.55, y: y - size * 0.1, w: size * 0.35, h: size * 0.22, radius: px(8), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.2, y: y - size * 0.1, w: size * 0.35, h: size * 0.22, radius: px(8), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.22, y: y - size * 0.28, w: size * 0.44, h: size * 0.56,
      radius: size * 0.18, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(4), y: y + size * 0.15, w: px(8), h: px(6), radius: px(2), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(5), y: y + size * 0.22, w: px(10), h: px(12), radius: px(4), color: c.trail
    }))
    addEyes(widgets, x, y - size * 0.12, size * 0.4, mood, px)
  } else if (stage === 5) {
    // Storm Swift
    for (let i = 1; i <= 3; i++) {
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.5 - px(12 * i), y: y - px(2 * i), w: px(10), h: px(4), radius: px(2), color: c.trail
      }))
    }
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.65, y: y - size * 0.15, w: size * 0.45, h: size * 0.3, radius: px(10), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.2, y: y - size * 0.15, w: size * 0.45, h: size * 0.3, radius: px(10), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.2, y: y - size * 0.28, w: size * 0.4, h: size * 0.56, radius: size * 0.16, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(3), y: y - size * 0.42, w: px(6), h: px(14), radius: px(2), color: c.electric
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(6), y: y + size * 0.22, w: px(12), h: px(16), radius: px(4), color: c.primary
    }))
    addEyes(widgets, x, y - size * 0.15, size * 0.35, mood, px)
  } else {
    // Stage 6: Thunder Phoenix
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.55, y: y - size * 0.55, w: size * 1.1, h: size * 1.1, radius: size * 0.45, color: c.glow
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.45, y: y - size * 0.08, w: px(4), h: px(18), radius: px(2), color: c.electric
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.42, y: y, w: px(4), h: px(16), radius: px(2), color: c.electric
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.7, y: y - size * 0.2, w: size * 0.5, h: size * 0.38, radius: px(10), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.2, y: y - size * 0.2, w: size * 0.5, h: size * 0.38, radius: px(10), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.18, y: y - size * 0.22, w: size * 0.36, h: size * 0.5, radius: size * 0.14, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.14, y: y - size * 0.42, w: size * 0.28, h: size * 0.28, radius: size * 0.12, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(6), y: y - size * 0.55, w: px(12), h: px(16), radius: px(4), color: c.electric
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(8), y: y + size * 0.22, w: px(16), h: px(20), radius: px(5), color: c.primary
    }))
    addEyes(widgets, x, y - size * 0.32, size * 0.25, mood, px)
  }
  return widgets
}

/**
 * POWER creatures - Fire/Flame theme
 */
function createPowerCreatureForm(x, y, size, stage, px, mood) {
  const widgets = []
  const c = AFFINITY_COLORS.power

  if (stage === 1) {
    // Ember Egg
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.4, y: y - size * 0.5, w: size * 0.8, h: size,
      radius: size * 0.35, color: c.glow
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.32, y: y - size * 0.42, w: size * 0.64, h: size * 0.84,
      radius: size * 0.28, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(4), y: y - px(12), w: px(8), h: px(14), radius: px(3), color: c.flame
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(10), y: y - px(5), w: px(6), h: px(10), radius: px(2), color: c.accent
    }))
  } else if (stage === 2) {
    // Spark Blob - chunky
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.35, y: y - size * 0.35, w: size * 0.7, h: size * 0.7,
      radius: size * 0.18, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(5), y: y - size * 0.35 - px(10), w: px(10), h: px(14), radius: px(4), color: c.flame
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.12, y: y - size * 0.2, w: size * 0.18, h: size * 0.1, radius: px(3), color: 0xFFFFFF
    }))
    addEyes(widgets, x, y - px(2), size * 0.55, mood, px)
  } else if (stage === 3) {
    // Flame Sprite
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(20), y: y - px(15), w: px(6), h: px(6), radius: px(3), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + px(18), y: y - px(10), w: px(5), h: px(5), radius: px(2), color: c.flame
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.26, y: y - size * 0.18, w: size * 0.52, h: size * 0.5,
      radius: size * 0.18, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.2, y: y - size * 0.35, w: size * 0.4, h: size * 0.35,
      radius: size * 0.16, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(8), y: y - size * 0.48, w: px(16), h: px(18), radius: px(5), color: c.flame
    }))
    addEyes(widgets, x, y - size * 0.18, size * 0.38, mood, px)
  } else if (stage === 4) {
    // Blaze - beast-like
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.38, y: y - size * 0.32, w: size * 0.76, h: size * 0.68, radius: size * 0.22, color: c.glow
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.28, y: y - size * 0.18, w: size * 0.56, h: size * 0.45, radius: size * 0.14, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.18, y: y - size * 0.4, w: size * 0.36, h: size * 0.32, radius: size * 0.12, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.2, y: y - size * 0.52, w: px(10), h: px(14), radius: px(3), color: c.spike
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.1, y: y - size * 0.52, w: px(10), h: px(14), radius: px(3), color: c.spike
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(14), y: y - size * 0.32, w: px(28), h: px(12), radius: px(4), color: c.flame
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.2, y: y + size * 0.18, w: px(10), h: px(14), radius: px(3), color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.1, y: y + size * 0.18, w: px(10), h: px(14), radius: px(3), color: c.primary
    }))
    addEyes(widgets, x, y - size * 0.28, size * 0.32, mood, px)
  } else if (stage === 5) {
    // Inferno Lion
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.5, y: y - size * 0.45, w: size, h: size * 0.9, radius: size * 0.35, color: c.glow
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.38, y: y - size * 0.5, w: size * 0.76, h: size * 0.45, radius: size * 0.18, color: c.flame
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.26, y: y - size * 0.12, w: size * 0.52, h: size * 0.4, radius: size * 0.14, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.16, y: y - size * 0.35, w: size * 0.32, h: size * 0.3, radius: size * 0.12, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(5), y: y - size * 0.12, w: px(10), h: px(7), radius: px(3), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.2, y: y + size * 0.18, w: px(12), h: px(18), radius: px(4), color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.08, y: y + size * 0.18, w: px(12), h: px(18), radius: px(4), color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.22, y: y + size * 0.08, w: px(16), h: px(10), radius: px(4), color: c.flame
    }))
    addEyes(widgets, x, y - size * 0.25, size * 0.28, mood, px)
  } else {
    // Stage 6: Solar Dragon
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.6, y: y - size * 0.55, w: size * 1.2, h: size * 1.1, radius: size * 0.45, color: c.glow
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.5, y: y - size * 0.45, w: size, h: size * 0.9, radius: size * 0.4, color: c.spike
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.65, y: y - size * 0.25, w: size * 0.42, h: size * 0.38, radius: px(10), color: c.flame
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.23, y: y - size * 0.25, w: size * 0.42, h: size * 0.38, radius: px(10), color: c.flame
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.2, y: y - size * 0.18, w: size * 0.4, h: size * 0.45, radius: size * 0.14, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(7), y: y - size * 0.35, w: px(14), h: px(18), radius: px(4), color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.14, y: y - size * 0.5, w: size * 0.28, h: size * 0.22, radius: size * 0.1, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.16, y: y - size * 0.62, w: px(8), h: px(16), radius: px(3), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.08, y: y - size * 0.62, w: px(8), h: px(16), radius: px(3), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(7), y: y + size * 0.22, w: px(14), h: px(18), radius: px(5), color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(9), y: y + size * 0.35, w: px(18), h: px(12), radius: px(5), color: c.flame
    }))
    addEyes(widgets, x, y - size * 0.42, size * 0.22, mood, px)
  }
  return widgets
}

/**
 * ENDURANCE creatures - Crystal/Cosmic theme
 */
function createEnduranceCreatureForm(x, y, size, stage, px, mood) {
  const widgets = []
  const c = AFFINITY_COLORS.endurance

  if (stage === 1) {
    // Mystic Egg
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.4, y: y - size * 0.5, w: size * 0.8, h: size,
      radius: size * 0.35, color: c.glow
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.32, y: y - size * 0.42, w: size * 0.64, h: size * 0.84,
      radius: size * 0.28, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(3), y: y - px(10), w: px(6), h: px(12), radius: px(2), color: c.crystal
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(10), y: y, w: px(8), h: px(6), radius: px(2), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + px(5), y: y + px(5), w: px(5), h: px(8), radius: px(2), color: c.crystal
    }))
  } else if (stage === 2) {
    // Calm Blob - stable vertical
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.32, y: y + size * 0.22, w: size * 0.64, h: px(8), radius: px(4), color: c.ring
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.32, y: y - size * 0.38, w: size * 0.64, h: size * 0.78,
      radius: size * 0.28, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.12, y: y - size * 0.18, w: size * 0.18, h: size * 0.1, radius: px(3), color: 0xFFFFFF
    }))
    addEyes(widgets, x, y, size * 0.55, mood, px)
  } else if (stage === 3) {
    // Crystal Sprite
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.38, y: y - px(5), w: px(10), h: px(16), radius: px(3), color: c.crystal
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.28, y: y - px(8), w: px(8), h: px(14), radius: px(2), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.26, y: y - size * 0.28, w: size * 0.52, h: size * 0.6,
      radius: size * 0.14, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.2, y: y - size * 0.4, w: size * 0.4, h: size * 0.32,
      radius: size * 0.1, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(5), y: y - size * 0.52, w: px(10), h: px(14), radius: px(3), color: c.crystal
    }))
    addEyes(widgets, x, y - size * 0.24, size * 0.38, mood, px)
  } else if (stage === 4) {
    // Guardian - shield-like
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.42, y: y - size * 0.4, w: size * 0.84, h: size * 0.82, radius: size * 0.32, color: c.glow
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.28, y: y - size * 0.32, w: size * 0.56, h: size * 0.65, radius: size * 0.14, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.18, y: y - size * 0.45, w: size * 0.36, h: size * 0.32, radius: size * 0.12, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.38, y: y - size * 0.18, w: px(12), h: px(16), radius: px(4), color: c.crystal
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.26, y: y - size * 0.18, w: px(12), h: px(16), radius: px(4), color: c.crystal
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(5), y: y - px(4), w: px(10), h: px(10), radius: px(3), color: c.crystal
    }))
    addEyes(widgets, x, y - size * 0.32, size * 0.32, mood, px)
  } else if (stage === 5) {
    // Stone Sentinel
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.48, y: y - size * 0.48, w: size * 0.96, h: size * 0.96, radius: size * 0.38, color: c.glow
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.3, y: y - size * 0.22, w: size * 0.6, h: size * 0.55, radius: size * 0.14, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.16, y: y - size * 0.44, w: size * 0.32, h: size * 0.32, radius: size * 0.1, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.2, y: y - size * 0.54, w: size * 0.4, h: px(14), radius: px(5), color: c.ring
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(5), y: y - size * 0.65, w: px(10), h: px(16), radius: px(4), color: c.crystal
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.45, y: y - size * 0.12, w: px(16), h: px(22), radius: px(5), color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.29, y: y - size * 0.12, w: px(16), h: px(22), radius: px(5), color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.18, y: y + size * 0.24, w: px(12), h: px(16), radius: px(4), color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.06, y: y + size * 0.24, w: px(12), h: px(16), radius: px(4), color: c.primary
    }))
    addEyes(widgets, x, y - size * 0.32, size * 0.28, mood, px)
  } else {
    // Stage 6: Cosmic Titan
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.65, y: y - size * 0.6, w: size * 1.3, h: size * 1.2, radius: size * 0.52, color: c.glow
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.55, y: y - size * 0.5, w: size * 1.1, h: size, radius: size * 0.45, color: c.ring
    }))
    // Stars
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.5, y: y - size * 0.28, w: px(5), h: px(5), radius: px(2), color: 0xFFFFFF
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.45, y: y - size * 0.18, w: px(4), h: px(4), radius: px(2), color: 0xFFFFFF
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.26, y: y - size * 0.18, w: size * 0.52, h: size * 0.5, radius: size * 0.14, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.16, y: y - size * 0.44, w: size * 0.32, h: size * 0.34, radius: size * 0.12, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(5), y: y - size * 0.62, w: px(10), h: px(22), radius: px(4), color: c.crystal
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(16), y: y - size * 0.55, w: px(9), h: px(16), radius: px(3), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + px(7), y: y - size * 0.55, w: px(9), h: px(16), radius: px(3), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(7), y: y - px(2), w: px(14), h: px(14), radius: px(5), color: c.crystal
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.46, y: y - size * 0.08, w: px(20), h: px(26), radius: px(6), color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.26, y: y - size * 0.08, w: px(20), h: px(26), radius: px(6), color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.32, y: y + size * 0.24, w: size * 0.64, h: px(18), radius: px(7), color: c.ring
    }))
    addEyes(widgets, x, y - size * 0.32, size * 0.26, mood, px)
  }
  return widgets
}

/**
 * BALANCED creatures - Neutral theme
 */
function createBalancedCreatureForm(x, y, size, stage, px, mood) {
  const widgets = []
  const c = AFFINITY_COLORS.balanced

  if (stage === 1) {
    // Mystic Egg - silver/gray egg with glowing marks
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.4, y: y - size * 0.5, w: size * 0.8, h: size,
      radius: size * 0.35, color: c.glow
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.32, y: y - size * 0.42, w: size * 0.64, h: size * 0.84,
      radius: size * 0.28, color: c.primary
    }))
    // Star marks
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(3), y: y - px(8), w: px(6), h: px(10), radius: px(2), color: c.shine
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(8), y: y + px(5), w: px(5), h: px(5), radius: px(2), color: c.accent
    }))
  } else if (stage === 2) {
    // Neutral Blob - simple round blob
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.35, y: y - size * 0.35, w: size * 0.7, h: size * 0.7,
      radius: size * 0.3, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.12, y: y - size * 0.22, w: size * 0.15, h: size * 0.1,
      radius: px(3), color: 0xFFFFFF
    }))
    addEyes(widgets, x, y, size * 0.55, mood, px)
  } else if (stage === 3) {
    // Harmony Sprite - floating orb with aura
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.4, y: y - size * 0.4, w: size * 0.8, h: size * 0.8,
      radius: size * 0.35, color: c.glow
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.28, y: y - size * 0.28, w: size * 0.56, h: size * 0.56,
      radius: size * 0.24, color: c.primary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.1, y: y - size * 0.18, w: size * 0.12, h: size * 0.08,
      radius: px(2), color: 0xFFFFFF
    }))
    addEyes(widgets, x, y - px(2), size * 0.45, mood, px)
  } else if (stage === 4) {
    // Balance Guardian - symmetrical form
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.45, y: y - size * 0.35, w: size * 0.9, h: size * 0.7,
      radius: size * 0.3, color: c.glow
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.32, y: y - size * 0.28, w: size * 0.64, h: size * 0.56,
      radius: size * 0.22, color: c.primary
    }))
    // Wing-like protrusions
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.5, y: y - size * 0.08, w: px(14), h: px(10), radius: px(4), color: c.secondary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.36, y: y - size * 0.08, w: px(14), h: px(10), radius: px(4), color: c.secondary
    }))
    addEyes(widgets, x, y - size * 0.12, size * 0.4, mood, px)
  } else if (stage === 5) {
    // Equilibrium - defined form with balance motif
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.5, y: y - size * 0.45, w: size, h: size * 0.9,
      radius: size * 0.38, color: c.glow
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.35, y: y - size * 0.32, w: size * 0.7, h: size * 0.65,
      radius: size * 0.28, color: c.primary
    }))
    // Arms/wings
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.55, y: y - size * 0.12, w: px(18), h: px(14), radius: px(5), color: c.secondary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.37, y: y - size * 0.12, w: px(18), h: px(14), radius: px(5), color: c.secondary
    }))
    // Head crest
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(4), y: y - size * 0.45, w: px(8), h: px(12), radius: px(3), color: c.shine
    }))
    addEyes(widgets, x, y - size * 0.18, size * 0.35, mood, px)
  } else {
    // Stage 6: Cosmic Balance - transcendent form
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.6, y: y - size * 0.55, w: size * 1.2, h: size * 1.1,
      radius: size * 0.5, color: c.glow
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.48, y: y - size * 0.45, w: size * 0.96, h: size * 0.9,
      radius: size * 0.4, color: c.secondary
    }))
    // Stars
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.42, y: y - size * 0.32, w: px(4), h: px(4), radius: px(2), color: c.shine
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.38, y: y - size * 0.25, w: px(4), h: px(4), radius: px(2), color: c.shine
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.35, y: y - size * 0.35, w: size * 0.7, h: size * 0.7,
      radius: size * 0.3, color: c.primary
    }))
    // Cosmic wings
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - size * 0.62, y: y - size * 0.15, w: px(22), h: px(18), radius: px(6), color: c.secondary
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + size * 0.4, y: y - size * 0.15, w: px(22), h: px(18), radius: px(6), color: c.secondary
    }))
    // Crown
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(5), y: y - size * 0.52, w: px(10), h: px(14), radius: px(4), color: c.shine
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - px(12), y: y - size * 0.45, w: px(7), h: px(10), radius: px(2), color: c.accent
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + px(5), y: y - size * 0.45, w: px(7), h: px(10), radius: px(2), color: c.accent
    }))
    addEyes(widgets, x, y - size * 0.2, size * 0.3, mood, px)
  }
  return widgets
}

/**
 * Create blob body with custom color (for trait color overrides)
 */
function createBlobBodyWithColor(affinities, x, y, size, stage, px, color) {
  const widgets = []
  const type = getShapeType(affinities)
  const intensity = { 1: 0.3, 2: 0.5, 3: 0.7, 4: 0.9, 5: 1.0, 6: 1.2 }[stage] || 1.0

  switch (type) {
    case 'speed': {
      const bodyW = Math.round(size * (1 + 0.15 * intensity))
      const bodyH = Math.round(size * (1 - 0.1 * intensity))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - bodyW / 2,
        y: y - bodyH / 2,
        w: bodyW,
        h: bodyH,
        radius: bodyH / 2,
        color: color
      }))
      // Motion trails
      const trailCount = Math.min(3, Math.ceil(intensity * 3))
      const trailColor = getDarkerColor(color, 0.5)
      for (let i = 1; i <= trailCount; i++) {
        const trailSize = Math.max(px(4), Math.round(px(10) / i))
        const trailX = x - bodyW / 2 - px(10 * i)
        widgets.unshift(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: trailX - trailSize / 2,
          y: y - trailSize / 2,
          w: trailSize,
          h: trailSize,
          radius: trailSize / 2,
          color: trailColor
        }))
      }
      break
    }
    case 'power': {
      const bodySize = Math.round(size * (1 + 0.05 * intensity))
      const cornerRadius = Math.round(bodySize / (2 + intensity))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - bodySize / 2,
        y: y - bodySize / 2,
        w: bodySize,
        h: bodySize,
        radius: cornerRadius,
        color: color
      }))
      // Spikes
      const spikeCount = Math.min(4, Math.ceil(intensity * 4))
      const spikeSize = Math.round(px(8) * intensity)
      const spikeDistance = bodySize / 2 + px(2)
      const spikeColor = getDarkerColor(color, 0.7)
      const positions = [
        { dx: 0, dy: -spikeDistance },
        { dx: spikeDistance, dy: 0 },
        { dx: 0, dy: spikeDistance },
        { dx: -spikeDistance, dy: 0 }
      ]
      for (let i = 0; i < spikeCount; i++) {
        const pos = positions[i]
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: x + pos.dx - spikeSize / 2,
          y: y + pos.dy - spikeSize / 2,
          w: spikeSize,
          h: spikeSize,
          radius: px(2),
          color: spikeColor
        }))
      }
      break
    }
    case 'endurance': {
      // Ring behind
      if (intensity >= 0.5) {
        const ringSize = Math.round(size + px(16) * intensity)
        const ringColor = getDarkerColor(color, 0.3)
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: x - ringSize / 2,
          y: y - ringSize / 2,
          w: ringSize,
          h: ringSize,
          radius: ringSize / 2,
          color: ringColor
        }))
      }
      // Body
      const bodyW = Math.round(size * (1 - 0.05 * intensity))
      const bodyH = Math.round(size * (1 + 0.1 * intensity))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - bodyW / 2,
        y: y - bodyH / 2,
        w: bodyW,
        h: bodyH,
        radius: bodyW / 2,
        color: color
      }))
      // Grounding base
      if (intensity >= 0.3) {
        const baseW = Math.round(bodyW * 0.7 * intensity)
        const baseH = px(6)
        const accentColor = blendColors(color, 0xFFFFFF, 0.3)
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: x - baseW / 2,
          y: y + bodyH / 2 - baseH / 2,
          w: baseW,
          h: baseH,
          radius: baseH / 2,
          color: accentColor
        }))
      }
      break
    }
    default: {
      // Balanced - simple circle
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size / 2,
        y: y - size / 2,
        w: size,
        h: size,
        radius: size / 2,
        color: color
      }))
    }
  }

  return widgets
}

// ==================== STAGE-SPECIFIC FEATURES ====================

/**
 * Create blush marks for Stage 2 (Hatchling)
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} size - Blob size
 * @param {function} px - Pixel scaling function
 * @returns {array} Widget array
 */
export function createBlushMarks(x, y, size, px) {
  const widgets = []
  const blushSize = Math.round(size * 0.15)
  const blushY = y + Math.round(size * 0.05)
  const blushSpacing = Math.round(size * 0.35)
  const blushColor = 0xFFB6C1 // Light pink

  // Left blush
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - blushSpacing - blushSize / 2,
    y: blushY - blushSize / 2,
    w: blushSize,
    h: blushSize,
    radius: blushSize / 2,
    color: blushColor
  }))

  // Right blush
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x + blushSpacing - blushSize / 2,
    y: blushY - blushSize / 2,
    w: blushSize,
    h: blushSize,
    radius: blushSize / 2,
    color: blushColor
  }))

  return widgets
}

/**
 * Create ear nubs for Stage 3 (Juvenile)
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} size - Blob size
 * @param {number} color - Body color
 * @param {function} px - Pixel scaling function
 * @returns {array} Widget array
 */
export function createEarNubs(x, y, size, color, px) {
  const widgets = []
  const earW = Math.round(size * 0.12)
  const earH = Math.round(size * 0.18)
  const earSpacing = Math.round(size * 0.25)
  const earY = y - size / 2 - earH / 2 + px(3)
  const earColor = getDarkerColor(color, 0.85)

  // Left ear
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - earSpacing - earW / 2,
    y: earY,
    w: earW,
    h: earH,
    radius: earW / 2,
    color: earColor
  }))

  // Right ear
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x + earSpacing - earW / 2,
    y: earY,
    w: earW,
    h: earH,
    radius: earW / 2,
    color: earColor
  }))

  return widgets
}

/**
 * Create tail for Stage 4 (Mature)
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} size - Blob size
 * @param {number} color - Body color
 * @param {function} px - Pixel scaling function
 * @returns {array} Widget array
 */
export function createTail(x, y, size, color, px) {
  const widgets = []
  const tailW = Math.round(size * 0.25)
  const tailH = Math.round(size * 0.15)
  const tailX = x + size / 2 - px(5)
  const tailY = y + Math.round(size * 0.1)

  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: tailX,
    y: tailY - tailH / 2,
    w: tailW,
    h: tailH,
    radius: tailH / 2,
    color: color
  }))

  return widgets
}

/**
 * Create wings for Stage 5 (Apex)
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} size - Blob size
 * @param {number} color - Body color
 * @param {function} px - Pixel scaling function
 * @returns {array} Widget array
 */
export function createWings(x, y, size, color, px) {
  const widgets = []
  const wingW = Math.round(size * 0.3)
  const wingH = Math.round(size * 0.4)
  const wingColor = blendColors(color, 0xFFFFFF, 0.3) // Lighter shade

  // Left wing
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - size / 2 - wingW + px(8),
    y: y - wingH / 2 - px(5),
    w: wingW,
    h: wingH,
    radius: wingW / 2,
    color: wingColor
  }))

  // Right wing
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x + size / 2 - px(8),
    y: y - wingH / 2 - px(5),
    w: wingW,
    h: wingH,
    radius: wingW / 2,
    color: wingColor
  }))

  return widgets
}

/**
 * Create halo for Stage 6 (Transcendent)
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} size - Blob size
 * @param {number} frame - Animation frame for subtle pulse
 * @param {function} px - Pixel scaling function
 * @returns {array} Widget array
 */
export function createHalo(x, y, size, frame, px) {
  const widgets = []
  const haloColor = 0xFFD700 // Gold

  // Subtle pulse
  const pulsePhase = Math.sin((frame / 20) * Math.PI * 2)
  const pulseScale = 1 + pulsePhase * 0.05

  const haloW = Math.round(size * 0.6 * pulseScale)
  const haloH = Math.round(px(8) * pulseScale)
  const haloY = y - size / 2 - px(15)

  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - haloW / 2,
    y: haloY - haloH / 2,
    w: haloW,
    h: haloH,
    radius: haloH / 2,
    color: haloColor
  }))

  return widgets
}

/**
 * Create stage-specific features based on evolution stage
 * @param {number} stage - Evolution stage (1-6)
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} size - Blob size
 * @param {number} color - Body color
 * @param {number} frame - Animation frame
 * @param {function} px - Pixel scaling function
 * @returns {array} Widget array
 */
export function createStageFeatures(stage, x, y, size, color, frame, px) {
  // Stage features disabled - using new evolution forms instead
  return []
}

// ============================================================
// FANTASY CREATURE EVOLUTION SYSTEM
// ============================================================
// Each affinity has 6 distinct creature forms that evolve
// from simple egg to majestic transcendent form

/**
 * Create Speed creature based on stage - Wind/Lightning theme
 * Stage 1: Wind Egg - simple oval with wispy lines
 * Stage 2: Breeze Blob - streamlined blob
 * Stage 3: Wind Sprite - small wisp with flowing tail
 * Stage 4: Zephyr - bird-like silhouette
 * Stage 5: Storm Swift - defined avian with speed trails
 * Stage 6: Thunder Phoenix - majestic lightning bird
 */
function createSpeedCreature(x, y, size, stage, px, mood) {
  const widgets = []
  const colors = AFFINITY_COLORS.speed

  switch (stage) {
    case 1: // Wind Egg
      // Outer glow
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.45, y: y - size * 0.55,
        w: size * 0.9, h: size * 1.1,
        radius: size * 0.4, color: colors.glow
      }))
      // Main egg
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.35, y: y - size * 0.45,
        w: size * 0.7, h: size * 0.9,
        radius: size * 0.3, color: colors.primary
      }))
      // Wind swirl mark
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(8), y: y - px(5),
        w: px(16), h: px(4),
        radius: px(2), color: colors.accent
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(5), y: y + px(3),
        w: px(12), h: px(3),
        radius: px(1), color: colors.accent
      }))
      break

    case 2: // Breeze Blob
      // Body - streamlined horizontal
      const bodyW2 = size * 0.9
      const bodyH2 = size * 0.7
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - bodyW2 / 2, y: y - bodyH2 / 2,
        w: bodyW2, h: bodyH2,
        radius: bodyH2 / 2, color: colors.primary
      }))
      // Highlight
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.15, y: y - size * 0.25,
        w: size * 0.2, h: size * 0.12,
        radius: px(4), color: 0xFFFFFF
      }))
      // Eyes
      addCreatureEyes(widgets, x, y - px(2), size * 0.6, mood, px)
      // Wind trail
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - bodyW2 / 2 - px(10), y: y - px(3),
        w: px(8), h: px(6),
        radius: px(3), color: colors.trail
      }))
      break

    case 3: // Wind Sprite
      // Flowing tail
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(25), y: y + px(5),
        w: px(20), h: px(8),
        radius: px(4), color: colors.trail
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(35), y: y + px(8),
        w: px(12), h: px(5),
        radius: px(2), color: colors.glow
      }))
      // Body - teardrop shape
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.3, y: y - size * 0.35,
        w: size * 0.6, h: size * 0.7,
        radius: size * 0.25, color: colors.primary
      }))
      // Head (larger top)
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.25, y: y - size * 0.4,
        w: size * 0.5, h: size * 0.45,
        radius: size * 0.22, color: colors.primary
      }))
      // Eyes
      addCreatureEyes(widgets, x, y - size * 0.2, size * 0.5, mood, px)
      // Wind wisps
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.2, y: y - size * 0.1,
        w: px(10), h: px(4),
        radius: px(2), color: colors.accent
      }))
      break

    case 4: // Zephyr - bird-like
      // Wing shapes (behind body)
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.55, y: y - size * 0.15,
        w: size * 0.4, h: size * 0.25,
        radius: px(8), color: colors.accent
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.15, y: y - size * 0.15,
        w: size * 0.4, h: size * 0.25,
        radius: px(8), color: colors.accent
      }))
      // Body
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.25, y: y - size * 0.3,
        w: size * 0.5, h: size * 0.6,
        radius: size * 0.2, color: colors.primary
      }))
      // Head
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.2, y: y - size * 0.45,
        w: size * 0.4, h: size * 0.35,
        radius: size * 0.18, color: colors.primary
      }))
      // Beak
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(4), y: y - size * 0.2,
        w: px(8), h: px(6),
        radius: px(2), color: colors.accent
      }))
      // Eyes
      addCreatureEyes(widgets, x, y - size * 0.32, size * 0.35, mood, px)
      // Tail feathers
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(6), y: y + size * 0.25,
        w: px(12), h: px(15),
        radius: px(4), color: colors.trail
      }))
      break

    case 5: // Storm Swift - defined avian
      // Speed trails
      for (let i = 1; i <= 3; i++) {
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: x - size * 0.5 - px(12 * i), y: y - px(2 * i),
          w: px(10), h: px(4),
          radius: px(2), color: colors.trail
        }))
      }
      // Large wings
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.7, y: y - size * 0.2,
        w: size * 0.5, h: size * 0.35,
        radius: px(10), color: colors.accent
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.2, y: y - size * 0.2,
        w: size * 0.5, h: size * 0.35,
        radius: px(10), color: colors.accent
      }))
      // Body
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.22, y: y - size * 0.3,
        w: size * 0.44, h: size * 0.6,
        radius: size * 0.18, color: colors.primary
      }))
      // Head with crest
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.18, y: y - size * 0.5,
        w: size * 0.36, h: size * 0.35,
        radius: size * 0.16, color: colors.primary
      }))
      // Crest
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(3), y: y - size * 0.6,
        w: px(6), h: px(12),
        radius: px(2), color: colors.electric
      }))
      // Eyes
      addCreatureEyes(widgets, x, y - size * 0.38, size * 0.32, mood, px)
      // Tail
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(8), y: y + size * 0.25,
        w: px(16), h: px(20),
        radius: px(5), color: colors.primary
      }))
      break

    case 6: // Thunder Phoenix
      // Electric aura
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.6, y: y - size * 0.6,
        w: size * 1.2, h: size * 1.2,
        radius: size * 0.5, color: colors.glow
      }))
      // Lightning bolts effect
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.5, y: y - size * 0.1,
        w: px(4), h: px(20),
        radius: px(2), color: colors.electric
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.45, y: y,
        w: px(4), h: px(18),
        radius: px(2), color: colors.electric
      }))
      // Majestic wings
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.8, y: y - size * 0.25,
        w: size * 0.6, h: size * 0.45,
        radius: px(12), color: colors.accent
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.2, y: y - size * 0.25,
        w: size * 0.6, h: size * 0.45,
        radius: px(12), color: colors.accent
      }))
      // Body
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.2, y: y - size * 0.25,
        w: size * 0.4, h: size * 0.55,
        radius: size * 0.15, color: colors.primary
      }))
      // Head
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.16, y: y - size * 0.5,
        w: size * 0.32, h: size * 0.35,
        radius: size * 0.14, color: colors.primary
      }))
      // Crown/crest
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(8), y: y - size * 0.65,
        w: px(16), h: px(18),
        radius: px(4), color: colors.electric
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(15), y: y - size * 0.58,
        w: px(8), h: px(12),
        radius: px(3), color: colors.accent
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + px(7), y: y - size * 0.58,
        w: px(8), h: px(12),
        radius: px(3), color: colors.accent
      }))
      // Eyes
      addCreatureEyes(widgets, x, y - size * 0.38, size * 0.28, mood, px)
      // Flowing tail
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(10), y: y + size * 0.25,
        w: px(20), h: px(25),
        radius: px(6), color: colors.primary
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(6), y: y + size * 0.4,
        w: px(12), h: px(15),
        radius: px(4), color: colors.accent
      }))
      break
  }

  return widgets
}

/**
 * Create Power creature based on stage - Fire/Flame theme
 * Stage 1: Ember Egg
 * Stage 2: Spark Blob
 * Stage 3: Flame Sprite
 * Stage 4: Blaze
 * Stage 5: Inferno Lion
 * Stage 6: Solar Dragon
 */
function createPowerCreature(x, y, size, stage, px, mood) {
  const widgets = []
  const colors = AFFINITY_COLORS.power

  switch (stage) {
    case 1: // Ember Egg
      // Flame glow
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.45, y: y - size * 0.55,
        w: size * 0.9, h: size * 1.1,
        radius: size * 0.4, color: colors.glow
      }))
      // Main egg
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.35, y: y - size * 0.45,
        w: size * 0.7, h: size * 0.9,
        radius: size * 0.3, color: colors.primary
      }))
      // Flame marks
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(4), y: y - px(12),
        w: px(8), h: px(14),
        radius: px(3), color: colors.flame
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(10), y: y - px(5),
        w: px(6), h: px(10),
        radius: px(2), color: colors.accent
      }))
      break

    case 2: // Spark Blob - chunky, angular
      // Body - more squared
      const bodySize2 = size * 0.75
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - bodySize2 / 2, y: y - bodySize2 / 2,
        w: bodySize2, h: bodySize2,
        radius: size * 0.2, color: colors.primary
      }))
      // Small flame on top
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(5), y: y - bodySize2 / 2 - px(8),
        w: px(10), h: px(12),
        radius: px(4), color: colors.flame
      }))
      // Highlight
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.12, y: y - size * 0.22,
        w: size * 0.18, h: size * 0.1,
        radius: px(3), color: 0xFFFFFF
      }))
      // Eyes
      addCreatureEyes(widgets, x, y - px(2), size * 0.55, mood, px)
      break

    case 3: // Flame Sprite
      // Ember particles
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(20), y: y - px(15),
        w: px(6), h: px(6),
        radius: px(3), color: colors.accent
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + px(18), y: y - px(10),
        w: px(5), h: px(5),
        radius: px(2), color: colors.flame
      }))
      // Body - flame-like shape
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.28, y: y - size * 0.2,
        w: size * 0.56, h: size * 0.55,
        radius: size * 0.2, color: colors.primary
      }))
      // Head
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.22, y: y - size * 0.4,
        w: size * 0.44, h: size * 0.4,
        radius: size * 0.18, color: colors.primary
      }))
      // Flame crown
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(8), y: y - size * 0.55,
        w: px(16), h: px(18),
        radius: px(5), color: colors.flame
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(12), y: y - size * 0.48,
        w: px(8), h: px(12),
        radius: px(3), color: colors.accent
      }))
      // Eyes
      addCreatureEyes(widgets, x, y - size * 0.22, size * 0.4, mood, px)
      break

    case 4: // Blaze - beast-like
      // Body glow
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.4, y: y - size * 0.35,
        w: size * 0.8, h: size * 0.75,
        radius: size * 0.25, color: colors.glow
      }))
      // Body - strong stance
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.3, y: y - size * 0.2,
        w: size * 0.6, h: size * 0.5,
        radius: size * 0.15, color: colors.primary
      }))
      // Head
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.2, y: y - size * 0.45,
        w: size * 0.4, h: size * 0.38,
        radius: size * 0.15, color: colors.primary
      }))
      // Ears/horns
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.22, y: y - size * 0.58,
        w: px(10), h: px(15),
        radius: px(3), color: colors.spike
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.12, y: y - size * 0.58,
        w: px(10), h: px(15),
        radius: px(3), color: colors.spike
      }))
      // Eyes
      addCreatureEyes(widgets, x, y - size * 0.32, size * 0.35, mood, px)
      // Flame mane
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(15), y: y - size * 0.35,
        w: px(30), h: px(15),
        radius: px(5), color: colors.flame
      }))
      // Legs
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.22, y: y + size * 0.2,
        w: px(10), h: px(15),
        radius: px(3), color: colors.primary
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.12, y: y + size * 0.2,
        w: px(10), h: px(15),
        radius: px(3), color: colors.primary
      }))
      break

    case 5: // Inferno Lion
      // Flame aura
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.55, y: y - size * 0.5,
        w: size * 1.1, h: size * 1.0,
        radius: size * 0.4, color: colors.glow
      }))
      // Mane flames
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.4, y: y - size * 0.55,
        w: size * 0.8, h: size * 0.5,
        radius: size * 0.2, color: colors.flame
      }))
      // Body
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.28, y: y - size * 0.15,
        w: size * 0.56, h: size * 0.45,
        radius: size * 0.15, color: colors.primary
      }))
      // Head
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.18, y: y - size * 0.4,
        w: size * 0.36, h: size * 0.35,
        radius: size * 0.14, color: colors.primary
      }))
      // Eyes
      addCreatureEyes(widgets, x, y - size * 0.3, size * 0.3, mood, px)
      // Snout
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(6), y: y - size * 0.15,
        w: px(12), h: px(8),
        radius: px(3), color: colors.accent
      }))
      // Front legs
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.22, y: y + size * 0.2,
        w: px(12), h: px(20),
        radius: px(4), color: colors.primary
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.1, y: y + size * 0.2,
        w: px(12), h: px(20),
        radius: px(4), color: colors.primary
      }))
      // Tail flame
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.25, y: y + size * 0.1,
        w: px(18), h: px(12),
        radius: px(4), color: colors.flame
      }))
      break

    case 6: // Solar Dragon
      // Solar aura
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.65, y: y - size * 0.6,
        w: size * 1.3, h: size * 1.2,
        radius: size * 0.5, color: colors.glow
      }))
      // Flame ring
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.55, y: y - size * 0.5,
        w: size * 1.1, h: size * 1.0,
        radius: size * 0.45, color: colors.spike
      }))
      // Wings
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.75, y: y - size * 0.3,
        w: size * 0.5, h: size * 0.45,
        radius: px(10), color: colors.flame
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.25, y: y - size * 0.3,
        w: size * 0.5, h: size * 0.45,
        radius: px(10), color: colors.flame
      }))
      // Body
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.22, y: y - size * 0.2,
        w: size * 0.44, h: size * 0.5,
        radius: size * 0.15, color: colors.primary
      }))
      // Neck
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(8), y: y - size * 0.4,
        w: px(16), h: px(20),
        radius: px(5), color: colors.primary
      }))
      // Head
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.15, y: y - size * 0.55,
        w: size * 0.3, h: size * 0.25,
        radius: size * 0.1, color: colors.primary
      }))
      // Horns
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.18, y: y - size * 0.7,
        w: px(8), h: px(18),
        radius: px(3), color: colors.accent
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.1, y: y - size * 0.7,
        w: px(8), h: px(18),
        radius: px(3), color: colors.accent
      }))
      // Eyes
      addCreatureEyes(widgets, x, y - size * 0.48, size * 0.25, mood, px)
      // Tail
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(8), y: y + size * 0.25,
        w: px(16), h: px(22),
        radius: px(5), color: colors.primary
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(10), y: y + size * 0.4,
        w: px(20), h: px(15),
        radius: px(6), color: colors.flame
      }))
      break
  }

  return widgets
}

/**
 * Create Endurance creature based on stage - Crystal/Cosmic theme
 * Stage 1: Mystic Egg
 * Stage 2: Calm Blob
 * Stage 3: Crystal Sprite
 * Stage 4: Guardian
 * Stage 5: Stone Sentinel
 * Stage 6: Cosmic Titan
 */
function createEnduranceCreature(x, y, size, stage, px, mood) {
  const widgets = []
  const colors = AFFINITY_COLORS.endurance

  switch (stage) {
    case 1: // Mystic Egg
      // Mystic glow
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.45, y: y - size * 0.55,
        w: size * 0.9, h: size * 1.1,
        radius: size * 0.4, color: colors.glow
      }))
      // Main egg
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.35, y: y - size * 0.45,
        w: size * 0.7, h: size * 0.9,
        radius: size * 0.3, color: colors.primary
      }))
      // Crystal marks
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(3), y: y - px(10),
        w: px(6), h: px(12),
        radius: px(2), color: colors.crystal
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(10), y: y,
        w: px(8), h: px(6),
        radius: px(2), color: colors.accent
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + px(5), y: y + px(5),
        w: px(5), h: px(8),
        radius: px(2), color: colors.crystal
      }))
      break

    case 2: // Calm Blob - stable, grounded
      // Grounding shadow
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.35, y: y + size * 0.25,
        w: size * 0.7, h: px(8),
        radius: px(4), color: colors.ring
      }))
      // Body - vertical oval
      const bodyH2 = size * 0.85
      const bodyW2 = size * 0.7
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - bodyW2 / 2, y: y - bodyH2 / 2 + px(5),
        w: bodyW2, h: bodyH2,
        radius: bodyW2 / 2, color: colors.primary
      }))
      // Highlight
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.12, y: y - size * 0.2,
        w: size * 0.18, h: size * 0.1,
        radius: px(3), color: 0xFFFFFF
      }))
      // Eyes
      addCreatureEyes(widgets, x, y, size * 0.55, mood, px)
      break

    case 3: // Crystal Sprite
      // Crystal facets around
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.4, y: y - px(5),
        w: px(10), h: px(16),
        radius: px(3), color: colors.crystal
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.3, y: y - px(8),
        w: px(8), h: px(14),
        radius: px(2), color: colors.accent
      }))
      // Body - geometric
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.28, y: y - size * 0.3,
        w: size * 0.56, h: size * 0.65,
        radius: size * 0.15, color: colors.primary
      }))
      // Head
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.22, y: y - size * 0.45,
        w: size * 0.44, h: size * 0.35,
        radius: size * 0.12, color: colors.primary
      }))
      // Crystal crown
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(5), y: y - size * 0.6,
        w: px(10), h: px(16),
        radius: px(3), color: colors.crystal
      }))
      // Eyes
      addCreatureEyes(widgets, x, y - size * 0.28, size * 0.4, mood, px)
      break

    case 4: // Guardian - shield-like
      // Protective aura
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.45, y: y - size * 0.45,
        w: size * 0.9, h: size * 0.9,
        radius: size * 0.35, color: colors.glow
      }))
      // Body - shield shape
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.3, y: y - size * 0.35,
        w: size * 0.6, h: size * 0.7,
        radius: size * 0.15, color: colors.primary
      }))
      // Head
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.2, y: y - size * 0.5,
        w: size * 0.4, h: size * 0.35,
        radius: size * 0.15, color: colors.primary
      }))
      // Crystal shoulder pads
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.4, y: y - size * 0.2,
        w: px(14), h: px(18),
        radius: px(4), color: colors.crystal
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.26, y: y - size * 0.2,
        w: px(14), h: px(18),
        radius: px(4), color: colors.crystal
      }))
      // Eyes
      addCreatureEyes(widgets, x, y - size * 0.35, size * 0.35, mood, px)
      // Gem on chest
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(6), y: y - px(5),
        w: px(12), h: px(12),
        radius: px(4), color: colors.crystal
      }))
      break

    case 5: // Stone Sentinel
      // Stone aura
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.5, y: y - size * 0.5,
        w: size * 1.0, h: size * 1.0,
        radius: size * 0.4, color: colors.glow
      }))
      // Large body
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.32, y: y - size * 0.25,
        w: size * 0.64, h: size * 0.6,
        radius: size * 0.15, color: colors.primary
      }))
      // Head
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.18, y: y - size * 0.48,
        w: size * 0.36, h: size * 0.35,
        radius: size * 0.12, color: colors.primary
      }))
      // Crystal helm
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.22, y: y - size * 0.6,
        w: size * 0.44, h: px(15),
        radius: px(5), color: colors.ring
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(6), y: y - size * 0.72,
        w: px(12), h: px(18),
        radius: px(4), color: colors.crystal
      }))
      // Eyes
      addCreatureEyes(widgets, x, y - size * 0.35, size * 0.32, mood, px)
      // Arms
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.48, y: y - size * 0.15,
        w: px(18), h: px(25),
        radius: px(5), color: colors.primary
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.3, y: y - size * 0.15,
        w: px(18), h: px(25),
        radius: px(5), color: colors.primary
      }))
      // Legs
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.2, y: y + size * 0.25,
        w: px(14), h: px(18),
        radius: px(4), color: colors.primary
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.06, y: y + size * 0.25,
        w: px(14), h: px(18),
        radius: px(4), color: colors.primary
      }))
      break

    case 6: // Cosmic Titan
      // Cosmic aura (multiple layers)
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.7, y: y - size * 0.65,
        w: size * 1.4, h: size * 1.3,
        radius: size * 0.55, color: colors.glow
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.6, y: y - size * 0.55,
        w: size * 1.2, h: size * 1.1,
        radius: size * 0.5, color: colors.ring
      }))
      // Star particles
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.55, y: y - size * 0.3,
        w: px(6), h: px(6),
        radius: px(3), color: 0xFFFFFF
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.5, y: y - size * 0.2,
        w: px(5), h: px(5),
        radius: px(2), color: 0xFFFFFF
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.4, y: y + size * 0.3,
        w: px(4), h: px(4),
        radius: px(2), color: colors.crystal
      }))
      // Body
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.28, y: y - size * 0.2,
        w: size * 0.56, h: size * 0.55,
        radius: size * 0.15, color: colors.primary
      }))
      // Head
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.18, y: y - size * 0.48,
        w: size * 0.36, h: size * 0.38,
        radius: size * 0.14, color: colors.primary
      }))
      // Crown of crystals
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(6), y: y - size * 0.7,
        w: px(12), h: px(25),
        radius: px(4), color: colors.crystal
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(18), y: y - size * 0.62,
        w: px(10), h: px(18),
        radius: px(3), color: colors.accent
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + px(8), y: y - size * 0.62,
        w: px(10), h: px(18),
        radius: px(3), color: colors.accent
      }))
      // Eyes
      addCreatureEyes(widgets, x, y - size * 0.35, size * 0.3, mood, px)
      // Cosmic gem
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(8), y: y - px(3),
        w: px(16), h: px(16),
        radius: px(6), color: colors.crystal
      }))
      // Arms
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.5, y: y - size * 0.1,
        w: px(22), h: px(30),
        radius: px(6), color: colors.primary
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + size * 0.28, y: y - size * 0.1,
        w: px(22), h: px(30),
        radius: px(6), color: colors.primary
      }))
      // Floating cape/aura bottom
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size * 0.35, y: y + size * 0.25,
        w: size * 0.7, h: px(20),
        radius: px(8), color: colors.ring
      }))
      break
  }

  return widgets
}

/**
 * Create Balanced creature (when no dominant affinity)
 */
function createBalancedCreature(x, y, size, stage, px, mood) {
  const widgets = []
  const colors = AFFINITY_COLORS.balanced

  // Simple blob that grows slightly more defined with stage
  const bodySize = size * (0.6 + stage * 0.05)

  // Glow for higher stages
  if (stage >= 3) {
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - bodySize * 0.6, y: y - bodySize * 0.6,
      w: bodySize * 1.2, h: bodySize * 1.2,
      radius: bodySize * 0.5, color: colors.glow
    }))
  }

  // Main body
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - bodySize / 2, y: y - bodySize / 2,
    w: bodySize, h: bodySize,
    radius: bodySize / 2, color: colors.primary
  }))

  // Highlight
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - bodySize * 0.2, y: y - bodySize * 0.3,
    w: bodySize * 0.25, h: bodySize * 0.15,
    radius: px(4), color: 0xFFFFFF
  }))

  // Eyes
  addCreatureEyes(widgets, x, y - px(2), bodySize * 0.7, mood, px)

  return widgets
}

/**
 * Helper to add creature eyes
 */
function addCreatureEyes(widgets, x, y, size, mood, px) {
  const eyeSize = Math.max(px(6), Math.round(size * 0.15))
  const eyeSpacing = Math.round(size * 0.3)
  const eyeH = mood === 'sad' ? Math.round(eyeSize * 0.5) : eyeSize

  // Left eye
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - eyeSpacing / 2 - eyeSize / 2,
    y: y - eyeH / 2,
    w: eyeSize, h: eyeH,
    radius: eyeSize / 2, color: 0x000000
  }))

  // Right eye
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x + eyeSpacing / 2 - eyeSize / 2,
    y: y - eyeH / 2,
    w: eyeSize, h: eyeH,
    radius: eyeSize / 2, color: 0x000000
  }))

  // Eye highlights
  const hlSize = Math.max(px(2), Math.round(eyeSize * 0.35))
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - eyeSpacing / 2 - eyeSize / 4,
    y: y - eyeH / 3,
    w: hlSize, h: hlSize,
    radius: hlSize / 2, color: 0xFFFFFF
  }))
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x + eyeSpacing / 2 - eyeSize / 4,
    y: y - eyeH / 3,
    w: hlSize, h: hlSize,
    radius: hlSize / 2, color: 0xFFFFFF
  }))
}

/**
 * Main function to create evolved creature based on affinity and stage
 */
export function createEvolvedCreature(creature, x, y, baseSize, px, frame = 0) {
  const type = getShapeType(creature.affinities)
  const mood = creature.mood >= 70 ? 'happy' : creature.mood >= 40 ? 'neutral' : 'sad'
  const stage = creature.stage || 1

  // Size scales with stage
  const sizeMultiplier = 0.8 + (stage * 0.05) // 0.85 to 1.1
  const size = Math.round(baseSize * sizeMultiplier)

  switch (type) {
    case 'speed':
      return createSpeedCreature(x, y, size, stage, px, mood)
    case 'power':
      return createPowerCreature(x, y, size, stage, px, mood)
    case 'endurance':
      return createEnduranceCreature(x, y, size, stage, px, mood)
    default:
      return createBalancedCreature(x, y, size, stage, px, mood)
  }
}
