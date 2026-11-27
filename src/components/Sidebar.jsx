import React from 'react'
import {
  LayoutDashboard, Users, Laptop, Layers, Activity, Database,
  Radio, CheckCircle2, AlertCircle, Settings2, ExternalLink, Key, LogOut
} from 'lucide-react'

export default function Sidebar({
  activeTab,
  setActiveTab,
  onOpenConfig,
  isConnected,
  onOpenAddSub,
  onOpenKeygen,
  onLogout,
  user,
  pendingCount = 0
}) {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة المؤشرات', icon: LayoutDashboard, desc: 'نظرة عامة والنبض الحي' },
    { id: 'subscribers', label: 'المشتركون والمنشآت', icon: Users, desc: 'التراخيص والتمديد والرموز' },
    { id: 'offline-activation', label: 'التفعيل اليدوي (Offline)', icon: Key, desc: 'Challenge–Response والتصاريح' },
    { id: 'devices', label: 'الأجهزة ونقاط البيع', icon: Laptop, desc: 'مراقبة العتاد و Kill-Switch' },
    { id: 'payments', label: 'المدفوعات والمقبوضات', icon: Database, desc: 'توثيق السندات والاشتراكات' },
    { id: 'plans', label: 'باقات الاشتراك', icon: Layers, desc: 'تخصيص الميزات والأسعار' },
    { id: 'roles', label: 'الأدوار والصلاحيات', icon: Settings2, desc: 'صلاحيات RBAC والأمان' },
    { id: 'logs', label: 'سجل العمليات والتدقيق', icon: Activity, desc: 'تتبع الأحداث والتفعيلات' },
  ]

  return (
    <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 h-full lg:h-screen lg:sticky lg:top-0 overflow-y-auto shadow-sm select-none">
      {/* Brand & App Title */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center font-black text-white text-lg shadow-md shadow-blue-500/25">
            APS
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-slate-900 text-base tracking-tight">عدن برايم سوفت</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                Cloud
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">بوابة إدارة التراخيص والمشتركين</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="p-4 flex-1 space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          القائمة الرئيسية
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon
          const active = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-right transition-all duration-150 ${
                active
                  ? 'bg-blue-50 text-blue-700 font-bold shadow-sm border border-blue-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  active ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Icon size={17} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs leading-none">{item.label}</span>
                  {item.id === 'devices' && pendingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black font-mono animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </div>
                <div className={`text-[10px] mt-1 font-normal ${active ? 'text-blue-500' : 'text-slate-400'}`}>
                  {item.desc}
                </div>
              </div>
            </button>
          )
        })}
        {/* Offline Keygen Tool Action */}
        <div className="pt-2">
          <button
            onClick={onOpenKeygen}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-right bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 font-bold border border-amber-500/20 transition-all duration-150"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Key size={16} />
            </div>
            <div className="flex-1">
              <span className="text-xs leading-none">مولد الأكواد اليدوية</span>
              <div className="text-[10px] text-amber-600/80 mt-1 font-normal">تفعيل أوفلاين للأجهزة المعزولة</div>
            </div>
          </button>
        </div>
      </nav>

      {/* Bottom Database Status & Settings Box */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        {user && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                A
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-800 truncate">{user.email || 'Admin'}</div>
                <div className="text-[10px] text-slate-500">مسؤول النظام</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-xs font-bold text-slate-800">
                {isConnected ? 'Supabase متصل' : 'وضع المعاينة (Demo)'}
              </span>
            </div>
            <button
              onClick={onOpenConfig}
              className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white transition-colors"
              title="إعدادات الربط"
            >
              <Settings2 size={16} />
            </button>
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed">
            {isConnected
              ? 'مزامنة التراخيص ونبض الأجهزة يعملان بكفاءة سحابياً.'
              : 'يمكنك إدخال مفتاح ورابط Supabase لتفعيل المزامنة المباشرة.'}
          </div>

          <button
            onClick={onOpenConfig}
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Database size={13} />
            <span>ضبط اتصال قاعدة البيانات</span>
          </button>
        </div>

        <div className="mt-3 text-center text-[10px] text-slate-400 font-medium">
          APS Accounting Enterprise &copy; 2026
        </div>
      </div>
    </aside>
  )
}
