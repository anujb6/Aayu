import * as hmUI from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { back } from '@zos/router'
import { onGesture, offGesture, GESTURE_RIGHT } from '@zos/interaction'
import {
  getReminderSettings,
  scheduleReminder,
  cancelReminder,
  formatTime,
  isReminderEnabled
} from '../../lib/reminder'

let W = 480
let H = 480
try {
  const info = getDeviceInfo()
  W = info.width || 480
  H = info.height || 480
} catch (e) {}

const CX = Math.round(W / 2)

function px(val) {
  return Math.round(val * W / 480)
}

const COLORS = {
  bgDark: 0x08080c,
  bgCard: 0x1a1a2e,
  bgCardActive: 0x1a3a2a,
  textPrimary: 0xFFFFFF,
  textSecondary: 0xB0B0C0,
  textMuted: 0x606070,
  success: 0x4CAF50,
  successDark: 0x2E7D32,
  accent: 0x00BFFF,
  accentDark: 0x005580,
  warning: 0xFF9800,
  border: 0x333344,
  toggleOff: 0x444455,
  toggleOn: 0x4CAF50
}

// Available reminder times
const REMINDER_TIMES = [
  { hour: 8, minute: 0, label: '8:00 AM' },
  { hour: 12, minute: 0, label: '12:00 PM' },
  { hour: 18, minute: 0, label: '6:00 PM' },
  { hour: 20, minute: 0, label: '8:00 PM' },
  { hour: 21, minute: 0, label: '9:00 PM' }
]

let widgets = []
let settings = null
let selectedTimeIndex = 3 // Default to 8 PM

