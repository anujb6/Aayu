// Evolution System Module for FitBlob
// Centralizes evolution thresholds, stage names, and evolution logic

import { getShapeType } from './shapes'
import { getDaysInStage, getDateString } from './creature'

/**
 * Stage names for display
 */
export const STAGE_NAMES = {
  1: 'Egg',
  2: 'Hatchling',
  3: 'Juvenile',
  4: 'Mature',
  5: 'Apex',
  6: 'Transcendent'
}

/**
 * XP thresholds required to evolve from each stage
 * Stage 6 (Transcendent) has no threshold - it's max level
 */
export const EVOLUTION_THRESHOLDS = {
  1: 50,
  2: 200,
  3: 500,
  4: 1200,
  5: 3000,
  6: null
}

/**
 * Minimum days required in each stage before evolution
 */
export const MIN_DAYS_PER_STAGE = {
  1: 1,
  2: 3,
  3: 5,
  4: 7,
  5: 10,
  6: 0
}

/**
 * Stage size multipliers for blob rendering
 */
export const STAGE_SIZES = {
  1: 0.5,
  2: 0.65,
  3: 0.8,
  4: 1.0,
  5: 1.15,
  6: 1.3
}

/**
 * Get dominant affinity type from affinities object
 * @param {object} affinities - { speed, power, endurance }
 * @returns {string} 'speed' | 'power' | 'endurance' | 'balanced'
 */
export function getDominantAffinity(affinities) {
  if (!affinities) return 'balanced'

  const { speed, power, endurance } = affinities
  const max = Math.max(speed, power, endurance)
  const threshold = max - 10 // Within 10 points is considered tied

  const dominant = []
  if (speed >= threshold) dominant.push('speed')
  if (power >= threshold) dominant.push('power')
  if (endurance >= threshold) dominant.push('endurance')

  if (dominant.length === 1) return dominant[0]
  return 'balanced' // Multiple or all tied
}

/**
 * Calculate streak bonus multiplier
 * @param {number} streak - Current streak in days
 * @returns {number} Bonus multiplier (1.0, 1.1, or 1.25)
 */
export function getStreakBonus(streak) {
  if (streak >= 30) return 1.25 // +25% for 30+ day streak
  if (streak >= 7) return 1.10  // +10% for 7+ day streak
  return 1.0 // No bonus
}

/**
 * Apply streak bonus to XP
 * @param {number} baseXP - Base XP amount
 * @param {number} streak - Current streak
 * @returns {number} XP with bonus applied
 */
export function applyStreakBonus(baseXP, streak) {
  return Math.round(baseXP * getStreakBonus(streak))
}

/**
 * Check if creature meets evolution requirements
 * @param {object} creature - Creature object
 * @returns {object} { canEvolve: bool, xpMet: bool, daysMet: bool, xpNeeded: num, daysNeeded: num, daysInStage: num }
 */
export function checkEvolutionRequirements(creature) {
  if (creature.stage >= 6) {
    return {
      canEvolve: false,
      xpMet: true,
      daysMet: true,
      xpNeeded: 0,
      daysNeeded: 0,
      daysInStage: getDaysInStage(creature),
      isMaxLevel: true
    }
  }

  const threshold = EVOLUTION_THRESHOLDS[creature.stage]
  const minDays = MIN_DAYS_PER_STAGE[creature.stage]
  const daysInStage = getDaysInStage(creature)

  const xpMet = creature.currentStageXP >= threshold
  const daysMet = daysInStage >= minDays

  return {
    canEvolve: xpMet && daysMet,
    xpMet,
    daysMet,
    xpNeeded: threshold,
    daysNeeded: minDays,
    daysInStage,
    isMaxLevel: false
  }
}

/**
 * Check if creature can evolve
 * @param {object} creature - Creature object
 * @returns {boolean} True if evolution is possible
 */
export function canEvolve(creature) {
  return checkEvolutionRequirements(creature).canEvolve
}

/**
 * Perform evolution on creature
 * Records history, increments stage, resets stage XP and stageStartDate
 * @param {object} creature - Creature object
 * @returns {object} { evolved: bool, oldStage: num, newStage: num, historyEntry: string }
 */
export function evolve(creature) {
  if (!canEvolve(creature)) {
    return {
      evolved: false,
      oldStage: creature.stage,
      newStage: creature.stage,
      historyEntry: null
    }
  }

  const oldStage = creature.stage
  const dominantAffinity = getDominantAffinity(creature.affinities)
  const threshold = EVOLUTION_THRESHOLDS[creature.stage]

  // Record evolution history
  creature.evolutionHistory = creature.evolutionHistory || []
  const historyEntry = `${dominantAffinity}_${creature.stage}`
  creature.evolutionHistory.push(historyEntry)

  // Evolve - carry over excess XP to new stage
  creature.stage++
  creature.currentStageXP = Math.max(0, creature.currentStageXP - threshold)
  // Reset stageStartDate to today for the new stage (daysInStage will now calculate from this)
  creature.stageStartDate = getDateString()

  return {
    evolved: true,
    oldStage,
    newStage: creature.stage,
    historyEntry
  }
}

/**
 * Get evolution progress percentage
 * @param {object} creature - Creature object
 * @returns {number} Progress percentage (0-100)
 */
export function getEvolutionProgress(creature) {
  if (creature.stage >= 6) return 100

  const threshold = EVOLUTION_THRESHOLDS[creature.stage]
  if (!threshold) return 100

  return Math.min(100, Math.round((creature.currentStageXP / threshold) * 100))
}

/**
 * Get days progress percentage
 * @param {object} creature - Creature object
 * @returns {number} Progress percentage (0-100)
 */
export function getDaysProgress(creature) {
  if (creature.stage >= 6) return 100

  const minDays = MIN_DAYS_PER_STAGE[creature.stage]
  if (!minDays) return 100

  const daysInStage = getDaysInStage(creature)
  return Math.min(100, Math.round((daysInStage / minDays) * 100))
}

/**
 * Get stage name for display
 * @param {number} stage - Stage number (1-6)
 * @returns {string} Stage name
 */
export function getStageName(stage) {
  return STAGE_NAMES[stage] || 'Unknown'
}

/**
 * Get next stage name
 * @param {number} currentStage - Current stage number
 * @returns {string|null} Next stage name or null if at max
 */
export function getNextStageName(currentStage) {
  if (currentStage >= 6) return null
  return STAGE_NAMES[currentStage + 1]
}
