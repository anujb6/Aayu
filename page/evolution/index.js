import * as hmUI from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { push, back } from '@zos/router'
import { onGesture, offGesture, GESTURE_LEFT, GESTURE_RIGHT } from '@zos/interaction'
import { getShapeType, AFFINITY_COLORS } from '../../lib/shapes'
import { STAGE_NAMES, EVOLUTION_THRESHOLDS, MIN_DAYS_PER_STAGE, canEvolve as checkCanEvolve } from '../../lib/evolution'
import { getDaysInStage } from '../../lib/creature'

// Get device dimensions for responsive design
let W = 480
let H = 480
try {
  const info = getDeviceInfo()
  W = info.width || 480
  H = info.height || 480
} catch (e) {}

// Center point and responsive scaling
const CX = Math.round(W / 2)
const CY = Math.round(H / 2)

// Responsive pixel function - scales based on 480px baseline
function px(val) {
  return Math.round(val * W / 480)
}

// ============================================
// RPG COLOR PALETTE - Modern Mobile RPG Style
// ============================================
const COLORS = {
  // Backgrounds
  bgDark: 0x0a0a12,
  bgCard: 0x14141f,
  bgCardLight: 0x1e1e2e,

  // Text
  textGold: 0xFFD700,
  textSilver: 0xC0C0C0,
  textBronze: 0xCD7F32,
  textPrimary: 0xFFFFFF,
  textSecondary: 0xA0A0B0,
  textMuted: 0x606070,

  // Accents
  gold: 0xFFD700,
  goldDark: 0xB8860B,
  goldGlow: 0x3d3200,
  silver: 0xC0C0C0,
  bronze: 0xCD7F32,

  // Status
  success: 0x4ADE80,
  successDark: 0x166534,
  successGlow: 0x14532d,

  // Stage-specific colors
  stage1: 0x94A3B8,  // Egg - Silver/Gray
  stage2: 0x60A5FA,  // Juvenile - Blue
  stage3: 0x4ADE80,  // Adolescent - Green
  stage4: 0xA78BFA,  // Adult - Purple
  stage5: 0xF97316,  // Elder - Orange
  stage6: 0xFFD700,  // Transcendent - Gold
}

// Stage colors array for easy access
const STAGE_COLORS = [
  COLORS.stage1, COLORS.stage2, COLORS.stage3,
  COLORS.stage4, COLORS.stage5, COLORS.stage6
]

// Stage icons/symbols
const STAGE_SYMBOLS = ['◇', '◈', '❖', '✦', '★', '✪']

const MIN_DAYS = MIN_DAYS_PER_STAGE

