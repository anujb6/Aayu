import * as hmUI from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { Time, Step, HeartRate } from '@zos/sensor'
import { LocalStorage } from '@zos/storage'
import { push } from '@zos/router'
import { getShapeType, AFFINITY_COLORS } from '../lib/shapes'
import { EVOLUTION_THRESHOLDS } from '../lib/evolution'

// ============================================
// RESPONSIVE SETUP
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

function px(val) {
  return Math.round(val * W / 480)
}

// ============================================
// RPG COLOR PALETTE
// ============================================
const COLORS = {
  bgDark: 0x08080c,
  bgCard: 0x12121a,
  bgCardLight: 0x1a1a24,

  textPrimary: 0xFFFFFF,
  textSecondary: 0xB0B0C0,
  textMuted: 0x606070,

  heartRate: 0xFF5555,
  heartRateDark: 0x802a2a,
  steps: 0x00BFFF,
  stepsDark: 0x005580,

  speed: 0x00BFFF,
  speedDark: 0x005580,
  power: 0xFF6B35,
  powerDark: 0x993F1F,
  endurance: 0x9B59B6,
  enduranceDark: 0x5D356D,

  xpFill: 0x4CAF50,
  xpDark: 0x2E7D32
}

let widgets = []
let creature = null
let timeSensor = null
let stepSensor = null
let hrSensor = null

