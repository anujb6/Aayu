// Affinity-Based Blob Shape Definitions for FitBlob
// Zepp OS Widget-based shape rendering

import * as hmUI from '@zos/ui'

// Colors for each affinity
export const AFFINITY_COLORS = {
  speed: {
    primary: 0x00BFFF,    // Cyan
    accent: 0x87CEEB,     // Light blue
    trail: 0x006080       // Dark cyan
  },
  power: {
    primary: 0xFF6B35,    // Orange
    accent: 0xFFAA00,     // Gold orange
    spike: 0xCC4400       // Dark orange
  },
  endurance: {
    primary: 0x9B59B6,    // Purple
    accent: 0xBB8FCE,     // Light purple
    ring: 0x4A235A        // Dark purple
  },
  balanced: {
    primary: 0xCCCCCC,    // Gray
    accent: 0xFFFFFF,     // White
    secondary: 0x888888   // Medium gray
  }
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
 * @param {object} creature - Creature data
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {number} baseSize - Base size before stage scaling
 * @param {function} px - Pixel scaling function
 * @param {number} frame - Animation frame (for trait effects)
 * @returns {array} Array of all blob widgets
 */
export function createCompleteBlob(creature, x, y, baseSize, px, frame = 0) {
  const STAGE_SIZES = { 1: 0.5, 2: 0.65, 3: 0.8, 4: 1.0, 5: 1.15, 6: 1.3 }
  const sizeMultiplier = STAGE_SIZES[creature.stage] || 1.0
  const size = Math.round(baseSize * sizeMultiplier)

  const mood = creature.mood >= 70 ? 'happy' : creature.mood >= 40 ? 'neutral' : 'sad'
  const activeTraits = creature.activeTraits || []

  // Get base color and apply color traits
  const palette = getColorPalette(creature.affinities)
  const bodyColor = applyColorTraits(palette.primary, activeTraits)

  const widgets = []

  // 1. Aura effects (behind everything)
  if (activeTraits.includes('rainbow_aura')) {
    widgets.push(...createRainbowAura(x, y, size, frame, px))
  } else if (activeTraits.includes('glow_aura')) {
    widgets.push(...createGlowAura(x, y, size, bodyColor, frame, px))
  }

  // 2. Body (with shape based on affinity, using modified color)
  // Create custom body with trait-modified color
  const bodyWidgets = createBlobBodyWithColor(creature.affinities, x, y, size, creature.stage, px, bodyColor)
  widgets.push(...bodyWidgets)

  // 3. Glowing core (inside body)
  if (activeTraits.includes('glowing_core')) {
    widgets.push(...createGlowingCore(x, y, size, frame, px))
  }

  // 4. Highlight
  widgets.push(...createBlobHighlight(x, y, size, px))

  // 5. Horns (on top of body) - from traits
  if (activeTraits.includes('small_horns')) {
    widgets.push(...createHorns(x, y, size, bodyColor, px))
  }

  // 6. Stage-specific features (blush, ears, tail, wings, halo)
  widgets.push(...createStageFeatures(creature.stage, x, y, size, bodyColor, frame, px))

  // 7. Eyes (with size modifier)
  const eyeSizeMultiplier = getEyeSizeMultiplier(activeTraits)
  widgets.push(...createBlobEyesWithTraits(x, y, size, mood, px, eyeSizeMultiplier))

  // 8. Mouth
  widgets.push(...createBlobMouth(x, y, size, mood, px))

  // 9. Particles (in front of everything)
  if (activeTraits.includes('particles')) {
    widgets.push(...createParticles(x, y, size, bodyColor, frame, px))
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
  const widgets = []

  switch (stage) {
    case 2:
      widgets.push(...createBlushMarks(x, y, size, px))
      break
    case 3:
      widgets.push(...createEarNubs(x, y, size, color, px))
      break
    case 4:
      widgets.push(...createTail(x, y, size, color, px))
      break
    case 5:
      widgets.push(...createWings(x, y, size, color, px))
      break
    case 6:
      widgets.push(...createHalo(x, y, size, frame, px))
      break
  }

  return widgets
}
