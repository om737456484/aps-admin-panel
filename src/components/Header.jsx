import React from 'react'
import { Plus, RefreshCw, Menu, Radio, Shield, Database, Key, LogOut } from 'lucide-react'

export default function Header({
  activeTab,
  onOpenAddSub,
  onRefresh,
  loading,
  onOpenMobileMenu,
  isConnected,
  onOpenConfig,
  onOpenKeygen,
  onLogout
}) {
  const titles = {
    dashboard: { title: 'لوحة المؤشرات ونبض النظام', desc: 'مراقبة سريعة للأجهزة المتصلة، التراخيص النشطة، والعمليات الحية' },
    subscribers: { title: 'إدارة المشتركين والمنشآت', desc: 'إصدار التراخيص السحابية، تمديد الباقات، والتحكم الفوري بالإيقاف' },
    devices: { title: 'الأجهزة ونقاط البيع المسجلة', desc: 'مراقبة عتاد الأجهزة، التحقق من بصمة الجهاز، وإدارة تراخيص الكواشير' },
    plans: { title: 'باقات وخطط التراخيص', desc: 'تحديد أسعار الباقات، ميزات النظام المحاسبي، والحد الأقصى للأجهزة' },
    logs: { title: 'سجل العمليات والتدقيق الأمني', desc: 'تتبع كافة عمليات إصدار وتمديد وتعديل التراخيص بالأوقات والتفاصيل' },
  }

  const current = titles[activeTab] || titles.dashboard

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* Left (RTL Right): Title & Description */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Menu size={20} />
          </button>

          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{current.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{current.desc}</p>
          </div>
        </div>

        {/* Right (RTL Left): Actions */}
        <div className="flex items-center gap-3">
          {/* Supabase status badge */}
          <div
            onClick={onOpenConfig}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isConnected ? 'سوبر بيس نشط' : 'وضع المعاينة'}</span>
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-blue-600' : ''} />
            </button>
          )}

          {/* Keygen Button */}
          {onOpenKeygen && (
            <button
              onClick={onOpenKeygen}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
              title="توليد كود تفعيل يدوي أوفلاين"
            >
              <Key size={15} />
              <span>كود يدوي</span>
            </button>
          )}

          {/* New Subscriber Button */}
          <button
            onClick={onOpenAddSub}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus size={18} />
            <span>مشترك جديد</span>
          </button>
        </div>
      </div>
    </header>
  )
}
