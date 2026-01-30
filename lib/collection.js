// Collection & Rebirth System Module for FitBlob
// Manages released creatures and legacy bonus calculations

import { getDateString, daysBetween } from './creature'

const STORAGE_KEY = 'fitblob_collection'
const LEGACY_BONUS_PER_CREATURE = 5
const MAX_LEGACY_BONUS = 25
const TRANSCENDENT_STAGE = 6

/**
 * Get collection data from storage
 * @returns {object} Collection object with releasedCount, legacyBonus, and creatures array
 */
export function getCollection() {
  try {
    const { LocalStorage } = require('@zos/storage')
    const storage = new LocalStorage()
    const saved = storage.getItem(STORAGE_KEY)

    if (saved && saved !== 'null' && saved !== 'undefined') {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === 'object') {
        // Ensure all fields exist
        return {
          releasedCount: parsed.releasedCount || 0,
          legacyBonus: parsed.legacyBonus || 0,
          creatures: parsed.creatures || []
        }
      }
    }
  } catch (e) {
    // Storage error - return default
  }

  return {
    releasedCount: 0,
    legacyBonus: 0,
    creatures: []
  }
}

/**
 * Save collection data to storage
 * @param {object} collection - Collection object to save
 * @returns {boolean} True if save successful
 */
export function saveCollection(collection) {
  try {
    const { LocalStorage } = require('@zos/storage')
    const storage = new LocalStorage()
    const data = JSON.stringify(collection)

    // Check size limit (32KB max per key on Zepp OS)
    if (data.length > 30000) {
      // Trim oldest creatures if too large
      const trimmed = {
        ...collection,
        creatures: collection.creatures.slice(-10)
      }
      storage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } else {
      storage.setItem(STORAGE_KEY, data)
    }
    return true
  } catch (e) {
    return false
  }
}

/**
 * Get the legacy XP bonus percentage (0-25)
 * @returns {number} Legacy bonus percentage
 */
export function getLegacyBonus() {
  const collection = getCollection()
  return collection.legacyBonus
}

/**
 * Get the number of released creatures
 * @returns {number} Released creature count
 */
export function getReleasedCount() {
  const collection = getCollection()
  return collection.releasedCount
}

/**
 * Get all collection entries (released creatures)
 * @returns {array} Array of collection entries
 */
export function getCollectionEntries() {
  const collection = getCollection()
  return collection.creatures
}

/**
 * Check if creature can be released (must be at Transcendent stage)
 * @param {object} creature - Creature object
 * @returns {boolean} True if creature can be released
 */
export function canRelease(creature) {
  if (!creature) return false
  return creature.stage >= TRANSCENDENT_STAGE
}

/**
 * Calculate dominant affinity from affinities object
 * @param {object} affinities - Object with speed, power, endurance values
 * @returns {string} 'speed' | 'power' | 'endurance'
 */
export function getDominantAffinity(affinities) {
  if (!affinities) return 'endurance'
  const { speed = 0, power = 0, endurance = 0 } = affinities

  if (speed >= power && speed >= endurance) return 'speed'
  if (power >= speed && power >= endurance) return 'power'
  return 'endurance'
}

/**
 * Release creature to collection and return result
 * @param {object} creature - Creature object to release
 * @param {string} name - Optional name for the released creature
 * @returns {object} Result with success boolean and collection data
 */
export function releaseCreature(creature, name = '') {
  if (!canRelease(creature)) {
    return { success: false, error: 'Creature not eligible for release' }
  }

  try {
    const collection = getCollection()
    const now = Date.now()
    const today = getDateString(now)

    // Calculate days from creation to release
    const createdDate = creature.createdAt ? getDateString(creature.createdAt) : today
    const daysToComplete = daysBetween(createdDate, today)

    // Create collection entry
    const entry = {
      id: creature.id,
      name: name && name.trim() ? name.trim() : 'Unnamed',
      createdAt: creature.createdAt || now,
      releasedAt: now,
      daysToComplete: daysToComplete,
      totalXP: creature.totalXP || 0,
      affinities: {
        speed: creature.affinities?.speed || 0,
        power: creature.affinities?.power || 0,
        endurance: creature.affinities?.endurance || 0
      },
      dominantAffinity: getDominantAffinity(creature.affinities),
      unlockedTraits: creature.unlockedTraits || [],
      longestStreak: creature.longestStreak || 0,
      totalDaysFed: creature.totalDaysFed || 0
    }

    // Update collection
    collection.creatures.push(entry)
    collection.releasedCount = collection.creatures.length
    collection.legacyBonus = Math.min(
      MAX_LEGACY_BONUS,
      collection.releasedCount * LEGACY_BONUS_PER_CREATURE
    )

    // Save collection
    const saved = saveCollection(collection)
    if (!saved) {
      return { success: false, error: 'Failed to save collection' }
    }

    return {
      success: true,
      collection: collection,
      entry: entry
    }
  } catch (e) {
    return { success: false, error: 'Release failed' }
  }
}

/**
 * Calculate the legacy XP multiplier for use in XP calculations
 * @returns {number} Multiplier (1.0 to 1.25)
 */
export function getLegacyMultiplier() {
  const bonus = getLegacyBonus()
  return 1 + (bonus / 100)
}
