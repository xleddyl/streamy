<template>
   <div class="flex min-h-0 flex-1 flex-col">
      <div class="flex items-center justify-between gap-2 border-b border-white/5 px-4 py-2.5">
         <div class="flex min-w-0 items-center gap-1.5 text-sm text-white/40">
            <template v-if="!editingName">
               <span class="shrink-0">watching as</span>
               <button
                  class="__clickable flex min-w-0 items-center gap-1.5 text-white/80"
                  @click="startEditName"
               >
                  <span class="font-title truncate font-medium">{{ peer.data.ownName.value }}</span>
                  <Icon name="heroicons:pencil" class="size-3.5 shrink-0 text-white/40" />
               </button>
            </template>
            <form v-else class="flex w-full items-center gap-2" @submit.prevent="confirmName">
               <input
                  ref="nameInput"
                  v-model="nameDraft"
                  maxlength="24"
                  class="bg-smoky-black w-full min-w-0 rounded-lg px-2 py-1 text-sm text-white outline-none"
                  @blur="confirmName"
                  @keyup.esc="editingName = false"
               />
            </form>
         </div>
         <div
            class="flex shrink-0 items-center gap-1.5 text-sm text-white/40"
            :title="peer.data.participants.value.join(', ')"
         >
            <Icon name="heroicons:users" class="size-4" />
            <span>{{ peer.data.participants.value.length }}</span>
         </div>
      </div>

      <div ref="list" class="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
         <p v-if="!messages.length" class="py-6 text-center text-sm text-white/25">
            No messages yet. Say hi!
         </p>
         <template v-for="message in messages" :key="message.id">
            <p v-if="message.system" class="text-center text-xs text-white/30">
               {{ message.text }}
            </p>
            <p v-else class="text-sm leading-relaxed break-words text-white/80">
               <span
                  class="font-title mr-1.5 font-semibold"
                  :class="{ 'text-candy-apple-red-400': message.own }"
                  :style="message.own ? undefined : { color: authorColor(message.author) }"
               >
                  {{ message.own ? 'you' : message.author }}
               </span>
               {{ message.text }}
            </p>
         </template>
      </div>

      <form class="border-t border-white/5 p-3" @submit.prevent="send">
         <div class="flex items-center gap-2">
            <button
               v-if="closable"
               type="button"
               title="Close"
               class="__clickable bg-smoky-black flex size-9 shrink-0 items-center justify-center rounded-xl text-white/40 transition-colors hover:text-white"
               @click="emit('close')"
            >
               <Icon name="heroicons:x-mark" class="size-5" />
            </button>
            <div class="relative flex-1">
               <input
                  v-model="draft"
                  maxlength="500"
                  class="bg-smoky-black w-full appearance-none rounded-xl py-2.5 pr-12 pl-4 text-sm text-white outline-none placeholder:text-white/25"
                  placeholder="Send a message"
               />
               <button
                  type="submit"
                  class="__clickable hover:text-candy-apple-red absolute inset-y-0 right-0 flex items-center pr-3.5 text-white/40 transition-colors"
                  :class="{ 'pointer-events-none opacity-30': !draft.trim() }"
                  aria-label="Send"
               >
                  <Icon name="heroicons:paper-airplane" class="size-5" />
               </button>
            </div>
         </div>
      </form>
   </div>
</template>

<script lang="ts" setup>
type Props = {
   closable?: boolean
}

type Emits = {
   close: []
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const peer = usePeer()

const messages = computed(() => peer.data.chatMessages.value)

const draft = ref<string>('')
const list = ref<HTMLDivElement>()

const editingName = ref<boolean>(false)
const nameDraft = ref<string>('')
const nameInput = ref<HTMLInputElement>()

const AUTHOR_COLORS = ['#ffd166', '#8ecae6', '#95d5b2', '#cdb4db', '#f4a261', '#e9c46a']

const authorColor = (author: string) => {
   let hash = 0
   for (const char of author) hash = (hash * 31 + char.charCodeAt(0)) % 997
   return AUTHOR_COLORS[hash % AUTHOR_COLORS.length]
}

const send = () => {
   peer.sendChat(draft.value)
   draft.value = ''
}

const startEditName = () => {
   nameDraft.value = peer.data.ownName.value
   editingName.value = true
   nextTick(() => nameInput.value?.select())
}

const confirmName = () => {
   if (!editingName.value) return
   editingName.value = false
   peer.setName(nameDraft.value)
}

watch(
   () => messages.value.length,
   () => {
      const el = list.value
      if (!el) return
      const lastIsOwn = messages.value[messages.value.length - 1]?.own
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
      if (lastIsOwn || nearBottom) {
         nextTick(() => el.scrollTo({ top: el.scrollHeight }))
      }
   },
   { flush: 'post' }
)
</script>