Page({
  onInit() {
    settings = getReminderSettings()
    // Find the matching time index
    for (let i = 0; i < REMINDER_TIMES.length; i++) {
      if (REMINDER_TIMES[i].hour === settings.hour && REMINDER_TIMES[i].minute === settings.minute) {
        selectedTimeIndex = i
        break
      }
    }
  },

  build() {
    this.setupGestures()
    this.buildUI()
  },

  onDestroy() {
    offGesture()
    this.cleanup()
  },

  setupGestures() {
    onGesture({
      callback: (event) => {
        if (event === GESTURE_RIGHT) {
          back()
          return true
        }
        return false
      }
    })
  },

  buildUI() {
    // Background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: H, color: COLORS.bgDark
    }))

    let y = px(40)

    // Title
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: y, w: W, h: px(40),
      text: 'SETTINGS',
      text_size: px(24),
      color: COLORS.textPrimary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    }))

    y += px(60)

    // Reminder Section Header
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(30), y: y, w: W - px(60), h: px(30),
      text: 'Daily Reminder',
      text_size: px(18),
      color: COLORS.accent,
      align_h: hmUI.align.LEFT,
      align_v: hmUI.align.CENTER_V
    }))

    y += px(40)

    // Reminder description
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(30), y: y, w: W - px(60), h: px(40),
      text: 'Get notified if you haven\'t\nfed your creature today',
      text_size: px(14),
      color: COLORS.textMuted,
      align_h: hmUI.align.LEFT,
      align_v: hmUI.align.TOP
    }))

    y += px(50)

    // Enable/Disable Toggle Card
    this.buildToggleCard(y)
    y += px(80)

    // Time Selection (only show if enabled)
    if (settings.enabled) {
      this.buildTimeSelector(y)
    }

    // Page indicator dot
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - px(4),
      y: H - px(25),
      w: px(8),
      h: px(8),
      radius: px(4),
      color: COLORS.textSecondary
    }))
  },

  buildToggleCard(y) {
    const cardW = W - px(60)
    const cardH = px(60)
    const cardX = px(30)

    // Card background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX, y: y, w: cardW, h: cardH,
      radius: px(12),
      color: settings.enabled ? COLORS.bgCardActive : COLORS.bgCard
    }))

    // Label
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX + px(15), y: y, w: cardW - px(80), h: cardH,
      text: 'Enable Reminder',
      text_size: px(16),
      color: COLORS.textPrimary,
      align_h: hmUI.align.LEFT,
      align_v: hmUI.align.CENTER_V
    }))

    // Toggle indicator
    const toggleW = px(50)
    const toggleH = px(28)
    const toggleX = cardX + cardW - toggleW - px(15)
    const toggleY = y + (cardH - toggleH) / 2

    // Toggle background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: toggleX, y: toggleY, w: toggleW, h: toggleH,
      radius: px(14),
      color: settings.enabled ? COLORS.toggleOn : COLORS.toggleOff
    }))

    // Toggle knob
    const knobSize = px(22)
    const knobX = settings.enabled ? toggleX + toggleW - knobSize - px(3) : toggleX + px(3)
    const knobY = toggleY + px(3)

    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: knobX, y: knobY, w: knobSize, h: knobSize,
      radius: px(11),
      color: COLORS.textPrimary
    }))

    // Invisible button for tap
    widgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
      x: cardX, y: y, w: cardW, h: cardH,
      text: '',
      press_color: 0x333344,
      normal_color: 0x00000000,
      click_func: () => {
        this.toggleReminder()
      }
    }))
  },

  buildTimeSelector(y) {
    // Section header
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(30), y: y, w: W - px(60), h: px(30),
      text: 'Reminder Time',
      text_size: px(16),
      color: COLORS.textSecondary,
      align_h: hmUI.align.LEFT,
      align_v: hmUI.align.CENTER_V
    }))

    y += px(40)

    // Time options
    const optionH = px(45)
    const optionW = W - px(60)

    for (let i = 0; i < REMINDER_TIMES.length; i++) {
      const time = REMINDER_TIMES[i]
      const isSelected = i === selectedTimeIndex
      const optionY = y + i * (optionH + px(8))

      // Option background
      widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(30), y: optionY, w: optionW, h: optionH,
        radius: px(10),
        color: isSelected ? COLORS.accentDark : COLORS.bgCard
      }))

      // Time label
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(45), y: optionY, w: optionW - px(60), h: optionH,
        text: time.label,
        text_size: px(16),
        color: isSelected ? COLORS.textPrimary : COLORS.textSecondary,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V
      }))

      // Checkmark for selected
      if (isSelected) {
        widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(30) + optionW - px(40), y: optionY, w: px(30), h: optionH,
          text: '✓',
          text_size: px(18),
          color: COLORS.success,
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V
        }))
      }

      // Invisible button
      const index = i
      widgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(30), y: optionY, w: optionW, h: optionH,
        text: '',
        press_color: 0x333344,
        normal_color: 0x00000000,
        click_func: () => {
          this.selectTime(index)
        }
      }))
    }
  },

  toggleReminder() {
    if (settings.enabled) {
      // Disable reminder
      cancelReminder()
      settings.enabled = false
    } else {
      // Enable reminder with selected time
      const time = REMINDER_TIMES[selectedTimeIndex]
      const success = scheduleReminder(time.hour, time.minute)
      if (success) {
        settings.enabled = true
        settings.hour = time.hour
        settings.minute = time.minute
      }
    }
    this.rebuildUI()
  },

  selectTime(index) {
    if (index === selectedTimeIndex) return

    selectedTimeIndex = index
    const time = REMINDER_TIMES[index]

    // Reschedule with new time
    if (settings.enabled) {
      const success = scheduleReminder(time.hour, time.minute)
      if (success) {
        settings.hour = time.hour
        settings.minute = time.minute
      }
    }

    this.rebuildUI()
  },

  rebuildUI() {
    this.cleanup()
    this.buildUI()
  },

  cleanup() {
    widgets.forEach(w => {
      try { hmUI.deleteWidget(w) } catch (e) {}
    })
    widgets = []
  }
})
