import React from 'react';
import { Search, RotateCcw, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface TableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Status Filter
  status?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: FilterOption[];

  // Custom Extra Select Dropdowns (e.g. Region, Category, Vehicle Type)
  extraDropdowns?: {
    value: string;
    onChange: (val: string) => void;
    options: FilterOption[];
    placeholder: string;
  }[];

  // Date Range Filter
  dateStart?: string;
  onDateStartChange?: (val: string) => void;
  dateEnd?: string;
  onDateEndChange?: (val: string) => void;

  // Sorting
  sortBy: string;
  onSortByChange: (val: string) => void;
  sortOptions: FilterOption[];
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (val: 'asc' | 'desc') => void;

  // Pagination
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;

  // Actions
  onReset: () => void;
  onExportPDF?: () => void;
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  status,
  onStatusChange,
  statusOptions,
  extraDropdowns,
  dateStart,
  onDateStartChange,
  dateEnd,
  onDateEndChange,
  sortBy,
  onSortByChange,
  sortOptions,
  sortOrder,
  onSortOrderChange,
  page,
  totalPages,
  onPageChange,
  onReset,
  onExportPDF
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 print:hidden">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Global Search */}
        <div className="relative lg:col-span-2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
            <Search size={18} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition-all"
          />
        </div>

        {/* Sorting Dropdowns */}
        <div className="flex space-x-2">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          
          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
            className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
          >
            <option value="desc">DESC</option>
            <option value="asc">ASC</option>
          </select>
        </div>

        {/* Status Dropdown */}
        {onStatusChange && statusOptions && (
          <div>
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
            >
              <option value="ALL">All Statuses</option>
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Extra Dropdowns and Dates */}
        <div className="flex flex-wrap gap-2 items-center">
          {extraDropdowns?.map((d, idx) => (
            <select
              key={idx}
              value={d.value}
              onChange={(e) => d.onChange(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-xs font-semibold"
            >
              <option value="ALL">{d.placeholder}</option>
              {d.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}

          {onDateStartChange && (
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              <span>From:</span>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => onDateStartChange && onDateStartChange(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
              <span>To:</span>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => onDateEndChange && onDateEndChange(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Action Controls & Pagination */}
        <div className="flex flex-wrap items-center gap-3 justify-end">
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-1">
              <button
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 hover:bg-slate-55 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 hover:bg-slate-55 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          {onExportPDF && (
            <button
              onClick={() => onExportPDF && onExportPDF()}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white transition-all shadow-md shadow-blue-500/5"
            >
              <FileText size={13} />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
