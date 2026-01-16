import * as hmUI from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { push } from '@zos/router'
import { onGesture, offGesture, GESTURE_LEFT } from '@zos/interaction'
import { Step, Distance, Calorie } from '@zos/sensor'
import { startAnimation, stopAnimation, stopAllAnimations as stopAllAnimationsFromModule, ANIMATION_CONFIG, easeInOutCubic } from '../../lib/animation'
import { createCompleteBlob, getShapeType, getColorPalette, getDarkerColor } from '../../lib/shapes'
import { checkUnlockConditions } from '../../lib/traits'
import { STAGE_NAMES, EVOLUTION_THRESHOLDS, STAGE_SIZES, canEvolve, evolve, getEvolutionProgress as getEvoProgress } from '../../lib/evolution'

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

// Colors
const COLORS = {
  bgDark: 0x000000,
  bgLight: 0x2a2a3e,
  textPrimary: 0xFFFFFF,
  textSecondary: 0xBBBBBB,
  textMuted: 0x888888,
  textDark: 0x555555,
  speed: 0x00BFFF,
  power: 0xFF6B35,
  endurance: 0x9B59B6,
  success: 0x4CAF50,
  successDark: 0x2E7D32,
  warning: 0xFF9800,
  streak: 0xFF6B35,
  barBg: 0x2a2a3e,
  xpParticle: 0x4CAF50,
  celebration: 0xFFD700
}

const BASE_BLOB_SIZE = 100

// Widget arrays
let staticWidgets = []      // Background, text (never animated)
let blobWidgets = []        // Blob body, eyes (animated)
let effectWidgets = []      // Particles, glows (temporary)
let progressWidgets = []    // XP bar

