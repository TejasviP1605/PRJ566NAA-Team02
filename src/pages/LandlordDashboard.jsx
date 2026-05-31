import { Building, ClipboardList, DollarSign } from 'lucide-react'
import { useApp } from '../context/AppContext'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { formatMoney } from '../utils/splits'

/** Landlord view: property snapshot and open maintenance items */
export default function LandlordDashboard() {
  const { expenses, maintenance, members } = useApp()

  const openRequests = maintenance.filter((r) => r.status !== 'resolved')
  const monthlyTotal = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Landlord Dashboard</h1>
        <p className="text-slate-600 text-sm mt-1">
          Property overview for Sunset Apartments, Unit 4B.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Unit" value="4B" sub="Sunset Apartments" icon={Building} />
        <StatCard
          label="Household spend"
          value={formatMoney(monthlyTotal)}
          sub="Tracked shared expenses"
          icon={DollarSign}
        />
        <StatCard
          label="Open requests"
          value={openRequests.length}
          sub="Maintenance needs attention"
          icon={ClipboardList}
          accent="amber"
        />
      </div>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-900 mb-3">Tenants on lease</h2>
        <ul className="space-y-2 text-sm">
          {members.map((m) => (
            <li key={m.id} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
              <span>{m.name}</span>
              <span className="text-slate-500 capitalize">{m.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Recent maintenance</h2>
        {maintenance.slice(0, 4).map((req) => (
          <div
            key={req.id}
            className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap justify-between gap-2"
          >
            <div>
              <p className="font-medium">{req.title}</p>
              <p className="text-xs text-slate-500">{req.date}</p>
            </div>
            <StatusBadge status={req.status} />
          </div>
        ))}
      </section>
    </div>
  )
}
