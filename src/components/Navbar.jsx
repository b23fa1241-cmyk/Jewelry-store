import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useBuilder } from '../context/BuilderContext'

export default function Navbar() {
  const { session, isAdmin, signOut } = useAuth()
  const { items } = useBuilder()
  const { count } = useCart()
  const nav = useNavigate()
  const isHome = useLocation().pathname === '/'
  const link = ({ isActive }) => `py-1 ${isActive ? 'text-gold font-medium' : 'hover:text-gold'}`
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-0 px-4 py-2 text-sm md:py-3">
        <Link to="/" className="font-serif text-xl font-bold tracking-wide">Lumière</Link>

        {/* Утсан дээр тусдаа мөрөнд хэвтээ гүйлгэгдэнэ, компьютер дээр лого хажууд */}
        {!isHome && (
          <nav className="order-last flex w-full gap-5 overflow-x-auto whitespace-nowrap pt-1 md:order-0 md:w-auto md:overflow-visible md:pt-0">
            <NavLink to="/products" className={link}>Бүтээгдэхүүн</NavLink>
            <NavLink to="/quiz" className={link}>Тест</NavLink>
            <NavLink to="/builder" className={link}>Хослол бүтээх{items.length > 0 && ` (${items.length})`}</NavLink>
            {session && <NavLink to="/my-sets" className={link}>Миний хослол</NavLink>}
            {session && <NavLink to="/cart" className={link}>Сагс{count > 0 && ` (${count})`}</NavLink>}
            {isAdmin && <NavLink to="/admin" className={link}>Админ</NavLink>}
          </nav>
        )}

        <div className="ml-auto flex gap-2">
          {session
            ? <button className="btn-line px-4 py-1.5" onClick={async () => { await signOut(); nav('/') }}>Гарах</button>
            : <><Link to="/login" className="btn-line px-4 py-1.5">Нэвтрэх</Link><Link to="/register" className="btn-gold px-4 py-1.5">Бүртгүүлэх</Link></>}
        </div>
      </div>
    </header>
  )
}