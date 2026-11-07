import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/Toast'
import ConfirmDialog from '../../components/ConfirmDialog'
import AdminTabs from '../../components/AdminTabs'

const TAG_TYPES = { occasion: 'Зориулалт', style: 'Хэв маяг', recipient: 'Хэнд', material: 'Материал' }

// Tag-уудыг ойлгомжтой Монгол нэрээр харуулна (шинэ tag бол өөрийн нэрээр)
const TAG_LABELS = {
  wedding: 'Хурим', birthday: 'Төрсөн өдөр', daily: 'Өдөр тутам', gift: 'Бэлэг',
  classic: 'Classic', minimal: 'Minimal', luxury: 'Luxury', trendy: 'Trendy',
  self: 'Өөртөө', partner: 'Хайртдаа', mother: 'Ээждээ', friend: 'Найздаа',
  gold: 'Алт', silver: 'Мөнгө', rosegold: 'Ягаан алт',
}
const tagLabel = (t) => TAG_LABELS[t.name] ?? t.name

function TagSelect({ tags, value, onChange }) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Сонгох...</option>
      {Object.entries(TAG_TYPES).map(([type, label]) => (
        <optgroup key={type} label={label}>
          {tags.filter((t) => t.type === type).map((t) => <option key={t.id} value={t.id}>{tagLabel(t)}</option>)}
        </optgroup>))}
    </select>
  )
}

// Нэг сонголт: зөвхөн шошго сонгоно, шошгын нэр нь хариултын текст болно
function OptionRow({ option, tags, api }) {
  const [tagId, setTagId] = useState(option.tag_id ?? '')
  const dirty = tagId !== (option.tag_id ?? '')
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 p-3">
      <div className="min-w-0 flex-1 basis-40"><TagSelect tags={tags} value={tagId} onChange={setTagId} /></div>
      {dirty && <button className="btn-gold px-4 py-1 text-xs" onClick={() => api.saveOption(option, tagId)}>Хадгалах</button>}
      {dirty && <button className="btn-line px-4 py-1 text-xs" onClick={() => setTagId(option.tag_id ?? '')}>Болих</button>}
      <button className="btn-line px-3 py-1 text-xs text-red-600" onClick={() => api.askDelete('option', option.id)}>Устгах</button>
    </li>
  )
}

function QuestionCard({ q, index, tags, open, onToggle, api }) {
  const [text, setText] = useState(q.question_text)
  const [newTagId, setNewTagId] = useState('')
  const available = tags.filter((t) => !q.quiz_options.some((o) => o.tag_id === t.id)) // аль хэдийн сонгосныг дахин санал болгохгүй
  const dirty = text.trim() !== q.question_text

  const add = async () => {
    const ok = await api.addOption(q, newTagId)
    if (ok) setNewTagId('')
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left hover:bg-stone-50">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm text-white">{index + 1}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium leading-snug">{q.question_text}</span>
          <span className="text-xs text-stone-500">{q.quiz_options.length} сонголттой</span>
        </span>
        <span className="text-stone-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="space-y-5 border-t border-stone-100 p-4">
          <div>
            <label className="text-sm font-medium" htmlFor={`q-${q.id}`}>Асуултын текст</label>
            <div className="mt-1 flex gap-2">
              <input id={`q-${q.id}`} className="input" value={text} onChange={(e) => setText(e.target.value)} />
              {dirty && <button className="btn-gold shrink-0" onClick={() => api.saveQuestion(q, text)}>Хадгалах</button>}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Хариултын сонголтууд</p>
            <ul className="space-y-2">
              {q.quiz_options.map((o) => (
                <OptionRow key={o.id} option={o} tags={tags} api={api} />
              ))}
              {q.quiz_options.length === 0 && <li className="text-sm text-stone-500">Сонголт байхгүй байна. Доороос нэмнэ үү.</li>}
            </ul>
          </div>

          <div className="rounded-xl bg-amber-50 p-3">
            <p className="mb-2 text-sm font-medium">Шинэ сонголт нэмэх</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1"><TagSelect tags={available} value={newTagId} onChange={setNewTagId} /></div>
              <button className="btn-dark shrink-0 px-4 py-1.5" onClick={add}>+ Нэмэх</button>
            </div>
          </div>

          <div className="flex justify-end border-t border-stone-100 pt-4">
            <button className="btn-line px-3 py-1 text-xs text-red-600" onClick={() => api.askDelete('question', q.id)}>Асуултыг устгах</button>
          </div>
        </div>)}
    </div>
  )
}

