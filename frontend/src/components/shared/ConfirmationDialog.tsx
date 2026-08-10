import Modal from '../common/Modal';
import AppButton from '../ui/AppButton';
import { MdWarning } from 'react-icons/md';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmText,
  cancelLabel = 'Cancel',
  cancelText,
  isDanger = true,
  isLoading = false,
  onCancel,
}: ConfirmationDialogProps) => {
  const handleCancel = onCancel || onClose || (() => {});
  const effectiveConfirmLabel = confirmText || confirmLabel;
  const effectiveCancelLabel = cancelText || cancelLabel;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: isDanger ? '#FFEBEE' : '#FFF5EC',
              color: isDanger ? '#B71C1C' : '#FF7A1A',
              flexShrink: 0,
            }}
          >
            <MdWarning size={22} />
          </div>
          <p style={{ margin: 0, fontSize: '0.925rem', color: '#444444', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <AppButton type="button" variant="outlined" size="md" onClick={handleCancel} disabled={isLoading}>
            {effectiveCancelLabel}
          </AppButton>
          <AppButton
            type="button"
            variant="primary"
            size="md"
            isLoading={isLoading}
            onClick={onConfirm}
            style={{
              backgroundColor: isDanger ? '#D32F2F' : undefined,
              borderColor: isDanger ? '#D32F2F' : undefined,
            }}
          >
            {effectiveConfirmLabel}
          </AppButton>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
