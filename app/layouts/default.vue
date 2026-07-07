<template>
   <Html class="bg-smoky-black">
      <Body>
         <div id="app-layout">
            <NuxtLoadingIndicator :height="5" color="#FF0808" />
            <Notifications />
            <Analytics />

            <div class="flex min-h-screen flex-col">
               <Header />
               <slot />
               <div v-if="!route.params.id" class="mt-auto">
                  <Footer />
               </div>
            </div>
         </div>
      </Body>
   </Html>
</template>

<script lang="ts" setup>
import { Analytics } from '@vercel/analytics/nuxt'

const route = useRoute()

// tab title: "<video> · Streamy" in a room with a video playing, "Streamy" everywhere else
useHead({
   titleTemplate: (title) => (title ? `${title} · Streamy` : 'Streamy'),
})

useSeoMeta({
   description: 'Watch YouTube together, synced peer-to-peer. No accounts, no servers.',
   ogTitle: 'Streamy',
   ogDescription: 'Watch YouTube together, synced peer-to-peer. No accounts, no servers.',
})
</script>