WatchFace({
  onInit() {
    try {
      const storage = new LocalStorage()
      const saved = storage.getItem('creature')
      if (saved) {
        creature = JSON.parse(saved)
      }
    } catch (e) {
      creature = null
    }
  },

  build() {
    this.buildBackground()
    this.buildTime()
    this.buildCreature()
    this.buildStatArcs()
    this.buildStatBadges()
    this.buildDate()
  },

  onDestroy() {
    this.cleanup()
  },

  // ==================== HELPERS ====================

  getDominantAffinity() {
    if (!creature || !creature.affinities) return 'endurance'
    const { speed, power, endurance } = creature.affinities
    if (speed >= power && speed >= endurance) return 'speed'
    if (power >= speed && power >= endurance) return 'power'
    return 'endurance'
  },

  getAffinityColor() {
    const dominant = this.getDominantAffinity()
    return COLORS[dominant] || COLORS.endurance
  },

  getAffinityDarkColor() {
    const dominant = this.getDominantAffinity()
    return COLORS[`${dominant}Dark`] || COLORS.enduranceDark
  },

  // ==================== BACKGROUND ====================

  buildBackground() {
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: H,
      color: COLORS.bgDark
    }))
  },

  // ==================== TIME ====================

  buildTime() {
    try {
      timeSensor = new Time()
    } catch (e) {}

    const timeY = px(50)
    const affinityColor = this.getAffinityColor()

    // Time display
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT_TIME, {
      x: 0,
      y: timeY,
      w: W,
      h: px(50),
      format_hour: 1,
      hour_startX: CX - px(70),
      hour_startY: timeY,
      hour_align: hmUI.align.RIGHT,
      hour_color: COLORS.textPrimary,
      hour_unit_sc: px(44),
      hour_unit_tc: px(44),
      hour_unit_en: px(44),
      minute_startX: CX + px(5),
      minute_startY: timeY,
      minute_follow: 0,
      minute_align: hmUI.align.LEFT,
      minute_color: COLORS.textPrimary,
      minute_unit_sc: px(44),
      minute_unit_tc: px(44),
      minute_unit_en: px(44),
      am_pm_en: 0
    }))

    // Colon between hour and minute
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - px(8),
      y: timeY - px(2),
      w: px(16),
      h: px(50),
      text: ':',
      text_size: px(40),
      color: COLORS.textPrimary,
      align_h: hmUI.align.CENTER_H
    }))

    // Accent line below time
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - px(40),
      y: timeY + px(55),
      w: px(80),
      h: px(3),
      radius: px(1),
      color: affinityColor
    }))
  },

  // ==================== CREATURE ====================

  buildCreature() {
    const blobSize = px(80)
    const blobY = CY - px(10)
    const affinityColor = this.getAffinityColor()
    const affinityDark = this.getAffinityDarkColor()

    // Outer glow ring
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - blobSize / 2 - px(12),
      y: blobY - blobSize / 2 - px(12),
      w: blobSize + px(24),
      h: blobSize + px(24),
      radius: (blobSize + px(24)) / 2,
      color: affinityDark
    }))

    // Inner glow ring
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - blobSize / 2 - px(6),
      y: blobY - blobSize / 2 - px(6),
      w: blobSize + px(12),
      h: blobSize + px(12),
      radius: (blobSize + px(12)) / 2,
      color: affinityColor
    }))

    // Get blob color from creature affinities
    let blobColor = COLORS.textMuted
    if (creature && creature.affinities) {
      const type = getShapeType(creature.affinities)
      blobColor = AFFINITY_COLORS[type]?.primary || COLORS.textMuted
    }

    // Main blob body
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - blobSize / 2,
      y: blobY - blobSize / 2,
      w: blobSize,
      h: blobSize,
      radius: blobSize / 2,
      color: blobColor
    }))

    // Body highlight
    const hlSize = Math.round(blobSize * 0.25)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - blobSize / 4,
      y: blobY - blobSize / 3,
      w: hlSize,
      h: Math.round(hlSize * 0.6),
      radius: Math.round(hlSize * 0.3),
      color: 0xFFFFFF
    }))

    // Eyes
    const eyeSize = px(10)
    const eyeSpacing = px(24)
    const eyeY = blobY

    // Left eye
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - eyeSpacing / 2 - eyeSize / 2,
      y: eyeY - eyeSize / 2,
      w: eyeSize,
      h: eyeSize,
      radius: eyeSize / 2,
      color: 0x000000
    }))

    // Right eye
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX + eyeSpacing / 2 - eyeSize / 2,
      y: eyeY - eyeSize / 2,
      w: eyeSize,
      h: eyeSize,
      radius: eyeSize / 2,
      color: 0x000000
    }))

    // Eye highlights
    const hlEyeSize = px(3)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - eyeSpacing / 2 - eyeSize / 4,
      y: eyeY - eyeSize / 3,
      w: hlEyeSize,
      h: hlEyeSize,
      radius: hlEyeSize / 2,
      color: 0xFFFFFF
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX + eyeSpacing / 2 - eyeSize / 4,
      y: eyeY - eyeSize / 3,
      w: hlEyeSize,
      h: hlEyeSize,
      radius: hlEyeSize / 2,
      color: 0xFFFFFF
    }))

    // Creature name badge
    if (creature && creature.name) {
      const badgeW = px(100)
      const badgeH = px(22)
      const badgeY = blobY + blobSize / 2 + px(18)

      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: CX - badgeW / 2,
        y: badgeY,
        w: badgeW,
        h: badgeH,
        radius: badgeH / 2,
        color: COLORS.bgCard
      }))

      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: CX - badgeW / 2,
        y: badgeY + px(3),
        w: badgeW,
        h: px(16),
        text: creature.name,
        text_size: px(12),
        color: COLORS.textPrimary,
        align_h: hmUI.align.CENTER_H
      }))
    }

    // Tap area to open app
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - blobSize / 2 - px(20),
      y: blobY - blobSize / 2 - px(20),
      w: blobSize + px(40),
      h: blobSize + px(40),
      radius: (blobSize + px(40)) / 2,
      color: 0x000000,
      alpha: 0
    }).addEventListener(hmUI.event.CLICK_UP, () => {
      try {
        push({ url: 'page/home/index' })
      } catch (e) {}
    }))
  },

  // ==================== STAT ARCS ====================

  buildStatArcs() {
    const blobY = CY - px(10)
    const arcRadius = px(75)
    const dotSize = px(8)
    const numDots = 6

    // Get sensor values
    try { hrSensor = new HeartRate() } catch (e) {}
    try { stepSensor = new Step() } catch (e) {}

    const hr = hrSensor?.getCurrent() || 0
    const steps = stepSensor?.getCurrent() || 0
    const hrProgress = Math.min(100, Math.max(0, (hr - 40) / 160 * 100)) // 40-200 bpm range
    const stepsProgress = Math.min(100, steps / 10000 * 100) // 10k steps goal

    // Calculate XP progress
    let xpProgress = 0
    if (creature) {
      const threshold = EVOLUTION_THRESHOLDS[creature.stage]
      if (threshold) {
        xpProgress = Math.min(100, (creature.currentStageXP / threshold) * 100)
      } else {
        xpProgress = 100
      }
    }

    // Heart Rate Arc (Left side) - angles from 150° to 210° (top-left quadrant)
    this.drawArc(CX, blobY, arcRadius, 150, 210, numDots, dotSize, COLORS.heartRate, COLORS.heartRateDark, hrProgress)

    // Steps Arc (Right side) - angles from -30° to 30° (top-right quadrant)
    this.drawArc(CX, blobY, arcRadius, -30, 30, numDots, dotSize, COLORS.steps, COLORS.stepsDark, stepsProgress)

    // XP Arc (Bottom) - angles from 60° to 120°
    const affinityColor = this.getAffinityColor()
    const affinityDark = this.getAffinityDarkColor()
    this.drawArc(CX, blobY, arcRadius, 60, 120, numDots, dotSize, affinityColor, affinityDark, xpProgress)
  },

  drawArc(cx, cy, radius, startAngle, endAngle, numDots, dotSize, activeColor, inactiveColor, progress) {
    const angleRange = endAngle - startAngle
    const activeDots = Math.round((progress / 100) * numDots)

    for (let i = 0; i < numDots; i++) {
      const angle = (startAngle + (angleRange / (numDots - 1)) * i) * Math.PI / 180
      const x = cx + Math.cos(angle) * radius
      const y = cy + Math.sin(angle) * radius
      const isActive = i < activeDots
      const size = isActive ? dotSize : dotSize - px(2)

      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - size / 2,
        y: y - size / 2,
        w: size,
        h: size,
        radius: size / 2,
        color: isActive ? activeColor : inactiveColor
      }))
    }
  },

  // ==================== STAT BADGES ====================

  buildStatBadges() {
    const badgeY = px(340)
    const badgeW = px(95)
    const badgeH = px(28)
    const gap = px(8)
    const totalW = badgeW * 3 + gap * 2
    const startX = CX - totalW / 2

    // Get values
    const hr = hrSensor?.getCurrent() || 0
    const steps = stepSensor?.getCurrent() || 0
    let xpPercent = 0
    if (creature) {
      const threshold = EVOLUTION_THRESHOLDS[creature.stage]
      if (threshold) {
        xpPercent = Math.round((creature.currentStageXP / threshold) * 100)
      } else {
        xpPercent = 100
      }
    }

    const badges = [
      { icon: '❤️', value: hr > 0 ? `${hr}` : '--', color: COLORS.heartRate },
      { icon: '🔥', value: this.formatSteps(steps), color: COLORS.steps },
      { icon: '⚡', value: `${xpPercent}%`, color: this.getAffinityColor() }
    ]

    badges.forEach((badge, index) => {
      const x = startX + index * (badgeW + gap)
      this.drawStatBadge(x, badgeY, badgeW, badgeH, badge)
    })
  },

  drawStatBadge(x, y, w, h, badge) {
    // Badge background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x, y: y, w: w, h: h,
      radius: h / 2,
      color: COLORS.bgCard
    }))

    // Icon + Value
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: x, y: y + px(5),
      w: w, h: px(18),
      text: `${badge.icon} ${badge.value}`,
      text_size: px(14),
      color: badge.color,
      align_h: hmUI.align.CENTER_H
    }))
  },

  formatSteps(steps) {
    if (steps >= 10000) {
      return `${(steps / 1000).toFixed(1)}k`
    } else if (steps >= 1000) {
      return `${(steps / 1000).toFixed(1)}k`
    }
    return `${steps}`
  },

  // ==================== DATE ====================

  buildDate() {
    const dateY = px(390)

    try {
      timeSensor = timeSensor || new Time()
    } catch (e) {}

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    let dateText = ''
    try {
      const now = new Date()
      const dayName = days[now.getDay()]
      const monthName = months[now.getMonth()]
      const date = now.getDate()
      dateText = `${dayName}, ${monthName} ${date}`
    } catch (e) {
      dateText = ''
    }

    if (dateText) {
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(60), y: dateY,
        w: W - px(120), h: px(20),
        text: dateText,
        text_size: px(14),
        color: COLORS.textMuted,
        align_h: hmUI.align.CENTER_H
      }))
    }
  },

  // ==================== CLEANUP ====================

  cleanup() {
    widgets.forEach(w => {
      try { hmUI.deleteWidget(w) } catch (e) {}
    })
    widgets = []
  }
})
