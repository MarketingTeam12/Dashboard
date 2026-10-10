import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({ open, title = 'Delete record?', message, confirmLabel = 'Delete', onConfirm, onClose, danger = true }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
        </>
      }
    >
      <div className="flex gap-3">
        <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${danger ? 'bg-danger-50 text-danger' : 'bg-primary-50 text-primary'}`}>
          <AlertTriangle size={19} />
        </div>
        <p className="text-[14px] text-ink-600 leading-relaxed pt-1.5">{message}</p>
      </div>
    </Modal>
  );
}
