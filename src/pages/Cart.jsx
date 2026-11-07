import { useCart } from '../context/CartContext'
import { useToast } from '../components/Toast'
import { money } from '../lib/supabase'
import { Link } from 'react-router-dom'

export default function Cart() {
  const { rows, loading, total, count, unit, setQty, remove } = useCart()
  const toast = useToast()
  const change = async (r, q) => {
    if (q < 1) return
    if (r.products && q > r.products.stock) return toast('Үлдэгдлээс хэтрэх боломжгүй', 'error')
    const { error } = await setQty(r.id, q)
    if (error) toast(error.message, 'error')
  }
  const del = async (id) => { const { error } = await remove(id); toast(error ? error.message : 'Сагснаас хаслаа', error ? 'error' : 'ok') }

  if (loading && rows.length === 0) return <p className="py-20 text-center text-stone-500">Ачаалж байна...</p>
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-serif text-3xl font-bold">Сагс {count > 0 && <span className="text-lg text-stone-500">({count})</span>}</h1>
      {rows.length === 0 ? (
        <div className="py-16 text-center text-stone-500"><p className="mb-4">Сагс хоосон байна.</p><Link to="/products" className="btn-gold">Бүтээгдэхүүн үзэх</Link></div>
      ) : (
        <>
          <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {rows.map((r) => (
              <li key={r.id} className="p-4">
                <div className="flex items-center gap-4">
                  {r.products
                    ? <img src={r.products.image_url} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                    : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xs text-gold">Хослол</div>}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{r.products ? r.products.name : `Хослол: ${r.sets?.name}`}</p>
                    <p className="text-sm text-stone-500">{money(unit(r))}</p>
                    <div className="mt-2 inline-flex items-center rounded-full border border-stone-300">
                      <button className="h-8 w-8 hover:bg-stone-100 rounded-l-full" onClick={() => change(r, r.quantity - 1)} aria-label="Хасах">−</button>
                      <span className="w-8 text-center text-sm">{r.quantity}</span>
                      <button className="h-8 w-8 hover:bg-stone-100 rounded-r-full" onClick={() => change(r, r.quantity + 1)} aria-label="Нэмэх">+</button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{money(unit(r) * r.quantity)}</p>
                    <button className="mt-2 text-sm text-red-600 hover:underline" onClick={() => del(r.id)}>Хасах</button>
                  </div>
                </div>
                {r.sets && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pl-24">
                    {r.sets.set_items.map((i, k) => <img key={k} src={i.products.image_url} alt={i.products.name} title={i.products.name} className="h-12 w-12 rounded-lg object-cover" />)}
                  </div>)}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-stone-200">
            <span className="text-lg font-semibold">Нийт: <span className="text-gold">{money(total)}</span></span>
            <button className="btn-dark" disabled title="Хамгаалалт-2-т хэрэгжинэ">Төлбөр төлөх (удахгүй)</button>
          </div>
        </>)}
    </div>
  )
}