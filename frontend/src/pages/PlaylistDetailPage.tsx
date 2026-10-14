import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { ApiError } from '../api/client'
import {
  addSongToPlaylist,
  deletePlaylist,
  getPlaylist,
  removeSongFromPlaylist,
} from '../api/playlists'
import type { PlaylistDetail, PlaylistSong, Song } from '../api/types'
import AddSongsPanel from '../components/AddSongsPanel'
import Button from '../components/Button'
import Dialog from '../components/Dialog'
import ErrorBanner from '../components/ErrorBanner'
import PlaylistCover from '../components/PlaylistCover'
import RenamePlaylistDialog from '../components/RenamePlaylistDialog'
import Skeleton from '../components/Skeleton'
import { formatDuration } from '../lib/duration'

type Status = 'loading' | 'error' | 'notFound' | 'ready'

const rowGrid =
  'grid items-center gap-x-3 [grid-template-columns:28px_minmax(0,1fr)_56px_36px] min-[900px]:[grid-template-columns:28px_minmax(0,2.2fr)_minmax(0,1.4fr)_56px_36px]'
const skeletonWidths = ['46%', '34%', '52%', '40%', '58%', '30%', '44%', '50%']

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'status' in error
}

function BackLink() {
  return (
    <Link
      to="/playlists"
      className="self-start flex items-center gap-1 h-8 text-small font-medium text-ink-400 hover:text-ink-100"
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
        <path d="M15 6l-6 6 6 6" />
      </svg>
      Playlists
    </Link>
  )
}

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

function RenameIcon() {
  return (
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
      <path d="M4 20h4L19 9l-4-4L4 16v4z" />
    </svg>
  )
}

function DeleteIcon() {
  return (
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
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  )
}

