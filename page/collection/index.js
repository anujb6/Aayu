import * as hmUI from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { push, back } from '@zos/router'
import { onGesture, offGesture, GESTURE_LEFT, GESTURE_RIGHT, GESTURE_UP, GESTURE_DOWN } from '@zos/interaction'
import { getCollection, getLegacyBonus, getReleasedCount } from '../../lib/collection'

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

const AFFINITY_ICONS = {
  speed: '⚡',
  power: '💪',
  endurance: '🛡'
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
let collection = null
let currentIndex = 0

Page({
  onInit() {
    try {
      const app = getApp()
      creature = app?.globalData?.creature || null
    } catch (e) {
      creature = null
    }
    collection = getCollection()
    currentIndex = 0
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
          push({ url: 'page/settings/index' })
          return true
        }
        if (event === GESTURE_RIGHT) {
          back()
          return true
        }
        // Navigation between collection entries
        if (event === GESTURE_UP) {
          this.nextCreature()
          return true
        }
        if (event === GESTURE_DOWN) {
          this.prevCreature()
          return true
        }
        return false
      }
    })
  },

  nextCreature() {
    if (!collection || collection.creatures.length === 0) return
    if (currentIndex < collection.creatures.length - 1) {
      currentIndex++
      this.rebuildUI()
    }
  },

  prevCreature() {
    if (!collection || collection.creatures.length === 0) return
    if (currentIndex > 0) {
      currentIndex--
      this.rebuildUI()
    }
  },

  rebuildUI() {
    this.cleanup()
    this.buildUI()
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
    // Show legacy bonus badge at top
    this.drawLegacyBonusBadge()

    // Check if there are released creatures
    const hasReleasedCreatures = collection && collection.creatures && collection.creatures.length > 0

    if (hasReleasedCreatures) {
      // Show creature card with navigation
      this.drawCreatureCard()
      this.drawNavigation()
    } else {
      // Show current creature info and instructions
      this.drawCurrentCreatureCard()
      this.drawNoReleasedCreatures()
    }
  },

  drawLegacyBonusBadge() {
    const badgeY = px(70)
    const legacyBonus = getLegacyBonus()
    const releasedCount = getReleasedCount()

    // Badge glow
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - px(90),
      y: badgeY - px(4),
      w: px(180),
      h: px(36),
      radius: px(18),
      color: COLORS.goldGlow
    }))

    // Badge background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - px(85),
      y: badgeY,
      w: px(170),
      h: px(28),
      radius: px(14),
      color: COLORS.bgCard
    }))

    // Legacy bonus text
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - px(85),
      y: badgeY + px(5),
      w: px(170),
      h: px(20),
      text: `👑 +${legacyBonus}% Legacy (${releasedCount}/5)`,
      text_size: px(13),
      color: COLORS.gold,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawCurrentCreatureCard() {
    const cardY = px(115)
    const cardW = px(280)
    const cardH = px(95)
    const cardX = CX - cardW / 2

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

    // Gold accent stripe
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX,
      y: cardY,
      w: px(4),
      h: cardH,
      radius: px(2),
      color: COLORS.gold
    }))

    // "Current" label
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX + px(15),
      y: cardY + px(8),
      w: cardW - px(30),
      h: px(16),
      text: 'CURRENT',
      text_size: px(10),
      color: COLORS.textMuted,
      align_h: hmUI.align.LEFT
    }))

    // Creature name
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX + px(15),
      y: cardY + px(26),
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
      y: cardY + px(52),
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
      y: cardY + px(72),
      w: cardW - px(30),
      h: px(18),
      text: `${creature.totalXP} XP | 🔥${creature.currentStreak}`,
      text_size: px(12),
      color: COLORS.textMuted,
      align_h: hmUI.align.LEFT
    }))
  },

  drawNoReleasedCreatures() {
    const textY = px(230)

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: textY, w: W - px(80), h: px(24),
      text: 'No released creatures yet',
      text_size: px(16),
      color: COLORS.textSecondary,
      align_h: hmUI.align.CENTER_H
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(30), y: textY + px(35), w: W - px(60), h: px(60),
      text: 'Tap "Ascend" on home screen\nto release your creature\nand earn legacy bonus XP!',
      text_size: px(13),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawCreatureCard() {
    const entry = collection.creatures[currentIndex]
    if (!entry) return

    const cardY = px(115)
    const cardW = px(300)
    const cardH = px(230)
    const cardX = CX - cardW / 2

    const affinityColor = COLORS[entry.dominantAffinity] || COLORS.endurance
    const affinityIcon = AFFINITY_ICONS[entry.dominantAffinity] || '🛡'

    // Card outer glow (affinity colored)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX - px(6),
      y: cardY - px(6),
      w: cardW + px(12),
      h: cardH + px(12),
      radius: px(16),
      color: COLORS[`${entry.dominantAffinity}Dark`] || COLORS.enduranceDark
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

    // Affinity accent stripe
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX,
      y: cardY,
      w: px(4),
      h: cardH,
      radius: px(2),
      color: affinityColor
    }))

    // Creature number badge
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX + px(15),
      y: cardY + px(10),
      w: cardW - px(30),
      h: px(16),
      text: `#${currentIndex + 1}`,
      text_size: px(11),
      color: COLORS.textMuted,
      align_h: hmUI.align.LEFT
    }))

    // Creature name with affinity icon
    const displayName = entry.name !== 'Unnamed' ? entry.name : `Creature #${currentIndex + 1}`
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX + px(15),
      y: cardY + px(28),
      w: cardW - px(30),
      h: px(28),
      text: `${affinityIcon} ${displayName}`,
      text_size: px(20),
      color: COLORS.textPrimary,
      align_h: hmUI.align.LEFT
    }))

    // Divider line
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX + px(15),
      y: cardY + px(62),
      w: cardW - px(30),
      h: px(1),
      color: COLORS.bgBar
    }))

    // Stats grid
    const statsY = cardY + px(72)
    const statRowH = px(36)

    // Row 1: Total XP and Days to Complete
    this.drawStatRow(cardX + px(15), statsY, '⭐', `${entry.totalXP} XP`, affinityColor)
    this.drawStatRow(cardX + px(155), statsY, '📅', `${entry.daysToComplete}d journey`, COLORS.speed)

    // Row 2: Longest Streak and Days Fed
    this.drawStatRow(cardX + px(15), statsY + statRowH, '🔥', `${entry.longestStreak}d streak`, COLORS.power)
    this.drawStatRow(cardX + px(155), statsY + statRowH, '🍎', `${entry.totalDaysFed} fed`, COLORS.endurance)

    // Divider
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX + px(15),
      y: statsY + statRowH * 2 + px(5),
      w: cardW - px(30),
      h: px(1),
      color: COLORS.bgBar
    }))

    // Affinity bars
    const barsY = statsY + statRowH * 2 + px(15)
    this.drawAffinityBars(cardX + px(15), barsY, cardW - px(30), entry.affinities)

    // Release date at bottom
    const releaseDate = new Date(entry.releasedAt)
    const dateStr = `${releaseDate.getMonth() + 1}/${releaseDate.getDate()}/${releaseDate.getFullYear()}`
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX,
      y: cardY + cardH - px(25),
      w: cardW,
      h: px(16),
      text: `Released: ${dateStr}`,
      text_size: px(11),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawStatRow(x, y, icon, text, color) {
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: x, y: y, w: px(130), h: px(30),
      text: `${icon} ${text}`,
      text_size: px(13),
      color: color,
      align_h: hmUI.align.LEFT
    }))
  },

  drawAffinityBars(x, y, width, affinities) {
    const barH = px(6)
    const barSpacing = px(14)
    const labelW = px(20)
    const barW = width - labelW - px(30)

    const affinityData = [
      { key: 'speed', icon: '⚡', color: COLORS.speed },
      { key: 'power', icon: '💪', color: COLORS.power },
      { key: 'endurance', icon: '🛡', color: COLORS.endurance }
    ]

    affinityData.forEach((aff, index) => {
      const rowY = y + index * barSpacing
      const value = affinities[aff.key] || 0

      // Icon
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: x, y: rowY - px(2), w: labelW, h: px(12),
        text: aff.icon,
        text_size: px(10),
        color: aff.color,
        align_h: hmUI.align.LEFT
      }))

      // Bar background
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x + labelW, y: rowY, w: barW, h: barH,
        radius: barH / 2,
        color: COLORS.bgBar
      }))

      // Bar fill
      const fillW = Math.round(barW * Math.min(100, value) / 100)
      if (fillW > 0) {
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: x + labelW, y: rowY, w: fillW, h: barH,
          radius: barH / 2,
          color: aff.color
        }))
      }

      // Value text
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: x + labelW + barW + px(5), y: rowY - px(3), w: px(25), h: px(12),
        text: `${value}`,
        text_size: px(10),
        color: COLORS.textMuted,
        align_h: hmUI.align.LEFT
      }))
    })
  },

  drawNavigation() {
    if (!collection || collection.creatures.length <= 1) return

    const navY = px(365)
    const total = collection.creatures.length
    const current = currentIndex + 1

    // Page indicator
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - px(30), y: navY, w: px(60), h: px(24),
      text: `${current}/${total}`,
      text_size: px(16),
      color: COLORS.textSecondary,
      align_h: hmUI.align.CENTER_H
    }))

    // Previous arrow (if not at start)
    if (currentIndex > 0) {
      widgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: CX - px(100), y: navY - px(4), w: px(50), h: px(32),
        radius: px(16),
        normal_color: COLORS.bgCard,
        press_color: COLORS.bgCardLight,
        text: '◀',
        text_size: px(16),
        color: COLORS.textSecondary,
        click_func: () => this.prevCreature()
      }))
    }

    // Next arrow (if not at end)
    if (currentIndex < total - 1) {
      widgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: CX + px(50), y: navY - px(4), w: px(50), h: px(32),
        radius: px(16),
        normal_color: COLORS.bgCard,
        press_color: COLORS.bgCardLight,
        text: '▶',
        text_size: px(16),
        color: COLORS.textSecondary,
        click_func: () => this.nextCreature()
      }))
    }

    // Hint text
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: navY + px(30), w: W - px(80), h: px(16),
      text: 'Swipe up/down to browse',
      text_size: px(11),
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
