<template>
   <main
      class="flex grow flex-col"
      :class="theater ? 'h-dvh w-full overflow-hidden' : '__center __wide gap-4 pb-4'"
   >
      <template v-if="status === 'connecting' || status === 'idle'">
         <div class="flex grow flex-col items-center justify-center gap-4 py-24 text-center">
            <Icon name="heroicons:arrow-path" class="size-8 animate-spin text-white/60" />
            <p class="font-title text-lg text-white/60">Connecting to the room…</p>
         </div>
      </template>

      <template v-else-if="status === 'error'">
         <div class="flex grow flex-col items-center justify-center gap-6 py-24 text-center">
            <div class="space-y-2">
               <p class="font-title text-3xl font-bold text-white">Room not found</p>
               <p class="mx-auto max-w-md text-white/40">
                  This room does not exist anymore, or the link is wrong. Rooms live only while
                  their host is online.
               </p>
            </div>
            <Button @click="peer.createRoom()">Create room</Button>
         </div>
      </template>

      <template v-else>
         <div
            v-if="status === 'host-left'"
            class="border-candy-apple-red/40 bg-candy-apple-red/10 flex items-center justify-between gap-4 rounded-2xl border px-5 py-3"
         >
            <p class="text-sm text-white/80">
               The host left, so the room is closed. You can keep watching, but nothing is synced
               anymore.
            </p>
            <Button @click="peer.leaveRoom()">Leave</Button>
         </div>

         <div
            :class="
               theater
                  ? 'flex min-h-0 flex-1 flex-col'
                  : 'grid gap-4 lg:h-[calc(100dvh-6.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]'
            "
         >
            <Player
               :videoState="peer.data.videoState.value"
               :theater="theater"
               :chatOpen="overlayOpen"
               :unread="unreadCount"
               @seek="handleSeek"
               @play-pause="handlePlayPause"
               @rate="handleRate"
               @next="handleNext"
               @prev="handlePrev"
               @ended="handleEnded"
               @toggle-theater="theater = !theater"
               @toggle-chat="overlayOpen = !overlayOpen"
            />
            <RoomSidebar
               v-if="!theater"
               :videoState="peer.data.videoState.value"
               @jump="handleJump"
               @remove="handleRemove"
            >
               <template #top>
                  <TextInput
                     dark
                     v-model="url"
                     @submit="handleAddToQueue"
                     placeholder="Paste a YouTube link"
                     :showSuggestion="!!videoId && !searchLoading"
                     :buttonDisabled="!videoId"
                     :buttonLoading="searchLoading"
                  >
                     <template #suggestion>
                        <SearchSuggestion
                           :search="searchResult"
                           :valid="!!searchResult"
                           @delete="handleDeleteSearch"
                           @add="handleAddToQueue"
                        />
                     </template>
                  </TextInput>
               </template>
            </RoomSidebar>
         </div>

         <template v-if="theater">
            <Transition
               enter-active-class="transition duration-200 ease-out"
               enter-from-class="translate-x-4 opacity-0"
               enter-to-class="translate-x-0 opacity-100"
               leave-active-class="transition duration-150 ease-in"
               leave-from-class="translate-x-0 opacity-100"
               leave-to-class="translate-x-4 opacity-0"
            >
               <div
                  v-show="overlayOpen"
                  ref="overlayPanel"
                  class="fixed top-4 right-4 bottom-4 z-40 w-[min(22rem,calc(100vw-2rem))]"
               >
                  <RoomSidebar
                     class="h-full shadow-2xl ring-1 ring-white/10"
                     :videoState="peer.data.videoState.value"
                     :visible="overlayOpen"
                     closable
                     @close="overlayOpen = false"
                     @jump="handleJump"
                     @remove="handleRemove"
                  >
                     <template #top>
                        <TextInput
                           dark
                           v-model="url"
                           @submit="handleAddToQueue"
                           placeholder="Paste a YouTube link"
                           :showSuggestion="!!videoId && !searchLoading"
                           :buttonDisabled="!videoId"
                           :buttonLoading="searchLoading"
                        >
                           <template #suggestion>
                              <SearchSuggestion
                                 :search="searchResult"
                                 :valid="!!searchResult"
                                 @delete="handleDeleteSearch"
                                 @add="handleAddToQueue"
                              />
                           </template>
                        </TextInput>
                     </template>
                  </RoomSidebar>
               </div>
            </Transition>
         </template>
      </template>
   </main>
