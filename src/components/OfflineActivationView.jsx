import React, { useState } from 'react'
import {
  KeyRound, ShieldCheck, Download, Copy, Check, AlertCircle, FileText,
  RefreshCw, Eye, EyeOff, Lock
} from 'lucide-react'
import { getSupabase, generateOfflineCodeBrowser, safeAuditLog } from '../services/supabaseClient'

export default function OfflineActivationView() {
  const hasEnvSecret = Boolean(import.meta.env.VITE_LICENSE_AUTHORITY_SECRET)
  const [requestCode, setRequestCode] = useState('')
  const [parsedRequest, setParsedRequest] = useState(null)
  const [parseError, setParseError] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [durationDays, setDurationDays] = useState(365)
  const [maxDevices, setMaxDevices] = useState(3)
  const [companyName, setCompanyName] = useState('')
  const [signingSecret, setSigningSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResult, setGeneratedResult] = useState(null)
  const [copiedCert, setCopiedCert] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  // Handle parsing Request Code
  const handleParseCode = () => {
    setParseError('')
    setGenerateError('')
    setParsedRequest(null)
    setGeneratedResult(null)
    const clean = requestCode.trim()
    if (!clean) {
      setParseError('يرجى إدخال رمز طلب التفعيل (Request Code)')
      return
    }

    try {
      // 1. Try JSON / Base64 format
      if (clean.startsWith('{') || clean.startsWith('eyJ')) {
        let jsonStr = clean
        if (clean.startsWith('eyJ')) {
          jsonStr = atob(clean)
        }
        const data = JSON.parse(jsonStr)
        setParsedRequest({
          type: 'json_payload',
          installationId: data.installation_id || data.machine_code || data.inst_id || 'UNKNOWN',
          appVersion: data.app_version || '2.0',
          product: data.product || 'APS_ACCOUNTING',
          raw: clean
        })
        if (data.company_name) setCompanyName(data.company_name)
        return
      }

      // 2. Standard Challenge Code (alphanumeric hash or delimited)
      setParsedRequest({
        type: 'challenge_code',
        installationId: clean.toUpperCase(),
        appVersion: '2.0',
        product: 'APS_ACCOUNTING',
        raw: clean
      })
    } catch (e) {
      setParseError('صيغة رمز الطلب غير صحيحة: ' + e.message)
    }
  }

  // Handle Generating Compatible V2 Offline Activation Code & Certificate
  const handleGenerateLicense = async () => {
    if (!parsedRequest) return
    setGenerateError('')
    if (!hasEnvSecret && !signingSecret.trim()) {
      setGenerateError('يرجى إدخال مفتاح التوقيع الإداري (Signing Secret) لتوليد كود تفعيل متوافق.')
      return
    }
    setIsGenerating(true)
    try {
      const days = Math.max(1, Math.min(65535, Number(durationDays) || 365))
      const devices = Math.max(1, Math.min(65535, Number(maxDevices) || 1))
      const now = new Date()
      const expiresAt = new Date(now.getTime() + days * 86400000)

      const rawCode = await generateOfflineCodeBrowser({
        requestCode: parsedRequest.installationId,
        daysGranted: days,
        maxDevices: devices,
        secret: signingSecret.trim() || undefined,
      })
      const friendlyCode = rawCode.match(/.{1,5}/g)?.join('-') || rawCode
      const resolvedCompany = companyName.trim() || 'شركة محلية معتمدة'
      const expiresAtLabel = expiresAt.toLocaleDateString('ar-EG')

      const certificateText = [
        '==================================================',
        '  APS Accounting — شهادة التفعيل اليدوي (V2)',
        '==================================================',
        `المنشأة / العميل: ${resolvedCompany}`,
        `الخطة التجارية: ${selectedPlan.toUpperCase()}`,
        `كود التفعيل (25 خانة): ${friendlyCode}`,
        `رمز الطلب (Request Code): ${parsedRequest.installationId}`,
        `المدة المصرح بها: ${days} يوم`,
        `الحد الأقصى للأجهزة: ${devices}`,
        `تاريخ الإصدار: ${now.toISOString().slice(0, 10)}`,
        `تاريخ الانتهاء التقديري: ${expiresAt.toISOString().slice(0, 10)}`,
        '==================================================',
        'أدخل كود التفعيل أعلاه في تبويب "التفعيل اليدوي (Offline)" داخل برنامج APS.',
      ].join('\n')

      setGeneratedResult({
        rawCode,
        friendlyCode,
        certificateText,
        companyName: resolvedCompany,
        planId: selectedPlan,
        durationDays: days,
        maxDevices: devices,
        expiresAt: expiresAtLabel,
      })

      // Record in Supabase audit using canonical schema columns
      const sb = getSupabase()
      if (sb) {
        await safeAuditLog(sb, {
          event_type: 'offline_license_issued',
          details: {
            installation_id: parsedRequest.installationId,
            company_name: resolvedCompany,
            plan_id: selectedPlan,
            duration_days: days,
            max_devices: devices,
          },
        })
      }
    } catch (err) {
      setGenerateError('حدث خطأ أثناء إصدار الترخيص: ' + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle Download Activation Certificate (.txt)
  const handleDownloadCertificate = () => {
    if (!generatedResult) return
    const blob = new Blob([generatedResult.certificateText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `APS-ACTIVATION-${parsedRequest?.installationId?.replace(/[^A-Z0-9]/gi, '').slice(0, 8) || 'V2'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full space-y-6 select-none animate-fadeIn">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
            <KeyRound size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إصدار التفعيل اليدوي (Offline Activation)</h1>
            <p className="text-sm text-slate-500 font-medium">توليد أكواد التفعيل اليدوية المتوافقة (V2) للتفعيل دون اتصال بالإنترنت</p>
          </div>
        </div>
      </div>

      {/* Step 1: Input Request Code */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-black">1</span>
          <h3>رمز طلب التفعيل من جهاز العميل (Request Code)</h3>
        </div>

        <div className="space-y-2">
          <textarea
            dir="ltr"
            value={requestCode}
            onChange={(e) => setRequestCode(e.target.value)}
            rows={3}
            placeholder="00DTM-BKX52-8JS88-EIEXG-L8JCL"
            className="w-full px-4 py-3 text-sm font-mono border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-left"
          />
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <button
              onClick={handleParseCode}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-blue-500/20 flex items-center gap-2"
            >
              <RefreshCw size={14} /> فحص وتحليل رمز الطلب
            </button>
            {parseError && (
              <span className="text-xs text-rose-600 font-bold flex items-center gap-1">
                <AlertCircle size={14} /> {parseError}
              </span>
            )}
          </div>
        </div>

        {parsedRequest && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <ShieldCheck size={24} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold">تم التحقق من صحة رمز الطلب بنجاح</p>
                <p className="text-xs font-mono text-emerald-700 mt-0.5" dir="ltr">
                  {parsedRequest.installationId}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
              {parsedRequest.product} v{parsedRequest.appVersion}
            </span>
          </div>
        )}
      </div>

      {/* Step 2: License Specifications */}
      {parsedRequest && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-black">2</span>
            <h3>تحديد مواصفات وشروط الترخيص الصادر</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المنشأة / العميل</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="مثال: شركة النجم للتجارة"
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الخطة التجارية</label>
              <select
                value={selectedPlan}
                onChange={(e) => {
                  setSelectedPlan(e.target.value)
                  if (e.target.value === 'lifetime') {
                    setDurationDays(36500)
                  } else if (e.target.value === 'enterprise') {
                    setDurationDays(365)
                    setMaxDevices(10)
                  } else if (e.target.value === 'pro') {
                    setDurationDays(365)
                    setMaxDevices(3)
                  } else if (e.target.value === 'starter') {
                    setDurationDays(365)
                    setMaxDevices(1)
                  }
                }}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
              >
                <option value="starter">الباقة الفردية (Starter) - جهاز واحد</option>
                <option value="pro">الباقة المهنية (Pro) - 3 أجهزة</option>
                <option value="enterprise">باقة الشركات (Enterprise) - 10 أجهزة</option>
                <option value="lifetime">الترخيص الدائم (Lifetime)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">مدة الترخيص (بالأيام)</label>
              <input
                type="number"
                min="1"
                max="65535"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الحد الأقصى للأجهزة (Seats)</label>
              <input
                type="number"
                min="1"
                max="65535"
                value={maxDevices}
                onChange={(e) => setMaxDevices(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Lock size={13} className="text-slate-500" />
                <span>
                  مفتاح التوقيع الإداري (Signing Secret){hasEnvSecret ? ' — اختياري (مضبوط في البيئة)' : ' *'}
                </span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  dir="ltr"
                  value={signingSecret}
                  onChange={(e) => setSigningSecret(e.target.value)}
                  placeholder={hasEnvSecret ? 'اتركه فارغاً لاستخدام المفتاح المضبوط في البيئة' : 'أدخل مفتاح التوقيع المعتمد لنظام APS'}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-left"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title={showSecret ? 'إخفاء المفتاح' : 'إظهار المفتاح'}
                >
                  {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {generateError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{generateError}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleGenerateLicense}
              disabled={isGenerating}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-emerald-600/25 flex items-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck size={18} /> {isGenerating ? 'جاري توقيع وإصدار الكود...' : 'إصدار كود التفعيل المعتمد (V2)'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generated Result */}
      {generatedResult && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-md space-y-6">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-black">3</span>
            <h3>كود التفعيل الموقّع رقمياً (V2)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Compatible 25-char V2 Activation Code */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-slate-700">كود التفعيل السريع (25 حرفاً - V2)</span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded whitespace-nowrap">للإملاء بالهاتف والواتساب</span>
              </div>
              <div
                dir="ltr"
                className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-center text-lg font-black tracking-widest text-slate-900 select-all"
              >
                {generatedResult.friendlyCode}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
                <span>المدة: <strong className="font-mono text-slate-900">{generatedResult.durationDays}</strong> يوم</span>
                <span>الأجهزة: <strong className="font-mono text-slate-900">{generatedResult.maxDevices}</strong></span>
                <span>ينتهي: <strong className="font-mono text-slate-900">{generatedResult.expiresAt}</strong></span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedResult.friendlyCode)
                  setCopiedCode(true)
                  setTimeout(() => setCopiedCode(false), 2000)
                }}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copiedCode ? 'تم النسخ بنجاح' : 'نسخ كود التفعيل'}
              </button>
            </div>

            {/* Downloadable Activation Certificate (.txt) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <FileText size={14} className="text-emerald-600" />
                  <span>شهادة التفعيل النصية (.txt)</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded whitespace-nowrap">متوافق مع APS</span>
              </div>
              <div className="text-xs text-slate-600 font-medium leading-relaxed">
                شهادة نصية جاهزة للإرسال للعميل تتضمن كود التفعيل المعتمد (V2)، اسم المنشأة، الخطة، عدد الأجهزة المصرح بها، وتاريخ الانتهاء.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadCertificate}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download size={14} /> تنزيل شهادة التفعيل (.txt)
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedResult.certificateText)
                    setCopiedCert(true)
                    setTimeout(() => setCopiedCert(false), 2000)
                  }}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center"
                  title="نسخ نص الشهادة الكامل"
                >
                  {copiedCert ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
