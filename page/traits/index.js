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
  textLocked: 0x444444,
  success: 0x4CAF50,
  successDark: 0x2E7D32,
  border: 0x333344
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

    // Build ordered trait list
    const traitList = []

    // Active first
    activeTraits.forEach(id => {
      const trait = getTraitById(id)
      if (trait) traitList.push({ ...trait, isActive: true, isUnlocked: true })
    })

    // Unlocked but not active
    allTraits.forEach(trait => {
      if (unlockedSet.has(trait.id) && !activeTraits.includes(trait.id)) {
        traitList.push({ ...trait, isActive: false, isUnlocked: true })
      }
    })

    // Locked
    allTraits.forEach(trait => {
      if (!unlockedSet.has(trait.id)) {
        traitList.push({ ...trait, isActive: false, isUnlocked: false })
      }
    })

    // Calculate content height for scrolling
    const headerH = px(110)
    const itemH = px(72)
    const itemGap = px(10)
    const bottomPadding = px(80)
    const contentH = headerH + (traitList.length * (itemH + itemGap)) + bottomPadding

    // Background (full content height)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: Math.max(H, contentH),
      color: COLORS.bgDark
    }))

    // Header section
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: px(40), w: W, h: px(34),
      text: 'Traits',
      text_size: px(28),
      color: COLORS.textPrimary,
      align_h: hmUI.align.CENTER_H
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: px(78), w: W, h: px(22),
      text: `${unlockedCount} of ${totalCount} unlocked`,
      text_size: px(16),
      color: COLORS.textSecondary,
      align_h: hmUI.align.CENTER_H
    }))

    // Trait items
    let currentY = headerH
    const itemW = W - px(40)
    const itemX = px(20)

    traitList.forEach((trait, index) => {
      this.createTraitCard(trait, itemX, currentY, itemW, itemH)
      currentY += itemH + itemGap
    })
  },

  createTraitCard(trait, x, y, w, h) {
    const rarity = getTraitRarity(trait.id)
    const rarityColor = RARITY_COLORS[rarity]
    const isActive = trait.isActive
    const isUnlocked = trait.isUnlocked

    // Card background color
    let bgColor = COLORS.bgCard
    if (isActive) bgColor = COLORS.bgCardActive
    else if (!isUnlocked) bgColor = COLORS.bgCardLocked

    // Card background (button for tap)
    if (isUnlocked) {
      widgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: x, y: y, w: w, h: h,
        radius: px(14),
        normal_color: bgColor,
        press_color: isActive ? COLORS.successDark : COLORS.border,
        click_func: () => this.onTraitTap(trait.id)
      }))
    } else {
      // Non-clickable for locked
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: x, y: y, w: w, h: h,
        radius: px(14),
        color: bgColor
      }))
    }

    // Rarity color bar (left edge)
    const barW = px(5)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: x, y: y + px(8),
      w: barW, h: h - px(16),
      radius: px(2),
      color: isUnlocked ? rarityColor : COLORS.textLocked
    }))

    // Trait name
    const textX = x + px(18)
    const nameColor = isUnlocked ? COLORS.textPrimary : COLORS.textLocked
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: textX, y: y + px(14),
      w: w - px(70), h: px(24),
      text: trait.name,
      text_size: px(18),
      color: nameColor,
      align_h: hmUI.align.LEFT
    }))

    // Description or unlock requirement
    let subText = trait.description
    let subColor = COLORS.textSecondary
    if (!isUnlocked) {
      subText = `Unlock: ${getUnlockRequirementText(trait)}`
      subColor = COLORS.textMuted
    } else if (isActive) {
      subColor = COLORS.success
    }

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: textX, y: y + px(40),
      w: w - px(70), h: px(20),
      text: subText,
      text_size: px(13),
      color: subColor,
      align_h: hmUI.align.LEFT
    }))

    // Status indicator (right side)
    const indicatorSize = px(24)
    const indicatorX = x + w - px(40)
    const indicatorY = y + (h - indicatorSize) / 2

    if (isActive) {
      // Green filled circle with checkmark
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: indicatorX, y: indicatorY,
        w: indicatorSize, h: indicatorSize,
        radius: indicatorSize / 2,
        color: COLORS.success
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: indicatorX, y: indicatorY + px(2),
        w: indicatorSize, h: indicatorSize,
        text: '✓',
        text_size: px(14),
        color: COLORS.textPrimary,
        align_h: hmUI.align.CENTER_H
      }))
    } else if (isUnlocked) {
      // Empty circle (can be activated)
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: indicatorX, y: indicatorY,
        w: indicatorSize, h: indicatorSize,
        radius: indicatorSize / 2,
        color: COLORS.border
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: indicatorX + px(3), y: indicatorY + px(3),
        w: indicatorSize - px(6), h: indicatorSize - px(6),
        radius: (indicatorSize - px(6)) / 2,
        color: COLORS.bgCard
      }))
    }
    // Locked traits: no indicator
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
