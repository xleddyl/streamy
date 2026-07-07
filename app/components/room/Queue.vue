<template>
   <div class="min-h-0 flex-1 overflow-y-auto">
      <p v-if="!videoState.queue.length" class="px-4 py-8 text-center text-sm text-white/25">
         The queue is empty
      </p>
      <ul v-else class="divide-y divide-white/5">
         <li
            v-for="(item, index) in videoState.queue"
            :key="`${item.id}-${index}`"
            class="group flex items-center gap-3 px-3 py-2.5"
            :class="index === videoState.queueIdx ? 'bg-white/5' : ''"
         >
            <button
               class="__clickable flex min-w-0 flex-1 items-center gap-3 text-left"
               @click="emit('jump', index)"
            >
               <div class="relative w-20 shrink-0 overflow-hidden rounded-lg">
                  <Image class="aspect-video w-full" :src="item.thumbnail" :alt="item.title" />
                  <div
                     v-if="index === videoState.queueIdx"
                     class="absolute inset-0 flex items-center justify-center bg-black/50"
                  >
                     <span class="bg-candy-apple-red size-2 animate-pulse rounded-full" />
                  </div>
               </div>
               <div class="min-w-0">
                  <p
                     class="line-clamp-2 text-sm"
                     :class="index === videoState.queueIdx ? 'text-white' : 'text-white/60'"
                  >
                     {{ item.title }}
                  </p>
                  <p
                     v-if="index === videoState.queueIdx"
                     class="font-title text-candy-apple-red-400 mt-0.5 text-xs font-medium"
                  >
                     Now playing
                  </p>
               </div>
            </button>
            <button
               class="__clickable shrink-0 text-white/25 transition-colors hover:text-white/70 md:opacity-0 md:group-hover:opacity-100"
               aria-label="Remove from queue"
               @click="emit('remove', index)"
            >
               <Icon name="heroicons:x-mark" class="size-4" />
            </button>
         </li>
      </ul>
   </div>
</template>

<script lang="ts" setup>
import type { VideoState } from '~/plugins/05.peer.client'

type Props = {
   videoState: VideoState
}

type Emits = {
   jump: [number]
   remove: [number]
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>
