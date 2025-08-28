/**
 * components/shell/AppDrawer.tsx
 * App Drawer (Start) dạng modal acrylic với ô tìm kiếm và lưới icon ứng dụng.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppId, AppMeta } from '../../types/apps'
import { Search, X } from 'lucide-react'

/** Props cho AppDrawer */
interface AppDrawerProps {
  /** Trạng thái mở/đóng */
  open: boolean
  /** Danh sách toàn bộ app để hiển thị */
  apps: AppMeta[]
  /** Đóng Drawer */
  onClose: () => void
  /** Mở app theo id */
  onOpen: (id: AppId) => void
}

/**
 * AppDrawer: hiện ở giữa màn hình, có overlay + acrylic + animation.
 */
export default function AppDrawer({ open, apps, onClose, onOpen }: AppDrawerProps) {
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) {
      // Auto-focus ô tìm kiếm khi mở
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQ('')
    }
  }, [open])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return apps
    return apps.filter(a => a.name.toLowerCase().includes(query))
  }, [apps, q])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 opacity-100"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel chính */}
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 transform rounded-3xl border border-white/20 bg-white/15 p-4 shadow-2xl backdrop-blur-2xl transition-all dark:border-white/10 dark:bg-white/10">
        {/* Header: Search + Close */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search apps..."
              className="w-full rounded-xl border border-white/20 bg-white/15 py-2 pl-9 pr-3 text-white placeholder:text-white/60 outline-none backdrop-blur-md focus:ring-2 focus:ring-white/60 dark:border-white/10"
            />
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/20 bg-white/15 p-2 text-white hover:bg-white/25 active:scale-95 dark:border-white/10"
            aria-label="Close"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Grid icon */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map(app => (
            <button
              key={app.id}
              onClick={() => {
                onOpen(app.id)
                onClose()
              }}
              className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 text-left text-white transition hover:bg-white/20 active:scale-95"
              title={app.name}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: app.color }}
              >
                <span className="text-white">{app.icon}</span>
              </div>
              <div className="flex-1">
                <div className="font-medium leading-tight">{app.name}</div>
                <div className="text-xs text-white/70">App</div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-white/10 bg-white/10 p-6 text-center text-white/80">
              No apps found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

