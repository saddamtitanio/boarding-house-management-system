import { createClient } from '@/src/app/lib/supabase/server'
import ShellClient from './ShellClient'
import { LanguageProvider } from '@/src/contexts/LanguageContext'

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  return (
    <LanguageProvider>
      <ShellClient user={user}>
        {children}
      </ShellClient>
    </LanguageProvider>
  )
}