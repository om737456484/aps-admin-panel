import React, { useState } from 'react'
import { Key, Copy, Check, X, ShieldCheck, Sparkles, Send } from 'lucide-react'
import { generateOfflineCodeBrowser } from '../services/supabaseClient'
import { useToast } from '../context/ToastContext'

export default function OfflineKeygenModal({ isOpen, onClose }) {
  const [requestCode, setRequestCode] = useState('')
  const [days, setDays] = useState(365)
  const [devices, setDevices] = useState(101)
  const [companyName, setCompanyName] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  if (!isOpen) return null

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!requestCode.trim()) {
      showToast('يرجى إدخال كود الطلب الخاص بجهاز العميل', 'warning')
      return
    }

    setLoading(true)
    try {
      const code = await generateOfflineCodeBrowser({
        requestCode: requestCode.trim(),
        daysGranted: Number(days) || 365,
        maxDevices: Number(devices) || 1,
      })
      setGeneratedCode(code)
      showToast('تم توليد كود التفعيل المعتمد بنجاح', 'success')
    } catch (err) {
      showToast('فشل التوليد: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!generatedCode) return
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    showToast('تم نسخ كود التفعيل للحافظة', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const formattedDisplay = generatedCode.match(/.{1,5}/g)?.join('-') || generatedCode

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <Key size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">مولد أكواد التفعيل اليدوية (Offline)</h3>
              <p className="text-xs text-slate-500">للأجهزة والمنشآت غير المتصلة بالإنترنت مع تحديد سعة الأجهزة بدقة</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              كود الطلب من شاشة العميل (Request Code)
            </label>
            <input
              type="text"
              required
              value={requestCode}
              onChange={(e) => setRequestCode(e.target.value.toUpperCase())}
              placeholder="مثال: 7B199C1E48F02AA56E3BD8110"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">اسم المنشأة (اختياري)</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="محلات الأمل"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">مدة التفعيل (بالأيام)</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
              >
                <option value={30}>30 يوماً (شهر)</option>
                <option value={90}>90 يوماً (فصل)</option>
                <option value={180}>180 يوماً (نصف سنة)</option>
                <option value={365}>365 يوماً (سنة كاملة)</option>
                <option value={730}>730 يوماً (سنتان)</option>
                <option value={3650}>3650 يوماً (10 سنوات - دائم)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              عدد الأجهزة المصرح بها على الشبكة (Device Limit)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="65535"
                required
                value={devices}
                onChange={(e) => setDevices(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-600"
              />
              <div className="flex gap-1">
                {[1, 5, 10, 101].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setDevices(val)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors ${
                      devices === val
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            <span>{loading ? 'جاري التوقيع والتوليد...' : 'توليد كود التفعيل الرقمي (V2 مع سعة الأجهزة)'}</span>
          </button>

          {/* Generated Code Display */}
          {generatedCode && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>كود التفعيل الصالح (25 خانة):</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck size={14} /> مشفر وموقع رقمياً (V2)
                </span>
              </div>

              <div className="font-mono text-center text-lg font-bold tracking-widest text-amber-400 bg-black/40 py-2.5 px-3 rounded-lg border border-white/10 select-all">
                {formattedDisplay}
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <span>المدة: <strong className="text-white font-mono">{days}</strong> يوم</span>
                <span>الأجهزة المصرح بها: <strong className="text-emerald-400 font-mono">{devices}</strong> أجهزة</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'تم النسخ بنجاح' : 'نسخ كود التفعيل'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
