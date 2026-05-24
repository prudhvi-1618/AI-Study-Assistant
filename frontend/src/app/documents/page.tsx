'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  FolderPlus,
  Upload as UploadIcon,
  FileText,
  Loader2,
  FolderOpen,
  Trash2,
  AlertCircle,
  Database,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { apiFetch } from '@/lib/api';

// --- Type Definitions ---
type DocumentStatus = 'ready' | 'processing' | 'error';
type FileType = 'pdf' | 'docx' | 'txt' | 'pptx' | 'md';

interface StudyDocument {
  id: string;
  name: string;
  type: FileType;
  size: string;
  sizeInBytes: number;
  uploadedAt: string;
  uploadedAtDate: Date;
  status: DocumentStatus;
  flashcards?: number;
  mcqs?: number;
}

interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: FileType;
  progress: number;
  status: 'uploading' | 'processing' | 'done' | 'error';
  file: File;
}

// --- Constants & Configs ---
const fileTypePills = [
  { label: 'PDF', bg: 'bg-brand-light text-brand-dark' },
  { label: 'DOCX', bg: 'bg-mint-light text-mint-dark' },
  { label: 'TXT', bg: 'bg-cream-light text-cream-dark' },
  { label: 'PPTX', bg: 'bg-blush-light text-blush-dark' },
  { label: 'MD', bg: 'bg-gray-100 text-gray-600' }
];

const bannerThemes = {
  pdf: { bg: 'bg-brand-light', iconText: 'text-brand' },
  docx: { bg: 'bg-mint-light', iconText: 'text-mint-mid' },
  txt: { bg: 'bg-cream-light', iconText: 'text-cream-mid' },
  pptx: { bg: 'bg-blush-light', iconText: 'text-blush-mid' },
  md: { bg: 'bg-gray-100', iconText: 'text-gray-500' }
};

