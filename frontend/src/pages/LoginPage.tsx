import { useState, type CSSProperties, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { ApiError } from '../api/client'

type Mode = 'signin' | 'register'

type Field = 'email' | 'username' | 'password'

type FieldStatus = 'neutral' | 'invalid' | 'valid'

interface FieldErrors {
  email?: string
  username?: string
  password?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const usernamePattern = /^[a-zA-Z0-9_]+$/
const specialPattern = /[!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?]/

const passwordRules: { label: string; test: (password: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (password) => password.length >= 8 },
  { label: 'An uppercase letter', test: (password) => /[A-Z]/.test(password) },
  { label: 'A lowercase letter', test: (password) => /[a-z]/.test(password) },
  { label: 'A number', test: (password) => /[0-9]/.test(password) },
  { label: 'A special character', test: (password) => specialPattern.test(password) },
]

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error &&
    'fieldErrors' in error
  )
}

function emailError(email: string): string | undefined {
  return emailPattern.test(email.trim()) ? undefined : 'Enter a valid email address.'
}

function usernameError(username: string): string | undefined {
  if (username.length < 3 || username.length > 50 || !usernamePattern.test(username)) {
    return 'Use 3–50 letters, numbers or underscores.'
  }
  return undefined
}

function passwordError(mode: Mode, password: string): string | undefined {
  if (mode === 'register') {
    return passwordRules.every((rule) => rule.test(password))
      ? undefined
      : 'Use at least 8 characters with an uppercase, a lowercase, a number and a special character.'
  }

  return password.length === 0 ? 'Enter your password.' : undefined
}

function validate(mode: Mode, email: string, username: string, password: string): FieldErrors {
  const errors: FieldErrors = {}

  const email_ = emailError(email)
  if (email_) {
    errors.email = email_
  }

  if (mode === 'register') {
    const username_ = usernameError(username)
    if (username_) {
      errors.username = username_
    }
  }

  const password_ = passwordError(mode, password)
  if (password_) {
    errors.password = password_
  }

  return errors
}

const borderByStatus: Record<FieldStatus, string> = {
  neutral: 'border-ink-700 focus:border-ink-400',
  invalid: 'border-danger-500',
  valid: 'border-success-500',
}

function AlertIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.01" />
    </svg>
  )
}

function CheckIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function DotIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}

function EyeIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.9 5.2A9.5 9.5 0 0 1 12 5c7 0 10.5 7 10.5 7a18 18 0 0 1-2.4 3.3M6.3 6.3A17.7 17.7 0 0 0 1.5 12S5 19 12 19a9.4 9.4 0 0 0 5.7-1.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M3 3l18 18" />
    </svg>
  )
}

interface Cover {
  bg: string
  a: Shape
  b: Shape
}

interface Shape {
  left: string
  top: string
  width: string
  height: string
  radius: string
  color: string
}

function shape(v: [string, string, string, string, string, string]): Shape {
  return { left: v[0], top: v[1], width: v[2], height: v[3], radius: v[4], color: v[5] }
}

