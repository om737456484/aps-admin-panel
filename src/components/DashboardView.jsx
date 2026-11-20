import React, { useEffect, useState } from 'react'
import {
  Users, Laptop, Clock, ShieldCheck, ArrowUpRight, Plus, RefreshCw,
  CheckCircle2, AlertTriangle, Activity, Zap, Server, ChevronLeft,
  Copy, Check, ShieldAlert, Sparkles, Sliders
} from 'lucide-react'
import { apiFetchStats, apiFetchDevices, apiUpdateDeviceStatus, apiApproveDevice, apiRejectDevice } from '../services/supabaseClient'
import { useToast } from '../context/ToastContext'

export default function DashboardView({ onNavigate }) {
  const [stats, setStats] = useState(null)
  const [recentDevices, setRecentDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)
  const { showToast, confirm } = useToast()

  const loadData = async (isManual = false) => {
    setLoading(true)
    try {
      const [s, d] = await Promise.all([
        apiFetchStats(),
        apiFetchDevices(),
      ])
      setStats(s)
      setRecentDevices((d?.data || []).slice(0, 6))
      if (isManual) {
        showToast('تم تحديث بيانات ومؤشرات النظام بنجاح', 'success')
      }
    } catch (e) {
      console.error(e)
      showToast('تعذر تحديث البيانات: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(false)
  }, [])

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    showToast(`تم نسخ البصمة: ${text}`, 'success', 2000)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleToggleDeviceStatus = async (dev) => {
    const isCurrentlyActive = dev.status === 'active'
    const newStatus = isCurrentlyActive ? 'suspended' : 'active'
    const actionName = isCurrentlyActive ? 'إيقاف وتعطيل فوري (Kill-Switch)' : 'إعادة تفعيل'

    const ok = await confirm({
      title: `${actionName} للجهاز`,
      message: `هل أنت متأكد من ${actionName} للجهاز "${dev.device_name || dev.machine_fingerprint}"؟\nسيتم ${
        isCurrentlyActive ? 'حظر هذا الجهاز فورياً من فتح واستخدام البرنامج' : 'السماح للجهاز بالعمل ومزامنة التراخيص'
      }.`,
      confirmText: isCurrentlyActive ? 'نعم، إيقاف الجهاز' : 'نعم، تفعيل الجهاز',
      isDanger: isCurrentlyActive,
    })
    if (!ok) return

    try {
      await apiUpdateDeviceStatus(dev.id, newStatus)
      showToast(`تم ${isCurrentlyActive ? 'إيقاف' : 'تفعيل'} الجهاز بنجاح`, isCurrentlyActive ? 'warning' : 'success')
      await loadData()
    } catch (e) {
      showToast('فشل تحديث حالة الجهاز: ' + e.message, 'error')
    }
  }

  const handleApproveDevice = async (dev) => {
    const ok = await confirm({
      title: 'اعتماد وتفعيل الجهاز',
      message: `هل أنت متأكد من اعتماد وتفعيل الجهاز "${dev.device_name || dev.machine_fingerprint}" للمشترك "${dev.subscriber?.company_name || 'المنشأة'}"؟\nسيتم احتساب هذا الجهاز ضمن سعة المشترك والسماح له بالدخول فوراً.`,
      confirmText: 'نعم، اعتماد وتفعيل الجهاز',
      isDanger: false,
    })
    if (!ok) return

    try {
      await apiApproveDevice(dev.id)
      showToast('تم اعتماد وتفعيل الجهاز بنجاح ✓', 'success')
      await loadData()
    } catch (e) {
      showToast('تعذر اعتماد الجهاز: ' + e.message, 'error')
    }
  }

  const handleRejectDevice = async (dev) => {
    const ok = await confirm({
      title: 'رفض طلب تسجيل الجهاز',
      message: `هل أنت متأكد من رفض طلب الجهاز "${dev.device_name || dev.machine_fingerprint}"؟\nلن يتمكن هذا الجهاز من تفعيل الترخيص.`,
      confirmText: 'نعم، رفض الطلب',
      isDanger: true,
    })
    if (!ok) return

    try {
      await apiRejectDevice(dev.id)
      showToast('تم رفض طلب تسجيل الجهاز', 'warning')
      await loadData()
    } catch (e) {
      showToast('تعذر رفض الجهاز: ' + e.message, 'error')
    }
  }

  const pendingDevicesList = recentDevices.filter(d => d.status === 'pending')

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Welcome / Overview Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white rounded-2xl border border-blue-100 p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-bold mb-2.5">
              <Sparkles size={13} className="text-blue-600" />
              <span>نظام التراخيص السحابي المتكامل</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              لوحة التحكم والإدارة السحابية
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              مراقبة التراخيص والأجهزة المتصلة ونقاط البيع، إصدار الأكواد وتجديد الاشتراكات فورياً، وإدارة مفاتيح الإيقاف الفوري (Kill-Switch).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => loadData(true)}
              className="p-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-sm transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin text-blue-600' : ''} />
            </button>
            <button
              onClick={() => onNavigate('subscribers', { openAdd: true })}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
            >
              <Plus size={18} />
              <span>إضافة مشترك جديد</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pending Devices Approvals Card (Model 1 Two-Step Flow) */}
      {(pendingDevicesList.length > 0 || (stats?.pendingDevices || 0) > 0) && (
        <div className="bg-amber-50/70 border-2 border-amber-300/80 rounded-2xl p-5 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
                <Clock size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-amber-950">
                    طلبات تفعيل أجهزة جديدة بانتظار الاعتماد والموافقة
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-extrabold text-xs font-mono">
                    {pendingDevicesList.length || stats?.pendingDevices || 1} طلب معلق
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-0.5">
                  وفق نموذج الترخيص المحكم (Model 1): لا يتم تفعيل أي جهاز إضافي تلقائياً بنفس الكود حتى يقوم مدير النظام باعتماده صراحة.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('devices', { filter: 'pending' })}
              className="px-4 py-2 rounded-xl bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 text-xs font-bold transition-colors self-start sm:self-auto shrink-0"
            >
              عرض كافة الأجهزة المعلقة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(pendingDevicesList.length > 0 ? pendingDevicesList : recentDevices.filter(d => d.status === 'pending')).map((dev) => (
              <div
                key={dev.id}
                className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Laptop size={15} className="text-amber-600" />
                      {dev.device_name || 'جهاز بدون اسم'}
                    </span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                      {dev.os_info || 'Windows'}
                    </span>
                  </div>

                  <div className="mt-2 text-xs flex items-center justify-between text-slate-600">
                    <span>المنشأة: <strong className="text-slate-900">{dev.subscriber?.company_name || 'مشترك'}</strong></span>
                    <span className="font-mono text-blue-600 font-semibold">{dev.subscriber?.subscriber_code}</span>
                  </div>

                  <div className="mt-1 text-[11px] text-slate-400 font-mono truncate" title={dev.machine_fingerprint}>
                    البصمة: {dev.machine_fingerprint}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleRejectDevice(dev)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-colors"
                  >
                    رفض الطلب
                  </button>
                  <button
                    onClick={() => handleApproveDevice(dev)}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    <span>اعتماد وتفعيل الجهاز</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Subscribers */}
        <div
          onClick={() => onNavigate('subscribers')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي المشتركين</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {stats?.totalSubscribers ?? '—'}
            </span>
            <span className="text-xs font-semibold text-slate-500">منشأة مسجلة</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">الاشتراكات النشطة:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px]">
              {stats?.activeSubscribers ?? 0} نشط
            </span>
          </div>
        </div>

        {/* Card 2: Devices */}
        <div
          onClick={() => onNavigate('devices')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">الأجهزة المرخصة</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Laptop size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {stats?.totalDevices ?? '—'}
            </span>
            <span className="text-xs font-semibold text-slate-500">كمبيوتر وكاشير</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">المتصلة الآن:</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {stats?.onlineDevices ?? stats?.activeDevices ?? 0} متصل
            </span>
          </div>
        </div>

        {/* Card 3: Expiring Soon */}
        <div
          onClick={() => onNavigate('subscribers')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">تنتهي خلال 7 أيام</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${
              (stats?.expiringSoon || 0) > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}>
              {stats?.expiringSoon ?? 0}
            </span>
            <span className="text-xs font-semibold text-slate-500">اشتراكات للتجديد</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">الإجراء المطلوب:</span>
            <span className={`font-bold text-[11px] ${
              (stats?.expiringSoon || 0) > 0 ? 'text-amber-600' : 'text-slate-500'
            }`}>
              {(stats?.expiringSoon || 0) > 0 ? 'متابعة وتمديد فوري' : 'لا توجد انتهاءات قريبة'}
            </span>
          </div>
        </div>

        {/* Card 4: Cloud Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">حالة الخادم السحابي</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-700 tracking-tight">
              {stats?.isLive ? 'Supabase متصل' : 'وضع المعاينة'}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            {stats?.isLive ? 'التزامن التلقائي ونبض التراخيص نشطان.' : 'اتصل بـ Supabase لمزامنة فعلية.'}
          </div>
        </div>
      </div>

      {/* Main Grid: Live Devices Stream + Features Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Devices Stream */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Laptop size={18} className="text-blue-600" />
                  <span>آخر الأجهزة النشطة (Live Heartbeat)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  أجهزة نقاط البيع وكواشير المحلات المتصلة بالنظام حالياً
                </p>
              </div>
              <button
                onClick={() => onNavigate('devices')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <span>عرض الكل</span>
                <ChevronLeft size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-600 font-bold">
                    <th className="py-3 pr-3 rounded-r-lg">الجهاز</th>
                    <th className="py-3 px-3">المشترك</th>
                    <th className="py-3 px-3">النظام</th>
                    <th className="py-3 px-3">آخر اتصال</th>
                    <th className="py-3 px-3">الحالة</th>
                    <th className="py-3 pl-3 text-left rounded-l-lg">التحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentDevices.map((dev) => {
                    const lastSeen = new Date(dev.last_heartbeat_at)
                    const diffMs = Date.now() - lastSeen.getTime()
                    const isOnline = diffMs < 300000
                    const isCopied = copiedId === dev.id

                    return (
                      <tr key={dev.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 pr-3 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                            <div>
                              <div className="text-slate-900 font-bold">{dev.device_name || 'جهاز بدون اسم'}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-slate-500 font-mono max-w-[140px] truncate" title={dev.machine_fingerprint}>
                                  {dev.machine_fingerprint}
                                </span>
                                <button
                                  onClick={() => handleCopy(dev.machine_fingerprint, dev.id)}
                                  className="text-slate-400 hover:text-blue-600"
                                  title="نسخ بصمة الجهاز"
                                >
                                  {isCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-slate-900">{dev.subscriber?.company_name || 'مشترك'}</div>
                          <div className="text-[10px] text-blue-600 font-mono">{dev.subscriber?.subscriber_code}</div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 font-mono text-[11px]">
                          {dev.os_info || 'Windows'}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 text-[11px]">
                          <div>{lastSeen.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="text-[10px] text-slate-400">{isOnline ? 'متصل الآن' : 'غير متصل'}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            dev.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : dev.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {dev.status === 'active' ? (isOnline ? 'متصل' : 'نشط') : dev.status === 'pending' ? 'بانتظار الاعتماد' : 'معلق'}
                          </span>
                        </td>
                        <td className="py-3.5 pl-3 text-left">
                          {dev.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveDevice(dev)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                              >
                                اعتماد
                              </button>
                              <button
                                onClick={() => handleRejectDevice(dev)}
                                className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 transition-colors"
                              >
                                رفض
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleToggleDeviceStatus(dev)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                                dev.status === 'active'
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {dev.status === 'active' ? 'إيقاف فوري' : 'تفعيل'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}

                  {recentDevices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                        لا توجد أجهزة مسجلة بعد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Features Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-2.5">
              <Zap size={18} />
              <span>ميزات نظام التراخيص الهجين</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              نظام أمان محاسبي هجين يجمع بين مرونة العمل بدون إنترنت والتحكم السحابي الكامل:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">التفعيل الذاتي السريع:</strong>
                  <span className="text-slate-600 text-[11px]">يمنح المشترك كود التفعيل ويقوم البرنامج بربط الجهاز وضبط الحساب تلقائياً.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">حماية الأوفلاين 14 يوماً:</strong>
                  <span className="text-slate-600 text-[11px]">يواصل البرنامج العمل في حال انقطاع الإنترنت عبر التوكن المشفر محلياً.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">الإيقاف الفوري (Kill-Switch):</strong>
                  <span className="text-slate-600 text-[11px]">تعطيل فوري للجهاز أو المشترك بنقرة زر في حال التأخر عن السداد أو السرقة.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
            <button
              onClick={() => onNavigate('plans')}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>تعديل الخطط</span>
              <ArrowUpRight size={14} />
            </button>
            <button
              onClick={() => onNavigate('logs')}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>سجل التدقيق</span>
              <Activity size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
