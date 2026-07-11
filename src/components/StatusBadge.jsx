const STYLES = {
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-800 border-amber-200',
  resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
}

const LABELS = {
  submitted: 'Submitted',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        STYLES[status] || STYLES.submitted
      }`}
    >
      {LABELS[status] || status}
    </span>
  )
}