// State
let creature = null
let pendingLifeForce = 0
let hasBeenFedToday = false
let todayActivity = { steps: 0, distance: 0, calories: 0 }
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

    if (creature && creature.lastFedAt) {
      try {
        const lastFedDate = new Date(creature.lastFedAt).toISOString().split('T')[0]
        const today = new Date().toISOString().split('T')[0]
        hasBeenFedToday = lastFedDate === today
      } catch (e) {
        hasBeenFedToday = false
      }
    }

    this.loadTodayActivity()

    if (!hasBeenFedToday) {
      pendingLifeForce = this.calculateLifeForce()
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
  },

  calculateLifeForce() {
    const stepsXP = Math.min(50, Math.floor(todayActivity.steps / 100))
    const distXP = Math.min(50, Math.floor(todayActivity.distance / 100))
    const calXP = Math.min(50, Math.floor(todayActivity.calories / 10))
    return stepsXP + distXP + calXP
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

  buildStaticUI() {
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

    // Name
    staticWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(55), w: W - px(120), h: px(36),
      text: creature.name,
      text_size: px(28),
      color: COLORS.textPrimary,
      align_h: hmUI.align.CENTER_H
    }))

    // Stage + Streak
    const stageName = STAGE_NAMES[creature.stage] || 'Unknown'
    const streakText = creature.currentStreak > 0 ? ` | ${creature.currentStreak}d` : ''
    staticWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(90), w: W - px(120), h: px(26),
      text: stageName + streakText,
      text_size: px(18),
      color: creature.currentStreak > 0 ? COLORS.streak : COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))

    // Mood text
    const moodText = creature.mood >= 70 ? 'Happy!' : creature.mood >= 40 ? 'Content' : 'Needs love'
    const moodColor = creature.mood >= 70 ? COLORS.success : creature.mood >= 40 ? COLORS.textSecondary : COLORS.warning
    staticWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(305), w: W - px(120), h: px(28),
      text: moodText,
      text_size: px(20),
      color: moodColor,
      align_h: hmUI.align.CENTER_H
    }))

    // XP Progress bar
    this.createProgressBar()

    // XP text
    const threshold = EVOLUTION_THRESHOLDS[creature.stage]
    const xpText = creature.stage >= 6 ? 'MAX' : `${creature.currentStageXP}/${threshold} XP`
    staticWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(60), y: px(360), w: W - px(120), h: px(24),
      text: xpText,
      text_size: px(16),
      color: COLORS.textMuted,
      align_h: hmUI.align.CENTER_H
    }))

    // Feed button or status
    if (hasBeenFedToday) {
      staticWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(60), y: px(395), w: W - px(120), h: px(32),
        text: 'Fed Today',
        text_size: px(20),
        color: COLORS.success,
        align_h: hmUI.align.CENTER_H
      }))
    } else if (pendingLifeForce === 0) {
      staticWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(60), y: px(395), w: W - px(120), h: px(32),
        text: 'Get active to feed!',
        text_size: px(18),
        color: COLORS.textMuted,
        align_h: hmUI.align.CENTER_H
      }))
    } else {
      this.createFeedButton()
    }

    // Page dots
    this.createPageDots(px(458))
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

  createProgressBar() {
    const evoProgress = this.getEvolutionProgress()
    const barW = px(240)
    const barX = CX - barW / 2
    const barY = px(340)
    const barH = px(14)
    const color = this.getCreatureColor()

    progressWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: barX, y: barY, w: barW, h: barH,
      radius: barH / 2,
      color: COLORS.barBg
    }))

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
    }
  },

  createPageDots(y) {
    const dotSize = px(6)
    const spacing = px(14)
    const totalW = 5 * dotSize + 4 * (spacing - dotSize)
    const startX = CX - totalW / 2

    for (let i = 0; i < 5; i++) {
      staticWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: startX + i * spacing, y: y,
        w: dotSize, h: dotSize,
        radius: dotSize / 2,
        color: i === 0 ? COLORS.textPrimary : COLORS.textDark
      }))
    }
  },

  createFeedButton() {
    const btnW = px(160)
    const btnH = px(44)
    const btnX = CX - btnW / 2
    const btnY = px(390)

    staticWidgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
      x: btnX, y: btnY, w: btnW, h: btnH,
      radius: btnH / 2,
      normal_color: COLORS.success,
      press_color: COLORS.successDark,
      text: `Feed +${pendingLifeForce}`,
      text_size: px(18),
      color: COLORS.textPrimary,
      click_func: () => this.onFeed()
    }))
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
    if (hasBeenFedToday || pendingLifeForce <= 0 || !creature || isAnimating) return

    // Check if will evolve
    const threshold = EVOLUTION_THRESHOLDS[creature.stage]
    const willEvolve = threshold &&
                       (creature.currentStageXP + pendingLifeForce) >= threshold &&
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

      creature.totalXP += pendingLifeForce
      creature.currentStageXP += pendingLifeForce
      creature.mood = Math.min(100, creature.mood + 25)
      creature.lastFedAt = Date.now()
      creature.totalDaysFed++
      creature.daysInStage++
      creature.currentStreak++

      if (creature.currentStreak > creature.longestStreak) {
        creature.longestStreak = creature.currentStreak
      }

      // Update affinities
      const stepsXP = Math.min(50, Math.floor(todayActivity.steps / 100))
      const distXP = Math.min(50, Math.floor(todayActivity.distance / 100))
      const calXP = Math.min(50, Math.floor(todayActivity.calories / 10))

      if (stepsXP >= distXP && stepsXP >= calXP && stepsXP > 0) {
        creature.affinities.speed = Math.min(100, creature.affinities.speed + 2)
        creature.affinities.power = Math.max(0, creature.affinities.power - 1)
        creature.affinities.endurance = Math.max(0, creature.affinities.endurance - 1)
      } else if (distXP >= stepsXP && distXP >= calXP && distXP > 0) {
        creature.affinities.power = Math.min(100, creature.affinities.power + 2)
        creature.affinities.speed = Math.max(0, creature.affinities.speed - 1)
        creature.affinities.endurance = Math.max(0, creature.affinities.endurance - 1)
      } else if (calXP > 0) {
        creature.affinities.endurance = Math.min(100, creature.affinities.endurance + 2)
        creature.affinities.speed = Math.max(0, creature.affinities.speed - 1)
        creature.affinities.power = Math.max(0, creature.affinities.power - 1)
      }

      // Evolution check
      const threshold = EVOLUTION_THRESHOLDS[creature.stage]
      if (threshold && creature.currentStageXP >= threshold && creature.stage < 6) {
        // Record evolution history before changing stage
        const dominantAffinity = getShapeType(creature.affinities)
        creature.evolutionHistory = creature.evolutionHistory || []
        creature.evolutionHistory.push(`${dominantAffinity}_${creature.stage}`)

        creature.stage++
        creature.currentStageXP = 0
        creature.daysInStage = 0
      }

      // Check for new trait unlocks
      const newTraits = checkUnlockConditions(creature)
      if (newTraits.length > 0) {
        creature.unlockedTraits = creature.unlockedTraits || []
        creature.unlockedTraits.push(...newTraits)
      }

      app.globalData.creature = creature
      if (app.setCreature) app.setCreature(creature)

      hasBeenFedToday = true
      pendingLifeForce = 0
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
