import { useState } from 'react'
import { Download, FileText, Plus, Trash2, Upload } from 'lucide-react'
import HouseholdGate from '../components/HouseholdGate'
import { useApp } from '../context/AppContext'
import { formatDate } from '../utils/format'

const CATEGORY_LABELS = {
  lease: 'Lease',
  bill: 'Bill',
  receipt: 'Receipt',
  insurance: 'Insurance',
  other: 'Other',
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function UploadDocumentForm() {
  const { documentCategories, uploadDocument } = useApp()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('other')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const result = await uploadDocument({ title, category, file })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setTitle('')
    setCategory('other')
    setFile(null)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <h2 className="font-semibold text-slate-900 flex items-center gap-2">
        <Upload className="w-5 h-5 text-teal-700" />
        Upload document
      </h2>
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-sm text-slate-600">Title</label>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Lease agreement 2026"
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
            {documentCategories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600">File (max 10 MB)</label>
          <input
            type="file"
            required
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:font-medium"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        {submitting ? 'Uploading…' : 'Upload'}
      </button>
    </form>
  )
}

export default function Documents() {
  const { documents, deleteDocument, getDocumentDownloadUrl } = useApp()
  const [deletingId, setDeletingId] = useState(null)
  const [openingId, setOpeningId] = useState(null)
  const [actionError, setActionError] = useState('')

  const handleDownload = async (doc) => {
    setOpeningId(doc.id)
    setActionError('')
    try {
      const url = await getDocumentDownloadUrl(doc.file_path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setActionError(err.message || 'Could not open file.')
    } finally {
      setOpeningId(null)
    }
  }

  const handleDelete = async (documentId) => {
    if (!window.confirm('Delete this document?')) return
    setDeletingId(documentId)
    setActionError('')
    const result = await deleteDocument(documentId)
    setDeletingId(null)
    if (!result.ok) setActionError(result.message)
  }

  return (
    <HouseholdGate title="Documents">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-600 text-sm mt-1">
            Store leases, bills, and receipts for your household in Supabase Storage.
          </p>
        </div>

        <UploadDocumentForm />

        {actionError && (
          <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {actionError}
          </p>
        )}

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <h2 className="font-semibold text-slate-900 px-5 py-4 border-b border-slate-100">
            Household files
          </h2>
          {documents.length === 0 ? (
            <p className="text-slate-500 text-sm px-5 py-8 text-center">No documents uploaded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-start justify-between gap-4 px-5 py-4 text-sm"
                >
                  <div className="flex gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-700 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{doc.title}</p>
                      <p className="text-slate-500 mt-0.5 truncate">
                        {doc.file_name} · {formatFileSize(doc.file_size)} ·{' '}
                        {CATEGORY_LABELS[doc.category] ?? doc.category}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">{formatDate(doc.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      disabled={openingId === doc.id}
                      className="p-2 text-slate-500 hover:text-teal-800 hover:bg-teal-50 rounded-lg"
                      aria-label="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </HouseholdGate>
  )
}