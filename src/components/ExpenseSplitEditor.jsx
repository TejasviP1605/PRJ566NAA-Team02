import { SPLIT_MODES } from '../utils/expenseSplits'
import { formatMoney } from '../utils/format'

export default function ExpenseSplitEditor({
  members,
  splitMode,
  splits,
  onModeChange,
  percentInputs,
  onPercentChange,
  amountInputs,
  onAmountChange,
  pctSum,
  amtSum,
  total,
}) {
  if (!members.length) {
    return <p className="text-sm text-slate-500">Add household members to configure splits.</p>
  }

  if (total <= 0) {
    return <p className="text-sm text-slate-500">Enter an expense amount to configure splits.</p>
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div>
        <p className="text-sm font-medium text-slate-700">Split between members</p>
        <div className="flex flex-wrap gap-2 mt-2" role="group" aria-label="Split type">
          {SPLIT_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => onModeChange(mode.value)}
              aria-pressed={splitMode === mode.value}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 ${
                splitMode === mode.value
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-teal-600'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {splitMode === 'equal' && (
        <ul className="space-y-1 text-sm text-slate-600">
          {splits.map((row) => {
            const member = members.find((m) => m.id === row.memberId)
            return (
              <li key={row.memberId} className="flex justify-between">
                <span>{member?.name}</span>
                <span className="font-medium text-slate-900">{formatMoney(row.amount)}</span>
              </li>
            )
          })}
        </ul>
      )}

      {splitMode === 'percentage' && (
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 text-sm">
              <span className="flex-1 text-slate-700 truncate">{member.name}</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={percentInputs[member.id] ?? ''}
                onChange={(event) => onPercentChange(member.id, event.target.value)}
                className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right bg-white"
              />
              <span className="text-slate-500 w-4">%</span>
              <span className="w-20 text-right font-medium text-slate-900">
                {formatMoney(splits.find((row) => row.memberId === member.id)?.amount ?? 0)}
              </span>
            </div>
          ))}
          <p
            className={`text-xs ${Math.abs(pctSum - 100) > 0.05 ? 'text-amber-700' : 'text-slate-500'}`}
          >
            Total: {pctSum.toFixed(1)}% (must equal 100%)
          </p>
        </div>
      )}

      {splitMode === 'amount' && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Enter how much each member owes for this expense.</p>
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 text-sm">
              <span className="flex-1 text-slate-700 truncate">{member.name}</span>
              <span className="text-slate-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountInputs[member.id] ?? ''}
                onChange={(event) => onAmountChange(member.id, event.target.value)}
                className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-right bg-white"
              />
            </div>
          ))}
          <p
            className={`text-xs ${Math.abs(amtSum - total) > 0.02 ? 'text-amber-700' : 'text-slate-500'}`}
          >
            Total: {formatMoney(amtSum)} / {formatMoney(total)}
          </p>
        </div>
      )}
    </div>
  )
}
