import { useMemo, useState } from 'react'
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
  household_updated: { label: 'Household', icon: Home, accent: 'bg-teal-50 text-teal-700' },
  profile_updated: { label: 'Household', icon: UserPlus, accent: 'bg-slate-50 text-slate-700' },
  member_added: { label: 'Member', icon: UserPlus, accent: 'bg-sky-50 text-sky-700' },
  member_updated: { label: 'Member', icon: UserPlus, accent: 'bg-sky-50 text-sky-700' },
  member_removed: { label: 'Member', icon: UserPlus, accent: 'bg-sky-50 text-sky-700' },
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

const CATEGORY_MAP = {
  Household: ['household_created', 'household_updated', 'profile_updated'],
  Member: ['member_added', 'member_updated', 'member_removed'],
  Expense: ['expense_added', 'expense_updated', 'expense_deleted'],
  Document: ['document_uploaded', 'document_deleted'],
  Maintenance: ['maintenance_created', 'maintenance_updated', 'maintenance_status_changed'],
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
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const memberNameById = useMemo(
    () => Object.fromEntries(members.map((member) => [member.id, member.name])),
    [members]
  )

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (categoryFilter !== 'all') {
        const allowed = CATEGORY_MAP[categoryFilter]
        if (!allowed || !allowed.includes(activity.activity_type)) return false
      }
      if (fromDate) {
        const from = new Date(fromDate)
        from.setHours(0, 0, 0, 0)
        if (new Date(activity.created_at) < from) return false
      }
      if (toDate) {
        const to = new Date(toDate)
        to.setHours(23, 59, 59, 999)
        if (new Date(activity.created_at) > to) return false
      }
      return true
    })
  }, [activities, categoryFilter, fromDate, toDate])

  const clearFilters = () => {
    setCategoryFilter('all')
    setFromDate('')
    setToDate('')
  }

  const hasActiveFilters = categoryFilter !== 'all' || fromDate || toDate

  return (
    <HouseholdGate title="Activity">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity</h1>
          <p className="text-slate-600 text-sm mt-1">
            Recent household events for {household?.name ?? 'this household'}, newest first.
          </p>
        </div>

        {activities.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="activity-category" className="text-xs font-medium text-slate-600">
                  Category
                </label>
                <select
                  id="activity-category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="all">All types</option>
                  <option value="Household">Household</option>
                  <option value="Member">Member</option>
                  <option value="Expense">Expense</option>
                  <option value="Document">Document</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label htmlFor="activity-from" className="text-xs font-medium text-slate-600">
                  From
                </label>
                <input
                  id="activity-from"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="activity-to" className="text-xs font-medium text-slate-600">
                  To
                </label>
                <input
                  id="activity-to"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing {filteredActivities.length} of {activities.length} activities
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-teal-700 hover:text-teal-800 underline-offset-2 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <h2 className="font-semibold text-slate-900 px-5 py-4 border-b border-slate-100">
            Recent activity
          </h2>

          {activities.length === 0 ? (
            <p className="text-slate-500 text-sm px-5 py-10 text-center">
              No activity yet. Actions like adding expenses, documents, or maintenance requests will
              show up here.
            </p>
          ) : filteredActivities.length === 0 ? (
            <p className="text-slate-500 text-sm px-5 py-10 text-center">
              No activities match your filters.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredActivities.map((activity) => {
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
