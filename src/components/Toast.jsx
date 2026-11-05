import { createContext, useCallback, useContext, useState } from 'react'
const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [list, setList] = useState([])
  const toast = useCallback((message, type = 'ok') => {
    const id = Date.now() + Math.random()
    setList((l) => [...l, { id, message, type }])
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3000)
  }, [])
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2 sm:left-auto sm:max-w-sm">
        {list.map((t) => (
          <div key={t.id} className={`rounded-lg px-4 py-2 text-sm text-white shadow-lg ${t.type === 'error' ? 'bg-red-600' : 'bg-stone-900'}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}