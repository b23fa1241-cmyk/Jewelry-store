import { useState } from 'react'
import { useProducts, useCategories } from '../hooks/useProducts'
import { useBuilder } from '../context/BuilderContext'
import { useToast } from '../components/Toast'
import ProductCard from '../components/ProductCard'

const PAGE_SIZE = 8
export default function Products() {
  const [f, setF] = useState({ search: '', category: '', sort: 'new', maxPrice: '' })
  const [page, setPage] = useState(1)
  const cats = useCategories()
  const { rows, count, loading, error } = useProducts({ ...f, page, pageSize: PAGE_SIZE })
  const { addItem } = useBuilder()
  const toast = useToast()
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1) }
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <>
      <h1 className="mb-6 font-serif text-3xl font-bold">Бүтээгдэхүүн</h1>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input className="input" placeholder="Нэрээр хайх..." value={f.search} onChange={set('search')} />
        <select className="input" value={f.category} onChange={set('category')}>
          <option value="">Бүх ангилал</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="input" type="number" min="0" placeholder="Дээд үнэ (₮)" value={f.maxPrice} onChange={set('maxPrice')} />
        <select className="input" value={f.sort} onChange={set('sort')}>
          <option value="new">Шинэ нь эхэнд</option>
          <option value="price_asc">Үнэ: бага → их</option>
          <option value="price_desc">Үнэ: их → бага</option>
        </select>
      </div>
      {error && <p className="text-red-600">Алдаа: {error}</p>}
      {loading ? <p className="py-20 text-center text-stone-500">Ачаалж байна...</p>
        : rows.length === 0 ? <p className="py-20 text-center text-stone-500">Хайлтад тохирох бүтээгдэхүүн олдсонгүй.</p>
        : <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {rows.map((p) => <ProductCard key={p.id} product={p} onAdd={(x) => { addItem(x); toast('Хослолд нэмлээ') }} />)}
          </div>}
      <div className="mt-8 flex items-center justify-center gap-3">
        <button className="btn-line" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Өмнөх</button>
        <span className="text-sm">{page} / {pages}</span>
        <button className="btn-line" disabled={page >= pages} onClick={() => setPage(page + 1)}>Дараах ›</button>
      </div>
    </>
  )
}
