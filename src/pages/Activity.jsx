import { Activity } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function ActivityPage() {
  const { activity, hasHousehold } = useApp()

  if (!hasHousehold) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Create a household first</h1>
        <p className="text-slate-600 text-sm mt-1">
          Activity is tracked per household. Go to Household and create one to begin.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-7 h-7 text-teal-700" />
          Activity
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Everything your household has done in one place.
        </p>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        {activity.length === 0 ? (
          <p className="text-slate-500 text-sm">No activity yet.</p>
        ) : (
          <ul className="space-y-3">
            {activity.map((item) => (
              <li
                key={item.id}
                className="text-sm text-slate-600 leading-relaxed border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <span className="block text-slate-400 text-xs mb-0.5">{item.at}</span>
                {item.text}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
