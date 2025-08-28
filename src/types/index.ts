/**
 * types/apps.ts
 * Khai báo kiểu dữ liệu cho ứng dụng (app) hiển thị trong hệ thống desktop.
 */

import type { ReactElement } from 'react'

/** Danh sách ID ứng dụng hợp lệ */
export type AppId =
  | 'calendar'
  | 'users'
  | 'crm'
  | 'files'
  | 'reports'
  | 'add-app'
  | 'mail'
  | 'settings'
  | 'calc'
  | 'gallery'
  | 'notes'
  /** Mở URL bất kỳ bằng trình duyệt */
  | 'open-link'
  /** Các app dạng web-link ví dụ */
  | 'web-sider'
  | 'web-react'
  | 'web-github'
  | 'web-creator'

/** Thông tin meta cho mỗi ứng dụng */
export interface AppMeta {
  /** Mã định danh của ứng dụng */
  id: AppId
  /** Tên hiển thị của ứng dụng */
  name: string
  /** Icon ReactElement (lucide-react) */
  icon: ReactElement
  /** Màu chủ đạo cho icon nền tròn */
  color: string
  /**
   * Nếu là app dạng liên kết (web link), mở trong tab mới.
   * Nếu có href, app sẽ không mở window nội bộ mà mở window.open(href, '_blank')
   */
  href?: string
}

