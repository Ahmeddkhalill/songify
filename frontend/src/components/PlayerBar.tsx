import { useCallback, useRef, useState } from 'react'
import { useAudioPlayer } from '../audio/AudioPlayerContext'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

  const whole = Math.floor(seconds)
  const minutes = Math.floor(whole / 60)
  const secs = whole % 60
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
    </svg>
  )
}

function PreviousIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 6h2v12H7zM18 6l-8 6 8 6z" />
    </svg>
  )
}

function NextIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M15 6h2v12h-2zM6 6l8 6-8 6z" />
    </svg>
  )
}

export default function PlayerBar({ onHeightChange }: { onHeightChange: (height: number) => void }) {
  const {
    current,
    isPlaying,
    currentTime,
    duration,
    canNext,
    canPrevious,
    togglePlayPause,
    seek,
    next,
    previous,
  } = useAudioPlayer()
  const [scrub, setScrub] = useState<number | null>(null)
  const pointerActive = useRef(false)
  const observerRef = useRef<ResizeObserver | null>(null)
  const measureRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect()
      if (!node) {
        onHeightChange(0)
        return
      }
      const observer = new ResizeObserver(() => onHeightChange(node.offsetHeight))
      observer.observe(node)
      observerRef.current = observer
    },
    [onHeightChange],
  )

  if (!current) {
    return null
  }

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0
  const displayTime = scrub ?? currentTime

  return (
    <div ref={measureRef} className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-750 bg-ink-900">
      <div className="max-w-[1280px] mx-auto px-4 py-2 sm:px-8 sm:py-0 sm:h-[72px] flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-3 sm:contents">
          <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-none sm:basis-[30%]">
            <div className="flex-none w-12 h-12 rounded-sm overflow-hidden bg-ink-850">
              {current.coverImageUrl && (
                <img src={current.coverImageUrl} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-ink-100 truncate">{current.title}</span>
              <span className="text-small text-ink-400 truncate">{current.artist}</span>
            </div>
          </div>

          <div className="flex-none flex items-center gap-2">
            <button
              type="button"
              onClick={previous}
              disabled={!canPrevious}
              aria-label="Previous track"
              className="w-11 h-11 sm:w-9 sm:h-9 grid place-items-center rounded-full text-ink-300 hover:text-ink-100 disabled:text-ink-600 disabled:hover:text-ink-600"
            >
              <PreviousIcon />
            </button>
            <button
              type="button"
              onClick={togglePlayPause}
              aria-label={isPlaying ? `Pause ${current.title}` : `Play ${current.title}`}
              className="w-11 h-11 sm:w-10 sm:h-10 grid place-items-center rounded-full bg-accent text-accent-fg hover:bg-accent-300"
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canNext}
              aria-label="Next track"
              className="w-11 h-11 sm:w-9 sm:h-9 grid place-items-center rounded-full text-ink-300 hover:text-ink-100 disabled:text-ink-600 disabled:hover:text-ink-600"
            >
              <NextIcon />
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span className="w-10 text-right font-mono text-small text-ink-400 tabular-nums">
            {formatTime(displayTime)}
          </span>
          <input
            type="range"
            min={0}
            max={safeDuration}
            step="any"
            value={Math.min(displayTime, safeDuration)}
            aria-label={`Seek within ${current.title}`}
            onPointerDown={() => {
              pointerActive.current = true
            }}
            onPointerUp={() => {
              if (scrub !== null) {
                seek(scrub)
              }
              pointerActive.current = false
              setScrub(null)
            }}
            onChange={(event) => {
              const next = Number(event.target.value)
              if (pointerActive.current) {
                setScrub(next)
              } else {
                seek(next)
              }
            }}
            className="flex-1 min-w-0 accent-accent"
          />
          <span className="w-10 font-mono text-small text-ink-400 tabular-nums">
            {formatTime(safeDuration)}
          </span>
        </div>
      </div>
    </div>
  )
}
