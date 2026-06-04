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
      floor: number
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
      floor?: number
      images?: string[]
    }
  ) => {
    let room;

    const hasFieldsToUpdate = 
      input.name !== undefined ||
      input.description !== undefined ||
      input.price !== undefined ||
      input.floor !== undefined ||
      input.status !== undefined;

    if (hasFieldsToUpdate) {
      // update room fields
      room = await roomsRepository.update(supabase, {
        id: input.id,
        name: input.name?.trim(),
        description: input.description,
        price: input.price,
        floor: input.floor,
        status: input.status
      })

      if (room.error || !room.data) {
        return room
      }
    } else {
      // Fetch current room state if no core fields are being updated
      room = await roomsRepository.getById(supabase, input.id)
      if (room.error || !room.data) {
        return room
      }
    }

    // replace images if provided
    if (input.images !== undefined) {
      const imagesResult = await roomsRepository.replaceImages(
        supabase,
        input.id,
        input.images
      )

      if (imagesResult.error) {
        return { data: null, error: imagesResult.error }
      }

      // Re-fetch to return latest data including updated images list
      room = await roomsRepository.getById(supabase, input.id)
    }

    return room
  },

  deleteRoom: async (supabase: SupabaseClient, id: string) => {
    return roomsRepository.delete(supabase, id)
  }
}