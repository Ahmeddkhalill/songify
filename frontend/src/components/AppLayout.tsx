import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AppHeader from './AppHeader'
import PlayerBar from './PlayerBar'

export default function AppLayout() {
  const [playerHeight, setPlayerHeight] = useState(0)

  return (
    <>
      <AppHeader />
      <div style={{ paddingBottom: playerHeight }}>
        <Outlet />
      </div>
      <PlayerBar onHeightChange={setPlayerHeight} />
    </>
  )
}
