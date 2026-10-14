import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const username = user?.username ?? ''
  const initial = username.charAt(0).toUpperCase()

  function onSignOut() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="h-16 border-b border-ink-750 bg-ink-950">
      <div className="max-w-[1280px] h-full mx-auto px-8 flex items-center justify-between gap-4">
        <Link
          to="/playlists"
          className="flex items-center gap-2.5 text-ink-100 font-semibold text-base tracking-[-0.01em]"
        >
          <span aria-hidden="true" className="grid grid-cols-[repeat(2,8px)] gap-0.5">
            <span className="w-2 h-2 rounded-xs bg-ink-100" />
            <span className="w-2 h-2 rounded-xs bg-ink-100" />
            <span className="w-2 h-2 rounded-xs bg-ink-100" />
            <span className="w-2 h-2 rounded-xs bg-accent" />
          </span>
          Songify
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-small text-ink-300">
            <span
              aria-hidden="true"
              className="w-7 h-7 grid place-items-center rounded-full bg-ink-750 text-ink-200 text-[12px] font-semibold"
            >
              {initial}
            </span>
            {username}
          </div>
          <span aria-hidden="true" className="w-px h-5 bg-ink-750" />
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-1.5 h-9 px-2.5 rounded-md text-small font-medium text-ink-300 hover:bg-ink-800 hover:text-ink-100"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
