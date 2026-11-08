import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const ORDER = ['ring', 'necklace', 'earrings', 'bracelet'] // бөгж, зүүлт, ээмэг, бугуйвч

// Ангилал бүрээс 1 бүтээгдэхүүн сонгоно
function pickOnePerCategory(products) {
  const byCat = new Map()
  for (const p of products) {
    const key = p.categories?.slug ?? p.category_id
    if (!byCat.has(key)) byCat.set(key, p)
  }
  const preferred = ORDER.filter((s) => byCat.has(s)).map((s) => byCat.get(s))
  const others = [...byCat.entries()].filter(([k]) => !ORDER.includes(k)).map(([, p]) => p)
  return [...preferred, ...others].slice(0, 4)
}

// Нуман хэлбэрийн зураг: цонх шиг хэлбэр нь үнэт эдлэлийн vitrine-ийг санагдуулна
function Arch({ product, className }) {
  return (
    <div className={`flex items-center justify-center overflow-hidden rounded-t-full border border-stone-200 bg-white ${className}`}>
      {product && <img src={product.image_url} alt={product.name} className="max-h-full w-full object-contain" />}
    </div>
  )
}

export default function Home() {
  const [hero, setHero] = useState([])
  const { session, loading } = useAuth()

  useEffect(() => {
    supabase.from('products').select('*, categories(name, slug)').eq('is_active', true)
      .order('created_at', { ascending: false }).limit(80)
      .then(({ data }) => setHero(pickOnePerCategory(data ?? [])))
  }, [])

  // Нэвтэрсэн хэрэглэгч нүүр хуудсыг алгасаад цэстэй хуудас руу шууд орно
  if (loading) return null
  if (session) return <Navigate to="/products" replace />

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="mb-5 font-serif text-4xl font-bold leading-[1.15] md:text-6xl">
            Юу сонгохоо мэдэхгүй байна уу?
          </h1>
          <p className="mb-8 max-w-md leading-relaxed text-stone-600">
            Хэдхэн асуултад хариулаад танд тохирсон бүтээгдэхүүнүүдийг санал болгоно.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/quiz" className="btn-gold px-7 py-3 text-base">Асуултанд хариулах</Link>
            <Link to="/products" className="btn-line px-7 py-3 text-base">Бүтээгдэхүүн үзэх</Link>
          </div>
        </div>

        {/* Бөгж, зүүлт, ээмэг, бугуйвч тус бүрээс 1 */}
        <div className="grid grid-cols-2 gap-3 pb-6 md:pb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={i % 2 === 1 ? 'translate-y-5 md:translate-y-8' : ''}>
              <Arch product={hero[i]} className="h-36 md:h-48" />
              {hero[i] && <p className="mt-2 text-center text-xs text-stone-500">{hero[i].categories?.name}</p>}
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}