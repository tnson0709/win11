/**
 * components/shell/Taskbar.tsx
 * Taskbar phong cách Windows 11: nút Apps (Start), các task ghim (pinned), và đồng hồ bên phải.
 */

import { useEffect, useState } from 'react'
import type { AppMeta } from '../../types/apps'
import { Grid3X3, Dot, Circle } from 'lucide-react'

/** Props cho Taskbar */
interface TaskbarProps {
  /** Danh sách app ghim trên taskbar */
  pinned: AppMeta[]
  /** Danh sách app đang mở (để highlight) */
  activeIds: string[]
  /** Mở một app theo id */
  onOpen: (id: AppMeta['id']) => void
  /** Toggle App Drawer (Apps) */
  onToggleDrawer: () => void
}

/**
 * Taskbar: group icon ở giữa, phong cách kính mờ với bo góc.
 */
export default function Taskbar({ pinned, activeIds, onOpen, onToggleDrawer }: TaskbarProps) {
  const [time, setTime] = useState<string>(() => formatTime(new Date()))

  useEffect(() => {
    const i = setInterval(() => setTime(formatTime(new Date())), 60 * 1000)
    return () => clearInterval(i)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex items-end justify-center pb-2">
      {/* Khối nhóm chính */}
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-1.5 pl-2 pr-2 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
        {/* Nút Apps (Start) */}
        <button
          title="Apps"
          onClick={onToggleDrawer}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white hover:bg-white/15 active:scale-95 transition"
        >
          <Grid3X3 className="h-5 w-5" />
        </button>

        {/* Dấu chấm phân cách nhẹ */}
        <Dot className="h-6 w-6 text-white/40" />

        {/* Các app ghim */}
        <div className="flex items-center gap-1.5">
          {pinned.map((app) => {
            const isActive = activeIds.includes(app.id)
            return (
              <button
                key={app.id}
                title={app.name}
                onClick={() => onOpen(app.id)}
                className={[
                  'flex h-10 w-10 items-center justify-center rounded-xl transition',
                  'hover:bg-white/15 active:scale-95',
                  isActive ? 'ring-2 ring-white/70 bg-white/15' : '',
                ].join(' ')}
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ backgroundColor: app.color }}
                >
                  {/* Icon của app */}
                  <span className="text-white">{app.icon}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Khay phải (đồng hồ) */}
      <div className="pointer-events-auto absolute right-3 bottom-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
        <div className="flex items-center gap-2">
          <Circle className="h-3.5 w-3.5 text-emerald-300" />
          <span className="tabular-nums">{time}</span>
        </div>
      </div>
    </div>
  )
}

/** Định dạng giờ phút dạng 24h */
function formatTime(d: Date) {
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${hh}:${mm}`
}

