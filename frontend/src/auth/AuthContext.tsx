import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'
import type { AuthResponse, LoginRequest, RegisterRequest } from '../api/types'
import { clearSession, getToken, getUser, setToken, setUser } from './storage'

interface AuthContextValue {
  user: AuthResponse | null
  token: string | null
  isLoading: boolean
  login: (request: LoginRequest) => Promise<void>
  register: (request: RegisterRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthResponse | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUserState(getUser())
    setTokenState(getToken())
    setIsLoading(false)
  }, [])

  function store(response: AuthResponse) {
    setUser(response)
    setToken(response.token)
    setUserState(response)
    setTokenState(response.token)
  }

  async function login(request: LoginRequest) {
    const response = await authApi.login(request)
    store(response)
  }

  async function register(request: RegisterRequest) {
    const response = await authApi.register(request)
    store(response)
  }

  function logout() {
    clearSession()
    setUserState(null)
    setTokenState(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, login, register, logout }),
    [user, token, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
