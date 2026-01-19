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
  bgDark: 0x0a0a0f,
  bgCard: 0x1a1a2e,
  bgCardLight: 0x252540,
  bgBar: 0x2a2a3e,
  bgBarDark: 0x15151f,
  textPrimary: 0xFFFFFF,
  textSecondary: 0xBBBBBB,
  textMuted: 0x777777,
  textDark: 0x444444,
  success: 0x4CAF50,
  successDark: 0x2E7D32,
  gold: 0xFFD700,
  goldDark: 0xB8860B
}

const AFFINITY_NAMES = {
  speed: 'Speed',
  power: 'Power',
  endurance: 'Endurance',
  balanced: 'Balanced'
}

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
    // Calculate content height for scrolling
    // Layout: Title(40) + Badge(80-116=36) + gap(24) + StageCard(140-240=100) + gap(20) + AffinityCard(260-340=80) + gap(20) + RequirementsCard(360-540=180) + bottomPadding(80) = 620px
    const contentH = px(620)

    // Background - use Math.max to enable scrolling when content exceeds screen
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: Math.max(H, contentH),
      color: COLORS.bgDark
    }))

    // Title
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: px(40), w: W, h: px(32),
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

    const dominantType = getShapeType(creature.affinities || { speed: 0, power: 0, endurance: 0 })
    const stageColor = AFFINITY_COLORS[dominantType]?.primary || 0x9B59B6

    // Stage badge pill (Y=80, height=36)
    this.createStageBadge(px(80), stageColor)

    // Stage progress section (Y=140, height=100, gap after=20)
    this.createStageProgress(px(140), stageColor)

    // Affinity type card (Y=260, height=80, gap after=20)
    this.createAffinityCard(px(260), dominantType)

    // Requirements section (Y=360, height=180, bottom padding=80)
    this.createRequirementsCard(px(360), stageColor)
  },

  createStageBadge(y, stageColor) {
    const badgeH = px(36)
    const text = STAGE_NAMES[creature.stage]
    const badgeW = Math.min(px(200), W - px(80))

    // Pill background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - badgeW / 2, y: y,
      w: badgeW, h: badgeH,
      radius: badgeH / 2,
      color: COLORS.bgCard
    }))

    // Colored border effect
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - badgeW / 2 + px(2), y: y + px(2),
      w: badgeW - px(4), h: badgeH - px(4),
      radius: (badgeH - px(4)) / 2,
      color: COLORS.bgCardLight
    }))

    // Stage name text
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - badgeW / 2, y: y + px(6),
      w: badgeW, h: px(24),
      text: text,
      text_size: px(18),
      color: stageColor,
      align_h: hmUI.align.CENTER_H
    }))
  },

  createStageProgress(y, stageColor) {
    const cardX = px(24)
    const cardW = W - px(48)
    const cardH = px(100)  // Enlarged from 75px

    // Card background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX, y: y,
      w: cardW, h: cardH,
      radius: px(16),
      color: COLORS.bgCard
    }))

    // Stage dots - enlarged
    const dotSize = px(32)       // Enlarged from 28px
    const smallDotSize = px(20)  // Enlarged from 18px
    const innerY = y + px(22)    // More top padding
    const spacing = (cardW - px(48)) / 5  // More generous spacing

    // Progress line background - thicker
    const lineH = px(8)  // Thicker from 6px
    const lineY = innerY + dotSize / 2 - lineH / 2
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX + px(24) + dotSize / 2,
      y: lineY,
      w: cardW - px(48) - dotSize,
      h: lineH,
      radius: lineH / 2,
      color: COLORS.bgBarDark
    }))

    // Progress line fill
    const progressStages = Math.max(0, creature.stage - 1)
    if (progressStages > 0) {
      const progressW = progressStages * spacing
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: cardX + px(24) + dotSize / 2,
        y: lineY,
        w: Math.min(progressW, cardW - px(48) - dotSize),
        h: lineH,
        radius: lineH / 2,
        color: stageColor
      }))
    }

    // Draw stage dots
    for (let i = 1; i <= 6; i++) {
      const dotX = cardX + px(24) + (i - 1) * spacing
      const isComplete = i < creature.stage
      const isCurrent = i === creature.stage
      const isFuture = i > creature.stage

      const currentDotSize = isCurrent ? dotSize : smallDotSize
      const dotCenterX = dotX + dotSize / 2
      const dotCenterY = innerY + dotSize / 2

      if (isCurrent) {
        // Current stage - large with glow effect
        // Outer glow
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: dotCenterX - dotSize / 2 - px(4),
          y: dotCenterY - dotSize / 2 - px(4),
          w: dotSize + px(8), h: dotSize + px(8),
          radius: (dotSize + px(8)) / 2,
          color: stageColor
        }))
        // Inner bright
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: dotCenterX - dotSize / 2 + px(3),
          y: dotCenterY - dotSize / 2 + px(3),
          w: dotSize - px(6), h: dotSize - px(6),
          radius: (dotSize - px(6)) / 2,
          color: COLORS.textPrimary
        }))
        // Stage number
        widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
          x: dotCenterX - px(12), y: dotCenterY - px(10),
          w: px(24), h: px(20),
          text: `${i}`,
          text_size: px(16),
          color: COLORS.bgDark,
          align_h: hmUI.align.CENTER_H
        }))
      } else if (isComplete) {
        // Completed stages - filled with color
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: dotCenterX - currentDotSize / 2,
          y: dotCenterY - currentDotSize / 2,
          w: currentDotSize, h: currentDotSize,
          radius: currentDotSize / 2,
          color: stageColor
        }))
        // Checkmark
        widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
          x: dotCenterX - px(10), y: dotCenterY - px(8),
          w: px(20), h: px(16),
          text: '✓',
          text_size: px(13),
          color: COLORS.textPrimary,
          align_h: hmUI.align.CENTER_H
        }))
      } else {
        // Future stages - empty ring
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: dotCenterX - currentDotSize / 2,
          y: dotCenterY - currentDotSize / 2,
          w: currentDotSize, h: currentDotSize,
          radius: currentDotSize / 2,
          color: COLORS.bgBarDark
        }))
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: dotCenterX - currentDotSize / 2 + px(3),
          y: dotCenterY - currentDotSize / 2 + px(3),
          w: currentDotSize - px(6), h: currentDotSize - px(6),
          radius: (currentDotSize - px(6)) / 2,
          color: COLORS.bgCard
        }))
      }
    }

    // Stage label - positioned with more breathing room
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX, y: y + cardH - px(24),
      w: cardW, h: px(16),
      text: `Stage ${creature.stage} of 6`,
      text_size: px(12),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
  },

  createAffinityCard(y, dominantType) {
    const cardX = px(24)
    const cardW = W - px(48)
    const cardH = px(80)  // Enlarged from 65px

    const affinityColor = AFFINITY_COLORS[dominantType]?.primary || 0xCCCCCC
    const affinityName = AFFINITY_NAMES[dominantType] || 'Balanced'

    // Card background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX, y: y,
      w: cardW, h: cardH,
      radius: px(16),
      color: COLORS.bgCard
    }))

    // Left color accent
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX, y: y + px(14),
      w: px(5), h: cardH - px(28),
      radius: px(2),
      color: affinityColor
    }))

    // Mini blob - enlarged
    const blobSize = px(50)  // Enlarged from 40px
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX + px(22), y: y + (cardH - blobSize) / 2,
      w: blobSize, h: blobSize,
      radius: blobSize / 2,
      color: affinityColor
    }))

    // Blob highlight - slightly larger
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX + px(30), y: y + (cardH - blobSize) / 2 + px(8),
      w: px(14), h: px(10),
      radius: px(5),
      color: COLORS.textPrimary
    }))

    // Affinity type name - adjusted position
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX + px(84), y: y + px(18),
      w: cardW - px(100), h: px(26),
      text: `${affinityName} Type`,
      text_size: px(20),
      color: affinityColor,
      align_h: hmUI.align.LEFT
    }))

    // Subtitle - adjusted position
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX + px(84), y: y + px(46),
      w: cardW - px(100), h: px(20),
      text: 'Current evolution path',
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.LEFT
    }))
  },

  createRequirementsCard(y, stageColor) {
    const cardX = px(24)
    const cardW = W - px(48)

    if (creature.stage >= 6) {
      // Max evolution achieved - celebration card
      const cardH = px(140)  // Enlarged from 120px
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: cardX, y: y,
        w: cardW, h: cardH,
        radius: px(16),
        color: COLORS.bgCard
      }))

      // Gold accent bar - both sides for celebration
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: cardX, y: y + px(14),
        w: px(5), h: cardH - px(28),
        radius: px(2),
        color: COLORS.gold
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: cardX + cardW - px(5), y: y + px(14),
        w: px(5), h: cardH - px(28),
        radius: px(2),
        color: COLORS.gold
      }))

      // Crown/star icon area
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: cardX, y: y + px(20),
        w: cardW, h: px(28),
        text: '★',
        text_size: px(24),
        color: COLORS.gold,
        align_h: hmUI.align.CENTER_H
      }))

      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: cardX, y: y + px(50),
        w: cardW, h: px(28),
        text: 'Max Evolution!',
        text_size: px(22),
        color: COLORS.gold,
        align_h: hmUI.align.CENTER_H
      }))

      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: cardX, y: y + px(80),
        w: cardW, h: px(22),
        text: 'Transcendent achieved',
        text_size: px(16),
        color: COLORS.textSecondary,
        align_h: hmUI.align.CENTER_H
      }))

      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: cardX, y: y + px(108),
        w: cardW, h: px(20),
        text: `Total XP earned: ${creature.totalXP}`,
        text_size: px(14),
        color: COLORS.textMuted,
        align_h: hmUI.align.CENTER_H
      }))
      return
    }

    const cardH = px(180)  // Enlarged from 160px
    const threshold = EVOLUTION_THRESHOLDS[creature.stage]
    const minDays = MIN_DAYS[creature.stage]
    const xpProgress = Math.min(100, Math.round((creature.currentStageXP / threshold) * 100))
    const daysProgress = Math.min(100, Math.round((creature.daysInStage / minDays) * 100))
    const xpMet = creature.currentStageXP >= threshold
    const daysMet = creature.daysInStage >= minDays
    const canEvolve = xpMet && daysMet

    // Card background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX, y: y,
      w: cardW, h: cardH,
      radius: px(16),
      color: COLORS.bgCard
    }))

    // Left accent
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX, y: y + px(14),
      w: px(5), h: cardH - px(28),
      radius: px(2),
      color: canEvolve ? COLORS.success : stageColor
    }))

    // Next stage header
    const nextStage = STAGE_NAMES[creature.stage + 1]
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX + px(20), y: y + px(18),
      w: cardW - px(40), h: px(24),
      text: `Next: ${nextStage}`,
      text_size: px(17),
      color: COLORS.textSecondary,
      align_h: hmUI.align.LEFT
    }))

    // XP Progress - with more spacing
    const barX = cardX + px(20)
    const barW = cardW - px(40)
    const barH = px(18)  // Taller progress bars (was 16px)

    const xpY = y + px(52)
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: barX, y: xpY,
      w: px(90), h: px(20),
      text: 'Experience',
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.LEFT
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: barX + barW - px(110), y: xpY,
      w: px(110), h: px(20),
      text: `${creature.currentStageXP} / ${threshold}`,
      text_size: px(14),
      color: xpMet ? COLORS.success : COLORS.textSecondary,
      align_h: hmUI.align.RIGHT
    }))

    this.createProgressBar(barX, xpY + px(24), barW, barH, xpProgress, xpMet ? COLORS.success : stageColor)

    // Days Progress - with more vertical spacing
    const daysY = y + px(105)
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: barX, y: daysY,
      w: px(100), h: px(20),
      text: 'Days in stage',
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.LEFT
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: barX + barW - px(90), y: daysY,
      w: px(90), h: px(20),
      text: `${creature.daysInStage} / ${minDays}`,
      text_size: px(14),
      color: daysMet ? COLORS.success : COLORS.textSecondary,
      align_h: hmUI.align.RIGHT
    }))

    this.createProgressBar(barX, daysY + px(24), barW, barH, daysProgress, daysMet ? COLORS.success : stageColor)

    // Status message - more room at bottom
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX, y: y + cardH - px(32),
      w: cardW, h: px(22),
      text: canEvolve ? '✓ Ready to evolve!' : 'Keep training...',
      text_size: px(15),
      color: canEvolve ? COLORS.success : COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
  },

  createProgressBar(x, y, width, height, progress, color) {
    // Background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x, y: y,
      w: width, h: height,
      radius: height / 2,
      color: COLORS.bgBarDark
    }))

    // Fill
    if (progress > 0) {
      const fillWidth = Math.max(height, Math.round(width * Math.min(100, progress) / 100))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x, y: y,
        w: fillWidth, h: height,
        radius: height / 2,
        color: color
      }))
    }

    // Highlight (subtle shine effect)
    if (progress > 5) {
      const fillWidth = Math.max(height, Math.round(width * Math.min(100, progress) / 100))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + px(4), y: y + px(2),
        w: Math.max(px(10), fillWidth - px(8)), h: px(4),
        radius: px(2),
        color: COLORS.textPrimary
      }))
    }
  },

  cleanup() {
    widgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    widgets = []
  }
})
