'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Search, Utensils, AlertCircle, Clock, MapPin, Instagram, Facebook } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  nameTranslations?: any
  description?: string
  price: number
  image?: string
  allergens?: string[]
  dietaryInfo?: string[]
  isAvailable?: boolean
  isFeatured?: boolean
}

interface Category {
  id: string
  name: string
  nameTranslations?: any
  items: MenuItem[]
}

interface PublicMenu {
  restaurant: {
    id: string
    name: string
    logo?: string
    coverImage?: string
    currency: string
    taxRate: number
    address?: string
    phone?: string
  }
  settings?: {
    primaryColor?: string
    showPrices?: boolean
  }
  categories: Category[]
}

export default function PublicMenuPage() {
  const params = useParams()
  const code = params.code as string
  const [menu, setMenu] = useState<PublicMenu | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)

  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    if (code) {
      fetchMenu()
    }
  }, [code])

  const fetchMenu = async () => {
    try {
      const qrResponse = await api.get(`/public/qr-codes/${code}`)
      const restaurantId = qrResponse.data.restaurant.id
      const menuResponse = await api.get(`/public/menus/restaurant/${restaurantId}?lang=ar`)
      setMenu(menuResponse.data)
      if (menuResponse.data.categories.length > 0) {
        setSelectedCategory(menuResponse.data.categories[0].id)
      }
    } catch (error: any) {
      console.error('Failed to fetch menu:', error)
      if (error.response?.status === 403 && error.response?.data?.code === 'SUBSCRIPTION_EXPIRED') {
        setSubscriptionError(error.response.data.message || 'انتهت مدة الاشتراك. المنيو غير متاح حالياً.')
      }
    } finally {
      setLoading(false)
    }
  }

  const scrollToCategory = (categoryId: string) => {
    setSelectedCategory(categoryId)
    const element = categoryRefs.current[categoryId]
    const headerOffset = 100 // Adjusted for floating pill
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: elementPosition - headerOffset,
        behavior: 'smooth'
      })
    }
  }

  const filteredCategories = menu?.categories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  })).filter(cat => cat.items.length > 0) || []

  const primaryColor = menu?.settings?.primaryColor || '#0284c7'
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (subscriptionError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">عفواً، المنيو غير متاح</h2>
          <p className="text-gray-500">{subscriptionError}</p>
        </div>
      </div>
    )
  }

  if (!menu) return null

  return (
    <div className="min-h-screen bg-white pb-20 font-sans" dir="rtl">
      {/* Hero Section */}
      <div className="relative h-80 lg:h-96 w-full overflow-hidden">
        {menu.restaurant.coverImage ? (
          <div className="absolute inset-0">
            <img
              src={menu.restaurant.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80"></div>
          </div>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${hexToRgba(primaryColor, 0.6)})` }}
          >
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white z-20 flex flex-col items-center text-center">
          <div className="bg-white p-1 rounded-2xl shadow-2xl mb-4 transform translate-y-1/2">
            {menu.restaurant.logo ? (
              <img src={menu.restaurant.logo} alt="Logo" className="w-24 h-24 rounded-xl object-contain bg-white" />
            ) : (
              <div className="w-24 h-24 rounded-xl flex items-center justify-center text-4xl font-bold bg-gray-50 text-gray-900 border-2 border-dashed border-gray-200">
                {menu.restaurant.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-16 text-center px-4">
        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2 tracking-tight">{menu.restaurant.name}</h1>
        {menu.restaurant.address && (
          <p className="text-gray-500 flex items-center justify-center gap-2 text-sm font-medium">
            <MapPin size={16} /> {menu.restaurant.address}
          </p>
        )}

        {/* Search Bar */}
        <div className="max-w-lg mx-auto mt-6 relative z-30">
          <div className="relative group">
            <input
              type="text"
              placeholder="ابحث في القائمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3.5 px-12 rounded-full bg-gray-100 border border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all shadow-sm text-gray-900 placeholder-gray-500"
              style={{ '--tw-ring-color': hexToRgba(primaryColor, 0.2) } as any}
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={20} />
          </div>
        </div>
      </div>

      {/* Sticky Rounded Nav */}
      <div className="sticky top-4 z-40 mt-8 mb-8 px-4">
        <div className="bg-white/80 backdrop-blur-xl shadow-lg shadow-gray-200/50 rounded-full p-1.5 flex gap-1 overflow-x-auto scrollbar-hide border border-white/50 ring-1 ring-black/5 max-w-4xl mx-auto">
          {menu.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => scrollToCategory(category.id)}
              className={`flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${selectedCategory === category.id
                ? 'text-white shadow-md transform scale-105'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              style={selectedCategory === category.id ? { backgroundColor: primaryColor } : {}}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu List - Big Cards Grid */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-12">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            ref={(el) => { categoryRefs.current[category.id] = el }}
            className="scroll-mt-40 animate-fadeIn"
          >
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="h-8 w-1.5 rounded-full" style={{ backgroundColor: primaryColor }}></div>
              <h2 className="text-2xl font-black text-gray-900">
                {category.name}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-100 transform hover:-translate-y-1"
                >
                  {/* Big Image Area */}
                  <div className="relative h-64 overflow-hidden">
                    {item.image ? (
                      <>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100"></div>
                        <Utensils size={48} className="relative z-10 opacity-50" />
                      </div>
                    )}

                    {/* Overlaid Price Tag */}
                    <div className="absolute bottom-4 left-4 z-20">
                      <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg flex items-center gap-1 group-hover:scale-110 transition-transform duration-300">
                        <span
                          className="font-black text-lg"
                          style={{ color: primaryColor }}
                        >
                          {item.price}
                        </span>
                        <span className="text-xs font-bold text-gray-500">EGP</span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                      {item.isFeatured && (
                        <span className="bg-yellow-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                          ⭐ مميز
                        </span>
                      )}
                      {!item.isAvailable && (
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                          غير متوفر
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-6 relative">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-primary-600 transition-colors">
                      {item.name}
                    </h3>

                    {item.description && (
                      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Tags/Allergens */}
                    <div className="flex flex-wrap gap-2">
                      {item.allergens?.map(allergen => (
                        <span
                          key={allergen}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 flex items-center gap-1"
                        >
                          ⚠️ {allergen}
                        </span>
                      ))}
                      {item.dietaryInfo?.map(info => (
                        <span
                          key={info}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg bg-green-50 text-green-600 border border-green-100 flex items-center gap-1"
                        >
                          🌿 {info}
                        </span>
                      ))}
                    </div>

                    {/* Hover Decoration */}
                    <div
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                      style={{ '--tw-gradient-via': primaryColor } as any}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-20 opacity-50">
            <Search size={64} className="mx-auto mb-6 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-400">لا توجد نتائج</h3>
            <p className="text-gray-400">حاول البحث بكلمة أخرى</p>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="text-center py-8 text-gray-400 text-sm">
        <p className="flex items-center justify-center gap-2">
          تم التطوير بكل ❤️ بواسطة
          <a
            href="https://www.facebook.com/osamabakryofficial"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-gray-600 hover:text-primary-600 transition-colors"
          >
            Osama Bakry
          </a>
        </p>
      </div>
    </div>
  )
}
