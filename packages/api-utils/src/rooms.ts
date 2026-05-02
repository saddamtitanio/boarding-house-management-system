import { SupabaseClient } from '@supabase/supabase-js'

// tenant and public version
export async function getRoomsTenant(supabase: SupabaseClient) {
  return supabase
    .from('rooms')
    .select(`*, room_images (id, url)`)
    .limit(1, { foreignTable: 'room_images' })
    .eq('status', 'vacant')
    .order('created_at', { ascending: false });
}

// management version
export async function getRoomsManagement(supabase: SupabaseClient) {
  return supabase
    .from('rooms')
    .select(`*, room_images (id, url)`)
    .limit(1, { foreignTable: 'room_images' })
    .order('created_at', { ascending: false });
}

export async function getRoom(supabase: SupabaseClient, id: string) {
  return supabase
    .from('rooms')
    .select(`*, room_images (id, url)`)
    .eq('id', id)
    .single()
}

export async function createRoom(supabase: SupabaseClient, body: {
  name: string
  description?: string
  price: number
  status?: string
}) {
  return supabase
    .from('rooms')
    .insert(body)
    .select()
    .single()
}

export async function replaceRoomImages(
  supabase: SupabaseClient,
  roomId: string,
  images: string[]
) {
  // delete old images
  const { error: deleteError } = await supabase
    .from('room_images')
    .delete()
    .eq('room_id', roomId)

  if (deleteError) {
    return { data: null, error: deleteError }
  }

  // insert new images
  const { data, error } = await supabase
    .from('room_images')
    .insert(
      images.map((url) => ({
        room_id: roomId,
        url,
      }))
    )
    .select()

  return { data, error }
}

async function updateRoom(supabase: SupabaseClient, id: string, body: Partial<{
  name: string
  description: string
  price: number
  status: string
}>) {
  return supabase
    .from('rooms')
    .update(body)
    .eq('id', id)
    .select()
    .single()
}

export async function updateRoomWithImages(
  supabase: any,
  id: string,
  body: any
) {
  // update main room
  const { data, error } = await updateRoom(supabase, id, {
    name: body.name?.trim(),
    price: body.price,
    description: body.description,
    status: body.status,
  })

  if (error) return { data: null, error }

  // handle images (optional)
  if (body.images?.length) {
    const imgResult = await replaceRoomImages(
      supabase,
      id,
      body.images
    )

    if (imgResult.error) return imgResult
  }

  return { data, error: null }
}

export async function deleteRoom(supabase: SupabaseClient, id: string) {
  return supabase
    .from('rooms')
    .delete()
    .eq('id', id)
    .select()
    .maybeSingle()
}