const covers: Cover[] = [
  { bg: '#C4492E', a: shape(['22%', '16%', '56%', '56%', '50%', '#F2E3C6']), b: shape(['0', '76%', '100%', '24%', '0', '#3B1A12']) },
  { bg: '#1F4E5F', a: shape(['18%', '18%', '30%', '64%', '0', '#E9C46A']), b: shape(['52%', '18%', '30%', '64%', '0', '#F4EDE0']) },
  { bg: '#E9D8A6', a: shape(['0', '52%', '100%', '48%', '0', '#2B2D42']), b: shape(['36%', '30%', '28%', '28%', '50%', '#D1495B']) },
  { bg: '#23307A', a: shape(['28%', '30%', '44%', '44%', '50%', '#F28F3B']), b: shape(['68%', '16%', '12%', '12%', '50%', '#F4EDE0']) },
  { bg: '#101418', a: shape(['18%', '18%', '64%', '64%', '50%', '#E63973']), b: shape(['36%', '36%', '28%', '28%', '50%', '#101418']) },
  { bg: '#B5651D', a: shape(['0', '0', '38%', '100%', '0', '#1B1B1B']), b: shape(['50%', '33%', '34%', '34%', '50%', '#EAD7B7']) },
  { bg: '#6B8F71', a: shape(['16%', '14%', '68%', '72%', '50% 50% 0 0', '#F4F1DE']), b: shape(['0', '70%', '100%', '30%', '0', '#2F4A36']) },
  { bg: '#D9D4C7', a: shape(['28%', '0', '7%', '100%', '0', '#3A3A3A']), b: shape(['46%', '38%', '34%', '34%', '3%', '#B23A48']) },
  { bg: '#0E3B43', a: shape(['0', '0', '100%', '50%', '0', '#8FD5C5']), b: shape(['30%', '30%', '40%', '40%', '50%', '#0E3B43']) },
]

function shapeStyle(s: Shape): CSSProperties {
  return {
    position: 'absolute',
    left: s.left,
    top: s.top,
    width: s.width,
    height: s.height,
    borderRadius: s.radius,
    background: s.color,
  }
}

const inputBase =
  'h-11 pl-3 rounded-md border bg-ink-900 text-ink-100 text-body-lg'

