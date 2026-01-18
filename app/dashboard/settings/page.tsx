'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { api } from '@/lib/api'
import { Save, Loader2, Palette, Store, Image, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Toast } from '@/app/components/Toast'

export default function SettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [restaurant, setRestaurant] = useState<any>(null)

    // Form States
    const [name, setName] = useState('')
    const [primaryColor, setPrimaryColor] = useState('#0284c7')

    // Logo Upload State
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Password Change State
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [changingPassword, setChangingPassword] = useState(false)

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type })
    }

    useEffect(() => {
        fetchRestaurant()
    }, [])

    const fetchRestaurant = async () => {
        try {
            const response = await api.get('/restaurants')
            const restaurants = response.data

            if (restaurants && restaurants.length > 0) {
                const current = restaurants[0]
                setRestaurant(current)
                setName(current.name)
                if (current.settings?.primaryColor) {
                    setPrimaryColor(current.settings.primaryColor)
                }
            }
        } catch (error) {
            console.error('Failed to fetch restaurant:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveGeneral = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!restaurant) return

        setSaving(true)
        try {
            const response = await api.patch(`/restaurants/${restaurant.id}`, {
                name,
                primaryColor
            })

            const updated = response.data
            setRestaurant(updated)
            if (updated.settings?.primaryColor) {
                setPrimaryColor(updated.settings.primaryColor)
            }

            showToast('تم حفظ الإعدادات بنجاح', 'success')
            router.refresh()

        } catch (error) {
            console.error('Failed to update settings:', error)
            showToast('حدث خطأ أثناء حفظ الإعدادات', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

            await api.patch(`/restaurants/${restaurant.id}/settings`, {
                customLogo: logoUrl,
            })

            // Update local state
            setRestaurant({ ...restaurant, settings: { ...restaurant.settings, customLogo: logoUrl } })
            showToast('تم رفع اللوجو بنجاح!', 'success')
        } catch (error: any) {
            console.error('Failed to upload logo:', error)
            showToast(error.response?.data?.message || 'فشل رفع اللوجو', 'error')
        } finally {
            setUploadingLogo(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-primary-600" size={32} />
            </div>
        )
    }

    if (!restaurant) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">لا يوجد مطاعم مرتبطة بهذا الحساب.</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">إعدادات المطعم</h1>
                    <p className="text-gray-500 mt-1">تحكم في هوية ومظهر مطعمك</p>
                </div>
            </div>

            {/* General & Branding Section */}
            <form onSubmit={handleSaveGeneral} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8 space-y-8">
                    {/* Logo Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                            <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                                <Image size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">شعار المطعم</h2>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                            {restaurant.settings?.customLogo ? (
                                <div className="relative group">
                                    <img
                                        src={restaurant.settings.customLogo}
                                        alt="Logo"
                                        className="w-32 h-32 object-contain rounded-xl border-2 border-gray-200 shadow-sm"
                                    />
                                </div>
                            ) : (
                                <div className="w-32 h-32 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                                    <Image className="text-gray-300" size={32} />
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
                                    className={`inline-flex items-center gap-2 cursor-pointer bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    {uploadingLogo ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            جاري الرفع...
                                        </>
                                    ) : (
                                        <>
                                            <span>📤</span>
                                            تغيير الشعار
                                        </>
                                    )}
                                </label>
                                <p className="text-xs text-gray-400 mt-2">
                                    يفضل استخدام صورة مربعة بخلفية شفافة (PNG)
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="border-t border-gray-100 pt-6"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Name Section */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                    <Store size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">اسم المطعم</h2>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    الاسم الظاهر
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    placeholder="مطعمي المميز"
                                />
                            </div>
                        </section>

                        {/* Branding Section */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                                <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                                    <Palette size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">ألوان الهوية</h2>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    اللون الأساسي
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="h-12 w-20 rounded-lg cursor-pointer border border-gray-200 p-1"
                                    />
                                    <div className="flex-1">
                                        <div
                                            className="h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            معاينة
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-primary-200"
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    حفظ التغييرات
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Password Change Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8 space-y-8">
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                            <div className="bg-red-50 p-2 rounded-lg text-red-600">
                                <Lock size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">الأمان</h2>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    كلمة المرور الجديدة
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    تأكيد كلمة المرور
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={changingPassword || !newPassword}
                                className="w-full bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-black transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {changingPassword ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 size={16} className="animate-spin" />
                                        جاري التغيير...
                                    </span>
                                ) : (
                                    'تغيير كلمة المرور'
                                )}
                            </button>
                        </form>
                    </section>
                </div>
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    )
}
