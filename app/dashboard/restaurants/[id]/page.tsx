'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import axios from 'axios'
import { Toast } from '@/app/components/Toast'

interface Category {
  id: string
  name: string
  description?: string
  isActive: boolean
  _count: { items: number }
}

interface MenuItem {
  id: string
  name: string
  price: number
  isAvailable: boolean
  isFeatured?: boolean
  categoryId: string
  image?: string
  description?: string
}

interface Settings {
  id: string
  customLogo?: string
  primaryColor?: string
  languages?: string[]
  defaultLanguage?: string
}

export default function RestaurantManagementPage() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.id as string
  const [restaurant, setRestaurant] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'categories' | 'items' | 'qr' | 'settings'>('categories')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [qrCodes, setQrCodes] = useState<any[]>([])
  const [uploadingItemImage, setUploadingItemImage] = useState<string | null>(null)
  const itemImageInputRef = useRef<HTMLInputElement>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set())
  const colorUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [localPrimaryColor, setLocalPrimaryColor] = useState<string>('#0284c7')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
  }

  const calculateRemainingDays = (endDate?: string): number | null => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurant()
      fetchCategories()
      fetchItems()
      fetchSettings()
      fetchQRCodes()
    }

    // Cleanup timeout on unmount
    return () => {
      if (colorUpdateTimeoutRef.current) {
        clearTimeout(colorUpdateTimeoutRef.current)
      }
    }
  }, [restaurantId])

  const fetchRestaurant = async () => {
    try {
      const response = await api.get(`/restaurants/${restaurantId}`)
      setRestaurant(response.data)
    } catch (error) {
      console.error('Failed to fetch restaurant:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get(`/restaurants/${restaurantId}/menus/categories`)
      setCategories(response.data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchItems = async () => {
    try {
      const response = await api.get(`/restaurants/${restaurantId}/menus/items`)
      setItems(response.data)
    } catch (error) {
      console.error('Failed to fetch items:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await api.get(`/restaurants/${restaurantId}/settings`)
      setSettings(response.data)
      if (response.data?.primaryColor) {
        setLocalPrimaryColor(response.data.primaryColor)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
      showToast('يرجى اختيار صورة بصيغة JPG, PNG, GIF أو WebP', 'error')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('حجم الصورة يجب أن يكون أقل من 5 ميجابايت', 'error')
      return
    }

    if (loadingActions.has('logo-upload')) return
    setLoadingActions(prev => new Set(prev).add('logo-upload'))
    setUploadingLogo(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'logos')

      const token = localStorage.getItem('accessToken')
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

      const uploadResponse = await axios.post(`${API_URL}/storage/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      })

      const logoUrl = uploadResponse.data.url

      // Update settings with new logo
      await api.patch(`/restaurants/${restaurantId}/settings`, {
        customLogo: logoUrl,
      })

      // Refresh settings
      await fetchSettings()
      showToast('تم رفع اللوجو بنجاح!', 'success')
    } catch (error: any) {
      console.error('Failed to upload logo:', error)
      showToast(error.response?.data?.message || 'فشل رفع اللوجو. يرجى المحاولة مرة أخرى.', 'error')
    } finally {
      setUploadingLogo(false)
      setLoadingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete('logo-upload')
        return newSet
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSettingsUpdate = async (updates: Partial<Settings>) => {
    if (loadingActions.has('settings-update')) return
    setLoadingActions(prev => new Set(prev).add('settings-update'))
    try {
      await api.patch(`/restaurants/${restaurantId}/settings`, updates)
      await fetchSettings()
      showToast('تم تحديث الإعدادات بنجاح!', 'success')
    } catch (error: any) {
      console.error('Failed to update settings:', error)
      showToast(error.response?.data?.message || 'فشل تحديث الإعدادات', 'error')
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete('settings-update')
        return newSet
      })
    }
  }

  const handleColorChange = useCallback((newColor: string) => {
    setLocalPrimaryColor(newColor)

    // Clear existing timeout
    if (colorUpdateTimeoutRef.current) {
      clearTimeout(colorUpdateTimeoutRef.current)
    }

    // Debounce the API call
    colorUpdateTimeoutRef.current = setTimeout(() => {
      handleSettingsUpdate({ primaryColor: newColor })
    }, 500)
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast('كلمة المرور غير متطابقة', 'error')
      return
    }
    if (newPassword.length < 8) {
      showToast('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'error')
      return
    }

    if (changingPassword) return
    setChangingPassword(true)

    try {
      await api.post('/auth/set-password', {
        password: newPassword,
        confirmPassword: confirmPassword
      })
      showToast('تم تغيير كلمة المرور بنجاح', 'success')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Failed to change password:', error)
      showToast(error.response?.data?.message || 'فشل تغيير كلمة المرور', 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleCreateCategory = async (name: string, description?: string) => {
    if (loadingActions.has('create-category')) return
    setLoadingActions(prev => new Set(prev).add('create-category'))
    try {
      await api.post(`/restaurants/${restaurantId}/menus/categories`, { name, description })
      await fetchCategories()
      setShowCategoryModal(false)
      showToast('تم إضافة الفئة بنجاح!', 'success')
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل إضافة الفئة', 'error')
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete('create-category')
        return newSet
      })
    }
  }

  const handleUpdateCategory = async (id: string, name: string, description?: string) => {
    if (loadingActions.has(`update-category-${id}`)) return
    setLoadingActions(prev => new Set(prev).add(`update-category-${id}`))
    try {
      await api.patch(`/restaurants/${restaurantId}/menus/categories/${id}`, { name, description })
      await fetchCategories()
      setEditingCategory(null)
      showToast('تم تحديث الفئة بنجاح!', 'success')
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل تحديث الفئة', 'error')
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(`update-category-${id}`)
        return newSet
      })
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفئة؟ سيتم حذف جميع العناصر التابعة لها.')) return
    if (loadingActions.has(`delete-category-${id}`)) return
    setLoadingActions(prev => new Set(prev).add(`delete-category-${id}`))
    try {
      await api.delete(`/restaurants/${restaurantId}/menus/categories/${id}`)
      await fetchCategories()
      await fetchItems()
      showToast('تم حذف الفئة بنجاح!', 'success')
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل حذف الفئة', 'error')
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(`delete-category-${id}`)
        return newSet
      })
    }
  }

  const handleCreateItem = async (data: { categoryId: string; name: string; price: number; description?: string; image?: string }) => {
    if (loadingActions.has('create-item')) return
    setLoadingActions(prev => new Set(prev).add('create-item'))
    try {
      await api.post(`/restaurants/${restaurantId}/menus/items`, data)
      await fetchItems()
      setShowItemModal(false)
      showToast('تم إضافة العنصر بنجاح!', 'success')
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل إضافة العنصر', 'error')
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete('create-item')
        return newSet
      })
    }
  }

  const handleItemImageUpload = async (itemId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
      showToast('يرجى اختيار صورة بصيغة JPG, PNG, GIF أو WebP', 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('حجم الصورة يجب أن يكون أقل من 5 ميجابايت', 'error')
      return
    }

    if (loadingActions.has(`upload-item-image-${itemId}`)) return
    setLoadingActions(prev => new Set(prev).add(`upload-item-image-${itemId}`))
    setUploadingItemImage(itemId)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'menu-items')

      const token = localStorage.getItem('accessToken')
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

      const uploadResponse = await axios.post(`${API_URL}/storage/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      })

      const imageUrl = uploadResponse.data.url

      await api.patch(`/restaurants/${restaurantId}/menus/items/${itemId}`, {
        image: imageUrl,
      })

      await fetchItems()
      showToast('تم رفع صورة العنصر بنجاح!', 'success')
    } catch (error: any) {
      console.error('Failed to upload item image:', error)
      showToast(error.response?.data?.message || 'فشل رفع الصورة', 'error')
    } finally {
      setUploadingItemImage(null)
      setLoadingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(`upload-item-image-${itemId}`)
        return newSet
      })
      if (itemImageInputRef.current) {
        itemImageInputRef.current.value = ''
      }
    }
  }

  const handleUpdateItem = async (id: string, data: Partial<MenuItem>) => {
    if (loadingActions.has(`update-item-${id}`)) return
    setLoadingActions(prev => new Set(prev).add(`update-item-${id}`))
    try {
      await api.patch(`/restaurants/${restaurantId}/menus/items/${id}`, data)
      await fetchItems()
      setEditingItem(null)
      showToast('تم تحديث العنصر بنجاح!', 'success')
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل تحديث العنصر', 'error')
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(`update-item-${id}`)
        return newSet
      })
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) return
    if (loadingActions.has(`delete-item-${id}`)) return
    setLoadingActions(prev => new Set(prev).add(`delete-item-${id}`))
    try {
      await api.delete(`/restaurants/${restaurantId}/menus/items/${id}`)
      await fetchItems()
      showToast('تم حذف العنصر بنجاح!', 'success')
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل حذف العنصر', 'error')
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(`delete-item-${id}`)
        return newSet
      })
    }
  }

  const handleGenerateQR = async () => {
    if (loadingActions.has('generate-qr')) return
    setLoadingActions(prev => new Set(prev).add('generate-qr'))
    try {
      // Delete existing QR codes first
      if (qrCodes.length > 0) {
        await Promise.all(
          qrCodes.map(async (qr) => {
            try {
              await api.delete(`/restaurants/${restaurantId}/qr-codes/${qr.id}`)
            } catch (error) {
              console.error('Failed to delete old QR code:', error)
            }
          })
        )
      }

      // Create new QR code
      const response = await api.post(`/restaurants/${restaurantId}/qr-codes`)
      await fetchQRCodes()
      showToast('تم إنشاء رمز QR بنجاح!', 'success')
      return response.data
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل إنشاء رمز QR', 'error')
      return null
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete('generate-qr')
        return newSet
      })
    }
  }

  const fetchQRCodes = async () => {
    try {
      const response = await api.get(`/restaurants/${restaurantId}/qr-codes`)
      setQrCodes(response.data)
    } catch (error) {
      console.error('Failed to fetch QR codes:', error)
    }
  }

  const downloadQR = (qrImageUrl: string, code: string) => {
    const link = document.createElement('a')
    link.href = qrImageUrl
    link.download = `qr-code-${code}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600 text-lg">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Navigation with Logo */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-primary-600 hover:text-primary-700 transition-colors duration-200 flex items-center gap-2 group"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
                <span>العودة</span>
              </Link>
              <div className="h-8 w-px bg-gray-300"></div>
              {settings?.customLogo ? (
                <div className="flex items-center gap-3">
                  <img
                    src={settings.customLogo}
                    alt={restaurant?.name}
                    className="h-12 w-12 object-contain rounded-lg"
                  />
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                    {restaurant?.name}
                  </h1>
                </div>
              ) : (
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  {restaurant?.name}
                </h1>
              )}
            </div>
            {restaurant?.subscription && (
              <div className="flex items-center gap-4">
                {restaurant.subscription.currentPeriodEnd && (() => {
                  const remainingDays = calculateRemainingDays(restaurant.subscription.currentPeriodEnd)
                  const isExpired = remainingDays !== null && remainingDays < 0

                  return (
                    <div className={`px-4 py-2 rounded-lg border-2 ${isExpired ? 'bg-red-50 border-red-200' :
                      remainingDays !== null && remainingDays <= 7 ? 'bg-yellow-50 border-yellow-200' :
                        'bg-green-50 border-green-200'
                      }`}>
                      {isExpired ? (
                        <p className="text-sm text-red-600 font-semibold">⚠️ انتهت مدة الاشتراك</p>
                      ) : remainingDays !== null ? (
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">المدة المتبقية:</span>{' '}
                          <span className={`font-bold ${remainingDays <= 7 ? 'text-red-600' :
                            remainingDays <= 30 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                            {remainingDays} يوم
                          </span>
                        </p>
                      ) : null}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl mb-6 overflow-hidden border border-gray-200/50">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'categories', label: 'الفئات', icon: '📁' },
                { id: 'items', label: 'العناصر', icon: '🍽️' },
                { id: 'qr', label: 'رمز QR', icon: '📱' },
                { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-6 border-b-2 font-medium text-sm transition-all duration-300 relative group ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </span>
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-700 animate-pulse"></span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200/50 animate-fadeIn">
          {activeTab === 'categories' && (
            <div className="animate-slideIn">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">الفئات</h2>
                <button
                  onClick={() => {
                    if (loadingActions.has('create-category')) return
                    setEditingCategory(null)
                    setShowCategoryModal(true)
                  }}
                  disabled={loadingActions.has('create-category')}
                  className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loadingActions.has('create-category') ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      جاري...
                    </span>
                  ) : (
                    '+ إضافة فئة'
                  )}
                </button>
              </div>
              {categories.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📁</div>
                  <p className="text-gray-500 text-lg mb-4">لا توجد فئات بعد</p>
                  <button
                    onClick={() => {
                      if (loadingActions.has('create-category')) return
                      setEditingCategory(null)
                      setShowCategoryModal(true)
                    }}
                    disabled={loadingActions.has('create-category')}
                    className="text-primary-600 hover:text-primary-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    إنشاء فئة جديدة
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map((category, index) => (
                    <div
                      key={category.id}
                      className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <h3 className="font-bold text-xl mb-2 text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{category._count.items} عنصر</p>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            if (loadingActions.has(`update-category-${category.id}`)) return
                            setEditingCategory(category)
                            setShowCategoryModal(true)
                          }}
                          disabled={loadingActions.has(`update-category-${category.id}`)}
                          className="flex-1 bg-primary-50 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={loadingActions.has(`delete-category-${category.id}`)}
                          className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingActions.has(`delete-category-${category.id}`) ? 'جاري...' : 'حذف'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'items' && (
            <div className="animate-slideIn">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">عناصر القائمة</h2>
                <button
                  onClick={() => {
                    if (categories.length === 0) {
                      showToast('يرجى إضافة فئة أولاً', 'info')
                      setActiveTab('categories')
                      return
                    }
                    if (loadingActions.has('create-item')) return
                    setEditingItem(null)
                    setShowItemModal(true)
                  }}
                  disabled={loadingActions.has('create-item')}
                  className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loadingActions.has('create-item') ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      جاري...
                    </span>
                  ) : (
                    '+ إضافة عنصر'
                  )}
                </button>
              </div>
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🍽️</div>
                  <p className="text-gray-500 text-lg mb-4">لا توجد عناصر بعد</p>
                  <button
                    onClick={() => {
                      if (categories.length === 0) {
                        showToast('يرجى إضافة فئة أولاً', 'info')
                        setActiveTab('categories')
                        return
                      }
                      if (loadingActions.has('create-item')) return
                      setEditingItem(null)
                      setShowItemModal(true)
                    }}
                    disabled={loadingActions.has('create-item')}
                    className="text-primary-600 hover:text-primary-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    إضافة عنصر جديد
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const category = categories.find(c => c.id === item.categoryId)
                    return (
                      <div
                        key={item.id}
                        className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 bg-gradient-to-r from-white to-gray-50"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex gap-4">
                          {/* Item Image */}
                          <div className="flex-shrink-0 relative group">
                            {item.image ? (
                              <div className="relative">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200 shadow-lg"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all duration-300 flex items-center justify-center">
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                    onChange={(e) => handleItemImageUpload(item.id, e)}
                                    className="hidden"
                                    id={`item-image-${item.id}`}
                                    disabled={uploadingItemImage === item.id || loadingActions.has(`upload-item-image-${item.id}`)}
                                  />
                                  <label
                                    htmlFor={`item-image-${item.id}`}
                                    className={`opacity-0 group-hover:opacity-100 cursor-pointer bg-white/90 text-primary-600 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${uploadingItemImage === item.id || loadingActions.has(`upload-item-image-${item.id}`)
                                      ? 'opacity-50 cursor-not-allowed'
                                      : 'hover:bg-white'
                                      }`}
                                  >
                                    {uploadingItemImage === item.id || loadingActions.has(`upload-item-image-${item.id}`) ? (
                                      <span className="flex items-center gap-1">
                                        <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600"></span>
                                        رفع...
                                      </span>
                                    ) : (
                                      '🔄 تغيير'
                                    )}
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <div className="relative">
                                <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                                  <span className="text-4xl">🍽️</span>
                                </div>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                  onChange={(e) => handleItemImageUpload(item.id, e)}
                                  className="hidden"
                                  id={`item-image-${item.id}`}
                                  disabled={uploadingItemImage === item.id || loadingActions.has(`upload-item-image-${item.id}`)}
                                />
                                <label
                                  htmlFor={`item-image-${item.id}`}
                                  className={`mt-2 block text-center text-xs cursor-pointer px-3 py-2 rounded-lg font-semibold transition-all ${uploadingItemImage === item.id || loadingActions.has(`upload-item-image-${item.id}`)
                                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                    : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                                    }`}
                                >
                                  {uploadingItemImage === item.id || loadingActions.has(`upload-item-image-${item.id}`) ? (
                                    <span className="flex items-center justify-center gap-1">
                                      <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600"></span>
                                      جاري الرفع...
                                    </span>
                                  ) : (
                                    '📷 إضافة صورة'
                                  )}
                                </label>
                              </div>
                            )}
                          </div>

                          {/* Item Info */}
                          <div className="flex-1 flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                                {category && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {category.name}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                              )}
                              <p className="text-primary-600 font-bold text-xl">
                                {item.price} جنيه مصري
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (loadingActions.has(`update-item-${item.id}`)) return
                                  setEditingItem(item)
                                  setShowItemModal(true)
                                }}
                                disabled={loadingActions.has(`update-item-${item.id}`)}
                                className="bg-primary-50 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                تعديل
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={loadingActions.has(`delete-item-${item.id}`)}
                                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loadingActions.has(`delete-item-${item.id}`) ? 'جاري...' : 'حذف'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="animate-slideIn">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">رمز QR</h2>
                <button
                  onClick={handleGenerateQR}
                  disabled={loadingActions.has('generate-qr')}
                  className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loadingActions.has('generate-qr') ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      جاري الإنشاء...
                    </span>
                  ) : (
                    qrCodes.length > 0 ? '🔄 إعادة إنشاء QR' : '+ إنشاء رمز QR'
                  )}
                </button>
              </div>
              {qrCodes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4 animate-bounce">📱</div>
                  <p className="text-gray-500 text-lg mb-4">لا يوجد رمز QR بعد</p>
                  <p className="text-gray-400 text-sm">انقر على "إنشاء رمز QR" لإنشاء رمز جديد</p>
                </div>
              ) : (
                <div className="max-w-md mx-auto">
                  {qrCodes.map((qr) => (
                    <div
                      key={qr.id}
                      className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
                    >
                      {qr.qrImageUrl && (
                        <div className="mb-4 flex justify-center">
                          <img
                            src={qr.qrImageUrl}
                            alt="QR Code"
                            className="w-64 h-64 object-contain"
                          />
                        </div>
                      )}
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-600 mb-2">عدد المسح: {qr.scanCount || 0}</p>
                        <p className="text-xs text-gray-500 font-mono break-all">{qr.code}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => qr.qrImageUrl && downloadQR(qr.qrImageUrl, qr.code)}
                          className="flex-1 bg-primary-50 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors duration-200 font-medium"
                        >
                          📥 تحميل PNG
                        </button>
                        <button
                          onClick={() => window.open(qr.publicUrl, '_blank')}
                          className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors duration-200 font-medium"
                        >
                          👁️ معاينة
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-slideIn max-w-3xl">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">إعدادات المطعم</h2>

              {/* Logo Upload Section */}
              <div className="mb-8 p-6 bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl border-2 border-primary-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🖼️</span>
                  <span>رفع اللوجو</span>
                </h3>
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  {settings?.customLogo ? (
                    <div className="relative">
                      <img
                        src={settings.customLogo}
                        alt="Logo"
                        className="w-32 h-32 object-contain rounded-xl border-2 border-gray-200 shadow-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gray-200 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                      <span className="text-4xl">🖼️</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className={`inline-block cursor-pointer bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                      {uploadingLogo ? (
                        <span className="flex items-center gap-2">
                          <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                          جاري الرفع...
                        </span>
                      ) : (
                        '📤 اختر صورة اللوجو'
                      )}
                    </label>
                    <p className="text-sm text-gray-600 mt-2">
                      الصيغ المدعومة: JPG, PNG, GIF, WebP (حد أقصى 5 ميجابايت)
                    </p>
                  </div>
                </div>
              </div>

              {/* Color Section */}
              <div className="mb-8 p-6 bg-white rounded-2xl border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🎨</span>
                  <span>لون المنيو</span>
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اللون الأساسي
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={localPrimaryColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-16 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={localPrimaryColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="#0284c7"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">سيتم تطبيق هذا اللون على واجهة المنيو</p>
                </div>
              </div>


              {/* Password Change Section */}
              <div className="mb-8 p-6 bg-white rounded-2xl border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🔒</span>
                  <span>تغيير كلمة المرور</span>
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      كلمة المرور الجديدة
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      تأكيد كلمة المرور
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={changingPassword || !newPassword}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingPassword ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        جاري التغيير...
                      </span>
                    ) : (
                      'تغيير كلمة المرور'
                    )}
                  </button>
                </form>
              </div>

            </div>
          )}
        </div>
      </main >

      {/* Toast Notification */}
      {
        toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )
      }

      {/* Category Modal */}
      {
        showCategoryModal && (
          <CategoryModal
            category={editingCategory}
            onClose={() => {
              setShowCategoryModal(false)
              setEditingCategory(null)
            }}
            onSave={editingCategory
              ? (name, desc) => handleUpdateCategory(editingCategory.id, name, desc)
              : handleCreateCategory
            }
          />
        )
      }

      {/* Item Modal */}
      {
        showItemModal && (
          <ItemModal
            item={editingItem}
            categories={categories}
            onClose={() => {
              setShowItemModal(false)
              setEditingItem(null)
            }}
            onSave={editingItem
              ? (data) => handleUpdateItem(editingItem.id, data)
              : handleCreateItem
            }
          />
        )
      }
    </div >
  )
}

