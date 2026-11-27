import React, { useState, useEffect } from 'react'
import {
  CreditCard, CheckCircle2, Clock, XCircle, Search, Plus, Filter,
  DollarSign, Calendar, FileText, ArrowUpRight
} from 'lucide-react'
import { getSupabase } from '../services/supabaseClient'

export default function PaymentsView() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newPayment, setNewPayment] = useState({
    receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
    companyName: '',
    amount: 250,
    currency: 'USD',
    method: 'cash',
    reference: '',
    notes: '',
    status: 'approved'
  })

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    const sb = getSupabase()
    if (sb) {
      try {
        const { data, error } = await sb
          .from('license_payments')
          .select('*, organizations(name_ar, org_code)')
          .order('created_at', { ascending: false })

        if (!error && data) {
          setPayments(data)
        } else {
          const fallback = await sb
            .from('license_payments')
            .select('*')
            .order('created_at', { ascending: false })
          if (!fallback.error && fallback.data) {
            setPayments(fallback.data)
          }
        }
      } catch (_) {}
    }
    setLoading(false)
  }

  const handleCreatePayment = async (e) => {
    e.preventDefault()
    const sb = getSupabase()
    if (sb) {
      try {
        await sb.from('license_payments').insert({
          receipt_number: newPayment.receiptNumber,
          amount: Number(newPayment.amount),
          currency: newPayment.currency,
          payment_method: newPayment.method,
          reference_number: newPayment.reference,
          status: newPayment.status,
          notes: newPayment.notes,
          registered_by: 'admin'
        })
        fetchPayments()
      } catch (err) {
        alert('حدث خطأ: ' + err.message)
      }
    }
    setIsAddModalOpen(false)
  }

  const filteredPayments = payments.filter((p) => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return true
    return (
      String(p.receipt_number || '').toLowerCase().includes(q) ||
      String(p.reference_number || '').toLowerCase().includes(q) ||
      String(p.payment_method || '').toLowerCase().includes(q) ||
      String(p.registered_by || '').toLowerCase().includes(q) ||
      String(p.notes || '').toLowerCase().includes(q) ||
      String(p.organizations?.name_ar || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="w-full space-y-6 select-none animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <CreditCard size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">سجل المدفوعات والاشتراكات</h1>
              <p className="text-sm text-slate-500 font-medium">توثيق مقبوضات التراخيص وتجديد فترات الاستحقاق</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-blue-500/20"
        >
          <Plus size={16} /> تسجيل سند قبض جديد
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث برقم السند، أو المرجع..."
              className="w-full pl-4 pr-10 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="p-4">رقم السند</th>
                <th className="p-4">المبلغ</th>
                <th className="p-4">طريقة الدفع</th>
                <th className="p-4">المرجع</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">تاريخ السند</th>
                <th className="p-4">المسجل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    جاري تحميل سندات الدفع...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    {searchTerm.trim() ? 'لا توجد سندات دفع مطابقة للبحث' : 'لا توجد سندات دفع مسجلة حالياً'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold font-mono text-slate-900">{p.receipt_number}</td>
                    <td className="p-4 font-black text-emerald-600">
                      {p.amount} {p.currency}
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{p.payment_method}</td>
                    <td className="p-4 font-mono text-slate-500">{p.reference_number || '—'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.status === 'approved' ? 'معتمد' : p.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{new Date(p.created_at).toLocaleDateString('ar-YE')}</td>
                    <td className="p-4 font-semibold text-slate-600">{p.registered_by}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
