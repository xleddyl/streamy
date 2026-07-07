<template>
   <aside
      class="bg-charleston-green flex min-h-[24rem] flex-col overflow-hidden rounded-2xl lg:min-h-0"
   >
      <div v-if="$slots.top" class="border-b border-white/5 p-3">
         <slot name="top" />
      </div>
      <div class="flex border-b border-white/5">
         <button
            v-for="tab in tabs"
            :key="tab.key"
            class="__clickable font-title relative flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors"
            :class="activeTab === tab.key ? 'text-white' : 'text-white/40'"
            @click="selectTab(tab.key)"
         >
            <Icon :name="tab.icon" class="size-4 shrink-0" />
            <span>{{ tab.label }}</span>
            <span
               v-if="tab.key === 'chat' && unreadCount > 0"
               class="bg-candy-apple-red rounded-full px-1.5 py-px font-sans text-[10px] font-semibold text-white"
            >
               {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
            <span
               v-if="activeTab === tab.key"
               class="bg-candy-apple-red absolute inset-x-8 bottom-0 h-0.5 rounded-full"
            />
         </button>
      </div>

      <Chat v-show="activeTab === 'chat'" :closable="closable" @close="emit('close')" />
      <Queue
         v-show="activeTab === 'queue'"
         :videoState="videoState"
         @jump="emit('jump', $event)"
         @remove="emit('remove', $event)"
      />
   </aside>
</template>

<script lang="ts" setup>
import type { VideoState } from '~/plugins/05.peer.client'

type Props = {
   videoState: VideoState
   // false when the sidebar is mounted but hidden (theater overlay closed):
   // messages arriving in that state must stay unread
   visible?: boolean
   closable?: boolean
}

type Emits = {
   jump: [number]
   remove: [number]
   close: []
}

const props = withDefaults(defineProps<Props>(), { visible: true })
const emit = defineEmits<Emits>()
const peer = usePeer()

const activeTab = ref<'chat' | 'queue'>('chat')
const readCount = peer.data.chatReadCount

const tabs = computed(() => [
   { key: 'chat' as const, icon: 'heroicons:chat-bubble-oval-left-ellipsis', label: 'Chat' },
   {
      key: 'queue' as const,
      icon: 'heroicons:queue-list',
      label: `Queue (${props.videoState.queue.length})`,
   },
])

const unreadCount = computed(() =>
   Math.max(0, peer.data.chatMessages.value.length - readCount.value)
)

const selectTab = (tab: 'chat' | 'queue') => {
   activeTab.value = tab
}

watch(
   [() => peer.data.chatMessages.value.length, () => props.visible, activeTab],
   ([length, visible, tab]) => {
      if (visible && tab === 'chat') readCount.value = length
   },
   { immediate: true }
)
</script>
