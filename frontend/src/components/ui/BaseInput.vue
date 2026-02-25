<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    label?: string
    type?: string
    placeholder?: string
    error?: string
    helper?: string
    disabled?: boolean
    required?: boolean
  }>(),
  {
    modelValue: '',
    type: 'text',
    disabled: false,
    required: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const inputId = computed(() => `input-${Math.random().toString(36).slice(2, 9)}`)

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', props.type === 'number' ? Number(target.value) : target.value)
}
</script>

<template>
  <div class="space-y-1.5">
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-surface-700"
    >
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <div class="relative">
      <!-- Icon slot (left) -->
      <div
        v-if="$slots.icon"
        class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"
      >
        <slot name="icon" />
      </div>

      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :class="[
          'w-full h-9 rounded-[var(--radius-input)] border text-sm transition-all duration-200 placeholder:text-surface-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
          'bg-surface-0 text-surface-900',
          $slots.icon ? 'pl-10 pr-3' : 'px-3',
          error
            ? 'border-danger-500 focus:ring-danger-500/20 focus:border-danger-500'
            : 'border-surface-200 hover:border-surface-300',
          disabled && 'opacity-50 cursor-not-allowed bg-surface-50',
        ]"
        @input="handleInput"
      />
    </div>

    <p v-if="error" class="text-xs text-danger-600">{{ error }}</p>
    <p v-else-if="helper" class="text-xs text-surface-500">{{ helper }}</p>
  </div>
</template>
