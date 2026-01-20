import { createDefaultCreature, ensureCreatureFields } from './lib/creature'

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
      if (saved) {
        loaded = JSON.parse(saved)
      }
    } catch (e) {
      // Parse error - try to recover from backup
      try {
        const backup = storage.getItem('creature_backup')
        if (backup) {
          loaded = JSON.parse(backup)
        }
      } catch (e2) {}
    }

    if (loaded && loaded.totalXP !== undefined) {
      // Valid creature found - ensure all fields exist
      this.globalData.creature = ensureCreatureFields(loaded)
    } else {
      // No valid creature - create new
      this.globalData.creature = createDefaultCreature()
    }

    // Create backup of valid creature data
    if (this.globalData.creature && this.globalData.creature.totalXP > 0) {
      try {
        storage.setItem('creature_backup', JSON.stringify(this.globalData.creature))
      } catch (e) {}
    }
  },

  onDestroy() {
    // Save on exit
    try {
      const { LocalStorage } = require('@zos/storage')
      const storage = new LocalStorage()
      if (this.globalData.creature) {
        storage.setItem('creature', JSON.stringify(this.globalData.creature))
      }
    } catch (e) {
      // Ignore save errors
    }
  },

  getCreature() {
    return this.globalData.creature
  },

  setCreature(creature) {
    this.globalData.creature = creature
    try {
      const { LocalStorage } = require('@zos/storage')
      const storage = new LocalStorage()
      const data = JSON.stringify(creature)
      storage.setItem('creature', data)
      // Also save backup if creature has XP
      if (creature && creature.totalXP > 0) {
        storage.setItem('creature_backup', data)
      }
    } catch (e) {
      // Ignore
    }
  }
})
