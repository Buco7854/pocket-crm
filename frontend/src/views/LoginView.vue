<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'

const { t } = useI18n()
const { login, loginWithProvider, listAuthProviders, loading, error, clearError } = useAuth()

const email = ref('')
const password = ref('')

interface OAuthProvider {
  name: string
  displayName: string
}

const providers = ref<OAuthProvider[]>([])

onMounted(async () => {
  const list = await listAuthProviders()
  providers.value = list.map((p: { name: string; displayName: string }) => ({
    name: p.name,
    displayName: p.displayName,
  }))
})

async function handleSubmit() {
  try {
    await login(email.value, password.value)
  } catch {
    // error is already set in store
  }
}

async function handleOAuth(provider: string) {
  try {
    await loginWithProvider(provider)
  } catch {
    // error is already set in store
  }
}

const providerIcons: Record<string, string> = {
  google: 'M21.35 11.1h-9.18v2.73h5.51c-.24 1.27-.98 2.34-2.09 3.06v2.54h3.39c1.98-1.82 3.12-4.51 3.12-7.58 0-.52-.05-1.02-.14-1.5z M12.18 22c2.84 0 5.22-.94 6.96-2.57l-3.39-2.54c-.94.63-2.15 1-3.57 1-2.74 0-5.06-1.85-5.89-4.34H2.75v2.62C4.48 19.78 8.03 22 12.18 22z M6.29 13.55a5.87 5.87 0 010-3.1V7.83H2.75a9.97 9.97 0 000 8.34l3.54-2.62z M12.18 5.98c1.55 0 2.94.53 4.03 1.57l3.02-3.02C17.38 2.79 15.01 1.8 12.18 1.8c-4.15 0-7.7 2.22-9.43 5.83l3.54 2.62c.83-2.49 3.15-4.27 5.89-4.27z',
  github: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z',
  microsoft: 'M3 3h8.5v8.5H3V3zm9.5 0H21v8.5h-8.5V3zM3 12.5h8.5V21H3v-8.5zm9.5 0H21V21h-8.5v-8.5z',
  discord: 'M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z',
  gitlab: 'M21.94 12.865l-1.066-3.28-2.115-6.508a.414.414 0 00-.79 0L15.854 9.585H8.146L6.031 3.077a.414.414 0 00-.79 0L3.127 9.585 2.06 12.865a.826.826 0 00.3.924L12 21.012l9.64-7.223a.826.826 0 00.3-.924',
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
        <h2 class="text-lg font-semibold text-surface-900 mb-6">{{ t('auth.signIn') }}</h2>

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

        <!-- OAuth providers -->
        <div v-if="providers.length" class="space-y-2 mb-5">
          <button
            v-for="provider in providers"
            :key="provider.name"
            :disabled="loading"
            class="w-full h-10 rounded-lg border border-surface-200 bg-surface-0 text-sm font-medium text-surface-700 hover:bg-surface-50 active:bg-surface-100 transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleOAuth(provider.name)"
          >
            <svg v-if="providerIcons[provider.name]" class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
              <path :d="providerIcons[provider.name]" />
            </svg>
            {{ t('auth.continueWith', { provider: provider.displayName }) }}
          </button>

          <div class="relative my-4">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-surface-200" /></div>
            <div class="relative flex justify-center text-xs">
              <span class="bg-surface-0 px-3 text-surface-400">{{ t('auth.orEmail') }}</span>
            </div>
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="handleSubmit">
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
              :placeholder="t('auth.password')"
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
            {{ t('auth.signIn') }}
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-surface-500">
          {{ t('auth.noAccount') }}
          <router-link to="/register" class="text-primary-600 font-medium hover:text-primary-700">
            {{ t('auth.signUp') }}
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
