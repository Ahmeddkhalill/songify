import { Link } from 'react-router-dom'
import type { PlaylistSummary } from '../api/types'
import { formatDuration } from '../lib/duration'
import PlaylistCover from './PlaylistCover'

export default function PlaylistCard({ playlist }: { playlist: PlaylistSummary }) {
  const songs = playlist.songCount === 1 ? '1 song' : `${playlist.songCount} songs`
  const meta = `${songs} · ${formatDuration(playlist.totalDurationInSeconds)}`

  return (
    <li>
      <Link to={`/playlists/${playlist.id}`} className="group flex flex-col gap-3">
        <PlaylistCover coverImageUrls={playlist.coverImageUrls} />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-body-lg font-medium text-ink-100 truncate group-hover:underline group-hover:underline-offset-[3px] decoration-ink-600">
            {playlist.name}
          </span>
          <span className="text-small text-ink-400">{meta}</span>
        </div>
      </Link>
    </li>
  )
}
