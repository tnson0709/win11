/**
 * components/window/AppWindow.tsx
 * Cửa sổ ứng dụng với acrylic, bo góc, và animation mở. Có nút Close, Maximize/Restore,
 * hỗ trợ kéo-thả vị trí và kéo giãn kích thước bằng pointer events.
 */

import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AppMeta } from '../../types/apps'
import { X, Maximize2, Minimize2 } from 'lucide-react'

/** Khung tham số cho AppWindow */
interface AppWindowProps extends PropsWithChildren {
  /** Meta ứng dụng (tên, icon) */
  app: AppMeta
  /** Z-index để sắp xếp chồng */
  zIndex: number
  /** Được gọi khi cửa sổ nhận focus (click) */
  onFocus: () => void
  /** Đóng cửa sổ */
  onClose: () => void
}

/** Vị trí và kích thước cửa sổ tính theo px */
interface Rect {
  left: number
  top: number
  width: number
  height: number
}

/** Ràng buộc kích thước tối thiểu */
const MIN_W = 360
const MIN_H = 220
/** Lề an toàn so với mép màn hình khi maximize/giới hạn */
const SAFE_GAP = 8
/** Chiều cao taskbar ước tính để chừa khoảng khi maximize */
const TASKBAR_H = 64

/**
 * AppWindow: container khung cửa sổ.
 * - Kéo-thả: giữ titlebar để kéo.
 * - Kéo giãn: 8 điểm resize (4 cạnh + 4 góc).
 * - Maximize/Restore: nút trên titlebar và double-click titlebar.
 */
export default function AppWindow({ app, zIndex, onFocus, onClose, children }: AppWindowProps) {
  const viewport = useViewport()
  const initRect = useMemo(() => initialRect(viewport.width, viewport.height), [viewport.width, viewport.height])

  const [rect, setRect] = useState<Rect>(initRect)
  const [isMax, setIsMax] = useState<boolean>(false)
  const [dragging, setDragging] = useState<boolean>(false)
  const [resizing, setResizing] = useState<boolean>(false)
  const prevRectRef = useRef<Rect | null>(null)

  // Cập nhật lại để đảm bảo cửa sổ không tràn khi thay đổi kích thước viewport
  useEffect(() => {
    setRect((r) => clampRect(r, viewport))
  }, [viewport.width, viewport.height])

  const handleToggleMax = useCallback(() => {
    setIsMax((prev) => {
      if (!prev) {
        // Lưu rect hiện tại để restore
        prevRectRef.current = rect
        setRect(maximizedRect(viewport))
        return true
      } else {
        // Khôi phục
        const restore = prevRectRef.current ? clampRect(prevRectRef.current, viewport) : initialRect(viewport.width, viewport.height)
        setRect(restore)
        return false
      }
    })
  }, [rect, viewport])

  const onTitlebarPointerDown = useCallback((e: React.PointerEvent) => {
    if (isMax) return // không kéo khi đang maximize
    onFocus()
    setDragging(true)
    const startX = e.clientX
    const startY = e.clientY
    const startRect = rect
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      setRect((prev) => clampRect({ ...startRect, left: startRect.left + dx, top: startRect.top + dy }, viewport))
    }
    const onUp = () => {
      setDragging(false)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [rect, viewport, isMax, onFocus])

  const onTitlebarDoubleClick = useCallback(() => {
    handleToggleMax()
  }, [handleToggleMax])

  const startResize = useCallback((dir: ResizeDir) => (e: React.PointerEvent) => {
    if (isMax) return
    onFocus()
    setResizing(true)
    const startX = e.clientX
    const startY = e.clientY
    const start = rect

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      const next = computeResize(dir, start, dx, dy)
      setRect((_) => clampRect(next, viewport))
    }
    const onUp = () => {
      setResizing(false)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [rect, viewport, isMax, onFocus])

  return (
    <div
      onMouseDown={onFocus}
      className={[
        'absolute z-[50] animate-in fade-in zoom-in-95 duration-200',
        (dragging || resizing) ? 'select-none' : '',
      ].join(' ')}
      style={{
        zIndex,
        left: isMax ? maximizedRect(viewport).left : rect.left,
        top: isMax ? maximizedRect(viewport).top : rect.top,
        width: isMax ? maximizedRect(viewport).width : rect.width,
        height: isMax ? maximizedRect(viewport).height : rect.height,
      }}
      role="dialog"
      aria-label={app.name}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/15 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/10">
        {/* Titlebar */}
        <div
          className="flex cursor-move items-center justify-between border-b border-white/10 px-4 py-2"
          onPointerDown={onTitlebarPointerDown}
          onDoubleClick={onTitlebarDoubleClick}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: app.color }}
            >
              <span className="text-white">{app.icon}</span>
            </div>
            <div className="text-white/90">{app.name}</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToggleMax()
              }}
              className="rounded-xl border border-white/10 bg-white/10 p-1.5 text-white hover:bg-white/20 active:scale-95"
              title={isMax ? 'Restore' : 'Maximize'}
              aria-label={isMax ? 'Restore window' : 'Maximize window'}
            >
              {isMax ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="rounded-xl border border-white/10 bg-white/10 p-1.5 text-white hover:bg-white/20 active:scale-95"
              title="Close"
              aria-label="Close window"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-auto p-4 text-white/90">
          {children}
        </div>

        {/* Resize handles (ẩn nhưng có vùng hit) */}
        {!isMax && (
          <>
            {/* Edges */}
            <ResizeHandle position="n" onPointerDown={startResize('n')} />
            <ResizeHandle position="s" onPointerDown={startResize('s')} />
            <ResizeHandle position="e" onPointerDown={startResize('e')} />
            <ResizeHandle position="w" onPointerDown={startResize('w')} />
            {/* Corners */}
            <ResizeHandle position="ne" onPointerDown={startResize('ne')} />
            <ResizeHandle position="nw" onPointerDown={startResize('nw')} />
            <ResizeHandle position="se" onPointerDown={startResize('se')} />
            <ResizeHandle position="sw" onPointerDown={startResize('sw')} />
          </>
        )}
      </div>
    </div>
  )
}

