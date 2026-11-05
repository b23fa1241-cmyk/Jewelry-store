import { createContext, useContext, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const BuilderContext = createContext(null)
export const useBuilder = () => useContext(BuilderContext)

export function BuilderProvider({ children }) {
  const [items, setItems] = useState([]) // [{ product, quantity }]
  const [pool, setPool] = useState(null) // Quiz-ээс санал болгосон бүтээгдэхүүнүүд (null бол бүгдийг харуулна)

  const addItem = (product) => setItems((prev) => {
    const found = prev.find((i) => i.product.id === product.id)
    return found
      ? prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...prev, { product, quantity: 1 }]
  })
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.product.id !== id))
  const setQty = (id, q) => setItems((prev) => prev.map((i) => i.product.id === id ? { ...i, quantity: Math.max(1, q) } : i))
  const clear = () => setItems([])
  const loadItems = (list) => setItems(list)

  // Нийт үнэ: items өөрчлөгдөхөд л дахин бодогдоно
  const total = useMemo(() => items.reduce((s, i) => s + i.product.price * i.quantity, 0), [items])

  // Серверийн save_set функц нийт үнийг дахин бодож хадгална
  const saveSet = async (name) => {
    const payload = items.map((i) => ({ product_id: i.product.id, quantity: i.quantity }))
    const { data, error } = await supabase.rpc('save_set', { p_name: name, p_items: payload })
    if (error) throw error
    return data
  }

  return (
    <BuilderContext.Provider value={{ pool, setPool, items, addItem, removeItem, setQty, clear, loadItems, total, saveSet }}>
      {children}
    </BuilderContext.Provider>
  )
}