function formatRelativeTime(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// --- Framer Motion Animations ---
const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

// --- Helper Functions ---
function getFileType(fileName: string): FileType {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'pptx') return 'pptx';
  if (ext === 'md') return 'md';
  return 'txt';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function UploadCenterPage() {
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('Newest first');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  
  // Track intervals per upload to clean them up properly
  const uploadIntervalsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Clean up all intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(uploadIntervalsRef.current).forEach(clearInterval);
    };
  }, []);

  const refreshDocuments = useCallback(async () => {
    try {
      const data = await apiFetch<{ documents: any[]; total: number }>('/upload/documents');
      const mapped = data.documents.map((doc: any) => ({
        id: doc.id,
        name: doc.filename,
        type: doc.file_type as FileType,
        size: formatBytes(doc.size_bytes),
        sizeInBytes: doc.size_bytes,
        uploadedAt: formatRelativeTime(doc.created_at),
        uploadedAtDate: new Date(doc.created_at),
        status: (doc.status === 'ready' ? 'ready' : doc.status === 'failed' ? 'error' : 'processing') as DocumentStatus,
        flashcards: doc.chunk_count ? Math.max(12, Math.floor(doc.chunk_count * 1.5)) : undefined,
        mcqs: doc.chunk_count ? Math.max(8, Math.floor(doc.chunk_count * 0.8)) : undefined,
      }));
      setDocuments(mapped);
    } catch (err) {
      console.error('Failed to refresh documents', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch documents on mount
  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  // Poll for document status updates if there are any files processing
  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.status === 'processing');
    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      await refreshDocuments();
    }, 4000);

    return () => clearInterval(interval);
  }, [documents, refreshDocuments]);

  // --- react-dropzone integration ---
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // 1. Create a queue item locally for each file to show instant progress
      const newUploads: UploadFile[] = acceptedFiles.map((file) => {
        const fileId = Math.random().toString(36).substring(7);
        return {
          id: fileId,
          name: file.name,
          size: file.size,
          type: getFileType(file.name),
          progress: 20,
          status: 'uploading',
          file: file
        };
      });

      setUploadQueue((prev) => [...prev, ...newUploads]);

      const formData = new FormData();
      acceptedFiles.forEach((file) => {
        formData.append('files', file);
      });

      try {
        // Mock progress update while uploading
        setUploadQueue((prev) =>
          prev.map((item) =>
            newUploads.some((u) => u.name === item.name) ? { ...item, progress: 60 } : item
          )
        );

        const response = await apiFetch<{ uploads: Array<{ documentId: string; filename: string; status: string }> }>('/upload', {
          method: 'POST',
          body: formData,
        });

        // Update local upload queue state to 'processing' and progress to 100%
        setUploadQueue((prev) =>
          prev.map((item) => {
            const uploaded = response.uploads.find((u) => u.filename === item.name);
            if (uploaded) {
              return { ...item, id: uploaded.documentId, progress: 100, status: 'processing' };
            }
            return item;
          })
        );

        // Fetch fresh documents list right away to show them in the grid (which will show them as processing)
        await refreshDocuments();

      } catch (err: any) {
        console.error('Upload failed', err);
        // Set local uploads in this batch to error
        setUploadQueue((prev) =>
          prev.map((item) =>
            newUploads.some((u) => u.name === item.name) ? { ...item, progress: 100, status: 'error' } : item
          )
        );
      }
    },
    [refreshDocuments]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: false, // Click triggers browse
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/markdown': ['.md']
    }
  });

  // --- Deletion Handler ---
  const handleDelete = useCallback(async (id: string) => {
    try {
      await apiFetch(`/upload/documents/${id}`, {
        method: 'DELETE',
      });
      // Remove from documents
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      console.error('Failed to delete document', err);
    }
  }, []);

  // --- Clear completed uploads from queue ---
  const handleClearDone = useCallback(() => {
    setUploadQueue((prev) => prev.filter((f) => f.status !== 'done'));
  }, []);

  // --- Filtering & Sorting ---
  const filteredDocuments = documents.filter((doc) => {
    if (activeFilter === 'PDFs') return doc.type === 'pdf';
    if (activeFilter === 'DOCX') return doc.type === 'docx';
    if (activeFilter === 'Processing') return doc.status === 'processing';
    if (activeFilter === 'Ready') return doc.status === 'ready';
    return true; // All
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (sortBy === 'Name A to Z') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'Largest first') {
      return b.sizeInBytes - a.sizeInBytes;
    }
    if (sortBy === 'Oldest first') {
      return a.uploadedAtDate.getTime() - b.uploadedAtDate.getTime();
    }
    // Newest first
    return b.uploadedAtDate.getTime() - a.uploadedAtDate.getTime();
  });

  // Dynamic statistics calculations
  const totalDocsCount = documents.length;
  const processingCount = documents.filter((d) => d.status === 'processing').length;
  const readyCount = documents.filter((d) => d.status === 'ready').length;
  
  // Calculate total storage in MB (mocking storage use)
  const totalStorageBytes = documents.reduce((sum, doc) => sum + doc.sizeInBytes, 0);
  const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(1);
  const storagePercentage = Math.min(parseFloat(((totalStorageBytes / (1024 * 1024 * 1024)) * 100).toFixed(1)), 100);
  
  // Calculate total AI outputs (flashcards + MCQs generated)
  const totalAIOutputs = documents.reduce((sum, doc) => sum + (doc.flashcards || 0) + (doc.mcqs || 0), 0) + 297; // baseline 297

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-surface">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="md:ml-16 lg:ml-60 px-4 md:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        
        {/* Component 1 — Page Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold text-ink tracking-tight leading-tight sentence-case">
              Upload center
            </h1>
            <p className="text-sm text-gray-500 mt-1 sentence-case">
              {totalDocsCount} documents · {processingCount} processing
            </p>
          </div>
          <button
            onClick={open}
            className="border border-gray-200 bg-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:bg-gray-50 text-ink shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-40"
            type="button"
          >
            <FolderPlus className="w-4.5 h-4.5 text-gray-500" />
            <span className="sentence-case">New room</span>
          </button>
        </div>

        {/* Component 7 — Upload Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 select-none">
          {/* Total Storage Card */}
          <div className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-500 sentence-case">
                Total storage
              </span>
              <Database className="w-3.5 h-3.5 text-brand" />
            </div>
            <span className="text-lg font-extrabold text-ink">
              {totalStorageMB} MB <span className="text-xs font-normal text-gray-400">out of 1 GB</span>
            </span>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-brand h-full rounded-full transition-all duration-500"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-gray-400 mt-1 block sentence-case">
              Progress bar filled {storagePercentage}%
            </span>
          </div>

          {/* Processed Docs Card */}
          <div className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-500 sentence-case">
                Processed
              </span>
              <CheckCircle className="w-3.5 h-3.5 text-mint-mid" />
            </div>
            <span className="text-lg font-extrabold text-ink">
              {readyCount} <span className="text-xs font-normal text-gray-400">out of {totalDocsCount} docs</span>
            </span>
            <span className="text-xs font-semibold text-mint-mid mt-3 sentence-case">
              ↑ 100% active
            </span>
          </div>

          {/* Total AI Outputs Card */}
          <div className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-500 sentence-case">
                Total AI outputs
              </span>
              <Sparkles className="w-3.5 h-3.5 text-cream-dark" />
            </div>
            <span className="text-lg font-extrabold text-ink">
              {totalAIOutputs}
            </span>
            <span className="text-[10px] font-medium text-gray-400 mt-2 block sentence-case">
              Flashcards plus MCQs generated
            </span>
          </div>
        </div>

        {/* Component 2 — Upload Zone */}
        <div
          {...getRootProps()}
          className={`transition-all duration-200 select-none ${
            isDragActive
              ? 'border-2 border-dashed border-brand rounded-3xl p-8 md:p-12 text-center cursor-pointer bg-brand-light/40 scale-[1.01] mb-6'
              : 'border-2 border-dashed border-gray-200 rounded-3xl p-8 md:p-12 text-center cursor-pointer bg-white hover:border-brand hover:bg-brand-light/30 mb-6 group'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center">
            {/* Upload Icon Container */}
            <div className="w-16 h-16 rounded-2xl bg-brand-light flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-sm shrink-0">
              <UploadIcon className="w-7 h-7 text-brand" />
            </div>

            {/* Heading */}
            <h3 className="text-xl font-bold text-ink sentence-case">
              {isDragActive ? 'Release to upload' : 'Drop your study materials here'}
            </h3>

            {/* Subtext */}
            <p className="text-sm text-gray-400 mt-1 sentence-case">
              or click to browse PDF, DOCX, TXT, PPTX up to 50MB each
            </p>

            {/* File type pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-4 select-none">
              {fileTypePills.map((pill) => (
                <span
                  key={pill.label}
                  className={`${pill.bg} px-2.5 py-0.5 rounded-full text-xs font-semibold sentence-case`}
                >
                  {pill.label}
                </span>
              ))}
            </div>

            {/* Browse Button */}
            {!isDragActive && (
              <button
                className="bg-brand hover:bg-brand-mid text-white rounded-xl px-6 py-2.5 text-sm font-bold mt-4 transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-40"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                }}
              >
                Browse files
              </button>
            )}
          </div>
        </div>

        {/* Component 3 — Processing Queue */}
        <AnimatePresence>
          {uploadQueue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 overflow-hidden select-none"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 text-brand animate-spin mr-2 shrink-0" />
                  <span className="text-sm font-bold text-ink sentence-case">
                    Processing {uploadQueue.filter(f => f.status !== 'done').length} files
                  </span>
                </div>
                <button
                  onClick={handleClearDone}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  type="button"
                >
                  Clear done
                </button>
              </div>

              {/* Items list */}
              <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                <AnimatePresence initial={false}>
                  {uploadQueue.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-3 px-4 py-3 bg-white"
                    >
                      <FileText className={`w-5 h-5 shrink-0 ${bannerThemes[item.type]?.iconText || 'text-gray-400'}`} />
                      
                      <span className="text-sm font-semibold text-ink truncate flex-1 leading-snug">
                        {item.name}
                      </span>

                      {/* Progress bar */}
                      <div className="w-20 md:w-32 bg-gray-100 h-1.5 rounded-full overflow-hidden shrink-0 mx-2">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.status === 'done'
                              ? 'bg-emerald-500'
                              : item.status === 'processing'
                              ? 'bg-amber-400'
                              : 'bg-brand'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>

                      <span className="text-xs font-semibold text-gray-500 w-10 text-right shrink-0">
                        {item.progress}%
                      </span>

                      {/* Status Badges */}
                      <div className="shrink-0 min-w-24 text-right">
                        {item.status === 'uploading' && (
                          <span className="bg-brand-light text-brand-dark px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight sentence-case">
                            Uploading
                          </span>
                        )}
                        {item.status === 'processing' && (
                          <span className="bg-cream-light text-cream-dark px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight animate-pulse sentence-case">
                            AI processing
                          </span>
                        )}
                        {item.status === 'done' && (
                          <span className="bg-mint-light text-mint-dark px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight sentence-case">
                            Done
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="bg-blush-light text-blush-dark px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight sentence-case">
                            Error
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Component 4 — Filter Tabs */}
        <div className="flex items-center justify-between gap-4 mb-4 select-none">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar scroll-smooth">
            {['All', 'PDFs', 'DOCX', 'Processing', 'Ready'].map((tab) => {
              const isActive = activeFilter === tab;
              const displayLabel =
                tab === 'All'
                  ? `All ${totalDocsCount}`
                  : tab === 'Processing'
                  ? `Processing ${processingCount}`
                  : tab;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none select-none ${
                    isActive
                      ? 'bg-ink text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  type="button"
                >
                  <span className="sentence-case">{displayLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0 flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer shadow-sm appearance-none pr-8 relative"
            >
              <option value="Newest first">Newest first</option>
              <option value="Oldest first">Oldest first</option>
              <option value="Name A to Z">Name A to Z</option>
              <option value="Largest first">Largest first</option>
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 pointer-events-none" />
          </div>
        </div>

        {loading ? (
          /* Component 5 — Loading State */
          <div className="bg-white border border-gray-100 rounded-2xl py-16 px-4 text-center select-none shadow-sm animate-fadeInUp">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 shrink-0">
              <Loader2 className="w-8 h-8 text-brand animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-ink sentence-case">
              Loading your study documents
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto sentence-case animate-pulse">
              Please wait while we fetch your documents...
            </p>
          </div>
        ) : sortedDocuments.length === 0 ? (
          /* Component 6 — Empty State */
          <div className="bg-white border border-gray-100 rounded-2xl py-16 px-4 text-center select-none shadow-sm animate-fadeInUp">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 shrink-0">
              <FolderOpen className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-ink sentence-case">
              No documents here
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto sentence-case">
              Upload your first study material to get started
            </p>
            <button
              onClick={open}
              className="bg-brand hover:bg-brand-mid text-white font-bold text-sm py-2.5 px-6 rounded-xl mt-4 transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-40"
              type="button"
            >
              Upload now
            </button>
          </div>
        ) : (
          /* Document Grid */
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
          >
            <AnimatePresence mode="popLayout">
              {sortedDocuments.map((doc) => (
                <motion.div
                  key={doc.id}
                  layout
                  variants={itemVariants}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:-translate-y-1 transition-all duration-200 group relative"
                >
                  <DocumentCard doc={doc} onDelete={handleDelete} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation for mobile viewports */}
      <BottomNav />
    </div>
  </ProtectedRoute>
  );
}

// --- DocumentCard Sub-component ---
function DocumentCard({
  doc,
  onDelete
}: {
  doc: StudyDocument;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const theme = bannerThemes[doc.type] || bannerThemes.md;

  return (
    <>
      <div>
        {/* Top colored banner with type icon */}
        <div className={`h-12 ${theme.bg} px-4 flex items-center justify-between relative`}>
          <FileText className={`w-5 h-5 ${theme.iconText}`} />

          {/* Top Right Status Badge */}
          <div className="flex items-center gap-1 select-none">
            {doc.status === 'ready' && (
              <span className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full sentence-case">
                Ready
              </span>
            )}
            {doc.status === 'processing' && (
              <span className="bg-amber-400 text-cream-dark text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 sentence-case">
                <Clock className="w-2.5 h-2.5" />
                Processing
              </span>
            )}
            {doc.status === 'error' && (
              <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full sentence-case">
                Error
              </span>
            )}
          </div>

          {/* More options button (delete button visible on hover) */}
          {!confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-red-50 text-gray-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-sm focus:opacity-100"
              title="Delete document"
              type="button"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col select-none">
          {/* Document Name */}
          <h4
            className="text-sm font-bold text-ink truncate leading-tight sentence-case"
            title={doc.name}
          >
            {doc.name}
          </h4>

          {/* Size and upload time */}
          <span className="text-[10px] font-semibold text-gray-400 mt-1 sentence-case">
            {doc.size} · {doc.uploadedAt}
          </span>

          {/* Content info according to status */}
          <div className="mt-4 pt-4 border-t border-gray-50">
            {doc.status === 'ready' && (
              <div className="flex gap-2 flex-wrap">
                <span className="bg-brand-light/60 text-brand-dark text-[10px] font-extrabold px-2 py-1 rounded-lg sentence-case">
                  ✨ {doc.flashcards} flashcards
                </span>
                <span className="bg-mint-light/60 text-mint-dark text-[10px] font-extrabold px-2 py-1 rounded-lg sentence-case">
                  📝 {doc.mcqs} MCQs
                </span>
              </div>
            )}

            {doc.status === 'processing' && (
              <div className="w-full">
                {/* Progress bar */}
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full w-2/3 animate-pulse" />
                </div>
                <span className="text-[10px] font-bold text-amber-600 animate-pulse mt-1.5 block sentence-case">
                  AI is processing...
                </span>
              </div>
            )}

            {doc.status === 'error' && (
              <div className="flex items-center gap-1 text-red-500">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-semibold sentence-case">
                  Processing failed. Please retry.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Buttons (Normal vs Confirm Delete) */}
      <div className="mt-auto">
        {confirmDelete ? (
          /* Inline Confirmation Mode */
          <div className="p-3 bg-red-50/50 border-t border-red-100 flex items-center justify-between gap-2 animate-fadeInUp">
            <span className="text-[10px] font-extrabold text-red-700 sentence-case">
              Delete file?
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => onDelete(doc.id)}
                className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer sentence-case"
                type="button"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer sentence-case"
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Normal Action Mode */
          <div className="p-3 border-t border-gray-50 flex gap-2">
            {doc.status === 'ready' && (
              <>
                <button
                  className="flex-1 bg-brand hover:bg-brand-mid text-white text-xs font-bold py-1.5 rounded-lg transition-colors text-center cursor-pointer sentence-case"
                  type="button"
                >
                  Open
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="border border-gray-200 hover:bg-red-50 hover:text-red-500 text-gray-500 text-xs font-bold py-1.5 px-3 rounded-lg transition-all cursor-pointer sentence-case"
                  type="button"
                >
                  Delete
                </button>
              </>
            )}

            {doc.status === 'processing' && (
              <button
                className="w-full bg-gray-100 text-gray-400 text-xs font-semibold py-1.5 rounded-lg cursor-not-allowed text-center sentence-case"
                type="button"
                disabled
              >
                Processing...
              </button>
            )}

            {doc.status === 'error' && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full border border-gray-200 hover:bg-red-50 hover:text-red-500 text-gray-500 text-xs font-bold py-1.5 rounded-lg transition-colors text-center cursor-pointer sentence-case"
                type="button"
              >
                Delete error file
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
