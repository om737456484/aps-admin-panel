import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [confirmDialog, setConfirmDialog] = useState(null)

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 6)
    setToasts((prev) => [...prev, { id, message, type }])

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const confirm = useCallback(({ title, message, confirmText = 'تأكيد', cancelText = 'إلغاء', isDanger = false }) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        title,
        message,
        confirmText,
        cancelText,
        isDanger,
        onConfirm: () => {
          setConfirmDialog(null)
          resolve(true)
        },
        onCancel: () => {
          setConfirmDialog(null)
          resolve(false)
        },
      })
    })
  }, [])

  const toastIcons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
  }

  const toastStyles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    error: 'bg-rose-50 border-rose-200 text-rose-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  }

  return (
    <ToastContext.Provider value={{ showToast, confirm }}>
      {children}

      {/* Floating Toasts Container */}
      <div className="fixed bottom-5 left-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 animate-slideUp ${
              toastStyles[t.type] || toastStyles.info
            }`}
          >
            {toastIcons[t.type] || toastIcons.info}
            <div className="flex-1 text-xs font-semibold leading-relaxed pt-0.5">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-black/5 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl animate-scaleUp text-right">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmDialog.isDanger
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                }`}
              >
                {confirmDialog.isDanger ? <AlertTriangle size={22} /> : <Info size={22} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{confirmDialog.title || 'تأكيد العملية'}</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed my-4 pr-1 whitespace-pre-line">
              {confirmDialog.message}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={confirmDialog.onCancel}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {confirmDialog.cancelText}
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  confirmDialog.isDanger
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
