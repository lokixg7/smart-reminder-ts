import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react'

export type Language = 'en' | 'zh'

const STORAGE_KEY = 'smart-reminder.language'

const en = {
  headerSubtitle: 'Create reminders in plain language, get notified on time.',
  loading: 'Loading…',
  loadFailedPrefix: 'Failed to load: ',
  remindersTitle: 'Reminders',
  emptyTitle: 'No reminders yet',
  emptyHint: 'Create your first reminder in natural language.',
  tabAi: 'AI Natural Language',
  tabManual: 'Manual',
  aiPlaceholder: 'e.g. remind me to submit the weekly report every Friday at 3pm',
  aiParse: 'AI Parse',
  aiParsing: 'Parsing…',
  confirmAdd: 'Confirm Add',
  adding: 'Adding…',
  cancel: 'Cancel',
  manualTitlePlaceholder: 'Reminder title',
  manualAdd: 'Add Reminder',
  errorFillTitleAndTime: 'Please enter a title and a time.',
  errorInvalidTime: 'The reminder time is invalid.',
  enabled: 'Enabled',
  paused: 'Paused',
  deleteAction: 'Delete',
  deleteConfirm: 'Delete reminder "{title}"?',
  repeatNone: 'Once',
  repeatDaily: 'Daily',
  repeatWeekly: 'Weekly',
  repeatMonthly: 'Monthly',
  voiceBroadcast: 'Voice broadcast',
  launchAtLogin: 'Launch at login',
  launchNeedsApproval: 'Needs approval in System Settings',
  speakOnce: 'Read once',
  repeatEvery: 'Repeat every',
  minutesUnit: 'min',
  secondsUnit: 'sec',
  tabUpcoming: 'Upcoming',
  tabCompleted: 'Completed',
  noCompletedTitle: 'No completed reminders',
  noCompletedHint: 'Completed one-time reminders will appear here.',
  completedLabel: 'Completed',
  restoreAction: 'Restore',
  repeatLabel: 'Repeat',
  weekdaySame: 'Same as start date',
  weekdayMonday: 'Monday',
  weekdayTuesday: 'Tuesday',
  weekdayWednesday: 'Wednesday',
  weekdayThursday: 'Thursday',
  weekdayFriday: 'Friday',
  weekdaySaturday: 'Saturday',
  weekdaySunday: 'Sunday',
  advanceLabel: 'Remind earlier',
  earlyBadge: '{minutes} min early',
  editAction: 'Edit',
  saveAction: 'Save',
  saving: 'Saving…',
  notePlaceholder: 'Note (optional)'
} as const

export type MessageKey = keyof typeof en

const zh: Record<MessageKey, string> = {
  headerSubtitle: '用自然语言创建提醒，到点准时通知。',
  loading: '加载中…',
  loadFailedPrefix: '加载失败：',
  remindersTitle: '提醒列表',
  emptyTitle: '还没有提醒',
  emptyHint: '用 AI 自然语言创建第一个提醒吧',
  tabAi: 'AI 自然语言',
  tabManual: '手动添加',
  aiPlaceholder: '用自然语言描述，例如：每周五下午 3 点提醒我交周报',
  aiParse: 'AI 解析',
  aiParsing: 'AI 解析中…',
  confirmAdd: '确认添加',
  adding: '添加中…',
  cancel: '取消',
  manualTitlePlaceholder: '提醒内容',
  manualAdd: '添加提醒',
  errorFillTitleAndTime: '请填写标题和提醒时间。',
  errorInvalidTime: '提醒时间格式不正确。',
  enabled: '已开启',
  paused: '已暂停',
  deleteAction: '删除',
  deleteConfirm: '删除提醒“{title}”？',
  repeatNone: '单次',
  repeatDaily: '每天',
  repeatWeekly: '每周',
  repeatMonthly: '每月',
  voiceBroadcast: '语音播报',
  launchAtLogin: '开机启动',
  launchNeedsApproval: '需在系统设置中批准',
  speakOnce: '播报一次',
  repeatEvery: '每隔',
  minutesUnit: '分钟',
  secondsUnit: '秒',
  tabUpcoming: '待提醒',
  tabCompleted: '已完成',
  noCompletedTitle: '暂无已完成的提醒',
  noCompletedHint: '完成的单次提醒会保留在这里。',
  completedLabel: '已完成',
  restoreAction: '恢复',
  repeatLabel: '重复',
  weekdaySame: '同开始日期',
  weekdayMonday: '周一',
  weekdayTuesday: '周二',
  weekdayWednesday: '周三',
  weekdayThursday: '周四',
  weekdayFriday: '周五',
  weekdaySaturday: '周六',
  weekdaySunday: '周日',
  advanceLabel: '提前提醒',
  earlyBadge: '提前 {minutes} 分钟',
  editAction: '编辑',
  saveAction: '保存',
  saving: '保存中…',
  notePlaceholder: '备注（可选）'
}

const dictionaries: Record<Language, Record<MessageKey, string>> = { en, zh }

type TranslateParams = Record<string, string | number>

interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
  t: (key: MessageKey, params?: TranslateParams) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getInitialLanguage(): Language {
  if (typeof localStorage === 'undefined') return 'en'
  return localStorage.getItem(STORAGE_KEY) === 'zh' ? 'zh' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }): JSX.Element {
  const [language, setLanguage] = useState<Language>(getInitialLanguage)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const toggleLanguage = useCallback(() => {
    setLanguage((current) => (current === 'en' ? 'zh' : 'en'))
  }, [])

  const t = useCallback(
    (key: MessageKey, params?: TranslateParams) => {
      let text = dictionaries[language][key]
      if (!params) return text
      for (const [name, value] of Object.entries(params)) {
        text = text.replaceAll(`{${name}}`, String(value))
      }
      return text
    },
    [language]
  )

  return (
    <I18nContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
