export type AppNotification = {
   id: string
   title: string
   description?: string
   type?: 'info' | 'error' | 'success'
}

const DISMISS_AFTER_MS = 4000

export default defineNuxtPlugin(() => {
   const notifications = useState<AppNotification[]>('app-notifications', () => [])

   const remove = (id: string) => {
      notifications.value = notifications.value.filter((notification) => notification.id !== id)
   }

   const add = ({ title, description, type = 'info' }: Omit<AppNotification, 'id'>) => {
      const notification: AppNotification = { id: crypto.randomUUID(), title, description, type }
      notifications.value = [...notifications.value, notification]
      setTimeout(() => remove(notification.id), DISMISS_AFTER_MS)
   }

   return {
      provide: {
         notification: { add, remove },
      },
   }
})
