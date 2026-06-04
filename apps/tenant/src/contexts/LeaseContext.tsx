'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface LeaseContextType {
  hasActiveLease: boolean
  isLoading: boolean
}

const LeaseContext = createContext<LeaseContextType>({
  hasActiveLease: false,
  isLoading: true,
})

export function LeaseProvider({ children }: { children: React.ReactNode }) {
  const [hasActiveLease, setHasActiveLease] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkLease() {
      try {
        const res = await fetch('/api/dashboard')
        const json = await res.json()
        if (json.success && json.data?.active_lease) {
          setHasActiveLease(true)
        }
      } catch (err) {
        console.error('Failed to check lease status', err)
      } finally {
        setIsLoading(false)
      }
    }
    checkLease()
  }, [])

  return (
    <LeaseContext.Provider value={{ hasActiveLease, isLoading }}>
      {children}
    </LeaseContext.Provider>
  )
}

export function useLeaseContext() {
  return useContext(LeaseContext)
}
