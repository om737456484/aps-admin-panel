import React, { useState, useEffect } from 'react'
import {
  Users, Plus, Search, Copy, Check, Calendar, Phone, Shield,
  MoreVertical, X, Clock, RefreshCw, Send, Sliders, CheckCircle2,
  AlertTriangle, Laptop, ChevronDown, ChevronUp, Edit3, Trash2,
  ExternalLink, Filter, ArrowUpDown
} from 'lucide-react'
import {
  apiFetchSubscribers, apiCreateSubscriber, apiUpdateSubscriber, apiDeleteSubscriber,
  apiExtendSubscriber, apiSetSubscriberExpiryDate, apiSetSubscriberDurationFromToday,
  apiUpdateSubscriberPlan, apiUpdateSubscriberStatus, apiFetchPlans, apiApproveDevice
} from '../services/supabaseClient'
import { useToast } from '../context/ToastContext'

function randomSubCode() {
  const num = Math.floor(10000 + Math.random() * 90000)
  return `APS-SUB-${num}`
}

export default function SubscribersView({ initialOpenAdd = false }) {
  const [subscribers, setSubscribers] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPlan, setFilterPlan] = useState('all')
  const [sortBy, setSortBy] = useState('created_desc')
  const [isAddOpen, setIsAddOpen] = useState(initialOpenAdd)
  const [expandedSubId, setExpandedSubId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const { showToast, confirm } = useToast()

  // Extension Modal State
  const [extendModalSub, setExtendModalSub] = useState(null)
  const [extendDaysInput, setExtendDaysInput] = useState(30)
  const [extendMode, setExtendMode] = useState('set_from_today')
  const [customDateInput, setCustomDateInput] = useState('')
  const [extending, setExtending] = useState(false)

  // Plan Edit Modal State
  const [planModalSub, setPlanModalSub] = useState(null)
  const [selectedPlanId, setSelectedPlanId] = useState('pro')
  const [customMaxDevices, setCustomMaxDevices] = useState('')
  const [customOfflineGraceDays, setCustomOfflineGraceDays] = useState('')
  const [updatingPlan, setUpdatingPlan] = useState(false)

  // Edit Subscriber Info Modal State
  const [editModalSub, setEditModalSub] = useState(null)
  const [editFormData, setEditFormData] = useState({
    company_name: '',
    owner_name: '',
    phone: '',
    email: '',
    notes: '',
  })
  const [updatingSub, setUpdatingSub] = useState(false)

  // Create Form State
  const [formData, setFormData] = useState({
    company_name: '',
    owner_name: '',
    phone: '',
    email: '',
    plan_id: 'pro',
    duration_days: 365,
    max_devices_override: '',
    offline_grace_days_override: '',
    notes: '',
    subscriber_code: randomSubCode(),
  })
  const [saving, setSaving] = useState(false)

  const getPlanDefaultOfflineGrace = (planId, subPlanObj = null) => {
    const fromSub = Number(subPlanObj?.offline_grace_days)
    if (Number.isFinite(fromSub) && fromSub >= 1) return fromSub
    const found = plans.find((p) => p.id === planId)
    const fromList = Number(found?.offline_grace_days)
    if (Number.isFinite(fromList) && fromList >= 1) return fromList
    return 30
  }

  const formatOfflineGraceDays = (days) => (Number(days) >= 36500 ? 'مفتوح' : `${days} يوم`)

  const loadData = async (isManual = false) => {
    setLoading(true)
    try {
      const [subsRes, plansRes] = await Promise.all([
        apiFetchSubscribers(),
        apiFetchPlans(),
      ])
      setSubscribers(subsRes?.data || [])
      setPlans(plansRes?.data || [])
      if (isManual) {
        showToast('تم تحديث قائمة المشتركين', 'success')
      }
    } catch (e) {
      console.error(e)
      showToast('خطأ أثناء تحميل البيانات: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(false)
  }, [])

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    showToast(`تم نسخ كود المشترك: ${code}`, 'success', 2000)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSendWhatsApp = (sub) => {
    if (!sub.phone) {
      showToast('لم يتم تسجيل رقم هاتف لهذا المشترك', 'warning')
      return
    }

    const cleanPhone = sub.phone.replace(/[^0-9]/g, '')
    const expDate = new Date(sub.expires_at).toLocaleDateString('ar-EG')
    const message = encodeURIComponent(
      `مرحباً بك في نظام عدن برايم سوفت المحاسبي (APS Accounting).\n\n` +
      `بيانات ترخيص منشأتكم (${sub.company_name}):\n` +
      `🔑 كود المشترك للتفعيل: ${sub.subscriber_code}\n` +
      `📦 الخطة: ${sub.license_plans?.name_ar || sub.plan_id}\n` +
      `📅 تاريخ الانتهاء: ${expDate}\n\n` +
      `يرجى إدخال كود المشترك في شاشة التفعيل لربط النظام السحابي فورياً.`
    )
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiCreateSubscriber(formData)
      showToast(`تم إنشاء اشتراك "${formData.company_name}" بنجاح`, 'success')
      setIsAddOpen(false)
      setFormData({
        company_name: '',
        owner_name: '',
        phone: '',
        email: '',
        plan_id: 'pro',
        duration_days: 365,
        max_devices_override: '',
        offline_grace_days_override: '',
        notes: '',
        subscriber_code: randomSubCode(),
      })
      await loadData()
    } catch (err) {
      showToast('فشل إنشاء المشترك: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleApproveDevice = async (dev, sub) => {
    const ok = await confirm({
      title: 'اعتماد وتفعيل الجهاز',
      message: `هل أنت متأكد من اعتماد الجهاز "${dev.device_name || dev.machine_fingerprint}" للمشترك "${sub.company_name}"؟\nسيتم احتسابه ضمن سعة الأجهزة المصرح بها.`,
      confirmText: 'نعم، اعتماد الجهاز',
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

  const handleQuickExtend = async (sub, days) => {
    const ok = await confirm({
      title: 'تأكيد تمديد الاشتراك',
      message: `هل تريد تمديد اشتراك "${sub.company_name}" بمقدار ${days} يوماً إضافية؟`,
      confirmText: 'نعم، تمديد الاشتراك',
    })
    if (!ok) return

    try {
      await apiExtendSubscriber(sub.id, days)
      showToast(`تم تمديد اشتراك "${sub.company_name}" بنجاح`, 'success')
      await loadData()
    } catch (e) {
      showToast('فشل التمديد: ' + e.message, 'error')
    }
  }

  const handleCustomExtendSubmit = async (e) => {
    e.preventDefault()
    if (!extendModalSub) return
    setExtending(true)

    try {
      if (extendMode === 'set_from_today') {
        await apiSetSubscriberDurationFromToday(extendModalSub.id, Number(extendDaysInput))
        showToast(`تم ضبط الصلاحية ${extendDaysInput} يوماً ابتداءً من اليوم`, 'success')
      } else if (extendMode === 'add_days') {
        await apiExtendSubscriber(extendModalSub.id, Number(extendDaysInput))
        showToast(`تمت إضافة ${extendDaysInput} يوماً إلى رصيد الاشتراك`, 'success')
      } else if (extendMode === 'exact_date') {
        if (!customDateInput) {
          showToast('يرجى تحديد تاريخ انتهاء صالح', 'warning')
          setExtending(false)
          return
        }
        await apiSetSubscriberExpiryDate(extendModalSub.id, customDateInput)
        showToast(`تم تعيين تاريخ الانتهاء بدقة: ${customDateInput}`, 'success')
      }

      setExtendModalSub(null)
      await loadData()
    } catch (err) {
      showToast('فشل التمديد: ' + err.message, 'error')
    } finally {
      setExtending(false)
    }
  }

  const handleEditInfoSubmit = async (e) => {
    e.preventDefault()
    if (!editModalSub) return
    setUpdatingSub(true)
    try {
      await apiUpdateSubscriber(editModalSub.id, editFormData)
      showToast('تم تحديث بيانات المنشأة بنجاح', 'success')
      setEditModalSub(null)
      await loadData()
    } catch (err) {
      showToast('فشل حفظ البيانات: ' + err.message, 'error')
    } finally {
      setUpdatingSub(false)
    }
  }

  const handlePlanSubmit = async (e) => {
    e.preventDefault()
    if (!planModalSub) return
    setUpdatingPlan(true)
    try {
      const graceArg = customOfflineGraceDays === '' ? null : Number(customOfflineGraceDays)
      await apiUpdateSubscriberPlan(planModalSub.id, selectedPlanId, customMaxDevices, graceArg)
      showToast('تم تحديث الخطة وعدد الأجهزة وفترة الأوفلاين بنجاح', 'success')
      setPlanModalSub(null)
      await loadData()
    } catch (err) {
      showToast('فشل تحديث الخطة: ' + err.message, 'error')
    } finally {
      setUpdatingPlan(false)
    }
  }

  const handleToggleStatus = async (sub) => {
    const isCurrentlyActive = sub.status === 'active' || sub.status === 'trial'
    const newStatus = isCurrentlyActive ? 'suspended' : 'active'
    const actionName = isCurrentlyActive ? 'إيقاف وتعطيل فوري (Kill-Switch)' : 'إعادة التفعيل'

    const ok = await confirm({
      title: `${actionName} للاشتراك`,
      message: `هل أنت متأكد من ${actionName} لاشتراك "${sub.company_name}"؟\nسيتم ${isCurrentlyActive ? 'حظر جميع أجهزة هذا المشترك فورياً من العمل' : 'إعادة فتح الصلاحيات لكافة أجهزة المشترك'}.`,
      confirmText: isCurrentlyActive ? 'نعم، إيقاف فوري' : 'نعم، تفعيل',
      isDanger: isCurrentlyActive,
    })
    if (!ok) return

    try {
      await apiUpdateSubscriberStatus(sub.id, newStatus)
      showToast(`تم ${isCurrentlyActive ? 'إيقاف' : 'تفعيل'} اشتراك "${sub.company_name}" بنجاح`, isCurrentlyActive ? 'warning' : 'success')
      await loadData()
    } catch (e) {
      showToast('فشل تحديث الحالة: ' + e.message, 'error')
    }
  }

  const handleDeleteSubscriber = async (sub) => {
    const ok = await confirm({
      title: 'حذف اشتراك المنشأة نهائياً',
      message: `تحذير: هل أنت متأكد من حذف اشتراك المنشأة "${sub.company_name}" (كود: ${sub.subscriber_code}) تماماً؟ سيتم فك ربط كافة الأجهزة التابعة لها.`,
      confirmText: 'نعم، حذف نهائي',
      cancelText: 'إلغاء التراجع',
      isDanger: true,
    })
    if (!ok) return

    try {
      await apiDeleteSubscriber(sub.id)
      showToast(`تم حذف اشتراك "${sub.company_name}" نهائياً`, 'info')
      await loadData()
    } catch (err) {
      showToast('فشل حذف المشترك: ' + err.message, 'error')
    }
  }

  // Filter & Search Logic
  const filtered = subscribers
    .filter((sub) => {
      const q = searchTerm.toLowerCase()
      const matchesSearch =
        (sub.company_name || '').toLowerCase().includes(q) ||
        (sub.subscriber_code || '').toLowerCase().includes(q) ||
        (sub.owner_name || '').toLowerCase().includes(q) ||
        (sub.phone || '').toLowerCase().includes(q)

      let matchesStatus = true
      if (filterStatus === 'active') matchesStatus = sub.status === 'active'
      else if (filterStatus === 'trial') matchesStatus = sub.status === 'trial'
      else if (filterStatus === 'suspended') matchesStatus = sub.status === 'suspended'
      else if (filterStatus === 'expiring') {
        const daysLeft = Math.ceil((new Date(sub.expires_at) - Date.now()) / 86400000)
        matchesStatus = daysLeft <= 7 && daysLeft >= 0 && sub.status !== 'suspended'
      }

      let matchesPlan = true
      if (filterPlan !== 'all') matchesPlan = sub.plan_id === filterPlan

      return matchesSearch && matchesStatus && matchesPlan
    })
    .sort((a, b) => {
      if (sortBy === 'created_desc') return new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'expiry_asc') return new Date(a.expires_at) - new Date(b.expires_at)
      if (sortBy === 'expiry_desc') return new Date(b.expires_at) - new Date(a.expires_at)
      if (sortBy === 'name') return (a.company_name || '').localeCompare(b.company_name || '')
      return 0
    })

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-96">
          <Search size={16} className="absolute right-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، كود المشترك، أو الهاتف..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 outline-none focus:border-blue-600 font-semibold"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">النشطون فقط</option>
            <option value="expiring">تنتهي قريباً (7 أيام)</option>
            <option value="trial">النسخ التجريبية</option>
            <option value="suspended">المعلقون فقط</option>
          </select>

          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 outline-none focus:border-blue-600 font-semibold"
          >
            <option value="all">كل الخطط</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name_ar} ({p.id.toUpperCase()})</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 outline-none focus:border-blue-600 font-semibold"
          >
            <option value="created_desc">الأحدث إضافة</option>
            <option value="expiry_asc">الأقرب انتهاءً</option>
            <option value="expiry_desc">الأبعد انتهاءً</option>
            <option value="name">اسم المنشأة</option>
          </select>

          <button
            onClick={() => loadData(true)}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* Subscribers Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-600 font-bold">
                <th className="py-3.5 pr-4">المنشأة والعميل</th>
                <th className="py-3.5 px-3">كود المشترك</th>
                <th className="py-3.5 px-3">الخطة والأجهزة</th>
                <th className="py-3.5 px-3">صلاحية الترخيص</th>
                <th className="py-3.5 px-3">الحالة</th>
                <th className="py-3.5 pl-4 text-left">إجراءات الإدارة السريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((sub) => {
                const daysLeft = Math.max(0, Math.ceil((new Date(sub.expires_at) - Date.now()) / 86400000))
                const isExpiring = daysLeft <= 7
                const isCopied = copiedId === sub.id
                const activeDevices = (sub.license_devices || []).filter(d => d.status === 'active').length
                const maxDevices = sub.max_devices_override || sub.license_plans?.max_devices || 1
                const planDefaultGrace = getPlanDefaultOfflineGrace(sub.plan_id, sub.license_plans)
                const hasCustomGrace =
                  sub.offline_grace_days_override !== null &&
                  sub.offline_grace_days_override !== undefined &&
                  sub.offline_grace_days_override !== ''
                const effectiveGrace = hasCustomGrace
                  ? Number(sub.offline_grace_days_override)
                  : (Number(sub.effective_offline_grace_days) || planDefaultGrace)
                const isExpanded = expandedSubId === sub.id
                const usagePercent = Math.min(100, Math.round((activeDevices / maxDevices) * 100))

                return (
                  <React.Fragment key={sub.id}>
                    <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}>
                      {/* Company Name & Owner */}
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="عرض أجهزة هذا المشترك"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{sub.company_name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                              <span>{sub.owner_name || 'بدون اسم مسؤول'}</span>
                              {sub.phone && (
                                <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-400 font-mono">
                                  <span>|</span>
                                  <span dir="ltr">{sub.phone}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Subscriber Code & Copy */}
                      <td className="py-4 px-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 font-mono text-blue-700 font-bold whitespace-nowrap">
                          <span dir="ltr">{sub.subscriber_code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(sub.subscriber_code, sub.id)}
                            className="text-blue-500 hover:text-blue-800 transition-colors"
                            title="نسخ كود المشترك"
                          >
                            {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>

                      {/* Plan & Devices Capacity Progress */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200 text-[10px] tracking-wider font-mono">
                            {sub.plan_id || 'PRO'}
                          </span>
                          <button
                            onClick={() => {
                              setPlanModalSub(sub)
                              setSelectedPlanId(sub.plan_id || 'pro')
                              setCustomMaxDevices(sub.max_devices_override || '')
                              setCustomOfflineGraceDays(sub.offline_grace_days_override ?? '')
                            }}
                            className="text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-slate-100"
                            title="تعديل الخطة وعدد الأجهزة وفترة الأوفلاين"
                          >
                            <Sliders size={13} />
                          </button>
                        </div>
                        {/* Device Progress Bar */}
                        <div className="mt-1.5 w-28">
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-0.5">
                            <span>{activeDevices} من {maxDevices}</span>
                            <span>{usagePercent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                usagePercent >= 100 ? 'bg-amber-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                        {/* Effective Offline Grace Badge */}
                        <div className="mt-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap ${
                              hasCustomGrace
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                            title={hasCustomGrace ? 'فترة عمل أوفلاين مخصصة لهذا المشترك' : 'موروثة من إعدادات الباقة'}
                          >
                            <Shield size={10} />
                            <span>{formatOfflineGraceDays(effectiveGrace)} ({hasCustomGrace ? 'مخصص' : 'الباقة'})</span>
                          </span>
                        </div>
                      </td>

                      {/* Expiry Date & Remaining Days */}
                      <td className="py-4 px-3">
                        <div className="font-mono text-slate-900 font-semibold">
                          {new Date(sub.expires_at).toLocaleDateString('ar-EG')}
                        </div>
                        <div className={`text-[11px] font-bold mt-0.5 flex items-center gap-1 ${
                          isExpiring ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          {isExpiring && <Clock size={12} className="animate-pulse" />}
                          <span>متبقي {daysLeft} يوم</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                          sub.status === 'active' || sub.status === 'trial'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            sub.status === 'active' || sub.status === 'trial' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          {sub.status === 'active' ? 'نشط' : (sub.status === 'trial' ? 'تجريبي' : 'معلق')}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 pl-4 text-left">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Send WhatsApp Message */}
                          <button
                            onClick={() => handleSendWhatsApp(sub)}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                            title="إرسال بيانات الترخيص عبر الواتساب"
                          >
                            <Send size={14} />
                          </button>

                          {/* Quick Extend Buttons */}
                          <button
                            onClick={() => handleQuickExtend(sub, 30)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-bold border border-slate-200 hover:border-blue-200 transition-colors"
                            title="تمديد 30 يوماً فورياً"
                          >
                            +30 يوم
                          </button>
                          <button
                            onClick={() => handleQuickExtend(sub, 365)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-[11px] font-bold border border-slate-200 hover:border-indigo-200 transition-colors"
                            title="تمديد سنة كاملة"
                          >
                            +سنة
                          </button>

                          {/* Custom Extension Button */}
                          <button
                            onClick={() => {
                              setExtendModalSub(sub)
                              setExtendDaysInput(30)
                              setCustomDateInput('')
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200"
                            title="تمديد مخصص"
                          >
                            تخصيص...
                          </button>

                          {/* Edit Subscriber Info */}
                          <button
                            onClick={() => {
                              setEditModalSub(sub)
                              setEditFormData({
                                company_name: sub.company_name || '',
                                owner_name: sub.owner_name || '',
                                phone: sub.phone || '',
                                email: sub.email || '',
                                notes: sub.notes || '',
                              })
                            }}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                            title="تعديل بيانات المنشأة"
                          >
                            <Edit3 size={13} />
                          </button>

                          {/* Kill-Switch Toggle */}
                          <button
                            onClick={() => handleToggleStatus(sub)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                              sub.status === 'active' || sub.status === 'trial'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {sub.status === 'active' || sub.status === 'trial' ? 'إيقاف فوري' : 'تفعيل'}
                          </button>

                          {/* Delete Subscriber */}
                          <button
                            onClick={() => handleDeleteSubscriber(sub)}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors"
                            title="حذف المشترك نهائياً"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Devices Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-50 border-y border-slate-200">
                        <td colSpan={6} className="py-4 px-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-xs text-blue-700 flex items-center gap-2">
                              <Laptop size={14} />
                              <span>الأجهزة ونقاط البيع المرتبطة بهذا المشترك ({sub.license_devices?.length || 0}):</span>
                            </span>
                            {sub.notes && (
                              <span className="text-[11px] text-slate-600 bg-white px-3 py-1 rounded-xl border border-slate-200">
                                ملاحظات: {sub.notes}
                              </span>
                            )}
                          </div>

                          {sub.license_devices && sub.license_devices.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {sub.license_devices.map((dev) => (
                                <div
                                  key={dev.id}
                                  className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-sm"
                                >
                                  <div>
                                    <div className="font-bold text-slate-900 text-xs">{dev.device_name || 'جهاز بدون اسم'}</div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 max-w-[180px] truncate">
                                      {dev.machine_fingerprint}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1">
                                      آخر اتصال: {new Date(dev.last_heartbeat_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {dev.status === 'pending' ? (
                                      <button
                                        onClick={() => handleApproveDevice(dev, sub)}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-sm transition-colors"
                                      >
                                        اعتماد
                                      </button>
                                    ) : null}
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      dev.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : dev.status === 'pending'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                      {dev.status === 'active' ? 'نشط' : dev.status === 'pending' ? 'بانتظار الاعتماد' : 'معلق'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
                              لم يتم ربط أي أجهزة بعد. يمكن تفعيل الأجهزة بإدخال كود المشترك <strong className="font-mono text-blue-600">{sub.subscriber_code}</strong> داخل البرنامج.
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    لا يوجد مشتركون مطابقون لشروط البحث المحددة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Subscriber */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">إضافة مشترك وترخيص جديد</h3>
                  <p className="text-xs text-slate-500">توليد اشتراك سحابي وكود تفعيل مباشر</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">اسم المنشأة أو المحل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سوبرماركت الأمل"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">اسم المسؤول / المالك</label>
                  <input
                    type="text"
                    placeholder="مثال: محمد علي"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">رقم الهاتف (واتساب)</label>
                  <input
                    type="text"
                    placeholder="مثال: 770000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">الخطة المحاسبية</label>
                  <select
                    value={formData.plan_id}
                    onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name_ar} ({p.id.toUpperCase()})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">مدة الاشتراك (بالأيام)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">أقصى عدد للأجهزة</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="افتراضي الخطة"
                    value={formData.max_devices_override}
                    onChange={(e) => setFormData({ ...formData, max_devices_override: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">كود المشترك المولد تلقائياً</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={formData.subscriber_code}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-blue-700 font-bold font-mono outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, subscriber_code: randomSubCode() })}
                      className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                      title="توليد كود آخر"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  فترة الأوفلاين المخصصة (اختياري)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="36500"
                    placeholder={`افتراضي الباقة (${formatOfflineGraceDays(getPlanDefaultOfflineGrace(formData.plan_id))})`}
                    value={formData.offline_grace_days_override}
                    onChange={(e) => setFormData({ ...formData, offline_grace_days_override: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono"
                  />
                  {formData.offline_grace_days_override !== '' && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, offline_grace_days_override: '' })}
                      className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold whitespace-nowrap border border-slate-200"
                    >
                      افتراضي الباقة
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[7, 14, 30, 60, 90].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData({ ...formData, offline_grace_days_override: String(d) })}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                        Number(formData.offline_grace_days_override) === d
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {d} يوم
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, offline_grace_days_override: '36500' })}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                      Number(formData.offline_grace_days_override) >= 36500
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    دائم (36500)
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  اتركه فارغاً ليرث المشترك افتراضي الباقة ({formatOfflineGraceDays(getPlanDefaultOfflineGrace(formData.plan_id))}) تلقائياً.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">ملاحظات داخلية</label>
                <textarea
                  rows="2"
                  placeholder="ملاحظات حول طريقة السداد، مكان المحل..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2"
                >
                  {saving && <RefreshCw size={14} className="animate-spin" />}
                  <span>إنشاء المشترك</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Subscriber Info */}
      {editModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm">تعديل بيانات: {editModalSub.company_name}</h3>
              <button onClick={() => setEditModalSub(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditInfoSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم المنشأة *</label>
                <input
                  type="text"
                  required
                  value={editFormData.company_name}
                  onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم المسؤول</label>
                <input
                  type="text"
                  value={editFormData.owner_name}
                  onChange={(e) => setEditFormData({ ...editFormData, owner_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات</label>
                <textarea
                  rows="2"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalSub(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 font-semibold hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={updatingSub}
                  className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Custom Extension */}
      {extendModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-blue-600" />
                <h3 className="font-bold text-sm">تمديد اشتراك: {extendModalSub.company_name}</h3>
              </div>
              <button onClick={() => setExtendModalSub(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCustomExtendSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl font-bold">
                <button
                  type="button"
                  onClick={() => setExtendMode('set_from_today')}
                  className={`py-2 rounded-lg transition-colors text-center ${
                    extendMode === 'set_from_today' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  المدة من اليوم
                </button>
                <button
                  type="button"
                  onClick={() => setExtendMode('add_days')}
                  className={`py-2 rounded-lg transition-colors text-center ${
                    extendMode === 'add_days' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  إضافة أيام (+رصيد)
                </button>
                <button
                  type="button"
                  onClick={() => setExtendMode('exact_date')}
                  className={`py-2 rounded-lg transition-colors text-center ${
                    extendMode === 'exact_date' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  تاريخ محدد
                </button>
              </div>

              {extendMode === 'exact_date' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">اختر تاريخ الانتهاء الجديد:</label>
                  <input
                    type="date"
                    required
                    value={customDateInput}
                    onChange={(e) => setCustomDateInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    {extendMode === 'set_from_today' ? 'عدد الأيام من تاريخ اليوم:' : 'عدد الأيام الإضافية:'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      required
                      value={extendDaysInput}
                      onChange={(e) => setExtendDaysInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-sm outline-none focus:border-blue-600"
                    />
                    <div className="flex gap-1">
                      {[14, 30, 90, 365].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setExtendDaysInput(d)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold"
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExtendModalSub(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 font-semibold hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={extending}
                  className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  تأكيد التمديد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Plan & Devices */}
      {planModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-blue-600" />
                <h3 className="font-bold text-sm">تعديل الخطة والأجهزة: {planModalSub.company_name}</h3>
              </div>
              <button onClick={() => setPlanModalSub(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePlanSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">الخطة المحاسبية:</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-600"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name_ar} ({p.id.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  أقصى عدد للأجهزة (اتركه فارغاً لاعتماد حد الخطة):
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="مثال: 5"
                  value={customMaxDevices}
                  onChange={(e) => setCustomMaxDevices(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block font-semibold text-slate-700">
                    فترة الأوفلاين المخصصة (أيام):
                  </label>
                  {customOfflineGraceDays !== '' && (
                    <button
                      type="button"
                      onClick={() => setCustomOfflineGraceDays('')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      استخدام افتراضي الباقة
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min="1"
                  max="36500"
                  placeholder={`افتراضي الباقة (${formatOfflineGraceDays(getPlanDefaultOfflineGrace(selectedPlanId))})`}
                  value={customOfflineGraceDays}
                  onChange={(e) => setCustomOfflineGraceDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono outline-none focus:border-blue-600"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[7, 14, 30, 60, 90].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setCustomOfflineGraceDays(String(d))}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                        Number(customOfflineGraceDays) === d
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {d} يوم
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCustomOfflineGraceDays('36500')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                      Number(customOfflineGraceDays) >= 36500
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    دائم (36500)
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  تُرك فارغاً = يرث افتراضي الباقة ({formatOfflineGraceDays(getPlanDefaultOfflineGrace(selectedPlanId))})
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPlanModalSub(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 font-semibold hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={updatingPlan}
                  className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  تحديث الخطة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
