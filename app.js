import { createDefaultCreature, ensureCreatureFields } from './lib/creature'

App({
  globalData: {
    creature: null
  },

  onCreate() {
    // Initialize creature with safe defaults
    try {
      const { LocalStorage } = require('@zos/storage')
      const storage = new LocalStorage()
      const saved = storage.getItem('creature')

      if (saved) {
        // Ensure all fields exist (handles upgrades)
        this.globalData.creature = ensureCreatureFields(JSON.parse(saved))
      } else {
        this.globalData.creature = createDefaultCreature()
      }
    } catch (e) {
      // Fallback to default creature if storage fails
      this.globalData.creature = createDefaultCreature()
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
      storage.setItem('creature', JSON.stringify(creature))
    } catch (e) {
      // Ignore
    }
  }
})
