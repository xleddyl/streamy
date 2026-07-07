<template>
   <div class="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-2">
      <TransitionGroup
         enter-active-class="transition duration-200 ease-out"
         enter-from-class="translate-y-2 opacity-0"
         enter-to-class="translate-y-0 opacity-100"
         leave-active-class="transition duration-150 ease-in"
         leave-from-class="opacity-100"
         leave-to-class="opacity-0"
      >
         <div
            v-for="notification in notifications"
            :key="notification.id"
            class="__glass bg-charleston-green/90 pointer-events-auto w-full max-w-sm rounded-2xl border px-4 py-3 shadow-lg"
            :class="borderColor(notification)"
            role="status"
            @click="$notification.remove(notification.id)"
         >
            <p class="font-title text-sm font-semibold text-white">{{ notification.title }}</p>
            <p v-if="notification.description" class="mt-0.5 text-sm text-white/50">
               {{ notification.description }}
            </p>
         </div>
      </TransitionGroup>
   </div>
</template>

<script lang="ts" setup>
import type { AppNotification } from '~/plugins/01.notification'

const { $notification } = useNuxtApp()
const notifications = useState<AppNotification[]>('app-notifications', () => [])

const borderColor = (notification: AppNotification) => {
   switch (notification.type) {
      case 'error': {
         return 'border-candy-apple-red/50'
      }
      case 'success': {
         return 'border-green-400/40'
      }
      default: {
         return 'border-white/10'
      }
   }
}
</script>
