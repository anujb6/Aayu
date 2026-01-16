import * as hmUI from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { back } from '@zos/router'
import { onGesture, offGesture, GESTURE_RIGHT } from '@zos/interaction'

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
  endurance: 0x9B59B6,
  streak: 0xFF6B35,
  gold: 0xFFD700
}

const STAGE_NAMES = { 1: 'Egg', 2: 'Hatchling', 3: 'Juvenile', 4: 'Mature', 5: 'Apex', 6: 'Transcendent' }

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
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: H,
      color: COLORS.bgDark
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(50), w: W - px(120), h: px(32),
      text: 'Collection',
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

    const isUnlocked = creature.stage >= 6

    if (!isUnlocked) {
      this.buildLockedUI()
    } else {
      this.buildCollectionUI()
    }

    this.createPageDots(px(435))
  },

  buildLockedUI() {
    // Lock icon
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - px(30), y: px(140),
      w: px(60), h: px(60),
      radius: px(30),
      color: COLORS.bgLight
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - px(30), y: px(155),
      w: px(60), h: px(34),
      text: '?',
      text_size: px(32),
      color: COLORS.textDark,
      align_h: hmUI.align.CENTER_H
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(220), w: W - px(120), h: px(28),
      text: 'Locked',
      text_size: px(20),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(255), w: W - px(120), h: px(50),
      text: 'Reach Transcendent to unlock multiple creatures',
      text_size: px(15),
      color: COLORS.textDark,
      align_h: hmUI.align.CENTER_H
    }))

    const stagesRemaining = 6 - creature.stage
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(320), w: W - px(120), h: px(26),
      text: `${stagesRemaining} stage${stagesRemaining !== 1 ? 's' : ''} to go`,
      text_size: px(17),
      color: COLORS.endurance,
      align_h: hmUI.align.CENTER_H
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(355), w: W - px(120), h: px(22),
      text: `Days Fed: ${creature.totalDaysFed}`,
      text_size: px(15),
      color: COLORS.textDark,
      align_h: hmUI.align.CENTER_H
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(382), w: W - px(120), h: px(22),
      text: `Best Streak: ${creature.longestStreak}d`,
      text_size: px(15),
      color: COLORS.textDark,
      align_h: hmUI.align.CENTER_H
    }))
  },

  buildCollectionUI() {
    const cardW = px(280)
    const cardH = px(90)
    const cardX = CX - cardW / 2
    const cardY = px(95)

    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX, y: cardY,
      w: cardW, h: cardH,
      radius: px(12),
      color: 0x2d4a3e
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX, y: cardY,
      w: px(4), h: cardH,
      radius: px(2),
      color: COLORS.gold
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX + px(15), y: cardY + px(10),
      w: cardW - px(30), h: px(28),
      text: creature.name,
      text_size: px(20),
      color: COLORS.textPrimary,
      align_h: hmUI.align.LEFT
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX + px(15), y: cardY + px(38),
      w: cardW - px(30), h: px(22),
      text: STAGE_NAMES[creature.stage],
      text_size: px(16),
      color: COLORS.endurance,
      align_h: hmUI.align.LEFT
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX + px(15), y: cardY + px(62),
      w: cardW - px(30), h: px(20),
      text: `${creature.totalXP} XP | ${creature.currentStreak}d streak`,
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.LEFT
    }))

    // Stats section
    const statsY = px(210)

    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: px(100), y: statsY - px(10),
      w: W - px(200), h: px(1),
      color: COLORS.bgLight
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: statsY, w: W - px(120), h: px(24),
      text: 'Lifetime Stats',
      text_size: px(17),
      color: COLORS.textSecondary,
      align_h: hmUI.align.CENTER_H
    }))

    const stat1Y = statsY + px(35)
    const statW = px(140)

    // Days Fed
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - statW, y: stat1Y,
      w: statW, h: px(30),
      text: `${creature.totalDaysFed}`,
      text_size: px(24),
      color: COLORS.speed,
      align_h: hmUI.align.CENTER_H
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - statW, y: stat1Y + px(30),
      w: statW, h: px(18),
      text: 'days fed',
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))

    // Longest Streak
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX, y: stat1Y,
      w: statW, h: px(30),
      text: `${creature.longestStreak}`,
      text_size: px(24),
      color: COLORS.streak,
      align_h: hmUI.align.CENTER_H
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX, y: stat1Y + px(30),
      w: statW, h: px(18),
      text: 'best streak',
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))

    // Total XP
    const stat2Y = stat1Y + px(65)
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: stat2Y, w: W - px(120), h: px(30),
      text: `${creature.totalXP}`,
      text_size: px(24),
      color: COLORS.endurance,
      align_h: hmUI.align.CENTER_H
    }))
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: stat2Y + px(30), w: W - px(120), h: px(18),
      text: 'total XP earned',
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))

    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(390), w: W - px(120), h: px(20),
      text: 'More creatures coming soon...',
      text_size: px(14),
      color: COLORS.textDark,
      align_h: hmUI.align.CENTER_H
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
        color: i === 4 ? COLORS.textPrimary : COLORS.textDark
      }))
    }
  },

  cleanup() {
    widgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    widgets = []
  }
})
