import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Products from './pages/Products.jsx'
import Quiz from './pages/Quiz.jsx'
import Builder from './pages/Builder.jsx'
import MySets from './pages/MySets.jsx'
import Cart from './pages/Cart.jsx'
import Login from './pages/Login.jsx'
import AdminProducts from './pages/admin/AdminProducts.jsx'
import AdminQuiz from './pages/admin/AdminQuiz.jsx'

export default function App() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/login" element={<Login mode="login" />} />
          <Route path="/register" element={<Login mode="register" />} />
          <Route path="/reset" element={<Login mode="reset" />} />
          <Route path="/update-password" element={<Login mode="update" />} />
          <Route path="/my-sets" element={<ProtectedRoute><MySets /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute admin><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/quiz" element={<ProtectedRoute admin><AdminQuiz /></ProtectedRoute>} />
          <Route path="*" element={<p className="py-20 text-center">Хуудас олдсонгүй</p>} />
        </Routes>
      </main>
    </>
  )
}