export default function EmptyState({ title = 'Nothing here', message = '' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
      <h1 className="text-4xl font-serif font-bold text-slate-900">{title}</h1>
      {message ? (
        <p className="text-lg text-slate-700 mt-4">{message}</p>
      ) : (
        <p className="text-lg text-slate-700 mt-4">Recent activity will appear here.</p>
      )}
    </div>
  )
}
