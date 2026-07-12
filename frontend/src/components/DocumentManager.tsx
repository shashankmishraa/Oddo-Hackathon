import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { FileUp, Trash2, Eye, Download, ShieldAlert, CheckCircle } from 'lucide-react';

interface Document {
  id: string;
  vehicleId: string;
  type: string;
  fileName: string;
  filePath: string;
  expiryDate: string;
  status: string;
}

interface DocumentManagerProps {
  vehicleId: string;
  isAdminOrDispatcher: boolean;
}

const DOC_TYPES = [
  { value: 'RC', label: 'Registration Certificate (RC)' },
  { value: 'INSURANCE', label: 'Vehicle Insurance' },
  { value: 'PUC', label: 'Pollution Under Control (PUC)' },
  { value: 'FITNESS', label: 'Fitness Certificate' },
  { value: 'PERMIT', label: 'National/State Permit' },
];

export const DocumentManager: React.FC<DocumentManagerProps> = ({ vehicleId, isAdminOrDispatcher }) => {
  const queryClient = useQueryClient();
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch Vehicle Documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['vehicle_documents', vehicleId],
    queryFn: async () => {
      const res = await api.get(`/vehicles/${vehicleId}/documents`);
      return res.data.data as Document[];
    },
  });

  // Upload Mutation (Handles both initial upload and overwrite replacement)
  const uploadMutation = useMutation({
    mutationFn: async (payload: { file: File; type: string; expiryDate: string }) => {
      const formData = new FormData();
      formData.append('file', payload.file);
      formData.append('type', payload.type);
      formData.append('expiryDate', payload.expiryDate);

      const res = await api.post(`/vehicles/${vehicleId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle_documents', vehicleId] });
      setSuccess('Document processed successfully.');
      setSelectedFile(null);
      setExpiryDate('');
      setActiveUploadType(null);
      setTimeout(() => setSuccess(null), 2000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Upload failed.');
      setTimeout(() => setError(null), 3000);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const res = await api.delete(`/vehicles/${vehicleId}/documents/${docId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle_documents', vehicleId] });
      setSuccess('Document removed successfully.');
      setTimeout(() => setSuccess(null), 2000);
    },
  });

  const handleUploadSubmit = (type: string) => {
    if (!selectedFile || !expiryDate) {
      setError('Please choose a file and pick an expiration date.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    uploadMutation.mutate({ file: selectedFile, type, expiryDate });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/45';
      case 'EXPIRING_SOON':
        return 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/45';
      case 'EXPIRED':
        return 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/45';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border border-slate-100 dark:border-slate-700';
    }
  };

  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

  return (
    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Compliance & Asset Documents</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Upload and monitor vehicle legal credentials</p>
      </div>

      {error && (
        <div className="flex items-center space-x-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/10 p-3.5 text-xs text-rose-600 dark:text-rose-400">
          <ShieldAlert size={14} className="shrink-0" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle size={14} className="shrink-0" />
          <p className="font-semibold">{success}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center space-x-2 py-4 text-slate-450 text-xs">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Loading compliance certificates...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOC_TYPES.map((typeObj) => {
            const doc = documents.find((d) => d.type === typeObj.value);
            const isUploading = activeUploadType === typeObj.value;

            return (
              <div
                key={typeObj.value}
                className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-350">{typeObj.label}</p>
                    {doc ? (
                      <div className="space-y-1">
                        <p className="text-[11px] font-mono text-slate-400 truncate max-w-[200px]" title={doc.fileName}>
                          {doc.fileName}
                        </p>
                        <p className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400">
                          Expires: {doc.expiryDate.split('T')[0]}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                        Not Uploaded
                      </p>
                    )}
                  </div>

                  {doc && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${getStatusBadge(doc.status)}`}>
                      {doc.status.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {/* Actions Block */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  {doc ? (
                    <div className="flex space-x-1.5">
                      <a
                        href={`${API_URL}/${doc.filePath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-900/50 hover:bg-blue-50/20 text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors"
                        title="Preview"
                      >
                        <Eye size={13} />
                      </a>
                      <a
                        href={`${API_URL}/${doc.filePath}`}
                        download
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-900/50 hover:bg-emerald-50/20 text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition-colors"
                        title="Download"
                      >
                        <Download size={13} />
                      </a>
                      {isAdminOrDispatcher && (
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this compliance certificate?')) {
                              deleteMutation.mutate(doc.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-350 dark:hover:border-rose-900/50 hover:bg-rose-50/20 text-slate-500 dark:text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div />
                  )}

                  {isAdminOrDispatcher && (
                    <div>
                      {!isUploading ? (
                        <button
                          onClick={() => {
                            setActiveUploadType(typeObj.value);
                            setSelectedFile(null);
                            setExpiryDate('');
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-650 dark:text-slate-300 transition-colors"
                        >
                          <FileUp size={11} />
                          <span>{doc ? 'Replace' : 'Upload'}</span>
                        </button>
                      ) : (
                        <div className="space-y-2 w-full max-w-[200px] text-right">
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="w-full text-[10px] text-slate-400 focus:outline-none"
                          />
                          <div className="flex space-x-1.5 items-center justify-end">
                            <input
                              type="date"
                              value={expiryDate}
                              onChange={(e) => setExpiryDate(e.target.value)}
                              className="px-1.5 py-1 text-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-slate-900 dark:text-white focus:outline-none"
                            />
                            <button
                              onClick={() => handleUploadSubmit(typeObj.value)}
                              disabled={uploadMutation.isPending}
                              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-all disabled:opacity-50"
                            >
                              Submit
                            </button>
                            <button
                              onClick={() => setActiveUploadType(null)}
                              className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default DocumentManager;
