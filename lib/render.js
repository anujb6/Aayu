import * as hmUI from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { STAGE_NAMES, EVOLUTION_THRESHOLDS, STAGE_SIZES } from './evolution'

// Re-export from evolution.js to maintain backwards compatibility
export { STAGE_NAMES, EVOLUTION_THRESHOLDS, STAGE_SIZES }

// Safe device info getter with fallback (lazy loaded to prevent crash)
let _deviceInfo = null
function getDevice() {
  if (!_deviceInfo) {
    try {
      _deviceInfo = getDeviceInfo()
    } catch (e) {
      _deviceInfo = { width: 480, height: 480 }
    }
  }
  return _deviceInfo
}

// Responsive px function
export function px(val) {
  const { width } = getDevice()
  return Math.round(val * width / 480)
}

// Screen dimensions (lazy loaded via functions)
export function getScreenWidth() {
  return getDevice().width
}

export function getScreenHeight() {
  return getDevice().height
}

export function getCenterX() {
  return Math.round(getDevice().width / 2)
}

export function getCenterY() {
  return Math.round(getDevice().height / 2)
}

// Color palette - flat colors, no alpha (alpha not supported on FILL_RECT)
export const COLORS = {
  // Backgrounds
  bgDark: 0x0d0d1a,
  bgMedium: 0x1a1a2e,
  bgLight: 0x2a2a3e,

  // Text
  textPrimary: 0xFFFFFF,
  textSecondary: 0xBBBBBB,
  textMuted: 0x888888,
  textDark: 0x555555,

  // Affinity colors (single values, no glow)
  speed: 0x00BFFF,
  power: 0xFF6B35,
  endurance: 0x9B59B6,

  // UI States
  success: 0x4CAF50,
  successDark: 0x2E7D32,
  warning: 0xFF9800,
  error: 0xF44336,

  // Accent
  streak: 0xFF6B35,
  gold: 0xFFD700,

  // Progress bar
  barBg: 0x2a2a3e
}

// Stage definitions imported from evolution.js (see imports above)

// Helper functions
export function getDominantAffinity(affinities) {
  const { speed, power, endurance } = affinities
  if (speed >= power && speed >= endurance) return 'speed'
  if (power >= speed && power >= endurance) return 'power'
  return 'endurance'
}

export function getMoodState(moodValue) {
  if (moodValue >= 70) return 'happy'
  if (moodValue >= 40) return 'neutral'
  return 'sad'
}

export function getMoodText(mood) {
  if (mood === 'happy') return 'Happy!'
  if (mood === 'sad') return 'Needs love'
  return 'Content'
}

export function getMoodColor(mood) {
  if (mood === 'happy') return COLORS.success
  if (mood === 'sad') return COLORS.warning
  return COLORS.textSecondary
}

export function getCreatureColor(creature) {
  const dominant = getDominantAffinity(creature.affinities)
  return COLORS[dominant]
}

export function getCreatureSize(creature, baseSize = 100) {
  const multiplier = STAGE_SIZES[creature.stage] || 1.0
  return Math.round(baseSize * multiplier)
}

// Create blob - NO alpha properties (not supported!)
export function createBlob(creature, x, y, size = 100) {
  const widgets = []
  const color = getCreatureColor(creature)
  const actualSize = getCreatureSize(creature, size)
  const mood = getMoodState(creature.mood)

  // Main body circle
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - actualSize / 2,
    y: y - actualSize / 2,
    w: actualSize,
    h: actualSize,
    radius: actualSize / 2,
    color: color
  }))

  // Body highlight (lighter spot)
  const highlightSize = Math.round(actualSize * 0.25)
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x - actualSize / 4,
    y: y - actualSize / 3,
    w: highlightSize,
    h: Math.round(highlightSize * 0.6),
    radius: Math.round(highlightSize * 0.3),
    color: 0xFFFFFF
  }))

  // Eyes
  const eyeSize = Math.round(actualSize * 0.12)
  const eyeSpacing = Math.round(actualSize * 0.3)
  const eyeY = y - Math.round(actualSize * 0.05)
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

  // Mouth
  const mouthY = y + Math.round(actualSize * 0.15)
  const mouthW = Math.round(actualSize * 0.2)

  if (mood === 'happy') {
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - mouthW / 2,
      y: mouthY,
      w: mouthW,
      h: px(4),
      radius: px(2),
      color: 0x000000
    }))
  } else if (mood === 'sad') {
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x - mouthW / 2,
      y: mouthY + px(4),
      w: mouthW,
      h: px(3),
      radius: px(1),
      color: 0x000000
    }))
  }

  return widgets
}

// Delete widgets
export function deleteWidgets(widgets) {
  if (!widgets) return
  widgets.forEach(w => {
    try {
      hmUI.deleteWidget(w)
    } catch (e) {}
  })
}

// Create progress bar - NO alpha
export function createProgressBar(x, y, width, height, progress, color) {
  const widgets = []
  const radius = height / 2

  // Background
  widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: x,
    y: y,
    w: width,
    h: height,
    radius: radius,
    color: COLORS.barBg
  }))

  // Fill
  const fillWidth = Math.max(0, Math.round((width - px(4)) * Math.min(100, progress) / 100))
  if (fillWidth > 0) {
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + px(2),
      y: y + px(2),
      w: fillWidth,
      h: height - px(4),
      radius: (height - px(4)) / 2,
      color: color
    }))
  }

  return widgets
}
