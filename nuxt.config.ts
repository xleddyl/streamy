import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
   compatibilityDate: '2024-11-01',
   devtools: { enabled: false },
   telemetry: { enabled: false },
   build: { transpile: ['tslib'] },

   // P2P app: everything happens in the browser, generate a static SPA
   ssr: false,
   nitro: { preset: 'static' },

   modules: ['@vueuse/nuxt', '@nuxtjs/seo', '@nuxt/fonts', '@nuxt/icon'],

   // Iconify icons via <Icon name="heroicons:..." /> — clientBundle.scan bundles only
   // the icons actually used, so no runtime icon fetch is needed
   icon: {
      clientBundle: {
         scan: true,
         sizeLimitKb: 512,
      },
   },

   ogImage: { enabled: false },

   // no route-derived fallback titles (they would leak the room id into the tab title)
   seo: { fallbackTitle: false },

   site: {
      url: 'https://streamy.xleddyl.dev',
      name: 'Streamy',
   },

   app: {
      head: {
         meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
         link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
         script:
            process.env.NODE_ENV === 'production'
               ? [
                    {
                       src: 'https://analytics.xleddyl.dev/script.js',
                       'data-website-id': '2416d284-6f19-4bb9-9977-ec15048f1d28',
                       defer: true,
                    },
                 ]
               : [],
         noscript: [{ children: 'Javascript is required' }],
      },
   },

   css: ['~/assets/css/main.css'],
   components: [{ path: '~/components/', pathPrefix: false }],

   fonts: {
      families: [
         { name: 'Lexend', provider: 'google', weights: [400, 500, 600, 700] },
         { name: 'Montserrat', provider: 'google', weights: [400, 500, 600, 700] },
      ],
   },

   vite: {
      esbuild: {
         drop: ['debugger'],
         pure: ['console.log', 'console.error', 'console.warn', 'console.debug', 'console.trace'],
      },
      plugins: [svgLoader({ svgoConfig: { plugins: ['prefixIds'] } }), tailwindcss()],
   },
})
