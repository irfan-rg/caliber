'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/design-system'

export type ToastVariant = 'default' | 'success' | 'error' | 'warning'

export interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastMessage extends ToastOptions {
  id: string
}

interface ToastContextValue {
  notify: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default:
    'border border-black/5 bg-white/90 text-[#1C1C1E] shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#2C2C2E]/85 dark:text-white',
  success:
    'border border-[#34C759]/40 bg-[#34C759]/10 text-[#1C1C1E] shadow-[0_4px_12px_rgba(52,199,89,0.2)] dark:border-[#34C759]/40 dark:bg-[#1C1C1E] dark:text-white',
  error:
    'border border-[#FF3B30]/45 bg-[#FF3B30]/12 text-[#1C1C1E] shadow-[0_4px_12px_rgba(255,59,48,0.2)] dark:border-[#FF453A]/45 dark:bg-[#1C1C1E] dark:text-white',
  warning:
    'border border-[#FF9500]/40 bg-[#FF9500]/12 text-[#1C1C1E] shadow-[0_4px_12px_rgba(255,149,0,0.2)] dark:border-[#FF9F0A]/40 dark:bg-[#1C1C1E] dark:text-white',
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((options: ToastOptions) => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, ...options }])
    
    // Auto-dismiss after duration
    const duration = options.duration ?? 4000
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, duration)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-[calc(100%-3rem)] sm:w-full sm:max-w-xs">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const variant = toast.variant ?? 'default'
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'pointer-events-auto w-full overflow-hidden rounded-2xl px-4 py-3 backdrop-blur-xl cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/30',
                  VARIANT_STYLES[variant]
                )}
                onClick={() => removeToast(toast.id)}
              >
                <div className="flex flex-col gap-0.5">
                  {toast.title && (
                    <div className="text-xs font-semibold tracking-tight">
                      {toast.title}
                    </div>
                  )}
                  {toast.description && (
                    <div className="text-xs text-[#8E8E93] dark:text-[#EBEBF5]/70">
                      {toast.description}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
