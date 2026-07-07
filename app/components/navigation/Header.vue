<template>
   <header
      v-if="!(inRoom && theater)"
      class="__center flex items-center justify-between gap-4 py-5"
      :class="{ __wide: inRoom }"
   >
      <div class="flex min-w-0 items-center gap-4">
         <NuxtLink class="__clickable shrink-0" to="/">
            <Logotype class="h-8 w-32 fill-current text-white" />
         </NuxtLink>
         <div
            v-if="inRoom"
            class="bg-charleston-green font-title flex items-center gap-2 rounded-full py-1.5 pr-4 pl-3 text-sm text-white/60"
            :title="peer.data.participants.value.join(', ')"
         >
            <span class="relative flex size-2">
               <span
                  v-if="statusInfo.pulse"
                  class="absolute inline-flex size-full animate-ping rounded-full opacity-60"
                  :class="statusInfo.color"
               />
               <span class="relative inline-flex size-2 rounded-full" :class="statusInfo.color" />
            </span>
            <span class="truncate">{{ statusInfo.label }}</span>
            <span
               v-if="peer.data.connectionStatus.value === 'connected'"
               class="text-white/30 max-md:hidden"
            >
               · {{ peer.data.participants.value.length }} watching
            </span>
         </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
         <template v-if="!inRoom">
            <Button @click="peer.createRoom()">Create room</Button>
         </template>
         <template v-else>
            <Button type="icon" title="Share" @click="handleShareRoom">
               <div class="flex items-center gap-2">
                  <Icon name="heroicons:link" class="size-5" />
                  <span class="max-md:hidden">Share</span>
               </div>
            </Button>
            <Button type="icon" title="Leave" @click="peer.leaveRoom()">
               <Icon name="heroicons:arrow-left-start-on-rectangle" class="size-5" />
            </Button>
         </template>
      </div>
   </header>
</template>

<script lang="ts" setup>
import { useClipboard } from '@vueuse/core'
import Logotype from '~/assets/icons/logotype.svg'

const peer = usePeer()
const route = useRoute()
const { $notification } = useNuxtApp()
const { copy } = useClipboard()

const inRoom = computed(() => !!route.params.id)
const theater = useLocalStorage<boolean>('streamy-theater', false)

const statusInfo = computed(() => {
   if (peer.data.isHost.value) {
      return { label: 'Hosting', color: 'bg-candy-apple-red', pulse: true }
   }
   switch (peer.data.connectionStatus.value) {
      case 'connected': {
         return { label: 'Connected', color: 'bg-green-400', pulse: false }
      }
      case 'connecting':
      case 'idle': {
         return { label: 'Connecting', color: 'bg-yellow-400', pulse: true }
      }
      default: {
         return { label: 'Disconnected', color: 'bg-white/30', pulse: false }
      }
   }
})

const handleShareRoom = async () => {
   await copy(window.location.href)
   $notification.add({
      title: 'Link copied to clipboard!',
      description: "It's time to share it with your friends!",
   })
}
</script>