function SongRow({ song, position, onRemove }: { song: PlaylistSong; position: number; onRemove: () => void }) {
  return (
    <li className={`${rowGrid} relative min-h-[60px] px-3 rounded-md transition-colors hover:bg-ink-850`}>
      <span className="text-right font-mono text-small text-ink-400 tabular-nums">{position}</span>
      <div className="flex items-center gap-3 min-w-0 py-2.5">
        <div className="flex-none w-10 h-10 rounded-sm overflow-hidden bg-ink-850">
          {song.coverImageUrl && (
            <img src={song.coverImageUrl} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-ink-100 truncate">{song.title}</span>
          <span className="text-small text-ink-400 truncate">{song.artist}</span>
        </div>
      </div>
      <span className="hidden min-[900px]:block text-small text-ink-400 truncate">
        {song.album ?? ''}
      </span>
      <span className="text-right font-mono text-small text-ink-400 tabular-nums">
        {formatTrackDuration(song.durationInSeconds)}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${song.title} from playlist`}
        className="w-9 h-9 grid place-items-center rounded-md text-ink-400 hover:bg-ink-750 hover:text-ink-100"
      >
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
      </button>
    </li>
  )
}

function formatTrackDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function LoadingState() {
  return (
    <main
      aria-busy="true"
      className="max-w-[1280px] mx-auto px-8 pt-6 pb-24 flex flex-col gap-10"
    >
      <p className="sr-only" role="status">
        Loading playlist
      </p>
      <div className="flex flex-col gap-6">
        <BackLink />
        <section aria-hidden="true" className="flex flex-wrap items-end gap-8">
          <Skeleton className="flex-none w-[200px] h-[200px] rounded-lg bg-ink-850" />
          <div className="flex-1 min-w-[420px] flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Skeleton className="w-16 h-2.5 rounded-xs bg-ink-800" />
              <Skeleton className="w-[46%] h-9 rounded-sm bg-ink-800" />
              <Skeleton className="w-[34%] h-3.5 rounded-xs bg-ink-800" />
            </div>
            <Skeleton className="w-[200px] h-3 rounded-xs bg-ink-800" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="w-[120px] h-10 rounded-md bg-ink-800" />
              <Skeleton className="w-[100px] h-10 rounded-md bg-ink-800" />
              <Skeleton className="w-[92px] h-10 rounded-md bg-ink-800" />
            </div>
          </div>
        </section>
      </div>
      <section aria-hidden="true" className="flex flex-col">
        <div
          className={`${rowGrid} h-9 px-3 border-b border-ink-750 text-caption uppercase text-ink-400`}
        >
          <span className="text-right">#</span>
          <span>Title</span>
          <span className="hidden min-[900px]:block">Album</span>
          <span />
          <span />
        </div>
        <div className="flex flex-col gap-0.5 mt-2">
          {skeletonWidths.map((width, index) => (
            <div key={index} className={`${rowGrid} min-h-[60px] px-3`}>
              <Skeleton className="justify-self-end w-3 h-2.5 rounded-xs bg-ink-800" />
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton className="flex-none w-10 h-10 rounded-sm bg-ink-800" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-3 rounded-xs bg-ink-800" style={{ width }} />
                  <Skeleton className="w-[28%] h-2.5 rounded-xs bg-ink-800" />
                </div>
              </div>
              <Skeleton className="hidden min-[900px]:block w-[42%] h-2.5 rounded-xs bg-ink-800" />
              <Skeleton className="justify-self-end w-8 h-2.5 rounded-xs bg-ink-800" />
              <span />
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

function NotFoundState() {
  return (
    <main className="max-w-[1280px] mx-auto px-8 pt-6 pb-24 flex flex-col gap-6">
      <BackLink />
      <section className="flex flex-col items-center gap-4 px-6 py-24 border border-dashed border-ink-700 rounded-xl text-center">
        <div className="flex flex-col gap-1.5 max-w-[380px]">
          <h2 className="m-0 text-subhead">We couldn’t find that playlist</h2>
          <p className="m-0 text-ink-400 text-pretty">
            It may have been deleted, or the link points somewhere that isn’t yours.
          </p>
        </div>
        <Link
          to="/playlists"
          className="flex items-center gap-2 h-10 px-4 rounded-md border border-ink-700 text-ink-100 text-body font-medium hover:border-ink-600"
        >
          Back to playlists
        </Link>
      </section>
    </main>
  )
}

export default function PlaylistDetailPage() {
  const params = useParams()
  const navigate = useNavigate()
  const id = Number(params.id)

  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [renameOpen, setRenameOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [deleteFailed, setDeleteFailed] = useState(false)
  const [removeError, setRemoveError] = useState<PlaylistSong | null>(null)

  const load = useCallback(async () => {
    if (!Number.isInteger(id)) {
      setStatus('notFound')
      return
    }

    setStatus('loading')

    try {
      setPlaylist(await getPlaylist(id))
      setStatus('ready')
    } catch (error) {
      if (isApiError(error) && (error.status === 403 || error.status === 404)) {
        setStatus('notFound')
      } else {
        setStatus('error')
      }
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const removeSong = useCallback(
    async (song: PlaylistSong) => {
      if (!playlist) {
        return
      }

      const index = playlist.songs.findIndex((s) => s.id === song.id)
      setRemoveError(null)
      setPlaylist((current) =>
        current ? { ...current, songs: current.songs.filter((s) => s.id !== song.id) } : current,
      )

      try {
        await removeSongFromPlaylist(id, song.id)
      } catch {
        setPlaylist((current) => {
          if (!current) {
            return current
          }
          const songs = current.songs.slice()
          songs.splice(index, 0, song)
          return { ...current, songs }
        })
        setRemoveError(song)
      }
    },
    [id, playlist],
  )

  const addSong = useCallback(
    async (song: Song) => {
      setPlaylist((current) =>
        current
          ? {
              ...current,
              songs: [
                ...current.songs,
                { ...song, position: current.songs.length + 1, addedAt: new Date().toISOString() },
              ],
            }
          : current,
      )

      try {
        await addSongToPlaylist(id, { songId: song.id })
      } catch (error) {
        if (isApiError(error) && error.status === 409) {
          return
        }
        setPlaylist((current) =>
          current ? { ...current, songs: current.songs.filter((s) => s.id !== song.id) } : current,
        )
        throw error
      }
    },
    [id],
  )

  async function confirmDelete() {
    setDeletePending(true)
    setDeleteFailed(false)

    try {
      await deletePlaylist(id)
      navigate('/playlists')
    } catch {
      setDeleteFailed(true)
      setDeletePending(false)
    }
  }

  if (status === 'loading') {
    return <LoadingState />
  }

  if (status === 'notFound') {
    return <NotFoundState />
  }

  if (status === 'error' || !playlist) {
    return (
      <main className="max-w-[1280px] mx-auto px-8 pt-6 pb-24 flex flex-col gap-6">
        <BackLink />
        <ErrorBanner
          title="We couldn’t load this playlist."
          description="Check your connection and try again."
          onRetry={load}
        />
      </main>
    )
  }

  const songs = playlist.songs
  const isEmpty = songs.length === 0
  const countLabel = songs.length === 1 ? '1 song' : `${songs.length} songs`
  const totalSeconds = songs.reduce((sum, song) => sum + song.durationInSeconds, 0)
  const coverImageUrls = songs
    .map((song) => song.coverImageUrl)
    .filter((url): url is string => url !== null)

  return (
    <>
      <main className="max-w-[1280px] mx-auto px-8 pt-6 pb-24 flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <BackLink />
          <section className="flex flex-wrap items-end gap-8">
            <div className="flex-none w-[200px]">
              <PlaylistCover coverImageUrls={coverImageUrls} />
            </div>
            <div className="flex-1 min-w-0 basis-[420px] flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-caption uppercase text-ink-400">Playlist</span>
                <h1 className="m-0 text-display text-balance">{playlist.name}</h1>
                {playlist.description && (
                  <p className="m-0 max-w-[560px] text-body-lg text-ink-300">
                    {playlist.description}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-small text-ink-400">
                <span>{countLabel}</span>
                <span aria-hidden="true" className="w-[3px] h-[3px] rounded-full bg-ink-600" />
                <span>{formatDuration(totalSeconds)}</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button className="pl-3" onClick={() => setAddOpen(true)}>
                  <PlusIcon />
                  Add songs
                </Button>
                <Button variant="secondary" className="pl-3" onClick={() => setRenameOpen(true)}>
                  <RenameIcon />
                  Rename
                </Button>
                <Button
                  variant="secondary"
                  className="pl-3"
                  onClick={() => {
                    setDeleteFailed(false)
                    setDeleteOpen(true)
                  }}
                >
                  <DeleteIcon />
                  Delete
                </Button>
              </div>
            </div>
          </section>
        </div>

        {removeError && (
          <ErrorBanner
            title="We couldn’t remove that song."
            description="Check your connection and try again."
            retryLabel="Retry"
            onRetry={() => removeSong(removeError)}
          />
        )}

        {isEmpty ? (
          <section className="flex flex-col items-center gap-4 px-6 py-[72px] border border-dashed border-ink-700 rounded-xl text-center">
            <div className="flex flex-col gap-1.5 max-w-[380px]">
              <h2 className="m-0 text-subhead">This playlist is empty</h2>
              <p className="m-0 text-ink-400 text-pretty">
                Search the catalog by title or artist and add your first songs. You can reorder them
                later by dragging.
              </p>
            </div>
            <Button variant="secondary" className="pl-3" onClick={() => setAddOpen(true)}>
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
                <circle cx="11" cy="11" r="6.5" />
                <path d="M20 20l-4.2-4.2" />
              </svg>
              Browse the catalog
            </Button>
          </section>
        ) : (
          <section aria-label="Songs" className="flex flex-col">
            <div
              className={`${rowGrid} h-9 px-3 border-b border-ink-750 text-caption uppercase text-ink-400`}
            >
              <span className="text-right">#</span>
              <span>Title</span>
              <span className="hidden min-[900px]:block">Album</span>
              <span className="flex justify-end" aria-label="Duration">
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
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </span>
              <span />
            </div>
            <ol className="list-none m-0 p-0 flex flex-col gap-0.5 mt-2">
              {songs.map((song, index) => (
                <SongRow
                  key={song.id}
                  song={song}
                  position={index + 1}
                  onRemove={() => removeSong(song)}
                />
              ))}
            </ol>
          </section>
        )}
      </main>

      <AddSongsPanel
        open={addOpen}
        onClose={() => setAddOpen(false)}
        addedSongIds={songs.map((song) => song.id)}
        onAddSong={addSong}
      />

      <RenamePlaylistDialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        playlistId={id}
        initialName={playlist.name}
        initialDescription={playlist.description}
        onRenamed={(name, description) => {
          setPlaylist((current) => (current ? { ...current, name, description } : current))
          setRenameOpen(false)
        }}
      />

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} labelledBy="delete-playlist-title">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h2 id="delete-playlist-title" className="m-0 text-subhead">
              Delete “{playlist.name}”?
            </h2>
            <p className="m-0 text-ink-300">
              The playlist and its song order will be removed. The songs stay in the catalog. This
              can’t be undone.
            </p>
          </div>
          {deleteFailed && (
            <p role="alert" className="m-0 text-small text-danger-400">
              We couldn’t delete the playlist. Try again.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deletePending}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deletePending}>
              {deletePending ? 'Deleting…' : 'Delete playlist'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
