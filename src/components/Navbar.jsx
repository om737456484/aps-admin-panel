import React, { useState } from 'react'
import {
  LayoutDashboard, Users, Laptop, Layers, Activity, Database,
  Menu, X, Radio, Sun, Moon, Shield, Sparkles, ChevronRight
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function Navbar({ activeTab, setActiveTab, onOpenConfig, isConnected }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggleTheme, isDark } = useTheme()

  const tabs = [
    { id: 'dashboard', label: 'لوحة المؤشرات', icon: LayoutDashboard },
    { id: 'subscribers', label: 'المشتركون والمنشآت', icon: Users },
    { id: 'devices', label: 'الأجهزة والتراخيص', icon: Laptop },
    { id: 'plans', label: 'الخطط والميزات', icon: Layers },
    { id: 'logs', label: 'سجل العمليات والتدقيق', icon: Activity },
  ]

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#080c15]/80 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-black/25 theme-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div
              className="relative group cursor-pointer"
              onClick={() => handleTabClick('dashboard')}
              title="العودة للرئيسية"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-cyan-500/25 group-hover:scale-105 transition-transform duration-200">
                APS
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-cyan-500/30 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wide text-slate-900 dark:text-white">
                  إدارة التراخيص السحابية
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                  <Radio size={10} className="text-cyan-500 dark:text-cyan-400 animate-pulse" />
                  Cloud v2.5
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block -mt-0.5">
                لوحة الإدارة والمشتركين — عدن برايم سوفت
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800/70 backdrop-blur-md">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 relative ${
                    active
                      ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-md shadow-cyan-500/25 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/80 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Right Action: Connectivity status, Theme Toggle & Config Trigger */}
          <div className="flex items-center gap-2.5">
            {/* Supabase status badge */}
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}
              title={isConnected ? 'قاعدة بيانات التراخيص نشطة ومتزامنة' : 'أنت في وضع المعاينة - اضغط إعدادات الربط للتوصيل'}
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 dark:bg-emerald-400 animate-ping' : 'bg-amber-500 dark:bg-amber-400'}`} />
              <span>{isConnected ? 'سوبر بيس نشط' : 'وضع المعاينة (Demo)'}</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm"
              title={isDark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun size={17} className="text-amber-400 animate-fadeIn" />
              ) : (
                <Moon size={17} className="text-indigo-600 animate-fadeIn" />
              )}
            </button>

            {/* Supabase Config Button */}
            <button
              onClick={onOpenConfig}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold shadow-sm hover:border-cyan-500/40"
              title="إعدادات الاتصال بـ Supabase"
            >
              <Database size={15} className="text-cyan-500 dark:text-cyan-400" />
              <span className="hidden sm:inline">إعدادات الربط</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#080c15]/95 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/60 mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">حالة الاتصال السحابي:</span>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              <span>{isConnected ? 'سوبر بيس نشط' : 'معاينة تجريبية'}</span>
            </div>
          </div>

          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon size={17} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </header>
  )
}
