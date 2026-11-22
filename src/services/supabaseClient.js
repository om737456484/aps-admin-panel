import { createClient } from '@supabase/supabase-js'

const STORAGE_KEY_URL = 'aps_admin_supabase_url'
const STORAGE_KEY_KEY = 'aps_admin_supabase_key'

export function getStoredConfig() {
  const url = localStorage.getItem(STORAGE_KEY_URL) || import.meta.env.VITE_SUPABASE_URL || 'https://jsiukdrslcayuktevjcz.supabase.co'
  const key = localStorage.getItem(STORAGE_KEY_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzaXVrZHJzbGNheXVrdGV2amN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxOTY5NzUsImV4cCI6MjEwOTc3Mjk3NX0.c7lRgihGY7DqnkzY0IBihaTrKiAp7pTCbKr9blwDuXQ'
  return { url: (url || '').trim(), key: (key || '').trim() }
}

export function saveStoredConfig(url, key) {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim())
  else localStorage.removeItem(STORAGE_KEY_URL)

  if (key) localStorage.setItem(STORAGE_KEY_KEY, key.trim())
  else localStorage.removeItem(STORAGE_KEY_KEY)

  _cachedClient = null
}

let _cachedClient = null

export function getSupabase() {
  const { url, key } = getStoredConfig()
  if (!url || !key) return null
  if (!_cachedClient) {
    try {
      _cachedClient = createClient(url, key, {
        auth: { persistSession: true },
      })
    } catch (e) {
      console.error('[SupabaseClient] init error:', e)
      return null
    }
  }
  return _cachedClient
}

export async function apiLogin(email, password) {
  const cleanEmail = (email || '').trim()
  const cleanPass = (password || '').trim()

  // 1. Check Master Admin Credentials
  if (cleanEmail === '779967074737456484' && cleanPass === '779967074737456484') {
    const masterSession = { user: { email: '779967074737456484', role: 'admin' } }
    localStorage.setItem('aps_admin_demo_session', 'true')
    return { success: true, session: masterSession, user: masterSession.user }
  }

  // 2. Try Supabase Auth
  const sb = getSupabase()
  if (sb) {
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email: cleanEmail.toLowerCase(), password: cleanPass })
      if (!error && data?.session) {
        localStorage.removeItem('aps_admin_demo_session')
        return { success: true, session: data.session, user: data.user }
      }
      return { success: false, error: error?.message || 'بيانات الدخول غير صحيحة' }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  return { success: false, error: 'بيانات الدخول غير صحيحة' }
}

export async function apiLogout() {
  const sb = getSupabase()
  localStorage.removeItem('aps_admin_demo_session')
  if (sb) {
    try {
      await sb.auth.signOut()
    } catch (_) {}
  }
  return { success: true }
}

export async function apiGetCurrentSession() {
  const sb = getSupabase()
  if (sb) {
    try {
      const { data } = await sb.auth.getSession()
      if (data?.session) return data.session
    } catch (_) {}
  }
  if (localStorage.getItem('aps_admin_demo_session') === 'true') {
    return { user: { email: '779967074737456484', role: 'admin' } }
  }
  return null
}

const DEFAULT_AUTH_SECRET = 'APS-AUTH-KEY-2026-c7e9f1a2b3d4e5f67890abcdef123456'

