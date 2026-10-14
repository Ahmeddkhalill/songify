export interface AuthResponse {
  userId: number
  email: string
  username: string
  token: string
  expiresInSeconds: number
}

export interface Song {
  id: number
  title: string
  artist: string
  album: string | null
  durationInSeconds: number
  coverImageUrl: string | null
  previewUrl: string | null
}

export interface PlaylistSong {
  id: number
  title: string
  artist: string
  album: string | null
  durationInSeconds: number
  coverImageUrl: string | null
  previewUrl: string | null
  position: number
  addedAt: string
}

export interface PlaylistSummary {
  id: number
  name: string
  description: string | null
  songCount: number
  totalDurationInSeconds: number
  coverImageUrls: string[]
  createdAt: string
  updatedAt: string
}

export interface PlaylistDetail {
  id: number
  name: string
  description: string | null
  songCount: number
  totalDurationInSeconds: number
  createdAt: string
  updatedAt: string
  songs: PlaylistSong[]
}

export interface PaginatedList<T> {
  items: T[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface RequestFilters {
  pageNumber?: number
  pageSize?: number
  searchValue?: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface CreatePlaylistRequest {
  name: string
  description: string | null
}

export interface UpdatePlaylistRequest {
  name: string
  description: string | null
}

export interface AddSongToPlaylistRequest {
  songId: number
}

export interface ReorderSongRequest {
  newPosition: number
}

export interface CreateSongRequest {
  title: string
  artist: string
  album: string | null
  durationInSeconds: number
  coverImageUrl: string | null
  previewUrl: string | null
}

export interface UpdateSongRequest {
  title: string
  artist: string
  album: string | null
  durationInSeconds: number
  coverImageUrl: string | null
  previewUrl: string | null
}
