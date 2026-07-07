<template>
   <button
      class="__clickable font-title relative h-fit overflow-hidden rounded-3xl font-medium text-white"
      :class="{
         'bg-candy-apple-red px-5 py-2 md:px-8': type === 'primary',
         'bg-charleston-green rounded-xl px-4 py-2': type === 'icon',
         'pointer-events-none opacity-20': disabled,
      }"
      :disabled
   >
      <slot />
      <div
         class="bg-charleston-green/90 pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity"
         :class="{ 'pointer-events-auto opacity-100': loading }"
      >
         <Icon name="heroicons:arrow-path" class="size-6 animate-spin" />
      </div>
   </button>
</template>

<script lang="ts" setup>
type Props = {
   type?: 'primary' | 'search' | 'icon'
   disabled?: boolean
   loading?: boolean
}
const props = withDefaults(defineProps<Props>(), {
   type: 'primary',
})
</script>
