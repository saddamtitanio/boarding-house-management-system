import { SupabaseClient } from '@supabase/supabase-js'
import { roomsRepository } from './rooms.repository'

export const roomsService = {
  getTenantRooms: async (supabase: SupabaseClient) => {
    return await roomsRepository.listForTenant(supabase);
  },

  getManagementRooms: async (supabase: SupabaseClient) => {
    return await roomsRepository.listForManagement(supabase);
  },

  getRoomById: async (supabase: SupabaseClient, id: string) => {
    return roomsRepository.getById(supabase, id)
  },

  createRoom: async (
    supabase: SupabaseClient,
    input: {
      name: string
      description?: string
      price: number
      status?: string
      images?: string[]
    }
  ) => {
    // create room
    const room = await roomsRepository.create(supabase, input)

    if (room.error || !room.data) {
      return room
    }

    const roomId = room.data.id

    // handle images (optional)
    if (input.images?.length) {
      const imagesResult = await roomsRepository.replaceImages(
        supabase,
        roomId,
        input.images
      )

      if (imagesResult.error) {
        return { data: null, error: imagesResult.error }
      }
    }

    return room
  },

  updateRoom: async (
    supabase: SupabaseClient,
    input: {
      id: string
      name?: string
      description?: string
      price?: number
      status?: string
      images?: string[]
    }
  ) => {
    // update room fields
    const room = await roomsRepository.update(supabase, {
      id: input.id,
      name: input.name?.trim(),
      description: input.description,
      price: input.price,
      status: input.status
    })

    if (room.error || !room.data) {
      return room
    }

    // replace images if provided
    if (input.images?.length) {
      const imagesResult = await roomsRepository.replaceImages(
        supabase,
        input.id,
        input.images
      )

      if (imagesResult.error) {
        return { data: null, error: imagesResult.error }
      }
    }

    return room
  },

  deleteRoom: async (supabase: SupabaseClient, id: string) => {
    return roomsRepository.delete(supabase, id)
  }
}