import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve('.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAsTenant() {
  // Let's find the tenant Saddam Titanio
  const { data: tenant } = await supabase.from('profiles').select('id, first_name').eq('first_name', 'Saddam Titanio').single()
  const { data: staff } = await supabase.from('profiles').select('id, first_name, role:roles(name)').eq('first_name', 'Employee User').single()

  if (!tenant || !staff) {
    console.error('Tenant or staff not found')
    return
  }

  console.log(`Testing conversation creation as tenant: ${tenant.first_name} (${tenant.id}) with staff: ${staff.first_name} (${staff.id})`)

  // Create a client authenticated as the tenant
  // Wait, we can bypass using JWT token or just use sign in.
  // Or we can simulate RLS by setting claims using custom supabase client config if possible?
  // Actually, we can use the supabase auth.signUp / signIn or we can inspect RLS using PostgreSQL policies query!
  // Let's query the actual active policies on public.conversations and public.conversation_participants.
  const { data: policies, error: polError } = await supabase.rpc('get_policies_for_table', { table_name: 'conversation_participants' })
  // If the RPC doesn't exist, we can use a direct SQL query through the postgres catalog if we query it.
  
  const { data: catalogPolicies, error: catalogErr } = await supabase
    .from('pg_policies' as any)
    .select('*')
  
  // Wait, let's write a query to read all RLS policies from pg_policies via service role
  const { data: pgPolicies, error: pgErr } = await supabase.rpc('pg_execute' as any, { query: 'SELECT * FROM pg_policies' })
  
  console.log('Policies error if any:', pgErr || catalogErr)
  
  // Let's create a conversation as the tenant user.
  // To act as the tenant, we can sign in or generate a JWT or use supabase.auth.admin.generateLink or create a session.
  // Or we can just sign in using password if we know it?
  // Let's sign in using: email = tenant's email.
  // Wait! Let's get the tenant's email from auth.users.
  const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(tenant.id)
  if (authErr || !authUser.user) {
    console.error('Error fetching auth user:', authErr)
    return
  }

  const email = authUser.user.email
  console.log(`Tenant email: ${email}`)

  // Let's create a client acting as the tenant
  // Since we don't have password, we can generate a session or sign in using password.
  // Wait, can we use supabase.auth.admin.generateLink or just log in?
  // Reset tenant password via Admin API so we can log in
  console.log('Resetting password for testing...')
  const { error: resetErr } = await supabase.auth.admin.updateUserById(tenant.id, {
    password: 'testpassword123'
  })

  if (resetErr) {
    console.error('Error resetting password:', resetErr)
    return
  }

  // Create client authenticated as the tenant
  const tenantClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
  
  const { data: signInData, error: signInErr } = await tenantClient.auth.signInWithPassword({
    email: email!,
    password: 'testpassword123'
  })

  if (signInErr) {
    console.error('Error signing in:', signInErr)
    return
  }

  console.log('Logged in as tenant successfully!')

  // Now, let's try to list staff members
  console.log('\n--- 1. Testing GET /api/messages/staff ---')
  const { data: staffList, error: staffErr } = await tenantClient
    .from('profiles')
    .select('id, first_name, last_name, role:roles!inner(name)')
    .in('roles.name', ['admin', 'employee'])
  
  if (staffErr) {
    console.error('Failed to select staff list:', staffErr)
  } else {
    console.log('Staff list selected successfully! Total staff found:', staffList?.length)
    console.log(staffList)
  }

  // Now, let's try to create a conversation with the staff member
  console.log('\n--- 2. Testing conversation creation ---')
  const { data: newConv, error: newConvErr } = await tenantClient
    .from('conversations')
    .insert({})
    .select()
    .single()

  if (newConvErr) {
    console.error('Failed to insert conversation:', newConvErr)
    return
  }

  console.log('Conversation created successfully:', newConv)

  // Now, add the tenant as a participant
  console.log('\n--- 3. Adding tenant as participant ---')
  const { data: p1, error: p1Err } = await tenantClient
    .from('conversation_participants')
    .insert({
      conversation_id: newConv.id,
      profile_id: tenant.id
    })
    .select()
    
  if (p1Err) {
    console.error('Failed to add tenant as participant:', p1Err)
  } else {
    console.log('Tenant added as participant successfully:', p1)
  }

  // Now, add the staff as a participant
  console.log('\n--- 4. Adding staff as participant ---')
  const { data: p2, error: p2Err } = await tenantClient
    .from('conversation_participants')
    .insert({
      conversation_id: newConv.id,
      profile_id: staff.id
    })
    .select()

  if (p2Err) {
    console.error('Failed to add staff as participant:', p2Err)
  } else {
    console.log('Staff added as participant successfully:', p2)
  }

  // Try to send a message
  console.log('\n--- 5. Sending test message ---')
  const { data: msg, error: msgErr } = await tenantClient
    .from('messages')
    .insert({
      conversation_id: newConv.id,
      sender_id: tenant.id,
      content: 'Hello, this is a test message from tenant Saddam!'
    })
    .select()

  if (msgErr) {
    console.error('Failed to send message:', msgErr)
  } else {
    console.log('Message sent successfully:', msg)
  }

  // Cleanup: delete the conversation using service role key
  console.log('\nCleaning up conversation...')
  await supabase.from('conversations').delete().eq('id', newConv.id)
  console.log('Cleaned up!')
}

testAsTenant().catch(console.error)
