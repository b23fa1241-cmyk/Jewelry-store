import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Нэвтрээгүй бол /login руу, admin шаардлагатай хуудсанд admin биш бол нүүр рүү буцаана
export default function ProtectedRoute({ children, admin = false }) {
  const { session, isAdmin, loading } = useAuth()
  if (loading) return <p className="py-20 text-center text-stone-500">Ачаалж байна...</p>
  if (!session) return <Navigate to="/login" replace />
  if (admin && !isAdmin) return <Navigate to="/" replace />
  return children
}
