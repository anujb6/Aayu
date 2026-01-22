// Creature State Management Module for FitBlob
// Centralizes creature creation, validation, and state updates

/**
 * Create a new default creature
 * @param {string} name - Creature name
 * @returns {object} New creature object
 */
export function createDefaultCreature(name = 'Blobby') {
  const now = Date.now()
  const today = getDateString(now)
  return {
    id: 'blob_' + now,
    name: name,
    createdAt: now,
    stage: 1,
    totalXP: 0,
    currentStageXP: 0,
    stageStartDate: today,      // Date string when current stage began (YYYY-MM-DD)
    lastFedDate: null,          // Date string of last feed (YYYY-MM-DD) - for day counter deduplication
    affinities: { speed: 0, power: 0, endurance: 0 },
    evolutionHistory: [],
    unlockedTraits: [],
    activeTraits: [],
    mood: 75,
    lastFedAt: null,
    lastFedPai: 0,
    lastCheckedAt: now,
    currentStreak: 0,
    longestStreak: 0,
    totalDaysFed: 0
  }
}

/**
 * Get date string in YYYY-MM-DD format
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Date string
 */
export function getDateString(timestamp = Date.now()) {
  const d = new Date(timestamp)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Calculate days between two date strings
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD), defaults to today
 * @returns {number} Number of days (inclusive of start day, so day 1 = 0 days passed)
 */
export function daysBetween(startDate, endDate = getDateString()) {
  if (!startDate) return 0
  // Use UTC to avoid timezone-related date shifts
  const start = new Date(startDate + 'T00:00:00Z')
  const end = new Date(endDate + 'T00:00:00Z')
  const diffMs = end - start
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

/**
 * Check if two date strings are the same
 * @param {string} date1 - First date (YYYY-MM-DD)
 * @param {string} date2 - Second date (YYYY-MM-DD)
 * @returns {boolean} True if same date
 */
export function isSameDate(date1, date2) {
  return date1 === date2
}

/**
 * Check if date1 is yesterday relative to date2
 * @param {string} date1 - First date (YYYY-MM-DD)
 * @param {string} date2 - Second date (YYYY-MM-DD), defaults to today
 * @returns {boolean} True if date1 is yesterday
 */
export function isYesterday(date1, date2 = getDateString()) {
  if (!date1) return false
  // Use UTC to avoid timezone-related date shifts
  const d = new Date(date2 + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  const yesterdayStr = getDateString(d.getTime())
  return date1 === yesterdayStr
}

/**
 * Get the calculated days in current stage
 * @param {object} creature - Creature object
 * @returns {number} Days in current stage
 */
export function getDaysInStage(creature) {
  if (!creature || !creature.stageStartDate) return 0
  return daysBetween(creature.stageStartDate)
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
    'affinities', 'mood', 'currentStreak', 'longestStreak', 'totalDaysFed'
  ]

  for (const field of requiredFields) {
    if (creature[field] === undefined) return false
  }

  if (creature.affinities.speed === undefined ||
      creature.affinities.power === undefined ||
      creature.affinities.endurance === undefined) {
    return false
  }

  return true
}

/**
 * Ensure creature has all required fields, filling in defaults
 * Handles migration from older creature data without date fields
 * @param {object} creature - Creature object
 * @returns {object} Creature with all fields
 */
export function ensureCreatureFields(creature) {
  const defaults = createDefaultCreature()
  const today = getDateString()

  // Migration: if creature doesn't have stageStartDate, estimate it
  let stageStartDate = creature.stageStartDate
  if (!stageStartDate) {
    // Estimate based on createdAt or default to today
    if (creature.createdAt) {
      stageStartDate = getDateString(creature.createdAt)
    } else {
      stageStartDate = today
    }
  }

  return {
    ...defaults,
    ...creature,
    stageStartDate: stageStartDate,
    lastFedDate: creature.lastFedDate || null,
    affinities: {
      ...defaults.affinities,
      ...(creature.affinities || {})
    },
    evolutionHistory: creature.evolutionHistory || [],
    unlockedTraits: creature.unlockedTraits || [],
    activeTraits: creature.activeTraits || [],
    lastFedPai: creature.lastFedPai || 0
  }
}
