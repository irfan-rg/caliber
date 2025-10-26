'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bars3BottomRightIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  TableCellsIcon,
  ChartBarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import { cn } from '@/lib/design-system'

interface NavItem {
  label: string
  href: string
  icon?: ReactNode
  startsWith?: string
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    startsWith: '/dashboard',
    icon: <ChartBarIcon className="h-4 w-4" aria-hidden="true" />,
  },
  {
    label: 'Evaluations',
    href: '/evaluations',
    startsWith: '/evaluations',
    icon: <TableCellsIcon className="h-4 w-4" aria-hidden="true" />,
  },
  {
    label: 'Config',
    href: '/config',
    startsWith: '/config',
    icon: <Cog6ToothIcon className="h-4 w-4" aria-hidden="true" />,
  },
]

const dropdownMotion = {
  initial: { opacity: 0, y: -8, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.97 },
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { notify } = useToast()
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  useEffect(() => {
    // Always show navbar on landing page now
    if (pathname === '/') {
      setIsScrolled(true) // Always visible on landing page
      // No scroll listener needed - keep it always visible
    } else if (pathname === '/login' || pathname === '/signup') {
      // Hide navbar on auth pages
      setIsScrolled(false)
    } else {
      // For protected routes, always show navbar
      setIsScrolled(true)
    }
  }, [pathname])

  useEffect(() => {
    if (!showDropdown) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [showDropdown])

  const initials = useMemo(() => {
    if (!user?.email) return 'AN'
    const [namePart] = user.email.split('@')
    if (!namePart) return 'AN'
    const segments = namePart.split(/[._-]/).filter(Boolean)
    if (segments.length === 0) return namePart.slice(0, 2).toUpperCase()
    if (segments.length === 1) return segments[0].slice(0, 2).toUpperCase()
    return `${segments[0][0]}${segments[segments.length - 1][0]}`
      .toUpperCase()
  }, [user?.email])

  const isActive = (item: NavItem) => {
    if (!pathname) return false
    return item.startsWith
      ? pathname.startsWith(item.startsWith)
      : pathname === item.href
  }

  const handleLogout = async () => {
    setShowDropdown(false)
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      notify({
        variant: 'error',
        title: 'Logout failed',
        description: error.message,
      })
      return
    }

    notify({
      variant: 'success',
      title: 'Signed out',
      description: 'See you soon!',
    })
    
    // Redirect to login to avoid race condition with landing page auth check
    window.location.href = '/login'
  }

  return (
    <AnimatePresence>
      {isScrolled && (
        <motion.header
          className="fixed top-4 z-40 flex w-full flex-col items-center px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
      <div className="glass-card flex w-full max-w-6xl items-center justify-between gap-2 sm:gap-6 rounded-3xl border border-white/50 px-3 sm:px-4 py-2 sm:py-3 backdrop-blur-xl shadow-[0_8px_24px_rgba(17,17,17,0.06)] dark:border-white/10 dark:shadow-[0_18px_42px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link
            href="/"
            className="group flex items-center gap-1.5 sm:gap-2 rounded-full px-1.5 sm:px-2 py-1 text-sm font-semibold text-[#1C1C1E] transition-transform duration-200 hover:scale-[1.02] dark:text-white shrink-0"
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#007AFF]/10 text-[#007AFF]">
              <p className="text-xl sm:text-2xl font-semibold">⚘</p>
            </div>
            <span className="text-xl sm:text-2xl tracking-tight">Caliber</span>
          </Link>

          {user && (
            <nav className="hidden items-center gap-1 sm:gap-2 lg:flex">
              {navItems.map((item) => {
                const active = isActive(item)
                return (
                  <motion.div key={item.href} className="relative">
                    <Link
                      href={item.href}
                      prefetch={true}
                      className={cn(
                        'flex items-center gap-2 rounded-full px-3 lg:px-4 py-1.5 lg:py-2 text-sm transition-colors duration-200',
                        active
                          ? 'text-[#007AFF]'
                          : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                      )}
                    >
                      <span className="hidden lg:inline-flex">{item.label}</span>
                    </Link>
                    {active && (
                      <motion.span
                        layoutId="active-nav"
                        className="absolute inset-x-2 lg:inset-x-3 -bottom-1 h-[2px] rounded-full bg-[#007AFF]"
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      />
                    )}
                  </motion.div>
                )
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {loading ? (
            <div className="h-8 sm:h-9 w-20 sm:w-28 animate-pulse rounded-full bg-[#007AFF]/10" />
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="hidden rounded-full bg-[#007AFF] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-[0_14px_30px_rgba(0,122,255,0.25)] transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/40 lg:inline-flex"
                onClick={() => router.push('/config')}
              >
                Configure
              </button>
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  type="button"
                  className="flex items-center gap-2 sm:gap-3 rounded-full border border-white/60 bg-white/70 px-2 sm:px-3 py-1.5 text-left shadow-sm transition duration-200 hover:scale-[1.02] hover:shadow-[0_12px_28px_rgba(15,15,15,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 dark:border-white/10 dark:bg-[#2C2C2E]/80"
                  onClick={() => setShowDropdown((prev) => !prev)}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="hidden flex-col leading-tight md:flex">
                    <span className="text-sm font-semibold text-[#1C1C1E] dark:text-white truncate max-w-[120px]">
                      {user.email?.split('@')[0] ?? 'User'}
                    </span>
                    <span className="text-xs text-[#8E8E93] truncate max-w-[120px]">
                      {user.email}
                    </span>
                  </div>
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#007AFF]/10 text-xs sm:text-sm font-semibold text-[#007AFF]">
                    {initials}
                  </div>
                </motion.button>
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      key="dropdown"
                      {...dropdownMotion}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 top-14 w-64 rounded-3xl border border-white/40 bg-white/80 p-3 shadow-[0_24px_60px_rgba(15,15,15,0.18)] backdrop-blur-3xl dark:border-white/10 dark:bg-[#1D1D1F]/90"
                    >
                      <div className="rounded-2xl bg-white/70 p-3 dark:bg-white/5">
                        <p className="text-sm font-medium text-[#1C1C1E] dark:text-white">
                          Logged in as
                        </p>
                        <p className="truncate text-sm text-[#8E8E93] dark:text-[#EBEBF5]/70">
                          {user.email}
                        </p>
                      </div>
                      <motion.button
                        type="button"
                        onClick={handleLogout}
                        className="mt-3 flex w-full items-center justify-between rounded-2xl bg-[#FF3B30]/10 px-4 py-2 text-sm font-semibold text-[#FF3B30] transition-transform duration-200 hover:scale-[1.01] hover:bg-[#FF3B30]/16"
                        whileTap={{ scale: 0.97 }}
                      >
                        Log out
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="rounded-full border border-white/60 bg-white/70 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#1C1C1E] transition duration-200 hover:scale-[1.02] hover:text-[#007AFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 dark:border-white/10 dark:bg-[#2C2C2E]/80 dark:text-white"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[#007AFF] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-[0_14px_30px_rgba(0,122,255,0.25)] transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/40 whitespace-nowrap"
              >
                Sign up
              </Link>
            </div>
          )}

          {user && (
            <button
              type="button"
              className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/60 bg-white/80 text-[#1C1C1E] transition duration-200 hover:scale-[1.05] hover:text-[#007AFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 lg:hidden dark:border-white/10 dark:bg-[#2C2C2E]/80 dark:text-white"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? (
                <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Bars3BottomRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
              <span className="sr-only">Toggle navigation</span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && user && (
          <motion.nav
            key="mobile-nav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-3 w-full max-w-6xl rounded-3xl border border-white/50 bg-white/80 p-4 shadow-[0_24px_60px_rgba(15,15,15,0.14)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#1D1D1F]/90"
          >
            <div className="space-y-2">
              {navItems.map((item) => {
                const active = isActive(item)
                return (
                  <Link
                    key={`mobile-${item.href}`}
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-base font-medium transition duration-200',
                      active
                        ? 'bg-[#007AFF]/10 text-[#007AFF]'
                        : 'text-[#1C1C1E] hover:bg-[#F2F2F7] dark:text-white dark:hover:bg-white/10'
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-[#007AFF] dark:bg-white/10">
                        {item.icon}
                      </span>
                      {item.label}
                    </span>
                    {active && (
                      <motion.span
                        layoutId="mobile-active"
                        className="h-2 w-2 rounded-full bg-[#007AFF]"
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
        </motion.header>
      )}
    </AnimatePresence>
  )
}