export async function generateOfflineCodeBrowser({ requestCode, daysGranted = 365, maxDevices = 1, secret = DEFAULT_AUTH_SECRET }) {
  const cleanReq = String(requestCode || '').trim().replace(/\s+/g, '').toUpperCase()
  const enc = new TextEncoder()
  const reqHashBuf = await crypto.subtle.digest('SHA-256', enc.encode(cleanReq))
  const reqHashHex = Array.from(new Uint8Array(reqHashBuf)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()

  const days = Math.max(1, Math.min(65535, Number(daysGranted) || 365))
  const devices = Math.max(1, Math.min(65535, Number(maxDevices) || 1))

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Version 2 encodes both duration (days) and authorized devices count
  if (devices > 1 || maxDevices !== undefined) {
    const requestPrefix = reqHashHex.slice(0, 8) // 4 bytes = 8 hex chars
    const checksumInput = JSON.stringify({ v: 2, d: days, m: devices, rp: requestPrefix })
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(checksumInput))
    const checksum6 = new Uint8Array(sigBuf).slice(0, 6)

    // Header 9 bytes: [version (2), days (uint16be), devices (uint16be), requestPrefix (4 bytes)]
    const header = new Uint8Array(9)
    header[0] = 2
    header[1] = (days >> 8) & 0xff
    header[2] = days & 0xff
    header[3] = (devices >> 8) & 0xff
    header[4] = devices & 0xff
    for (let i = 0; i < 4; i++) {
      header[5 + i] = parseInt(requestPrefix.substr(i * 2, 2), 16)
    }

    const combined = new Uint8Array(15)
    combined.set(header, 0)
    combined.set(checksum6, 9)

    let value = 0n
    for (const b of combined) {
      value = (value << 8n) | BigInt(b)
    }
    return value.toString(36).toUpperCase().padStart(25, '0').slice(-25)
  }

  // Version 1 fallback (single device)
  const requestPrefix = reqHashHex.slice(0, 10)
  const checksumInput = JSON.stringify({ v: 1, d: days, rp: requestPrefix })
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(checksumInput))
  const checksum7 = new Uint8Array(sigBuf).slice(0, 7)

  // Header 8 bytes: [version (1), days (uint16be), requestPrefix (5 bytes)]
  const header = new Uint8Array(8)
  header[0] = 1
  header[1] = (days >> 8) & 0xff
  header[2] = days & 0xff
  for (let i = 0; i < 5; i++) {
    header[3 + i] = parseInt(requestPrefix.substr(i * 2, 2), 16)
  }

  // Combined 15 bytes
  const combined = new Uint8Array(15)
  combined.set(header, 0)
  combined.set(checksum7, 8)

  // Base36 encoding of 15 bytes BigInt
  let value = 0n
  for (const b of combined) {
    value = (value << 8n) | BigInt(b)
  }
  return value.toString(36).toUpperCase().padStart(25, '0').slice(-25)
}

/**
 * Test a Supabase connection with given URL and key
 */
export async function testConnection(url, key) {
  try {
    const client = createClient(url.trim(), key.trim(), { auth: { persistSession: false } })
    const { data, error } = await client.from('license_plans').select('id').limit(1)
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true, count: data ? data.length : 0 }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

async function safeAuditLog(sb, payload) {
  if (!sb) return
  try {
    const { error } = await sb.from('license_audit_logs').insert(payload)
    if (error) {
      console.warn('[AuditLogs] safe insert notice:', error.message)
    }
  } catch (err) {
    console.warn('[AuditLogs] safe insert exception:', err)
  }
}

// ── Fallback Demo Data ──
const MOCK_PLANS = [
  { id: 'trial', name_ar: 'نسخة تجريبية', name_en: 'Trial', duration_days: 14, max_devices: 1, price: 0, billing_cycle: 'trial', features: ['sales', 'inventory', 'pos'] },
  { id: 'basic', name_ar: 'الخطة الأساسية', name_en: 'Basic', duration_days: 365, max_devices: 1, price: 150, billing_cycle: 'yearly', features: ['sales', 'purchases', 'inventory', 'pos'] },
  { id: 'pro', name_ar: 'الخطة الاحترافية', name_en: 'Professional', duration_days: 365, max_devices: 3, price: 300, billing_cycle: 'yearly', features: ['sales', 'purchases', 'inventory', 'accounts', 'pos', 'hrms', 'cloud_backup'] },
  { id: 'enterprise', name_ar: 'خطة الشركات', name_en: 'Enterprise', duration_days: 365, max_devices: 10, price: 600, billing_cycle: 'yearly', features: ['sales', 'purchases', 'inventory', 'accounts', 'pos', 'hrms', 'payroll', 'cloud_backup', 'multi_branch'] },
]

let _mockSubscribers = [
  { id: 'sub-1', subscriber_code: 'APS-SUB-61135', company_name: 'المتحدون', owner_name: 'عمر هادي', phone: '779967074', plan_id: 'enterprise', status: 'active', expires_at: new Date(Date.now() + 45 * 86400000).toISOString(), max_devices_override: 10, notes: 'عميل رئيسي', created_at: new Date().toISOString() },
]

let _mockDevices = [
  { id: 'dev-1', subscriber_id: 'sub-1', device_name: 'كاشير المحل الرئيسي', machine_fingerprint: 'APS-DEV-a398b0ff0234632ee7ebef125ad53744', os_info: 'Windows 11 Pro', status: 'active', last_heartbeat_at: new Date().toISOString() },
  { id: 'dev-2', subscriber_id: 'sub-1', device_name: 'جهاز الإدارة الفرعي (فرع 2)', machine_fingerprint: 'APS-DEV-7b199c1e48f02aa56e3bd811099e7123', os_info: 'Windows 10 Pro', status: 'pending', last_heartbeat_at: new Date(Date.now() - 120000).toISOString() },
]

let _mockAuditLogs = [
  { id: 'log-1', subscriber_id: 'sub-1', event_type: 'device_registered', details: { device: 'كاشير المحل الرئيسي' }, created_at: new Date().toISOString() }
]

// ── API Operations ──

export async function apiFetchStats() {
  const sb = getSupabase()
  if (sb) {
    try {
      const [subRes, devRes] = await Promise.all([
        sb.from('license_subscribers').select('id, status, expires_at, plan_id, max_devices_override'),
        sb.from('license_devices').select('id, status, last_heartbeat_at'),
      ])
      const subs = subRes.data || []
      const devs = devRes.data || []
      const now = new Date()
      const in7Days = new Date(now.getTime() + 7 * 86400000)

      return {
        totalSubscribers: subs.length,
        activeSubscribers: subs.filter(s => s.status === 'active' || s.status === 'trial').length,
        suspendedSubscribers: subs.filter(s => s.status === 'suspended').length,
        expiringSoon: subs.filter(s => new Date(s.expires_at) > now && new Date(s.expires_at) <= in7Days).length,
        totalDevices: devs.length,
        activeDevices: devs.filter(d => d.status === 'active').length,
        pendingDevices: devs.filter(d => d.status === 'pending').length,
        onlineDevices: devs.filter(d => d.status === 'active' && (now - new Date(d.last_heartbeat_at)) < 300000).length,
        isLive: true,
      }
    } catch (e) {
      console.warn('[Stats] Live query error:', e)
    }
  }

  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 86400000)
  return {
    totalSubscribers: _mockSubscribers.length,
    activeSubscribers: _mockSubscribers.filter(s => s.status === 'active' || s.status === 'trial').length,
    suspendedSubscribers: _mockSubscribers.filter(s => s.status === 'suspended').length,
    expiringSoon: _mockSubscribers.filter(s => new Date(s.expires_at) > now && new Date(s.expires_at) <= in7Days).length,
    totalDevices: _mockDevices.length,
    activeDevices: _mockDevices.filter(d => d.status === 'active').length,
    pendingDevices: _mockDevices.filter(d => d.status === 'pending').length,
    onlineDevices: _mockDevices.filter(d => d.status === 'active' && (now - new Date(d.last_heartbeat_at)) < 300000).length,
    isLive: false,
  }
}

