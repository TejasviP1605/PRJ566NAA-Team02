import { useMemo, useState } from 'react'
import { DollarSign, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import StatCard from '../components/StatCard'
import { formatMoney } from '../utils/format'
import { computeHouseholdTotal, computeYouOwe, computeYourShare } from '../utils/splits'

function CreateHouseholdForm({ title, description, onSuccess }) {
  const { createHousehold, loading, dataError } = useApp()
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const result = await createHousehold({ name, unit, address, phone })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setName('')
    setUnit('')
    setAddress('')
    setPhone('')
    onSuccess?.()
  }

  return (
    <div className="space-y-4">
      {(title || description) && (
        <div>
          {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
          {description && <p className="text-slate-600 text-sm mt-1">{description}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        {dataError && (
          <p className="rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm px-3 py-2">
            {dataError}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {error}
          </p>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-600">Household name</label>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Maple House"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Unit / room</label>
            <input
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              placeholder="e.g. Unit 2B"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-slate-600">Address</label>
            <input
              required
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Street, city, state"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Your phone number</label>
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
          disabled={submitting || loading}
          className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg text-sm"
        >
          {loading ? 'Loading profile…' : submitting ? 'Creating…' : 'Create Household'}
        </button>
      </form>
    </div>
  )
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
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
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

export default function Dashboard() {
  const { members, expenses, hasHousehold, hasActiveHousehold, currentUser, currentMember } =
    useApp()

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

  if (!hasHousehold) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 text-sm mt-1">
            Hi {currentUser?.name}, create your first household to get started.
          </p>
        </div>
        <CreateHouseholdForm />
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

          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-3">Household Members</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {members.map((member) => (
                <li key={member.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-medium text-slate-900">{member.name}</p>
                  <p className="text-slate-500">
                    {member.email || 'No email'}
                    {member.phone ? ` · ${member.phone}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <section className="border-t border-slate-200 pt-6">
        <CreateHouseholdForm
          title="Create another household"
          description="You can belong to multiple households. Each one is managed separately."
        />
      </section>
    </div>
  )
}
