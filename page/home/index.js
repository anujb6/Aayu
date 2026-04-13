import * as hmUI from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { push } from '@zos/router'
import { onGesture, offGesture, GESTURE_LEFT } from '@zos/interaction'
import { Step, Distance, Calorie, Pai, HeartRate, FatBurning } from '@zos/sensor'
import { startAnimation, stopAnimation, stopAllAnimations as stopAllAnimationsFromModule, ANIMATION_CONFIG, easeInOutCubic } from '../../lib/animation'
import { createCompleteBlob, getShapeType, getColorPalette, getDarkerColor } from '../../lib/shapes'
import { checkUnlockConditions } from '../../lib/traits'
import { STAGE_NAMES, EVOLUTION_THRESHOLDS, STAGE_SIZES, canEvolve, evolve, getEvolutionProgress as getEvoProgress, getStreakBonus, checkEvolutionRequirements } from '../../lib/evolution'
import { getDateString, isSameDate, isYesterday, createDefaultCreature } from '../../lib/creature'
import { handleReminderTrigger, wasCreatureFedToday } from '../../lib/reminder'
import { canRelease, releaseCreature, getLegacyBonus, getReleasedCount, getLegacyMultiplier } from '../../lib/collection'

// Get screen dimensions with fallback
let W = 480
let H = 480
try {
  const info = getDeviceInfo()
  W = info.width || 480
  H = info.height || 480
} catch (e) {}

const CX = Math.round(W / 2)
const BLOB_Y = Math.round(H * 0.44) // px(210)

// Inline px function
function px(val) {
  return Math.round(val * W / 480)
}

// RPG Color Palette
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
  textDark: 0x404050,

  // Affinity Colors
  speed: 0x00BFFF,
  speedDark: 0x005580,
  speedGlow: 0x002840,

  power: 0xFF6B35,
  powerDark: 0x993F1F,
  powerGlow: 0x4d1f0f,

  endurance: 0x9B59B6,
  enduranceDark: 0x5D356D,
  enduranceGlow: 0x2e1a36,

  // Status Colors
  success: 0x4CAF50,
  successDark: 0x2E7D32,
  successGlow: 0x1a3d1a,
  warning: 0xFF9800,

  // Accents
  streak: 0xFF6B35,
  gold: 0xFFD700,
  barBg: 0x252530,
  xpParticle: 0x4CAF50,
  celebration: 0xFFD700
}

// Affinity icons
const AFFINITY_ICONS = {
  speed: '⚡',
  power: '💪',
  endurance: '🛡'
}

const BASE_BLOB_SIZE = 100

// PAI threshold to unlock feeding (earned since last feed)
const PAI_FEED_THRESHOLD = 5

// Widget arrays
let staticWidgets = []      // Background, text (never animated)
let blobWidgets = []        // Blob body, eyes (animated)
let effectWidgets = []      // Particles, glows (temporary)
let progressWidgets = []    // XP bar

// State
let creature = null
let pendingLifeForce = 0
let canFeed = false
let todayActivity = { steps: 0, distance: 0, calories: 0, paiToday: 0 }
let isAnimating = false
let blinkTimer = null
let pageDestroyed = false

// Release confirmation state
let showReleaseConfirm = false
let releaseName = ''
let releaseWidgets = []

// Animation state
let currentScale = 1.0
let currentYOffset = 0
let currentXOffset = 0
let currentFrame = 0

