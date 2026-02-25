<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'

const { t } = useI18n()
const { register, loading, error, clearError } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

async function handleSubmit() {
  try {
    await register(email.value, password.value, confirmPassword.value, name.value)
  } catch {
    // error is already set in store
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-50 px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-xl mb-4">
          P
        </div>
        <h1 class="text-2xl font-bold text-surface-900 font-display">{{ t('app.name') }}</h1>
        <p class="mt-1 text-surface-500 text-sm">{{ t('app.description') }}</p>
      </div>

      <!-- Form -->
      <div class="rounded-xl border border-surface-200 bg-surface-0 shadow-card p-6">
        <h2 class="text-lg font-semibold text-surface-900 mb-6">{{ t('auth.signUp') }}</h2>

        <!-- Error alert -->
        <div
          v-if="error"
          class="mb-4 flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-800"
        >
          <svg class="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="flex-1">{{ error }}</span>
          <button class="shrink-0 p-0.5 rounded hover:bg-danger-100 transition-colors" @click="clearError">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-surface-700">{{ t('auth.name') }}</label>
            <input
              v-model="name"
              type="text"
              required
              :placeholder="t('auth.name')"
              class="w-full h-9 rounded-lg border border-surface-200 bg-surface-0 px-3 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-surface-700">{{ t('auth.email') }}</label>
            <input
              v-model="email"
              type="email"
              required
              :placeholder="t('auth.email')"
              class="w-full h-9 rounded-lg border border-surface-200 bg-surface-0 px-3 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-surface-700">{{ t('auth.password') }}</label>
            <input
              v-model="password"
              type="password"
              required
              minlength="8"
              :placeholder="t('auth.password')"
              class="w-full h-9 rounded-lg border border-surface-200 bg-surface-0 px-3 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-surface-700">{{ t('auth.confirmPassword') }}</label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              minlength="8"
              :placeholder="t('auth.confirmPassword')"
              class="w-full h-9 rounded-lg border border-surface-200 bg-surface-0 px-3 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full h-10 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg
              v-if="loading"
              class="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ t('auth.signUp') }}
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-surface-500">
          {{ t('auth.hasAccount') }}
          <router-link to="/login" class="text-primary-600 font-medium hover:text-primary-700">
            {{ t('auth.signIn') }}
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
