import { client } from './client'
import type {
  CreateSongRequest,
  PaginatedList,
  RequestFilters,
  Song,
  UpdateSongRequest,
} from './types'

export async function searchSongs(
  filters: RequestFilters = {},
  signal?: AbortSignal,
): Promise<PaginatedList<Song>> {
  const { data } = await client.get<PaginatedList<Song>>('/api/songs', { params: filters, signal })
  return data
}

export async function getSong(id: number): Promise<Song> {
  const { data } = await client.get<Song>(`/api/songs/${id}`)
  return data
}

export async function createSong(request: CreateSongRequest): Promise<Song> {
  const { data } = await client.post<Song>('/api/songs', request)
  return data
}

export async function updateSong(id: number, request: UpdateSongRequest): Promise<void> {
  await client.put(`/api/songs/${id}`, request)
}

export async function deleteSong(id: number): Promise<void> {
  await client.delete(`/api/songs/${id}`)
}
