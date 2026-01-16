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
  toggleTrait,
  isTraitActive
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
  bgDark: 0x000000,
  bgLight: 0x2a2a3e,
  bgMedium: 0x1a1a2e,
  bgActive: 0x2d4a3e,
  textPrimary: 0xFFFFFF,
  textSecondary: 0xBBBBBB,
  textMuted: 0x888888,
  textDark: 0x555555,
  success: 0x4CAF50
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
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: H,
      color: COLORS.bgDark
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(50), w: W - px(120), h: px(32),
      text: 'Traits',
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

    const allTraits = getAllTraits()
    const unlockedCount = creature.unlockedTraits?.length || 0
    const totalCount = allTraits.length

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(85), w: W - px(120), h: px(24),
      text: `${unlockedCount}/${totalCount} unlocked`,
      text_size: px(17),
      color: COLORS.textSecondary,
      align_h: hmUI.align.CENTER_H
    }))

    let currentY = px(120)

    if (unlockedCount === 0) {
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(60), y: px(180), w: W - px(120), h: px(28),
        text: 'No traits yet',
        text_size: px(18),
        color: COLORS.textMuted,
        align_h: hmUI.align.CENTER_H
      }))
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(60), y: px(215), w: W - px(120), h: px(50),
        text: 'Feed your blob to unlock traits!',
        text_size: px(15),
        color: COLORS.textDark,
        align_h: hmUI.align.CENTER_H
      }))

      this.createLockedSection(px(280))
    } else {
      // Active traits section
      const activeTraits = creature.activeTraits || []
      if (activeTraits.length > 0) {
        widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(70), y: currentY, w: W - px(140), h: px(24),
          text: 'Active',
          text_size: px(16),
          color: COLORS.success,
          align_h: hmUI.align.LEFT
        }))
        currentY += px(25)

        activeTraits.slice(0, 2).forEach(traitId => {
          const trait = getTraitById(traitId)
          if (trait) {
            currentY = this.createTraitItem(trait, currentY, true)
          }
        })
      }

      // Available (unlocked but not active) section
      const availableTraits = (creature.unlockedTraits || []).filter(
        t => !activeTraits.includes(t)
      )
      if (availableTraits.length > 0 && currentY < px(300)) {
        currentY += px(10)
        widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(70), y: currentY, w: W - px(140), h: px(24),
          text: 'Available',
          text_size: px(16),
          color: COLORS.textSecondary,
          align_h: hmUI.align.LEFT
        }))
        currentY += px(25)

        availableTraits.slice(0, 3).forEach(traitId => {
          const trait = getTraitById(traitId)
          if (trait && currentY < px(360)) {
            currentY = this.createTraitItem(trait, currentY, false)
          }
        })
      }
    }

    this.createPageDots(px(435))
  },

  createTraitItem(trait, y, isActive) {
    const itemH = px(40)
    const itemW = px(280)
    const itemX = CX - itemW / 2
    const rarity = getTraitRarity(trait.id)

    // Background (tappable button)
    widgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
      x: itemX, y: y,
      w: itemW, h: itemH,
      radius: px(8),
      normal_color: isActive ? COLORS.bgActive : COLORS.bgLight,
      press_color: COLORS.bgMedium,
      click_func: () => this.onTraitTap(trait.id)
    }))

    // Rarity indicator bar
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: itemX, y: y,
      w: px(4), h: itemH,
      radius: px(2),
      color: RARITY_COLORS[rarity]
    }))

    // Trait name
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: itemX + px(15), y: y + px(4),
      w: itemW - px(60), h: px(22),
      text: trait.name,
      text_size: px(16),
      color: COLORS.textPrimary,
      align_h: hmUI.align.LEFT
    }))

    // Rarity label
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: itemX + px(15), y: y + px(22),
      w: itemW - px(60), h: px(16),
      text: rarity.charAt(0).toUpperCase() + rarity.slice(1),
      text_size: px(13),
      color: RARITY_COLORS[rarity],
      align_h: hmUI.align.LEFT
    }))

    // Status indicator (checkmark for active)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: itemX + itemW - px(30), y: y + (itemH - px(18)) / 2,
      w: px(18), h: px(18),
      radius: px(9),
      color: isActive ? COLORS.success : COLORS.textDark
    }))

    return y + itemH + px(8)
  },

  onTraitTap(traitId) {
    if (!creature) return

    // Check if trait is unlocked
    if (!creature.unlockedTraits?.includes(traitId)) {
      return // Can't toggle locked traits
    }

    // Toggle the trait
    creature.activeTraits = toggleTrait(traitId, creature, 2)

    // Save to app
    try {
      const app = getApp()
      app.globalData.creature = creature
      if (app.setCreature) app.setCreature(creature)
    } catch (e) {}

    // Rebuild UI to reflect changes
    this.cleanup()
    this.buildUI()
  },

  createLockedSection(startY) {
    const unlockedSet = new Set(creature.unlockedTraits || [])
    const lockedRare = ALL_TRAITS.rare.filter(t => !unlockedSet.has(t.id))

    if (lockedRare.length === 0) return

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(70), y: startY, w: W - px(140), h: px(24),
      text: 'Rare (Locked)',
      text_size: px(16),
      color: COLORS.textDark,
      align_h: hmUI.align.LEFT
    }))

    let y = startY + px(25)
    const itemW = px(280)
    const itemX = CX - itemW / 2

    lockedRare.slice(0, 2).forEach(trait => {
      if (y > px(390)) return

      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: itemX, y: y,
        w: itemW, h: px(36),
        radius: px(6),
        color: COLORS.bgMedium
      }))

      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: itemX + px(12), y: y + px(3),
        w: itemW - px(24), h: px(18),
        text: trait.name,
        text_size: px(15),
        color: COLORS.textDark,
        align_h: hmUI.align.LEFT
      }))

      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: itemX + px(12), y: y + px(19),
        w: itemW - px(24), h: px(16),
        text: getUnlockRequirementText(trait),
        text_size: px(12),
        color: COLORS.textDark,
        align_h: hmUI.align.LEFT
      }))

      y += px(42)
    })
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
        color: i === 3 ? COLORS.textPrimary : COLORS.textDark
      }))
    }
  },

  cleanup() {
    widgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    widgets = []
  }
})
