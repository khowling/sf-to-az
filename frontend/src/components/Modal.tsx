import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" tabIndex={-1} className="relative z-10 w-full max-w-lg rounded-lg bg-white shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          <h2 className="flex-1 min-w-0 text-base sm:text-lg font-semibold text-gray-900 truncate pr-2">{title}</h2>
          <button
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onClose}
            title="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.36 5.64a1 1 0 00-1.41 0L12 10.59 7.05 5.64a1 1 0 10-1.41 1.41L10.59 12l-4.95 4.95a1 1 0 101.41 1.41L12 13.41l4.95 4.95a1 1 0 001.41-1.41L13.41 12l4.95-4.95a1 1 0 000-1.41z" />
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="overflow-auto px-4 sm:px-6 py-3 sm:py-4">
          {children}
        </div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
