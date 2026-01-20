import * as hmUI from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { push, back } from '@zos/router'
import { onGesture, offGesture, GESTURE_LEFT, GESTURE_RIGHT } from '@zos/interaction'
import {
  ALL_TRAITS,
  RARITY_COLORS,
  getAllTraits,
  getTraitById,
  getTraitRarity,
  getUnlockRequirementText,
  getTraitProgress,
  toggleTrait
} from '../../lib/traits'

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
  bgCardActive: 0x1a3a2a,
  bgCardLocked: 0x0f0f18,
  textPrimary: 0xFFFFFF,
  textSecondary: 0xBBBBBB,
  textMuted: 0x666666,
  textLocked: 0x555555,
  success: 0x4CAF50,
  successDark: 0x2E7D32,
  border: 0x333344,
  // Glow colors for rarity borders
  glowCommon: 0x6E6E6E,
  glowCommonOuter: 0x3a3a3a,
  glowUncommon: 0x00BFFF,
  glowUncommonOuter: 0x005580,
  glowRare: 0xFFD700,
  glowRareOuter: 0x806B00,
  // Progress bar
  progressBg: 0x222233,
  progressFill: 0x4a4a5a,
  // Section headers
  sectionText: 0x888899,
  sectionLine: 0x2a2a3a
}

