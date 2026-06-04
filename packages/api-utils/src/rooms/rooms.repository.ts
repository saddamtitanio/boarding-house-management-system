import { SupabaseClient } from '@supabase/supabase-js'

const baseSelect = `
  id,
  name,
  description,
  price,
  status,
  floor,
  created_at,
  room_images (
    id,
    url
  ),
  bookings (
    id,
    status,
    start_date,
    end_date,
    tenant:profiles (
      id,
      first_name,
      last_name,
      phone
    )
  )
`

export const roomsRepository = {
  listForTenant: (supabase: SupabaseClient) => {
    return supabase
      .from('rooms')
      .select(baseSelect)
      .eq('status', 'vacant')
      .order('created_at', { ascending: false })
  },

  listForManagement: (supabase: SupabaseClient) => {
    return supabase
      .from('rooms')
      .select(baseSelect)
      .order('created_at', { ascending: false })
  },

  getById: (supabase: SupabaseClient, id: string) => {
    return supabase
      .from('rooms')
      .select(baseSelect)
      .eq('id', id)
      .single()
  },

  create: (
    supabase: SupabaseClient,
    input: {
      name: string
      description?: string
      price: number
      status?: string
      floor: number
    }
  ) => {
    return supabase
      .from('rooms')
      .insert({
        name: input.name,
        description: input.description,
        price: input.price,
        floor: input.floor,
        status: input.status ?? 'vacant'
      })
      .select(baseSelect)
      .single()
  },

  update: (
    supabase: SupabaseClient,
    input: {
      id: string
      name?: string
      description?: string
      price?: number
      status?: string
      floor?: number
    }
  ) => {
    const updateData: any = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.price !== undefined) updateData.price = input.price
    if (input.floor !== undefined) updateData.floor = input.floor
    if (input.status !== undefined) updateData.status = input.status

    return supabase
      .from('rooms')
      .update(updateData)
      .eq('id', input.id)
      .select(baseSelect)
      .single()
  },


  delete: (supabase: SupabaseClient, id: string) => {
    return supabase
      .from('rooms')
      .delete()
      .eq('id', id)
      .select(baseSelect)
      .maybeSingle()
  },

  replaceImages: async (
    supabase: SupabaseClient,
    roomId: string,
    images: string[]
  ) => {
    const deleteResult = await supabase
      .from('room_images')
      .delete()
      .eq('room_id', roomId)

    if (deleteResult.error) {
      return { data: null, error: deleteResult.error }
    }

    if (images.length === 0) {
      return { data: [], error: null }
    }

    const insertResult = await supabase
      .from('room_images')
      .insert(
        images.map((url) => ({
          room_id: roomId,
          url
        }))
      )
      .select()

    return insertResult
  }
}