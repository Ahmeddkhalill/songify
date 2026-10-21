import { Outlet } from 'react-router-dom'
import { useAudioPlayer } from '../audio/AudioPlayerContext'
import AppHeader from './AppHeader'
import PlayerBar from './PlayerBar'

export default function AppLayout() {
  const { current } = useAudioPlayer()

  return (
    <>
      <AppHeader />
      <div className={current ? 'pb-[72px]' : ''}>
        <Outlet />
      </div>
      <PlayerBar />
    </>
  )
}
