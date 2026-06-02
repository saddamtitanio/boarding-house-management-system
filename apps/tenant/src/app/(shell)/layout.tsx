import { createClient } from '@/src/app/lib/supabase/server'
import ShellClient from './ShellClient'

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
const {
  data: { session }
} = await supabase.auth.getSession()

const jwt = session?.user

console.log(jwt)
  return (
    <ShellClient user={user}>
      {children}
    </ShellClient>
  )
}