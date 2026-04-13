// Trait System for FitBlob
// Handles trait definitions, unlock conditions, and evaluation

/**
 * All available traits organized by rarity
 * Visual evolution traits for dramatic appearance changes
 */
export const ALL_TRAITS = {
  common: [
    {
      id: 'spark_trail',
      name: 'Spark Trail',
      description: 'Glittering sparkles trail behind',
      unlockType: 'xp',
      unlockValue: 300
    },
    {
      id: 'tiny_wings',
      name: 'Tiny Wings',
      description: 'Small decorative wings sprout',
      unlockType: 'xp',
      unlockValue: 600
    },
    {
      id: 'shadow_aura',
      name: 'Shadow Aura',
      description: 'A mysterious dark aura surrounds',
      unlockType: 'streak',
      unlockValue: 5
    },
    {
      id: 'tail_wisp',
      name: 'Tail Wisp',
      description: 'An ethereal tail flows behind',
      unlockType: 'xp',
      unlockValue: 800
    }
  ],
  uncommon: [
    {
      id: 'flame_wisps',
      name: 'Flame Wisps',
      description: 'Dancing flames orbit the creature',
      unlockType: 'xp',
      unlockValue: 1500
    },
    {
      id: 'ice_crystals',
      name: 'Ice Crystals',
      description: 'Frozen crystals form on the body',
      unlockType: 'streak',
      unlockValue: 14
    },
    {
      id: 'feathered_wings',
      name: 'Feathered Wings',
      description: 'Elegant feathered wings emerge',
      unlockType: 'xp',
      unlockValue: 2500
    },
    {
      id: 'lightning_crackle',
      name: 'Lightning Crackle',
      description: 'Electric sparks crackle around',
      unlockType: 'streak',
      unlockValue: 21
    }
  ],
  rare: [
    {
      id: 'phoenix_flames',
      name: 'Phoenix Flames',
      description: 'Blazing phoenix fire engulfs',
      unlockType: 'xp',
      unlockValue: 5000
    },
    {
      id: 'frost_armor',
      name: 'Frost Armor',
      description: 'An icy crystalline shell forms',
      unlockType: 'streak',
      unlockValue: 30
    },
    {
      id: 'dragon_wings',
      name: 'Dragon Wings',
      description: 'Majestic dragon wings unfurl',
      unlockType: 'xp',
      unlockValue: 8000
    },
    {
      id: 'celestial_halo',
      name: 'Celestial Halo',
      description: 'A cosmic ring of stars orbits',
      unlockType: 'streak',
      unlockValue: 45
    }
  ]
}

/**
 * Rarity colors for UI display
 */
export const RARITY_COLORS = {
  common: 0x9E9E9E,
  uncommon: 0x00BFFF,
  rare: 0xFFD700
}

/**
 * Get all traits as flat array
 */
export function getAllTraits() {
  return [...ALL_TRAITS.common, ...ALL_TRAITS.uncommon, ...ALL_TRAITS.rare]
}

/**
 * Find a trait by ID
 */
export function getTraitById(id) {
  return getAllTraits().find(t => t.id === id)
}

/**
 * Get rarity of a trait
 */
export function getTraitRarity(id) {
  if (ALL_TRAITS.common.find(t => t.id === id)) return 'common'
  if (ALL_TRAITS.uncommon.find(t => t.id === id)) return 'uncommon'
  if (ALL_TRAITS.rare.find(t => t.id === id)) return 'rare'
  return 'common'
}

/**
 * Get unlock requirement text for display
 */
export function getUnlockRequirementText(trait) {
  if (trait.unlockType === 'xp') {
    return `${trait.unlockValue} XP`
  } else if (trait.unlockType === 'streak') {
    return `${trait.unlockValue}d streak`
  }
  return ''
}

/**
 * Check if a trait should be unlocked based on creature stats
 * @param {object} trait - Trait definition
 * @param {object} creature - Creature data
 * @returns {boolean} True if unlock conditions are met
 */
export function isTraitUnlockable(trait, creature) {
  if (trait.unlockType === 'xp') {
    return creature.totalXP >= trait.unlockValue
  } else if (trait.unlockType === 'streak') {
    // Check both current streak and longest streak
    const maxStreak = Math.max(creature.currentStreak || 0, creature.longestStreak || 0)
    return maxStreak >= trait.unlockValue
  }
  return false
}

/**
 * Check all traits and return newly unlocked ones
 * @param {object} creature - Creature data with totalXP, currentStreak, longestStreak, unlockedTraits
 * @returns {array} Array of trait IDs that are newly unlocked
 */
export function checkUnlockConditions(creature) {
  const alreadyUnlocked = new Set(creature.unlockedTraits || [])
  const newlyUnlocked = []

  getAllTraits().forEach(trait => {
    // Skip if already unlocked
    if (alreadyUnlocked.has(trait.id)) return

    // Check if unlock conditions are met
    if (isTraitUnlockable(trait, creature)) {
      newlyUnlocked.push(trait.id)
    }
  })

  return newlyUnlocked
}

/**
 * Get traits that can be unlocked with progress info
 * @param {object} creature - Creature data
 * @returns {array} Array of { trait, progress, isUnlocked }
 */
export function getTraitProgress(creature) {
  const alreadyUnlocked = new Set(creature.unlockedTraits || [])

  return getAllTraits().map(trait => {
    const isUnlocked = alreadyUnlocked.has(trait.id)
    let progress = 0

    if (isUnlocked) {
      progress = 100
    } else if (trait.unlockType === 'xp') {
      progress = Math.min(100, Math.round((creature.totalXP / trait.unlockValue) * 100))
    } else if (trait.unlockType === 'streak') {
      const maxStreak = Math.max(creature.currentStreak || 0, creature.longestStreak || 0)
      progress = Math.min(100, Math.round((maxStreak / trait.unlockValue) * 100))
    }

    return {
      trait,
      rarity: getTraitRarity(trait.id),
      progress,
      isUnlocked
    }
  })
}

/**
 * Check if a trait is active
 */
export function isTraitActive(traitId, creature) {
  return (creature.activeTraits || []).includes(traitId)
}

/**
 * Toggle a trait active/inactive
 * Returns updated activeTraits array
 * @param {string} traitId - Trait to toggle
 * @param {object} creature - Creature data
 * @param {number} maxActive - Maximum active traits allowed (default 2)
 * @returns {array} Updated activeTraits array
 */
export function toggleTrait(traitId, creature, maxActive = 2) {
  const activeTraits = [...(creature.activeTraits || [])]
  const unlockedTraits = creature.unlockedTraits || []

  // Can't activate a locked trait
  if (!unlockedTraits.includes(traitId)) {
    return activeTraits
  }

  const index = activeTraits.indexOf(traitId)

  if (index >= 0) {
    // Deactivate
    activeTraits.splice(index, 1)
  } else {
    // Activate (if under limit)
    if (activeTraits.length < maxActive) {
      activeTraits.push(traitId)
    } else {
      // Replace oldest active trait
      activeTraits.shift()
      activeTraits.push(traitId)
    }
  }

  return activeTraits
}
