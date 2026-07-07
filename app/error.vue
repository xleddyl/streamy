<template>
   <main
      class="bg-smoky-black flex min-h-screen flex-col items-center justify-center gap-10 text-white"
   >
      <div class="text-center">
         <div class="font-title flex flex-col items-center gap-1 text-3xl font-bold">
            <p class="w-fit rotate-90">{{ ':(' }}</p>
            <h1>{{ message.error }}</h1>
         </div>
         <p class="text-base text-white/50" v-if="message.details">{{ message.details }}</p>
      </div>
      <NuxtLink title="home" to="/">
         <p class="__clickable underline">Homepage</p>
      </NuxtLink>
   </main>
</template>

<script lang="ts" setup>
import type { NuxtError } from '#app'

const props = defineProps({
   error: Object as () => NuxtError,
})

const message = computed(() => {
   switch (props.error?.statusCode) {
      case 404: {
         return {
            error: 'Verify the room code',
            details: 'Check that you have entered the correct room code in the URL',
         }
      }
      case 500: {
         if (import.meta.dev) {
            console.log(props.error)
         }
         return { error: 'Internal server error' }
      }
      case 410: {
         return { error: 'The link has expired or is invalid' }
      }
      default: {
         return { error: 'Something went wrong' }
      }
   }
})
</script>
