import { useMemo, useState } from 'react'
import { Pencil, Plus, Receipt, Trash2 } from 'lucide-react'
import ExpenseForm from '../components/ExpenseForm'
import HouseholdGate from '../components/HouseholdGate'
import StatCard from '../components/StatCard'
import { useApp } from '../context/AppContext'
import { splitModeLabel } from '../utils/expenseSplits'
import { formatDate, formatMoney } from '../utils/format'
import {
  computeHouseholdTotal,
  computeYouOwe,
  computeYourShare,
  getMySplit,
} from '../utils/splits'

const CATEGORY_LABELS = {
  rent: 'Rent',
  utilities: 'Utilities',
  groceries: 'Groceries',
  maintenance: 'Maintenance',
  other: 'Other',
}

function PaidButton({ paid, amount, label, disabled, onClick }) {
  if (paid) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onClick(false)}
        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        Undo paid ({formatMoney(amount)})
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(true)}
      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50"
    >
      {label} ({formatMoney(amount)})
    </button>
  )
}

function ExpenseActions({
  expense,
  currentMember,
  memberCount,
  memberNameById,
  markingKey,
  onMarkMember,
}) {
  if (!currentMember) return null

  const mine = getMySplit(expense, currentMember.id, memberCount)
  const iPaidBill = expense.paid_by_member_id === currentMember.id
  const others = (expense.splits ?? []).filter((split) => split.member_id !== currentMember.id)

  return (
    <div>
      <h1>Expenses</h1>
      <p>Your expenses will appear here.</p>
    </div>
  )
}

export default function Expenses() {
  const {
    expenses,
    members,
    currentMember,
    expenseCategories,
    addExpense,
    updateExpense,
    markMySharePaid,
    markMemberSharePaid,
    deleteExpense,
  } = useApp()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [markingKey, setMarkingKey] = useState(null)
  const [markError, setMarkError] = useState('')

  const memberNameById = useMemo(
    () => Object.fromEntries(members.map((member) => [member.id, member.name])),
    [members]
  )

  const memberCount = members.length
  const memberId = currentMember?.id

  const youOwe = useMemo(
    () => computeYouOwe(expenses, memberId, memberCount),
    [expenses, memberId, memberCount]
  )

  const yourShare = useMemo(
    () => computeYourShare(expenses, memberId, memberCount),
    [expenses, memberId, memberCount]
  )

  const householdTotal = useMemo(() => computeHouseholdTotal(expenses), [expenses])

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return
    setDeletingId(expenseId)
    await deleteExpense(expenseId)
    setDeletingId(null)
    if (editingExpense?.id === expenseId) setEditingExpense(null)
  }

  const handleMarkMember = async (expenseId, targetMemberId, paid) => {
    setMarkingKey(`${expenseId}-${targetMemberId}`)
    setMarkError('')
    const result =
      targetMemberId === currentMember?.id
        ? await markMySharePaid(expenseId, paid)
        : await markMemberSharePaid(expenseId, targetMemberId, paid)
    setMarkingKey(null)
    if (!result.ok) {
      setMarkError(result.message || 'Could not update. Run paid columns in schema.sql.')
    }
  }

  return (
    <HouseholdGate title="Expenses">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-slate-600 text-sm mt-1">
            Track household costs and mark shares paid when you settle up.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard
            label="You owe"
            value={formatMoney(youOwe)}
            sub="After shares you marked paid"
            icon={Receipt}
            accent="amber"
          />
          <StatCard
            label="Your share"
            value={formatMoney(yourShare)}
            sub="Your part of all expenses"
            icon={Receipt}
          />
          <StatCard
            label="Household total"
            value={formatMoney(householdTotal)}
            sub={`${expenses.length} expense${expenses.length === 1 ? '' : 's'}`}
            icon={Receipt}
          />
        </div>

        {markError && (
          <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {markError}
          </p>
        )}

        {editingExpense ? (
          <ExpenseForm
            key={`edit-${editingExpense.id}`}
            title="Edit expense"
            submitLabel="Save changes"
            members={members}
            currentMember={currentMember}
            expenseCategories={expenseCategories}
            initialExpense={editingExpense}
            onSubmit={(payload) => updateExpense(editingExpense.id, payload)}
            onCancel={() => setEditingExpense(null)}
          />
        ) : showAddForm ? (
          <ExpenseForm
            key="add-expense"
            title="Add expense"
            submitLabel="Add expense"
            members={members}
            currentMember={currentMember}
            expenseCategories={expenseCategories}
            onSubmit={async (payload) => {
              const result = await addExpense(payload)
              if (result.ok) setShowAddForm(false)
              return result
            }}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-medium px-4 py-2 rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            Add expense
          </button>
        )}

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <h2 className="font-semibold text-slate-900 px-5 py-4 border-b border-slate-100">
            Recent expenses
          </h2>
          {expenses.length === 0 ? (
            <p className="text-slate-500 text-sm px-5 py-8 text-center">No expenses yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {expenses.map((expense) => {
                const mine = currentMember
                  ? getMySplit(expense, currentMember.id, memberCount)
                  : null

                return (
                  <li key={expense.id} className="px-5 py-4 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">{expense.description}</p>
                        <p className="text-slate-500 mt-0.5">
                          {formatDate(expense.expense_date)} ·{' '}
                          {CATEGORY_LABELS[expense.category] ?? expense.category} · Paid by{' '}
                          {memberNameById[expense.paid_by_member_id] ?? 'Unknown'} ·{' '}
                          {splitModeLabel(expense.split_mode)}
                          {mine && (
                            <>
                              {' '}
                              · Your share {formatMoney(mine.amount)}
                              {mine.paid ? ' (paid)' : ' (unpaid)'}
                            </>
                          )}
                        </p>
                        <ExpenseActions
                          expense={expense}
                          currentMember={currentMember}
                          memberCount={memberCount}
                          memberNameById={memberNameById}
                          markingKey={markingKey}
                          onMarkMember={handleMarkMember}
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-slate-900">
                          {formatMoney(expense.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddForm(false)
                            setEditingExpense(expense)
                          }}
                          className="p-1.5 text-slate-400 hover:text-teal-800 rounded-lg hover:bg-teal-50"
                          aria-label="Edit expense"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(expense.id)}
                          disabled={deletingId === expense.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          aria-label="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
