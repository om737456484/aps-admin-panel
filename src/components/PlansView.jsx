import React, { useState, useEffect } from 'react'
import {
  Layers, Check, Laptop, Clock, ShieldCheck, RefreshCw, Edit3, X, Sparkles
} from 'lucide-react'
import { apiFetchPlans, apiUpdatePlan } from '../services/supabaseClient'
import { useToast } from '../context/ToastContext'

export default function PlansView() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [editPlan, setEditPlan] = useState(null)
  const [editForm, setEditForm] = useState({ price: 0, max_devices: 1, duration_days: 365 })
  const [savingPlan, setSavingPlan] = useState(false)

  const { showToast } = useToast()

  const loadData = async (isManual = false) => {
    setLoading(true)
    try {
      const res = await apiFetchPlans()
      setPlans(res?.data || [])
      if (isManual) {
        showToast('تم تحديث قائمة الخطط', 'success')
      }
    } catch (e) {
      console.error(e)
      showToast('خطأ أثناء جلب الخطط: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(false)
  }, [])

  const handleEditClick = (plan) => {
    setEditPlan(plan)
    setEditForm({
      price: plan.price,
      max_devices: plan.max_devices,
      duration_days: plan.duration_days,
    })
  }

  const handleSavePlan = async (e) => {
    e.preventDefault()
    if (!editPlan) return
    setSavingPlan(true)
    try {
      await apiUpdatePlan(editPlan.id, {
        price: Number(editForm.price),
        max_devices: Number(editForm.max_devices),
        duration_days: Number(editForm.duration_days),
      })
      showToast(`تم تحديث خطة "${editPlan.name_ar}" بنجاح`, 'success')
      setEditPlan(null)
      await loadData()
    } catch (err) {
      showToast('فشل حفظ الخطة: ' + err.message, 'error')
    } finally {
      setSavingPlan(false)
    }
  }

  const featureLabels = {
    sales: 'المبيعات والفواتير الضريبية',
    purchases: 'المشتريات وسلسلة الموردين',
    inventory: 'إدارة المخزون والتكلفة',
    treasury: 'الخزينة والصناديق والبنوك',
    reports: 'التقارير المالية والقوائم الختامية',
    accounts: 'دليل الحسابات وقيود اليومية',
    parties: 'العملاء والموردون وكشوف الحسابات',
    pos: 'نقطة البيع والكاشير السريع (POS)',
    hrms: 'الموارد البشرية والموظفون',
    payroll: 'مسيرات الرواتب والسلف',
    cloud_backup: 'النسخ الاحتياطي السحابي التلقائي',
    multi_branch: 'تعدد الفروع والمستودعات',
    api_access: 'واجهات الربط البرمجي (API)',
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Plans Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isPro = plan.id === 'pro'
          const isEnterprise = plan.id === 'enterprise'

          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 flex flex-col justify-between transition-all relative overflow-hidden bg-white border ${
                isPro
                  ? 'border-blue-600 shadow-md ring-2 ring-blue-100'
                  : isEnterprise
                  ? 'border-indigo-500 shadow-md ring-2 ring-indigo-100'
                  : 'border-slate-200 shadow-sm'
              }`}
            >
              {/* Popular Badge */}
              {isPro && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black bg-blue-600 text-white uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Sparkles size={11} />
                  <span>الأكثر طلباً</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    {plan.id}
                  </span>
                  <button
                    onClick={() => handleEditClick(plan)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                    title="تعديل السعر أو عدد الأجهزة"
                  >
                    <Edit3 size={13} />
                  </button>
                </div>

                <h3 className="text-xl font-black text-slate-900 mt-2">{plan.name_ar}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{plan.name_en}</p>

                {/* Price Display */}
                <div className="mt-5 pb-5 border-b border-slate-100">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-slate-900 font-mono tracking-tight">${plan.price}</span>
                    <span className="text-xs text-slate-500 font-semibold">/ {plan.billing_cycle === 'yearly' ? 'سنوياً' : plan.billing_cycle}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-3.5 text-xs text-slate-700 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <Laptop size={14} className="text-blue-600" />
                      <span>{plan.max_devices} {plan.max_devices === 1 ? 'جهاز' : 'أجهزة'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-indigo-600" />
                      <span>{plan.duration_days} يوم</span>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="mt-5 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 block mb-3">الميزات المحاسبية المفتوحة:</span>
                  {(Array.isArray(plan.features) ? plan.features : []).map((featKey) => (
                    <div key={featKey} className="flex items-center gap-2.5 text-xs text-slate-800">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span className="text-slate-700">{featureLabels[featKey] || featKey}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-center text-slate-400">
                تطبق الصلاحيات آلياً عند تسجيل الجهاز
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit Plan Modal */}
      {editPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm">تعديل باقة: {editPlan.name_ar}</h3>
              <button onClick={() => setEditPlan(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">السعر بالدولار ($):</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">أقصى عدد للأجهزة:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editForm.max_devices}
                  onChange={(e) => setEditForm({ ...editForm, max_devices: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">المدة الافتراضية بالأيام:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editForm.duration_days}
                  onChange={(e) => setEditForm({ ...editForm, duration_days: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditPlan(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 font-semibold hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
