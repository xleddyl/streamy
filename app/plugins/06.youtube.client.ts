import { defineNuxtPlugin } from '#app'

declare global {
   interface Window {
      YT: typeof YT
      onYouTubeIframeAPIReady: () => void
   }
}

export default defineNuxtPlugin(() => {
   const loadYouTubeIframeAPI = () => {
      return new Promise<typeof YT>((resolve) => {
         if (typeof window.YT !== 'undefined' && window.YT.Player) {
            resolve(window.YT)
         } else {
            if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
               const tag = document.createElement('script')
               tag.src = 'https://www.youtube.com/iframe_api'
               const firstScriptTag = document.getElementsByTagName('script')[0]
               firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)
            }

            window.onYouTubeIframeAPIReady = () => {
               resolve(window.YT)
            }
         }
      })
   }

   return {
      provide: {
         loadYouTubeIframeAPI,
      },
   }
})
