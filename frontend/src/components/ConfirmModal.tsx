import { useLanguage } from '../context/LanguageContext';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'default';
}

export default function ConfirmModal({ title, message, onConfirm, onCancel, variant = 'default' }: ConfirmModalProps) {
  const { t } = useLanguage();

  const variantStyles = {
    danger: {
      button: 'bg-red-600 hover:bg-red-700 text-white',
      icon: 'text-red-500',
    },
    warning: {
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
      icon: 'text-amber-500',
    },
    default: {
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      icon: 'text-emerald-500',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 modal-content">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 mt-0.5 ${style.icon}`}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="btn-press px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className={`btn-press px-5 py-2 rounded-lg font-semibold transition ${style.button}`}
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
