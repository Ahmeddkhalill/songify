import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { searchSongs } from '../api/songs'
import { useAudioPlayer } from '../audio/AudioPlayerContext'
import type { Song } from '../api/types'
import ErrorBanner from './ErrorBanner'
import Skeleton from './Skeleton'

const PAGE_SIZE = 20
const DEBOUNCE_MS = 300

const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const skeletonWidths = [
  ['62%', '38%'],
  ['48%', '30%'],
  ['70%', '42%'],
  ['55%', '34%'],
  ['44%', '28%'],
  ['66%', '40%'],
]

type Status = 'loading' | 'loadingMore' | 'ready' | 'error'

interface AddSongsPanelProps {
  open: boolean
  onClose: () => void
  addedSongIds: number[]
  onAddSong: (song: Song) => Promise<void>
}

function formatTrackDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function SearchIcon({ stroke }: { stroke: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
    </svg>
  )
}

function ResultRow({
  song,
  added,
  justAdded,
  active,
  playing,
  onTogglePlay,
  onAdd,
}: {
  song: Song
  added: boolean
  justAdded: boolean
  active: boolean
  playing: boolean
  onTogglePlay: () => void
  onAdd: () => void
}) {
  const hasPreview = song.previewUrl !== null

  return (
    <li
      onClick={onTogglePlay}
      className={`res flex items-center gap-3 min-h-[64px] pl-3 pr-2 rounded-md transition-colors duration-500 has-[[data-row-play]:focus-visible]:ring-2 has-[[data-row-play]:focus-visible]:ring-inset has-[[data-row-play]:focus-visible]:ring-accent ${
        hasPreview ? 'cursor-pointer' : ''
      } ${justAdded ? 'bg-accent-950' : 'hover:bg-ink-850'}`}
    >
      <div
        className={`flex-none w-12 h-12 rounded-sm overflow-hidden bg-ink-800 ${
          added ? 'opacity-55' : ''
        }`}
      >
        {song.coverImageUrl && (
          <img src={song.coverImageUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <span
          className={`font-medium truncate ${
            active ? 'text-accent' : added ? 'text-ink-400' : 'text-ink-100'
          }`}
        >
          {song.title}
        </span>
        <span className="text-small text-ink-400 truncate">
          {song.artist} · <span className="font-mono tabular-nums">{formatTrackDuration(song.durationInSeconds)}</span>
        </span>
      </div>
      {song.previewUrl && (
        <button
          type="button"
          data-row-play
          onClick={(event) => {
            event.stopPropagation()
            onTogglePlay()
          }}
          aria-label={playing ? `Pause ${song.title}` : `Play ${song.title}`}
          className={`flex-none w-9 h-9 grid place-items-center rounded-md ${
            active ? 'text-accent' : 'text-ink-400 hover:bg-ink-800 hover:text-ink-100'
          }`}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
      )}
      {added ? (
        <span className="flex-none flex items-center gap-1.5 h-9 pl-2.5 pr-3 text-ink-400 text-small font-medium">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
          In playlist
        </span>
      ) : (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onAdd()
          }}
          aria-label={`Add ${song.title} by ${song.artist}`}
          className="add flex-none flex items-center gap-1.5 h-9 pl-2.5 pr-3 border border-ink-700 rounded-md bg-transparent text-ink-100 text-small font-medium hover:bg-ink-750 hover:border-ink-500"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add
        </button>
      )}
    </li>
  )
}

export default function AddSongsPanel({
  open,
  onClose,
  addedSongIds,
  onAddSong,
}: AddSongsPanelProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<Song[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [status, setStatus] = useState<Status>('loading')
  const [justAdded, setJustAdded] = useState<Set<number>>(new Set())
  const [addError, setAddError] = useState<Song | null>(null)
  const { current, isPlaying, toggle } = useAudioPlayer()

  const previewQueue = useMemo(
    () =>
      results
        .filter((song): song is Song & { previewUrl: string } => song.previewUrl !== null)
        .map((song) => ({
          id: song.id,
          url: song.previewUrl,
          title: song.title,
          artist: song.artist,
          coverImageUrl: song.coverImageUrl,
        })),
    [results],
  )

  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  const runSearch = useCallback(async (value: string, pageNumber: number, append: boolean) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setStatus(append ? 'loadingMore' : 'loading')

    try {
      const data = await searchSongs(
        { searchValue: value || undefined, pageNumber, pageSize: PAGE_SIZE },
        controller.signal,
      )
      if (controller.signal.aborted) {
        return
      }
      setPage(data.pageNumber)
      setTotalCount(data.totalCount)
      setHasNextPage(data.hasNextPage)
      setResults((current) => (append ? [...current, ...data.items] : data.items))
      setStatus('ready')
    } catch {
      if (controller.signal.aborted) {
        return
      }
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const trigger = document.activeElement as HTMLElement | null
    const { body } = document
    const previousOverflow = body.style.overflow
    body.style.overflow = 'hidden'

    inputRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      const panel = panelRef.current
      if (event.key !== 'Tab' || !panel) {
        return
      }

      const items = panel.querySelectorAll<HTMLElement>(focusableSelector)
      if (items.length === 0) {
        return
      }

      const first = items[0]
      const last = items[items.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      body.style.overflow = previousOverflow
      controllerRef.current?.abort()
      trigger?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setDebouncedQuery('')
      setJustAdded(new Set())
      setAddError(null)
    }
  }, [open])

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [query])

  useEffect(() => {
    if (open) {
      runSearch(debouncedQuery, 1, false)
    }
  }, [open, debouncedQuery, runSearch])

  if (!open) {
    return null
  }

  const addedSet = new Set(addedSongIds)

  async function handleAdd(song: Song) {
    setAddError(null)
    setJustAdded((current) => new Set(current).add(song.id))

    try {
      await onAddSong(song)
    } catch {
      setJustAdded((current) => {
        const next = new Set(current)
        next.delete(song.id)
        return next
      })
      setAddError(song)
    }
  }

  const resultLabel = (() => {
    if (status === 'loading') {
      return 'Searching…'
    }
    if (status === 'error') {
      return ''
    }
    if (debouncedQuery) {
      if (totalCount === 0) {
        return 'No results'
      }
      return totalCount === 1 ? '1 result' : `${totalCount} results`
    }
    return `Catalog · ${totalCount} ${totalCount === 1 ? 'song' : 'songs'}`
  })()

  const showEmpty = status === 'ready' && results.length === 0 && debouncedQuery.length > 0

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" aria-hidden="true" />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-songs-title"
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[460px] flex flex-col bg-ink-900 border-l border-ink-750 shadow-[0_24px_48px_rgba(0,0,0,0.55)]"
      >
        <div className="flex flex-col gap-4 px-5 pt-5 pb-4 border-b border-ink-750">
          <div className="flex items-center justify-between gap-3">
            <h2 id="add-songs-title" className="m-0 text-subhead">
              Add songs
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close add songs"
              className="w-9 h-9 grid place-items-center rounded-md text-ink-400 hover:bg-ink-800 hover:text-ink-100"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="search flex items-center gap-2 h-11 px-3 border border-ink-700 rounded-md bg-ink-950 focus-within:border-ink-400">
            <SearchIcon stroke="#8E939D" />
            <label htmlFor="add-songs-search" className="sr-only">
              Search the catalog by title or artist
            </label>
            <input
              id="add-songs-search"
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title or artist"
              autoComplete="off"
              className="flex-1 min-w-0 h-full border-0 bg-transparent text-ink-100 text-[15px] outline-none"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="w-7 h-7 grid place-items-center rounded-sm text-ink-400 hover:bg-ink-800 hover:text-ink-100"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </div>
          <p aria-live="polite" className="m-0 text-caption uppercase text-ink-400">
            {resultLabel}
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-2">
          {addError && (
            <div className="p-2">
              <ErrorBanner
                title={`We couldn’t add “${addError.title}”.`}
                description="Check your connection and try again."
                retryLabel="Retry"
                onRetry={() => handleAdd(addError)}
              />
            </div>
          )}

          {status === 'loading' ? (
            <div aria-hidden="true" className="flex flex-col gap-0.5">
              {skeletonWidths.map(([w1, w2], index) => (
                <div key={index} className="flex items-center gap-3 h-16 px-3">
                  <Skeleton className="flex-none w-12 h-12 rounded-sm bg-ink-800" />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton className="h-3 rounded-xs bg-ink-800" style={{ width: w1 }} />
                    <Skeleton className="h-2.5 rounded-xs bg-ink-800" style={{ width: w2 }} />
                  </div>
                  <Skeleton className="flex-none w-16 h-8 rounded-md bg-ink-800" />
                </div>
              ))}
            </div>
          ) : status === 'error' ? (
            <div className="p-2">
              <ErrorBanner
                title="We couldn’t load the catalog."
                description="Check your connection and try again."
                onRetry={() => runSearch(debouncedQuery, 1, false)}
              />
            </div>
          ) : showEmpty ? (
            <div className="flex flex-col items-center gap-1.5 px-6 py-16 text-center">
              <SearchIcon stroke="#626772" />
              <p className="mt-2 mb-0 font-medium">No songs match “{debouncedQuery}”</p>
              <p className="m-0 text-ink-400 text-small">
                Check the spelling, or try the artist’s name.
              </p>
            </div>
          ) : (
            <>
              <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
                {results.map((song) => (
                  <ResultRow
                    key={song.id}
                    song={song}
                    added={addedSet.has(song.id)}
                    justAdded={justAdded.has(song.id)}
                    active={current?.id === song.id}
                    playing={current?.id === song.id && isPlaying}
                    onTogglePlay={() =>
                      song.previewUrl &&
                      toggle(
                        {
                          id: song.id,
                          url: song.previewUrl,
                          title: song.title,
                          artist: song.artist,
                          coverImageUrl: song.coverImageUrl,
                        },
                        { key: 'search', tracks: previewQueue },
                      )
                    }
                    onAdd={() => handleAdd(song)}
                  />
                ))}
              </ul>
              {hasNextPage && (
                <div className="flex justify-center p-3">
                  <button
                    type="button"
                    onClick={() => runSearch(debouncedQuery, page + 1, true)}
                    disabled={status === 'loadingMore'}
                    className="h-9 px-4 rounded-md border border-ink-700 bg-transparent text-small font-medium text-ink-100 hover:bg-ink-800 disabled:text-ink-500"
                  >
                    {status === 'loadingMore' ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>,
    document.body,
  )
}
