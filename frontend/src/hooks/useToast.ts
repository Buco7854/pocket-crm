import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  add: (message: string, variant?: ToastVariant, duration?: number) => void
  remove: (id: string) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  add(message, variant = 'info', duration = 4000) {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({ toasts: [...state.toasts, { id, message, variant, duration }] }))
    if (duration > 0) {
      setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), duration)
    }
  },

  remove(id) {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },

  success(message, duration) { useToastStore.getState().add(message, 'success', duration) },
  error(message, duration) { useToastStore.getState().add(message, 'error', duration) },
  warning(message, duration) { useToastStore.getState().add(message, 'warning', duration) },
  info(message, duration) { useToastStore.getState().add(message, 'info', duration) },
}))

export function useToast() {
  return useToastStore()
}
