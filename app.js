import { createDefaultCreature, ensureCreatureFields } from './lib/creature'
import { cleanupSensors } from './lib/activity'

App({
  globalData: {
    creature: null
  },

  onCreate() {
    // Initialize creature with safe defaults
    const { LocalStorage } = require('@zos/storage')
    const storage = new LocalStorage()

    let loaded = null

    // Try to load saved creature
    try {
      const saved = storage.getItem('creature')
      if (saved && saved !== 'null' && saved !== 'undefined') {
        const parsed = JSON.parse(saved)
        // Validate it's actually a creature object with required fields
        if (parsed && typeof parsed === 'object' && parsed.totalXP !== undefined) {
          loaded = parsed
        }
      }
    } catch (e) {
      // Parse error - try to recover from backup
      loaded = null
    }

    // If primary load failed, try backup
    if (!loaded) {
      try {
        const backup = storage.getItem('creature_backup')
        if (backup && backup !== 'null' && backup !== 'undefined') {
          const parsed = JSON.parse(backup)
          if (parsed && typeof parsed === 'object' && parsed.totalXP !== undefined) {
            loaded = parsed
          }
        }
      } catch (e2) {}
    }

    if (loaded) {
      // Valid creature found - ensure all fields exist
      this.globalData.creature = ensureCreatureFields(loaded)
    } else {
      // No valid creature - create new
      this.globalData.creature = createDefaultCreature()
    }

    // Always create backup of valid creature (even if XP=0 for new creatures)
    if (this.globalData.creature) {
      try {
        storage.setItem('creature_backup', JSON.stringify(this.globalData.creature))
      } catch (e) {}
    }
  },

  onDestroy() {
    // Save on exit
    this.saveCreature(this.globalData.creature)
    // Release sensor resources
    cleanupSensors()
  },

  getCreature() {
    return this.globalData.creature
  },

  setCreature(creature) {
    this.globalData.creature = creature
    this.saveCreature(creature)
  },

  saveCreature(creature) {
    if (!creature) return false

    try {
      const { LocalStorage } = require('@zos/storage')
      const storage = new LocalStorage()
      const data = JSON.stringify(creature)

      // Check if data is too large (Zepp OS has ~32KB limit per key)
      if (data.length > 30000) {
        // Data too large - trim evolution history to save space
        const trimmed = { ...creature }
        if (trimmed.evolutionHistory && trimmed.evolutionHistory.length > 10) {
          trimmed.evolutionHistory = trimmed.evolutionHistory.slice(-10)
        }
        storage.setItem('creature', JSON.stringify(trimmed))
      } else {
        storage.setItem('creature', data)
      }

      // Always save backup
      storage.setItem('creature_backup', data)
      return true
    } catch (e) {
      // Storage failed - creature is still in memory but not persisted
      // On next app start, backup will be used if available
      return false
    }
  }
})
