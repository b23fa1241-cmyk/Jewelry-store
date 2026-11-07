import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)
export const useCart = () => useContext(CartContext)

export function CartProvider({ children }) {
  const { session } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!session) { setRows([]); return }
    setLoading(true)
    const { data } = await supabase.from('cart_items')
      .select('*, products(*), sets(name, total_price, set_items(quantity, products(name, image_url)))').order('id')
    setRows(data ?? []); setLoading(false)
  }, [session])
  useEffect(() => { load() }, [load])

  const addProduct = async (product) => {
    const ex = rows.find((r) => r.product_id === product.id)
    if ((ex?.quantity ?? 0) >= product.stock) return { error: { message: 'Үлдэгдлээс хэтрэх боломжгүй' } }
    const { error } = ex
      ? await supabase.from('cart_items').update({ quantity: ex.quantity + 1 }).eq('id', ex.id)
      : await supabase.from('cart_items').insert({ product_id: product.id, quantity: 1 })
    if (!error) await load()
    return { error }
  }
  const addSet = async (setId) => {
    const ex = rows.find((r) => r.set_id === setId)
    const { error } = ex
      ? await supabase.from('cart_items').update({ quantity: ex.quantity + 1 }).eq('id', ex.id)
      : await supabase.from('cart_items').insert({ set_id: setId, quantity: 1 })
    if (!error) await load()
    return { error }
  }
  const setQty = async (id, quantity) => {
    const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', id)
    if (!error) await load()
    return { error }
  }
  const remove = async (id) => {
    const { error } = await supabase.from('cart_items').delete().eq('id', id)
    if (!error) await load()
    return { error }
  }

  const unit = (r) => (r.products ? r.products.price : r.sets?.total_price ?? 0)
  const count = useMemo(() => rows.reduce((s, r) => s + r.quantity, 0), [rows])
  const total = useMemo(() => rows.reduce((s, r) => s + unit(r) * r.quantity, 0), [rows])

  return (
    <CartContext.Provider value={{ rows, loading, count, total, unit, addProduct, addSet, setQty, remove }}>
      {children}
    </CartContext.Provider>
  )
}