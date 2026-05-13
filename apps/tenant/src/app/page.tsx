import { redirect } from 'next/navigation'
import { createClient } from '@/src/app/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // logged in -> go to dashboard
  // guest -> go to rooms (publicly viewable)
  if (user) redirect('/dashboard')
  else redirect('/room')
}