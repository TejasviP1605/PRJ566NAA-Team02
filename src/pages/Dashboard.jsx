import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import StatCard from '../components/StatCard'
import { formatMoney } from '../utils/format'
import { computeHouseholdTotal, computeYouOwe, computeYourShare } from '../utils/splits'

function memberInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-teal-700',
  'bg-sky-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-emerald-600',
]

function avatarColor(id = '') {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i) * (i + 1)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}

function roleLabel(role) {
  if (role === 'leaseholder') return 'Admin'
  return 'Member'
}

function AddMemberPanel() {
  const { addMember } = useApp()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    const result = await addMember({ name, email, phone })
    setSubmitting(false)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    setMessage('Member added to the household.')
    setName('')
    setEmail('')
    setPhone('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4"
    >
      <h2 className="font-semibold text-slate-900 flex items-center gap-2">
        <Plus className="w-5 h-5 text-teal-700" />
        Add Household Member
      </h2>
      {message && (
        <p className="rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-sm px-3 py-2">
          {message}
        </p>
      )}
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-slate-600">Name</label>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full name"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Optional"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Phone number</label>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Optional"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg text-sm"
      >
        {submitting ? 'Adding…' : 'Add Member'}
      </button>
    </form>
  )
}

function MemberActionsMenu({ member, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        aria-label={`Actions for ${member.name}`}
        aria-expanded={open}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 rounded-lg border border-slate-200 bg-white shadow-lg py-1 z-20">
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setOpen(false)
              onEdit(member)
            }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
            onClick={() => {
              setOpen(false)
              onDelete(member)
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

function EditMemberModal({ member, onClose }) {
  const { updateMember } = useApp()
  const [name, setName] = useState(member.name ?? '')
  const [email, setEmail] = useState(member.email ?? '')
  const [phone, setPhone] = useState(member.phone ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const result = await updateMember(member.id, { name, email, phone })
    setSaving(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-member-title"
        className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl p-5 space-y-4"
      >
        <h3 id="edit-member-title" className="text-lg font-semibold text-slate-900">
          Edit member
        </h3>
        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-600">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg text-sm"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const {
    members,
    expenses,
    hasHousehold,
    hasActiveHousehold,
    currentUser,
    currentMember,
    deleteMember,
  } = useApp()

  const [editingMember, setEditingMember] = useState(null)
  const [actionError, setActionError] = useState('')

  const memberCount = members.length

  const youOwe = useMemo(
    () => computeYouOwe(expenses, currentMember?.id, memberCount),
    [expenses, currentMember?.id, memberCount]
  )

  const yourShare = useMemo(
    () => computeYourShare(expenses, currentMember?.id, memberCount),
    [expenses, currentMember?.id, memberCount]
  )

  const householdTotal = useMemo(() => computeHouseholdTotal(expenses), [expenses])

  const handleDelete = async (member) => {
    setActionError('')
    const ok = window.confirm(
      `Remove “${member.name}” from this household? Their expense splits will also be removed.`
    )
    if (!ok) return
    const result = await deleteMember(member.id)
    if (!result.ok) setActionError(result.message)
  }

  if (!hasHousehold) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 text-sm mt-1">
            Hi {currentUser?.name}, create a household from your Profile to get started.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <p className="text-slate-600 text-sm mb-4">
            Household creation and address details live on your Profile page.
          </p>
          <Link
            to="/profile"
            className="inline-flex bg-teal-700 hover:bg-teal-800 text-white font-medium px-4 py-2 rounded-lg text-sm"
          >
            Go to Profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 text-sm mt-1">
          Manage your household, members, and shared details.
        </p>
      </div>

      {hasActiveHousehold && (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard
              label="You owe"
              value={formatMoney(youOwe)}
              sub="After shares you marked paid"
              icon={DollarSign}
              accent="amber"
            />
            <StatCard
              label="Your share"
              value={formatMoney(yourShare)}
              sub="Your part of all expenses"
              icon={DollarSign}
            />
            <StatCard
              label="Household total"
              value={formatMoney(householdTotal)}
              sub={`${expenses.length} expense${expenses.length === 1 ? '' : 's'}`}
              icon={DollarSign}
            />
          </div>

          <AddMemberPanel />

          {actionError && (
            <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
              {actionError}
            </p>
          )}

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <h2 className="font-semibold text-slate-900 px-5 py-4 border-b border-slate-100">
              Household Members
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium hidden sm:table-cell">Email</th>
                    <th className="px-5 py-3 font-medium hidden md:table-cell">Phone</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-9 h-9 rounded-full text-white text-sm font-semibold flex items-center justify-center shrink-0 ${avatarColor(member.id)}`}
                            aria-hidden
                          >
                            {memberInitials(member.name)}
                          </span>
                          <span className="font-medium text-slate-900 truncate">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 hidden sm:table-cell">
                        {member.email || '—'}
                      </td>
                      <td className="px-5 py-3 text-slate-600 hidden md:table-cell">
                        {member.phone || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            member.role === 'leaseholder'
                              ? 'bg-teal-50 text-teal-800'
                              : 'bg-sky-50 text-sky-800'
                          }`}
                        >
                          {roleLabel(member.role)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <MemberActionsMenu
                          member={member}
                          onEdit={setEditingMember}
                          onDelete={handleDelete}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {editingMember && (
        <EditMemberModal member={editingMember} onClose={() => setEditingMember(null)} />
      )}
    </div>
  )
}
