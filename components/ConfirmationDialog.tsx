
import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, onClose, onConfirm, title, message, confirmButtonText = 'Confirm' }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[200] p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        className="bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-md border border-white/10 ring-1 ring-white/5 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8">
          <h3 id="dialog-title" className="text-xl font-black text-white tracking-tight uppercase">{title}</h3>
          <p className="mt-4 text-slate-400 leading-relaxed">{message}</p>
        </div>
        <div className="p-6 bg-slate-950/50 border-t border-white/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-2xl hover:bg-slate-700 transition-all active:scale-95 text-sm"
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-2.5 bg-red-600 text-white font-black rounded-2xl hover:bg-red-500 shadow-lg shadow-red-900/40 transition-all active:scale-95 text-sm uppercase tracking-widest"
            aria-label="Confirm action"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
