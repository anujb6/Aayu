// Animation Controller Module for Zepp OS
// Timer-based frame animation since Zepp OS has no native animation API

// Animation state management
let activeAnimations = {}
let animationTimers = {}

// Configuration
export const ANIMATION_CONFIG = {
  IDLE_FPS: 30,           // 30 FPS for smooth idle animation
  FEED_FPS: 15,           // 15 FPS for feed animation
  EVOLUTION_FPS: 15,      // 15 FPS for evolution
  IDLE_INTERVAL: 33,      // 1000ms / 30 FPS - smooth like electrons
  FEED_INTERVAL: 67,      // 1000ms / 15 FPS
  EVOLUTION_INTERVAL: 67
}

/**
 * Start a new animation
 * @param {string} id - Unique animation identifier
 * @param {object} config - Animation configuration
 * @param {number} config.totalFrames - Total frames in animation
 * @param {number} config.interval - Milliseconds between frames
 * @param {boolean} config.loop - Whether to loop the animation
 * @param {function} config.onFrame - Callback for each frame (frame, totalFrames)
 * @param {function} config.onComplete - Callback when animation completes
 */
export function startAnimation(id, config) {
  // Stop any existing animation with this ID
  if (activeAnimations[id]) {
    stopAnimation(id)
  }

  activeAnimations[id] = {
    frame: 0,
    totalFrames: config.totalFrames || 60,
    onFrame: config.onFrame,
    onComplete: config.onComplete,
    loop: config.loop || false,
    running: true
  }

  animationTimers[id] = setInterval(() => {
    const anim = activeAnimations[id]
    if (!anim || !anim.running) return

    try {
      // Call frame callback
      if (anim.onFrame) {
        anim.onFrame(anim.frame, anim.totalFrames)
      }

      anim.frame++

      // Check if animation completed
      if (anim.frame >= anim.totalFrames) {
        if (anim.loop) {
          anim.frame = 0
        } else {
          stopAnimation(id)
          if (anim.onComplete) {
            anim.onComplete()
          }
        }
      }
    } catch (e) {
      // Error in animation callback - stop animation to prevent infinite error loop
      stopAnimation(id)
      // Still try to call onComplete to clean up state
      try {
        if (anim.onComplete) {
          anim.onComplete()
        }
      } catch (e2) {}
    }
  }, config.interval || ANIMATION_CONFIG.IDLE_INTERVAL)
}

/**
 * Stop a specific animation
 * @param {string} id - Animation identifier to stop
 */
export function stopAnimation(id) {
  if (animationTimers[id]) {
    clearInterval(animationTimers[id])
    delete animationTimers[id]
  }
  delete activeAnimations[id]
}

/**
 * Stop all running animations
 */
export function stopAllAnimations() {
  Object.keys(animationTimers).forEach(id => {
    clearInterval(animationTimers[id])
  })
  animationTimers = {}
  activeAnimations = {}
}

/**
 * Check if an animation is currently running
 * @param {string} id - Animation identifier
 * @returns {boolean} True if animation is running
 */
export function isAnimating(id) {
  return !!activeAnimations[id]?.running
}

/**
 * Easing function: ease in-out cubic
 * @param {number} t - Progress (0 to 1)
 * @returns {number} Eased value
 */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Easing function: ease out cubic
 * @param {number} t - Progress (0 to 1)
 * @returns {number} Eased value
 */
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Get a darker shade of a color (since Zepp OS doesn't support alpha)
 * @param {number} color - Hex color value
 * @param {number} factor - Darkness factor (0 = black, 1 = original)
 * @returns {number} Darkened color
 */
export function getDarkerColor(color, factor) {
  const r = Math.round(((color >> 16) & 0xFF) * factor)
  const g = Math.round(((color >> 8) & 0xFF) * factor)
  const b = Math.round((color & 0xFF) * factor)
  return (r << 16) | (g << 8) | b
}

/**
 * Blend two colors
 * @param {number} color1 - First color
 * @param {number} color2 - Second color
 * @param {number} ratio - Blend ratio (0 = color1, 1 = color2)
 * @returns {number} Blended color
 */
export function blendColors(color1, color2, ratio) {
  const r1 = (color1 >> 16) & 0xFF
  const g1 = (color1 >> 8) & 0xFF
  const b1 = color1 & 0xFF

  const r2 = (color2 >> 16) & 0xFF
  const g2 = (color2 >> 8) & 0xFF
  const b2 = color2 & 0xFF

  const r = Math.round(r1 + (r2 - r1) * ratio)
  const g = Math.round(g1 + (g2 - g1) * ratio)
  const b = Math.round(b1 + (b2 - b1) * ratio)

  return (r << 16) | (g << 8) | b
}
