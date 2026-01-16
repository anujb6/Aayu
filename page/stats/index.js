import * as hmUI from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { push, back } from '@zos/router'
import { onGesture, offGesture, GESTURE_LEFT, GESTURE_RIGHT } from '@zos/interaction'
import { Step, Distance, HeartRate, Calorie } from '@zos/sensor'

// Get screen dimensions with fallback
let W = 480
let H = 480
try {
  const info = getDeviceInfo()
  W = info.width || 480
  H = info.height || 480
} catch (e) {}

const CX = Math.round(W / 2)

function px(val) {
  return Math.round(val * W / 480)
}

const COLORS = {
  bgDark: 0x000000,
  bgLight: 0x2a2a3e,
  textPrimary: 0xFFFFFF,
  textSecondary: 0xBBBBBB,
  textMuted: 0x888888,
  textDark: 0x555555,
  speed: 0x00BFFF,
  power: 0xFF6B35,
  endurance: 0x9B59B6,
  success: 0x4CAF50,
  barBg: 0x2a2a3e
}

let widgets = []
let barWidgets = []
let creature = null
let stepSensor = null
let distSensor = null
let hrSensor = null
let calSensor = null
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

  buildUI() {
    // Background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: H,
      color: COLORS.bgDark
    }))

    // Title
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(50), w: W - px(120), h: px(32),
      text: 'Stats',
      text_size: px(26),
      color: COLORS.textPrimary,
      align_h: hmUI.align.CENTER_H
    }))

    if (!creature) {
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(60), y: px(200), w: W - px(120), h: px(30),
        text: 'No creature data',
        text_size: px(16),
        color: COLORS.textMuted,
        align_h: hmUI.align.CENTER_H
      }))
      return
    }

    this.loadSensorData()
    this.buildAffinitySection()
    this.buildActivitySection()
  },

  loadSensorData() {
    try {
      stepSensor = new Step()
      sensorData.steps = stepSensor.getCurrent() || 0
    } catch (e) {}

    try {
      distSensor = new Distance()
      sensorData.distance = distSensor.getCurrent() || 0
    } catch (e) {}

    try {
      hrSensor = new HeartRate()
      sensorData.heartRate = hrSensor.getCurrent() || 0
    } catch (e) {}

    try {
      calSensor = new Calorie()
      sensorData.calories = calSensor.getCurrent() || 0
    } catch (e) {}
  },

  buildAffinitySection() {
    const startY = px(90)
    const barWidth = px(280)
    const barX = CX - barWidth / 2
    const labelX = barX
    const valueX = barX + barWidth - px(60)

    // Use creature's stored affinities (0-100 scale)
    const affinities = creature.affinities || { speed: 0, power: 0, endurance: 0 }

    // Speed
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: labelX, y: startY, w: px(120), h: px(22),
      text: 'Speed',
      text_size: px(16),
      color: COLORS.speed,
      align_h: hmUI.align.LEFT
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: valueX, y: startY, w: px(60), h: px(22),
      text: `${affinities.speed}`,
      text_size: px(16),
      color: COLORS.textSecondary,
      align_h: hmUI.align.RIGHT
    }))
    this.createProgressBar(barX, startY + px(24), barWidth, px(12), affinities.speed, COLORS.speed)

    // Power
    const powerY = startY + px(60)
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: labelX, y: powerY, w: px(120), h: px(22),
      text: 'Power',
      text_size: px(16),
      color: COLORS.power,
      align_h: hmUI.align.LEFT
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: valueX, y: powerY, w: px(60), h: px(22),
      text: `${affinities.power}`,
      text_size: px(16),
      color: COLORS.textSecondary,
      align_h: hmUI.align.RIGHT
    }))
    this.createProgressBar(barX, powerY + px(24), barWidth, px(12), affinities.power, COLORS.power)

    // Endurance
    const endurY = startY + px(120)
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: labelX, y: endurY, w: px(120), h: px(22),
      text: 'Endurance',
      text_size: px(16),
      color: COLORS.endurance,
      align_h: hmUI.align.LEFT
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: valueX, y: endurY, w: px(60), h: px(22),
      text: `${affinities.endurance}`,
      text_size: px(16),
      color: COLORS.textSecondary,
      align_h: hmUI.align.RIGHT
    }))
    this.createProgressBar(barX, endurY + px(24), barWidth, px(12), affinities.endurance, COLORS.endurance)

    // Dominant type from creature's affinities
    const dominant = this.getDominantAffinityFromData(affinities)
    const dominantColor = COLORS[dominant]
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: startY + px(180), w: W - px(120), h: px(24),
      text: `${dominant.charAt(0).toUpperCase() + dominant.slice(1)} Type`,
      text_size: px(18),
      color: dominantColor,
      align_h: hmUI.align.CENTER_H
    }))
  },

  buildActivitySection() {
    const sectionY = px(295)

    // Divider
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: px(100), y: sectionY - px(15),
      w: W - px(200), h: px(1),
      color: COLORS.bgLight
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: sectionY, w: W - px(120), h: px(26),
      text: "Today's Activity",
      text_size: px(18),
      color: COLORS.textSecondary,
      align_h: hmUI.align.CENTER_H
    }))

    // Use already loaded sensor data
    const heartRate = sensorData.heartRate > 0 ? `${sensorData.heartRate}` : '--'
    const distKm = (sensorData.distance / 1000).toFixed(1)

    // Stats row
    const rowY = sectionY + px(35)
    const colW = px(100)
    const col1X = CX - px(150)
    const col2X = CX - colW / 2
    const col3X = CX + px(50)

    // Steps
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: col1X, y: rowY, w: colW, h: px(30),
      text: `${sensorData.steps}`,
      text_size: px(24),
      color: COLORS.speed,
      align_h: hmUI.align.CENTER_H
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: col1X, y: rowY + px(30), w: colW, h: px(18),
      text: 'steps',
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))

    // Distance
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: col2X, y: rowY, w: colW, h: px(30),
      text: distKm,
      text_size: px(24),
      color: COLORS.power,
      align_h: hmUI.align.CENTER_H
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: col2X, y: rowY + px(30), w: colW, h: px(18),
      text: 'km',
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))

    // Heart Rate
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: col3X, y: rowY, w: colW, h: px(30),
      text: heartRate,
      text_size: px(24),
      color: COLORS.endurance,
      align_h: hmUI.align.CENTER_H
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: col3X, y: rowY + px(30), w: colW, h: px(18),
      text: 'bpm',
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))

    // Page dots
    this.createPageDots(px(435))
  },

  createProgressBar(x, y, width, height, progress, color) {
    barWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x, y: y, w: width, h: height,
      radius: height / 2,
      color: COLORS.barBg
    }))

    const fillWidth = Math.max(height, Math.round((width - px(4)) * Math.min(100, progress) / 100))
    if (progress > 0) {
      barWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + px(2), y: y + px(2),
        w: fillWidth, h: height - px(4),
        radius: (height - px(4)) / 2,
        color: color
      }))
    }
  },

  createPageDots(y) {
    const dotSize = px(6)
    const dotSpacing = px(14)
    const totalW = 5 * dotSize + 4 * (dotSpacing - dotSize)
    const startX = CX - totalW / 2

    for (let i = 0; i < 5; i++) {
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: startX + i * dotSpacing, y: y,
        w: dotSize, h: dotSize,
        radius: dotSize / 2,
        color: i === 1 ? COLORS.textPrimary : COLORS.textDark
      }))
    }
  },

  getDominantAffinityFromData(affinities) {
    const { speed, power, endurance } = affinities
    if (speed >= power && speed >= endurance) return 'speed'
    if (power >= speed && power >= endurance) return 'power'
    return 'endurance'
  },

  cleanup() {
    barWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    barWidgets = []
    widgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    widgets = []
  }
})
