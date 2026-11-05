import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts, useCategories } from '../hooks/useProducts'
import { useBuilder } from '../context/BuilderContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { money } from '../lib/supabase'
import ProductCard from '../components/ProductCard'

const MIN_ITEMS = 2 // combo болоход шаардлагатай хамгийн цөөн бүтээгдэхүүн

export default function Builder() {
  const { items, addItem, removeItem, setQty, clear, loadItems, total, saveSet, pool, setPool } = useBuilder()
  const { session } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [category, setCategory] = useState('')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const cats = useCategories()
  const { rows, loading } = useProducts({ category, pageSize: 50 })

  // pool байвал зөвхөн Quiz-ээр санал болгосон бүтээгдэхүүнийг харуулна
  const shown = pool ? pool.filter((p) => !category || p.category_id === category) : rows
  const isSelected = (p) => items.some((i) => i.product.id === p.id)
  const isCombo = items.length >= MIN_ITEMS

  // Нэмэх/хасах. Quiz-ийн горимд ангилал бүрээс 1 бүтээгдэхүүн: ижил ангилалынхыг солино.
  const toggle = (p) => {
    if (isSelected(p)) return removeItem(p.id)
    if (pool) {
      const same = items.find((i) => i.product.category_id === p.category_id)
      if (same) {
        loadItems([...items.filter((i) => i.product.category_id !== p.category_id), { product: p, quantity: 1 }])
        return toast(`${same.product.name}-ийг солилоо`)
      }
    }
    addItem(p)
  }

  const save = async () => {
    if (!session) return nav('/login')
    if (!isCombo) return toast('Хамгийн багадаа 2 бүтээгдэхүүн сонгоно уу', 'error')
    if (name.trim().length < 2) return toast('Хослолд нэр өгнө үү (2+ тэмдэгт)', 'error')
    setSaving(true)
    try { await saveSet(name.trim()); toast('Хослол хадгалагдлаа'); clear(); setName(''); nav('/my-sets') }
    catch (e) { toast(e.message, 'error') }
    setSaving(false)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <section>
        <h1 className="mb-4 font-serif text-3xl font-bold">Дуртай хослолоо бүтээгээрэй</h1>

        {pool && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 p-3 text-sm">
            <span>Тестийн үр дүнд санал болгосон {pool.length} бүтээгдэхүүнээс ангилал бүрээс 1-ийг сонгож хослол бүтээнэ.</span>
            <button className="btn-line" onClick={() => setPool(null)}>Бүх бүтээгдэхүүн харах</button>
          </div>)}

        <select className="input mb-4 max-w-xs" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Бүх ангилал</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {!pool && loading ? <p className="text-stone-500">Ачаалж байна...</p>
          : shown.length === 0 ? <p className="text-stone-500">Энэ ангилалд бүтээгдэхүүн алга.</p>
          : <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {shown.map((p) => (
                <div key={p.id} className={`rounded-2xl ${isSelected(p) ? 'ring-2 ring-gold' : ''}`}>
                  <ProductCard product={p} onAdd={toggle} label={isSelected(p) ? 'Хасах' : 'Нэмэх'} showCart={false} />
                </div>
              ))}
            </div>}
      </section>

      {/* Самбар дэлгэцээс өндөр болбол дотроо гүйлгэгдэнэ */}
      <aside className="order-first h-fit rounded-2xl border border-stone-200 bg-white p-4 lg:sticky lg:top-20 lg:order-last lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
        <h2 className="mb-3 font-serif text-xl font-bold">{isCombo ? 'Сонгосон хослол' : 'Миний хослол'}</h2>

        {items.length === 0 && <p className="py-6 text-center text-sm text-stone-500">Бүтээгдэхүүн нэмж хослол бүтээнэ үү (хамгийн багадаа 2).</p>}
        {items.length === 1 && <p className="mb-3 rounded-lg bg-amber-50 p-2 text-center text-sm">Хослол болгохын тулд дахин 1 бүтээгдэхүүн нэмнэ үү.</p>}

        {items.length > 0 && (
          <>
            {/* Сонгосон бүтээгдэхүүнүүд нэг дор: үргэлж 2 баганад, зураг бүтнээрээ */}
            <div className="mb-3 grid grid-cols-2 gap-2">
              {items.map((i) => (
                <div key={i.product.id} className="relative">
                  <img src={i.product.image_url} alt={i.product.name} className="aspect-square w-full rounded-lg bg-stone-50 object-contain" />
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">{i.product.categories?.name}</span>
                  <button className="absolute right-1 top-1 h-6 w-6 rounded-full bg-white/90 text-red-600" onClick={() => removeItem(i.product.id)} aria-label="Хасах">✕</button>
                </div>
              ))}
            </div>
            <ul className="mb-3 divide-y divide-stone-100 text-sm">
              {items.map((i) => (
                <li key={i.product.id} className="flex items-center gap-2 py-2">
                  <span className="flex-1">{i.product.name}</span>
                  {!pool && <input type="number" min="1" className="w-14 rounded border border-stone-300 px-1 py-0.5" value={i.quantity} onChange={(e) => setQty(i.product.id, Number(e.target.value))} />}
                  <span className="w-24 text-right">{money(i.product.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mb-3 flex justify-between border-t border-stone-200 pt-3 font-semibold"><span>Нийт үнэ</span><span className="text-gold">{money(total)}</span></div>
            <input className="input mb-2" placeholder="Хослолын нэр" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex gap-2">
              <button className="btn-gold flex-1" disabled={saving || !isCombo} onClick={save}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</button>
              <button className="btn-line" onClick={clear}>Цэвэрлэх</button>
            </div>
          </>)}
      </aside>
    </div>
  )
}