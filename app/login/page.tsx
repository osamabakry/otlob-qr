'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    setLoading(true)

    try {
      if (!phone) {
        setError('يرجى إدخال رقم الهاتف')
        setLoading(false)
        return
      }

      const response = await authService.login(phone.trim(), password || undefined) as any
      
      if (response.requiresPasswordSetup) {
        setRequiresPasswordSetup(true)
        return
      }

      // Redirect based on role
      if (response.user.role === 'SUPER_ADMIN') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      const errorMessage = err.response?.data?.message || err.message || 'فشل تسجيل الدخول'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    setLoading(true)

    try {
      if (!newPassword || !confirmPassword) {
        setError('يرجى إدخال كلمة المرور وتأكيدها')
        setLoading(false)
        return
      }

      if (newPassword !== confirmPassword) {
        setError('كلمات المرور غير متطابقة')
        setLoading(false)
        return
      }

      if (newPassword.length < 8) {
        setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
        setLoading(false)
        return
      }

      const response = await authService.setPassword(newPassword, confirmPassword)
      
      // Redirect based on role
      if (response.user.role === 'SUPER_ADMIN') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Set password error:', err)
      const errorMessage = err.response?.data?.message || err.message || 'فشل تعيين كلمة المرور'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 relative z-10 animate-scaleIn">
        <div className="text-center">
          <div className="mb-4 animate-bounce">
            <div className="text-5xl">📱</div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">اطلبها QR</h1>
          <h2 className="text-2xl font-semibold text-gray-700">
            تسجيل الدخول
          </h2>
        </div>
        {!requiresPasswordSetup ? (
          <form 
            className="mt-8 space-y-6" 
            onSubmit={handleLogin}
            method="post"
            action="#"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-right">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  رقم الهاتف
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
                  placeholder="05xxxxxxxx"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  كلمة المرور (اختياري - للمستخدمين الجدد)
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
                  placeholder="اتركه فارغاً إذا كنت تريد تعيين كلمة مرور جديدة"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </div>
          </form>
        ) : (
          <form 
            className="mt-8 space-y-6" 
            onSubmit={handleSetPassword}
            method="post"
            action="#"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-right">
                {error}
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-right mb-4">
              مرحباً! يرجى تعيين كلمة مرور لحسابك
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  كلمة المرور الجديدة
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
                  placeholder="8 أحرف على الأقل"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  تأكيد كلمة المرور
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
                  placeholder="أعد إدخال كلمة المرور"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    جاري تعيين كلمة المرور...
                  </span>
                ) : (
                  'تعيين كلمة المرور'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
