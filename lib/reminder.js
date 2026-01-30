import { set, cancel, REPEAT_DAY } from '@zos/alarm'
import { Vibrator, VIBRATOR_SCENE_SHORT_MIDDLE } from '@zos/sensor'
import { showToast } from '@zos/interaction'
import { localStorage } from '@zos/storage'
import { log } from '@zos/utils'

const logger = log.getLogger('reminder')
const STORAGE_KEY = 'fitblob_reminder'

// Default reminder time: 8 PM (20:00)
const DEFAULT_HOUR = 20
const DEFAULT_MINUTE = 0

/**
 * Get reminder settings from storage
 */
export function getReminderSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    logger.log('Error reading reminder settings: ' + e)
  }

  // Default settings
  return {
    enabled: false,
    hour: DEFAULT_HOUR,
    minute: DEFAULT_MINUTE,
    alarmId: null
  }
}

/**
 * Save reminder settings to storage
 */
export function saveReminderSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    return true
  } catch (e) {
    logger.log('Error saving reminder settings: ' + e)
    return false
  }
}

/**
 * Calculate UTC timestamp for next occurrence of given time
 */
function getNextAlarmTime(hour, minute) {
  const now = new Date()
  const alarm = new Date()

  alarm.setHours(hour, minute, 0, 0)

  // If time already passed today, schedule for tomorrow
  if (alarm.getTime() <= now.getTime()) {
    alarm.setDate(alarm.getDate() + 1)
  }

  // Return UTC timestamp in seconds
  return Math.floor(alarm.getTime() / 1000)
}

/**
 * Schedule daily reminder
 */
export function scheduleReminder(hour = DEFAULT_HOUR, minute = DEFAULT_MINUTE) {
  try {
    const settings = getReminderSettings()

    // Cancel existing alarm if any
    if (settings.alarmId) {
      cancelReminder()
    }

    const alarmTime = getNextAlarmTime(hour, minute)

    const alarmId = set({
      url: 'page/home/index',
      time: alarmTime,
      repeat_type: REPEAT_DAY,
      param: 'reminder=true',
      store: true
    })

    if (alarmId && alarmId !== 0) {
      const newSettings = {
        enabled: true,
        hour: hour,
        minute: minute,
        alarmId: alarmId
      }
      const saved = saveReminderSettings(newSettings)
      if (!saved) {
        // Failed to save - cancel the alarm we just created
        try { cancel(alarmId) } catch (e) {}
        logger.log('Failed to save reminder settings')
        return false
      }
      logger.log('Reminder scheduled at ' + hour + ':' + minute + ' (ID: ' + alarmId + ')')
      return true
    } else {
      logger.log('Failed to schedule reminder')
      return false
    }
  } catch (e) {
    logger.log('Error scheduling reminder: ' + e)
    return false
  }
}

/**
 * Cancel daily reminder
 */
export function cancelReminder() {
  try {
    const settings = getReminderSettings()

    if (settings.alarmId) {
      cancel(settings.alarmId)
      logger.log('Reminder cancelled (ID: ' + settings.alarmId + ')')
    }

    const newSettings = {
      enabled: false,
      hour: settings.hour,
      minute: settings.minute,
      alarmId: null
    }
    saveReminderSettings(newSettings)
    return true
  } catch (e) {
    logger.log('Error cancelling reminder: ' + e)
    return false
  }
}

/**
 * Check if creature was fed today
 */
export function wasCreatureFedToday(creature) {
  if (!creature || !creature.lastFedDate) {
    return false
  }

  const today = new Date().toISOString().split('T')[0]
  return creature.lastFedDate === today
}

/**
 * Show reminder notification with vibration
 */
export function showReminderNotification(creatureName = 'Your creature') {
  try {
    // Vibrate
    const vibrator = new Vibrator()
    vibrator.setMode(VIBRATOR_SCENE_SHORT_MIDDLE)
    vibrator.start()

    // Stop vibration after a short delay
    setTimeout(() => {
      try {
        vibrator.stop()
      } catch (e) {}
    }, 1000)

    // Show toast message
    showToast({
      content: creatureName + ' is hungry!'
    })

    logger.log('Reminder notification shown')
    return true
  } catch (e) {
    logger.log('Error showing reminder: ' + e)
    return false
  }
}

/**
 * Handle reminder trigger - check if should show notification
 */
export function handleReminderTrigger(creature) {
  if (!wasCreatureFedToday(creature)) {
    const name = creature?.name || 'Your creature'
    showReminderNotification(name)
    return true
  }

  logger.log('Creature already fed today, skipping reminder')
  return false
}

/**
 * Format time for display (e.g., "8:00 PM")
 */
export function formatTime(hour, minute) {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  const displayMinute = minute.toString().padStart(2, '0')
  return displayHour + ':' + displayMinute + ' ' + period
}

/**
 * Check if reminders are enabled
 */
export function isReminderEnabled() {
  const settings = getReminderSettings()
  return settings.enabled && settings.alarmId !== null
}

export default {
  getReminderSettings,
  saveReminderSettings,
  scheduleReminder,
  cancelReminder,
  wasCreatureFedToday,
  showReminderNotification,
  handleReminderTrigger,
  formatTime,
  isReminderEnabled
}
