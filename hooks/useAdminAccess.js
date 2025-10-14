import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Client-side hook to check if current user has admin access
 * @returns {{isAdmin: boolean, isLoading: boolean}}
 */
export function useAdminAccess() {
  const { data: session, status } = useSession()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      if (status === 'loading') {
        setIsLoading(true)
        return
      }

      if (!session) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/admin/stats')
        // If we get a 403, user is not an admin
        // If we get 200, user is an admin
        setIsAdmin(response.ok)
      } catch (error) {
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdmin()
  }, [session, status])

  return { isAdmin, isLoading }
}
