import * as hmUI from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { push, back } from '@zos/router'
import { onGesture, offGesture, GESTURE_LEFT, GESTURE_RIGHT } from '@zos/interaction'
import { Step, Distance, HeartRate, Calorie } from '@zos/sensor'

// ============================================
// RESPONSIVE SETUP - Get device dimensions
// ============================================
let W = 480
let H = 480
try {
  const info = getDeviceInfo()
  W = info.width || 480
  H = info.height || 480
} catch (e) {}

const CX = Math.round(W / 2)
const CY = Math.round(H / 2)

// Responsive pixel function - scales from 480px baseline
function px(val) {
  return Math.round(val * W / 480)
}

// ============================================
// RPG COLOR PALETTE - Modern Mobile RPG Style
// ============================================
const COLORS = {
  // Backgrounds
  bgDark: 0x08080c,
  bgCard: 0x12121a,
  bgCardLight: 0x1a1a24,
  bgBar: 0x252530,

  // Text
  textPrimary: 0xFFFFFF,
  textSecondary: 0xB0B0C0,
  textMuted: 0x606070,

  // Affinity Colors (matching Evolution page)
  speed: 0x00BFFF,
  speedDark: 0x005580,
  speedGlow: 0x002840,

  power: 0xFF6B35,
  powerDark: 0x993F1F,
  powerGlow: 0x4d1f0f,

  endurance: 0x9B59B6,
  enduranceDark: 0x5D356D,
  enduranceGlow: 0x2e1a36,

  // Accent
  gold: 0xFFD700,
  goldDark: 0x806B00,
}

// Affinity icons
const AFFINITY_ICONS = {
  speed: '⚡',
  power: '💪',
  endurance: '🛡'
}

// Affinity display names
const AFFINITY_NAMES = {
  speed: 'SPD',
  power: 'PWR',
  endurance: 'END'
}

let widgets = []
let creature = null
let sensorData = { steps: 0, distance: 0, heartRate: 0, calories: 0 }

