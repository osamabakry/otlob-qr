'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Store, Loader2 } from 'lucide-react'
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

export default function DashboardPage() {
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'categories' | 'items' | 'qr'>('categories')

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [qrCodes, setQrCodes] = useState<any[]>([])
  const [uploadingItemImage, setUploadingItemImage] = useState<string | null>(null)
  const itemImageInputRef = useRef<HTMLInputElement>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set())

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
    fetchMainData()
  }, [])

  const fetchMainData = async () => {
    try {
      setLoading(true)
      // 1. Get user's restaurants
      const resResponse = await api.get('/restaurants')
      const restaurants = resResponse.data

      if (!restaurants || restaurants.length === 0) {
        // If no restaurant, maybe redirect to create? OR show empty state
        setRestaurant(null)
        setLoading(false)
        return
      }

      const currentRestaurant = restaurants[0]
      setRestaurant(currentRestaurant)
      const rId = currentRestaurant.id

      // 2. Fetch related data in parallel
      await Promise.all([
        fetchCategories(rId),
        fetchItems(rId),
        fetchSettings(rId),
        fetchQRCodes(rId)
      ])
    } catch (error) {
      console.error('Failed to init dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async (rId: string) => {
    try {
      const response = await api.get(`/restaurants/${rId}/menus/categories`)
      setCategories(response.data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchItems = async (rId: string) => {
    try {
      const response = await api.get(`/restaurants/${rId}/menus/items`)
      setItems(response.data)
    } catch (error) {
      console.error('Failed to fetch items:', error)
    }
  }

  const fetchSettings = async (rId: string) => {
    try {
      const response = await api.get(`/restaurants/${rId}/settings`)
      setSettings(response.data)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const fetchQRCodes = async (rId: string) => {
    try {
      const response = await api.get(`/restaurants/${rId}/qr-codes`)
      setQrCodes(response.data)
    } catch (error) {
      console.error('Failed to fetch QR codes:', error)
    }
  }

  // --- Handlers ---

  const handleCreateCategory = async (name: string, description?: string) => {
    if (!restaurant) return
    if (loadingActions.has('create-category')) return
    setLoadingActions(prev => new Set(prev).add('create-category'))
    try {
      const response = await api.post(`/restaurants/${restaurant.id}/menus/categories`, { name, description })
      // Optimistic update: append new category directly
      const newCategory = response.data
      setCategories(prev => [...prev, newCategory])

      setShowCategoryModal(false)
      showToast('تم إضافة الفئة بنجاح!', 'success')
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل إضافة الفئة', 'error')
    } finally {
      setLoadingActions(prev => { const s = new Set(prev); s.delete('create-category'); return s; })
    }
  }

  const handleUpdateCategory = async (id: string, name: string, description?: string) => {
    if (!restaurant) return
    if (loadingActions.has(`update-category-${id}`)) return
    setLoadingActions(prev => new Set(prev).add(`update-category-${id}`))
    try {
      const response = await api.patch(`/restaurants/${restaurant.id}/menus/categories/${id}`, { name, description })
      // Update local state directly
      const updatedCategory = response.data
      setCategories(prev => prev.map(c => c.id === id ? updatedCategory : c))

      setEditingCategory(null)
      showToast('تم تحديث الفئة بنجاح!', 'success')
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل تحديث الفئة', 'error')
    } finally {
      setLoadingActions(prev => { const s = new Set(prev); s.delete(`update-category-${id}`); return s; })
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!restaurant) return
    if (!window.confirm('هل أنت متأكد من حذف هذه الفئة؟ سيتم حذف جميع العناصر التابعة لها.')) return
    if (loadingActions.has(`delete-category-${id}`)) return
    setLoadingActions(prev => new Set(prev).add(`delete-category-${id}`))
    try {
      await api.delete(`/restaurants/${restaurant.id}/menus/categories/${id}`)
      // Remove from local state directly
      setCategories(prev => prev.filter(c => c.id !== id))
      // Also remove items belonging to this category from local state
      setItems(prev => prev.filter(i => i.categoryId !== id))

      showToast('تم حذف الفئة بنجاح!', 'success')
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل حذف الفئة', 'error')
    } finally {
      setLoadingActions(prev => { const s = new Set(prev); s.delete(`delete-category-${id}`); return s; })
    }
  }

  const handleCreateItem = async (data: { categoryId: string; name: string; price: number; description?: string; image?: string }) => {
    if (!restaurant) return
    if (loadingActions.has('create-item')) return
    setLoadingActions(prev => new Set(prev).add('create-item'))
    try {
      const response = await api.post(`/restaurants/${restaurant.id}/menus/items`, data)
      // Optimistic update: append new item directly
      const newItem = response.data
      setItems(prev => [...prev, newItem])

      // Also update category item count if we track it in backend response or just increment locally
      setCategories(prev => prev.map(c => c.id === data.categoryId ? { ...c, _count: { items: (c._count?.items || 0) + 1 } } : c))

      setShowItemModal(false)
      showToast('تم إضافة العنصر بنجاح!', 'success')
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل إضافة العنصر', 'error')
    } finally {
      setLoadingActions(prev => { const s = new Set(prev); s.delete('create-item'); return s; })
    }
  }

  const handleItemImageUpload = async (itemId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!restaurant) return
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

      await api.patch(`/restaurants/${restaurant.id}/menus/items/${itemId}`, {
        image: imageUrl,
      })

      await fetchItems(restaurant.id)
      showToast('تم رفع صورة العنصر بنجاح!', 'success')
    } catch (error: any) {
      console.error('Failed to upload item image:', error)
      showToast(error.response?.data?.message || 'فشل رفع الصورة', 'error')
    } finally {
      setUploadingItemImage(null)
      setLoadingActions(prev => { const s = new Set(prev); s.delete(`upload-item-image-${itemId}`); return s; })
      if (itemImageInputRef.current) {
        itemImageInputRef.current.value = ''
      }
    }
  }

  const handleUpdateItem = async (id: string, data: Partial<MenuItem>) => {
    if (!restaurant) return
    if (loadingActions.has(`update-item-${id}`)) return
    setLoadingActions(prev => new Set(prev).add(`update-item-${id}`))
    try {
      await api.patch(`/restaurants/${restaurant.id}/menus/items/${id}`, data)
      await fetchItems(restaurant.id)
      setEditingItem(null)
      showToast('تم تحديث العنصر بنجاح!', 'success')
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل تحديث العنصر', 'error')
    } finally {
      setLoadingActions(prev => { const s = new Set(prev); s.delete(`update-item-${id}`); return s; })
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!restaurant) return
    if (!window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) return
    if (loadingActions.has(`delete-item-${id}`)) return
    setLoadingActions(prev => new Set(prev).add(`delete-item-${id}`))
    try {
      await api.delete(`/restaurants/${restaurant.id}/menus/items/${id}`)
      await fetchItems(restaurant.id)
      showToast('تم حذف العنصر بنجاح!', 'success')
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل حذف العنصر', 'error')
    } finally {
      setLoadingActions(prev => { const s = new Set(prev); s.delete(`delete-item-${id}`); return s; })
    }
  }

  const handleGenerateQR = async () => {
    if (!restaurant) return
    if (loadingActions.has('generate-qr')) return
    setLoadingActions(prev => new Set(prev).add('generate-qr'))
    try {
      if (qrCodes.length > 0) {
        await Promise.all(
          qrCodes.map(async (qr) => {
            try {
              await api.delete(`/restaurants/${restaurant.id}/qr-codes/${qr.id}`)
            } catch (error) {
              console.error('Failed to delete old QR code:', error)
            }
          })
        )
      }

      const response = await api.post(`/restaurants/${restaurant.id}/qr-codes`)
      await fetchQRCodes(restaurant.id)
      showToast('تم إنشاء رمز QR بنجاح!', 'success')
      return response.data
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل إنشاء رمز QR', 'error')
      return null
    } finally {
      setLoadingActions(prev => { const s = new Set(prev); s.delete('generate-qr'); return s; })
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={40} className="animate-spin text-primary-600" />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">لا يوجد مطعم</h2>
        <p className="text-gray-500 mb-8">ليس لديك مطاعم مسجلة بعد.</p>
      </div>
    )
  }

  return (
    <div className="pb-12 space-y-8 animate-fadeIn">
      {/* Header Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          {settings?.customLogo ? (
            <img
              src={settings.customLogo}
              alt={restaurant.name}
              className="h-16 w-16 object-contain rounded-xl border border-gray-100"
            />
          ) : (
            <div className="h-16 w-16 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
              <Store size={28} />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                نشط
              </span>
              {restaurant.subscription?.currentPeriodEnd && (
                <span className="text-xs text-gray-500">
                  ينتهي الاشتراك: {new Date(restaurant.subscription.currentPeriodEnd).toLocaleDateString('ar-EG')}
                </span>
              )}
            </div>
          </div>
        </div>


      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[
            { id: 'categories', label: 'الفئات', icon: '📁' },
            { id: 'items', label: 'العناصر', icon: '🍽️' },
            { id: 'qr', label: 'رمز QR', icon: '📱' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 text-center font-medium transition-colors relative ${activeTab === tab.id
                ? 'text-primary-600 bg-primary-50/50'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span>{tab.icon}</span>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'categories' && (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">إدارة الفئات</h2>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setShowCategoryModal(true);
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                >
                  + إضافة فئة
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500">لا توجد فئات حالياً</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <div key={cat.id} className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow relative group">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900">{cat.name}</h3>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{cat._count?.items || 0} عنصر</span>
                      </div>
                      {cat.description && <p className="text-sm text-gray-500 line-clamp-2 mb-4">{cat.description}</p>}

                      <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); }}
                          className="flex-1 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="flex-1 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded hover:bg-red-100"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'items' && (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">إدارة العناصر</h2>
                <button
                  onClick={() => {
                    if (categories.length === 0) {
                      showToast('يجب إضافة فئة أولاً', 'info');
                      return;
                    }
                    setEditingItem(null);
                    setShowItemModal(true);
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                >
                  + إضافة عنصر
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500">لا توجد عناصر حالياً</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const cat = categories.find(c => c.id === item.categoryId);
                    return (
                      <div key={item.id} className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-200 transition-colors group">
                        <div className="h-20 w-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">🖼️</div>
                          )}
                          {/* Image Upload Overlay */}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <label className="cursor-pointer text-white text-xs font-medium hover:underline p-2">
                              <span>تغيير</span>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleItemImageUpload(item.id, e)}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-gray-900">{item.name}</h3>
                              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded mr-2">{cat?.name}</span>
                            </div>
                            <span className="font-bold text-primary-600">{item.price} EGP</span>
                          </div>
                          {item.description && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{item.description}</p>}

                          <div className="flex gap-3 mt-3 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingItem(item); setShowItemModal(true); }}
                              className="text-xs font-medium text-blue-600 hover:underline"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              حذف
                            </button>
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
            <div className="animate-fadeIn text-center py-8">
              <div className="max-w-md mx-auto">
                {qrCodes.length > 0 ? (
                  <div className="space-y-6">
                    {qrCodes[0].qrImageUrl && (
                      <img
                        src={qrCodes[0].qrImageUrl}
                        alt="QR Code"
                        className="w-64 h-64 mx-auto object-contain bg-white p-4 border rounded-xl shadow-sm"
                      />
                    )}
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => downloadQR(qrCodes[0].qrImageUrl, qrCodes[0].code)}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                      >
                        تحميل QR
                      </button>
                      <button
                        onClick={() => window.open(qrCodes[0].publicUrl, '_blank')}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        معاينة المنيو
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📱</div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">لا يوجد رمز QR</h3>
                    <p className="text-gray-500 mb-6">قم بإنشاء رمز QR لمطعمك لبدء استقبال الطلبات</p>
                    <button
                      onClick={handleGenerateQR}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                    >
                      إنشاء رمز QR جديد
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast & Modals */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setShowCategoryModal(false)}
          onSave={editingCategory ? (n: string, d?: string) => handleUpdateCategory(editingCategory.id, n, d) : handleCreateCategory}
        />
      )}

      {showItemModal && (
        <ItemModal
          item={editingItem}
          categories={categories}
          onClose={() => setShowItemModal(false)}
          onSave={editingItem ? (d: any) => handleUpdateItem(editingItem.id, d) : handleCreateItem}
        />
      )}
    </div>
  )
}

// Reuse compact Modal components for Categories/Items
function CategoryModal({ category, onClose, onSave }: any) {
  const [name, setName] = useState(category?.name || '')
  const [desc, setDesc] = useState(category?.description || '')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scaleIn">
        <h3 className="font-bold text-lg mb-4">{category ? 'تعديل الفئة' : 'فئة جديدة'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(name, desc); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الاسم</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg p-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الوصف</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full border rounded-lg p-2.5" rows={3} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 py-2 rounded-lg font-medium">إلغاء</button>
            <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-lg font-medium">حفظ</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ItemModal({ item, categories, onClose, onSave }: any) {
  const [name, setName] = useState(item?.name || '')
  const [price, setPrice] = useState(item?.price || '')
  const [catId, setCatId] = useState(item?.categoryId || categories[0]?.id || '')
  const [desc, setDesc] = useState(item?.description || '')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scaleIn">
        <h3 className="font-bold text-lg mb-4">{item ? 'تعديل العنصر' : 'عنصر جديد'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, price: Number(price), categoryId: catId, description: desc }); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الفئة</label>
            <select value={catId} onChange={e => setCatId(e.target.value)} className="w-full border rounded-lg p-2.5">
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الاسم</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg p-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">السعر</label>
            <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="w-full border rounded-lg p-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الوصف</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full border rounded-lg p-2.5" rows={2} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 py-2 rounded-lg font-medium">إلغاء</button>
            <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-lg font-medium">حفظ</button>
          </div>
        </form>
      </div>
    </div>
  )
}
