import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, money } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { useBuilder } from '../context/BuilderContext'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

export default function MySets() {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [toDelete, setToDelete] = useState(null)
  const [editing, setEditing] = useState(null) // { id, name }
  const { loadItems } = useBuilder()
  const toast = useToast()
  const cart = useCart()
  const nav = useNavigate()

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('sets').select('*, set_items(quantity, products(*))').order('created_at', { ascending: false })
    if (error) toast(error.message, 'error')
    setSets(data ?? []); setLoading(false)
  }, [toast])
  useEffect(() => { load() }, [load])

  const rename = async () => {
    if (editing.name.trim().length < 2) return toast('Нэр хэт богино', 'error')
    const { error } = await supabase.from('sets').update({ name: editing.name.trim() }).eq('id', editing.id)
    if (error) return toast(error.message, 'error')
    setEditing(null); toast('Нэр шинэчлэгдлээ'); load()
  }
  const remove = async () => {
    const { error } = await supabase.from('sets').delete().eq('id', toDelete)
    setToDelete(null)
    if (error) return toast(error.message, 'error')
    toast('Устгагдлаа'); load()
  }
  const addToCart = async (id) => {
    const { error } = await cart.addSet(id)
    toast(error ? error.message : 'Сагсанд нэмэгдлээ', error ? 'error' : 'ok')
  }
  const edit = (s) => { loadItems(s.set_items.map((i) => ({ product: i.products, quantity: i.quantity }))); nav('/builder') }

  if (loading) return <p className="py-20 text-center text-stone-500">Ачаалж байна...</p>
  return (
    <>
      <h1 className="mb-6 font-serif text-3xl font-bold">Миний хослолууд</h1>
      {sets.length === 0 && <p className="py-10 text-center text-stone-500">Хадгалсан хослол байхгүй байна.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {sets.map((s) => (
          <div key={s.id} className="rounded-2xl border border-stone-200 bg-white p-4">
            {editing?.id === s.id
              ? <div className="mb-2 flex gap-2"><input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /><button className="btn-gold" onClick={rename}>OK</button></div>
              : <h3 className="mb-2 font-serif text-xl font-bold">{s.name}</h3>}
            <div className="mb-2 flex gap-2 overflow-x-auto">
              {s.set_items.map((i) => <img key={i.products.id} src={i.products.image_url} alt={i.products.name} title={i.products.name} className="h-20 w-20 rounded-lg object-cover" />)}
            </div>
            <p className="mb-3 font-semibold text-gold">{money(s.total_price)}</p>
            <div className="flex flex-wrap gap-2">
              <button className="btn-gold" onClick={() => addToCart(s.id)}>Сагсанд нэмэх</button>
              <button className="btn-line" onClick={() => edit(s)}>Буцах</button>
              <button className="btn-line" onClick={() => setEditing({ id: s.id, name: s.name })}>Нэр засах</button>
              <button className="btn-line text-red-600" onClick={() => setToDelete(s.id)}>Устгах</button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog open={!!toDelete} message="Энэ хослолыг устгахдаа итгэлтэй байна уу?" onConfirm={remove} onCancel={() => setToDelete(null)} />
    </>
  )
}