import { client } from './client'
import type { AuthResponse, LoginRequest, RegisterRequest } from './types'

export async function register(request: RegisterRequest): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/api/auth/register', request)
  return data
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/api/auth/login', request)
  return data
}
