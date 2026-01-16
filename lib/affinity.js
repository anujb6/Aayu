import { log } from '@zos/utils'

const logger = log.getLogger('affinity')

const WEIGHTS = {
  speed: { steps: 0.4, distance: 0.3, runningWorkout: 0.3 },
  power: { peakHeartRate: 0.4, highIntensityMinutes: 0.3, strengthWorkout: 0.3 },
  endurance: { streak: 0.4, goalsMet: 0.35, consistency: 0.25 }
}

const THRESHOLDS = {
  steps: { low: 3000, medium: 7000, high: 12000 },
  distance: { low: 2, medium: 5, high: 10 },
  peakHeartRate: { low: 100, medium: 140, high: 170 },
  activeMinutes: { low: 15, medium: 30, high: 60 }
}

export const WORKOUT_AFFINITY = {
  'running': { speed: 3, power: 1, endurance: 1 },
  'walking': { speed: 1, power: 0, endurance: 2 },
  'cycling': { speed: 2, power: 1, endurance: 2 },
  'swimming': { speed: 1, power: 2, endurance: 2 },
  'strength': { speed: 0, power: 3, endurance: 1 },
  'hiit': { speed: 2, power: 3, endurance: 1 },
  'yoga': { speed: 0, power: 1, endurance: 2 },
  'other': { speed: 1, power: 1, endurance: 1 }
}

function normalize(value, thresholds) {
  if (value <= thresholds.low) return value / thresholds.low * 0.33
  if (value <= thresholds.medium) return 0.33 + (value - thresholds.low) / (thresholds.medium - thresholds.low) * 0.33
  if (value <= thresholds.high) return 0.66 + (value - thresholds.medium) / (thresholds.high - thresholds.medium) * 0.34
  return 1.0
}

function calculateSpeedChange(activity) {
  let score = 0
  score += normalize(activity.steps || 0, THRESHOLDS.steps) * WEIGHTS.speed.steps
  score += normalize(activity.distance || 0, THRESHOLDS.distance) * WEIGHTS.speed.distance
  if (activity.workoutType === 'running' || activity.workoutType === 'cycling') {
    score += 0.3 * WEIGHTS.speed.runningWorkout
  }
  return (score - 0.5) * 10
}

function calculatePowerChange(activity) {
  let score = 0
  score += normalize(activity.peakHeartRate || 0, THRESHOLDS.peakHeartRate) * WEIGHTS.power.peakHeartRate
  score += normalize(activity.activeMinutes || 0, THRESHOLDS.activeMinutes) * WEIGHTS.power.highIntensityMinutes
  if (activity.workoutType === 'strength' || activity.workoutType === 'hiit') {
    score += 0.3 * WEIGHTS.power.strengthWorkout
  }
  return (score - 0.5) * 10
}

function calculateEnduranceChange(activity, currentStreak, goalMet) {
  let score = 0
  score += Math.min(1, Math.log10(currentStreak + 1) / 2) * WEIGHTS.endurance.streak
  if (goalMet) score += 0.5 * WEIGHTS.endurance.goalsMet
  score += 0.3 * WEIGHTS.endurance.consistency
  return (score - 0.3) * 10
}

function applyDiminishingReturns(change) {
  const maxChange = 5
  if (Math.abs(change) <= maxChange) return change
  const sign = change > 0 ? 1 : -1
  return sign * (maxChange + Math.log10(Math.abs(change) - maxChange + 1))
}

export function calculateAffinityChanges(activity, currentStreak) {
  const goalMet = activity.goalsMet || false
  let speedChange = calculateSpeedChange(activity)
  let powerChange = calculatePowerChange(activity)
  let enduranceChange = calculateEnduranceChange(activity, currentStreak, goalMet)

  const workoutBonus = WORKOUT_AFFINITY[activity.workoutType || 'other'] || WORKOUT_AFFINITY.other
  speedChange += workoutBonus.speed * 0.5
  powerChange += workoutBonus.power * 0.5
  enduranceChange += workoutBonus.endurance * 0.5

  return {
    speed: Math.round(applyDiminishingReturns(speedChange) * 10) / 10,
    power: Math.round(applyDiminishingReturns(powerChange) * 10) / 10,
    endurance: Math.round(applyDiminishingReturns(enduranceChange) * 10) / 10
  }
}

export function getAffinityDescription(type) {
  const descriptions = {
    speed: 'Movement & Cardio',
    power: 'Intensity & Strength',
    endurance: 'Consistency & Persistence'
  }
  return descriptions[type] || type
}

export function getAffinityColor(type) {
  const colors = { speed: 0x00BFFF, power: 0xFF6B35, endurance: 0x9B59B6 }
  return colors[type] || 0xFFFFFF
}

export default {
  calculateAffinityChanges,
  getAffinityDescription,
  getAffinityColor,
  THRESHOLDS,
  WORKOUT_AFFINITY
}