/** Hook trả về kích thước viewport hiện tại */
function useViewport() {
  const [vw, setVw] = useState({ width: window.innerWidth, height: window.innerHeight })
  useEffect(() => {
    const onR = () => setVw({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onR)
    return () => window.removeEventListener('resize', onR)
  }, [])
  return vw
}

/** Tạo rect ban đầu (giữa màn hình, kích thước vừa phải) */
function initialRect(vw: number, vh: number): Rect {
  const width = Math.min(Math.max(820, MIN_W), vw - SAFE_GAP * 2)
  const height = Math.min(Math.max(520, MIN_H), vh - SAFE_GAP * 2 - TASKBAR_H)
  const left = Math.max(SAFE_GAP, Math.round((vw - width) / 2))
  const top = Math.max(SAFE_GAP, Math.round(vh * 0.16))
  return { left, top, width, height }
}

/** Tạo rect khi maximize (chừa biên an toàn và taskbar) */
function maximizedRect(vp: { width: number; height: number }): Rect {
  return {
    left: SAFE_GAP,
    top: SAFE_GAP,
    width: Math.max(MIN_W, vp.width - SAFE_GAP * 2),
    height: Math.max(MIN_H, vp.height - SAFE_GAP * 2 - TASKBAR_H),
  }
}

/** Chặn cửa sổ không vượt ngoài viewport và không nhỏ hơn min */
function clampRect(r: Rect, vp: { width: number; height: number }): Rect {
  const width = Math.min(Math.max(r.width, MIN_W), Math.max(MIN_W, vp.width - SAFE_GAP * 2))
  const height = Math.min(Math.max(r.height, MIN_H), Math.max(MIN_H, vp.height - SAFE_GAP * 2 - TASKBAR_H))
  const leftMax = vp.width - SAFE_GAP - width
  const topMax = vp.height - SAFE_GAP - TASKBAR_H - height
  const left = Math.min(Math.max(r.left, SAFE_GAP), Math.max(SAFE_GAP, leftMax))
  const top = Math.min(Math.max(r.top, SAFE_GAP), Math.max(SAFE_GAP, topMax))
  return { left, top, width, height }
}

/** Hướng resize cho handle */
type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

/** Tính rect mới dựa trên hướng resize, từ rect ban đầu và delta chuột */
function computeResize(dir: ResizeDir, start: Rect, dx: number, dy: number): Rect {
  let { left, top, width, height } = start
  // Góc
  if (dir.includes('e')) {
    width = width + dx
  }
  if (dir.includes('s')) {
    height = height + dy
  }
  if (dir.includes('w')) {
    width = width - dx
    left = left + dx
  }
  if (dir.includes('n')) {
    height = height - dy
    top = top + dy
  }
  // Đảm bảo không nhỏ hơn min tại bước tính toán
  if (width < MIN_W) {
    // nếu co theo W, điều chỉnh left cho đúng cảm giác kéo
    if (dir.includes('w')) left = left + (width - MIN_W)
    width = MIN_W
  }
  if (height < MIN_H) {
    if (dir.includes('n')) top = top + (height - MIN_H)
    height = MIN_H
  }
  return { left, top, width, height }
}

/** ResizeHandle: lớp phủ mỏng để bắt pointer cho resize */
function ResizeHandle({
  position,
  onPointerDown,
}: {
  position: ResizeDir
  onPointerDown: (e: React.PointerEvent) => void
}) {
  const common = 'absolute bg-transparent'
  const sizeEdge = '4px'
  const sizeCorner = '10px'

  // Vị trí và con trỏ chuột
  const map: Record<ResizeDir, { style: React.CSSProperties; cursor: string }> = {
    n: { style: { top: 0, left: sizeCorner, right: sizeCorner, height: sizeEdge }, cursor: 'ns-resize' },
    s: { style: { bottom: 0, left: sizeCorner, right: sizeCorner, height: sizeEdge }, cursor: 'ns-resize' },
    e: { style: { right: 0, top: sizeCorner, bottom: sizeCorner, width: sizeEdge }, cursor: 'ew-resize' },
    w: { style: { left: 0, top: sizeCorner, bottom: sizeCorner, width: sizeEdge }, cursor: 'ew-resize' },
    ne: { style: { top: 0, right: 0, width: sizeCorner, height: sizeCorner }, cursor: 'nesw-resize' },
    nw: { style: { top: 0, left: 0, width: sizeCorner, height: sizeCorner }, cursor: 'nwse-resize' },
    se: { style: { bottom: 0, right: 0, width: sizeCorner, height: sizeCorner }, cursor: 'nwse-resize' },
    sw: { style: { bottom: 0, left: 0, width: sizeCorner, height: sizeCorner }, cursor: 'nesw-resize' },
  }

  return (
    <div
      onPointerDown={onPointerDown}
      style={{ ...map[position].style, cursor: map[position].cursor }}
      className={common}
      aria-hidden
    />
  )
}