Page({
  onInit(params) {
    pageDestroyed = false  // Reset flag on page init
    try {
      const app = getApp()
      creature = app?.globalData?.creature || null
    } catch (e) {
      creature = null
    }

    this.loadTodayActivity()

    // Calculate pending life force (PAI delta since last feed)
    pendingLifeForce = this.calculateLifeForce()
    canFeed = pendingLifeForce >= PAI_FEED_THRESHOLD

    // Handle reminder trigger - show notification if creature not fed today
    if (params && params.indexOf && params.indexOf('reminder=true') !== -1) {
      if (creature && !wasCreatureFedToday(creature)) {
        handleReminderTrigger(creature)
      }
    }
  },

  onShow() {
    // Called every time the page becomes visible (after returning from other pages/workouts)
    // Recalculate feeding availability with fresh sensor data
    const oldCreature = creature
    try {
      const app = getApp()
      // Always try to get fresh creature data
      if (app?.globalData?.creature) {
        creature = app.globalData.creature
      }
    } catch (e) {}

    this.loadTodayActivity()

    const newPendingLifeForce = this.calculateLifeForce()
    const newCanFeed = newPendingLifeForce >= PAI_FEED_THRESHOLD

    // Rebuild if feed state changed OR creature was loaded/changed
    const creatureChanged = oldCreature !== creature || (!oldCreature && creature)
    if (newCanFeed !== canFeed || newPendingLifeForce !== pendingLifeForce || creatureChanged) {
      pendingLifeForce = newPendingLifeForce
      canFeed = newCanFeed
      this.rebuildUI()
      // Restart idle animation after rebuild
      this.startIdleAnimation()
    }
  },

  loadTodayActivity() {
    try {
      const stepSensor = new Step()
      todayActivity.steps = stepSensor.getCurrent() || 0
    } catch (e) {}

    try {
      const distSensor = new Distance()
      todayActivity.distance = distSensor.getCurrent() || 0
    } catch (e) {}

    try {
      const calSensor = new Calorie()
      todayActivity.calories = calSensor.getCurrent() || 0
    } catch (e) {}

    // PAI sensor for XP calculation
    try {
      const paiSensor = new Pai()
      todayActivity.paiToday = paiSensor.getToday() || 0
    } catch (e) {}

    // Heart rate for power calculation
    try {
      const hrSensor = new HeartRate()
      todayActivity.heartRate = hrSensor.getLast() || 0
    } catch (e) {}

    // Fat burn minutes for endurance calculation
    try {
      const fatBurnSensor = new FatBurning()
      todayActivity.fatBurnMinutes = fatBurnSensor.getCurrent() || 0
    } catch (e) {}

  },

  calculateLifeForce() {
    // PAI-delta based XP: Reward new activity since last feed
    // Allows multiple feeds per day if user does multiple workouts
    const currentPai = todayActivity.paiToday || 0

    // Determine baseline PAI (what we've already rewarded)
    let baseline = 0
    if (creature && creature.lastFedAt) {
      try {
        // Use getDateString for consistent local timezone handling
        const lastFedDate = getDateString(creature.lastFedAt)
        const today = getDateString()
        if (lastFedDate === today) {
          // Same day: use lastFedPai as baseline
          baseline = creature.lastFedPai || 0
        }
        // Different day: baseline stays 0 (fresh start)
      } catch (e) {
        baseline = 0
      }
    }

    return Math.max(0, Math.floor(currentPai - baseline))
  },

  build() {
    this.setupGestures()
    this.buildStaticUI()
    this.buildBlob()
    this.startIdleAnimation()
  },

  onDestroy() {
    pageDestroyed = true  // Prevent new timers from being scheduled
    this.stopAllAnimations()
    offGesture()
    this.cleanup()
  },

  setupGestures() {
    onGesture({
      callback: (event) => {
        if (event === GESTURE_LEFT) {
          push({ url: 'page/stats/index' })
          return true
        }
        return false
      }
    })
  },

  // ==================== UI BUILDING ====================

  getDominantAffinity() {
    if (!creature) return 'endurance'
    const { speed, power, endurance } = creature.affinities || { speed: 0, power: 0, endurance: 0 }
    if (speed >= power && speed >= endurance) return 'speed'
    if (power >= speed && power >= endurance) return 'power'
    return 'endurance'
  },

  buildStaticUI() {
    // Defensive: ensure array is empty before building
    if (staticWidgets.length > 0) {
      staticWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
      staticWidgets = []
    }

    const dominant = this.getDominantAffinity()

    // Background
    staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: H,
      color: COLORS.bgDark
    }))

    if (!creature) {
      staticWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0, y: CX - px(20), w: W, h: px(40),
        text: 'Loading...',
        text_size: px(24),
        color: COLORS.textPrimary,
        align_h: hmUI.align.CENTER_H
      }))
      return
    }

    // ===== TOP SECTION =====
    this.drawNameBanner()
    this.drawStageBadge(dominant)

    // ===== MIDDLE SECTION - Pedestal (drawn before blob) =====
    this.drawPedestal(dominant)

    // ===== BOTTOM SECTION =====
    this.drawMoodDisplay()
    this.drawProgressBar(dominant)
    this.drawFeedSection(dominant)
    this.drawPageDots()
  },

  drawNameBanner() {
    const bannerY = px(50)
    const bannerW = px(200)
    const bannerH = px(38)

    // Banner background
    staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - bannerW / 2,
      y: bannerY,
      w: bannerW,
      h: bannerH,
      radius: bannerH / 2,
      color: COLORS.bgCard
    }))

    // Left accent line
    staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - bannerW / 2 - px(30),
      y: bannerY + bannerH / 2 - px(1),
      w: px(25),
      h: px(2),
      color: COLORS.bgCardLight
    }))

    // Right accent line
    staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX + bannerW / 2 + px(5),
      y: bannerY + bannerH / 2 - px(1),
      w: px(25),
      h: px(2),
      color: COLORS.bgCardLight
    }))

    // Name text
    staticWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - bannerW / 2,
      y: bannerY + px(7),
      w: bannerW,
      h: px(26),
      text: creature.name || 'Aayu',
      text_size: px(22),
      color: COLORS.textPrimary,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawStageBadge(dominant) {
    const badgeY = px(95)
    const stageName = STAGE_NAMES[creature.stage] || 'Unknown'
    const icon = AFFINITY_ICONS[dominant]
    const color = COLORS[dominant]
    const darkColor = COLORS[`${dominant}Dark`]
    const glowColor = COLORS[`${dominant}Glow`]

    // Calculate badge width based on content
    const hasStreak = creature.currentStreak > 0
    const badgeW = hasStreak ? px(160) : px(130)
    const badgeH = px(28)

    // Outer glow
    staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - badgeW / 2 - px(4),
      y: badgeY - px(4),
      w: badgeW + px(8),
      h: badgeH + px(8),
      radius: (badgeH + px(8)) / 2,
      color: glowColor
    }))

    // Badge border
    staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - badgeW / 2 - px(2),
      y: badgeY - px(2),
      w: badgeW + px(4),
      h: badgeH + px(4),
      radius: (badgeH + px(4)) / 2,
      color: darkColor
    }))

    // Badge background
    staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - badgeW / 2,
      y: badgeY,
      w: badgeW,
      h: badgeH,
      radius: badgeH / 2,
      color: COLORS.bgCard
    }))

    // Badge text
    const badgeText = hasStreak ? `${icon} ${stageName} | 🔥${creature.currentStreak}` : `${icon} ${stageName}`
    staticWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - badgeW / 2,
      y: badgeY + px(5),
      w: badgeW,
      h: px(20),
      text: badgeText,
      text_size: px(13),
      color: color,
      align_h: hmUI.align.CENTER_H
    }))

    // Draw legacy badge if there are released creatures
    this.drawLegacyBadge()
  },

  drawLegacyBadge() {
    const releasedCount = getReleasedCount()
    if (releasedCount <= 0) return

    const badgeX = W - px(70)
    const badgeY = px(50)
    const badgeW = px(55)
    const badgeH = px(26)

    // Badge glow
    staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: badgeX - px(3),
      y: badgeY - px(3),
      w: badgeW + px(6),
      h: badgeH + px(6),
      radius: (badgeH + px(6)) / 2,
      color: 0x4d3d00 // goldGlow
    }))

    // Badge background
    staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: badgeX,
      y: badgeY,
      w: badgeW,
      h: badgeH,
      radius: badgeH / 2,
      color: COLORS.bgCard
    }))

    // Crown with count
    staticWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: badgeX,
      y: badgeY + px(4),
      w: badgeW,
      h: px(18),
      text: `👑x${releasedCount}`,
      text_size: px(12),
      color: COLORS.gold,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawPedestal(dominant) {
    const pedestalY = BLOB_Y + px(45)
    const blobSize = px(BASE_BLOB_SIZE) * (STAGE_SIZES[creature.stage] || 1.0)
    const pedestalW = blobSize * 0.8
    const pedestalH = px(20)

    const color = COLORS[dominant]
    const darkColor = COLORS[`${dominant}Dark`]
    const glowColor = COLORS[`${dominant}Glow`]

    // Outer glow ellipse (largest)
    staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - pedestalW / 2 - px(15),
      y: pedestalY - px(5),
      w: pedestalW + px(30),
      h: pedestalH + px(10),
      radius: (pedestalH + px(10)) / 2,
      color: glowColor
    }))

    // Middle ring
    staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - pedestalW / 2 - px(8),
      y: pedestalY,
      w: pedestalW + px(16),
      h: pedestalH,
      radius: pedestalH / 2,
      color: darkColor
    }))

    // Inner platform
    staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - pedestalW / 2,
      y: pedestalY + px(3),
      w: pedestalW,
      h: pedestalH - px(6),
      radius: (pedestalH - px(6)) / 2,
      color: COLORS.bgCard
    }))

    // Highlight line on top of pedestal
    staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - pedestalW / 4,
      y: pedestalY + px(4),
      w: pedestalW / 2,
      h: px(2),
      radius: px(1),
      color: color
    }))
  },

  drawMoodDisplay() {
    const moodY = px(310)
    const moodIcon = creature.mood >= 70 ? '😊' : creature.mood >= 40 ? '😐' : '💔'
    const moodText = creature.mood >= 70 ? 'Happy!' : creature.mood >= 40 ? 'Content' : 'Needs love'
    const moodColor = creature.mood >= 70 ? COLORS.success : creature.mood >= 40 ? COLORS.textSecondary : COLORS.warning

    // Mood glow for happy mood
    if (creature.mood >= 70) {
      staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: CX - px(60),
        y: moodY - px(2),
        w: px(120),
        h: px(28),
        radius: px(14),
        color: COLORS.successGlow
      }))
    }

    // Mood text with icon
    staticWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: moodY, w: W - px(120), h: px(24),
      text: `${moodIcon} ${moodText}`,
      text_size: px(18),
      color: moodColor,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawProgressBar(dominant) {
    const evoProgress = this.getEvolutionProgress()
    const barY = px(345)
    const barW = px(260)
    const barH = px(14)
    const barX = CX - barW / 2
    const color = COLORS[dominant]
    const darkColor = COLORS[`${dominant}Dark`]

    // Left end cap (diamond shape simulated with small rect)
    staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: barX - px(8),
      y: barY + barH / 2 - px(4),
      w: px(8),
      h: px(8),
      radius: px(2),
      color: darkColor
    }))

    // Right end cap
    staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: barX + barW,
      y: barY + barH / 2 - px(4),
      w: px(8),
      h: px(8),
      radius: px(2),
      color: darkColor
    }))

    // Bar background
    progressWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: barX, y: barY, w: barW, h: barH,
      radius: barH / 2,
      color: COLORS.barBg
    }))

    // Bar fill
    const fillWidth = Math.max(0, Math.round((barW - px(4)) * Math.min(100, evoProgress) / 100))
    if (fillWidth > 0) {
      progressWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: barX + px(2),
        y: barY + px(2),
        w: fillWidth,
        h: barH - px(4),
        radius: (barH - px(4)) / 2,
        color: color
      }))

      // Shimmer highlight on fill
      progressWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: barX + px(4),
        y: barY + px(3),
        w: Math.max(0, fillWidth - px(4)),
        h: px(2),
        radius: px(1),
        color: COLORS.textPrimary
      }))
    }

    // XP text
    const threshold = EVOLUTION_THRESHOLDS[creature.stage]
    const xpText = creature.stage >= 6 ? '✨ MAX LEVEL' : `${creature.currentStageXP}/${threshold} XP`
    staticWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: barY + px(20), w: W - px(120), h: px(20),
      text: xpText,
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))
  },

  drawFeedSection(dominant) {
    const feedY = px(395)

    // Check if creature is at Transcendent stage (can be released)
    const canBeReleased = canRelease(creature)

    if (canFeed) {
      // Feed button with glow - enough PAI earned since last feed
      const btnW = px(160)
      const btnH = px(44)
      const btnX = CX - btnW / 2
      const color = COLORS[dominant]
      const glowColor = COLORS[`${dominant}Glow`]

      // Button glow
      staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: btnX - px(6),
        y: feedY - px(6),
        w: btnW + px(12),
        h: btnH + px(12),
        radius: (btnH + px(12)) / 2,
        color: glowColor
      }))

      // Button border glow
      staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: btnX - px(2),
        y: feedY - px(2),
        w: btnW + px(4),
        h: btnH + px(4),
        radius: (btnH + px(4)) / 2,
        color: color
      }))

      // Button - cap display value to prevent text overflow
      const displayValue = pendingLifeForce > 99 ? '99+' : pendingLifeForce
      staticWidgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: btnX, y: feedY, w: btnW, h: btnH,
        radius: btnH / 2,
        normal_color: COLORS.success,
        press_color: COLORS.successDark,
        text: `Feed +${displayValue}`,
        text_size: px(18),
        color: COLORS.textPrimary,
        click_func: () => this.onFeed()
      }))
    } else if (canBeReleased) {
      // Show release button for Transcendent creatures
      const btnW = px(180)
      const btnH = px(44)
      const btnX = CX - btnW / 2

      // Gold glow for release button
      staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: btnX - px(6),
        y: feedY - px(6),
        w: btnW + px(12),
        h: btnH + px(12),
        radius: (btnH + px(12)) / 2,
        color: 0x4d3d00 // goldGlow
      }))

      // Gold border
      staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: btnX - px(2),
        y: feedY - px(2),
        w: btnW + px(4),
        h: btnH + px(4),
        radius: (btnH + px(4)) / 2,
        color: COLORS.gold
      }))

      // Release button
      staticWidgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: btnX, y: feedY, w: btnW, h: btnH,
        radius: btnH / 2,
        normal_color: 0x806B00, // goldDark
        press_color: 0x4d3d00,  // goldGlow
        text: '✨ Ascend',
        text_size: px(18),
        color: COLORS.textPrimary,
        click_func: () => this.onRelease()
      }))
    } else if (pendingLifeForce > 0) {
      // Partial progress - show how much more PAI needed
      const remaining = PAI_FEED_THRESHOLD - pendingLifeForce
      staticWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(60), y: feedY, w: W - px(120), h: px(32),
        text: `${remaining} more PAI to feed`,
        text_size: px(16),
        color: COLORS.textMuted,
        align_h: hmUI.align.CENTER_H
      }))
    } else {
      // No activity yet
      staticWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(60), y: feedY, w: W - px(120), h: px(32),
        text: 'Get active to feed!',
        text_size: px(16),
        color: COLORS.textMuted,
        align_h: hmUI.align.CENTER_H
      }))
    }
  },

  drawPageDots() {
    const dotY = px(455)
    const dotSize = px(8)
    const activeDotSize = px(10)
    const dotSpacing = px(18)
    const numDots = 5
    const totalW = (numDots - 1) * dotSpacing + dotSize
    const startX = CX - totalW / 2

    for (let i = 0; i < numDots; i++) {
      const isActive = i === 0 // Home is page 1 (index 0)
      const size = isActive ? activeDotSize : dotSize
      const offset = isActive ? (activeDotSize - dotSize) / 2 : 0

      if (isActive) {
        // Glow for active dot
        staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: startX + i * dotSpacing - offset - px(2),
          y: dotY - offset - px(2),
          w: size + px(4),
          h: size + px(4),
          radius: (size + px(4)) / 2,
          color: COLORS.bgCardLight
        }))
      }

      staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: startX + i * dotSpacing - offset,
        y: dotY - offset,
        w: size,
        h: size,
        radius: size / 2,
        color: isActive ? COLORS.textPrimary : COLORS.textMuted
      }))
    }
  },

  buildBlob(scale = 1.0, yOffset = 0, xOffset = 0, frame = 0) {
    // Clear existing blob widgets
    blobWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    blobWidgets = []

    if (!creature) return

    const baseSize = px(BASE_BLOB_SIZE)
    const blobX = CX + xOffset
    const blobY = BLOB_Y + yOffset
    const currentSize = Math.round(baseSize * scale)

    // Electron-like orbiting particles with TRUE 3D z-ordering
    // Particles go BEHIND creature on back half of orbit, IN FRONT on front half
    const particleCount = creature.stage >= 1 ? Math.min(4, creature.stage) : 0
    const time = Date.now()
    const centerX = CX
    const centerY = BLOB_Y
    const orbitRadius = baseSize * 0.7

    // Collect particles that go BEHIND the creature (back of orbit: angles 0-180)
    const backParticles = []
    // Collect particles that go IN FRONT (front of orbit: angles 180-360)
    const frontParticles = []

    for (let i = 0; i < particleCount; i++) {
      const orbitSpeed = 1.5 + i * 0.3
      const orbitTilt = 0.6 + i * 0.1  // More elliptical (taller orbit)
      const angleOffset = i * (360 / particleCount)
      const angle = ((time * orbitSpeed * 0.36) + angleOffset) % 360
      const radians = angle * Math.PI / 180

      const particleX = centerX + Math.cos(radians) * orbitRadius
      const particleY = centerY + Math.sin(radians) * orbitRadius * orbitTilt
      const particleSize = px(5)
      const particleColor = 0x4ECDC4

      // Determine if particle is on back (0-180) or front (180-360) of orbit
      const isBack = angle >= 0 && angle < 180
      const targetArray = isBack ? backParticles : frontParticles

      // Main particle
      targetArray.push({ x: particleX, y: particleY, size: particleSize, color: particleColor })

      // Trail particles
      for (let t = 1; t <= 2; t++) {
        const trailAngle = ((time * orbitSpeed * 0.36) + angleOffset - t * 15) % 360
        const trailRad = trailAngle * Math.PI / 180
        const trailX = centerX + Math.cos(trailRad) * orbitRadius
        const trailY = centerY + Math.sin(trailRad) * orbitRadius * orbitTilt
        const trailSize = px(5 - t * 1.5)
        const trailColor = t === 1 ? 0x3BA89F : 0x2A7A72

        const trailIsBack = trailAngle >= 0 && trailAngle < 180
        const trailTarget = trailIsBack ? backParticles : frontParticles
        trailTarget.push({ x: trailX, y: trailY, size: trailSize, color: trailColor })
      }
    }

    // Draw BACK particles first (behind creature)
    for (const p of backParticles) {
      blobWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: p.x - p.size / 2, y: p.y - p.size / 2,
        w: p.size, h: p.size, radius: p.size / 2, color: p.color
      }))
    }

    // Draw creature in the middle
    blobWidgets.push(...createCompleteBlob(creature, blobX, blobY, currentSize, px, frame))

    // Draw FRONT particles last (in front of creature)
    for (const p of frontParticles) {
      blobWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: p.x - p.size / 2, y: p.y - p.size / 2,
        w: p.size, h: p.size, radius: p.size / 2, color: p.color
      }))
    }

    // Egg cracks for stage 1 - spider web pattern radiating from impact point
    if (creature.stage === 1) {
      const threshold = 50  // XP needed to evolve from egg
      const progress = Math.min(100, Math.round((creature.currentStageXP / threshold) * 100))
      const crackColor = 0x2a2a35  // Subtle dark crack color
      const lineW = px(2)  // Thin crack lines

      // Impact point near top-right of egg
      const impactX = blobX + px(8)
      const impactY = blobY - currentSize * 0.2

      if (progress >= 20) {
        // Stage 1: Initial hairline crack - small star from impact
        // Center dot
        blobWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: impactX - px(2), y: impactY - px(2),
          w: px(4), h: px(4), radius: px(2), color: crackColor
        }))
        // Line going up-right
        blobWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: impactX, y: impactY - px(8),
          w: lineW, h: px(8), radius: px(1), color: crackColor
        }))
        // Line going down-right
        blobWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: impactX + px(2), y: impactY,
          w: px(6), h: lineW, radius: px(1), color: crackColor
        }))
      }

      if (progress >= 40) {
        // Stage 2: Cracks spread - more branches
        // Branch going down-left from impact
        blobWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: impactX - px(10), y: impactY + px(2),
          w: px(12), h: lineW, radius: px(1), color: crackColor
        }))
        // Small branch off that line
        blobWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: impactX - px(6), y: impactY + px(2),
          w: lineW, h: px(6), radius: px(1), color: crackColor
        }))
      }

      if (progress >= 60) {
        // Stage 3: More spreading - secondary impact area
        // New crack cluster on left side
        blobWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: blobX - px(12), y: blobY - px(5),
          w: px(8), h: lineW, radius: px(1), color: crackColor
        }))
        blobWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: blobX - px(8), y: blobY - px(5),
          w: lineW, h: px(10), radius: px(1), color: crackColor
        }))
        // Connect to main crack
        blobWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: blobX - px(5), y: impactY + px(4),
          w: px(13), h: lineW, radius: px(1), color: crackColor
        }))
      }

      if (progress >= 80) {
        // Stage 4: About to hatch - major fracture with light
        // Large crack at top
        blobWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: impactX - px(4), y: impactY - px(12),
          w: lineW, h: px(6), radius: px(1), color: crackColor
        }))
        blobWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: impactX - px(8), y: impactY - px(10),
          w: px(10), h: lineW, radius: px(1), color: crackColor
        }))
        // Glow/light peeking through at impact point
        blobWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: impactX - px(3), y: impactY - px(3),
          w: px(6), h: px(6), radius: px(3), color: 0xFFF8DC  // Warm light
        }))
      }
    }
  },

  // ==================== ANIMATIONS ====================

  startIdleAnimation() {
    if (!creature || isAnimating) return

    // Breathing + bobbing animation
    const breathCycle = 20 // 20 frames at 10fps = 2 seconds
    startAnimation('idle', {
      totalFrames: breathCycle,
      interval: ANIMATION_CONFIG.IDLE_INTERVAL,
      loop: true,
      onFrame: (frame, total) => {
        const progress = frame / total

        // Track frame globally for trait animations
        currentFrame = frame

        // Breathing: scale 0.97 to 1.03
        const breathPhase = Math.sin(progress * Math.PI * 2)
        currentScale = 1 + breathPhase * 0.03

        // Bobbing: vertical -3 to +3 px (double frequency)
        const bobPhase = Math.sin(progress * Math.PI * 4)
        currentYOffset = Math.round(bobPhase * 3)

        this.buildBlob(currentScale, currentYOffset, currentXOffset, currentFrame)
      }
    })

    // Eye blink timer
    this.scheduleNextBlink()
  },

  scheduleNextBlink() {
    // Don't schedule if page is being destroyed
    if (pageDestroyed) return

    const delay = 3000 + Math.random() * 2000 // 3-5 seconds
    blinkTimer = setTimeout(() => {
      // Double-check page isn't destroyed before executing
      if (pageDestroyed) return

      if (!isAnimating && creature) {
        this.triggerBlink()
      }
      this.scheduleNextBlink()
    }, delay)
  },

  triggerBlink() {
    // Quick eye close/open by rebuilding blob with modified mood
    const originalMood = creature.mood
    creature.mood = 0 // Triggers "sad" eyes (smaller)
    this.buildBlob(currentScale, currentYOffset, currentXOffset, currentFrame)

    setTimeout(() => {
      creature.mood = originalMood
      this.buildBlob(currentScale, currentYOffset, currentXOffset, currentFrame)
    }, 150)
  },

  stopIdleAnimation() {
    stopAnimation('idle')
    if (blinkTimer) {
      clearTimeout(blinkTimer)
      blinkTimer = null
    }
  },

  stopAllAnimations() {
    stopAllAnimationsFromModule()
    if (blinkTimer) {
      clearTimeout(blinkTimer)
      blinkTimer = null
    }
    isAnimating = false
  },

  // ==================== FEED ANIMATION ====================

  startFeedAnimation(onComplete) {
    isAnimating = true
    this.stopIdleAnimation()

    const particleCount = 8
    const particles = []
    const baseSize = px(BASE_BLOB_SIZE) * (STAGE_SIZES[creature.stage] || 1.0)

    // Generate particle positions in a circle
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const distance = baseSize * 0.8
      particles.push({
        startX: CX + Math.cos(angle) * distance,
        startY: BLOB_Y + Math.sin(angle) * distance,
        angle: angle
      })
    }

    const totalFrames = 23 // ~1.5s at 15fps
    startAnimation('feed', {
      totalFrames: totalFrames,
      interval: ANIMATION_CONFIG.FEED_INTERVAL,
      loop: false,
      onFrame: (frame, total) => {
        const progress = frame / total

        // Clear effect widgets
        effectWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
        effectWidgets = []

        if (progress < 0.33) {
          // Phase 1: Generate - particles appear
          const phaseProgress = progress / 0.33
          const particleSize = Math.round(px(10) * phaseProgress)

          particles.forEach(p => {
            effectWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
              x: p.startX - particleSize / 2,
              y: p.startY - particleSize / 2,
              w: particleSize,
              h: particleSize,
              radius: particleSize / 2,
              color: COLORS.xpParticle
            }))
          })
        } else if (progress < 0.67) {
          // Phase 2: Absorb - particles move to center
          const phaseProgress = (progress - 0.33) / 0.34
          const particleSize = px(10)

          particles.forEach(p => {
            const currentX = p.startX + (CX - p.startX) * easeInOutCubic(phaseProgress)
            const currentY = p.startY + (BLOB_Y - p.startY) * easeInOutCubic(phaseProgress)
            const shrinkSize = Math.round(particleSize * (1 - phaseProgress * 0.5))

            if (shrinkSize > 0) {
              effectWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
                x: currentX - shrinkSize / 2,
                y: currentY - shrinkSize / 2,
                w: shrinkSize,
                h: shrinkSize,
                radius: shrinkSize / 2,
                color: COLORS.xpParticle
              }))
            }
          })
        } else {
          // Phase 3: Satisfy - blob pulses
          const phaseProgress = (progress - 0.67) / 0.33
          const pulseScale = 1 + Math.sin(phaseProgress * Math.PI * 2) * 0.08
          this.buildBlob(pulseScale, 0, 0)
        }
      },
      onComplete: () => {
        effectWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
        effectWidgets = []
        this.buildBlob(1.0, 0, 0)
        isAnimating = false
        if (onComplete) onComplete()
      }
    })
  },

  // ==================== EVOLUTION ANIMATION ====================

  startEvolutionAnimation(oldStage, newStage, onComplete) {
    isAnimating = true
    this.stopIdleAnimation()

    const oldSize = px(BASE_BLOB_SIZE) * (STAGE_SIZES[oldStage] || 1.0)
    const newSize = px(BASE_BLOB_SIZE) * (STAGE_SIZES[newStage] || 1.0)
    const color = this.getCreatureColor()

    const totalFrames = 38 // ~2.5s at 15fps
    startAnimation('evolution', {
      totalFrames: totalFrames,
      interval: ANIMATION_CONFIG.EVOLUTION_INTERVAL,
      loop: false,
      onFrame: (frame, total) => {
        const progress = frame / total

        effectWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
        effectWidgets = []

        if (progress < 0.2) {
          // Phase 1: GLOW - expanding rings
          const phaseProgress = progress / 0.2

          for (let i = 0; i < 3; i++) {
            const ringProgress = (phaseProgress + i * 0.15) % 1
            const ringSize = oldSize + px(50) * ringProgress
            const ringColor = getDarkerColor(color, 0.6 - ringProgress * 0.4)

            effectWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
              x: CX - ringSize / 2,
              y: BLOB_Y - ringSize / 2,
              w: ringSize,
              h: ringSize,
              radius: ringSize / 2,
              color: ringColor
            }))
          }
          this.buildBlob(1.0, 0, 0)

        } else if (progress < 0.4) {
          // Phase 2: SHAKE - rapid oscillation
          const phaseProgress = (progress - 0.2) / 0.2
          const shakeOffset = Math.round(Math.sin(phaseProgress * Math.PI * 16) * px(5))
          this.buildBlob(1.0, 0, shakeOffset)

        } else if (progress < 0.8) {
          // Phase 3: TRANSFORM - size morph with flash
          const phaseProgress = (progress - 0.4) / 0.4
          const eased = easeInOutCubic(phaseProgress)
          const currentSizeRatio = (oldSize + (newSize - oldSize) * eased) / oldSize

          // White flash at midpoint
          if (phaseProgress > 0.45 && phaseProgress < 0.55) {
            blobWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
            blobWidgets = []

            const flashSize = oldSize * currentSizeRatio
            blobWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
              x: CX - flashSize / 2,
              y: BLOB_Y - flashSize / 2,
              w: flashSize,
              h: flashSize,
              radius: flashSize / 2,
              color: 0xFFFFFF
            }))
          } else {
            this.buildBlob(currentSizeRatio, 0, 0)
          }

        } else {
          // Phase 4: REVEAL - celebration particles
          const phaseProgress = (progress - 0.8) / 0.2
          this.buildBlob(1.0, 0, 0)

          const celebrationCount = 12
          for (let i = 0; i < celebrationCount; i++) {
            const angle = (i / celebrationCount) * Math.PI * 2
            const distance = newSize * 0.6 + px(40) * phaseProgress
            const particleX = CX + Math.cos(angle) * distance
            const particleY = BLOB_Y + Math.sin(angle) * distance
            const particleSize = Math.round(px(8) * (1 - phaseProgress * 0.7))

            if (particleSize > 0) {
              effectWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
                x: particleX - particleSize / 2,
                y: particleY - particleSize / 2,
                w: particleSize,
                h: particleSize,
                radius: particleSize / 2,
                color: COLORS.celebration
              }))
            }
          }
        }
      },
      onComplete: () => {
        effectWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
        effectWidgets = []
        this.buildBlob(1.0, 0, 0)
        isAnimating = false
        if (onComplete) onComplete()
      }
    })
  },

  // ==================== HELPERS ====================

  getEvolutionProgress() {
    if (!creature) return 100
    return getEvoProgress(creature)
  },

  getCreatureColor() {
    if (!creature) return COLORS.endurance
    const palette = getColorPalette(creature.affinities)
    return palette.primary
  },

  // ==================== FEED LOGIC ====================

  onFeed() {
    if (!canFeed || !creature || isAnimating) return

    // Check if will evolve after adding XP
    const streakMultiplier = getStreakBonus(creature.currentStreak)
    // Start feed animation
    this.startFeedAnimation(() => {
      // Apply feed changes and get evolution result
      const result = this.applyFeedChanges()

      if (result.evolved) {
        // Play evolution animation with correct old/new stages
        this.startEvolutionAnimation(result.oldStage, result.newStage, () => {
          this.rebuildUI()
          this.startIdleAnimation()
        })
      } else {
        this.rebuildUI()
        this.startIdleAnimation()
      }
    })
  },

  applyFeedChanges() {
    const result = { evolved: false, oldStage: 0, newStage: 0 }
    try {
      const app = getApp()
      const today = getDateString()
      const isNewDay = !isSameDate(creature.lastFedDate, today)

      // Capture old stage BEFORE any changes
      result.oldStage = creature.stage

      // XP always stacks (multiple feeds per day add XP)
      // Apply legacy bonus first, then streak bonus
      const legacyMultiplier = getLegacyMultiplier()
      const xpWithLegacy = Math.round(pendingLifeForce * legacyMultiplier)
      const streakMultiplier = getStreakBonus(creature.currentStreak)
      const xpWithBonus = Math.round(xpWithLegacy * streakMultiplier)
      creature.totalXP += xpWithBonus
      creature.currentStageXP += xpWithBonus
      creature.mood = Math.min(100, creature.mood + 25)
      creature.lastFedAt = Date.now()

      // Day-based counters only increment once per calendar day
      if (isNewDay) {
        creature.totalDaysFed++

        // Update streak: check if yesterday was fed
        // Ensure streak values are valid numbers
        creature.currentStreak = creature.currentStreak || 0
        creature.longestStreak = creature.longestStreak || 0

        const isFirstFeedEver = creature.lastFedDate === null || creature.lastFedDate === undefined
        const fedYesterday = !isFirstFeedEver && isYesterday(creature.lastFedDate, today)

        if (isFirstFeedEver || fedYesterday) {
          // First feed ever or fed yesterday - continue/start streak
          creature.currentStreak = creature.currentStreak + 1
        } else {
          // Missed one or more days - reset streak to 1 (today counts)
          creature.currentStreak = 1
        }

        if (creature.currentStreak > creature.longestStreak) {
          creature.longestStreak = creature.currentStreak
        }

        // Update lastFedDate to today
        creature.lastFedDate = today
      }

      // Update affinities based on activity metrics
      const steps = todayActivity.steps || 0
      const distanceKm = (todayActivity.distance || 0) / 1000
      const calories = todayActivity.calories || 0
      const heartRate = todayActivity.heartRate || 0
      const fatBurnMinutes = todayActivity.fatBurnMinutes || 0
      const streak = creature.currentStreak || 0

      // Speed: based on movement (steps + distance)
      // High steps/distance = cardio activities like running, walking, cycling
      let speedBoost = 0
      if (steps >= 10000 || distanceKm >= 7) speedBoost = 3
      else if (steps >= 5000 || distanceKm >= 3) speedBoost = 2
      else if (steps >= 2000 || distanceKm >= 1) speedBoost = 1

      // Power: based on intensity (calories relative to steps)
      // High calories with low steps = strength/swimming (intense without much walking)
      let powerBoost = 0
      const caloriesPerStep = steps > 0 ? calories / steps : calories
      if (calories >= 300 && caloriesPerStep >= 0.05) powerBoost = 3      // High intensity
      else if (calories >= 150 && caloriesPerStep >= 0.03) powerBoost = 2 // Moderate intensity
      else if (calories >= 50 || heartRate >= 120) powerBoost = 1         // Some intensity

      // Endurance: based on sustained effort (PAI + fat burn minutes + streak)
      // PAI reflects overall sustained activity intensity
      const paiToday = todayActivity.paiToday || 0
      let enduranceBoost = 0
      if (paiToday >= 50 || fatBurnMinutes >= 30) enduranceBoost = 3
      else if (paiToday >= 25 || fatBurnMinutes >= 15) enduranceBoost = 2
      else if (paiToday >= 10 || fatBurnMinutes >= 5) enduranceBoost = 1
      // Streak bonus for consistency
      if (streak >= 7) enduranceBoost = Math.min(3, enduranceBoost + 1)

      // Ensure affinities object and values are valid
      creature.affinities = creature.affinities || { speed: 0, power: 0, endurance: 0 }
      creature.affinities.speed = Math.max(0, Math.min(100, creature.affinities.speed || 0))
      creature.affinities.power = Math.max(0, Math.min(100, creature.affinities.power || 0))
      creature.affinities.endurance = Math.max(0, Math.min(100, creature.affinities.endurance || 0))

      // Apply boosts (no penalties, capped at 100)
      if (speedBoost > 0) creature.affinities.speed = Math.min(100, creature.affinities.speed + speedBoost)
      if (powerBoost > 0) creature.affinities.power = Math.min(100, creature.affinities.power + powerBoost)
      if (enduranceBoost > 0) creature.affinities.endurance = Math.min(100, creature.affinities.endurance + enduranceBoost)

      // Evolution check - uses canEvolve() which checks both XP and minimum days
      if (canEvolve(creature)) {
        // evolve() handles history, stage increment, excess XP carry-over, and stageStartDate reset
        evolve(creature)
        result.evolved = true
        result.newStage = creature.stage
      } else {
        result.newStage = creature.stage
      }

      // Check for new trait unlocks
      const newTraits = checkUnlockConditions(creature)
      if (newTraits.length > 0) {
        creature.unlockedTraits = creature.unlockedTraits || []
        creature.unlockedTraits.push(...newTraits)
      }

      // Save current PAI as baseline for next feed calculation
      creature.lastFedPai = todayActivity.paiToday || 0

      app.globalData.creature = creature
      if (app.setCreature) app.setCreature(creature)

      // Reset feed state
      pendingLifeForce = 0
      canFeed = false
    } catch (e) {
      result.newStage = creature ? creature.stage : 0
    }
    return result
  },

  rebuildUI() {
    this.cleanup()
    this.buildStaticUI()
    this.buildBlob()
    // Re-show release confirmation if it was open
    if (showReleaseConfirm) {
      this.drawReleaseConfirm()
    }
  },

  // ==================== RELEASE LOGIC ====================

  onRelease() {
    if (!canRelease(creature) || isAnimating) return
    showReleaseConfirm = true
    releaseName = creature.name || 'Blobby'
    this.drawReleaseConfirm()
  },

  drawReleaseConfirm() {
    // Clear any existing release widgets
    releaseWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    releaseWidgets = []

    // Semi-transparent overlay
    releaseWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: H,
      color: 0x000000
    }))

    // Modal card
    const modalW = px(300)
    const modalH = px(280)
    const modalX = CX - modalW / 2
    const modalY = CX - modalH / 2

    // Card glow
    releaseWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: modalX - px(6),
      y: modalY - px(6),
      w: modalW + px(12),
      h: modalH + px(12),
      radius: px(20),
      color: 0x4d3d00 // goldGlow
    }))

    // Card background
    releaseWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: modalX,
      y: modalY,
      w: modalW,
      h: modalH,
      radius: px(16),
      color: COLORS.bgCard
    }))

    // Crown icon
    releaseWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: modalX,
      y: modalY + px(20),
      w: modalW,
      h: px(40),
      text: '👑',
      text_size: px(32),
      color: COLORS.gold,
      align_h: hmUI.align.CENTER_H
    }))

    // Title
    releaseWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: modalX,
      y: modalY + px(65),
      w: modalW,
      h: px(26),
      text: 'Ascend to Collection?',
      text_size: px(18),
      color: COLORS.textPrimary,
      align_h: hmUI.align.CENTER_H
    }))

    // Creature name display
    releaseWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: modalX + px(20),
      y: modalY + px(100),
      w: modalW - px(40),
      h: px(30),
      text: `"${releaseName}"`,
      text_size: px(16),
      color: COLORS.gold,
      align_h: hmUI.align.CENTER_H
    }))

    // Legacy bonus info
    const currentBonus = getLegacyBonus()
    const newBonus = Math.min(25, currentBonus + 5)
    releaseWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: modalX,
      y: modalY + px(135),
      w: modalW,
      h: px(22),
      text: currentBonus < 25 ? `Legacy: +${currentBonus}% → +${newBonus}%` : 'Legacy: +25% (Max)',
      text_size: px(14),
      color: COLORS.textSecondary,
      align_h: hmUI.align.CENTER_H
    }))

    // Info text
    releaseWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: modalX + px(15),
      y: modalY + px(160),
      w: modalW - px(30),
      h: px(36),
      text: 'Start fresh with bonus XP',
      text_size: px(13),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))

    // Buttons
    const btnW = px(110)
    const btnH = px(40)
    const btnY = modalY + modalH - px(60)
    const btnGap = px(20)

    // Cancel button
    releaseWidgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
      x: modalX + modalW / 2 - btnW - btnGap / 2,
      y: btnY,
      w: btnW,
      h: btnH,
      radius: btnH / 2,
      normal_color: COLORS.bgBar,
      press_color: COLORS.bgCardLight,
      text: 'Cancel',
      text_size: px(16),
      color: COLORS.textSecondary,
      click_func: () => this.onReleaseCancel()
    }))

    // Confirm button
    releaseWidgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
      x: modalX + modalW / 2 + btnGap / 2,
      y: btnY,
      w: btnW,
      h: btnH,
      radius: btnH / 2,
      normal_color: COLORS.gold,
      press_color: 0x806B00,
      text: 'Ascend',
      text_size: px(16),
      color: COLORS.bgDark,
      click_func: () => this.onReleaseConfirm()
    }))
  },

  onReleaseConfirm() {
    if (!canRelease(creature)) return

    const result = releaseCreature(creature, releaseName)
    if (result.success) {
      // Create new creature
      const app = getApp()
      creature = createDefaultCreature()
      app.globalData.creature = creature
      if (app.setCreature) app.setCreature(creature)

      // Clean up release UI
      showReleaseConfirm = false
      releaseWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
      releaseWidgets = []

      // Reset feed state
      pendingLifeForce = 0
      canFeed = false

      // Rebuild UI with new creature
      this.rebuildUI()
      this.startIdleAnimation()
    }
  },

  onReleaseCancel() {
    showReleaseConfirm = false
    releaseWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    releaseWidgets = []
  },

  cleanup() {
    blobWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    blobWidgets = []
    effectWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    effectWidgets = []
    progressWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    progressWidgets = []
    staticWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    staticWidgets = []
    releaseWidgets.forEach(w => { try { hmUI.deleteWidget(w) } catch (e) {} })
    releaseWidgets = []
  }
})
