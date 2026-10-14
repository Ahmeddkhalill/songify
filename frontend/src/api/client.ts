import axios, { AxiosError } from 'axios'
import { clearSession, getToken } from '../auth/storage'

export interface ApiError {
  status: number
  code: string | null
  message: string
  fieldErrors: Record<string, string[]> | null
}

interface ProblemBody {
  title?: string
  status?: number
  errors?: unknown
}

interface BusinessError {
  code: string
  message: string
}

function isBusinessError(errors: unknown): errors is BusinessError {
  return (
    typeof errors === 'object' &&
    errors !== null &&
    'code' in errors &&
    typeof (errors as Record<string, unknown>).code === 'string'
  )
}

function toFieldErrors(errors: unknown): Record<string, string[]> {
  const result: Record<string, string[]> = {}

  if (typeof errors === 'object' && errors !== null) {
    for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        result[key.toLowerCase()] = value.map(String)
      }
    }
  }

  return result
}

function normalizeError(error: AxiosError<ProblemBody>): ApiError {
  const status = error.response?.status ?? 0
  const body = error.response?.data
  const errors = body?.errors

  if (isBusinessError(errors)) {
    return {
      status,
      code: errors.code,
      message: errors.message,
      fieldErrors: null,
    }
  }

  if (errors) {
    return {
      status,
      code: null,
      message: body?.title ?? 'One or more validation errors occurred.',
      fieldErrors: toFieldErrors(errors),
    }
  }

  return {
    status,
    code: null,
    message: body?.title ?? error.message ?? 'Something went wrong.',
    fieldErrors: null,
  }
}

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

client.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ProblemBody>) => {
    if (error.response?.status === 401) {
      clearSession()

      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    return Promise.reject(normalizeError(error))
  },
)
