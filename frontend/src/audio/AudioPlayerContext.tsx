import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

interface PreviewTrack {
  id: number
  url: string
}

interface AudioPlayerContextValue {
  playingId: number | null
  toggle: (id: number, url: string, queue?: PreviewTrack[]) => void
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined)

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const queueRef = useRef<PreviewTrack[] | null>(null)
  const [playingId, setPlayingId] = useState<number | null>(null)

  const play = useCallback((id: number, url: string) => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.src = url
    audio.play().catch(() => {
      setPlayingId((current) => (current === id ? null : current))
    })
    setPlayingId(id)
  }, [])

  const toggle = useCallback(
    (id: number, url: string, queue?: PreviewTrack[]) => {
      if (playingId === id) {
        audioRef.current?.pause()
        setPlayingId(null)
        return
      }

      queueRef.current = queue ?? null
      play(id, url)
    },
    [playingId, play],
  )

  const playNext = useCallback(() => {
    const queue = queueRef.current
    const index = queue ? queue.findIndex((track) => track.id === playingId) : -1
    const next = index >= 0 ? queue![index + 1] : undefined

    if (next) {
      play(next.id, next.url)
      return
    }

    queueRef.current = null
    setPlayingId(null)
  }, [playingId, play])

  const value = useMemo(() => ({ playingId, toggle }), [playingId, toggle])

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} onEnded={playNext} />
    </AudioPlayerContext.Provider>
  )
}

export function useAudioPlayer(): AudioPlayerContextValue {
  const context = useContext(AudioPlayerContext)

  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider')
  }

  return context
}
