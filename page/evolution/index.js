import * as hmUI from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { push, back } from '@zos/router'
import { onGesture, offGesture, GESTURE_LEFT, GESTURE_RIGHT } from '@zos/interaction'
import { getShapeType, AFFINITY_COLORS } from '../../lib/shapes'
import { STAGE_NAMES, EVOLUTION_THRESHOLDS, MIN_DAYS_PER_STAGE } from '../../lib/evolution'

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
  bgMedium: 0x1a1a2e,
  textPrimary: 0xFFFFFF,
  textSecondary: 0xBBBBBB,
  textMuted: 0x888888,
  textDark: 0x555555,
  success: 0x4CAF50,
  gold: 0xFFD700,
  barBg: 0x2a2a3e
}

const AFFINITY_NAMES = {
  speed: 'Speed',
  power: 'Power',
  endurance: 'Endurance',
  balanced: 'Balanced'
}

// Use MIN_DAYS_PER_STAGE from evolution.js
const MIN_DAYS = MIN_DAYS_PER_STAGE

let widgets = []
let barWidgets = []
let creature = null

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
          push({ url: 'page/traits/index' })
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
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: H,
      color: COLORS.bgDark
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(50), w: W - px(120), h: px(32),
      text: 'Evolution',
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

    // Current stage - color based on dominant affinity
    const dominantType = getShapeType(creature.affinities || { speed: 0, power: 0, endurance: 0 })
    const stageColor = AFFINITY_COLORS[dominantType]?.primary || 0x9B59B6

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(85), w: W - px(120), h: px(30),
      text: STAGE_NAMES[creature.stage],
      text_size: px(22),
      color: stageColor,
      align_h: hmUI.align.CENTER_H
    }))

    this.createStageDots(px(120), stageColor)
    this.createBranchPreview(px(175), dominantType)
    this.createRequirements(px(240), stageColor)
    this.createHistorySection(px(380))
    this.createPageDots(px(435))
  },

  createStageDots(y, stageColor) {
    const dotSize = px(20)
    const spacing = px(44)
    const totalWidth = 6 * dotSize + 5 * (spacing - dotSize)
    const startX = CX - totalWidth / 2

    // Progress line bg
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: startX + dotSize / 2,
      y: y + dotSize / 2 - px(2),
      w: totalWidth - dotSize,
      h: px(4),
      radius: px(2),
      color: COLORS.bgLight
    }))

    // Progress line fill
    const progressW = Math.max(0, (creature.stage - 1) * spacing)
    if (progressW > 0) {
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: startX + dotSize / 2,
        y: y + dotSize / 2 - px(2),
        w: progressW,
        h: px(4),
        radius: px(2),
        color: stageColor
      }))
    }

    for (let i = 1; i <= 6; i++) {
      const dotX = startX + (i - 1) * spacing
      const isComplete = i <= creature.stage
      const isCurrent = i === creature.stage

      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: dotX, y: y,
        w: dotSize, h: dotSize,
        radius: dotSize / 2,
        color: isComplete ? stageColor : COLORS.bgLight
      }))

      if (isCurrent) {
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: dotX + px(5), y: y + px(5),
          w: dotSize - px(10), h: dotSize - px(10),
          radius: (dotSize - px(10)) / 2,
          color: COLORS.textPrimary
        }))
      }

      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: dotX - px(5), y: y + dotSize + px(3),
        w: dotSize + px(10), h: px(12),
        text: `${i}`,
        text_size: px(10),
        color: isComplete ? COLORS.textSecondary : COLORS.textDark,
        align_h: hmUI.align.CENTER_H
      }))
    }
  },

  createBranchPreview(y, dominantType) {
    const affinityColor = AFFINITY_COLORS[dominantType]?.primary || 0xCCCCCC
    const affinityName = AFFINITY_NAMES[dominantType] || 'Balanced'

    // Background box
    const boxW = px(200)
    const boxH = px(50)
    const boxX = CX - boxW / 2

    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: boxX, y: y,
      w: boxW, h: boxH,
      radius: px(8),
      color: COLORS.bgMedium
    }))

    // Mini blob indicator
    const blobSize = px(30)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: boxX + px(12), y: y + (boxH - blobSize) / 2,
      w: blobSize, h: blobSize,
      radius: blobSize / 2,
      color: affinityColor
    }))

    // Affinity type label
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: boxX + px(50), y: y + px(8),
      w: boxW - px(60), h: px(18),
      text: `${affinityName} Type`,
      text_size: px(15),
      color: affinityColor,
      align_h: hmUI.align.LEFT
    }))

    // Evolving as text
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: boxX + px(50), y: y + px(28),
      w: boxW - px(60), h: px(16),
      text: 'evolving as',
      text_size: px(12),
      color: COLORS.textMuted,
      align_h: hmUI.align.LEFT
    }))
  },

  createRequirements(startY, stageColor) {
    if (creature.stage >= 6) {
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(60), y: startY, w: W - px(120), h: px(26),
        text: 'Max Evolution!',
        text_size: px(20),
        color: COLORS.gold,
        align_h: hmUI.align.CENTER_H
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(60), y: startY + px(30), w: W - px(120), h: px(20),
        text: 'Transcendent achieved',
        text_size: px(14),
        color: COLORS.textMuted,
        align_h: hmUI.align.CENTER_H
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(60), y: startY + px(55), w: W - px(120), h: px(20),
        text: `Total XP: ${creature.totalXP}`,
        text_size: px(15),
        color: COLORS.textSecondary,
        align_h: hmUI.align.CENTER_H
      }))
      return
    }

    const threshold = EVOLUTION_THRESHOLDS[creature.stage]
    const minDays = MIN_DAYS[creature.stage]
    const xpProgress = Math.min(100, Math.round((creature.currentStageXP / threshold) * 100))
    const xpMet = creature.currentStageXP >= threshold
    const daysMet = creature.daysInStage >= minDays

    const nextStage = STAGE_NAMES[creature.stage + 1]
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: startY, w: W - px(120), h: px(22),
      text: `Next: ${nextStage}`,
      text_size: px(16),
      color: COLORS.textSecondary,
      align_h: hmUI.align.CENTER_H
    }))

    // Compact bar dimensions
    const barW = px(260)
    const barX = CX - barW / 2
    const labelX = barX
    const valueX = barX + barW - px(90)

    // XP requirement
    const xpY = startY + px(28)
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: labelX, y: xpY, w: px(50), h: px(18),
      text: 'XP',
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.LEFT
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: valueX, y: xpY, w: px(90), h: px(18),
      text: `${creature.currentStageXP}/${threshold}`,
      text_size: px(14),
      color: xpMet ? COLORS.success : COLORS.textSecondary,
      align_h: hmUI.align.RIGHT
    }))

    this.createProgressBar(barX, xpY + px(18), barW, px(10), xpProgress, xpMet ? COLORS.success : stageColor)

    // Days requirement
    const daysY = xpY + px(40)
    const daysProgress = Math.min(100, Math.round((creature.daysInStage / minDays) * 100))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: labelX, y: daysY, w: px(50), h: px(18),
      text: 'Days',
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.LEFT
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: valueX, y: daysY, w: px(90), h: px(18),
      text: `${creature.daysInStage}/${minDays}`,
      text_size: px(14),
      color: daysMet ? COLORS.success : COLORS.textSecondary,
      align_h: hmUI.align.RIGHT
    }))

    this.createProgressBar(barX, daysY + px(18), barW, px(10), daysProgress, daysMet ? COLORS.success : stageColor)

    // Status
    const statusY = daysY + px(38)
    const canEvolve = xpMet && daysMet
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: statusY, w: W - px(120), h: px(22),
      text: canEvolve ? 'Ready to evolve!' : 'Keep training...',
      text_size: px(15),
      color: canEvolve ? COLORS.success : COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
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

  createHistorySection(y) {
    const history = creature.evolutionHistory || []
    if (history.length === 0 && creature.stage <= 1) return

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(70), y: y, w: W - px(140), h: px(18),
      text: 'History',
      text_size: px(13),
      color: COLORS.textMuted,
      align_h: hmUI.align.LEFT
    }))

    const listY = y + px(20)
    const listH = px(38) // Height for scrollable area
    const itemH = px(22)
    const listW = W - px(100)
    const listX = px(50)

    // Reverse history to show most recent first
    const reversedHistory = [...history].reverse()

    // Create scrollable list for history
    widgets.push(hmUI.createWidget(hmUI.widget.SCROLL_LIST, {
      x: listX,
      y: listY,
      w: listW,
      h: listH,
      item_space: px(2),
      item_config: [{
        type_id: 1,
        item_height: itemH,
        item_bg_color: COLORS.bgMedium,
        item_bg_radius: px(4),
        text_view: [{
          x: px(24),
          y: px(2),
          w: listW - px(30),
          h: itemH - px(4),
          key: 'text',
          color: COLORS.textSecondary,
          text_size: px(13)
        }],
        text_view_count: 1
      }],
      item_config_count: 1,
      data_array: reversedHistory.map(entry => {
        const parts = entry.split('_')
        const affinity = parts[0] || 'balanced'
        const stage = parseInt(parts[1], 10) || 1
        const stageName = STAGE_NAMES[stage] || `Stage ${stage}`
        const affinityName = AFFINITY_NAMES[affinity] || 'Balanced'
        return {
          type: 1,
          text: `${stageName}: ${affinityName}`
        }
      }),
      data_count: reversedHistory.length,
      item_click_func: () => {}
    }))
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
        color: i === 2 ? COLORS.textPrimary : COLORS.textDark
      }))
    }
  },

  cleanup() {
    barWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    barWidgets = []
    widgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    widgets = []
  }
})
