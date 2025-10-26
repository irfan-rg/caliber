'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import { ChartSkeleton } from '@/components/Skeletons/ChartSkeleton'
import { cachedFetch, clearCache, type CachedResponse } from '@/lib/cache'

interface ConfigData {
  run_policy: 'always' | 'sampled'
  sample_rate_pct: number
  obfuscate_pii: boolean
  max_eval_per_day: number
}

type ConfigErrors = Partial<Record<keyof ConfigData, string>>

const ease = [0.16, 1, 0.3, 1] as const

export default function ConfigPage() {
  const [config, setConfig] = useState<ConfigData>({
    run_policy: 'always',
    sample_rate_pct: 10,
    obfuscate_pii: false,
    max_eval_per_day: 100,
  })
  const [loading, setLoading] = useState(true) // Start true to prevent flash
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<ConfigErrors>({})
  const [showCheck, setShowCheck] = useState(false)
  const [hasLoadedConfig, setHasLoadedConfig] = useState(false) // Track if config loaded
  const router = useRouter()
  const supabase = createClient()
  const { notify } = useToast()

  const loadConfig = useCallback(async () => {
    // Only show loading if we haven't loaded config before
    if (!hasLoadedConfig) {
      setLoading(true)
    }
    
    let cachedResponse: CachedResponse | undefined = undefined
    try {
      // Use cached fetch for faster subsequent loads
      cachedResponse = await cachedFetch('/api/config', undefined, 12000) // 12s cache for config
      if (cachedResponse.fromCache) {
        setLoading(false) // End loading instantly for cached data
      }
      if (cachedResponse.ok) {
        const responseData = await cachedResponse.json() as { data: Partial<ConfigData> }
        const { data } = responseData
        if (data) {
          setConfig({
            run_policy: data.run_policy || 'always',
            sample_rate_pct: data.sample_rate_pct ?? 10,
            obfuscate_pii: data.obfuscate_pii ?? false,
            max_eval_per_day: data.max_eval_per_day ?? 100,
          })
        }
      }
    } catch (error) {
      console.error('Error loading config:', error)
      notify({
        variant: 'error',
        title: 'Unable to load configuration',
        description: 'Please try again in a few moments.',
      })
    } finally {
      if (!cachedResponse?.fromCache) setLoading(false) // Only for fresh data
      setHasLoadedConfig(true)
    }
  }, [notify, hasLoadedConfig])

  useEffect(() => {
    const bootstrap = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      await loadConfig()
    }

    void bootstrap()
  }, [loadConfig, router, supabase.auth])

  useEffect(() => {
    if (!showCheck || typeof window === 'undefined') return
    const timeout = window.setTimeout(() => setShowCheck(false), 1500)
    return () => window.clearTimeout(timeout)
  }, [showCheck])

  const updateConfig = <K extends keyof ConfigData>(key: K, value: ConfigData[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[key]
      return newErrors
    })
  }

  const validate = () => {
    const nextErrors: ConfigErrors = {}
    if (config.run_policy === 'sampled' && (config.sample_rate_pct < 0 || config.sample_rate_pct > 100)) {
      nextErrors.sample_rate_pct = 'Choose a percentage between 0 and 100.'
    }

    if (config.max_eval_per_day < 1) {
      nextErrors.max_eval_per_day = 'Must be at least 1 evaluation per day.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    if (!validate()) {
      notify({
        variant: 'warning',
        title: 'Please fix the highlighted fields',
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        // Clear cache to ensure fresh data on next load
        clearCache('/api/config')
        
        setShowCheck(true)
        notify({
          variant: 'success',
          title: 'Settings updated',
          description: 'Your evaluation pipeline will use the new rules.',
        })
      } else {
        const { error } = await response.json()
        notify({
          variant: 'error',
          title: 'Save failed',
          description: error || 'Unable to persist configuration.',
        })
      }
    } catch (error) {
      console.error('Unexpected error saving config:', error)
      notify({
        variant: 'error',
        title: 'Unexpected error',
        description: 'Please try again shortly.',
      })
    } finally {
      setSaving(false)
    }
  }

  const policyOptions = useMemo(
    () => [
      { value: 'always' as const, label: 'Always evaluate each request' },
      { value: 'sampled' as const, label: 'Sample a percentage of requests' },
    ],
    []
  )

  // Only show skeleton on initial load
  if (loading && !hasLoadedConfig) {
    return (
      <div className="flex flex-1 flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <div className="h-10 w-48 animate-pulse rounded-full bg-[#007AFF]/10" />
          <div className="h-5 w-72 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
        </div>
        <ChartSkeleton fast={hasLoadedConfig} />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-10 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-[#1C1C1E] dark:text-white">
          Evaluation Settings
        </h1>
        <p className="text-sm text-[#8E8E93]">
          Fine-tune how and when your Agents are scored across environments.
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease, delay: 0.05 }}
        className="glass-card space-y-8 rounded-3xl p-8"
      >
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8E8E93]">
            Policy
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {policyOptions.map((option) => {
              const active = config.run_policy === option.value
              return (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => updateConfig('run_policy', option.value)}
                  className="relative flex items-center justify-between rounded-2xl border border-white/50 bg-white/70 px-5 py-4 text-left transition hover:shadow-md dark:border-white/10 dark:bg-[#1D1D1F]/80"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1C1C1E] dark:text-white">
                      {option.label}
                    </p>
                    <p className="text-xs text-[#8E8E93]">
                      {option.value === 'always'
                        ? 'Best for thorough evaluation environments.'
                        : 'Reduce cost by sampling a subset of traffic.'}
                    </p>
                  </div>
                  <span
                    className={
                      'flex h-6 w-6 items-center justify-center rounded-full border border-[#007AFF]/40'
                    }
                  >
                    <AnimatePresence>
                      {active && (
                        <motion.span
                          key={`${option.value}-active`}
                          className="h-3.5 w-3.5 rounded-full bg-[#007AFF]"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.22, ease }}
                        />
                      )}
                    </AnimatePresence>
                  </span>
                </motion.button>
              )
            })}
          </div>
        </section>

        <AnimatePresence>
          {config.run_policy === 'sampled' && (
            <motion.section
              key="sampled-settings"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease }}
              className="space-y-3"
            >
              <label htmlFor="sample-rate" className="text-sm font-semibold text-[#1C1C1E] dark:text-white">
                Sample Rate
              </label>
              <div className="relative">
                <input
                  id="sample-rate"
                  type="number"
                  placeholder=" "
                  min={0}
                  max={100}
                  value={config.sample_rate_pct}
                  onChange={(event) => updateConfig('sample_rate_pct', Number(event.target.value) || 0)}
                  disabled={saving}
                  className={
                    'peer w-full rounded-2xl border border-white/60 bg-white/80 px-4 pb-2 pt-5 text-sm font-medium text-[#1C1C1E] shadow-inner focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 dark:border-white/10 dark:bg-[#2C2C2E]/80 dark:text-white'
                  }
                />
                <label
                  htmlFor="sample-rate"
                  className="pointer-events-none absolute left-4 top-1.5 text-xs uppercase tracking-[0.24em] text-[#8E8E93] transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-[#8E8E93]/70 peer-focus:top-1.5 peer-focus:text-xs peer-focus:tracking-[0.24em] peer-focus:text-[#007AFF]"
                >
                  Percentage (0-100)
                </label>
              </div>
              <AnimatePresence>
                {errors.sample_rate_pct && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs font-medium text-[#FF3B30]"
                  >
                    {errors.sample_rate_pct}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.section>
          )}
        </AnimatePresence>

        <section className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-5 py-4 dark:border-white/10 dark:bg-[#1D1D1F]/80">
            <div>
              <p className="text-sm font-semibold text-[#1C1C1E] dark:text-white">
                Obfuscate PII
              </p>
              <p className="text-xs text-[#8E8E93]">
                Automatically redact Personal details before persisting evaluations.
              </p>
            </div>
            <motion.button
              type="button"
              role="switch"
              aria-checked={config.obfuscate_pii}
              onClick={() => updateConfig('obfuscate_pii', !config.obfuscate_pii)}
              className={`relative flex h-7 w-12 items-center rounded-full px-1 transition ${
                config.obfuscate_pii ? 'justify-end' : 'justify-start'
              }`}
              animate={{ backgroundColor: config.obfuscate_pii ? '#007AFF' : '#C7C7CC' }}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="h-5 w-5 rounded-full bg-white shadow"
              />
            </motion.button>
          </div>

          <div className="space-y-3">
            <label htmlFor="max-eval" className="text-sm font-semibold text-[#1C1C1E] dark:text-white">
              Daily Evaluation Limit
            </label>
            <div className="relative">
              <input
                id="max-eval"
                type="number"
                min={1}
                placeholder=" "
                value={config.max_eval_per_day}
                onChange={(event) => updateConfig('max_eval_per_day', Number(event.target.value) || 1)}
                disabled={saving}
                className={
                  'peer w-full rounded-2xl border border-white/60 bg-white/80 px-4 pb-2 pt-5 text-sm font-medium text-[#1C1C1E] shadow-inner focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 dark:border-white/10 dark:bg-[#2C2C2E]/80 dark:text-white'
                }
              />
              <label
                htmlFor="max-eval"
                className="pointer-events-none absolute left-4 top-1.5 text-xs uppercase tracking-[0.24em] text-[#8E8E93] transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-[#8E8E93]/70 peer-focus:top-1.5 peer-focus:text-xs peer-focus:tracking-[0.24em] peer-focus:text-[#007AFF]"
              >
                Max Evaluations per Day
              </label>
            </div>
            <AnimatePresence>
              {errors.max_eval_per_day && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs font-medium text-[#FF3B30]"
                >
                  {errors.max_eval_per_day}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 pt-4">
          <motion.button
            type="submit"
            disabled={saving}
            className="relative inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-5 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,122,255,0.2)] transition-transform duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            whileTap={{ scale: 0.97 }}
          >
            <span>{saving ? 'Saving…' : 'Save configuration'}</span>
            <AnimatePresence>
              {saving && (
                <motion.span
                  key="saving-dot"
                  className="inline-flex h-2 w-2 rounded-full bg-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {showCheck && !saving && (
                <motion.span
                  key="saved-check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease }}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#007AFF]"
                >
                  ✓
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.form>
    </div>
  )
}
