<template>
   <div class="relative">
      <input
         ref="input"
         type="text"
         class="w-full appearance-none rounded-2xl text-white outline-none placeholder:opacity-30"
         :class="[
            dark ? 'bg-smoky-black px-4 py-2.5 text-sm' : 'bg-charleston-green px-5 py-3 md:px-8',
            { 'rounded-b-none': showSuggestionLocal },
         ]"
         v-model="model"
         :placeholder
         @focus="inputFocus = true"
         @blur="inputFocus = false"
         @keyup.enter="$emit('submit')"
      />

      <!-- mousedown.prevent keeps the input focused while interacting with the suggestion,
           otherwise on touch devices the blur closes it before the click lands -->
      <div
         v-if="showSuggestionLocal"
         class="__glass absolute inset-x-0 z-20 rounded-b-2xl bg-gradient-to-b shadow-lg"
         :class="
            dark
               ? 'from-smoky-black to-smoky-black/70 px-4'
               : 'from-charleston-green to-charleston-green/70 px-5'
         "
         @mousedown.prevent
      >
         <div class="border-t border-white/10 py-4">
            <slot name="suggestion" />
         </div>
      </div>
   </div>
</template>

<script lang="ts" setup>
type Props = {
   placeholder?: string
   showSuggestion?: boolean
   buttonDisabled?: boolean
   buttonLoading?: boolean
   dark?: boolean
}
type Emits = {
   submit: []
}
const props = withDefaults(defineProps<Props>(), {})
const emit = defineEmits<Emits>()

const model = defineModel<string>()

const inputFocus = ref<boolean>(false)
const showSuggestionLocal = computed(() => props.showSuggestion && inputFocus.value)
</script>
