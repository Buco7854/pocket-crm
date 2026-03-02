import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import AppSidebar from './AppSidebar'
import AppTopbar from './AppTopbar'
import Toaster from '@/components/ui/Toaster'

export default function AppLayout() {
  // Initialize theme on layout mount
  useTheme()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
          <AppSidebar
            collapsed={false}
            onToggleCollapse={() => setMobileSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div
        className={`transition-all duration-300 ease-[var(--ease-spring)] ${
          sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-60'
        }`}
      >
        <AppTopbar
          sidebarCollapsed={sidebarCollapsed}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Global toast notifications */}
      <Toaster />
    </div>
  )
}
