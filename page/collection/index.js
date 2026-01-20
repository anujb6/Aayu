import * as hmUI from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { back } from '@zos/router'
import { onGesture, offGesture, GESTURE_RIGHT } from '@zos/interaction'

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

// Responsive pixel function - scales from 480px baseline
function px(val) {
  return Math.round(val * W / 480)
}

// ============================================
// RPG COLOR PALETTE
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

  // Affinity Colors
  speed: 0x00BFFF,
  speedDark: 0x005580,

  power: 0xFF6B35,
  powerDark: 0x993F1F,

  endurance: 0x9B59B6,
  enduranceDark: 0x5D356D,
  enduranceGlow: 0x2e1a36,

  // Gold/Achievement
  gold: 0xFFD700,
  goldDark: 0x806B00,
  goldGlow: 0x4d3d00
}

const STAGE_NAMES = {
  1: 'Egg',
  2: 'Hatchling',
  3: 'Juvenile',
  4: 'Mature',
  5: 'Apex',
  6: 'Transcendent'
}

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
    this.drawTitle()

    if (!creature) {
      this.drawNoData()
      this.drawPageDots()
      return
    }

    const isUnlocked = creature.stage >= 6

    if (!isUnlocked) {
      this.drawLockedState()
    } else {
      this.drawUnlockedState()
    }

    this.drawPageDots()
  },

  drawTitle() {
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: px(40), w: W, h: px(24),
      text: 'COLLECTION',
      text_size: px(16),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawNoData() {
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: CX - px(20), w: W - px(80), h: px(40),
      text: 'No creature data',
      text_size: px(18),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
  },

  // ==================== LOCKED STATE ====================

  drawLockedState() {
    this.drawSealedEmblem()
    this.drawLockedText()
    this.drawLockedStatBadges()
  },

  drawSealedEmblem() {
    const emblemY = px(120)
    const emblemSize = px(100)

    // Calculate progress (0-100%)
    const progress = Math.round((creature.stage - 1) / 5 * 100)

    // Outer glow ring
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - emblemSize / 2 - px(12),
      y: emblemY - px(12),
      w: emblemSize + px(24),
      h: emblemSize + px(24),
      radius: (emblemSize + px(24)) / 2,
      color: COLORS.enduranceGlow
    }))

    // Progress ring background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - emblemSize / 2 - px(6),
      y: emblemY - px(6),
      w: emblemSize + px(12),
      h: emblemSize + px(12),
      radius: (emblemSize + px(12)) / 2,
      color: COLORS.bgBar
    }))

    // Progress indicator (gold arc simulated with partial fill)
    if (progress > 0) {
      // Create progress segments
      const segments = 5
      const activeSegments = Math.floor(progress / 20)
      const segmentAngle = 360 / segments

      for (let i = 0; i < activeSegments; i++) {
        const angle = (i * segmentAngle - 90) * Math.PI / 180
        const dotX = CX + Math.cos(angle) * (emblemSize / 2 + px(3))
        const dotY = emblemY + emblemSize / 2 + Math.sin(angle) * (emblemSize / 2 + px(3))

        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: dotX - px(6),
          y: dotY - px(6),
          w: px(12),
          h: px(12),
          radius: px(6),
          color: COLORS.gold
        }))
      }
    }

    // Dark border ring
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - emblemSize / 2 - px(2),
      y: emblemY - px(2),
      w: emblemSize + px(4),
      h: emblemSize + px(4),
      radius: (emblemSize + px(4)) / 2,
      color: COLORS.enduranceDark
    }))

    // Inner sealed circle
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - emblemSize / 2,
      y: emblemY,
      w: emblemSize,
      h: emblemSize,
      radius: emblemSize / 2,
      color: COLORS.bgCard
    }))

    // Lock icon
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - emblemSize / 2,
      y: emblemY + px(22),
      w: emblemSize,
      h: px(40),
      text: '🔒',
      text_size: px(36),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))

    // Progress percentage below emblem
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - px(40),
      y: emblemY + emblemSize + px(18),
      w: px(80),
      h: px(20),
      text: `${progress}%`,
      text_size: px(14),
      color: COLORS.gold,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawLockedText() {
    const textY = px(285)

    // "SEALED" title
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: textY, w: W - px(80), h: px(26),
      text: 'SEALED',
      text_size: px(20),
      color: COLORS.textSecondary,
      align_h: hmUI.align.CENTER_H
    }))

    // Unlock requirement
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: textY + px(30), w: W - px(80), h: px(20),
      text: 'Reach Transcendent to unlock',
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))

    // Stages remaining
    const stagesRemaining = 6 - creature.stage
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: textY + px(55), w: W - px(80), h: px(24),
      text: `${stagesRemaining} stage${stagesRemaining !== 1 ? 's' : ''} to go`,
      text_size: px(16),
      color: COLORS.endurance,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawLockedStatBadges() {
    const badgeY = px(380)
    const badgeW = px(115)
    const badgeH = px(32)
    const gap = px(10)
    const startX = CX - badgeW - gap / 2

    // Days Fed badge
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: startX,
      y: badgeY,
      w: badgeW,
      h: badgeH,
      radius: badgeH / 2,
      color: COLORS.bgCard
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: startX,
      y: badgeY + px(7),
      w: badgeW,
      h: px(20),
      text: `📅 ${creature.totalDaysFed} Fed`,
      text_size: px(13),
      color: COLORS.speed,
      align_h: hmUI.align.CENTER_H
    }))

    // Best Streak badge
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: startX + badgeW + gap,
      y: badgeY,
      w: badgeW,
      h: badgeH,
      radius: badgeH / 2,
      color: COLORS.bgCard
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: startX + badgeW + gap,
      y: badgeY + px(7),
      w: badgeW,
      h: px(20),
      text: `🔥 ${creature.longestStreak}d Best`,
      text_size: px(13),
      color: COLORS.power,
      align_h: hmUI.align.CENTER_H
    }))
  },

  // ==================== UNLOCKED STATE ====================

  drawUnlockedState() {
    this.drawTrophyCard()
    this.drawLifetimeStats()
    this.drawComingSoon()
  },

  drawTrophyCard() {
    const cardY = px(75)
    const cardW = px(280)
    const cardH = px(95)
    const cardX = CX - cardW / 2

    // Crown icon above card
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - px(20),
      y: cardY - px(30),
      w: px(40),
      h: px(28),
      text: '👑',
      text_size: px(22),
      color: COLORS.gold,
      align_h: hmUI.align.CENTER_H
    }))

    // Card outer glow
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX - px(6),
      y: cardY - px(6),
      w: cardW + px(12),
      h: cardH + px(12),
      radius: px(16),
      color: COLORS.goldGlow
    }))

    // Card background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX,
      y: cardY,
      w: cardW,
      h: cardH,
      radius: px(12),
      color: COLORS.bgCard
    }))

    // Gold accent stripe (left edge)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX,
      y: cardY,
      w: px(4),
      h: cardH,
      radius: px(2),
      color: COLORS.gold
    }))

    // Creature name
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX + px(15),
      y: cardY + px(12),
      w: cardW - px(30),
      h: px(26),
      text: creature.name,
      text_size: px(20),
      color: COLORS.textPrimary,
      align_h: hmUI.align.LEFT
    }))

    // Stage badge
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX + px(15),
      y: cardY + px(40),
      w: cardW - px(30),
      h: px(22),
      text: `✨ ${STAGE_NAMES[creature.stage]}`,
      text_size: px(16),
      color: COLORS.gold,
      align_h: hmUI.align.LEFT
    }))

    // Stats line
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX + px(15),
      y: cardY + px(65),
      w: cardW - px(30),
      h: px(20),
      text: `${creature.totalXP} XP | ${creature.currentStreak}d streak`,
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.LEFT
    }))
  },

  drawLifetimeStats() {
    const sectionY = px(195)

    // Section header with decorative lines
    const lineW = px(50)
    const textW = px(140)

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
      text: 'LIFETIME STATS',
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

    // Stat cards row
    const cardY = sectionY + px(30)
    const cardH = px(70)
    const cardGap = px(6)
    const totalWidth = W - px(80)
    const cardW = Math.floor((totalWidth - cardGap * 2) / 3)
    const startX = px(40)

    const stats = [
      { icon: '📅', value: `${creature.totalDaysFed}`, label: 'DAYS', color: COLORS.speed },
      { icon: '🔥', value: `${creature.longestStreak}`, label: 'STREAK', color: COLORS.power },
      { icon: '⭐', value: `${creature.totalXP}`, label: 'XP', color: COLORS.endurance }
    ]

    stats.forEach((stat, index) => {
      const cardX = startX + index * (cardW + cardGap)
      this.drawStatCard(cardX, cardY, cardW, cardH, stat)
    })
  },

  drawStatCard(x, y, w, h, stat) {
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
      color: stat.color
    }))

    // Icon
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: x, y: y + px(12),
      w: w, h: px(18),
      text: stat.icon,
      text_size: px(14),
      color: stat.color,
      align_h: hmUI.align.CENTER_H
    }))

    // Value
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: x, y: y + px(30),
      w: w, h: px(22),
      text: stat.value,
      text_size: px(18),
      color: COLORS.textPrimary,
      align_h: hmUI.align.CENTER_H
    }))

    // Label
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: x, y: y + px(52),
      w: w, h: px(14),
      text: stat.label,
      text_size: px(10),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawComingSoon() {
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: px(390), w: W - px(80), h: px(20),
      text: 'More creatures coming soon...',
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
  },

  // ==================== PAGE DOTS ====================

  drawPageDots() {
    const dotY = px(455)
    const dotSize = px(8)
    const activeDotSize = px(10)
    const dotSpacing = px(18)
    const numDots = 5
    const totalW = (numDots - 1) * dotSpacing + dotSize
    const startX = CX - totalW / 2

    for (let i = 0; i < numDots; i++) {
      const isActive = i === 4 // Collection is page 5 (index 4)
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

  cleanup() {
    widgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    widgets = []
  }
})
