import { AVAILABLE_LOCALES, DEFAULT_LOCALE } from './i18n/config'

import svgLoader from 'vite-svg-loader'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
   future: {
      compatibilityVersion: 4,
   },

   modules: [
      'nuxt-zod-i18n',
      '@nuxtjs/i18n',
      '@nuxt/ui',
      '@pinia/nuxt',
      // '@nuxtjs/supabase',
      '@nuxtjs/device',
      '@vueuse/nuxt',
      '@nuxtjs/seo',
      '@nuxt/scripts',
      'dayjs-nuxt',
   ],

   seo: {
      fallbackTitle: false,
   },

   ssr: false,

   site: {
      url: 'streamy.xleddyl.dev',
      name: 'Streamy',
   },

   sitemap: {
      cacheMaxAgeSeconds: 86400, // 24 hour
      sources: ['/api/__sitemap__/urls/locations', '/api/__sitemap__/urls/products'],
   },

   dayjs: {
      locales: ['it', 'en'],
      plugins: ['relativeTime', 'utc', 'timezone'],
   },

   app: {
      head: {
         meta: [
            {
               name: 'viewport',
               content: 'width=device-width, initial-scale=1',
            },
         ],
         link: [
            { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
            { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
            {
               rel: 'preconnect',
               href: 'https://fonts.gstatic.com',
               crossorigin: '',
            },
            {
               rel: 'stylesheet',
               href: 'https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap',
            },
         ],
         script: [
            {
               src: 'https://analytics.xleddyl.dev/script.js',
               'data-website-id': '2416d284-6f19-4bb9-9977-ec15048f1d28',
               defer: true,
            },
         ],
         noscript: [{ children: 'Javascript is required' }],
      },
   },

   pinia: {
      storesDirs: ['./utils/store/**'],
   },

   i18n: {
      locales: AVAILABLE_LOCALES.map((locale) => ({
         code: locale.code,
         file: locale.code + '.json',
         language: locale.language,
      })),
      detectBrowserLanguage: {
         fallbackLocale: 'en',
         useCookie: true,
         redirectOn: 'root',
         cookieKey: 'i18n-language',
      },
      lazy: true,
      langDir: './assets/translations',
      defaultLocale: DEFAULT_LOCALE,
      strategy: 'prefix_and_default',
      types: 'composition',
      vueI18n: './i18n/vue-config.ts',
   },

   css: ['~/assets/css/tailwind.css', '~/assets/css/main.css', '~/assets/css/font.css'],
   devtools: { enabled: false },

   colorMode: {
      preference: 'light',
   },

   typescript: {
      shim: false,
   },

   vite: {
      vue: {
         script: {
            defineModel: true,
         },
      },
      // esbuild: {
      //    drop: ['debugger'],
      //    pure: ['console.log', 'console.error', 'console.warn', 'console.debug', 'console.trace'],
      // },
      plugins: [svgLoader({ svgoConfig: { plugins: ['prefixIds'] } })],
   },

   hooks: {
      'webpack:config': (configs) => {
         configs.forEach((config) => {
            const svgRule = config.module.rules.find(
               (rule: { test: { test: (arg0: string) => any } }) => rule.test.test('.svg')
            )
            svgRule.test = /\.(png|jpe?g|gif|webp)$/
            config.module.rules.push({
               test: /\.svg$/,
               oneOf: [
                  {
                     resourceQuery: /inline/,
                     loader: 'file-loader',
                     query: {
                        name: 'static/image/[name].[hash:8].[ext]',
                     },
                  },
                  {
                     loader: 'vue-svg-loader',
                     options: {
                        // Optional svgo options
                        svgo: {
                           plugins: [{ removeViewBox: false }],
                        },
                     },
                  },
               ],
            })
         })
      },
   },

   build: {
      transpile: ['tslib'],
   },

   components: [
      {
         path: '~/components/',
         pathPrefix: false,
      },
   ],

   ui: {
      safelistColors: ['candy-apple-red', 'philippine-silver'],
   },

   // supabase: {
   //    url: process.env.NUXT_SUPABASE_URL,
   //    key: process.env.NUXT_SUPABASE_AK,
   //    serviceKey: process.env.NUXT_SUPABASE_SRK,
   //    clientOptions: {
   //       auth: { detectSessionInUrl: true },
   //       global: {
   //          headers: { 'x-template-nuxt-origin': 'web' },
   //       },
   //    },
   //    redirectOptions: {
   //       login: '/auth/sign-in',
   //       callback: '/auth/confirm',
   //       include: undefined,
   //       exclude: ['/*'],
   //       cookieRedirect: true,
   //    },
   // },

   runtimeConfig: {
      public: {
         queryStaleTime: '',
         queryQcTime: '',
         mode: '',
      },
      supabaseUrl: '',
      supabaseAk: '',
      supabaseSrk: '',
      supabaseSignature: '',
   },

   telemetry: false,
   compatibilityDate: '2024-12-19',
})
