'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface MainWrapperProps {
  children: ReactNode
}

export default function MainWrapper({ children }: MainWrapperProps) {
  const pathname = usePathname()
  
  // Add top padding for protected routes only (not landing, login, or signup)
  const needsPadding = pathname !== '/' && pathname !== '/login' && pathname !== '/signup'
  
  return (
    <main className={`flex min-h-screen flex-col ${needsPadding ? 'pt-16 sm:pt-20' : ''}`}>
      {children}
    </main>
  )
}