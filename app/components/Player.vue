<template>
   <div class="flex w-full flex-col" :class="theater ? 'min-h-0 flex-1' : 'h-full gap-3'">
      <div
         class="overflow-hidden select-none"
         :class="
            theater ? 'min-h-0 flex-1' : 'rounded-2xl max-lg:aspect-video lg:min-h-0 lg:flex-1'
         "
      >
         <div class="bg-charleston-green relative size-full">
            <div
               v-if="!currentVideoId"
               class="bg-charleston-green absolute inset-0 z-10 flex flex-col items-center justify-center gap-2"
            >
               <Icon name="heroicons:queue-list" class="size-8 text-white/20" />
               <p class="text-sm text-white/30">Add a video to get started</p>
            </div>
            <div class="size-full" id="player" />
         </div>
      </div>
      <div
         class="flex items-start justify-between gap-4 max-md:flex-col md:gap-10"
         :class="theater ? 'px-4 py-1.5' : 'mx-1 md:mx-2'"
      >
         <p
            class="font-title font-semibold text-white"
            :class="theater ? 'text-sm md:text-base' : 'text-lg md:text-xl'"
         >
            {{ title }}
         </p>
         <div class="flex shrink-0 items-center gap-2">
            <Button :disabled="!currentVideoId" type="icon" @click="emit('prev')">
               <Icon name="heroicons:backward" :class="iconSize" />
            </Button>
            <Button
               :disabled="!currentVideoId"
               type="icon"
               @click="
                  emit(
                     'playPause',
                     player?.getCurrentTime() || 0,
                     videoState.isPlaying ? 'pause' : 'play'
                  )
               "
            >
               <Icon v-show="videoState.isPlaying" name="heroicons:pause" :class="iconSize" />
               <Icon v-show="!videoState.isPlaying" name="heroicons:play" :class="iconSize" />
            </Button>
            <Button :disabled="!currentVideoId" type="icon" @click="emit('next')">
               <Icon name="heroicons:forward" :class="iconSize" />
            </Button>
            <span class="mx-1 h-6 w-px bg-white/10 max-lg:hidden" />
            <Button
               type="icon"
               class="max-lg:hidden"
               :title="theater ? 'Exit theater mode' : 'Theater mode'"
               @click="emit('toggleTheater')"
            >
               <Icon
                  :name="theater ? 'heroicons:arrows-pointing-in' : 'heroicons:arrows-pointing-out'"
                  :class="iconSize"
               />
            </Button>
            <div v-if="theater" id="theater-chat-toggle" class="relative max-lg:hidden">
               <Button
                  type="icon"
                  :title="chatOpen ? 'Hide chat' : 'Show chat'"
                  @click="emit('toggleChat')"
               >
                  <Icon
                     :name="
                        chatOpen ? 'heroicons:x-mark' : 'heroicons:chat-bubble-oval-left-ellipsis'
                     "
                     :class="iconSize"
                  />
               </Button>
               <span
                  v-if="!chatOpen && unread > 0"
                  class="bg-candy-apple-red pointer-events-none absolute -top-1.5 -right-1.5 rounded-full px-1.5 py-px text-[10px] font-semibold text-white"
               >
                  {{ unread > 9 ? '9+' : unread }}
               </span>
            </div>
         </div>
      </div>
   </div>
</template>

<script lang="ts" setup>
import type { VideoState } from '~/plugins/05.peer.client'

type Props = {
   videoState: VideoState
   theater?: boolean
   chatOpen?: boolean
   unread?: number
}

type Emits = {
   seek: [number]
   playPause: [number, 'play' | 'pause']
   rate: [number]
   next: []
   prev: []
   ended: []
   toggleTheater: []
   toggleChat: []
}

const props = withDefaults(defineProps<Props>(), {})
const emit = defineEmits<Emits>()
const { $loadYouTubeIframeAPI } = useNuxtApp()
const peer = usePeer()

