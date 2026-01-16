import { LocalStorage } from '@zos/storage'
import { log } from '@zos/utils'

const logger = log.getLogger('storage')
const localStorage = new LocalStorage()

const STORAGE_PREFIX = 'fitblob_'

export const storage = {
  get(key, defaultValue = null) {
    try {
      const fullKey = STORAGE_PREFIX + key
      const value = localStorage.getItem(fullKey)
      if (value === undefined || value === null) return defaultValue
      return typeof value === 'string' ? JSON.parse(value) : value
    } catch (e) {
      logger.log('Storage get error: ' + e)
      return defaultValue
    }
  },

  set(key, value) {
    try {
      const fullKey = STORAGE_PREFIX + key
      const serialized = JSON.stringify(value)
      localStorage.setItem(fullKey, serialized)
      return true
    } catch (e) {
      logger.log('Storage set error: ' + e)
      return false
    }
  },

  remove(key) {
    try {
      const fullKey = STORAGE_PREFIX + key
      localStorage.removeItem(fullKey)
      return true
    } catch (e) {
      logger.log('Storage remove error: ' + e)
      return false
    }
  },

  clear() {
    const keys = ['creature', 'activityLog', 'collection', 'settings']
    let success = true
    keys.forEach(key => {
      if (!this.remove(key)) success = false
    })
    return success
  }
}

export default storage
