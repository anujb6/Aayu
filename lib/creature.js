// Creature State Management Module for FitBlob
// Centralizes creature creation, validation, and state updates

/**
 * Create a new default creature
 * @param {string} name - Creature name
 * @returns {object} New creature object
 */
export function createDefaultCreature(name = 'Blobby') {
  const now = Date.now()
  return {
    id: 'blob_' + now,
    name: name,
    createdAt: now,
    stage: 1,
    totalXP: 0,
    currentStageXP: 0,
    daysInStage: 0,
    affinities: { speed: 0, power: 0, endurance: 0 },
    evolutionHistory: [],
    unlockedTraits: [],
    activeTraits: [],
    mood: 75,
    lastFedAt: null,
    lastCheckedAt: now,
    currentStreak: 0,
    longestStreak: 0,
    totalDaysFed: 0
  }
}

/**
 * Update creature mood
 * @param {object} creature - Creature object
 * @param {number} change - Mood change (positive or negative)
 * @returns {number} New mood value
 */
export function updateMood(creature, change) {
  creature.mood = Math.max(0, Math.min(100, creature.mood + change))
  return creature.mood
}

/**
 * Get mood state string from mood value
 * @param {number} mood - Mood value (0-100)
 * @returns {string} 'happy' | 'neutral' | 'sad'
 */
export function getMoodState(mood) {
  if (mood >= 70) return 'happy'
  if (mood >= 40) return 'neutral'
  return 'sad'
}

/**
 * Get mood display text
 * @param {number} mood - Mood value (0-100)
 * @returns {string} Display text
 */
export function getMoodText(mood) {
  if (mood >= 70) return 'Happy!'
  if (mood >= 40) return 'Content'
  return 'Needs love'
}

/**
 * Update streak on feed
 * @param {object} creature - Creature object
 * @param {boolean} fed - Whether creature was fed today
 */
export function updateStreak(creature, fed) {
  if (fed) {
    creature.currentStreak++
    creature.totalDaysFed++
    if (creature.currentStreak > creature.longestStreak) {
      creature.longestStreak = creature.currentStreak
    }
  }
}

/**
 * Reset streak (for missed days)
 * @param {object} creature - Creature object
 */
export function resetStreak(creature) {
  creature.currentStreak = 0
}

/**
 * Add XP to creature
 * @param {object} creature - Creature object
 * @param {number} amount - XP amount to add
 */
export function addXP(creature, amount) {
  creature.totalXP += amount
  creature.currentStageXP += amount
}

/**
 * Update affinities based on activity type
 * @param {object} creature - Creature object
 * @param {string} dominantActivity - 'speed' | 'power' | 'endurance'
 * @param {number} boost - Amount to boost dominant affinity
 */
export function updateAffinities(creature, dominantActivity, boost = 2) {
  const decay = 1

  switch (dominantActivity) {
    case 'speed':
      creature.affinities.speed = Math.min(100, creature.affinities.speed + boost)
      creature.affinities.power = Math.max(0, creature.affinities.power - decay)
      creature.affinities.endurance = Math.max(0, creature.affinities.endurance - decay)
      break
    case 'power':
      creature.affinities.power = Math.min(100, creature.affinities.power + boost)
      creature.affinities.speed = Math.max(0, creature.affinities.speed - decay)
      creature.affinities.endurance = Math.max(0, creature.affinities.endurance - decay)
      break
    case 'endurance':
      creature.affinities.endurance = Math.min(100, creature.affinities.endurance + boost)
      creature.affinities.speed = Math.max(0, creature.affinities.speed - decay)
      creature.affinities.power = Math.max(0, creature.affinities.power - decay)
      break
  }
}

/**
 * Validate creature object has all required fields
 * @param {object} creature - Creature object to validate
 * @returns {boolean} True if valid
 */
export function validateCreature(creature) {
  if (!creature) return false

  const requiredFields = [
    'id', 'name', 'createdAt', 'stage', 'totalXP', 'currentStageXP',
    'daysInStage', 'affinities', 'mood', 'currentStreak', 'longestStreak', 'totalDaysFed'
  ]

  for (const field of requiredFields) {
    if (creature[field] === undefined) return false
  }

  if (!creature.affinities.speed === undefined ||
      creature.affinities.power === undefined ||
      creature.affinities.endurance === undefined) {
    return false
  }

  return true
}

/**
 * Ensure creature has all required fields, filling in defaults
 * @param {object} creature - Creature object
 * @returns {object} Creature with all fields
 */
export function ensureCreatureFields(creature) {
  const defaults = createDefaultCreature()

  return {
    ...defaults,
    ...creature,
    affinities: {
      ...defaults.affinities,
      ...(creature.affinities || {})
    },
    evolutionHistory: creature.evolutionHistory || [],
    unlockedTraits: creature.unlockedTraits || [],
    activeTraits: creature.activeTraits || []
  }
}