Page({
  onInit() {
    try {
      const app = getApp()
      creature = app?.globalData?.creature || null
    } catch (e) {
      creature = null
    }
  },

  build() {
    this.setupGestures()
    this.loadSensorData()
    this.buildUI()
  },

  onDestroy() {
    offGesture()
    this.cleanup()
  },

  setupGestures() {
    onGesture({
      callback: (event) => {
        if (event === GESTURE_LEFT) {
          push({ url: 'page/evolution/index' })
          return true
        }
        if (event === GESTURE_RIGHT) {
          back()
          return true
        }
        return false
      }
    })
  },

  loadSensorData() {
    try {
      const stepSensor = new Step()
      sensorData.steps = stepSensor.getCurrent() || 0
    } catch (e) {}

    try {
      const distSensor = new Distance()
      sensorData.distance = distSensor.getCurrent() || 0
    } catch (e) {}

    try {
      const hrSensor = new HeartRate()
      // Use getLast() for most recent background measurement
      // getCurrent() only works during active real-time monitoring
      sensorData.heartRate = hrSensor.getLast() || 0
    } catch (e) {}

    try {
      const calSensor = new Calorie()
      sensorData.calories = calSensor.getCurrent() || 0
    } catch (e) {}
  },

  buildUI() {
    // Full screen background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: H,
      color: COLORS.bgDark
    }))

    if (!creature) {
      this.drawNoData()
      return
    }

    // Get affinities
    const affinities = creature.affinities || { speed: 0, power: 0, endurance: 0 }
    const dominant = this.getDominantAffinity(affinities)

    // ===== DRAW RPG UI =====

    // 1. Title
    this.drawTitle()

    // 2. Dominant Type Badge (top center)
    this.drawTypeBadge(dominant)

    // 3. Stat Cards (3 horizontal cards)
    this.drawStatCards(affinities, dominant)

    // 4. Daily Activity Section
    this.drawActivitySection()

    // 5. Page indicator dots
    this.drawPageDots()
  },

  drawNoData() {
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: CY - px(20), w: W - px(80), h: px(40),
      text: 'No creature data',
      text_size: px(18),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawTitle() {
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: px(40), w: W, h: px(24),
      text: 'ATTRIBUTES',
      text_size: px(16),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawTypeBadge(dominant) {
    const badgeY = px(68)
    const badgeW = px(130)
    const badgeH = px(36)
    const color = COLORS[dominant]
    const darkColor = COLORS[`${dominant}Dark`]
    const glowColor = COLORS[`${dominant}Glow`]
    const icon = AFFINITY_ICONS[dominant]

    // Outer glow
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - badgeW / 2 - px(4),
      y: badgeY - px(4),
      w: badgeW + px(8),
      h: badgeH + px(8),
      radius: (badgeH + px(8)) / 2,
      color: glowColor
    }))

    // Badge border
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - badgeW / 2 - px(2),
      y: badgeY - px(2),
      w: badgeW + px(4),
      h: badgeH + px(4),
      radius: (badgeH + px(4)) / 2,
      color: darkColor
    }))

    // Badge background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - badgeW / 2,
      y: badgeY,
      w: badgeW,
      h: badgeH,
      radius: badgeH / 2,
      color: COLORS.bgCard
    }))

    // Badge text with icon
    const typeName = dominant.charAt(0).toUpperCase() + dominant.slice(1)
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - badgeW / 2,
      y: badgeY + px(7),
      w: badgeW,
      h: px(24),
      text: `${icon} ${typeName}`,
      text_size: px(15),
      color: color,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawStatCards(affinities, dominant) {
    const cardY = px(125)
    const cardH = px(80)
    const cardGap = px(6)
    const totalWidth = W - px(80)  // More margin for round screen edges
    const cardW = Math.floor((totalWidth - cardGap * 2) / 3)
    const startX = px(40)  // Pushed in from edges

    const stats = [
      { key: 'speed', value: affinities.speed },
      { key: 'power', value: affinities.power },
      { key: 'endurance', value: affinities.endurance }
    ]

    stats.forEach((stat, index) => {
      const cardX = startX + index * (cardW + cardGap)
      const isDominant = stat.key === dominant
      this.drawStatCard(cardX, cardY, cardW, cardH, stat.key, stat.value, isDominant)
    })
  },

  drawStatCard(x, y, w, h, statKey, value, isDominant) {
    const color = COLORS[statKey]
    const darkColor = COLORS[`${statKey}Dark`]
    const glowColor = COLORS[`${statKey}Glow`]
    const icon = AFFINITY_ICONS[statKey]
    const name = AFFINITY_NAMES[statKey]

    // Card glow (only for dominant)
    if (isDominant) {
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(3),
        y: y - px(3),
        w: w + px(6),
        h: h + px(6),
        radius: px(14),
        color: glowColor
      }))

      // Bright border for dominant
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - px(1),
        y: y - px(1),
        w: w + px(2),
        h: h + px(2),
        radius: px(12),
        color: darkColor
      }))
    }

    // Card background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x, y: y, w: w, h: h,
      radius: px(10),
      color: COLORS.bgCard
    }))

    // Top accent line
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + px(8),
      y: y + px(5),
      w: w - px(16),
      h: px(3),
      radius: px(1),
      color: color
    }))

    // Icon
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: x, y: y + px(14),
      w: w, h: px(20),
      text: icon,
      text_size: px(16),
      color: color,
      align_h: hmUI.align.CENTER_H
    }))

    // Value (large)
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: x, y: y + px(34),
      w: w, h: px(22),
      text: `${value}`,
      text_size: px(18),
      color: COLORS.textPrimary,
      align_h: hmUI.align.CENTER_H
    }))

    // Label
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: x, y: y + px(56),
      w: w, h: px(16),
      text: name,
      text_size: px(10),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawActivitySection() {
    const sectionY = px(225)

    // Section header with decorative lines
    const lineW = px(60)
    const textW = px(120)

    // Left line
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - textW / 2 - lineW - px(10),
      y: sectionY + px(8),
      w: lineW,
      h: px(1),
      color: COLORS.bgCardLight
    }))

    // Section title
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - textW / 2,
      y: sectionY,
      w: textW,
      h: px(18),
      text: 'DAILY LOG',
      text_size: px(12),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))

    // Right line
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX + textW / 2 + px(10),
      y: sectionY + px(8),
      w: lineW,
      h: px(1),
      color: COLORS.bgCardLight
    }))

    // Activity cards row
    const cardY = sectionY + px(28)
    const cardH = px(70)
    const cardGap = px(6)
    const totalWidth = W - px(80)  // More margin for round screen edges
    const cardW = Math.floor((totalWidth - cardGap * 2) / 3)
    const startX = px(40)  // Pushed in from edges

    // Format data
    const heartRate = sensorData.heartRate > 0 ? `${sensorData.heartRate}` : '--'
    const distKm = (sensorData.distance / 1000).toFixed(1)

    const activities = [
      { icon: '👟', value: `${sensorData.steps}`, label: 'STEPS', color: COLORS.speed },
      { icon: '📍', value: distKm, label: 'KM', color: COLORS.power },
      { icon: '❤️', value: heartRate, label: 'BPM', color: COLORS.endurance }
    ]

    activities.forEach((activity, index) => {
      const cardX = startX + index * (cardW + cardGap)
      this.drawActivityCard(cardX, cardY, cardW, cardH, activity)
    })

    // Calories row (centered below)
    const calY = cardY + cardH + px(15)
    this.drawCaloriesDisplay(calY)
  },

  drawActivityCard(x, y, w, h, activity) {
    // Card background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x, y: y, w: w, h: h,
      radius: px(10),
      color: COLORS.bgCard
    }))

    // Icon
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: x, y: y + px(10),
      w: w, h: px(20),
      text: activity.icon,
      text_size: px(16),
      color: activity.color,
      align_h: hmUI.align.CENTER_H
    }))

    // Value
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: x, y: y + px(32),
      w: w, h: px(22),
      text: activity.value,
      text_size: px(18),
      color: COLORS.textPrimary,
      align_h: hmUI.align.CENTER_H
    }))

    // Label
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: x, y: y + px(54),
      w: w, h: px(14),
      text: activity.label,
      text_size: px(10),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawCaloriesDisplay(y) {
    const displayW = px(140)

    // Background pill
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - displayW / 2,
      y: y,
      w: displayW,
      h: px(32),
      radius: px(16),
      color: COLORS.bgCard
    }))

    // Calories text
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - displayW / 2,
      y: y + px(6),
      w: displayW,
      h: px(20),
      text: `🔥 ${sensorData.calories} kcal`,
      text_size: px(13),
      color: COLORS.textSecondary,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawPageDots() {
    const dotY = px(420)
    const dotSize = px(8)
    const activeDotSize = px(10)
    const dotSpacing = px(18)
    const numDots = 5
    const totalW = (numDots - 1) * dotSpacing + dotSize
    const startX = CX - totalW / 2

    for (let i = 0; i < numDots; i++) {
      const isActive = i === 1 // Stats is page 2 (index 1)
      const size = isActive ? activeDotSize : dotSize
      const offset = isActive ? (activeDotSize - dotSize) / 2 : 0

      if (isActive) {
        // Glow for active dot
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: startX + i * dotSpacing - offset - px(2),
          y: dotY - offset - px(2),
          w: size + px(4),
          h: size + px(4),
          radius: (size + px(4)) / 2,
          color: COLORS.bgCardLight
        }))
      }

      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: startX + i * dotSpacing - offset,
        y: dotY - offset,
        w: size,
        h: size,
        radius: size / 2,
        color: isActive ? COLORS.textPrimary : COLORS.textMuted
      }))
    }
  },

  getDominantAffinity(affinities) {
    const { speed, power, endurance } = affinities
    if (speed >= power && speed >= endurance) return 'speed'
    if (power >= speed && power >= endurance) return 'power'
    return 'endurance'
  },

  cleanup() {
    widgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    widgets = []
  }
})
