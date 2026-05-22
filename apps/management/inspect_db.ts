import { createClient } from './src/app/lib/supabase/client'
import { createAdminClient } from './src/app/lib/supabase/server'

async function run() {
  const supabase = createAdminClient()
  console.log('--- ROLES ---')
  const { data: roles } = await supabase.from('roles').select('*')
  console.log(roles)

  console.log('--- PROFILES ---')
  const { data: profiles } = await supabase.from('profiles').select('*, roles(name)')
  console.log(profiles)
}

run()
