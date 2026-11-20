import React, { useState, useEffect } from 'react'
import {
  Laptop, Search, Shield, Ban, CheckCircle, RefreshCw, Copy, Check,
  Trash2, PowerOff, ShieldAlert, Edit2, Filter, Wifi, WifiOff, Clock
} from 'lucide-react'
import {
  apiFetchDevices, apiUpdateDeviceStatus, apiDeleteDevice, apiRenameDevice,
  apiApproveDevice, apiRejectDevice
} from '../services/supabaseClient'
import { useToast } from '../context/ToastContext'

export default function DevicesView() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSubscriber, setFilterSubscriber] = useState('all')
  const [copiedId, setCopiedId] = useState(null)

  // Rename modal
  const [renameModalDev, setRenameModalDev] = useState(null)
  const [newDeviceName, setNewDeviceName] = useState('')
  const [renaming, setRenaming] = useState(false)

  const { showToast, confirm } = useToast()

  const loadData = async (isManual = false) => {
    setLoading(true)
    try {
      const res = await apiFetchDevices()
      setDevices(res?.data || [])
      if (isManual) {
        showToast('تم تحديث قائمة الأجهزة', 'success')
      }
    } catch (e) {
      console.error(e)
      showToast('خطأ أثناء تحميل الأجهزة: ' + e.message, 'error')
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

  const handleToggleStatus = async (dev) => {
    const isCurrentlyActive = dev.status === 'active'
    const newStatus = isCurrentlyActive ? 'suspended' : 'active'
    const actionName = isCurrentlyActive ? 'إيقاف وتعطيل فوري (Kill-Switch)' : 'إعادة التفعيل'

    const ok = await confirm({
      title: `${actionName} للجهاز`,
      message: `هل أنت متأكد من ${actionName} للجهاز "${dev.device_name || dev.machine_fingerprint}"؟\nسيتم ${
        isCurrentlyActive ? 'حظر هذا الجهاز فورياً من فتح البرنامج واستخدامه' : 'السماح للجهاز بالعمل ومزامنة التراخيص'
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

  const handleDelete = async (dev) => {
    const ok = await confirm({
      title: 'فك ربط الجهاز وحذفه',
      message: `تحذير: هل أنت متأكد من فك ربط الجهاز "${dev.device_name || dev.machine_fingerprint}"؟\nسيؤدي هذا إلى إخلاء خانة جهاز جديدة للمشترك "${dev.subscriber?.company_name || ''}" ليتمكن من ربط جهاز بديل.`,
      confirmText: 'نعم، فك الربط والحذف',
      isDanger: true,
    })
    if (!ok) return

    try {
      await apiDeleteDevice(dev.id)
      showToast('تم فك ربط الجهاز بنجاح وإخلاء خانة للمشترك', 'success')
      await loadData()
    } catch (e) {
      showToast('فشل فك ربط الجهاز: ' + e.message, 'error')
    }
  }

  const handleApprove = async (dev) => {
    const ok = await confirm({
      title: 'اعتماد وتفعيل الجهاز',
      message: `هل أنت متأكد من اعتماد الجهاز "${dev.device_name || dev.machine_fingerprint}" للمشترك "${dev.subscriber?.company_name || 'المنشأة'}"؟\nسيتم منحه صلاحية الوصول واحتسابه ضمن رصيد الأجهزة المصرح بها.`,
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

  const handleReject = async (dev) => {
    const ok = await confirm({
      title: 'رفض طلب تسجيل الجهاز',
      message: `هل أنت متأكد من رفض طلب الجهاز "${dev.device_name || dev.machine_fingerprint}"؟\nلن يتمكن هذا الجهاز من تفعيل الترخيص.`,
      confirmText: 'نعم، رفض الطلب',
      isDanger: true,
    })
    if (!ok) return

    try {
      await apiRejectDevice(dev.id)
      showToast('تم رفض تسجيل الجهاز بنجاح', 'warning')
      await loadData()
    } catch (e) {
      showToast('تعذر رفض الجهاز: ' + e.message, 'error')
    }
  }

  const handleRenameSubmit = async (e) => {
    e.preventDefault()
    if (!renameModalDev) return
    setRenaming(true)
    try {
      await apiRenameDevice(renameModalDev.id, newDeviceName)
      showToast('تم تغيير اسم الجهاز بنجاح', 'success')
      setRenameModalDev(null)
      await loadData()
    } catch (err) {
      showToast('فشل إعادة تسمية الجهاز: ' + err.message, 'error')
    } finally {
      setRenaming(false)
    }
  }

  const subscribersList = Array.from(
    new Set(devices.map((d) => d.subscriber?.company_name).filter(Boolean))
  )

  const filtered = devices.filter((dev) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      (dev.device_name || '').toLowerCase().includes(q) ||
      (dev.machine_fingerprint || '').toLowerCase().includes(q) ||
      (dev.subscriber?.company_name || '').toLowerCase().includes(q) ||
      (dev.subscriber?.subscriber_code || '').toLowerCase().includes(q)

    const lastSeen = new Date(dev.last_heartbeat_at)
    const diffMs = Date.now() - lastSeen.getTime()
    const isOnline = diffMs < 300000

    let matchesStatus = true
    if (filterStatus === 'pending') matchesStatus = dev.status === 'pending'
    else if (filterStatus === 'active') matchesStatus = dev.status === 'active'
    else if (filterStatus === 'suspended') matchesStatus = dev.status === 'suspended' || dev.status === 'revoked'
    else if (filterStatus === 'online') matchesStatus = dev.status === 'active' && isOnline

    let matchesSub = true
    if (filterSubscriber !== 'all') matchesSub = dev.subscriber?.company_name === filterSubscriber

    return matchesSearch && matchesStatus && matchesSub
  })

  const pendingCount = devices.filter(d => d.status === 'pending').length

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
            placeholder="بحث باسم الجهاز، بصمة العتاد، أو المشترك..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 outline-none focus:border-blue-600 font-semibold"
          >
            <option value="all">جميع الحالات ({devices.length})</option>
            <option value="pending">بانتظار الاعتماد ({pendingCount})</option>
            <option value="online">المتصلة الآن (Real-time)</option>
            <option value="active">النشطة والمرخصة</option>
            <option value="suspended">المعلقة والموقوفة</option>
          </select>

          <select
            value={filterSubscriber}
            onChange={(e) => setFilterSubscriber(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 outline-none focus:border-blue-600 font-semibold"
          >
            <option value="all">كل المشتركين</option>
            {subscribersList.map((subName) => (
              <option key={subName} value={subName}>{subName}</option>
            ))}
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

      {/* Devices Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-600 font-bold">
                <th className="py-3.5 pr-4">اسم الجهاز / بصمة العتاد</th>
                <th className="py-3.5 px-3">المشترك التابع له</th>
                <th className="py-3.5 px-3">نظام التشغيل</th>
                <th className="py-3.5 px-3">آخر اتصال (Heartbeat)</th>
                <th className="py-3.5 px-3">حالة الاتصال</th>
                <th className="py-3.5 pl-4 text-left">التحكم الفوري</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((dev) => {
                const lastSeen = new Date(dev.last_heartbeat_at)
                const diffMs = Date.now() - lastSeen.getTime()
                const isOnline = diffMs < 300000
                const isRecent = diffMs < 3600000
                const isCopied = copiedId === dev.id
                const isSubSuspended = dev.subscriber?.status === 'suspended'

                return (
                  <tr key={dev.id} className="hover:bg-slate-50 transition-colors">
                    {/* Device Name & Hardware Fingerprint */}
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${
                          dev.status === 'pending'
                            ? 'bg-amber-500 animate-pulse'
                            : dev.status !== 'active'
                            ? 'bg-rose-500'
                            : (isOnline ? 'bg-emerald-500 animate-pulse' : (isRecent ? 'bg-amber-400' : 'bg-slate-300'))
                        }`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {dev.device_name || 'جهاز بدون اسم'}
                            </span>
                            <button
                              onClick={() => {
                                setRenameModalDev(dev)
                                setNewDeviceName(dev.device_name || '')
                              }}
                              className="text-slate-400 hover:text-blue-600 p-1 transition-colors"
                              title="إعادة تسمية الجهاز"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-mono">
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

                    {/* Subscriber Info */}
                    <td className="py-4 px-3">
                      <div className="font-bold text-slate-900">
                        {dev.subscriber?.company_name || 'مشترك غير معروف'}
                      </div>
                      <div className="text-[10px] text-blue-600 font-mono mt-0.5">
                        {dev.subscriber?.subscriber_code}
                      </div>
                      {isSubSuspended && (
                        <span className="inline-block mt-0.5 text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded font-medium">
                          اشتراك المنشأة معلق
                        </span>
                      )}
                    </td>

                    {/* OS Info */}
                    <td className="py-4 px-3">
                      <span className="text-slate-700 font-mono text-[11px] bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {dev.os_info || 'Windows'}
                      </span>
                    </td>

                    {/* Last Heartbeat */}
                    <td className="py-4 px-3">
                      <div className="font-mono text-slate-800">
                        {lastSeen.toLocaleDateString('ar-EG')} {lastSeen.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {isOnline ? 'متصل الآن' : `منذ ${Math.round(diffMs / 60000)} دقيقة`}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        dev.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : dev.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {dev.status === 'active' ? (
                          <>
                            <CheckCircle size={11} />
                            <span>نشط ومرخص</span>
                          </>
                        ) : dev.status === 'pending' ? (
                          <>
                            <Clock size={11} />
                            <span>بانتظار الاعتماد</span>
                          </>
                        ) : (
                          <>
                            <Ban size={11} />
                            <span>معلق وموقوف</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions: Approve / Kill-Switch & Unlink */}
                    <td className="py-4 pl-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        {dev.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApprove(dev)}
                              className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center gap-1.5"
                            >
                              <CheckCircle size={13} />
                              <span>اعتماد الجهاز</span>
                            </button>

                            <button
                              onClick={() => handleReject(dev)}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 transition-colors"
                              title="رفض طلب الجهاز"
                            >
                              رفض
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(dev)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                              dev.status === 'active'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {dev.status === 'active' ? 'إيقاف فوري' : 'تفعيل'}
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(dev)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors"
                          title="فك ربط الجهاز وإخلاء خانة"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    لا توجد أجهزة مطابقة للبحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rename Modal */}
      {renameModalDev && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm">تسمية الجهاز: {renameModalDev.device_name || 'جهاز بدون اسم'}</h3>
              <button onClick={() => setRenameModalDev(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">اسم الجهاز المخصص (مثال: كاشير فرع 1):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: جهاز المحاسب العام"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRenameModalDev(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 font-semibold hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={renaming}
                  className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  حفظ الاسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
