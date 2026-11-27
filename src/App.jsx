import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import DashboardView from './components/DashboardView'
import SubscribersView from './components/SubscribersView'
import DevicesView from './components/DevicesView'
import PlansView from './components/PlansView'
import LogsView from './components/LogsView'
import OfflineActivationView from './components/OfflineActivationView'
import PaymentsView from './components/PaymentsView'
import RolesView from './components/RolesView'
import ConfigModal from './components/ConfigModal'
import LoginView from './components/LoginView'
import OfflineKeygenModal from './components/OfflineKeygenModal'
import { getStoredConfig, getSupabase, apiFetchStats, apiGetCurrentSession, apiLogout } from './services/supabaseClient'
import { X } from 'lucide-react'

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isKeygenOpen, setIsKeygenOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [initialOpenAddSub, setInitialOpenAddSub] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const checkConnection = () => {
    const config = getStoredConfig()
    const sb = getSupabase()
    setIsConnected(Boolean(config.url && config.key && sb))
  }

  const checkAuth = async () => {
    setAuthLoading(true)
    try {
      const sess = await apiGetCurrentSession()
      setSession(sess)
    } catch (_) {
      setSession(null)
    } finally {
      setAuthLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const stats = await apiFetchStats()
      if (stats?.pendingDevices !== undefined) {
        setPendingCount(stats.pendingDevices)
      }
    } catch (_) {}
  }

  useEffect(() => {
    checkConnection()
    checkAuth()
  }, [])

  useEffect(() => {
    if (!session) {
      setPendingCount(0)
      return undefined
    }
    loadStats()
    const timer = setInterval(loadStats, 10000)
    return () => clearInterval(timer)
  }, [session])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeTab])

  const handleLogout = async () => {
    await apiLogout()
    setSession(null)
  }

  const handleNavigate = (tab, options = {}) => {
    setActiveTab(tab)
    if (options.openAdd) {
      setInitialOpenAddSub(true)
    } else {
      setInitialOpenAddSub(false)
    }
  }

  const handleOpenAddSub = () => {
    setActiveTab('subscribers')
    setInitialOpenAddSub(true)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-300 font-semibold">جاري التحقق من الجلسة الإدارية...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <>
        <LoginView
          onLoginSuccess={(sess) => setSession(sess)}
          onOpenConfig={() => setIsConfigOpen(true)}
        />
        <ConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          onSaved={checkConnection}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden" dir="rtl">
      {/* Desktop Sidebar (RTL Right) */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setInitialOpenAddSub(false)
            setActiveTab(tab)
          }}
          onOpenConfig={() => setIsConfigOpen(true)}
          onOpenKeygen={() => setIsKeygenOpen(true)}
          isConnected={isConnected}
          onOpenAddSub={handleOpenAddSub}
          onLogout={handleLogout}
          user={session.user}
          pendingCount={pendingCount}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 bg-white flex flex-col h-full shadow-2xl animate-slideUp">
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900">القائمة الرئيسية</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                activeTab={activeTab}
                setActiveTab={(tab) => {
                  setInitialOpenAddSub(false)
                  setActiveTab(tab)
                  setMobileMenuOpen(false)
                }}
                onOpenConfig={() => {
                  setIsConfigOpen(true)
                  setMobileMenuOpen(false)
                }}
                onOpenKeygen={() => {
                  setIsKeygenOpen(true)
                  setMobileMenuOpen(false)
                }}
                isConnected={isConnected}
                onOpenAddSub={() => {
                  handleOpenAddSub()
                  setMobileMenuOpen(false)
                }}
                onLogout={handleLogout}
                user={session.user}
                pendingCount={pendingCount}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          onOpenAddSub={handleOpenAddSub}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          isConnected={isConnected}
          onOpenConfig={() => setIsConfigOpen(true)}
          onOpenKeygen={() => setIsKeygenOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <DashboardView onNavigate={handleNavigate} isConnected={isConnected} />}
          {activeTab === 'subscribers' && <SubscribersView initialOpenAdd={initialOpenAddSub} onOpenKeygen={() => setIsKeygenOpen(true)} />}
          {activeTab === 'offline-activation' && <OfflineActivationView />}
          {activeTab === 'devices' && <DevicesView />}
          {activeTab === 'payments' && <PaymentsView />}
          {activeTab === 'plans' && <PlansView />}
          {activeTab === 'roles' && <RolesView />}
          {activeTab === 'logs' && <LogsView />}
        </main>

        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          عدن برايم سوفت (APS Accounting) — بوابة إدارة التراخيص والمشتركين السحابية &copy; 2026
        </footer>
      </div>

      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSaved={checkConnection}
      />

      <OfflineKeygenModal
        isOpen={isKeygenOpen}
        onClose={() => setIsKeygenOpen(false)}
      />
    </div>
  )
}
