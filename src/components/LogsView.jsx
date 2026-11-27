import React, { useState, useEffect } from 'react'
import {
  Activity, RefreshCw, Shield, Clock, Laptop, UserCheck, AlertOctagon,
  Search, Filter, ChevronRight
} from 'lucide-react'
import { apiFetchAuditLogs } from '../services/supabaseClient'
import { useToast } from '../context/ToastContext'

export default function LogsView() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  const { showToast } = useToast()

  const loadData = async (isManual = false) => {
    setLoading(true)
    try {
      const res = await apiFetchAuditLogs()
      setLogs(res?.data || [])
      if (isManual) {
        showToast('تم تحديث سجل العمليات', 'success')
      }
    } catch (e) {
      console.error(e)
      showToast('خطأ أثناء جلب السجل: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(false)
  }, [])

  const getEventBadge = (type) => {
    switch (type) {
      case 'subscriber_created':
        return { label: 'إنشاء مشترك جديد', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      case 'subscriber_updated':
        return { label: 'تعديل بيانات مشترك', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
      case 'subscriber_plan_updated':
        return { label: 'ترقية / تعديل خطة', bg: 'bg-purple-50 text-purple-700 border-purple-200' }
      case 'subscription_extended':
      case 'subscription_duration_set':
      case 'subscription_expiry_set':
        return { label: 'تمديد اشتراك', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
      case 'device_registered':
        return { label: 'تسجيل جهاز جديد', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' }
      case 'device_approved':
        return { label: 'اعتماد جهاز', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      case 'device_rejected':
        return { label: 'رفض جهاز', bg: 'bg-rose-50 text-rose-700 border-rose-200' }
      case 'offline_license_issued':
        return { label: 'إصدار تفعيل يدوي (V2)', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
      case 'device_renamed':
        return { label: 'تسمية جهاز', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
      case 'device_suspended':
      case 'subscriber_suspended':
        return { label: 'إيقاف فوري (Kill-Switch)', bg: 'bg-rose-50 text-rose-700 border-rose-200' }
      case 'device_reactivated':
      case 'subscriber_reactivated':
        return { label: 'إعادة تفعيل', bg: 'bg-teal-50 text-teal-700 border-teal-200' }
      case 'device_unlinked':
        return { label: 'فك ربط جهاز', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
      case 'subscriber_deleted':
        return { label: 'حذف مشترك', bg: 'bg-rose-100 text-rose-800 border-rose-300' }
      default:
        return { label: type, bg: 'bg-slate-100 text-slate-700 border-slate-200' }
    }
  }

  const renderDetails = (details) => {
    if (!details || typeof details !== 'object' || Object.keys(details).length === 0) {
      return <span className="text-slate-400">—</span>
    }
    return (
      <div className="flex flex-wrap gap-1.5 max-w-md">
        {Object.entries(details).map(([k, v]) => (
          <span
            key={k}
            className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-mono"
          >
            <strong className="text-blue-700 font-semibold">{k}:</strong> {String(v)}
          </span>
        ))}
      </div>
    )
  }

  const filtered = logs.filter((log) => {
    const q = searchTerm.toLowerCase()
    const company = log.license_subscribers?.company_name || ''
    const code = log.license_subscribers?.subscriber_code || ''
    const dev = log.license_devices?.device_name || ''
    const matchesSearch =
      company.toLowerCase().includes(q) ||
      code.toLowerCase().includes(q) ||
      dev.toLowerCase().includes(q) ||
      (log.event_type || '').toLowerCase().includes(q)

    let matchesFilter = true
    if (filterType === 'devices') matchesFilter = (log.event_type || '').startsWith('device_')
    else if (filterType === 'subscribers') matchesFilter = (log.event_type || '').startsWith('subscri')
    else if (filterType === 'suspensions') matchesFilter = (log.event_type || '').includes('suspended')

    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute right-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالحدث، المنشأة، أو الجهاز..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 outline-none focus:border-blue-600 font-semibold"
          >
            <option value="all">كل الأحداث</option>
            <option value="subscribers">عمليات المشتركين</option>
            <option value="devices">عمليات الأجهزة</option>
            <option value="suspensions">الإيقاف والتعطيل فقط</option>
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

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-600 font-bold">
                <th className="py-3.5 pr-4">نوع الحدث</th>
                <th className="py-3.5 px-3">المشترك / المنشأة</th>
                <th className="py-3.5 px-3">الجهاز</th>
                <th className="py-3.5 px-3">البيانات والتفاصيل</th>
                <th className="py-3.5 pl-4 text-left">التوقيت والتاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log) => {
                const badge = getEventBadge(log.event_type)
                const createdAt = new Date(log.created_at)

                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 pr-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-slate-900 font-bold">
                      {log.license_subscribers?.company_name || '—'}
                      {log.license_subscribers?.subscriber_code && (
                        <span className="text-[10px] text-blue-600 font-mono block font-normal">
                          {log.license_subscribers.subscriber_code}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-slate-700 font-semibold">
                      {log.license_devices?.device_name || '—'}
                    </td>
                    <td className="py-4 px-3">
                      {renderDetails(log.details)}
                    </td>
                    <td className="py-4 pl-4 text-left font-mono text-slate-600 text-[11px]">
                      <div>{createdAt.toLocaleDateString('ar-EG')}</div>
                      <div className="text-[10px] text-slate-400">
                        {createdAt.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    لا توجد أحداث مسجلة في السجل.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
