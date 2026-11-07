import { NavLink } from 'react-router-dom'

export default function AdminTabs() {
  const cls = ({ isActive }) =>
    `rounded-full px-4 py-1.5 text-sm ${isActive ? 'bg-stone-900 text-white' : 'border border-stone-300 hover:bg-stone-100'}`
  return (
    <div className="mb-6 flex gap-2">
      <NavLink to="/admin" end className={cls}>Бүтээгдэхүүн</NavLink>
      <NavLink to="/admin/quiz" className={cls}>Тест</NavLink>
    </div>
  )
}