// Category Modal Component
function CategoryModal({ category, onClose, onSave }: {
  category: Category | null
  onClose: () => void
  onSave: (name: string, description?: string) => void
}) {
  const [name, setName] = useState(category?.name || '')
  const [description, setDescription] = useState(category?.description || '')

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      return
    }
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSave(name.trim(), description.trim() || undefined)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scaleIn">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          {category ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              اسم الفئة *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
              placeholder="مثال: المقبلات"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              الوصف (اختياري)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
              rows={3}
              placeholder="وصف الفئة..."
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  جاري...
                </span>
              ) : (
                category ? 'تحديث' : 'إضافة'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Item Modal Component
function ItemModal({ item, categories, onClose, onSave }: {
  item: MenuItem | null
  categories: Category[]
  onClose: () => void
  onSave: (data: any) => void
}) {
  const params = useParams()
  const [categoryId, setCategoryId] = useState(item?.categoryId || categories[0]?.id || '')
  const [name, setName] = useState(item?.name || '')
  const [price, setPrice] = useState(item?.price?.toString() || '')
  const [description, setDescription] = useState(item?.description || '')
  const [image, setImage] = useState(item?.image || '')
  const [isFeatured, setIsFeatured] = useState(item?.isFeatured || false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageFileInputRef = useRef<HTMLInputElement>(null)
  const restaurantId = params.id as string

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      return
    }

    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'menu-items')

      const token = localStorage.getItem('accessToken')
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

      const uploadResponse = await axios.post(`${API_URL}/storage/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      })

      setImage(uploadResponse.data.url)
    } catch (error: any) {
      console.error('Failed to upload image:', error)
    } finally {
      setUploadingImage(false)
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = ''
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !price || !categoryId) {
      return
    }
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) {
      return
    }
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSave({
        categoryId,
        name: name.trim(),
        price: priceNum,
        description: description.trim() || undefined,
        image: image || undefined,
        isFeatured: isFeatured
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scaleIn max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          {item ? 'تعديل العنصر' : 'إضافة عنصر جديد'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              الفئة *
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              اسم العنصر *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
              placeholder="مثال: برجر لحم"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              السعر *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              الوصف (اختياري)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
              rows={3}
              placeholder="وصف العنصر..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              صورة العنصر (اختياري)
            </label>
            <div className="space-y-3">
              {image ? (
                <div className="relative">
                  <img src={image} alt="Preview" className="w-full h-48 object-cover rounded-xl border-2 border-gray-200 shadow-lg" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                  >
                    حذف
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <span className="text-4xl mb-2 block">🖼️</span>
                  <p className="text-gray-500 text-sm mb-3">لا توجد صورة</p>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="item-image-upload"
                />
                <label
                  htmlFor="item-image-upload"
                  className={`flex-1 cursor-pointer px-4 py-3 rounded-xl font-semibold text-center transition-all ${uploadingImage
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                    }`}
                >
                  {uploadingImage ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></span>
                      جاري الرفع...
                    </span>
                  ) : (
                    '📤 رفع صورة'
                  )}
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
                  placeholder="أو أدخل رابط الصورة"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer group p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 transition-colors">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span className="text-gray-700 font-semibold group-hover:text-gray-900 transition-colors">
                  عنصر مميز
                </span>
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-2 mr-2">
              سيظهر العنصر بشكل مميز في المنيو
            </p>
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  جاري...
                </span>
              ) : (
                item ? 'تحديث' : 'إضافة'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
