import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

const TITLES = { login: 'Нэвтрэх', register: 'Бүртгүүлэх', reset: 'Нууц үг сэргээх', update: 'Шинэ нууц үг' }
export default function Login({ mode }) {
  const { signIn, signUp, resetPassword, updatePassword } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [f, setF] = useState({ email: '', password: '', name: '' })
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)   // нууц үгийг харуулах эсэх
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (mode !== 'update' && !/^\S+@\S+\.\S+$/.test(f.email)) return toast('Имэйл буруу байна', 'error')
    if (mode !== 'reset' && f.password.length < 6) return toast('Нууц үг 6+ тэмдэгт байх ёстой', 'error')
    if (mode === 'register' && f.name.trim().length < 2) return toast('Нэрээ оруулна уу', 'error')
    setBusy(true)
    let res
    if (mode === 'login') res = await signIn(f.email, f.password)
    if (mode === 'register') res = await signUp(f.email, f.password, f.name.trim())
    if (mode === 'reset') res = await resetPassword(f.email)
    if (mode === 'update') res = await updatePassword(f.password)
    setBusy(false)
    if (res.error) return toast(res.error.message, 'error')
    if (mode === 'reset') return toast('Сэргээх линк имэйлээр илгээгдлээ')
    toast(mode === 'register' ? 'Амжилттай бүртгэгдлээ' : 'Амжилттай')
    nav('/')
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-3 rounded-2xl border border-stone-200 bg-white p-6">
      <h1 className="font-serif text-2xl font-bold">{TITLES[mode]}</h1>
      {mode === 'register' && <input className="input" placeholder="Бүтэн нэр" value={f.name} onChange={set('name')} />}
      {mode !== 'update' && <input className="input" type="email" placeholder="Имэйл" value={f.email} onChange={set('email')} />}
      {mode !== 'reset' && (
        <div className="relative">
          <input className="input pr-20" type={show ? 'text' : 'password'} placeholder="Нууц үг" value={f.password} onChange={set('password')} />
          <button type="button" onClick={() => setShow(!show)} aria-pressed={show}
            aria-label={show ? 'Нууц үгийг нуух' : 'Нууц үгийг харах'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-500 hover:text-gold">
            {show ? 'Нуух' : 'Харах'}
          </button>
        </div>)}
      <button className="btn-gold w-full" disabled={busy}>{busy ? 'Түр хүлээнэ үү...' : TITLES[mode]}</button>
      <div className="flex justify-between text-sm text-stone-600">
        {mode === 'login' && <><Link to="/register">Бүртгүүлэх</Link><Link to="/reset">Нууц үгээ мартсан</Link></>}
        {mode === 'register' && <Link to="/login">Бүртгэлтэй юу? Нэвтрэх</Link>}
        {mode === 'reset' && <Link to="/login">Буцах</Link>}
      </div>
    </form>
  )
}