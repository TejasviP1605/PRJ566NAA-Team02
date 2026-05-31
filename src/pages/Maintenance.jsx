import { useState } from 'react'
import { Pencil, Plus, Trash2, Wrench, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import StatusBadge from '../components/StatusBadge'

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
]

function MaintenanceForm({ initialRequest, onSubmit, onCancel, submitLabel }) {
  const [title, setTitle] = useState(initialRequest?.title || '')
  const [description, setDescription] = useState(initialRequest?.description || '')
  const [date, setDate] = useState(initialRequest?.date || new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState(initialRequest?.status || 'submitted')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      description: description.trim() || 'No details provided.',
      date,
      status,
    })
    if (!initialRequest) {
      setTitle('')
      setDescription('')
      setDate(new Date().toISOString().slice(0, 10))
      setStatus('submitted')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <h2 className="font-semibold flex items-center gap-2">
        <Plus className="w-5 h-5 text-teal-700" />
        {initialRequest ? 'Edit Request' : 'New Request'}
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-600">Issue title</label>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Broken heater"
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
        <div className="sm:col-span-2">
          <label className="text-sm text-slate-600">Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Describe the problem..."
          />
        </div>
        {initialRequest && (
          <div>
            <label className="text-sm text-slate-600">Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
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

export default function Maintenance() {
  const { maintenance, hasHousehold, addMaintenance, updateMaintenance, deleteMaintenance } = useApp()
  const [editingId, setEditingId] = useState(null)

  if (!hasHousehold) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Create a household first</h1>
        <p className="text-slate-600 text-sm mt-1">
          Maintenance requests belong to a household. Go to Household and create one to begin.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="w-7 h-7 text-teal-700" />
          Maintenance Requests
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Submit issues and edit or delete requests as details change.
        </p>
      </div>

      <MaintenanceForm submitLabel="Submit Request" onSubmit={(request) => addMaintenance(request)} />

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">All Requests</h2>
        {maintenance.length === 0 ? (
          <p className="text-slate-500 text-sm">No requests yet.</p>
        ) : (
          maintenance.map((req) => {
            if (editingId === req.id) {
              return (
                <MaintenanceForm
                  key={req.id}
                  initialRequest={req}
                  submitLabel="Save Changes"
                  onCancel={() => setEditingId(null)}
                  onSubmit={(updates) => {
                    updateMaintenance(req.id, updates)
                    setEditingId(null)
                  }}
                />
              )
            }

            return (
              <article key={req.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{req.title}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {req.date} · {req.submittedBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={req.status} />
                    <button
                      type="button"
                      onClick={() => setEditingId(req.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-teal-800 hover:bg-teal-50 px-2 py-1 rounded-md"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => window.confirm('Delete this maintenance request?') && deleteMaintenance(req.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-2">{req.description}</p>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}
