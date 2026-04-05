'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type DemoRole = 'admin' | 'viewer'

interface RoleContextValue {
  role: DemoRole
  setRole: (role: DemoRole) => void
  isAdmin: boolean
  isViewer: boolean
}

const ROLE_STORAGE_KEY = 'caliber-demo-role'

const RoleContext = createContext<RoleContextValue | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<DemoRole>('admin')

  useEffect(() => {
    const storedRole = window.localStorage.getItem(ROLE_STORAGE_KEY)
    if (storedRole === 'admin' || storedRole === 'viewer') {
      setRole(storedRole)
    }
  }, [])

  const updateRole = (nextRole: DemoRole) => {
    setRole(nextRole)
    window.localStorage.setItem(ROLE_STORAGE_KEY, nextRole)
  }

  const value = useMemo(
    () => ({
      role,
      setRole: updateRole,
      isAdmin: role === 'admin',
      isViewer: role === 'viewer',
    }),
    [role]
  )

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}
