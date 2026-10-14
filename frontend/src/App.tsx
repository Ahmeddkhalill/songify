import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import PlaylistDetailPage from './pages/PlaylistDetailPage'
import PlaylistsPage from './pages/PlaylistsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/playlists" element={<PlaylistsPage />} />
            <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/playlists" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
