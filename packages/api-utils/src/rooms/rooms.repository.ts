import { SupabaseClient } from '@supabase/supabase-js'

const baseSelect = `
  id,
  name,
  description,
  price,
  status,
  created_at,
  room_images (
    id,
    url
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
    }
  ) => {
    return supabase
      .from('rooms')
      .insert({
        name: input.name,
        description: input.description,
        price: input.price,
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
    }
  ) => {
    return supabase
      .from('rooms')
      .update({
        name: input.name,
        description: input.description,
        price: input.price,
        status: input.status
      })
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