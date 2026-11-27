import React, { useState, useEffect } from 'react'
import {
  ShieldAlert, UserCheck, Lock, Key, CheckCircle, AlertTriangle, RefreshCw
} from 'lucide-react'
import { getSupabase } from '../services/supabaseClient'

export default function RolesView() {
  const [roles, setRoles] = useState([
    {
      id: 'super_admin',
      name_ar: 'المدير العام (Super Admin)',
      desc: 'كامل الصلاحيات الإدارية والفنية وإدارة المفاتيح والتراخيص',
      members: 0,
      badge: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    {
      id: 'license_manager',
      name_ar: 'مدير التراخيص (License Manager)',
      desc: 'إدارة وتوليد وتجديد التراخيص واعتماد الأجهزة والتفعيل اليدوي',
      members: 0,
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    {
      id: 'sales_manager',
      name_ar: 'مدير المبيعات (Sales Manager)',
      desc: 'إضافة العملاء والمنشآت وتسجيل طلبات الشراء والاشتراكات',
      members: 0,
      badge: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'support_agent',
      name_ar: 'وكيل الدعم الفني (Support Agent)',
      desc: 'الاطلاع على التراخيص والأجهزة ومتابعة مشاكل التفعيل',
      members: 0,
      badge: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      id: 'auditor',
      name_ar: 'مدقق النظام (System Auditor)',
      desc: 'مراجعة وتدقيق السجلات والعمليات الحساسة دون إمكانية التعديل',
      members: 0,
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  ])

  useEffect(() => {
    let active = true
    const loadRoleCounts = async () => {
      const sb = getSupabase()
      if (!sb) return
      try {
        const { data, error } = await sb
          .from('admin_profiles')
          .select('id, role_id, is_active')
        if (!error && Array.isArray(data) && active) {
          const counts = {}
          for (const row of data) {
            if (row.is_active === false) continue
            const rid = row.role_id || 'super_admin'
            counts[rid] = (counts[rid] || 0) + 1
          }
          setRoles((prev) => prev.map((r) => ({ ...r, members: counts[r.id] || 0 })))
        }
      } catch (_) {}
    }
    loadRoleCounts()
    return () => { active = false }
  }, [])

  return (
    <div className="w-full space-y-6 select-none animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
            <Lock size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة الأدوار والصلاحيات (RBAC)</h1>
            <p className="text-sm text-slate-500 font-medium">التحكم في وصول فريق العمل وتوزيع المهام وفق الصلاحيات المعيارية</p>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${role.badge}`}>
                {role.id}
              </span>
              <span className="text-xs text-slate-400 font-semibold">{role.members} موظف</span>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">{role.name_ar}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{role.desc}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle size={14} /> نشط ومعتمد في النظام
              </span>
              <span className="text-slate-400">نظامي</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
