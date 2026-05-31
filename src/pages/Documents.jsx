import { useRef, useState } from 'react'
import { Download, FileText, Pencil, Trash2, Upload, X } from 'lucide-react'
import { useApp } from '../context/AppContext'

const CATEGORIES = ['Lease', 'Receipt', 'Insurance', 'Checklist', 'Other']

function DocumentEditForm({ doc, onSubmit, onCancel }) {
  const [name, setName] = useState(doc.name)
  const [category, setCategory] = useState(doc.category)
  const [uploadDate, setUploadDate] = useState(doc.uploadDate)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), category, uploadDate })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-slate-600">Document name</label>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
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
            {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600">Date</label>
          <input
            type="date"
            value={uploadDate}
            onChange={(event) => setUploadDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="bg-teal-700 hover:bg-teal-800 text-white font-medium px-4 py-2 rounded-lg text-sm">
          Save Changes
        </button>
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm">
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function Documents() {
  const { documents, hasHousehold, addDocument, updateDocument, deleteDocument } = useApp()
  const fileInputRef = useRef(null)
  const [category, setCategory] = useState('Other')
  const [editingId, setEditingId] = useState(null)

  if (!hasHousehold) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Create a household first</h1>
        <p className="text-slate-600 text-sm mt-1">
          Documents belong to a household. Go to Household and create one to begin.
        </p>
      </div>
    )
  }

  const handleFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const sizeKb = file.size / 1024
      const sizeLabel =
        sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Math.round(sizeKb)} KB`

      addDocument({
        name: file.name,
        category,
        size: sizeLabel,
        uploadDate: new Date().toISOString().slice(0, 10),
        content: typeof reader.result === 'string' ? reader.result : null,
      })

      setCategory('Other')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }

    reader.readAsDataURL(file)
  }

  const handleDownload = (doc) => {
    if (doc.content) {
      const link = document.createElement('a')
      link.href = doc.content
      link.download = doc.name
      link.click()
      return
    }

    const blob = new Blob(
      [`RentRight sample document: ${doc.name}\n\nThis is demo content for your presentation.`],
      { type: 'text/plain' }
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = doc.name.replace(/\.pdf$/i, '.txt')
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-7 h-7 text-teal-700" />
          Documents
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Upload, download, edit, and delete household paperwork.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Upload className="w-5 h-5 text-teal-700" />
          Upload Document
        </h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-sm text-slate-600">Category</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600">Choose file</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFile}
              className="mt-1 block text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-800 file:font-medium"
            />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Files are stored in your browser only (localStorage). Refresh the page to prove they persist.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Your Documents</h2>
        {documents.length === 0 ? (
          <p className="text-slate-500 text-sm">No documents uploaded.</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc) => {
              if (editingId === doc.id) {
                return (
                  <li key={doc.id}>
                    <DocumentEditForm
                      doc={doc}
                      onCancel={() => setEditingId(null)}
                      onSubmit={(updates) => {
                        updateDocument(doc.id, updates)
                        setEditingId(null)
                      }}
                    />
                  </li>
                )
              }

              return (
                <li key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-700 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{doc.name}</p>
                      <p className="text-xs text-slate-500">
                        {doc.category} · {doc.size} · {doc.uploadDate}{doc.uploadedBy ? ` · ${doc.uploadedBy}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-teal-800 hover:bg-teal-50 px-3 py-2 rounded-lg border border-teal-200"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(doc.id)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg border border-slate-200"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => window.confirm('Delete this document?') && deleteDocument(doc.id)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg border border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
