import * as hmUI from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { push } from '@zos/router'
import { onGesture, offGesture, GESTURE_LEFT } from '@zos/interaction'
import { Step, Distance, Calorie, Pai } from '@zos/sensor'
import { startAnimation, stopAnimation, stopAllAnimations as stopAllAnimationsFromModule, ANIMATION_CONFIG, easeInOutCubic } from '../../lib/animation'
import { createCompleteBlob, getShapeType, getColorPalette, getDarkerColor } from '../../lib/shapes'
import { checkUnlockConditions } from '../../lib/traits'
import { STAGE_NAMES, EVOLUTION_THRESHOLDS, STAGE_SIZES, canEvolve, evolve, getEvolutionProgress as getEvoProgress, getStreakBonus, checkEvolutionRequirements } from '../../lib/evolution'
import { getDateString, isSameDate, isYesterday } from '../../lib/creature'

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

// Animation state
let currentScale = 1.0
let currentYOffset = 0
let currentXOffset = 0
let currentFrame = 0

Page({
  onInit() {
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

  },

  calculateLifeForce() {
    // PAI-delta based XP: Reward new activity since last feed
    // Allows multiple feeds per day if user does multiple workouts
    const currentPai = todayActivity.paiToday || 0

    // Determine baseline PAI (what we've already rewarded)
    let baseline = 0
    if (creature && creature.lastFedAt) {
      try {
        const lastFedDate = new Date(creature.lastFedAt).toISOString().split('T')[0]
        const today = new Date().toISOString().split('T')[0]
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
      text: creature.name,
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

      // Button
      staticWidgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: btnX, y: feedY, w: btnW, h: btnH,
        radius: btnH / 2,
        normal_color: COLORS.success,
        press_color: COLORS.successDark,
        text: `Feed +${pendingLifeForce}`,
        text_size: px(18),
        color: COLORS.textPrimary,
        click_func: () => this.onFeed()
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

    // Use the shapes module for affinity-based blob with traits
    blobWidgets = createCompleteBlob(creature, blobX, blobY, Math.round(baseSize * scale), px, frame)
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
    const delay = 3000 + Math.random() * 2000 // 3-5 seconds
    blinkTimer = setTimeout(() => {
      if (!isAnimating) {
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
    const xpWithBonus = Math.round(pendingLifeForce * streakMultiplier)
    const evoReqs = checkEvolutionRequirements(creature)
    const threshold = EVOLUTION_THRESHOLDS[creature.stage]
    // Will evolve if: days requirement met AND XP after feed meets threshold
    const willEvolve = evoReqs.daysMet && threshold &&
                       (creature.currentStageXP + xpWithBonus) >= threshold &&
                       creature.stage < 6
    const oldStage = creature.stage

    // Start feed animation
    this.startFeedAnimation(() => {
      // Apply feed changes
      this.applyFeedChanges()

      if (willEvolve) {
        // Play evolution animation
        this.startEvolutionAnimation(oldStage, creature.stage, () => {
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
    try {
      const app = getApp()
      const today = getDateString()
      const isNewDay = !isSameDate(creature.lastFedDate, today)

      // XP always stacks (multiple feeds per day add XP)
      // Apply streak bonus to XP
      const streakMultiplier = getStreakBonus(creature.currentStreak)
      const xpWithBonus = Math.round(pendingLifeForce * streakMultiplier)
      creature.totalXP += xpWithBonus
      creature.currentStageXP += xpWithBonus
      creature.mood = Math.min(100, creature.mood + 25)
      creature.lastFedAt = Date.now()

      // Day-based counters only increment once per calendar day
      if (isNewDay) {
        creature.totalDaysFed++

        // Update streak: check if yesterday was fed
        if (creature.lastFedDate === null || isYesterday(creature.lastFedDate, today)) {
          // First feed ever or fed yesterday - continue/start streak
          creature.currentStreak++
        } else {
          // Missed one or more days - reset streak
          creature.currentStreak = 1
        }

        if (creature.currentStreak > creature.longestStreak) {
          creature.longestStreak = creature.currentStreak
        }

        // Update lastFedDate to today
        creature.lastFedDate = today
      }

      // Update affinities based on activity metrics
      // Speed: High movement (8000+ steps OR 5+ km distance)
      // Power: High intensity (300+ calories burned)
      // Endurance: Consistent activity (has PAI)
      const steps = todayActivity.steps || 0
      const calories = todayActivity.calories || 0
      const paiToday = todayActivity.paiToday || 0
      const distanceKm = (todayActivity.distance || 0) / 1000

      if (steps >= 8000 || distanceKm >= 5) {
        // High movement → Speed affinity
        creature.affinities.speed = Math.min(100, creature.affinities.speed + 2)
        creature.affinities.power = Math.max(0, creature.affinities.power - 1)
        creature.affinities.endurance = Math.max(0, creature.affinities.endurance - 1)
      } else if (calories >= 300) {
        // High intensity → Power affinity
        creature.affinities.power = Math.min(100, creature.affinities.power + 2)
        creature.affinities.speed = Math.max(0, creature.affinities.speed - 1)
        creature.affinities.endurance = Math.max(0, creature.affinities.endurance - 1)
      } else if (paiToday > 0) {
        // Consistent activity → Endurance affinity
        creature.affinities.endurance = Math.min(100, creature.affinities.endurance + 2)
        creature.affinities.speed = Math.max(0, creature.affinities.speed - 1)
        creature.affinities.power = Math.max(0, creature.affinities.power - 1)
      }

      // Evolution check - uses canEvolve() which checks both XP and minimum days
      if (canEvolve(creature)) {
        // evolve() handles history, stage increment, excess XP carry-over, and stageStartDate reset
        evolve(creature)
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
    } catch (e) {}
  },

  rebuildUI() {
    this.cleanup()
    this.buildStaticUI()
    this.buildBlob()
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
  }
})
