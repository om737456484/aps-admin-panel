import React, { useState } from 'react'
import { Database, Key, Check, X, ShieldAlert, Eye, EyeOff, Radio, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import { getStoredConfig, saveStoredConfig, testConnection } from '../services/supabaseClient'
import { useToast } from '../context/ToastContext'

export default function ConfigModal({ isOpen, onClose, onSaved }) {
  const current = getStoredConfig()
  const [url, setUrl] = useState(current.url)
  const [key, setKey] = useState(current.key)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const { showToast } = useToast()

  if (!isOpen) return null

  const handleTestConnection = async () => {
    if (!url || !key) {
      showToast('يرجى إدخال الرابط والمفتاح أولاً لاختبار الاتصال', 'warning')
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const res = await testConnection(url, key)
      setTestResult(res)
      if (res.success) {
        showToast('تم التحقق بنجاح! الاتصال بقاعدة البيانات يعمل بكفاءة.', 'success')
      } else {
        showToast('فشل الاتصال: ' + res.error, 'error')
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message })
      showToast('خطأ أثناء الاختبار: ' + err.message, 'error')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = (e) => {
    e.preventDefault()
    saveStoredConfig(url, key)
    showToast('تم حفظ إعدادات الاتصال بنجاح', 'success')
    onSaved?.()
    onClose()
  }

  const handleClear = () => {
    saveStoredConfig('', '')
    setUrl('')
    setKey('')
    setTestResult(null)
    showToast('تم مسح الإعدادات والعودة إلى وضع المعاينة', 'info')
    onSaved?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-900 animate-scaleUp">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Database size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">إعدادات الاتصال بـ Supabase</h2>
              <p className="text-xs text-slate-500">ربط لوحة الإدارة بقاعدة بيانات التراخيص والمشتركين</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Project URL (رابط المشروع في Supabase):
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setTestResult(null)
              }}
              placeholder="https://your-project.supabase.co"
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-mono text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Anon / Service Role Key (مفتاح الـ API):
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => {
                  setKey(e.target.value)
                  setTestResult(null)
                }}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                dir="ltr"
                className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-mono text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                required
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !url || !key}
              className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition-all flex items-center justify-center gap-2"
            >
              {testing ? <RefreshCw size={14} className="animate-spin text-blue-600" /> : <Radio size={14} />}
              <span>{testing ? 'جارٍ اختبار الاتصال...' : 'اختبار الاتصال المباشر'}</span>
            </button>

            {testResult && (
              <div className={`mt-2.5 p-3 rounded-xl border flex items-center gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {testResult.success ? <CheckCircle2 size={18} className="shrink-0 text-emerald-600" /> : <XCircle size={18} className="shrink-0 text-rose-600" />}
                <span className="text-[11px] leading-relaxed">
                  {testResult.success ? 'الاتصال ناجح! تم الوصول لبيانات التراخيص في Supabase.' : `فشل الاتصال: ${testResult.error}`}
                </span>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            💡 يتم حفظ بيانات الاتصال بأمان في المتصفح، أو يمكنك ضبطها عبر ملف <code>.env</code> للوحة الإدارة.
          </div>

          <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-rose-600 hover:underline"
            >
              مسح الإعدادات (العودة للوضع التجريبي)
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <span>حفظ وتطبيق</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
