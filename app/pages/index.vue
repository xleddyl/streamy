<template>
   <main class="__center flex grow flex-col justify-center gap-20 py-16">
      <section class="flex flex-col items-center gap-8 text-center">
         <h1 class="font-title max-w-3xl text-5xl leading-[1.05] font-bold text-white md:text-7xl">
            Watch YouTube together<span class="text-candy-apple-red">.</span>
         </h1>
         <p class="max-w-xl text-balance text-white/40 md:text-lg">
            Create a room, share the link, press play. Playback and chat stay in sync between you
            and your friends, directly peer-to-peer. No accounts, no servers in the middle.
         </p>

         <div class="mt-2 flex w-full max-w-md flex-col items-center gap-4">
            <Button class="px-10 py-3 text-lg" @click="peer.createRoom()">Create room</Button>
            <div
               class="flex w-full items-center gap-3 text-xs tracking-widest text-white/20 uppercase"
            >
               <span class="h-px flex-1 bg-white/10" />
               or
               <span class="h-px flex-1 bg-white/10" />
            </div>
            <form class="relative w-full" @submit.prevent="handleJoin">
               <input
                  v-model="joinCode"
                  class="bg-charleston-green w-full appearance-none rounded-2xl px-5 py-3 pr-20 text-white transition-shadow outline-none placeholder:text-white/25 focus:ring-1 focus:ring-white/10"
                  placeholder="Paste a room link to join"
               />
               <div class="absolute inset-y-0 right-2 flex items-center">
                  <button
                     type="submit"
                     class="__clickable font-title rounded-xl px-3 py-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
                     :class="{ 'pointer-events-none opacity-30': !parsedJoinId }"
                  >
                     Join
                  </button>
               </div>
            </form>
         </div>
      </section>

      <section class="grid gap-10 border-t border-white/5 pt-12 text-left md:grid-cols-3">
         <div v-for="step in steps" :key="step.number" class="space-y-2">
            <p class="font-title text-candy-apple-red text-sm font-semibold">{{ step.number }}</p>
            <p class="font-title text-lg font-semibold text-white">{{ step.title }}</p>
            <p class="text-sm leading-relaxed text-white/40">{{ step.description }}</p>
         </div>
      </section>
   </main>
</template>

<script lang="ts" setup>
const peer = usePeer()

const joinCode = ref<string>('')

// accepts either a bare room code or a full room link
const parsedJoinId = computed(() => {
   const raw = joinCode.value.trim()
   if (!raw) return undefined
   const segment = raw.split('/').filter(Boolean).pop() ?? ''
   return /^[\w-]{6,}$/.test(segment) ? segment : undefined
})

const handleJoin = () => {
   if (!parsedJoinId.value) return
   navigateTo(`/${parsedJoinId.value}`)
}

const steps = [
   {
      number: '01',
      title: 'Create a room',
      description:
         'One click and your room is live. You are the host, everything happens in your browser.',
   },
   {
      number: '02',
      title: 'Share the link',
      description: 'Send the room link to your friends. They join instantly, no sign-up required.',
   },
   {
      number: '03',
      title: 'Watch in sync',
      description: 'Queue videos, play, pause and seek together. Chat while you watch.',
   },
]
</script>
