import * as hmUI from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { Time, Step, HeartRate } from '@zos/sensor'
import { LocalStorage } from '@zos/storage'
import { push } from '@zos/router'
import { getShapeType, AFFINITY_COLORS } from '../lib/shapes'
import { EVOLUTION_THRESHOLDS } from '../lib/evolution'

// Get screen dimensions
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

const COLORS = {
  bgDark: 0x000000,
  textPrimary: 0xFFFFFF,
  textSecondary: 0xBBBBBB,
  textMuted: 0x888888,
  heartRate: 0xFF5555,
  steps: 0x00BFFF,
  barBg: 0x333333,
  barFill: 0x4CAF50
}

let widgets = []
let creature = null
let timeSensor = null
let stepSensor = null
let hrSensor = null
let timeWidget = null
let stepsWidget = null
let hrWidget = null
let xpBarFill = null

WatchFace({
  onInit() {
    // Load creature from storage
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
    this.buildHeartRate()
    this.buildBlob()
    this.buildSteps()
    this.buildXPBar()
  },

  onDestroy() {
    this.cleanup()
  },

  buildBackground() {
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: H,
      color: COLORS.bgDark
    }))
  },

  buildTime() {
    try {
      timeSensor = new Time()
    } catch (e) {}

    // Time display at top center
    timeWidget = hmUI.createWidget(hmUI.widget.TEXT_TIME, {
      x: px(100),
      y: px(60),
      w: W - px(200),
      h: px(60),
      format_hour: 1, // 24-hour format
      hour_startX: px(100),
      hour_startY: px(60),
      hour_align: hmUI.align.CENTER_H,
      hour_color: COLORS.textPrimary,
      hour_unit_sc: px(48),
      hour_unit_tc: px(48),
      hour_unit_en: px(48),
      minute_follow: 1,
      minute_align: hmUI.align.CENTER_H,
      minute_color: COLORS.textPrimary,
      minute_unit_sc: px(48),
      minute_unit_tc: px(48),
      minute_unit_en: px(48),
      am_pm_en: 0
    })
    widgets.push(timeWidget)
  },

  buildHeartRate() {
    try {
      hrSensor = new HeartRate()
    } catch (e) {}

    const hr = hrSensor?.getCurrent() || 0
    const hrText = hr > 0 ? `${hr}` : '--'

    // Heart icon
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: W - px(100),
      y: px(70),
      w: px(30),
      h: px(24),
      text: '\u2764', // Heart unicode
      text_size: px(18),
      color: COLORS.heartRate,
      align_h: hmUI.align.CENTER_H
    }))

    // Heart rate value
    hrWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: W - px(70),
      y: px(70),
      w: px(50),
      h: px(24),
      text: hrText,
      text_size: px(18),
      color: COLORS.textSecondary,
      align_h: hmUI.align.LEFT
    })
    widgets.push(hrWidget)
  },

  buildBlob() {
    // Simplified blob at center
    const blobSize = px(100)
    const blobY = CY - px(20)

    // Get affinity color
    let blobColor = COLORS.textMuted
    if (creature && creature.affinities) {
      const type = getShapeType(creature.affinities)
      blobColor = AFFINITY_COLORS[type]?.primary || COLORS.textMuted
    }

    // Main blob body (simple circle)
    const blobWidget = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - blobSize / 2,
      y: blobY - blobSize / 2,
      w: blobSize,
      h: blobSize,
      radius: blobSize / 2,
      color: blobColor
    })
    widgets.push(blobWidget)

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
    const eyeSize = px(12)
    const eyeSpacing = px(30)
    const eyeY = blobY - px(5)

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
    const hlEyeSize = px(4)
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

    // Tap area to open app
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - blobSize / 2 - px(10),
      y: blobY - blobSize / 2 - px(10),
      w: blobSize + px(20),
      h: blobSize + px(20),
      radius: (blobSize + px(20)) / 2,
      color: 0x000000,
      alpha: 0
    }).addEventListener(hmUI.event.CLICK_UP, () => {
      try {
        push({ url: 'page/home/index' })
      } catch (e) {}
    }))
  },

  buildSteps() {
    try {
      stepSensor = new Step()
    } catch (e) {}

    const steps = stepSensor?.getCurrent() || 0
    const stepsY = CY + px(80)

    // Steps icon (flame emoji alternative - use text)
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - px(100),
      y: stepsY,
      w: px(30),
      h: px(28),
      text: '\u{1F525}', // Fire emoji
      text_size: px(20),
      color: COLORS.steps,
      align_h: hmUI.align.CENTER_H
    }))

    // Steps value
    stepsWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - px(65),
      y: stepsY,
      w: px(130),
      h: px(28),
      text: `${steps.toLocaleString()} steps`,
      text_size: px(20),
      color: COLORS.textPrimary,
      align_h: hmUI.align.LEFT
    })
    widgets.push(stepsWidget)
  },

  buildXPBar() {
    const barY = CY + px(120)
    const barW = px(200)
    const barH = px(12)
    const barX = CX - barW / 2

    // Calculate XP progress
    let progress = 0
    let progressText = '0%'
    if (creature) {
      const threshold = EVOLUTION_THRESHOLDS[creature.stage]
      if (threshold) {
        progress = Math.min(100, Math.round((creature.currentStageXP / threshold) * 100))
      } else {
        progress = 100 // Max level
      }
      progressText = `${progress}%`
    }

    // Background bar
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: barX, y: barY,
      w: barW, h: barH,
      radius: barH / 2,
      color: COLORS.barBg
    }))

    // Progress fill
    const fillW = Math.max(barH, Math.round((barW - px(4)) * progress / 100))
    xpBarFill = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: barX + px(2), y: barY + px(2),
      w: fillW, h: barH - px(4),
      radius: (barH - px(4)) / 2,
      color: COLORS.barFill
    })
    widgets.push(xpBarFill)

    // Progress text
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: barX, y: barY + barH + px(5),
      w: barW, h: px(18),
      text: progressText,
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
  },

  cleanup() {
    widgets.forEach(w => {
      try { hmUI.deleteWidget(w) } catch (e) {}
    })
    widgets = []
  }
})
