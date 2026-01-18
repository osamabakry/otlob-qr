'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/lib/auth'
import {
  LayoutDashboard,
  Store,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  CreditCard
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login')
    }
    // Try to get user from local storage if managed there, or decoding token could be an option
    // For now we just render generic user info or fetch if endpoint existed
  }, [router])

  const handleLogout = async () => {
    await authService.logout()
    router.push('/login')
  }

  const navigation = [
    { name: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
    { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
  ]

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true
    if (path !== '/dashboard' && pathname?.startsWith(path)) return true
    return false
  }

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 right-0 z-50 w-72 bg-white border-l border-gray-200 shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-20 flex items-center justify-between px-8 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-primary-800 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-200">
                QR
              </div>
              <span className="font-bold text-xl text-gray-800">اطلبها</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${active
                    ? 'bg-primary-50 text-primary-700 shadow-sm translate-x-[-4px]'
                    : 'text-gray-600 hover:bg-slate-50 hover:text-gray-900'
                    }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon size={22} className={active ? 'text-primary-600' : 'text-gray-400'} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Profile / Logout */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-4 mb-4 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">المستخدم</p>
                <p className="text-xs text-gray-500 truncate">مدير المطعم</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 font-medium"
            >
              <LogOut size={18} />
              <span>تسجيل الخروج</span>
            </button>
            <div className="mt-6 text-center text-xs text-gray-400">
              <p>تم التطوير بكل ❤️ بواسطة</p>
              <a href="https://www.facebook.com/osamabakryofficial" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-primary-600 transition-colors">Osama Bakry</a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="h-20 lg:hidden bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center px-4 justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-primary-600 to-primary-800 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
              QR
            </div>
            <span className="font-bold text-lg text-gray-800">اطلبها</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
