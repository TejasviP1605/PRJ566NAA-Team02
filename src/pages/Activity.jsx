import { useMemo } from 'react'
import {
  Activity as ActivityIcon,
  FileText,
  Receipt,
  UserPlus,
  Wrench,
  Home,
} from 'lucide-react'
import HouseholdGate from '../components/HouseholdGate'
import { useApp } from '../context/AppContext'
import { formatDateTime } from '../utils/format'

const TYPE_META = {
  household_created: { label: 'Household', icon: Home, accent: 'bg-teal-50 text-teal-700' },
  member_added: { label: 'Member', icon: UserPlus, accent: 'bg-sky-50 text-sky-700' },
  expense_added: { label: 'Expense', icon: Receipt, accent: 'bg-amber-50 text-amber-700' },
  expense_updated: { label: 'Expense', icon: Receipt, accent: 'bg-amber-50 text-amber-700' },
  expense_deleted: { label: 'Expense', icon: Receipt, accent: 'bg-amber-50 text-amber-700' },
  document_uploaded: { label: 'Document', icon: FileText, accent: 'bg-indigo-50 text-indigo-700' },
  document_deleted: { label: 'Document', icon: FileText, accent: 'bg-indigo-50 text-indigo-700' },
  maintenance_created: { label: 'Maintenance', icon: Wrench, accent: 'bg-rose-50 text-rose-700' },
  maintenance_updated: { label: 'Maintenance', icon: Wrench, accent: 'bg-rose-50 text-rose-700' },
  maintenance_status_changed: {
    label: 'Maintenance',
    icon: Wrench,
    accent: 'bg-rose-50 text-rose-700',
  },
}

function getTypeMeta(activityType) {
  return (
    TYPE_META[activityType] ?? {
      label: 'Activity',
      icon: ActivityIcon,
      accent: 'bg-slate-100 text-slate-700',
    }
  )
}

export default function Activity() {
  const { activities, members, household } = useApp()

  const memberNameById = useMemo(
    () => Object.fromEntries(members.map((member) => [member.id, member.name])),
    [members]
  )

  return (
    <HouseholdGate title="Activity">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity</h1>
          <p className="text-slate-600 text-sm mt-1">
            Recent household events for {household?.name ?? 'this household'}, newest first.
          </p>
        </div>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <h2 className="font-semibold text-slate-900 px-5 py-4 border-b border-slate-100">
            Recent activity
          </h2>

          {activities.length === 0 ? (
            <p className="text-slate-500 text-sm px-5 py-10 text-center">
              No activity yet. Actions like adding expenses, documents, or maintenance requests will
              show up here.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activities.map((activity) => {
                const meta = getTypeMeta(activity.activity_type)
                const Icon = meta.icon
                const actor =
                  (activity.actor_member_id && memberNameById[activity.actor_member_id]) || null

                return (
                  <li key={activity.id} className="px-5 py-4 flex gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.accent}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {meta.label}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDateTime(activity.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-900 mt-0.5">{activity.description}</p>
                      {actor && (
                        <p className="text-xs text-slate-500 mt-1">Logged for {actor}</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </HouseholdGate>
  )
}