const player = ref<YT.Player>()
const playerReady = ref<boolean>(false)
const currentVideoId = ref<string>('')

// player events triggered by applying a remote command must not be re-emitted, or two
// peers ping-pong forever. YT events are async, so a boolean flag reset at the end of the
// watcher misses them: suppress by time window instead
let suppressUntil = 0
const SUPPRESS_MS = 1200
const suppressed = () => Date.now() < suppressUntil

const title = computed(() => props.videoState.queue[props.videoState.queueIdx]?.title ?? '')

// theater mode has a more discreet control bar
const iconSize = computed(() => (props.theater ? 'size-5' : 'size-6'))

watch(
   [() => props.videoState, () => playerReady.value],
   ([videoState, ready]) => {
      if (!ready || !player.value) return

      suppressUntil = Date.now() + SUPPRESS_MS

      const queuedId = videoState.queue[videoState.queueIdx]?.id ?? ''
      if (videoState.isReconnection || currentVideoId.value !== queuedId) {
         currentVideoId.value = queuedId
         if (!queuedId) {
            player.value.stopVideo()
            return
         }
         // cue (not load) when paused, so late joiners land paused at the right second
         const target = { videoId: queuedId, startSeconds: videoState.currentTime || 0 }
         if (videoState.isPlaying) {
            player.value.loadVideoById(target)
         } else {
            player.value.cueVideoById(target)
         }
         player.value.setPlaybackRate(videoState.rate)
      } else {
         switch (videoState.lastCommand) {
            case 'seek': {
               player.value.seekTo(videoState.currentTime, true)
               break
            }
            case 'play': {
               player.value.seekTo(videoState.currentTime, true)
               player.value.playVideo()
               break
            }
            case 'pause': {
               player.value.pauseVideo()
               break
            }
            case 'rate': {
               player.value.setPlaybackRate(videoState.rate)
               break
            }
         }
      }
   },
   { deep: true, immediate: true }
)

onMounted(async () => {
   peer.registerTimeProvider(() => player.value?.getCurrentTime() || 0)

   if (!player.value) {
      const YT = await $loadYouTubeIframeAPI()
      // a videoId key set to undefined makes the widget API throw "Invalid video id"
      const initialVideoId = props.videoState.queue[props.videoState.queueIdx]?.id
      player.value = new YT.Player('player', {
         host: 'https://www.youtube-nocookie.com',
         playerVars: {
            origin: window.location.origin,
            enablejsapi: 1,
            modestbranding: 1,
            autoplay: 1,
            hl: 'en',
         },
         ...(initialVideoId ? { videoId: initialVideoId } : {}),
         events: {
            onReady: () => {
               playerReady.value = true
            },
            onPlaybackRateChange: ({ data }) => {
               if (!playerReady.value || suppressed() || !player.value) return
               if (data === props.videoState.rate) return
               emit('rate', data)
            },
            onStateChange: (event: any) => {
               if (!playerReady.value || !player.value) return

               switch (event.data) {
                  case YT.PlayerState.UNSTARTED: {
                     if (props.videoState.isPlaying) player.value.playVideo()
                     break
                  }
                  case YT.PlayerState.ENDED: {
                     // only reported upward: the page lets a single peer (the host)
                     // advance the queue, otherwise every peer skips one video
                     emit('ended')
                     break
                  }
                  case YT.PlayerState.PLAYING:
                  case YT.PlayerState.PAUSED: {
                     const playing = event.data === YT.PlayerState.PLAYING
                     if (suppressed() || playing === props.videoState.isPlaying) return
                     emit(
                        'playPause',
                        player.value?.getCurrentTime() || 0,
                        playing ? 'play' : 'pause'
                     )
                     break
                  }
                  case YT.PlayerState.BUFFERING: {
                     if (suppressed()) return
                     emit('seek', player.value?.getCurrentTime() || 0)
                     break
                  }
               }
            },
         },
      })
   }
})
</script>
