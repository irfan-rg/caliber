'use client'

import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    fetchUser()
  }, [supabase.auth])

  useEffect(() => {
    if (!loading && user) {
      window.location.href = '/dashboard'
    }
  }, [user, loading])

  if (loading) {
    return null
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-background)]">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-1/4 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <Navbar />
      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-38 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-[var(--color-text)] mb-6 tracking-tight">
            Caliber
          </h1>
          <p className="text-xl md:text-2xl text-[var(--color-text)] mb-4 max-w-3xl mx-auto font-medium">
            Precision AI Evaluation & Monitoring Platform
          </p>
          <p className="text-lg text-[var(--color-text-muted)] mb-12 max-w-2xl mx-auto">
            Monitor performance metrics, identify trends, and ensure your AI systems 
            are delivering quality results consistently with Caliber&apos;s advanced analytics.
          </p>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="glass-card p-8">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
              Real-time Analytics
            </h3>
            <p className="text-[var(--color-text-muted)]">
              Monitor your AI evaluations with live dashboards showing scores, latency, 
              and success rates across all your tests with Caliber&apos;s precision analytics.
            </p>
          </div>

          <div className="glass-card p-8">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
              Trend Analysis
            </h3>
            <p className="text-[var(--color-text-muted)]">
              Visualize performance trends over time to identify patterns and 
              make data-driven decisions about your AI systems.
            </p>
          </div>

          <div className="glass-card p-8">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
              PII Protection
            </h3>
            <p className="text-[var(--color-text-muted)]">
              Track and monitor PII redaction across evaluations to ensure 
              compliance and data privacy standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
