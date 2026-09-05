import { Notification } from 'electron'
import type { Reminder } from '../shared/types'

type ActivationHandler = () => void

let activationHandler: ActivationHandler = () => undefined

export function setNotificationActivationHandler(handler: ActivationHandler): void {
  activationHandler = handler
}

export function showReminderNotification(reminder: Reminder): void {
  if (!Notification.isSupported()) return

  const body = reminder.note
    ? `${reminder.note}\n(${new Date(reminder.dueAt).toLocaleString()})`
    : new Date(reminder.dueAt).toLocaleString()

  const notification = new Notification({
    title: reminder.title,
    body,
    silent: false
  })

  notification.on('click', () => activationHandler())
  notification.show()
}
