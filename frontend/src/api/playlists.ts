import { client } from './client'
import type {
  AddSongToPlaylistRequest,
  CreatePlaylistRequest,
  PlaylistDetail,
  PlaylistSummary,
  ReorderSongRequest,
  UpdatePlaylistRequest,
} from './types'

export async function getPlaylists(): Promise<PlaylistSummary[]> {
  const { data } = await client.get<PlaylistSummary[]>('/api/playlists')
  return data
}

export async function getPlaylist(id: number): Promise<PlaylistDetail> {
  const { data } = await client.get<PlaylistDetail>(`/api/playlists/${id}`)
  return data
}

export async function createPlaylist(request: CreatePlaylistRequest): Promise<PlaylistSummary> {
  const { data } = await client.post<PlaylistSummary>('/api/playlists', request)
  return data
}

export async function updatePlaylist(id: number, request: UpdatePlaylistRequest): Promise<void> {
  await client.put(`/api/playlists/${id}`, request)
}

export async function deletePlaylist(id: number): Promise<void> {
  await client.delete(`/api/playlists/${id}`)
}

export async function addSongToPlaylist(
  id: number,
  request: AddSongToPlaylistRequest,
): Promise<void> {
  await client.post(`/api/playlists/${id}/songs`, request)
}

export async function removeSongFromPlaylist(id: number, songId: number): Promise<void> {
  await client.delete(`/api/playlists/${id}/songs/${songId}`)
}

export async function reorderSong(
  id: number,
  songId: number,
  request: ReorderSongRequest,
): Promise<void> {
  await client.put(`/api/playlists/${id}/songs/${songId}/position`, request)
}