export async function apiFetchSubscribers() {
  const sb = getSupabase()
  if (sb) {
    try {
      const { data, error } = await sb
        .from('license_subscribers')
        .select('*, license_plans(*), license_devices(id, device_name, status, last_heartbeat_at, machine_fingerprint)')
        .order('created_at', { ascending: false })
      if (!error && data) return { data, isLive: true }
    } catch (e) {
      console.warn('[Subscribers] Query error:', e)
    }
  }
  return {
    data: _mockSubscribers.map(sub => ({
      ...sub,
      license_devices: _mockDevices.filter(d => d.subscriber_id === sub.id),
      license_plans: MOCK_PLANS.find(p => p.id === sub.plan_id),
    })),
    isLive: false
  }
}

export async function apiCreateSubscriber(payload) {
  const sb = getSupabase()
  if (sb) {
    const { data, error } = await sb.from('license_subscribers').insert(payload).select().single()
    if (error) throw error
    await safeAuditLog(sb, {
      subscriber_id: data.id,
      event_type: 'subscriber_created',
      details: { plan_id: data.plan_id, company_name: data.company_name, code: data.subscriber_code },
    })
    return data
  }
  const newSub = {
    id: 'sub-' + Date.now(),
    ...payload,
    created_at: new Date().toISOString(),
  }
  _mockSubscribers.unshift(newSub)
  _mockAuditLogs.unshift({
    id: 'log-' + Date.now(),
    subscriber_id: newSub.id,
    event_type: 'subscriber_created',
    details: { plan_id: newSub.plan_id, company_name: newSub.company_name },
    created_at: new Date().toISOString()
  })
  return newSub
}

export async function apiUpdateSubscriber(id, updates) {
  const sb = getSupabase()
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  }
  if (sb) {
    const { data, error } = await sb
      .from('license_subscribers')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    await safeAuditLog(sb, {
      subscriber_id: id,
      event_type: 'subscriber_updated',
      details: updates,
    })
    return data
  }
  const idx = _mockSubscribers.findIndex(s => s.id === id)
  if (idx !== -1) {
    _mockSubscribers[idx] = { ..._mockSubscribers[idx], ...payload }
    return _mockSubscribers[idx]
  }
  return null
}

