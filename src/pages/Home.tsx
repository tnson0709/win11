/**
 * pages/Home.tsx
 * Desktop mô phỏng Windows 11: hình nền, Taskbar, App Drawer và cửa sổ app.
 * Bổ sung:
 * - Kéo-thả cửa sổ, kéo giãn kích thước, maximize/restore.
 * - App dạng liên kết (href) mở trong tab mới, có mục "Open link..." để nhập URL.
 */

import { useCallback, useMemo, useState } from 'react'
import Taskbar from '../components/shell/Taskbar'
import AppDrawer from '../components/shell/AppDrawer'
import AppWindow from '../components/window/AppWindow'
import type { AppId, AppMeta } from '../types/apps'
import {
  Calendar,
  Users,
  FileText,
  BarChart3,
  PlusSquare,
  Mail,
  Settings,
  Calculator,
  Image as ImageIcon,
  NotebookPen,
  Globe,
  Link2,
  Code,
} from 'lucide-react'

/** Phiên bản icon chung, để đồng bộ kích thước */
const iconSize = 18

/**
 * Component Home: hiển thị desktop, quản lý state mở/đóng app và App Drawer.
 */
export default function Home() {
  // Tập app ghim (nghiệp vụ thường dùng)
  const pinned = useMemo<AppMeta[]>(() => [
    { id: 'calendar', name: 'Calendar', icon: <Calendar size={iconSize} />, color: '#ef4444' },
    { id: 'users', name: 'Users', icon: <Users size={iconSize} />, color: '#10b981' },
    { id: 'crm', name: 'CRM', icon: <NotebookPen size={iconSize} />, color: '#6366f1' },
    { id: 'files', name: 'Files', icon: <FileText size={iconSize} />, color: '#f59e0b' },
    { id: 'reports', name: 'Reports', icon: <BarChart3 size={iconSize} />, color: '#06b6d4' },
    // Thêm ứng dụng: mở App Drawer
    { id: 'add-app', name: 'Add app', icon: <PlusSquare size={iconSize} />, color: '#22c55e' },
  ], [])

  // Tập tất cả app cho App Drawer
  const allApps = useMemo<AppMeta[]>(() => {
    const extra: AppMeta[] = [
      { id: 'mail', name: 'Mail', icon: <Mail size={iconSize} />, color: '#0ea5e9' },
      { id: 'settings', name: 'Settings', icon: <Settings size={iconSize} />, color: '#a3a3a3' },
      { id: 'calc', name: 'Calculator', icon: <Calculator size={iconSize} />, color: '#14b8a6' },
      { id: 'gallery', name: 'Gallery', icon: <ImageIcon size={iconSize} />, color: '#f472b6' },
      // Web links (mở tab mới)
      { id: 'web-react', name: 'React Docs', icon: <Globe size={iconSize} />, color: '#0ea5e9', href: 'https://react.dev' },
      { id: 'web-github', name: 'GitHub', icon: <Globe size={iconSize} />, color: '#111827', href: 'https://github.com' },
      { id: 'web-sider', name: 'Sider', icon: <Globe size={iconSize} />, color: '#7c3aed', href: 'https://sider.ai' },
      { id: 'web-creator', name: 'Web Creator', icon: <Code size={iconSize} />, color: '#f97316', href: 'https://sider.ai/vi/agents/web-creator/68a6d04d7b28bae49813a202#1756346190286' },
      // Open link prompt
      { id: 'open-link', name: 'Open link…', icon: <Link2 size={iconSize} />, color: '#22c55e' },
    ]
    return [...pinned.filter(p => p.id !== 'add-app'), ...extra]
  }, [pinned])

  /** App Drawer open/close */
  const [drawerOpen, setDrawerOpen] = useState(false)

  /** Quản lý cửa sổ đang mở theo thứ tự z-index (cuối là top) */
  const [openIds, setOpenIds] = useState<AppId[]>([])

  /** Tìm meta theo id */
  const getMeta = useCallback((id: AppId) => {
    return allApps.find(a => a.id === id)!
  }, [allApps])

  /** Mở app: nếu là add-app => mở Drawer; nếu là link => mở tab mới; nếu đã mở => đưa lên trên cùng */
  const openApp = useCallback((id: AppId) => {
    if (id === 'add-app') {
      setDrawerOpen(true)
      return
    }
    if (id === 'open-link') {
      const url = prompt('Enter URL to open:')
      if (url) {
        const safeUrl = normalizeUrl(url)
        try {
          window.open(safeUrl, '_blank', 'noopener,noreferrer')
        } catch {}
      }
      return
    }
    const meta = allApps.find(a => a.id === id)
    if (meta?.href) {
      // App dạng link: mở tab mới
      try {
        window.open(meta.href, '_blank', 'noopener,noreferrer')
      } catch {}
      return
    }
    setOpenIds(prev => {
      const exist = prev.includes(id)
      if (exist) {
        return [...prev.filter(x => x !== id), id]
      }
      return [...prev, id]
    })
  }, [allApps])

  /** Đóng app */
  const closeApp = useCallback((id: AppId) => {
    setOpenIds(prev => prev.filter(x => x !== id))
  }, [])

  /** Focus app (đưa lên trên) */
  const focusApp = useCallback((id: AppId) => {
    setOpenIds(prev => [...prev.filter(x => x !== id), id])
  }, [])

  return (
    <div className="relative min-h-screen bg-black">
      {/* Hình nền desktop */}
      <div className="absolute inset-0 -z-10">
        <img
          src="https://pub-cdn.sider.ai/u/U0KAHZLJL0Y/web-coder/68a670977b28bae4981228ab/resource/737de21a-3e91-4247-b567-1dd7aacaf830.jpg"
          className="h-full w-full object-cover"
          alt="Wallpaper"
        />
        {/* Overlay tăng tương phản */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />
      </div>

      {/* Nơi đặt các cửa sổ app */}
      {openIds.map((id, idx) => {
        const meta = getMeta(id)
        const z = 80 + idx // base z-index phía trên taskbar
        return (
          <AppWindow
            key={id}
            app={meta}
            zIndex={z}
            onFocus={() => focusApp(id)}
            onClose={() => closeApp(id)}
          >
            {/* Nội dung demo mỗi app */}
            <WindowContent appId={id} />
          </AppWindow>
        )
      })}

      {/* Taskbar */}
      <Taskbar
        pinned={pinned}
        activeIds={openIds}
        onOpen={openApp}
        onToggleDrawer={() => setDrawerOpen(v => !v)}
      />

      {/* App Drawer */}
      <AppDrawer
        open={drawerOpen}
        apps={allApps}
        onClose={() => setDrawerOpen(false)}
        onOpen={openApp}
      />
    </div>
  )
}

/** Chuẩn hoá URL: thêm https:// nếu thiếu scheme */
function normalizeUrl(raw: string) {
  const s = raw.trim()
  if (!s) return s
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

/** Nội dung demo cho từng app; có thể thay bằng component thực tế ở tương lai */
function WindowContent({ appId }: { appId: AppId }) {
  if (appId === 'calendar') {
    return (
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Calendar</h3>
        <p className="text-white/80">Your events and schedules will appear here.</p>
        <img src="https://pub-cdn.sider.ai/u/U0KAHZLJL0Y/web-coder/68a670977b28bae4981228ab/resource/4d5a051e-2999-47f5-bef1-d8b4d2eead7f.jpg" className="h-40 w-full rounded-xl object-cover" />
      </div>
    )
  }
  if (appId === 'users') {
    return (
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Users</h3>
        <p className="text-white/80">Manage user profiles and roles.</p>
        <img src="https://pub-cdn.sider.ai/u/U0KAHZLJL0Y/web-coder/68a670977b28bae4981228ab/resource/d37595d2-2390-4cef-8365-b62c6b2774a2.png" className="h-40 w-full rounded-xl object-cover" />
      </div>
    )
  }
  if (appId === 'crm') {
    return (
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">CRM</h3>
        <p className="text-white/80">Track leads, opportunities, and customer interactions.</p>
        <img src="https://pub-cdn.sider.ai/u/U0KAHZLJL0Y/web-coder/68a670977b28bae4981228ab/resource/d8be1c12-4579-469a-a6b2-b7baa2ae3b58.jpg" className="h-40 w-full rounded-xl object-cover" />
      </div>
    )
  }
  if (appId === 'files') {
    return (
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Files</h3>
        <p className="text-white/80">Browse and organize your documents.</p>
        <img src="https://pub-cdn.sider.ai/u/U0KAHZLJL0Y/web-coder/68a670977b28bae4981228ab/resource/ee781ace-1d9b-4505-a8e6-080e94de41d3.jpg" className="h-40 w-full rounded-xl object-cover" />
      </div>
    )
  }
  if (appId === 'reports') {
    return (
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Reports</h3>
        <p className="text-white/80">Generate and review business reports.</p>
        <img src="https://pub-cdn.sider.ai/u/U0KAHZLJL0Y/web-coder/68a670977b28bae4981228ab/resource/2ae9120d-025f-494a-a67b-dddc66a9aa6a.jpg" className="h-40 w-full rounded-xl object-cover" />
      </div>
    )
  }
  if (appId === 'mail') {
    return (
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Mail</h3>
        <p className="text-white/80">Check your inbox and compose messages.</p>
        <img src="https://pub-cdn.sider.ai/u/U0KAHZLJL0Y/web-coder/68a670977b28bae4981228ab/resource/6e7167ca-45f9-4d81-a8f6-8c7b15e157ab.jpg" className="h-40 w-full rounded-xl object-cover" />
      </div>
    )
  }
  if (appId === 'settings') {
    return (
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Settings</h3>
        <p className="text-white/80">System & personalization options.</p>
        <img src="https://pub-cdn.sider.ai/u/U0KAHZLJL0Y/web-coder/68a670977b28bae4981228ab/resource/a5afb343-3a10-4a00-83ab-250e9e602fd5.jpg" className="h-40 w-full rounded-xl object-cover" />
      </div>
    )
  }
  if (appId === 'calc') {
    return (
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Calculator</h3>
        <p className="text-white/80">Quick calculations at your fingertips.</p>
        <img src="https://pub-cdn.sider.ai/u/U0KAHZLJL0Y/web-coder/68a670977b28bae4981228ab/resource/02a7c3ed-b265-4d89-98d8-c5bab87ddffd.jpg" className="h-40 w-full rounded-xl object-cover" />
      </div>
    )
  }
  if (appId === 'gallery') {
    return (
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Gallery</h3>
        <p className="text-white/80">View your media gallery.</p>
        <img src="https://pub-cdn.sider.ai/u/U0KAHZLJL0Y/web-coder/68a670977b28bae4981228ab/resource/c91f774f-57a2-4e19-9802-c995cefb2d6a.jpg" className="h-40 w-full rounded-xl object-cover" />
      </div>
    )
  }
  if (appId === 'web-creator') {
    return (
      <div className="space-y-3 h-full flex flex-col">
        <h3 className="text-xl font-semibold">Web Creator</h3>
        <p className="text-white/80 mb-3">Create and manage your web applications.</p>
        <div className="flex-1 min-h-0">
          <iframe 
            src="https://sider.ai/vi/agents/web-creator/68a6d04d7b28bae49813a202#1756346190286"
            className="w-full h-full rounded-xl border border-white/20"
            title="Web Creator Form"
          />
        </div>
      </div>
    )
  }
  // Fallback
  return (
    <div className="space-y-3">
      <h3 className="text-xl font-semibold">App</h3>
      <p className="text-white/80">This app content will be available soon.</p>
      <img src="https://pub-cdn.sider.ai/u/U0KAHZLJL0Y/web-coder/68a670977b28bae4981228ab/resource/90288cb5-f2f7-4b27-b915-b0fda9aa5fe0.jpg" className="h-40 w-full rounded-xl object-cover" />
    </div>
  )
}