</template>

<script lang="ts" setup>
import type { VideoInfo } from '~/utils/youtube'

const route = useRoute()
const peer = usePeer()

const url = ref<string>('')
const searchLoading = ref<boolean>(false)
const searchResult = ref<VideoInfo>()

// viewing preference, local to this peer (not synced)
const theater = useLocalStorage<boolean>('streamy-theater', false)
const overlayOpen = ref<boolean>(false)
const overlayPanel = ref<HTMLDivElement>()

// the toggle button is ignored or its click would close and instantly reopen the panel
onClickOutside(
   overlayPanel,
   () => {
      overlayOpen.value = false
   },
   { ignore: ['#theater-chat-toggle'] }
)

const unreadCount = computed(() =>
   Math.max(0, peer.data.chatMessages.value.length - peer.data.chatReadCount.value)
)

const currentTitle = computed(() => {
   const state = peer.data.videoState.value
   return state.queue[state.queueIdx]?.title
})

useHead({ title: () => currentTitle.value || null })

const status = computed(() => peer.data.connectionStatus.value)
const videoId = computed(() => extractYouTubeId(url.value))

watch(url, async (curr) => {
   searchResult.value = undefined
   if (!extractYouTubeId(curr)) return
   searchLoading.value = true
   searchResult.value = await debouncedLookup(curr)
})

const debouncedLookup = useDebounceFn(async (url: string) => {
   try {
      return await fetchVideoInfo(url)
   } finally {
      searchLoading.value = false
   }
}, 500)

const handleDeleteSearch = () => {
   url.value = ''
   searchResult.value = undefined
}

const handleAddToQueue = async () => {
   const id = videoId.value
   if (!id) return

   const pendingUrl = url.value
   let item = searchResult.value
   url.value = ''
   searchResult.value = undefined

   // submitted before the debounced lookup resolved: fetch the title now
   if (!item || item.id !== id) {
      item = (await fetchVideoInfo(pendingUrl)) ?? fallbackVideoInfo(id)
   }

   peer.sendMessage({ type: 'queue', command: { type: 'add', item } })
}

const handlePlayPause = (timestamp: number, type: 'play' | 'pause') => {
   peer.sendMessage({ type: 'player', command: { type, timestamp } })
}

const handleRate = (rate: number) => {
   peer.sendMessage({ type: 'player', command: { type: 'rate', rate } })
}

const handleSeek = (timestamp: number) => {
   peer.sendMessage({ type: 'player', command: { type: 'seek', timestamp } })
}

const handleNext = () => {
   peer.sendMessage({ type: 'queue', command: { type: 'next' } })
}

const handlePrev = () => {
   peer.sendMessage({ type: 'queue', command: { type: 'prev' } })
}

const handleJump = (index: number) => {
   peer.sendMessage({ type: 'queue', command: { type: 'jump', index } })
}

const handleRemove = (index: number) => {
   peer.sendMessage({ type: 'queue', command: { type: 'remove', index } })
}

const handleEnded = () => {
   // a single peer advances the queue for everyone, or each peer would skip one video
   if (!peer.data.isHost.value) return
   handleNext()
}

onMounted(() => {
   if (peer.data.isHost.value) return
   peer.joinRoom(route.params.id as string)
})

// leaving the page means leaving the room, for host and guests alike — except when
// the navigation itself targets the room we just created from this page
onBeforeRouteLeave((to) => {
   if (to.params.id && to.params.id === peer.data.roomId.value) return
   peer.disconnect()
})
</script>
