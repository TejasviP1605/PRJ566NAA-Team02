import { useEffect, useState } from 'react'
import ExpenseSplitEditor from './ExpenseSplitEditor'
import { useExpenseSplitState } from '../hooks/useExpenseSplitState'
import { validateSplitPayload } from '../utils/expenseSplits'

export default function ExpenseForm({
  title,
  submitLabel,
  members,
  currentMember,
  expenseCategories,
  initialExpense,
  onSubmit,
  onCancel,
}) {
  const [description, setDescription] = useState(initialExpense?.description ?? '')
  const [amount, setAmount] = useState(initialExpense?.amount?.toString() ?? '')
  const [category, setCategory] = useState(initialExpense?.category ?? 'other')
  const [expenseDate, setExpenseDate] = useState(
    initialExpense?.expense_date ?? new Date().toISOString().slice(0, 10)
  )
  const [paidByMemberId, setPaidByMemberId] = useState(initialExpense?.paid_by_member_id ?? '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const parsedAmount = Number(amount) || 0
  const splitState = useExpenseSplitState(members, parsedAmount, initialExpense)

  useEffect(() => {
    if (initialExpense?.paid_by_member_id) {
      setPaidByMemberId(initialExpense.paid_by_member_id)
      return
    }
    const otherMember = members.find((member) => member.id !== currentMember?.id)
    const defaultId = otherMember?.id ?? currentMember?.id ?? members[0]?.id
    if (defaultId) setPaidByMemberId(defaultId)
  }, [members, currentMember, initialExpense])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const validation = validateSplitPayload(
      parsedAmount,
      splitState.splitMode,
      splitState.splits,
      members
    )
    if (validation) {
      setError(validation)
      setSubmitting(false)
      return
    }

    const result = await onSubmit({
      description,
      amount: parsedAmount,
      category,
      expenseDate,
      paidByMemberId,
      splitMode: splitState.splitMode,
      splits: splitState.splits,
    })

    setSubmitting(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    onCancel?.()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Cancel
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-sm text-slate-600">Description</label>
          <input
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="e.g. Hydro bill"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Amount ($)</label>
          <input
            type="number"
            required
            min="0.01"
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
            required
            value={expenseDate}
            onChange={(event) => setExpenseDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Category</label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {expenseCategories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600">Paid by</label>
          <select
            required
            value={paidByMemberId}
            onChange={(event) => setPaidByMemberId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ExpenseSplitEditor
        members={members}
        splitMode={splitState.splitMode}
        splits={splitState.splits}
        onModeChange={splitState.setMode}
        percentInputs={splitState.percentInputs}
        onPercentChange={splitState.updatePercent}
        amountInputs={splitState.amountInputs}
        onAmountChange={splitState.updateAmount}
        pctSum={splitState.pctSum}
        amtSum={splitState.amtSum}
        total={splitState.total}
      />

      <button
        type="submit"
        disabled={submitting || members.length === 0}
        className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg text-sm"
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}

