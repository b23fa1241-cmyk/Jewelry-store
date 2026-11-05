import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { money } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from './Toast'

const MATERIALS = { gold: 'Алт', silver: 'Мөнгө', rosegold: 'Rose gold' }

function stockInfo(stock) {
  if (stock <= 0) return { text: 'Дууссан', short: 'Дууссан', cls: 'text-red-600', badge: 'bg-red-50 text-red-700' }
  if (stock <= 5) return { text: `Үлдэгдэл: ${stock}`, short: `${stock} ширхэг`, cls: 'text-amber-600', badge: 'bg-amber-50 text-amber-700' }
  return { text: `Үлдэгдэл: ${stock}`, short: `${stock} ширхэг`, cls: 'text-green-700', badge: 'bg-green-50 text-green-700' }
}

export default function ProductCard({ product, onAdd, label = 'Хослолд нэмэх', extra, showCart = true }) {
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)
  const { session } = useAuth()
  const cart = useCart()
  const toast = useToast()
  const nav = useNavigate()
  const material = MATERIALS[product.material] ?? product.material
  const stock = stockInfo(product.stock ?? 0)
  const soldOut = (product.stock ?? 0) <= 0
  const images = (product.product_images?.length
    ? [...product.product_images].sort((a, b) => a.sort_order - b.sort_order).map((i) => i.url)
    : [product.image_url]).filter(Boolean)
  const openModal = () => { setIdx(0); setOpen(true) }

  const addCart = async () => {
    if (!session) { toast('Сагслахын тулд нэвтэрнэ үү', 'error'); return nav('/login') }
    const { error } = await cart.addProduct(product)
    toast(error ? error.message : 'Сагсанд нэмэгдлээ', error ? 'error' : 'ok')
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="relative cursor-pointer" onClick={openModal}>
          <img src={product.image_url} alt={product.name} loading="lazy" className={`aspect-square w-full object-cover ${soldOut ? 'opacity-60' : ''}`} />
          {images.length > 1 && <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">{images.length} зураг</span>}
          {soldOut && <span className="absolute left-2 top-2 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white">Дууссан</span>}
        </div>
        <div className="space-y-1 p-3">
          <h3 className="cursor-pointer font-serif font-medium hover:text-gold" onClick={openModal}>{product.name}</h3>
          <p className="font-semibold text-gold">{money(product.price)}</p>
          <p className={`text-xs ${stock.cls}`}>{stock.text}</p>
          {extra}
          {(onAdd || showCart) && (
            <div className={`mt-2 grid gap-2 ${onAdd && showCart ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {onAdd && <button className="btn-dark whitespace-nowrap px-2 py-1.5 text-xs" disabled={soldOut} onClick={() => onAdd(product)}>{soldOut ? 'Дууссан' : label}</button>}
              {showCart && <button className="btn-line whitespace-nowrap px-2 py-1.5 text-xs" disabled={soldOut} onClick={addCart}>Сагслах</button>}
            </div>)}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex overflow-y-auto bg-stone-900/60 p-3 backdrop-blur-sm md:p-4" onClick={() => setOpen(false)}>
          <div className="relative m-auto grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-[1fr_1.1fr]" onClick={(e) => e.stopPropagation()}>
            <button className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow hover:bg-stone-100" onClick={() => setOpen(false)} aria-label="Хаах">✕</button>
            <div className="bg-stone-50">
              <img src={images[idx]} alt={product.name} className="aspect-square w-full object-contain" />
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {images.map((u, k) => (
                    <img key={u} src={u} alt="" onClick={() => setIdx(k)}
                      className={`h-14 w-14 shrink-0 cursor-pointer rounded-lg object-cover ${k === idx ? 'ring-2 ring-gold' : 'opacity-60 hover:opacity-100'}`} />
                  ))}
                </div>)}
            </div>
            <div className="flex flex-col p-6 md:p-8">
              <h2 className="mb-2 pr-8 font-serif text-xl font-bold leading-snug md:text-2xl">{product.name}</h2>
              <p className="mb-5 font-serif text-3xl text-gold">{money(product.price)}</p>
              <div className="mb-5 divide-y divide-stone-100 rounded-xl border border-stone-200 text-sm">
                <div className="flex items-center justify-between gap-4 px-4 py-3"><span className="text-stone-500">Үлдэгдэл</span><span className={`rounded-full px-3 py-0.5 text-xs font-medium ${stock.badge}`}>{stock.short}</span></div>
                <div className="flex gap-4 px-4 py-3"><span className="w-20 shrink-0 text-stone-500">Материал</span><span className="flex-1">{material || '-'}</span></div>
                <div className="flex gap-4 px-4 py-3"><span className="w-20 shrink-0 text-stone-500">Ангилал</span><span className="flex-1">{product.categories?.name ?? '-'}</span></div>
              </div>
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-stone-400">Тайлбар</h3>
              <p className="mb-6 text-sm leading-relaxed text-stone-700">{product.description || 'Тайлбар оруулаагүй байна.'}</p>
              <div className="mt-auto grid gap-2">
                {onAdd && <button className="btn-gold w-full py-3 text-base" disabled={soldOut} onClick={() => { onAdd(product); setOpen(false) }}>{soldOut ? 'Дууссан' : label}</button>}
                {showCart && <button className="btn-line w-full py-3 text-base" disabled={soldOut} onClick={addCart}>Сагслах</button>}
              </div>
            </div>
          </div>
        </div>)}
    </>
  )
}