export async function apiDeleteSubscriber(id) {
  const sb = getSupabase()
  if (sb) {
    // Delete linked devices first to satisfy foreign keys
    await sb.from('license_devices').delete().eq('subscriber_id', id)
    const { error } = await sb.from('license_subscribers').delete().eq('id', id)
    if (error) throw error
    await safeAuditLog(sb, {
      event_type: 'subscriber_deleted',
      details: { subscriber_id: id },
    })
    return true
  }
  _mockDevices = _mockDevices.filter(d => d.subscriber_id !== id)
  _mockSubscribers = _mockSubscribers.filter(s => s.id !== id)
  return true
}

export async function apiExtendSubscriber(id, days) {
  const sb = getSupabase()
  if (sb) {
    const { data: sub } = await sb.from('license_subscribers').select('expires_at').eq('id', id).single()
    const currentExpiry = sub?.expires_at ? new Date(sub.expires_at).getTime() : Date.now()
    const base = currentExpiry > Date.now() ? currentExpiry : Date.now()
    const newExpiresAt = new Date(base + days * 86400000).toISOString()
    const { data, error } = await sb
      .from('license_subscribers')
      .update({ expires_at: newExpiresAt, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    await safeAuditLog(sb, {
      subscriber_id: id,
      event_type: 'subscription_extended',
      details: { additional_days: days, new_expires_at: newExpiresAt },
    })
    return data
  }
  const sub = _mockSubscribers.find(s => s.id === id)
  if (sub) {
    const cur = new Date(sub.expires_at).getTime()
    const base = cur > Date.now() ? cur : Date.now()
    sub.expires_at = new Date(base + days * 86400000).toISOString()
    sub.status = 'active'
  }
  return sub
}

export async function apiSetSubscriberDurationFromToday(id, days) {
  const sb = getSupabase()
  const daysNum = Number(days) || 14
  const newExpiresAt = new Date(Date.now() + daysNum * 86400000).toISOString()
  if (sb) {
    const { data, error } = await sb
      .from('license_subscribers')
      .update({ expires_at: newExpiresAt, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    await safeAuditLog(sb, {
      subscriber_id: id,
      event_type: 'subscription_duration_set',
      details: { days_from_today: daysNum, new_expires_at: newExpiresAt },
    })
    return data
  }
  const sub = _mockSubscribers.find(s => s.id === id)
  if (sub) {
    sub.expires_at = newExpiresAt
    sub.status = 'active'
  }
  return sub
}

export async function apiSetSubscriberExpiryDate(id, targetDateIso) {
  const sb = getSupabase()
  if (sb) {
    const { data, error } = await sb
      .from('license_subscribers')
      .update({ expires_at: targetDateIso, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    await safeAuditLog(sb, {
      subscriber_id: id,
      event_type: 'subscription_expiry_set',
      details: { target_date: targetDateIso },
    })
    return data
  }
  const sub = _mockSubscribers.find(s => s.id === id)
  if (sub) {
    sub.expires_at = targetDateIso
    sub.status = 'active'
  }
  return sub
}

export async function apiUpdateSubscriberPlan(id, planId, maxDevicesOverride) {
  const sb = getSupabase()
  if (sb) {
    const { data, error } = await sb
      .from('license_subscribers')
      .update({
        plan_id: planId,
        max_devices_override: maxDevicesOverride ? Number(maxDevicesOverride) : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    await safeAuditLog(sb, {
      subscriber_id: id,
      event_type: 'subscriber_plan_updated',
      details: { plan_id: planId, max_devices_override: maxDevicesOverride },
    })
    return data
  }
  const sub = _mockSubscribers.find(s => s.id === id)
  if (sub) {
    sub.plan_id = planId
    sub.max_devices_override = maxDevicesOverride ? Number(maxDevicesOverride) : null
  }
  return sub
}

export async function apiUpdateSubscriberStatus(id, status) {
  const sb = getSupabase()
  if (sb) {
    const { data, error } = await sb.from('license_subscribers').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    await safeAuditLog(sb, {
      subscriber_id: id,
      event_type: status === 'suspended' ? 'subscriber_suspended' : 'subscriber_reactivated',
      details: { status },
    })
    return data
  }
  const sub = _mockSubscribers.find(s => s.id === id)
  if (sub) sub.status = status
  return sub
}

export async function apiFetchDevices() {
  const sb = getSupabase()
  if (sb) {
    try {
      const { data, error } = await sb
        .from('license_devices')
        .select('*, license_subscribers(subscriber_code, company_name, plan_id, status)')
        .order('last_heartbeat_at', { ascending: false })
      if (!error && data) {
        const normalized = data.map(dev => ({
          ...dev,
          subscriber: dev.license_subscribers || dev.subscriber || null,
        }))
        return { data: normalized, isLive: true }
      }
    } catch (e) {
      console.warn('[Devices] Query error:', e)
    }
  }
  return {
    data: _mockDevices.map(d => ({
      ...d,
      subscriber: _mockSubscribers.find(s => s.id === d.subscriber_id)
    })),
    isLive: false
  }
}

export async function apiRenameDevice(id, deviceName) {
  const sb = getSupabase()
  const trimmed = (deviceName || '').trim()
  if (sb) {
    const { data, error } = await sb
      .from('license_devices')
      .update({ device_name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    await safeAuditLog(sb, {
      device_id: id,
      event_type: 'device_renamed',
      details: { new_name: trimmed },
    })
    return data
  }
  const dev = _mockDevices.find(d => d.id === id)
  if (dev) dev.device_name = trimmed
  return dev
}

export async function apiUpdateDeviceStatus(id, status) {
  const sb = getSupabase()
  if (sb) {
    const { data, error } = await sb.from('license_devices').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    await safeAuditLog(sb, {
      device_id: id,
      event_type: status === 'suspended' ? 'device_suspended' : 'device_reactivated',
      details: { status },
    })
    return data
  }
  const dev = _mockDevices.find(d => d.id === id)
  if (dev) dev.status = status
  return dev
}

export async function apiDeleteDevice(id) {
  const sb = getSupabase()
  if (sb) {
    const { error } = await sb.from('license_devices').delete().eq('id', id)
    if (error) throw error
    await safeAuditLog(sb, {
      event_type: 'device_unlinked',
      details: { deleted_device_id: id },
    })
    return true
  }
  _mockDevices = _mockDevices.filter(d => d.id !== id)
  return true
}

export async function apiApproveDevice(id) {
  const sb = getSupabase()
  if (sb) {
    try {
      const { data: rpcData, error: rpcError } = await sb.rpc('approve_device', { p_device_id: id })
      if (!rpcError && rpcData?.success) {
        return rpcData
      }
      if (rpcData && !rpcData.success) {
        throw new Error(rpcData.error || 'تعذر اعتماد الجهاز')
      }
    } catch (e) {
      if (e.message && e.message.includes('تعذر')) throw e
      const { data, error } = await sb
        .from('license_devices')
        .update({ status: 'active', activated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      await safeAuditLog(sb, {
        device_id: id,
        event_type: 'device_approved',
        details: { approved_at: new Date().toISOString() },
      })
      return data
    }
  }
  const dev = _mockDevices.find(d => d.id === id)
  if (dev) {
    dev.status = 'active'
    dev.activated_at = new Date().toISOString()
  }
  return dev
}

export async function apiRejectDevice(id, reason = '') {
  const sb = getSupabase()
  if (sb) {
    try {
      const { data: rpcData, error: rpcError } = await sb.rpc('reject_device', { p_device_id: id, p_reason: reason })
      if (!rpcError && rpcData?.success) {
        return rpcData
      }
    } catch (_) {}
    const { data, error } = await sb
      .from('license_devices')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    await safeAuditLog(sb, {
      device_id: id,
      event_type: 'device_rejected',
      details: { reason, rejected_at: new Date().toISOString() },
    })
    return data
  }
  const dev = _mockDevices.find(d => d.id === id)
  if (dev) dev.status = 'revoked'
  return dev
}

export async function apiFetchPlans() {
  const sb = getSupabase()
  if (sb) {
    try {
      const { data, error } = await sb.from('license_plans').select('*').order('price', { ascending: true })
      if (!error && data) return { data, isLive: true }
    } catch (e) {
      console.warn('[Plans] Query error:', e)
    }
  }
  return { data: MOCK_PLANS, isLive: false }
}

export async function apiUpdatePlan(id, updates) {
  const sb = getSupabase()
  if (sb) {
    const { data, error } = await sb
      .from('license_plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const p = MOCK_PLANS.find(x => x.id === id)
  if (p) Object.assign(p, updates)
  return p
}

export async function apiFetchAuditLogs() {
  const sb = getSupabase()
  if (sb) {
    try {
      const { data, error } = await sb
        .from('license_audit_logs')
        .select('*, license_subscribers(company_name, subscriber_code), license_devices(device_name)')
        .order('created_at', { ascending: false })
        .limit(100)
      if (!error && data) return { data, isLive: true }
    } catch (e) {
      console.warn('[AuditLogs] Query error:', e)
    }
  }
  return { data: _mockAuditLogs, isLive: false }
}
