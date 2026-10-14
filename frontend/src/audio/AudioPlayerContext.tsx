import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

interface AudioPlayerContextValue {
  playingId: number | null
  toggle: (id: number, url: string) => void
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined)

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playingId, setPlayingId] = useState<number | null>(null)

  const toggle = useCallback(
    (id: number, url: string) => {
      const audio = audioRef.current
      if (!audio) {
        return
      }

      if (playingId === id) {
        audio.pause()
        setPlayingId(null)
        return
      }

      audio.src = url
      audio.play().catch(() => {
        setPlayingId((current) => (current === id ? null : current))
      })
      setPlayingId(id)
    },
    [playingId],
  )

  const value = useMemo(() => ({ playingId, toggle }), [playingId, toggle])

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
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
