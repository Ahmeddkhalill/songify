import { useCallback, useEffect, useState } from 'react'
import { getPlaylists } from '../api/playlists'
import type { PlaylistSummary } from '../api/types'
import Button from '../components/Button'
import CreatePlaylistDialog from '../components/CreatePlaylistDialog'
import ErrorBanner from '../components/ErrorBanner'
import PlaylistCard from '../components/PlaylistCard'
import Skeleton from '../components/Skeleton'

type Status = 'loading' | 'error' | 'ready'

const gridColumns = '[grid-template-columns:repeat(auto-fill,minmax(min(200px,100%),1fr))]'
const skeletonWidths = ['64%', '48%', '72%', '56%', '40%', '68%', '52%', '60%', '44%', '70%']

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')

    try {
      setPlaylists(await getPlaylists())
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function onCreated(playlist: PlaylistSummary) {
    setPlaylists((current) => [playlist, ...current])
    setDialogOpen(false)
  }

  if (status === 'loading') {
    return (
      <main
        aria-busy="true"
        className="max-w-[1280px] mx-auto px-8 pt-12 pb-20 flex flex-col gap-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-heading">Your playlists</h1>
            <Skeleton className="w-[140px] h-3 my-[3px] rounded-xs bg-ink-800" />
          </div>
          <Skeleton className="w-[136px] h-10 rounded-md bg-ink-800" />
        </div>
        <p className="sr-only" role="status">
          Loading your playlists
        </p>
        <div aria-hidden="true" className={`grid gap-y-8 gap-x-6 ${gridColumns}`}>
          {skeletonWidths.map((width, index) => (
            <div key={index} className="flex flex-col gap-3">
              <Skeleton className="aspect-square rounded-lg bg-ink-850" />
              <div className="flex flex-col gap-2 pt-0.5">
                <Skeleton className="h-3.5 rounded-xs bg-ink-800" style={{ width }} />
                <Skeleton className="w-[42%] h-2.5 rounded-xs bg-ink-800" />
              </div>
            </div>
          ))}
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="max-w-[1280px] mx-auto px-8 pt-12 pb-20 flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-heading">Your playlists</h1>
        </div>
        <ErrorBanner
          title="We couldn’t load your playlists."
          description="Check your connection and try again."
          onRetry={load}
        />
      </main>
    )
  }

  const isEmpty = playlists.length === 0
  const count = playlists.length === 1 ? '1 playlist' : `${playlists.length} playlists`

  return (
    <>
      <main className="max-w-[1280px] mx-auto px-8 pt-12 pb-20 flex flex-col gap-8">
        {isEmpty ? (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="m-0 text-heading">Your playlists</h1>
              <p className="m-0 text-small text-ink-400">0 playlists</p>
            </div>
            <section className="flex flex-col items-center gap-6 px-6 py-24 border border-dashed border-ink-700 rounded-xl text-center">
              <div aria-hidden="true" className="grid grid-cols-[repeat(2,44px)] gap-1.5">
                <span className="w-11 h-11 rounded-md border border-dashed border-ink-600" />
                <span className="w-11 h-11 rounded-md border border-dashed border-ink-600" />
                <span className="w-11 h-11 rounded-md border border-dashed border-ink-600" />
                <span className="w-11 h-11 rounded-md bg-ink-750 grid place-items-center text-ink-400">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 18V5l11-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="17" cy="16" r="3" />
                  </svg>
                </span>
              </div>
              <div className="flex flex-col gap-1.5 max-w-[360px]">
                <h2 className="m-0 text-subhead">No playlists yet</h2>
                <p className="m-0 text-ink-400 text-pretty">
                  Create one, then add songs from the shared catalog. Its cover fills in from the
                  album art.
                </p>
              </div>
              <Button onClick={() => setDialogOpen(true)}>
                <PlusIcon />
                New playlist
              </Button>
            </section>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="m-0 text-heading">Your playlists</h1>
                <p className="m-0 text-small text-ink-400">{count} · sorted by last updated</p>
              </div>
              <Button onClick={() => setDialogOpen(true)}>
                <PlusIcon />
                New playlist
              </Button>
            </div>
            <ul className={`list-none m-0 p-0 grid gap-y-8 gap-x-6 ${gridColumns}`}>
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </ul>
          </>
        )}
      </main>

      <CreatePlaylistDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={onCreated}
      />
    </>
  )
}
