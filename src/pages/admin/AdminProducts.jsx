import { useCallback, useEffect, useState } from 'react'
import { supabase, money } from '../../lib/supabase'
import { useToast } from '../../components/Toast'
import ConfirmDialog from '../../components/ConfirmDialog'
import AdminTabs from '../../components/AdminTabs'

const EMPTY = { name: '', description: '', price: '', stock: '', material: '', category_id: '', image_url: '' }
const MAX_MB = 2, MAX_IMAGES = 5, TYPES = ['image/jpeg', 'image/png', 'image/webp'], BUCKET = 'product-images'
const storagePath = (url) => (url.includes(`/${BUCKET}/`) ? url.split(`/${BUCKET}/`)[1] : null)

export default function AdminProducts() {
  const [rows, setRows] = useState([])
  const [cats, setCats] = useState([])
  const [tags, setTags] = useState([])
  const [tagIds, setTagIds] = useState([])
  const [form, setForm] = useState(null)
  const [images, setImages] = useState([])      // [{ url, file? }] — эхнийх нь нүүр зураг
  const [origUrls, setOrigUrls] = useState([])  // засахаас өмнөх зургууд (устгагдсаныг Storage-оос арилгахад)
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const load = useCallback(async () => {
    const [p, c, t] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*'),
      supabase.from('tags').select('*').order('name')])
    setRows(p.data ?? []); setCats(c.data ?? []); setTags(t.data ?? [])
  }, [])
  useEffect(() => { load() }, [load])

  const open = async (p = EMPTY) => {
    setForm(p); setTagIds([]); setImages([]); setOrigUrls([])
    if (p.id) {
      const [tg, im] = await Promise.all([
        supabase.from('product_tags').select('tag_id').eq('product_id', p.id),
        supabase.from('product_images').select('url').eq('product_id', p.id).order('sort_order')])
      setTagIds((tg.data ?? []).map((x) => x.tag_id))
      const urls = (im.data ?? []).map((x) => x.url)
      if (urls.length === 0 && p.image_url) urls.push(p.image_url)
      setImages(urls.map((url) => ({ url }))); setOrigUrls(urls)
    }
  }
  const toggleTag = (id) => setTagIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  // Олон зураг сонгох: файл бүрийг төрөл, хэмжээгээр шалгаж, preview гаргана
  const pick = (e) => {
    const files = Array.from(e.target.files); e.target.value = ''
    const next = [...images]
    for (const f of files) {
      if (!TYPES.includes(f.type)) { toast(`${f.name}: зөвхөн JPG, PNG, WEBP`, 'error'); continue }
      if (f.size > MAX_MB * 1024 * 1024) { toast(`${f.name}: ${MAX_MB}MB-аас бага байх ёстой`, 'error'); continue }
      if (next.length >= MAX_IMAGES) { toast(`Хамгийн ихдээ ${MAX_IMAGES} зураг`, 'error'); break }
      next.push({ url: URL.createObjectURL(f), file: f })
    }
    setImages(next)
  }
  const removeImg = (i) => setImages(images.filter((_, k) => k !== i))
  const makeCover = (i) => setImages([images[i], ...images.filter((_, k) => k !== i)])

  const save = async (e) => {
    e.preventDefault()
    if (form.name.trim().length < 2) return toast('Нэр хэт богино', 'error')
    if (!(Number(form.price) > 0)) return toast('Үнэ 0-ээс их байх ёстой', 'error')
    if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) return toast('Үлдэгдэл бүхэл тоо байх ёстой', 'error')
    if (!form.category_id) return toast('Ангилал сонгоно уу', 'error')
    if (images.length === 0) return toast('Дор хаяж 1 зураг оруулна уу', 'error')
    setBusy(true)

    const urls = []
    for (const img of images) {
      if (!img.file) { urls.push(img.url); continue }
      const path = `${crypto.randomUUID()}.${img.file.name.split('.').pop()}`
      const up = await supabase.storage.from(BUCKET).upload(path, img.file)
      if (up.error) { setBusy(false); return toast(up.error.message, 'error') }
      urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl)
    }

    const body = { name: form.name.trim(), description: form.description, material: form.material, category_id: form.category_id,
      price: Number(form.price), stock: Number(form.stock), image_url: urls[0] }
    let pid = form.id, error
    if (pid) ({ error } = await supabase.from('products').update(body).eq('id', pid))
    else { const r = await supabase.from('products').insert(body).select('id').single(); error = r.error; pid = r.data?.id }

    if (!error) {
      await supabase.from('product_tags').delete().eq('product_id', pid)
      if (tagIds.length) ({ error } = await supabase.from('product_tags').insert(tagIds.map((t) => ({ product_id: pid, tag_id: t }))))
    }
    if (!error) {
      await supabase.from('product_images').delete().eq('product_id', pid)
      ;({ error } = await supabase.from('product_images').insert(urls.map((url, i) => ({ product_id: pid, url, sort_order: i }))))
    }
    if (!error) {   // хасагдсан зургуудыг Storage-оос устгана
      const gone = origUrls.filter((u) => !urls.includes(u)).map(storagePath).filter(Boolean)
      if (gone.length) await supabase.storage.from(BUCKET).remove(gone)
    }
    setBusy(false)
    if (error) return toast(error.message, 'error')
    toast('Хадгалагдлаа'); setForm(null); load()
  }

  const remove = async () => {
    const { error } = await supabase.from('products').delete().eq('id', toDelete)
    setToDelete(null); toast(error ? error.message : 'Устгагдлаа', error ? 'error' : 'ok'); load()
  }
  const f = (k) => ({ value: form?.[k] ?? '', onChange: (e) => setForm({ ...form, [k]: e.target.value }) })

  return (
    <>
      <AdminTabs />
      <div className="mb-4 flex items-center justify-between"><h1 className="font-serif text-2xl font-bold md:text-3xl">Бүтээгдэхүүн</h1><button className="btn-gold shrink-0 whitespace-nowrap" onClick={() => open()}>+ Шинэ</button></div>
      {/* Утсан дээр карт, өргөн дэлгэц дээр хүснэгт */}
      <ul className="space-y-3 md:hidden">
        {rows.map((p) => (
          <li key={p.id} className="flex gap-3 rounded-2xl border border-stone-200 bg-white p-3">
            <img src={p.image_url} alt="" className="h-20 w-20 shrink-0 rounded-lg bg-stone-50 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug">{p.name}</p>
              <p className="text-xs text-stone-500">{p.categories?.name} · Үлдэгдэл: {p.stock}</p>
              <p className="font-semibold text-gold">{money(p.price)}</p>
              <div className="mt-2 flex gap-2">
                <button className="btn-line px-3 py-1 text-xs" onClick={() => open(p)}>Засах</button>
                <button className="btn-line px-3 py-1 text-xs text-red-600" onClick={() => setToDelete(p.id)}>Устгах</button>
              </div>
            </div>
          </li>))}
      </ul>
      {rows.length === 0 && <p className="p-6 text-center text-stone-500 md:hidden">Бүтээгдэхүүн алга.</p>}
      <div className="hidden overflow-x-auto rounded-2xl border border-stone-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-100"><tr><th className="p-3">Зураг</th><th>Нэр</th><th>Ангилал</th><th>Үнэ</th><th>Үлдэгдэл</th><th></th></tr></thead>
          <tbody>{rows.map((p) => (
            <tr key={p.id} className="border-t border-stone-100">
              <td className="p-3"><img src={p.image_url} alt="" className="h-12 w-12 rounded object-cover" /></td>
              <td>{p.name}</td><td>{p.categories?.name}</td><td>{money(p.price)}</td><td>{p.stock}</td>
              <td className="space-x-2 pr-3 text-right"><button className="btn-line" onClick={() => open(p)}>Засах</button><button className="btn-line text-red-600" onClick={() => setToDelete(p.id)}>Устгах</button></td>
            </tr>))}</tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-stone-500">Бүтээгдэхүүн алга.</p>}
      </div>

      {form && (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={save} className="max-h-[92vh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl bg-white p-6">
            <h2 className="font-serif text-xl font-bold">{form.id ? 'Засах' : 'Шинэ бүтээгдэхүүн'}</h2>
            <input className="input" placeholder="Нэр" {...f('name')} />
            <select className="input" {...f('category_id')}><option value="">Ангилал сонгох</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <div className="grid grid-cols-2 gap-2"><input className="input" type="number" placeholder="Үнэ (₮)" {...f('price')} /><input className="input" type="number" placeholder="Үлдэгдэл" {...f('stock')} /></div>
            <input className="input" placeholder="Материал (gold/silver/rosegold)" {...f('material')} />
            <textarea className="input" rows="2" placeholder="Тайлбар" {...f('description')} />
            <div>
              <p className="mb-1 text-sm font-medium">Quiz-д тохируулах tag</p>
              {['occasion', 'style', 'recipient', 'material'].map((type) => (
                <div key={type} className="mb-1 flex flex-wrap gap-1">
                  {tags.filter((t) => t.type === type).map((t) => (
                    <button type="button" key={t.id} onClick={() => toggleTag(t.id)}
                      className={`rounded-full border px-3 py-1 text-xs ${tagIds.includes(t.id) ? 'border-gold bg-amber-50 text-gold' : 'border-stone-300'}`}>{t.name}</button>
                  ))}
                </div>))}
            </div>

            <div>
              <p className="mb-1 text-sm font-medium">Зураг ({images.length}/{MAX_IMAGES}) · JPG/PNG/WEBP, {MAX_MB}MB хүртэл</p>
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={pick} className="text-sm" disabled={images.length >= MAX_IMAGES} />
              {images.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {images.map((img, i) => (
                    <div key={img.url} className="relative">
                      <img src={img.url} alt="" className={`aspect-square w-full rounded-lg object-cover ${i === 0 ? 'ring-2 ring-gold' : ''}`} />
                      {i === 0 ? <span className="absolute bottom-1 left-1 rounded bg-gold px-1.5 py-0.5 text-[10px] text-white">Нүүр</span>
                        : <button type="button" onClick={() => makeCover(i)} className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">Нүүр болгох</button>}
                      <button type="button" onClick={() => removeImg(i)} className="absolute right-1 top-1 h-5 w-5 rounded-full bg-white/90 text-xs text-red-600" aria-label="Устгах">✕</button>
                    </div>))}
                </div>)}
            </div>

            <div className="flex justify-end gap-2"><button type="button" className="btn-line" onClick={() => setForm(null)}>Болих</button><button className="btn-gold" disabled={busy}>{busy ? 'Хадгалж байна...' : 'Хадгалах'}</button></div>
          </form>
        </div>)}
      <ConfirmDialog open={!!toDelete} message="Энэ бүтээгдэхүүнийг устгах уу?" onConfirm={remove} onCancel={() => setToDelete(null)} />
    </>
  )
}