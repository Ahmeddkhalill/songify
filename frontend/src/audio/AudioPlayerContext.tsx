import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

const RESTART_THRESHOLD_SECONDS = 3

export interface AudioTrack {
  id: number
  url: string
  title: string
  artist: string
  coverImageUrl: string | null
}

export interface AudioQueue {
  key: string
  tracks: AudioTrack[]
}

interface AudioPlayerContextValue {
  current: AudioTrack | null
  isPlaying: boolean
  currentTime: number
  duration: number
  canNext: boolean
  canPrevious: boolean
  toggle: (track: AudioTrack, queue?: AudioQueue) => void
  togglePlayPause: () => void
  seek: (time: number) => void
  next: () => void
  previous: () => void
  syncQueue: (key: string, tracks: AudioTrack[]) => void
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined)

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [queue, setQueue] = useState<AudioQueue | null>(null)
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
    (track: AudioTrack, nextQueue?: AudioQueue) => {
      if (current?.id === track.id) {
        if (isPlaying) {
          pause()
        } else {
          resume()
        }
        return
      }

      setQueue(nextQueue ?? null)
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

  const index = current && queue ? queue.tracks.findIndex((track) => track.id === current.id) : -1
  const nextTrack = index >= 0 && queue ? queue.tracks[index + 1] : undefined
  const previousTrack = index > 0 && queue ? queue.tracks[index - 1] : undefined

  const next = useCallback(() => {
    if (nextTrack) {
      start(nextTrack)
    }
  }, [nextTrack, start])

  const previous = useCallback(() => {
    if (!current) {
      return
    }

    if (currentTime > RESTART_THRESHOLD_SECONDS) {
      seek(0)
      resume()
      return
    }

    if (previousTrack) {
      start(previousTrack)
    }
  }, [current, currentTime, previousTrack, resume, seek, start])

  const onEnded = useCallback(() => {
    if (nextTrack) {
      start(nextTrack)
      return
    }

    seek(0)
    setIsPlaying(false)
  }, [nextTrack, seek, start])

  const syncQueue = useCallback(
    (key: string, tracks: AudioTrack[]) => {
      if (!queue || queue.key !== key || queue.tracks === tracks) {
        return
      }

      if (current && !tracks.some((track) => track.id === current.id)) {
        pause()
        setCurrent(null)
        setCurrentTime(0)
        setDuration(0)
        setQueue(null)
        return
      }

      setQueue({ key, tracks })
    },
    [current, pause, queue],
  )

  const canNext = nextTrack !== undefined
  const canPrevious = current !== null && (currentTime > RESTART_THRESHOLD_SECONDS || previousTrack !== undefined)

  const value = useMemo(
    () => ({
      current,
      isPlaying,
      currentTime,
      duration,
      canNext,
      canPrevious,
      toggle,
      togglePlayPause,
      seek,
      next,
      previous,
      syncQueue,
    }),
    [
      current,
      isPlaying,
      currentTime,
      duration,
      canNext,
      canPrevious,
      toggle,
      togglePlayPause,
      seek,
      next,
      previous,
      syncQueue,
    ],
  )

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        onEnded={onEnded}
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
