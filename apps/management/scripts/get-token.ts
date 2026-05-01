import { createClient } from '@supabase/supabase-js'

import dotenv from 'dotenv'
import path from 'path'

// load .env.local from parent folder
dotenv.config({
  path: path.resolve(__dirname, '../.env.local'),
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

async function main() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@test.com',
    password: 'password'
  })

  if (error) {
    console.error(error)
    return
  }

  console.log('ACCESS TOKEN:')
  console.log(data.session?.access_token)
}

main()