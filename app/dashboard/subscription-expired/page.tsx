'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface SubscriptionInfo {
  message: string
  expiredAt: string
}

export default function SubscriptionExpiredPage() {
  const router = useRouter()
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  useEffect(() => {
    // Get subscription info from localStorage
    const stored = localStorage.getItem('subscriptionExpired')
    if (stored) {
      setSubscriptionInfo(JSON.parse(stored))
    }

    // Try to get restaurant ID from URL or localStorage
    const pathParts = window.location.pathname.split('/')
    const idFromPath = pathParts[pathParts.length - 1]
    if (idFromPath && idFromPath !== 'subscription-expired') {
      setRestaurantId(idFromPath)
    }

    // Clear the stored error
    localStorage.removeItem('subscriptionExpired')
  }, [])

  const handleRenew = async () => {
    if (!restaurantId) {
      // If no restaurant ID, redirect to dashboard
      router.push('/dashboard')
      return
    }

    try {
      // Redirect to subscription page or contact admin
      router.push(`/dashboard/restaurants/${restaurantId}/subscription`)
    } catch (error) {
      console.error('Failed to navigate to subscription page:', error)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            انتهت مدة الاشتراك
          </h1>
        </div>

        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
          <p className="text-lg text-gray-800 mb-4">
            {subscriptionInfo?.message || 'انتهت مدة الاشتراك. يرجى تجديد الاشتراك للوصول إلى لوحة التحكم والمنيو.'}
          </p>
          {subscriptionInfo?.expiredAt && (
            <p className="text-sm text-gray-600">
              تاريخ الانتهاء: <span className="font-bold">{formatDate(subscriptionInfo.expiredAt)}</span>
            </p>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={handleRenew}
            className="w-full bg-primary-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            تجديد الاشتراك الآن
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-200 text-gray-800 px-8 py-4 rounded-xl font-semibold hover:bg-gray-300 transition"
          >
            العودة للوحة التحكم
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            للاستفسارات أو المساعدة، يرجى التواصل مع إدارة المنصة
          </p>
        </div>
      </div>
    </div>
  )
}