export default function AdminQuiz() {
  const [qs, setQs] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)
  const [newQ, setNewQ] = useState('')
  const [newTag, setNewTag] = useState({ name: '', type: 'material' })
  const [del, setDel] = useState(null) // { kind: 'question' | 'option', id }
  const toast = useToast()

  const load = useCallback(async () => {
    const [q, t] = await Promise.all([
      supabase.from('quiz_questions').select('*, quiz_options(*)').order('sort_order').order('sort_order', { referencedTable: 'quiz_options' }),
      supabase.from('tags').select('*').order('name')])
    if (q.error) toast(q.error.message, 'error')
    setQs(q.data ?? []); setTags(t.data ?? []); setLoading(false)
    setOpenId((prev) => prev ?? q.data?.[0]?.id ?? null)
  }, [toast])
  useEffect(() => { load() }, [load])

  const run = async (promise, okMsg) => {
    const { error } = await promise
    toast(error ? error.message : okMsg, error ? 'error' : 'ok')
    if (!error) await load()
    return !error
  }

  const api = {
    saveQuestion: (q, text) => {
      if (text.trim().length < 3) return toast('Асуулт хэт богино байна', 'error')
      return run(supabase.from('quiz_questions').update({ question_text: text.trim() }).eq('id', q.id), 'Хадгалагдлаа')
    },
    addOption: async (q, tag_id) => {
      const tag = tags.find((t) => t.id === tag_id)
      if (!tag) { toast('Сонголтоо сонгоно уу', 'error'); return false }
      const sort_order = Math.max(0, ...q.quiz_options.map((o) => o.sort_order)) + 1
      return run(supabase.from('quiz_options').insert({ question_id: q.id, label: tagLabel(tag), tag_id, sort_order }), 'Сонголт нэмэгдлээ')
    },
    saveOption: (o, tag_id) => {
      const tag = tags.find((t) => t.id === tag_id)
      if (!tag) return toast('Сонголтоо сонгоно уу', 'error')
      return run(supabase.from('quiz_options').update({ label: tagLabel(tag), tag_id }).eq('id', o.id), 'Хадгалагдлаа')
    },
    askDelete: (kind, id) => setDel({ kind, id }),
  }

  const addQuestion = async () => {
    if (newQ.trim().length < 3) return toast('Асуулт хэт богино байна', 'error')
    const sort_order = Math.max(0, ...qs.map((q) => q.sort_order)) + 1
    const ok = await run(supabase.from('quiz_questions').insert({ question_text: newQ.trim(), sort_order }), 'Асуулт нэмэгдлээ')
    if (ok) setNewQ('')
  }
  const addTag = async () => {
    const name = newTag.name.trim()
    if (name.length < 2) return toast('Шошгын нэр хэт богино байна', 'error')
    const ok = await run(supabase.from('tags').insert({ name, type: newTag.type }), 'Сонголт нэмэгдлээ')
    if (ok) setNewTag({ ...newTag, name: '' })
  }
  const confirmDelete = async () => {
    const { kind, id } = del; setDel(null)
    await run(supabase.from(kind === 'question' ? 'quiz_questions' : 'quiz_options').delete().eq('id', id), 'Устгагдлаа')
  }

  if (loading) return <p className="py-20 text-center text-stone-500">Ачаалж байна...</p>
  return (
    <>
      <AdminTabs />
      <h1 className="mb-3 text-2xl font-bold md:text-3xl">Асуултууд</h1>

      <div className="space-y-3">
        {qs.map((q, i) => (
          <QuestionCard key={q.id} q={q} index={i} tags={tags}
            open={openId === q.id} onToggle={() => setOpenId(openId === q.id ? null : q.id)} api={api} />
        ))}
        {qs.length === 0 && <p className="py-6 text-center text-stone-500">Асуулт байхгүй байна. Доороос нэмнэ үү.</p>}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-stone-300 p-4">
        <p className="mb-2 text-sm font-medium">Шинэ асуулт нэмэх</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className="input" placeholder="Жишээ: Ямар чулуу таалагддаг вэ?" value={newQ} onChange={(e) => setNewQ(e.target.value)} />
          <button className="btn-dark shrink-0" onClick={addQuestion}>+ Асуулт нэмэх</button>
        </div>
      </div>

      <details className="mt-6 rounded-2xl border border-stone-200 bg-white p-4">
        <summary className="mb-3 cursor-pointer text-sm font-medium">Сонголтын ангилал</summary>
        {Object.entries(TAG_TYPES).map(([type, label]) => (
          <div key={type} className="mb-3">
            <p className="mb-1 text-xs text-stone-500">{label}</p>
            <div className="flex flex-wrap gap-1">
              {tags.filter((t) => t.type === type).map((t) => <span key={t.id} className="rounded-full border border-stone-300 px-3 py-0.5 text-xs">{tagLabel(t)}</span>)}
            </div>
          </div>))}
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_180px_auto]">
          <input className="input" placeholder="Шинэ сонголтын нэр" value={newTag.name} onChange={(e) => setNewTag({ ...newTag, name: e.target.value })} />
          <select className="input" value={newTag.type} onChange={(e) => setNewTag({ ...newTag, type: e.target.value })}>
            {Object.entries(TAG_TYPES).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
          </select>
          <button className="btn-gold" onClick={addTag}>+ Сонголт нэмэх</button>
        </div>
      </details>

      <ConfirmDialog open={!!del}
        message={del?.kind === 'question' ? 'Энэ асуулт болон бүх сонголтыг нь устгах уу?' : 'Энэ сонголтыг устгах уу?'}
        onConfirm={confirmDelete} onCancel={() => setDel(null)} />
    </>
  )
}