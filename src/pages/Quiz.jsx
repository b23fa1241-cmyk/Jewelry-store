import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useBuilder } from '../context/BuilderContext'
import { useToast } from '../components/Toast'
import ProductCard from '../components/ProductCard'

// Сонгосон tag-уудтай давхцсан тоогоор оноо бодож, төсвөөс хэтэрсэнийг хасна
export function scoreProducts(products, tagIds, budget) {
  return products
    .map((p) => ({ ...p, score: p.product_tags.filter((pt) => tagIds.includes(pt.tag_id)).length }))
    .filter((p) => p.score > 0 && (!budget || p.price <= Number(budget)))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
}

export default function Quiz() {
  const [qs, setQs] = useState([])
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState({})
  const [budget, setBudget] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useAuth()
  const { addItem, setPool } = useBuilder()
  const toast = useToast()

  useEffect(() => {
    supabase.from('quiz_questions').select('*, quiz_options(*)').order('sort_order').order('sort_order', { referencedTable: 'quiz_options' })
      .then(({ data }) => { setQs(data ?? []); setLoading(false) })
  }, [])

  const finish = async () => {
    setLoading(true)
    const tagIds = Object.values(picked).map((o) => o.tag_id)
    const { data, error } = await supabase.from('products').select('*, categories(name), product_tags(tag_id), product_images(url, sort_order)').eq('is_active', true)
    if (error) toast(error.message, 'error')
    setResults(scoreProducts(data ?? [], tagIds, budget))
    setLoading(false)
  }
  const restart = () => { setStep(0); setPicked({}); setBudget(''); setResults(null) }

  if (loading) return <p className="py-20 text-center text-stone-500">Ачаалж байна...</p>
  if (results) return (
    <>
      <h1 className="mb-2 font-serif text-3xl font-bold">Танд санал болгох</h1>
      <div className="mb-6 flex gap-2"><button className="btn-line" onClick={restart}>Дахин бөглөх</button><Link to="/builder" className="btn-gold" onClick={() => setPool(results)}>Builder руу очих</Link></div>
      {results.length === 0 ? <p className="py-10 text-stone-500">Тохирох бүтээгдэхүүн олдсонгүй. Төсвөө нэмж үзнэ үү.</p>
        : <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {results.map((p) => <ProductCard key={p.id} product={p} extra={<p className="text-xs text-stone-500">Тохироо: {p.score}</p>} onAdd={(x) => { addItem(x); toast('Хослолд нэмлээ') }} />)}
          </div>}
    </>
  )

  const isBudget = step === qs.length
  const q = qs[step]
  return (
    <div className="mx-auto max-w-xl">
      {isAdmin && <Link to="/admin/quiz" className="btn-line mb-4">Асуулт засах</Link>}
      <p className="mb-2 text-sm text-stone-500">Асуулт {step + 1} / {qs.length + 1}</p>
      <div className="mb-6 h-1 rounded bg-stone-200"><div className="h-1 rounded bg-gold" style={{ width: `${((step + 1) / (qs.length + 1)) * 100}%` }} /></div>
      {!isBudget ? (
        <>
          <h2 className="mb-4 font-serif text-2xl">{q.question_text}</h2>
          <div className="grid gap-2">
            {q.quiz_options.map((o) => (
              <button key={o.id} onClick={() => { setPicked({ ...picked, [q.id]: o }); setStep(step + 1) }}
                className={`rounded-xl border p-3 text-left hover:border-gold ${picked[q.id]?.id === o.id ? 'border-gold bg-amber-50' : 'border-stone-300 bg-white'}`}>{o.label}</button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 className="mb-4 font-serif text-2xl">Төсөв хэд вэ? (₮, заавал биш)</h2>
          <input className="input mb-4" type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Жишээ: 1000000" />
          <button className="btn-gold" onClick={finish}>Үр дүн харах</button>
        </>
      )}
      {step > 0 && <button className="btn-line mt-6" onClick={() => setStep(step - 1)}>‹ Буцах</button>}
    </div>
  )
}