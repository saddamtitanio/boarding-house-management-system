// TEMP: DEVELOPMENT PURPOSES ONLY

'use client'

export const dynamic = 'force-dynamic'
import { createClient } from '@/src/app/lib/supabase/client'

export default function LogoutButton() {
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()

    // optional: force navigation after session is cleared
    window.location.href = '/login'
  }

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  )
}