'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { notify } = useToast()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        notify({
          variant: 'error',
          title: 'Login failed',
          description: signInError.message,
        })
        return
      }

      // Successful login - redirect to dashboard
      notify({
        variant: 'success',
        title: 'Welcome back!',
        description: 'Redirecting to dashboard...',
      })
      
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      notify({
        variant: 'error',
        title: 'Login error',
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-background)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute -top-1/4 -right-1/4 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-1/4 left-1/2 w-96 h-96 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Brand */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#007AFF]/10 text-[#007AFF]">
              <p className="text-3xl font-semibold">⚘</p>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-[var(--color-text)] mb-2 tracking-tight">
            Welcome back
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Log in to continue to Caliber
          </p>
        </div>

        {/* Login Form Card */}
        <div className="glass-card p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--outline-muted)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] transition"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--outline-muted)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] transition"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#007AFF] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,122,255,0.2)] transition-all duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>

        {/* Sign up link */}
        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-semibold text-[#007AFF] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