export default function LoginPage() {
  const { token, isLoading, login, register } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    email: false,
    username: false,
    password: false,
  })
  const [serverErrors, setServerErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (isLoading) {
    return null
  }

  if (token) {
    return <Navigate to="/playlists" replace />
  }

  const isReg = mode === 'register'
  const clientErrors = validate(mode, email, username, password)

  function switchMode(next: Mode) {
    setMode(next)
    setTouched({ email: false, username: false, password: false })
    setServerErrors({})
    setFormError(null)
    setShowPassword(false)
  }

  function markTouched(field: Field) {
    setTouched((current) => (current[field] ? current : { ...current, [field]: true }))
  }

  function clearServerError(field: Field) {
    setServerErrors((current) => {
      if (!(field in current)) {
        return current
      }

      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function fieldError(field: Field): string | undefined {
    if (serverErrors[field]) {
      return serverErrors[field]
    }
    return touched[field] ? clientErrors[field] : undefined
  }

  function fieldStatus(field: Field): FieldStatus {
    if (fieldError(field)) {
      return 'invalid'
    }
    if (touched[field] && !clientErrors[field]) {
      return 'valid'
    }
    return 'neutral'
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()

    if (pending) {
      return
    }

    setServerErrors({})
    setFormError(null)
    setTouched({ email: true, username: true, password: true })

    if (Object.keys(clientErrors).length > 0) {
      return
    }

    setPending(true)

    try {
      if (isReg) {
        await register({ email, username, password })
      } else {
        await login({ email, password })
      }

      navigate('/playlists', { replace: true })
    } catch (error) {
      if (isApiError(error) && error.status === 400 && error.fieldErrors) {
        const mapped: FieldErrors = {}

        for (const [key, messages] of Object.entries(error.fieldErrors)) {
          const field = key.toLowerCase()
          if ((field === 'email' || field === 'username' || field === 'password') && messages[0]) {
            mapped[field] = messages[0]
          }
        }

        if (Object.keys(mapped).length > 0) {
          setServerErrors(mapped)
        } else {
          setFormError(isApiError(error) ? error.message : 'Something went wrong.')
        }
      } else {
        setFormError(isApiError(error) ? error.message : 'Something went wrong.')
      }
    } finally {
      setPending(false)
    }
  }

  const submitLabel = isReg ? 'Create account' : 'Sign in'
  const pendingLabel = isReg ? 'Creating account…' : 'Signing in…'

  const emailStatus = fieldStatus('email')
  const usernameStatus = fieldStatus('username')
  const passwordStatus = fieldStatus('password')
  const emailErr = fieldError('email')
  const usernameErr = fieldError('username')
  const passwordErr = fieldError('password')
  const passwordDescribedBy = isReg
    ? [serverErrors.password ? 'password-error' : null, 'password-rules'].filter(Boolean).join(' ')
    : passwordErr
      ? 'password-error'
      : undefined

  return (
    <div className="min-h-screen flex flex-wrap bg-ink-950 text-ink-100 font-sans text-body">
      <section
        aria-hidden="true"
        className="hidden min-[900px]:flex flex-[1_1_560px] min-w-0 flex-col justify-between gap-12 p-12 border-r border-ink-750 bg-ink-900"
      >
        <div className="flex items-center gap-2.5 font-semibold text-base tracking-[-0.01em]">
          <span className="grid grid-cols-[repeat(2,8px)] gap-0.5">
            <span className="w-2 h-2 rounded-xs bg-ink-100" />
            <span className="w-2 h-2 rounded-xs bg-ink-100" />
            <span className="w-2 h-2 rounded-xs bg-ink-100" />
            <span className="w-2 h-2 rounded-xs bg-accent" />
          </span>
          Songify
        </div>
        <div className="grid grid-cols-3 gap-3 w-full max-w-[480px]">
          {covers.map((cover, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden rounded-lg"
              style={{ background: cover.bg }}
            >
              <div style={shapeStyle(cover.a)} />
              <div style={shapeStyle(cover.b)} />
            </div>
          ))}
        </div>
        <p className="m-0 max-w-[400px] text-heading font-normal text-ink-200">
          Build playlists from one shared catalog. Reorder them, preview a track, share the list.
        </p>
      </section>

      <main className="flex-[1_1_440px] min-w-0 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px] flex flex-col gap-7">
          <div
            role="group"
            aria-label="Choose form"
            className="grid grid-cols-2 p-1 bg-ink-900 border border-ink-750 rounded-lg"
          >
            <button
              type="button"
              aria-pressed={!isReg}
              onClick={() => switchMode('signin')}
              className={`h-9 rounded-md text-sm font-medium ${
                isReg ? 'bg-transparent text-ink-400 hover:text-ink-100' : 'bg-ink-750 text-ink-100'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              aria-pressed={isReg}
              onClick={() => switchMode('register')}
              className={`h-9 rounded-md text-sm font-medium ${
                isReg ? 'bg-ink-750 text-ink-100' : 'bg-transparent text-ink-400 hover:text-ink-100'
              }`}
            >
              Register
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-title">{isReg ? 'Create your account' : 'Welcome back'}</h1>
            <p className="m-0 text-ink-400">
              {isReg
                ? 'Pick a username — it’s how your playlists are labelled.'
                : 'Sign in to get to your playlists.'}
            </p>
          </div>

          {formError && (
            <div
              role="alert"
              className="flex gap-2.5 items-start px-3.5 py-3 bg-danger-950 border border-danger-800 rounded-md text-danger-300"
            >
              <span className="flex-none mt-0.5">
                <AlertIcon size={16} color="#F2766B" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{formError}</span>
                {isReg && (
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="self-start p-0 border-0 bg-none text-danger-300 underline underline-offset-[3px] text-sm hover:text-ink-100"
                  >
                    Sign in instead
                  </button>
                )}
              </div>
            </div>
          )}

          <form className="flex flex-col gap-[18px]" onSubmit={onSubmit} noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-small font-medium text-ink-300">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    clearServerError('email')
                  }}
                  onBlur={() => markTouched('email')}
                  aria-invalid={emailErr ? true : undefined}
                  aria-describedby={emailErr ? 'email-error' : undefined}
                  className={`${inputBase} ${emailStatus === 'valid' ? 'pr-10' : 'pr-3'} ${borderByStatus[emailStatus]}`}
                />
                {emailStatus === 'valid' && (
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-success-400">
                    <CheckIcon size={16} />
                  </span>
                )}
              </div>
              {emailErr && (
                <p
                  id="email-error"
                  className="m-0 flex gap-1.5 items-center text-caption font-normal text-danger-400"
                >
                  <AlertIcon size={14} color="currentColor" />
                  {emailErr}
                </p>
              )}
            </div>

            {isReg && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="username" className="text-small font-medium text-ink-300">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value)
                      clearServerError('username')
                    }}
                    onBlur={() => markTouched('username')}
                    aria-invalid={usernameErr ? true : undefined}
                    aria-describedby={usernameErr ? 'username-error' : undefined}
                    className={`${inputBase} ${usernameStatus === 'valid' ? 'pr-10' : 'pr-3'} ${borderByStatus[usernameStatus]}`}
                  />
                  {usernameStatus === 'valid' && (
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-success-400">
                      <CheckIcon size={16} />
                    </span>
                  )}
                </div>
                {usernameErr && (
                  <p
                    id="username-error"
                    className="m-0 flex gap-1.5 items-center text-caption font-normal text-danger-400"
                  >
                    <AlertIcon size={14} color="currentColor" />
                    {usernameErr}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-small font-medium text-ink-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isReg ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    clearServerError('password')
                  }}
                  onBlur={() => markTouched('password')}
                  aria-invalid={passwordErr ? true : undefined}
                  aria-describedby={passwordDescribedBy || undefined}
                  className={`${inputBase} ${passwordStatus === 'valid' ? 'pr-16' : 'pr-10'} ${borderByStatus[passwordStatus]}`}
                />
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1.5">
                  {passwordStatus === 'valid' && (
                    <span className="flex items-center text-success-400">
                      <CheckIcon size={16} />
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((current) => !current)}
                    className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-sm text-ink-400 hover:text-ink-100"
                  >
                    {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
              </div>
              {isReg ? (
                <div className="flex flex-col gap-1.5">
                  {serverErrors.password && (
                    <p
                      id="password-error"
                      className="m-0 flex gap-1.5 items-center text-caption font-normal text-danger-400"
                    >
                      <AlertIcon size={14} color="currentColor" />
                      {serverErrors.password}
                    </p>
                  )}
                  <ul
                    id="password-rules"
                    className="m-0 grid grid-cols-2 gap-x-3 gap-y-1 list-none p-0 text-caption font-normal"
                  >
                    {passwordRules.map((rule) => {
                      const met = rule.test(password)
                      return (
                        <li
                          key={rule.label}
                          className={`flex items-center gap-1.5 ${met ? 'text-success-400' : 'text-ink-400'}`}
                        >
                          <span className="flex-none">
                            {met ? <CheckIcon size={13} /> : <DotIcon size={13} />}
                          </span>
                          {rule.label}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : (
                passwordErr && (
                  <p
                    id="password-error"
                    className="m-0 flex gap-1.5 items-center text-caption font-normal text-danger-400"
                  >
                    <AlertIcon size={14} color="currentColor" />
                    {passwordErr}
                  </p>
                )
              )}
            </div>

            <button
              type="submit"
              disabled={pending}
              className="h-11 mt-1.5 rounded-md bg-accent text-accent-fg text-body-lg font-semibold hover:bg-accent-500 disabled:bg-ink-800 disabled:text-ink-500"
            >
              {pending ? pendingLabel : submitLabel}
            </button>
          </form>

          <p className="m-0 text-ink-400 text-center">
            {isReg ? 'Already have an account? ' : 'New to Songify? '}
            <button
              type="button"
              onClick={() => switchMode(isReg ? 'signin' : 'register')}
              className="p-0 border-0 bg-none text-ink-100 text-sm font-medium underline underline-offset-[3px] hover:text-accent"
            >
              {isReg ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
