
import { useMemo, useState } from 'react'
import { CheckCircle2, DollarSign, Pencil, Plus, Trash2, Users, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import StatCard from '../components/StatCard'
import { formatMoney, getExpenseParticipants, getMemberShare, getSplitBreakdown } from '../utils/splits'

function ExpenseForm({ members, initialExpense, onSubmit, onCancel, submitLabel }) {
  const allMemberIds = members.map((member) => member.id)
  const [title, setTitle] = useState(initialExpense?.title || '')
  const [amount, setAmount] = useState(initialExpense?.amount?.toString() || '')
  const [date, setDate] = useState(initialExpense?.date || new Date().toISOString().slice(0, 10))
  const [splitType, setSplitType] = useState(initialExpense?.splitType || 'equal')
  const [participants, setParticipants] = useState(initialExpense?.participants?.length ? initialExpense.participants : allMemberIds)
  const [percentages, setPercentages] = useState(initialExpense?.percentages || {})

  const toggleParticipant = (memberId) => {
    setParticipants((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    )
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const selectedParticipants = participants.length ? participants : allMemberIds
    const amountNumber = parseFloat(amount)
    if (!title.trim() || Number.isNaN(amountNumber)) return

    const pctMap =
      splitType === 'percentage'
        ? selectedParticipants.reduce((acc, memberId) => {
            acc[memberId] = percentages[memberId] ?? Math.floor(100 / selectedParticipants.length)
            return acc
          }, {})
        : {}

    onSubmit({
      title: title.trim(),
      amount: amountNumber,
      date,
      splitType,
      participants: selectedParticipants,
      percentages: pctMap,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <h2 className="font-semibold text-slate-900 flex items-center gap-2">
        <Plus className="w-5 h-5 text-teal-700" />
        {initialExpense ? 'Edit Expense' : 'Add Expense'}
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-600">Title</label>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Water bill"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Amount ($)</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Date</label>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Split type</label>
          <select
            value={splitType}
            onChange={(event) => setSplitType(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="equal">Equal</option>
            <option value="percentage">Percentage</option>
          </select>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <p className="text-sm font-medium text-slate-700 mb-2">Members included</p>
        <div className="grid sm:grid-cols-3 gap-2">
          {members.map((member) => (
            <label key={member.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={participants.includes(member.id)}
                onChange={() => toggleParticipant(member.id)}
                className="accent-teal-700"
              />
              {member.name}
            </label>
          ))}
        </div>
      </div>

      {splitType === 'percentage' && (
        <div className="grid sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <p className="sm:col-span-3 text-xs text-slate-500">
            Enter each included member&apos;s share percentage.
          </p>
          {members
            .filter((member) => participants.includes(member.id))
            .map((member) => (
              <div key={member.id}>
                <label className="text-xs text-slate-600">{member.name} %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={percentages[member.id] ?? ''}
                  onChange={(event) =>
                    setPercentages((current) => ({
                      ...current,
                      [member.id]: Number(event.target.value) || 0,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="bg-teal-700 hover:bg-teal-800 text-white font-medium px-4 py-2 rounded-lg text-sm">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm">
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default function Expenses() {
  const {
    members,
    expenses,
    currentMember,
    hasHousehold,
    addExpense,
    updateExpense,
    deleteExpense,
    markExpensePaid,
  } = useApp()
  const [editingId, setEditingId] = useState(null)

  const myOwed = useMemo(
    () =>
      expenses.reduce((sum, expense) => {
        const share = getMemberShare(expense, currentMember?.id, members)
        const paid = expense.paidBy?.includes(currentMember?.id)
        return paid ? sum : sum + share
      }, 0),
    [expenses, currentMember, members]
  )

  if (!hasHousehold) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Create a household first</h1>
        <p className="text-slate-600 text-sm mt-1">
          Expenses belong to a household. Go to Household and create one to begin.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
        <p className="text-slate-600 text-sm mt-1">
          Add shared expenses, split costs, and track who has paid.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard
          label="You owe"
          value={formatMoney(myOwed)}
          sub="Unpaid share total"
          icon={DollarSign}
        />
        <StatCard
          label="Members"
          value={members.length}
          sub="People splitting costs"
          icon={Users}
          accent="slate"
        />
      </div>

      <ExpenseForm
        members={members}
        submitLabel="Add Expense"
        onSubmit={(expense) => addExpense(expense)}
      />

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">All Expenses</h2>
        {expenses.length === 0 ? (
          <p className="text-slate-500 text-sm">No expenses yet.</p>
        ) : (
          expenses.map((expense) => {
            const breakdown = getSplitBreakdown(expense, members)
            const myShare = getMemberShare(expense, currentMember?.id, members)
            const iPaid = expense.paidBy?.includes(currentMember?.id)
            const included = getExpenseParticipants(expense, members)
            const isEditing = editingId === expense.id

            if (isEditing) {
              return (
                <ExpenseForm
                  key={expense.id}
                  members={members}
                  initialExpense={expense}
                  submitLabel="Save Changes"
                  onCancel={() => setEditingId(null)}
                  onSubmit={(updates) => {
                    updateExpense(expense.id, updates)
                    setEditingId(null)
                  }}
                />
              )
            }

            return (
              <article key={expense.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{expense.title}</h3>
                    <p className="text-sm text-slate-500">
                      {expense.date} · {expense.splitType === 'equal' ? 'Equal split' : 'Custom %'} · {included.length} members
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-teal-800">{formatMoney(expense.amount)}</p>
                    <div className="flex justify-end gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(expense.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-teal-800 hover:bg-teal-50 px-2 py-1 rounded-md"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => window.confirm('Delete this expense?') && deleteExpense(expense.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <ul className="mt-3 text-sm space-y-1">
                  {breakdown.map(({ member, share, isPaid }) => (
                    <li key={member.id} className="flex justify-between text-slate-600">
                      <span>
                        {member.name}
                        {isPaid && <span className="ml-2 text-emerald-600 text-xs">Paid</span>}
                      </span>
                      <span>{formatMoney(share)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm">
                    Your share: <strong>{formatMoney(myShare)}</strong>
                  </p>
                  {myShare > 0 && !iPaid && (
                    <button
                      type="button"
                      onClick={() => markExpensePaid(expense.id, currentMember.id)}
                      className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark as Paid
                    </button>
                  )}
                  {iPaid && (
                    <span className="text-emerald-700 text-sm font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> You paid
                    </span>
                  )}
                </div>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}