let widgets = []
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
    // Full screen background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: H,
      color: COLORS.bgDark
    }))

    if (!creature) {
      this.drawNoData()
      return
    }

    // Calculate evolution status
    const stage = creature.stage || 1
    const threshold = EVOLUTION_THRESHOLDS[stage] || 999999
    const minDays = MIN_DAYS[stage] || 999
    // Calculate daysInStage dynamically from stageStartDate
    const daysInStage = getDaysInStage(creature)
    const xpProgress = Math.min(100, Math.round((creature.currentStageXP / threshold) * 100))
    const daysProgress = Math.min(100, Math.round((daysInStage / minDays) * 100))
    const xpMet = creature.currentStageXP >= threshold
    const daysMet = daysInStage >= minDays
    const canEvolve = checkCanEvolve(creature)
    const isMaxStage = stage >= 6

    // Get stage color
    const stageColor = STAGE_COLORS[stage - 1] || COLORS.gold
    const dominantType = getShapeType(creature.affinities || { speed: 0, power: 0, endurance: 0 })
    const affinityColor = AFFINITY_COLORS[dominantType]?.primary || stageColor

    // ===== DRAW RPG UI =====

    // 1. Title at top (within safe area)
    this.drawTitle()

    // 2. Central Shield/Emblem
    this.drawStageEmblem(stage, stageColor, canEvolve, isMaxStage)

    // 3. Stage name below emblem
    this.drawStageName(stage, stageColor, isMaxStage)

    // 4. Progress bars (XP and Days)
    if (!isMaxStage) {
      this.drawProgressSection(xpProgress, daysProgress, xpMet, daysMet, stageColor, canEvolve, daysInStage)
    } else {
      this.drawMaxStageInfo(daysInStage)
    }

    // 5. Stage progression dots at bottom
    this.drawStageProgression(stage, stageColor)
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
      x: 0, y: px(28), w: W, h: px(28),
      text: 'EVOLUTION',
      text_size: px(18),
      color: COLORS.textSecondary,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawStageEmblem(stage, stageColor, canEvolve, isMaxStage) {
    const emblemSize = px(140)
    const emblemX = CX - emblemSize / 2
    const emblemY = px(70)

    // Outer glow ring (largest)
    const glowColor = isMaxStage ? COLORS.goldGlow : this.getDimColor(stageColor)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: emblemX - px(12),
      y: emblemY - px(12),
      w: emblemSize + px(24),
      h: emblemSize + px(24),
      radius: (emblemSize + px(24)) / 2,
      color: glowColor
    }))

    // Middle glow ring
    const midGlowColor = canEvolve ? COLORS.successGlow : glowColor
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: emblemX - px(6),
      y: emblemY - px(6),
      w: emblemSize + px(12),
      h: emblemSize + px(12),
      radius: (emblemSize + px(12)) / 2,
      color: midGlowColor
    }))

    // Bright border ring
    const borderColor = canEvolve ? COLORS.success : (isMaxStage ? COLORS.gold : stageColor)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: emblemX - px(3),
      y: emblemY - px(3),
      w: emblemSize + px(6),
      h: emblemSize + px(6),
      radius: (emblemSize + px(6)) / 2,
      color: borderColor
    }))

    // Inner dark background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: emblemX,
      y: emblemY,
      w: emblemSize,
      h: emblemSize,
      radius: emblemSize / 2,
      color: COLORS.bgCard
    }))

    // Inner decorative ring
    const innerRingSize = emblemSize - px(20)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: emblemX + px(10),
      y: emblemY + px(10),
      w: innerRingSize,
      h: innerRingSize,
      radius: innerRingSize / 2,
      color: this.getDimColor(borderColor)
    }))

    // Center circle
    const centerSize = innerRingSize - px(8)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: emblemX + px(14),
      y: emblemY + px(14),
      w: centerSize,
      h: centerSize,
      radius: centerSize / 2,
      color: COLORS.bgCardLight
    }))

    // Stage number - large centered
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: emblemX,
      y: emblemY + px(35),
      w: emblemSize,
      h: px(55),
      text: `${stage}`,
      text_size: px(52),
      color: borderColor,
      align_h: hmUI.align.CENTER_H
    }))

    // Stage symbol below number
    const symbol = STAGE_SYMBOLS[stage - 1] || '◇'
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: emblemX,
      y: emblemY + px(90),
      w: emblemSize,
      h: px(30),
      text: symbol,
      text_size: px(22),
      color: borderColor,
      align_h: hmUI.align.CENTER_H
    }))

    // "READY" banner if can evolve
    if (canEvolve) {
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: CX - px(45),
        y: emblemY + emblemSize - px(8),
        w: px(90),
        h: px(22),
        radius: px(11),
        color: COLORS.success
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: CX - px(45),
        y: emblemY + emblemSize - px(6),
        w: px(90),
        h: px(20),
        text: 'READY',
        text_size: px(12),
        color: COLORS.bgDark,
        align_h: hmUI.align.CENTER_H
      }))
    }

    // Crown for max stage
    if (isMaxStage) {
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: CX - px(20),
        y: emblemY - px(28),
        w: px(40),
        h: px(28),
        text: '👑',
        text_size: px(22),
        color: COLORS.gold,
        align_h: hmUI.align.CENTER_H
      }))
    }
  },

  drawStageName(stage, stageColor, isMaxStage) {
    const nameY = px(230)
    const stageName = STAGE_NAMES[stage] || 'Unknown'

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: nameY, w: W, h: px(28),
      text: stageName.toUpperCase(),
      text_size: px(20),
      color: isMaxStage ? COLORS.gold : stageColor,
      align_h: hmUI.align.CENTER_H
    }))

    // Subtitle
    const subtitle = isMaxStage ? 'Maximum Evolution' : `Stage ${stage} of 6`
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: nameY + px(26), w: W, h: px(20),
      text: subtitle,
      text_size: px(13),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawProgressSection(xpProgress, daysProgress, xpMet, daysMet, stageColor, canEvolve, daysInStage) {
    const sectionY = px(290)
    const barWidth = W - px(100)
    const barX = px(50)
    const barHeight = px(14)

    // XP Progress
    this.drawProgressBar(
      barX, sectionY,
      barWidth, barHeight,
      xpProgress,
      xpMet ? COLORS.success : stageColor,
      xpMet,
      'XP',
      `${creature.currentStageXP}/${EVOLUTION_THRESHOLDS[creature.stage]}`
    )

    // Days Progress
    this.drawProgressBar(
      barX, sectionY + px(50),
      barWidth, barHeight,
      daysProgress,
      daysMet ? COLORS.success : stageColor,
      daysMet,
      'DAYS',
      `${daysInStage}/${MIN_DAYS[creature.stage]}`
    )

    // Status text
    const statusY = sectionY + px(100)
    if (canEvolve) {
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0, y: statusY, w: W, h: px(20),
        text: '▲ Ready to evolve! ▲',
        text_size: px(14),
        color: COLORS.success,
        align_h: hmUI.align.CENTER_H
      }))
    } else {
      const remaining = []
      if (!xpMet) remaining.push(`${EVOLUTION_THRESHOLDS[creature.stage] - creature.currentStageXP} XP`)
      if (!daysMet) remaining.push(`${MIN_DAYS[creature.stage] - daysInStage} days`)
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0, y: statusY, w: W, h: px(20),
        text: `Need: ${remaining.join(', ')}`,
        text_size: px(12),
        color: COLORS.textMuted,
        align_h: hmUI.align.CENTER_H
      }))
    }
  },

  drawProgressBar(x, y, width, height, progress, color, isComplete, label, valueText) {
    // Label on left
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: x, y: y - px(18), w: px(50), h: px(16),
      text: label,
      text_size: px(11),
      color: isComplete ? COLORS.success : COLORS.textMuted,
      align_h: hmUI.align.LEFT
    }))

    // Value on right
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: x + width - px(80), y: y - px(18), w: px(80), h: px(16),
      text: valueText,
      text_size: px(11),
      color: isComplete ? COLORS.success : COLORS.textSecondary,
      align_h: hmUI.align.RIGHT
    }))

    // Completion indicator
    if (isComplete) {
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: x + px(30), y: y - px(18), w: px(20), h: px(16),
        text: '✓',
        text_size: px(11),
        color: COLORS.success,
        align_h: hmUI.align.LEFT
      }))
    }

    // Bar background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x, y: y, w: width, h: height,
      radius: height / 2,
      color: COLORS.bgCardLight
    }))

    // Bar fill - only show if progress is meaningful (>2%)
    // Minimum width is height/2 to show a small dot, not a full circle
    if (progress > 2) {
      const calculatedWidth = Math.round(width * progress / 100)
      const fillWidth = Math.max(height / 2, calculatedWidth)

      // Glow under bar when complete
      if (isComplete) {
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: x - px(2), y: y - px(2),
          w: fillWidth + px(4), h: height + px(4),
          radius: (height + px(4)) / 2,
          color: this.getDimColor(color)
        }))
      }

      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x, y: y, w: fillWidth, h: height,
        radius: height / 2,
        color: color
      }))

      // Shine effect
      if (progress > 10) {
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: x + px(4), y: y + px(2),
          w: Math.max(px(10), fillWidth - px(8)), h: px(3),
          radius: px(1),
          color: COLORS.textPrimary
        }))
      }
    }
  },

  drawMaxStageInfo(daysInStage) {
    const infoY = px(290)

    // Stats display
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: infoY, w: W, h: px(20),
      text: '✦ TRANSCENDENT ✦',
      text_size: px(14),
      color: COLORS.gold,
      align_h: hmUI.align.CENTER_H
    }))

    // Total XP
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: infoY + px(30), w: W / 2, h: px(18),
      text: `${creature.totalXP}`,
      text_size: px(16),
      color: COLORS.textPrimary,
      align_h: hmUI.align.CENTER_H
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: infoY + px(48), w: W / 2, h: px(14),
      text: 'Total XP',
      text_size: px(10),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))

    // Days
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: W / 2, y: infoY + px(30), w: W / 2, h: px(18),
      text: `${daysInStage}+`,
      text_size: px(16),
      color: COLORS.textPrimary,
      align_h: hmUI.align.CENTER_H
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: W / 2, y: infoY + px(48), w: W / 2, h: px(14),
      text: 'Days',
      text_size: px(10),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawStageProgression(currentStage, stageColor) {
    const progressY = px(420)
    const dotSize = px(16)
    const dotSpacing = px(42)
    const totalWidth = 5 * dotSpacing + dotSize
    const startX = CX - totalWidth / 2

    for (let i = 1; i <= 6; i++) {
      const dotX = startX + (i - 1) * dotSpacing
      const isComplete = i < currentStage
      const isCurrent = i === currentStage
      const dotColor = STAGE_COLORS[i - 1]

      if (isCurrent) {
        // Current stage - larger with glow
        const currentSize = px(22)
        const offset = (currentSize - dotSize) / 2

        // Glow
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: dotX - offset - px(3),
          y: progressY - offset - px(3),
          w: currentSize + px(6),
          h: currentSize + px(6),
          radius: (currentSize + px(6)) / 2,
          color: this.getDimColor(stageColor)
        }))

        // Dot
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: dotX - offset,
          y: progressY - offset,
          w: currentSize,
          h: currentSize,
          radius: currentSize / 2,
          color: stageColor
        }))

        // Inner highlight
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: dotX - offset + px(4),
          y: progressY - offset + px(4),
          w: currentSize - px(8),
          h: currentSize - px(8),
          radius: (currentSize - px(8)) / 2,
          color: COLORS.textPrimary
        }))
      } else if (isComplete) {
        // Completed - filled
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: dotX, y: progressY,
          w: dotSize, h: dotSize,
          radius: dotSize / 2,
          color: dotColor
        }))
      } else {
        // Future - hollow
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: dotX, y: progressY,
          w: dotSize, h: dotSize,
          radius: dotSize / 2,
          color: COLORS.bgCardLight
        }))
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: dotX + px(3), y: progressY + px(3),
          w: dotSize - px(6), h: dotSize - px(6),
          radius: (dotSize - px(6)) / 2,
          color: COLORS.bgDark
        }))
      }

      // Connection line to next dot (except last)
      if (i < 6) {
        const lineColor = i < currentStage ? STAGE_COLORS[i - 1] : COLORS.bgCardLight
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: dotX + dotSize + px(3),
          y: progressY + dotSize / 2 - px(1),
          w: dotSpacing - dotSize - px(6),
          h: px(2),
          radius: px(1),
          color: lineColor
        }))
      }
    }
  },

  // Helper: Create dimmer version of color for glow effects
  getDimColor(color) {
    const r = ((color >> 16) & 0xFF) >> 2
    const g = ((color >> 8) & 0xFF) >> 2
    const b = (color & 0xFF) >> 2
    return (r << 16) | (g << 8) | b
  },

  cleanup() {
    widgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    widgets = []
  }
})
