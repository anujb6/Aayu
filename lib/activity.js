import { Step, Distance, HeartRate, Calorie, FatBurning } from '@zos/sensor'
import { log } from '@zos/utils'

const logger = log.getLogger('activity')

export const DEFAULT_STEP_GOAL = 8000

let stepSensor = null
let distanceSensor = null
let heartRateSensor = null
let calorieSensor = null
let fatBurnSensor = null

function initSensors() {
  try {
    if (!stepSensor) stepSensor = new Step()
    if (!distanceSensor) distanceSensor = new Distance()
    if (!heartRateSensor) heartRateSensor = new HeartRate()
    if (!calorieSensor) calorieSensor = new Calorie()
    if (!fatBurnSensor) fatBurnSensor = new FatBurning()
  } catch (e) {
    logger.log('Error initializing sensors: ' + e)
  }
}

export function getSteps() {
  try {
    initSensors()
    return stepSensor ? stepSensor.getCurrent() : 0
  } catch (e) {
    return 0
  }
}

export function getStepTarget() {
  try {
    initSensors()
    return stepSensor ? (stepSensor.getTarget() || DEFAULT_STEP_GOAL) : DEFAULT_STEP_GOAL
  } catch (e) {
    return DEFAULT_STEP_GOAL
  }
}

export function getDistance() {
  try {
    initSensors()
    const meters = distanceSensor ? distanceSensor.getCurrent() : 0
    return meters / 1000
  } catch (e) {
    return 0
  }
}

export function getHeartRate() {
  try {
    initSensors()
    return heartRateSensor ? heartRateSensor.getLast() : 0
  } catch (e) {
    return 0
  }
}

export function getCalories() {
  try {
    initSensors()
    return calorieSensor ? calorieSensor.getCurrent() : 0
  } catch (e) {
    return 0
  }
}

export function getFatBurnMinutes() {
  try {
    initSensors()
    return fatBurnSensor ? fatBurnSensor.getCurrent() : 0
  } catch (e) {
    return 0
  }
}

export function collectActivityData() {
  const steps = getSteps()
  const distance = getDistance()
  const heartRate = getHeartRate()
  const calories = getCalories()
  const fatBurnMinutes = getFatBurnMinutes()
  const stepTarget = getStepTarget()

  return {
    steps,
    distance: Math.round(distance * 10) / 10,
    avgHeartRate: heartRate,
    peakHeartRate: heartRate,
    activeMinutes: fatBurnMinutes,
    calories,
    goalsMet: steps >= stepTarget,
    timestamp: Date.now()
  }
}

export function createDailyEntry(workoutType = null) {
  const data = collectActivityData()
  const date = new Date()

  return {
    date: date.toISOString().split('T')[0],
    steps: data.steps,
    distance: data.distance,
    activeMinutes: data.activeMinutes,
    avgHeartRate: data.avgHeartRate,
    peakHeartRate: data.peakHeartRate,
    workoutType: workoutType,
    goalsMet: data.goalsMet,
    lifeForceEarned: calculateLifeForce(data)
  }
}

export function calculateLifeForce(activity) {
  let lifeForce = 0
  lifeForce += Math.min(100, Math.floor((activity.steps || 0) / 100))
  lifeForce += Math.min(50, Math.floor((activity.distance || 0) * 5))
  lifeForce += Math.min(60, activity.activeMinutes || 0)

  if (activity.peakHeartRate > 140) {
    lifeForce += 20
  } else if (activity.peakHeartRate > 120) {
    lifeForce += 10
  }

  if (activity.goalsMet) {
    lifeForce += 25
  }

  return Math.round(lifeForce)
}

export function applyStreakBonus(baseLifeForce, streak) {
  let multiplier = 1.0
  if (streak >= 30) {
    multiplier = 1.25
  } else if (streak >= 7) {
    multiplier = 1.10
  }
  return Math.round(baseLifeForce * multiplier)
}

export function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

export function isToday(dateString) {
  return dateString === getTodayDate()
}

export function getGoalProgress() {
  const steps = getSteps()
  const target = getStepTarget()
  return Math.min(100, Math.round((steps / target) * 100))
}

export default {
  DEFAULT_STEP_GOAL,
  getSteps,
  getStepTarget,
  getDistance,
  getHeartRate,
  getCalories,
  getFatBurnMinutes,
  collectActivityData,
  createDailyEntry,
  calculateLifeForce,
  applyStreakBonus,
  getTodayDate,
  isToday,
  getGoalProgress
}
