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

// T-Rex 3 is 480x480 - use fixed values
const W = 480
const H = 480
const CX = 240
const CY = 240

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
    const margin = 24

    // Background
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: W, h: H, color: COLORS.bgDark
    }))

    let y = 25

    // Title
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: y, w: W, h: 32,
      text: 'SETTINGS',
      text_size: 24,
      color: COLORS.textPrimary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    }))

    y += 40

    // Reminder Section Header
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: margin, y: y, w: W - margin * 2, h: 24,
      text: 'Daily Reminder',
      text_size: 18,
      color: COLORS.accent,
      align_h: hmUI.align.LEFT,
      align_v: hmUI.align.CENTER_V
    }))

    y += 28

    // Reminder description
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: margin, y: y, w: W - margin * 2, h: 32,
      text: 'Get notified if you haven\'t\nfed your creature today',
      text_size: 14,
      color: COLORS.textMuted,
      align_h: hmUI.align.LEFT,
      align_v: hmUI.align.TOP
    }))

    y += 38

    // Enable/Disable Toggle Card
    this.buildToggleCard(y, margin)
    y += 58

    // Time Selection (only show if enabled)
    if (settings.enabled) {
      this.buildTimeSelector(y, margin)
    }

    // Page indicator dot
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: CX - 4,
      y: H - 20,
      w: 8,
      h: 8,
      radius: 4,
      color: COLORS.textSecondary
    }))
  },

  buildToggleCard(y, margin) {
    const cardX = margin
    const cardW = W - margin * 2  // 480 - 48 = 432
    const cardH = 50

    // BUTTON first (tappable background)
    widgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
      x: cardX, y: y, w: cardW, h: cardH,
      text: '',
      normal_color: settings.enabled ? COLORS.bgCardActive : COLORS.bgCard,
      press_color: settings.enabled ? 0x1a5a3a : 0x2a2a3e,
      radius: 12,
      click_func: () => this.toggleReminder()
    }))

    // Toggle dimensions
    const toggleW = 44
    const toggleH = 24
    const toggleX = cardX + cardW - toggleW - 12
    const toggleY = y + (cardH - toggleH) / 2

    // Label on top (width excludes toggle area)
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: cardX + 12, y: y, w: cardW - toggleW - 36, h: cardH,
      text: 'Enable Reminder',
      text_size: 16,
      color: COLORS.textPrimary,
      align_h: hmUI.align.LEFT,
      align_v: hmUI.align.CENTER_V
    }))

    // Toggle switch background (44x24)
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: toggleX, y: toggleY, w: toggleW, h: toggleH,
      radius: 12,
      color: settings.enabled ? COLORS.toggleOn : COLORS.toggleOff
    }))

    // Toggle knob (18x18)
    const knobSize = 18
    const knobX = settings.enabled ? toggleX + toggleW - knobSize - 3 : toggleX + 3
    widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: knobX, y: toggleY + 3, w: knobSize, h: knobSize,
      radius: 9,
      color: COLORS.textPrimary
    }))
  },

  buildTimeSelector(y, margin) {
    // Section header
    widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
      x: margin, y: y, w: W - margin * 2, h: 24,
      text: 'Reminder Time',
      text_size: 16,
      color: COLORS.textSecondary,
      align_h: hmUI.align.LEFT,
      align_v: hmUI.align.CENTER_V
    }))

    y += 28

    // Time options
    const optionH = 38
    const optionGap = 4
    const optionW = W - margin * 2

    for (let i = 0; i < REMINDER_TIMES.length; i++) {
      const time = REMINDER_TIMES[i]
      const isSelected = i === selectedTimeIndex
      const optionY = y + i * (optionH + optionGap)
      const index = i

      // BUTTON first (tappable background)
      widgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: margin, y: optionY, w: optionW, h: optionH,
        text: '',
        radius: 8,
        press_color: isSelected ? 0x006699 : 0x252540,
        normal_color: isSelected ? COLORS.accentDark : COLORS.bgCard,
        click_func: () => this.selectTime(index)
      }))

      // Time label on top
      widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
        x: margin + 12, y: optionY, w: optionW - 48, h: optionH,
        text: time.label,
        text_size: 16,
        color: isSelected ? COLORS.textPrimary : COLORS.textSecondary,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V
      }))

      // Checkmark for selected
      if (isSelected) {
        widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
          x: margin + optionW - 36, y: optionY, w: 24, h: optionH,
          text: '✓',
          text_size: 16,
          color: COLORS.success,
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V
        }))
      }
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
