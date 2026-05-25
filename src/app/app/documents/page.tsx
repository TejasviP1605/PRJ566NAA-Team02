'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Download, Trash2, FileText, Lock, Search, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

import { documentService } from '@/lib/api/document.service';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatFileSize, capitalize } from '@/lib/utils';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import type { Document, DocumentType, DocumentAccess } from '@/types';

const DOC_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'image/jpeg': '🖼',
  'image/png': '🖼',
  default: '📁',
};

const TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'lease_agreement', label: 'Lease Agreement' },
  { value: 'addendum', label: 'Addendum' },
  { value: 'inspection_report', label: 'Inspection Report' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'utility_bill', label: 'Utility Bill' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'notice', label: 'Notice' },
  { value: 'other', label: 'Other' },
];

const ACCESS_OPTIONS: { value: DocumentAccess; label: string }[] = [
  { value: 'all_members', label: 'All Members' },
  { value: 'leaseholder_only', label: 'Leaseholder Only' },
  { value: 'admin_only', label: 'Admin Only' },
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function DocumentsPage() {
  const { user } = useAuthStore();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'other' as DocumentType,
    access: 'all_members' as DocumentAccess,
    description: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['documents', user?.householdId],
    queryFn: () => documentService.getDocuments(user?.householdId ?? ''),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      success('Document deleted');
    },
    onError: () => error('Failed to delete document'),
  });

  const uploadMutation = useMutation({
    mutationFn: () =>
      documentService.uploadDocument({
        householdId: user?.householdId ?? '',
        name: uploadForm.name,
        type: uploadForm.type,
        access: uploadForm.access,
        description: uploadForm.description,
        fileUrl: '/mock/document.pdf',
        fileName: `${uploadForm.name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        fileSize: Math.floor(Math.random() * 500000) + 100000,
        mimeType: 'application/pdf',
        uploadedBy: user?.id ?? '',
        uploadedByName: `${user?.firstName} ${user?.lastName}`,
        tags: [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      success('Document uploaded');
      setUploadOpen(false);
      setUploadForm({ name: '', type: 'other', access: 'all_members', description: '' });
    },
    onError: () => error('Upload failed'),
  });

  const documents = data?.data ?? [];
  const filtered = documents.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const canViewDoc = (doc: Document): boolean => {
    if (!user) return false;
    if (doc.access === 'all_members') return true;
    if (doc.access === 'leaseholder_only') return user.role === 'leaseholder' || user.role === 'admin';
    if (doc.access === 'admin_only') return user.role === 'admin';
    return false;
  };

  const canUpload = user?.role === 'leaseholder' || user?.role === 'property_manager' || user?.role === 'admin';

  if (isLoading) return <PageLoader />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">{filtered.length} documents</p>
        </div>
        {canUpload && (
          <Button leftIcon={<Upload className="w-4 h-4" />} onClick={() => setUploadOpen(true)}>
            Upload Document
          </Button>
        )}
      </div>

      <div className="mb-5">
        <Input
          placeholder="Search documents..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="No documents"
          description="Upload lease agreements, inspection reports, and other important files."
          action={canUpload ? <Button leftIcon={<Upload className="w-4 h-4" />} onClick={() => setUploadOpen(true)}>Upload Document</Button> : undefined}
        />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const accessible = canViewDoc(doc);
            return (
              <motion.div variants={item} key={doc.id}>
                <Card className={accessible ? '' : 'opacity-70'}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-12 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center text-xl shrink-0">
                      {DOC_ICONS[doc.mimeType] ?? DOC_ICONS.default}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-surface-900 truncate">{doc.name}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{formatFileSize(doc.fileSize)} · v{doc.version}</p>
                    </div>
                  </div>

                  {doc.description && (
                    <p className="text-xs text-surface-500 mt-3 line-clamp-2">{doc.description}</p>
                  )}

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge variant="muted" size="sm">
                      {doc.type.replace(/_/g, ' ')}
                    </Badge>
                    {!accessible && (
                      <Badge variant="warning" size="sm">
                        <Lock className="w-2.5 h-2.5 mr-1" />
                        Restricted
                      </Badge>
                    )}
                    {doc.expiresAt && (
                      <span className="text-xs text-surface-400">Expires {formatDate(doc.expiresAt, 'MMM yyyy')}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-100">
                    <span className="text-xs text-surface-400">{formatDate(doc.createdAt, 'MMM d, yyyy')}</span>
                    <div className="flex gap-1.5">
                      {accessible ? (
                        <button className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                      ) : (
                        <button className="p-1.5 text-surface-300 cursor-not-allowed rounded-lg" title="Restricted" disabled>
                          <Lock className="w-4 h-4" />
                        </button>
                      )}
                      {canUpload && (
                        <button
                          onClick={() => deleteMutation.mutate(doc.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload Document"
        size="md"
      >
        <div className="space-y-4">
          {/* Drag zone */}
          <div className="border-2 border-dashed border-surface-200 rounded-xl p-8 text-center hover:border-brand-400 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-surface-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-surface-700">Drop files here or click to browse</p>
            <p className="text-xs text-surface-400 mt-1">PDF, PNG, JPG up to 10MB</p>
          </div>

          <Input
            label="Document name"
            placeholder="e.g., Lease Agreement 2024"
            value={uploadForm.name}
            onChange={(e) => setUploadForm((f) => ({ ...f, name: e.target.value }))}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Document type"
              options={TYPE_OPTIONS}
              value={uploadForm.type}
              onChange={(e) => setUploadForm((f) => ({ ...f, type: e.target.value as DocumentType }))}
            />
            <Select
              label="Access level"
              options={ACCESS_OPTIONS}
              value={uploadForm.access}
              onChange={(e) => setUploadForm((f) => ({ ...f, access: e.target.value as DocumentAccess }))}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              isLoading={uploadMutation.isPending}
              disabled={!uploadForm.name}
              onClick={() => uploadMutation.mutate()}
            >
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
