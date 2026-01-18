'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'

interface RestaurantDetails {
  id: string
  name: string
  slug: string
  description?: string
  phone?: string
  email?: string
  address?: string
  createdAt: string
  owner: {
    id: string
    phone: string
    firstName?: string
    lastName?: string
  }
  subscription: {
    id: string
    plan: string
    status: string
    currentPeriodStart?: string
    currentPeriodEnd?: string
    createdAt: string
  }
  _count: {
    qrCodes: number
    menuItems: number
    categories: number
    branches: number
  }
}

export default function AdminRestaurantDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.id as string
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [renewData, setRenewData] = useState({
    duration: 1,
    plan: 'PRO',
  })

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurant()
    }
  }, [restaurantId])

  const fetchRestaurant = async () => {
    try {
      const response = await api.get(`/admin/restaurants/${restaurantId}`)
      setRestaurant(response.data)
    } catch (error) {
      console.error('Failed to fetch restaurant:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('هل أنت متأكد من إلغاء الاشتراك لهذا المطعم؟ سيتم منع الوصول إلى لوحة التحكم والمنيو فوراً.')) {
      return
    }

    try {
      await api.patch(`/admin/subscriptions/${restaurantId}/cancel`)
      alert('تم إلغاء الاشتراك بنجاح')
      fetchRestaurant()
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل إلغاء الاشتراك')
    }
  }

  const handleRenewSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.patch(`/admin/subscriptions/${restaurantId}/renew`, renewData)
      alert('تم تجديد الاشتراك بنجاح')
      setShowRenewModal(false)
      setRenewData({ duration: 1, plan: 'PRO' })
      fetchRestaurant()
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل تجديد الاشتراك')
    }
  }

  const calculateRemainingDays = (endDate?: string): number | null => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return <div className="text-center py-12">جاري التحميل...</div>
  }

  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">لم يتم العثور على المطعم</p>
        <Link href="/admin" className="text-primary-600 hover:underline mt-4 inline-block">
          العودة للوحة التحكم
        </Link>
      </div>
    )
  }

  const remainingDays = calculateRemainingDays(restaurant.subscription.currentPeriodEnd)
  const isExpired = remainingDays !== null && remainingDays < 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                ← العودة
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                تفاصيل المطعم
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{restaurant.name}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">معلومات المطعم</h3>
              <div className="space-y-2">
                <p><span className="font-semibold">الاسم:</span> {restaurant.name}</p>
                <p><span className="font-semibold">الرابط:</span> {restaurant.slug}</p>
                {restaurant.description && (
                  <p><span className="font-semibold">الوصف:</span> {restaurant.description}</p>
                )}
                {restaurant.phone && (
                  <p><span className="font-semibold">الهاتف:</span> {restaurant.phone}</p>
                )}
                {restaurant.email && (
                  <p><span className="font-semibold">البريد:</span> {restaurant.email}</p>
                )}
                {restaurant.address && (
                  <p><span className="font-semibold">العنوان:</span> {restaurant.address}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">معلومات المالك</h3>
              <div className="space-y-2">
                <p><span className="font-semibold">الهاتف:</span> {restaurant.owner.phone}</p>
                {restaurant.owner.firstName && (
                  <p><span className="font-semibold">الاسم الأول:</span> {restaurant.owner.firstName}</p>
                )}
                {restaurant.owner.lastName && (
                  <p><span className="font-semibold">الاسم الأخير:</span> {restaurant.owner.lastName}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">معلومات الاشتراك</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">الخطة</p>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  restaurant.subscription.plan === 'PRO' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {restaurant.subscription.plan}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">الحالة</p>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  restaurant.subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {restaurant.subscription.status}
                </span>
              </div>

              {restaurant.subscription.currentPeriodStart && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">تاريخ البدء</p>
                  <p className="font-semibold">
                    {new Date(restaurant.subscription.currentPeriodStart).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              )}

              {restaurant.subscription.currentPeriodEnd && (
                <div className={`rounded-lg p-4 ${
                  isExpired ? 'bg-red-50' : remainingDays !== null && remainingDays <= 7 ? 'bg-yellow-50' : 'bg-gray-50'
                }`}>
                  <p className="text-sm text-gray-600 mb-2">تاريخ الانتهاء</p>
                  <p className="font-semibold mb-2">
                    {new Date(restaurant.subscription.currentPeriodEnd).toLocaleDateString('ar-EG')}
                  </p>
                  {isExpired ? (
                    <p className="text-sm text-red-600 font-semibold">⚠️ انتهت مدة الاشتراك</p>
                  ) : remainingDays !== null ? (
                    <p className="text-sm">
                      <span className="font-semibold">المدة المتبقية:</span>{' '}
                      <span className={`font-bold ${
                        remainingDays <= 7 ? 'text-red-600' :
                        remainingDays <= 30 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {remainingDays} يوم
                      </span>
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">الإحصائيات</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{restaurant._count.qrCodes}</p>
                <p className="text-sm text-gray-600">رموز QR</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{restaurant._count.menuItems}</p>
                <p className="text-sm text-gray-600">عناصر القائمة</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{restaurant._count.categories}</p>
                <p className="text-sm text-gray-600">الفئات</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{restaurant._count.branches}</p>
                <p className="text-sm text-gray-600">الفروع</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 mt-6 flex gap-4">
            {restaurant.subscription.status === 'ACTIVE' ? (
              <button
                onClick={handleCancelSubscription}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition shadow-lg"
              >
                إلغاء الاشتراك فوراً
              </button>
            ) : (
              <button
                onClick={() => {
                  setRenewData({
                    duration: 1,
                    plan: restaurant.subscription.plan || 'PRO',
                  })
                  setShowRenewModal(true)
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-lg"
              >
                تجديد الاشتراك
              </button>
            )}
            {restaurant.subscription.status === 'ACTIVE' && (
              <button
                onClick={() => {
                  setRenewData({
                    duration: 1,
                    plan: restaurant.subscription.plan || 'PRO',
                  })
                  setShowRenewModal(true)
                }}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition shadow-lg"
              >
                تجديد الاشتراك
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Renew Subscription Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">تجديد الاشتراك</h3>
            <form onSubmit={handleRenewSubscription} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  مدة الاشتراك (بالأشهر)
                </label>
                <select
                  value={renewData.duration}
                  onChange={(e) => setRenewData({ ...renewData, duration: parseInt(e.target.value) })}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
                  required
                >
                  <option value={1}>شهر واحد</option>
                  <option value={3}>3 أشهر</option>
                  <option value={6}>6 أشهر</option>
                  <option value={12}>12 شهر (سنة)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  خطة الاشتراك
                </label>
                <select
                  value={renewData.plan}
                  onChange={(e) => setRenewData({ ...renewData, plan: e.target.value })}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
                  required
                >
                  <option value="PRO">برو</option>
                  <option value="ENTERPRISE">مؤسسة</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  تجديد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
