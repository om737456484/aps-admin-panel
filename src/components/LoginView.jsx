import React, { useState } from 'react'
import { Shield, Lock, Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { apiLogin, getStoredConfig } from '../services/supabaseClient'

export default function LoginView({ onLoginSuccess, onOpenConfig }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const config = getStoredConfig()
  const isConfigured = Boolean(config.url && config.key)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await apiLogin(email.trim(), password)
      if (res?.success) {
        onLoginSuccess?.(res.session)
      } else {
        setError(res?.error || 'بيانات الدخول غير صحيحة')
      }
    } catch (err) {
      setError(err?.message || 'تعذر تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 text-center text-white relative">
          <div className="w-16 h-16 bg-blue-500/20 border border-blue-400/30 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-inner">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">عدن برايم سوفت (APS)</h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">بوابة إدارة التراخيص والمشتركين السحابية</p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Quick Demo Autofill Notice */}
            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/60 text-blue-900 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold">حساب الإدارة الافتراضي:</span>
                <div className="text-[11px] font-mono text-blue-700 mt-0.5">admin@adenprime.com | admin123</div>
              </div>
              <button
                type="button"
                onClick={() => { setEmail('admin@adenprime.com'); setPassword('admin123') }}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors shadow-sm"
              >
                تعبئة تلقائية
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                البريد الإلكتروني للإدارة
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@adenprime.com"
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800"
                />
                <Mail size={18} className="absolute right-3.5 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800 font-mono"
                />
                <Lock size={18} className="absolute right-3.5 top-3 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري التحقق من الهوية...</span>
                </>
              ) : (
                <>
                  <span>تسجيل الدخول للوحة التحكم</span>
                  <ArrowLeft size={16} />
                </>
              )}
            </button>
          </form>

          {/* Configuration Status / Quick Link */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{isConfigured ? 'الربط السحابي مهيأ' : 'بيانات الربط غير مكتملة'}</span>
            </div>
            <button
              type="button"
              onClick={onOpenConfig}
              className="text-blue-600 hover:underline font-medium"
            >
              إعدادات الاتصال (Supabase)
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-500 text-center">
        جميع الحقوق محفوظة &copy; 2026 عدن برايم سوفت (APS Accounting & ERP)
      </p>
    </div>
  )
}