// Glow configurations per rarity
const RARITY_GLOW = {
  common: {
    outer: 0x3a3a3a,
    inner: 0x6E6E6E,
    intensity: 1
  },
  uncommon: {
    outer: 0x004466,
    inner: 0x00BFFF,
    intensity: 1.5
  },
  rare: {
    outer: 0x665500,
    inner: 0xFFD700,
    intensity: 2
  }
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
        if (event === GESTURE_LEFT) {
          push({ url: 'page/collection/index' })
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
    const allTraits = getAllTraits()
    const activeTraits = creature?.activeTraits || []
    const unlockedSet = new Set(creature?.unlockedTraits || [])
    const unlockedCount = unlockedSet.size
    const totalCount = allTraits.length

    // Get progress info for all traits
    const traitProgressList = getTraitProgress(creature || { totalXP: 0, currentStreak: 0, longestStreak: 0, unlockedTraits: [], activeTraits: [] })
    const progressMap = {}
    traitProgressList.forEach(tp => {
      progressMap[tp.trait.id] = tp.progress
    })

    // Build organized trait lists by section
    const activeTList = []
    const unlockedTList = []
    const lockedTList = []

    // Active traits
    activeTraits.forEach(id => {
      const trait = getTraitById(id)
      if (trait) activeTList.push({ ...trait, isActive: true, isUnlocked: true, progress: 100 })
    })

    // Unlocked but not active
    allTraits.forEach(trait => {
      if (unlockedSet.has(trait.id) && !activeTraits.includes(trait.id)) {
        unlockedTList.push({ ...trait, isActive: false, isUnlocked: true, progress: 100 })
      }
    })

    // Locked (sorted by progress descending - closest to unlock first)
    allTraits.forEach(trait => {
      if (!unlockedSet.has(trait.id)) {
        lockedTList.push({ ...trait, isActive: false, isUnlocked: false, progress: progressMap[trait.id] || 0 })
      }
    })
    lockedTList.sort((a, b) => b.progress - a.progress)

    // Layout constants
    const headerH = px(110)
    const sectionHeaderH = px(36)
    const itemH = px(80) // Slightly taller to accommodate progress bar
    const itemGap = px(10)
    const sectionGap = px(16)
    const bottomPadding = px(80)

    // Calculate content height
    let totalItems = activeTList.length + unlockedTList.length + lockedTList.length
    let sectionCount = (activeTList.length > 0 ? 1 : 0) + (unlockedTList.length > 0 ? 1 : 0) + (lockedTList.length > 0 ? 1 : 0)
    const contentH = headerH + (sectionCount * (sectionHeaderH + sectionGap)) + (totalItems * (itemH + itemGap)) + bottomPadding

    // Background (full content height)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: Math.max(H, contentH),
      color: COLORS.bgDark
    }))

    // Header section with enhanced styling
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: px(38), w: W, h: px(34),
      text: 'Traits',
      text_size: px(28),
      color: COLORS.textPrimary,
      align_h: hmUI.align.CENTER_H
    }))

    // Unlock count with visual flair
    const unlockText = `✦ ${unlockedCount} / ${totalCount} ✦`
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: px(76), w: W, h: px(22),
      text: unlockText,
      text_size: px(15),
      color: COLORS.textSecondary,
      align_h: hmUI.align.CENTER_H
    }))

    // Start rendering sections
    let currentY = headerH
    const itemW = W - px(40)
    const itemX = px(20)

    // ACTIVE section
    if (activeTList.length > 0) {
      currentY = this.createSectionHeader('EQUIPPED', currentY, activeTList.length)
      activeTList.forEach(trait => {
        this.createTraitCard(trait, itemX, currentY, itemW, itemH)
        currentY += itemH + itemGap
      })
      currentY += sectionGap
    }

    // UNLOCKED section
    if (unlockedTList.length > 0) {
      currentY = this.createSectionHeader('UNLOCKED', currentY, unlockedTList.length)
      unlockedTList.forEach(trait => {
        this.createTraitCard(trait, itemX, currentY, itemW, itemH)
        currentY += itemH + itemGap
      })
      currentY += sectionGap
    }

    // LOCKED section
    if (lockedTList.length > 0) {
      currentY = this.createSectionHeader('LOCKED', currentY, lockedTList.length)
      lockedTList.forEach(trait => {
        this.createTraitCard(trait, itemX, currentY, itemW, itemH)
        currentY += itemH + itemGap
      })
    }
  },

  createSectionHeader(title, y, count) {
    const lineY = y + px(18)
    const lineW = px(60)
    const textW = px(140)
    const centerX = CX

    // Left decorative line
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: centerX - textW / 2 - lineW - px(10),
      y: lineY,
      w: lineW,
      h: px(1),
      color: COLORS.sectionLine
    }))

    // Section title
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: centerX - textW / 2,
      y: y + px(8),
      w: textW,
      h: px(22),
      text: `${title} (${count})`,
      text_size: px(13),
      color: COLORS.sectionText,
      align_h: hmUI.align.CENTER_H
    }))

    // Right decorative line
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: centerX + textW / 2 + px(10),
      y: lineY,
      w: lineW,
      h: px(1),
      color: COLORS.sectionLine
    }))

    return y + px(36)
  },

  createTraitCard(trait, x, y, w, h) {
    const rarity = getTraitRarity(trait.id)
    const rarityColor = RARITY_COLORS[rarity]
    const glowConfig = RARITY_GLOW[rarity]
    const isActive = trait.isActive
    const isUnlocked = trait.isUnlocked
    const progress = trait.progress || 0

    // Card background color
    let bgColor = COLORS.bgCard
    if (isActive) bgColor = COLORS.bgCardActive
    else if (!isUnlocked) bgColor = COLORS.bgCardLocked

    const cardRadius = px(16)
    const glowSize = px(3) // Size of glow effect

    // === GLOW BORDER EFFECT (for unlocked traits) ===
    if (isUnlocked) {
      // Outer glow layer (larger, dimmer)
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x - glowSize,
        y: y - glowSize,
        w: w + glowSize * 2,
        h: h + glowSize * 2,
        radius: cardRadius + glowSize,
        color: glowConfig.outer
      }))

      // Inner glow layer (brighter border)
      if (isActive || rarity === 'rare') {
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: x - px(1),
          y: y - px(1),
          w: w + px(2),
          h: h + px(2),
          radius: cardRadius + px(1),
          color: glowConfig.inner
        }))
      }
    }

    // === CARD BACKGROUND ===
    if (isUnlocked) {
      widgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: x, y: y, w: w, h: h,
        radius: cardRadius,
        normal_color: bgColor,
        press_color: isActive ? COLORS.successDark : COLORS.border,
        click_func: () => this.onTraitTap(trait.id)
      }))
    } else {
      // Non-clickable for locked
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x, y: y, w: w, h: h,
        radius: cardRadius,
        color: bgColor
      }))
    }

    // === RARITY ACCENT BAR (left edge, inside card) ===
    const barW = px(4)
    const barH = h - px(20)
    const barY = y + px(10)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x + px(8),
      y: barY,
      w: barW,
      h: barH,
      radius: px(2),
      color: isUnlocked ? rarityColor : COLORS.textLocked
    }))

    // === TEXT CONTENT ===
    const textX = x + px(22)
    const textW = w - px(75)

    // Trait name
    const nameColor = isUnlocked ? COLORS.textPrimary : COLORS.textLocked
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: textX,
      y: y + px(12),
      w: textW,
      h: px(24),
      text: trait.name,
      text_size: px(17),
      color: nameColor,
      align_h: hmUI.align.LEFT
    }))

    // Description or unlock requirement
    let subText = trait.description
    let subColor = COLORS.textSecondary
    if (!isUnlocked) {
      subText = getUnlockRequirementText(trait)
      subColor = COLORS.textMuted
    } else if (isActive) {
      subColor = COLORS.success
    }

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: textX,
      y: y + px(36),
      w: textW,
      h: px(18),
      text: subText,
      text_size: px(12),
      color: subColor,
      align_h: hmUI.align.LEFT
    }))

    // === PROGRESS BAR (for locked traits) ===
    if (!isUnlocked) {
      const progressBarX = textX
      const progressBarY = y + px(56)
      const progressBarW = w - px(90)
      const progressBarH = px(6)
      const progressFillW = Math.round(progressBarW * (progress / 100))

      // Progress background
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: progressBarX,
        y: progressBarY,
        w: progressBarW,
        h: progressBarH,
        radius: px(3),
        color: COLORS.progressBg
      }))

      // Progress fill
      if (progressFillW > 0) {
        widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: progressBarX,
          y: progressBarY,
          w: progressFillW,
          h: progressBarH,
          radius: px(3),
          color: rarityColor
        }))
      }

      // Progress percentage text
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: progressBarX + progressBarW + px(8),
        y: progressBarY - px(2),
        w: px(40),
        h: px(12),
        text: `${progress}%`,
        text_size: px(10),
        color: COLORS.textMuted,
        align_h: hmUI.align.LEFT
      }))
    }

    // === STATUS INDICATOR (right side) ===
    const indicatorSize = px(26)
    const indicatorX = x + w - px(42)
    const indicatorY = y + (h - indicatorSize) / 2 - (isUnlocked ? 0 : px(8))

    if (isActive) {
      // Glowing green circle with checkmark
      // Outer glow
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: indicatorX - px(3),
        y: indicatorY - px(3),
        w: indicatorSize + px(6),
        h: indicatorSize + px(6),
        radius: (indicatorSize + px(6)) / 2,
        color: COLORS.successDark
      }))
      // Inner circle
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: indicatorX,
        y: indicatorY,
        w: indicatorSize,
        h: indicatorSize,
        radius: indicatorSize / 2,
        color: COLORS.success
      }))
      // Checkmark
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: indicatorX,
        y: indicatorY + px(3),
        w: indicatorSize,
        h: indicatorSize,
        text: '✓',
        text_size: px(14),
        color: COLORS.textPrimary,
        align_h: hmUI.align.CENTER_H
      }))
    } else if (isUnlocked) {
      // Empty circle with subtle border (can be activated)
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: indicatorX,
        y: indicatorY,
        w: indicatorSize,
        h: indicatorSize,
        radius: indicatorSize / 2,
        color: COLORS.border
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: indicatorX + px(3),
        y: indicatorY + px(3),
        w: indicatorSize - px(6),
        h: indicatorSize - px(6),
        radius: (indicatorSize - px(6)) / 2,
        color: bgColor
      }))
    } else {
      // Lock icon for locked traits
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: indicatorX,
        y: indicatorY,
        w: indicatorSize,
        h: indicatorSize,
        text: '🔒',
        text_size: px(16),
        color: COLORS.textLocked,
        align_h: hmUI.align.CENTER_H
      }))
    }
  },

  onTraitTap(traitId) {
    if (!creature) return

    // Toggle the trait
    creature.activeTraits = toggleTrait(traitId, creature, 2)

    // Save to app
    try {
      const app = getApp()
      app.globalData.creature = creature
      if (app.setCreature) app.setCreature(creature)
    } catch (e) {}

    // Rebuild UI
    this.cleanup()
    this.buildUI()
  },

  cleanup() {
    widgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    widgets = []
  }
})
