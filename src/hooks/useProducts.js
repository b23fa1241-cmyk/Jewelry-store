import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useProducts({ search = '', category = '', sort = 'new', maxPrice = '', page = 1, pageSize = 8 }) {
  const [state, setState] = useState({ rows: [], count: 0, loading: true, error: null })
  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true }))
    let q = supabase.from('products').select('*, categories(name), product_images(url, sort_order)', { count: 'exact' }).eq('is_active', true)
    if (search) q = q.ilike('name', `%${search}%`)
    if (category) q = q.eq('category_id', category)
    if (maxPrice) q = q.lte('price', Number(maxPrice))
    const [col, asc] = sort === 'price_asc' ? ['price', true] : sort === 'price_desc' ? ['price', false] : ['created_at', false]
    q.order(col, { ascending: asc }).range((page - 1) * pageSize, page * pageSize - 1).then(({ data, count, error }) => {
      if (!cancelled) setState({ rows: data ?? [], count: count ?? 0, loading: false, error: error?.message ?? null })
    })
    return () => { cancelled = true }
  }, [search, category, sort, maxPrice, page, pageSize])
  return state
}

export function useCategories() {
  const [cats, setCats] = useState([])
  useEffect(() => { supabase.from('categories').select('*').order('name').then(({ data }) => setCats(data ?? [])) }, [])
  return cats
}