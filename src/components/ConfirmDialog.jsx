export default function ConfirmDialog({ open, message, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button className="btn-line" onClick={onCancel}>Болих</button>
          <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={onConfirm}>Тийм, устгах</button>
        </div>
      </div>
    </div>
  )
}
