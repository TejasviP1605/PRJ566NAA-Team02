import { CheckCircle2, DollarSign, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import StatCard from '../components/StatCard'
import { formatMoney, getMemberShare, getSplitBreakdown } from '../utils/splits'

/** Leaseholder view: household overview and who still owes money */
export default function LeaseholderDashboard() {
  const { members, expenses } = useApp()

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  // Per-member: how much they owe vs have marked paid
  const paymentSummary = members.map((member) => {
    let owed = 0
    let paid = 0

    expenses.forEach((expense) => {
      const share = getMemberShare(expense, member.id, members)
      owed += share
      if (expense.paidBy?.includes(member.id)) paid += share
    })

    return { member, owed, paid, balance: owed - paid }
  })

  const unpaidTotal = paymentSummary.reduce((s, p) => s + p.balance, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leaseholder Dashboard</h1>
        <p className="text-slate-600 text-sm mt-1">
          Overview of household members, expenses, and payments.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          label="Total expenses"
          value={formatMoney(totalExpenses)}
          icon={DollarSign}
        />
        <StatCard
          label="Members"
          value={members.length}
          icon={Users}
          accent="slate"
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(unpaidTotal)}
          sub="Still owed across household"
          icon={CheckCircle2}
          accent="amber"
        />
      </div>

      {/* Household members */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <h2 className="font-semibold text-slate-900 px-5 py-4 border-b border-slate-100">
          Household Members
        </h2>
        <ul className="divide-y divide-slate-100">
          {members.map((m) => (
            <li
              key={m.id}
              className="px-5 py-3 flex items-center justify-between text-sm"
            >
              <div>
                <p className="font-medium text-slate-900">{m.name}</p>
                <p className="text-slate-500 capitalize">{m.role}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                Active
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Payment summary */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <h2 className="font-semibold text-slate-900 px-5 py-4 border-b border-slate-100">
          Payment Summary
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-5 py-2 font-medium">Member</th>
                <th className="text-right px-5 py-2 font-medium">Total share</th>
                <th className="text-right px-5 py-2 font-medium">Paid</th>
                <th className="text-right px-5 py-2 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paymentSummary.map(({ member, owed, paid, balance }) => (
                <tr key={member.id}>
                  <td className="px-5 py-3 font-medium">{member.name}</td>
                  <td className="px-5 py-3 text-right">{formatMoney(owed)}</td>
                  <td className="px-5 py-3 text-right text-emerald-700">
                    {formatMoney(paid)}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-medium ${
                      balance > 0 ? 'text-amber-700' : 'text-slate-500'
                    }`}
                  >
                    {formatMoney(balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* All expenses overview */}
      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">All Expenses</h2>
        {expenses.map((expense) => {
          const breakdown = getSplitBreakdown(expense, members)
          const paidCount = expense.paidBy?.length ?? 0

          return (
            <article
              key={expense.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-semibold">{expense.title}</h3>
                  <p className="text-xs text-slate-500">{expense.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-teal-800">
                    {formatMoney(expense.amount)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {paidCount}/{members.length} paid
                  </p>
                </div>
              </div>
              <ul className="mt-2 text-xs text-slate-600 grid sm:grid-cols-2 gap-1">
                {breakdown.map(({ member, share, isPaid }) => (
                  <li key={member.id} className="flex justify-between pr-4">
                    <span>
                      {member.name}
                      {isPaid ? ' ✓' : ''}
                    </span>
                    <span>{formatMoney(share)}</span>
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </section>
    </div>
  )
}
