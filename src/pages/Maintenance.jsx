import { useMemo, useState } from 'react'
import { Pencil, Plus, Wrench, X } from 'lucide-react'
import HouseholdGate from '../components/HouseholdGate'
import StatusBadge from '../components/StatusBadge'
import { useApp } from '../context/AppContext'
import { formatDate, formatDateTime } from '../utils/format'

function MaintenanceForm({
  title,
  submitLabel,
  initialRequest,
  categories,
  priorities,
  onSubmit,
  onCancel,
}) {
  const [requestTitle, setRequestTitle] = useState(initialRequest?.title ?? '')
  const [description, setDescription] = useState(initialRequest?.description ?? '')
  const [category, setCategory] = useState(initialRequest?.category ?? 'other')
  const [priority, setPriority] = useState(initialRequest?.priority ?? 'medium')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const result = await onSubmit({
      title: requestTitle,
      description,
      category,
      priority,
    })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4"
    >
      <h2 className="font-semibold text-slate-900 flex items-center gap-2">
        <Wrench className="w-5 h-5 text-teal-700" />
        {title}
      </h2>
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </p>
      )}
      <div>
        <label className="text-sm text-slate-600">Title</label>
        <input
          required
          value={requestTitle}
          onChange={(event) => setRequestTitle(event.target.value)}
          placeholder="e.g. Leaking kitchen faucet"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm text-slate-600">Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="Describe the issue and where it is"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-600">Category</label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600">Priority</label>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {priorities.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg text-sm"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium px-4 py-2 rounded-lg text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default function Maintenance() {
  const {
    maintenanceRequests,
    members,
    currentUser,
    maintenanceCategories,
    maintenancePriorities,
    maintenanceStatuses,
    addMaintenanceRequest,
    updateMaintenanceRequest,
    updateMaintenanceStatus,
    cancelMaintenanceRequest,
  } = useApp()

  const [showForm, setShowForm] = useState(false)
  const [editingRequest, setEditingRequest] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const memberNameById = useMemo(
    () => Object.fromEntries(members.map((member) => [member.id, member.name])),
    [members]
  )

  const categoryLabel = (value) =>
    maintenanceCategories.find((item) => item.value === value)?.label ?? value
  const priorityLabel = (value) =>
    maintenancePriorities.find((item) => item.value === value)?.label ?? value

  const selected = maintenanceRequests.find((row) => row.id === selectedId) ?? null

  const handleCreate = async (payload) => {
    const result = await addMaintenanceRequest(payload)
    if (result.ok) setShowForm(false)
    return result
  }

  const handleUpdate = async (payload) => {
    if (!editingRequest) return { ok: false, message: 'No request selected.' }
    const result = await updateMaintenanceRequest(editingRequest.id, payload)
    if (result.ok) setEditingRequest(null)
    return result
  }

  const handleStatus = async (requestId, status) => {
    setBusyId(requestId)
    setActionError('')
    const result = await updateMaintenanceStatus(requestId, status)
    setBusyId(null)
    if (!result.ok) setActionError(result.message)
  }

  const handleCancel = async (requestId) => {
    if (!window.confirm('Cancel this maintenance request?')) return
    setBusyId(requestId)
    setActionError('')
    const result = await cancelMaintenanceRequest(requestId)
    setBusyId(null)
    if (!result.ok) setActionError(result.message)
  }

  return (
    <HouseholdGate title="Maintenance">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance</h1>
          <p className="text-slate-600 text-sm mt-1">
            Submit requests, track status, and edit or cancel before work is assigned.
          </p>
        </div>

        {actionError && (
          <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {actionError}
          </p>
        )}

        {editingRequest ? (
          <MaintenanceForm
            key={`edit-${editingRequest.id}`}
            title="Edit request"
            submitLabel="Save changes"
            initialRequest={editingRequest}
            categories={maintenanceCategories}
            priorities={maintenancePriorities}
            onSubmit={handleUpdate}
            onCancel={() => setEditingRequest(null)}
          />
        ) : showForm ? (
          <MaintenanceForm
            key="create-request"
            title="New maintenance request"
            submitLabel="Submit request"
            categories={maintenanceCategories}
            priorities={maintenancePriorities}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditingRequest(null)
              setShowForm(true)
            }}
            className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-medium px-4 py-2 rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            New request
          </button>
        )}

        <div className="grid lg:grid-cols-5 gap-4">
          <section className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <h2 className="font-semibold text-slate-900 px-5 py-4 border-b border-slate-100">
              All requests
            </h2>
            {maintenanceRequests.length === 0 ? (
              <p className="text-slate-500 text-sm px-5 py-10 text-center">
                No maintenance requests yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {maintenanceRequests.map((request) => (
                  <li key={request.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(request.id)}
                      className={`w-full text-left px-5 py-4 hover:bg-slate-50 ${
                        selectedId === request.id ? 'bg-teal-50/60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{request.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {categoryLabel(request.category)} · {priorityLabel(request.priority)} ·{' '}
                            {formatDate(request.created_at)}
                          </p>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Request details</h2>
            {!selected ? (
              <p className="text-sm text-slate-500">Select a request to view details.</p>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900 text-base">{selected.title}</p>
                    <p className="text-slate-500 mt-1">{formatDateTime(selected.created_at)}</p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Description</p>
                  <p className="text-slate-800 mt-1 whitespace-pre-wrap">
                    {selected.description?.trim() || 'No description provided.'}
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Category</dt>
                    <dd className="mt-0.5 text-slate-800">{categoryLabel(selected.category)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Priority</dt>
                    <dd className="mt-0.5 text-slate-800">{priorityLabel(selected.priority)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Submitted by</dt>
                    <dd className="mt-0.5 text-slate-800">
                      {memberNameById[selected.submitted_by_member_id] ??
                        (selected.submitted_by === currentUser?.id
                          ? currentUser?.name
                          : 'Household member')}
                    </dd>
                  </div>
                </dl>

                {selected.status === 'submitted' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        setEditingRequest(selected)
                      }}
                      className="inline-flex items-center gap-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium px-3 py-1.5 rounded-lg text-xs"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busyId === selected.id}
                      onClick={() => handleCancel(selected.id)}
                      className="inline-flex items-center gap-1.5 border border-red-200 text-red-700 hover:bg-red-50 font-medium px-3 py-1.5 rounded-lg text-xs disabled:opacity-60"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel request
                    </button>
                  </div>
                )}

                {selected.status !== 'cancelled' && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                      Update status
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {maintenanceStatuses
                        .filter((item) => item.value !== 'cancelled')
                        .map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            disabled={busyId === selected.id || selected.status === item.value}
                            onClick={() => handleStatus(selected.id, item.value)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border disabled:opacity-50 ${
                              selected.status === item.value
                                ? 'bg-teal-700 text-white border-teal-700'
                                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </HouseholdGate>
  )
}
