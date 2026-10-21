import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export interface AudioTrack {
  id: number
  url: string
  title: string
  artist: string
  coverImageUrl: string | null
}

interface AudioPlayerContextValue {
  current: AudioTrack | null
  isPlaying: boolean
  currentTime: number
  duration: number
  toggle: (track: AudioTrack, queue?: AudioTrack[]) => void
  togglePlayPause: () => void
  seek: (time: number) => void
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined)

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const queueRef = useRef<AudioTrack[] | null>(null)
  const [current, setCurrent] = useState<AudioTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const start = useCallback((track: AudioTrack) => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.src = track.url
    setCurrent(track)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(true)
    audio.play().catch(() => setIsPlaying(false))
  }, [])

  const resume = useCallback(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    setIsPlaying(true)
    audio.play().catch(() => setIsPlaying(false))
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const toggle = useCallback(
    (track: AudioTrack, queue?: AudioTrack[]) => {
      if (current?.id === track.id) {
        if (isPlaying) {
          pause()
        } else {
          resume()
        }
        return
      }

      queueRef.current = queue ?? null
      start(track)
    },
    [current, isPlaying, pause, resume, start],
  )

  const togglePlayPause = useCallback(() => {
    if (!current) {
      return
    }

    if (isPlaying) {
      pause()
    } else {
      resume()
    }
  }, [current, isPlaying, pause, resume])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.currentTime = time
    setCurrentTime(time)
  }, [])

  const playNext = useCallback(() => {
    const queue = queueRef.current
    const index = queue && current ? queue.findIndex((track) => track.id === current.id) : -1
    const next = index >= 0 ? queue![index + 1] : undefined

    if (next) {
      start(next)
      return
    }

    queueRef.current = null
    setIsPlaying(false)
  }, [current, start])

  const value = useMemo(
    () => ({ current, isPlaying, currentTime, duration, toggle, togglePlayPause, seek }),
    [current, isPlaying, currentTime, duration, toggle, togglePlayPause, seek],
  )

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        onEnded={playNext}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
      />
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
