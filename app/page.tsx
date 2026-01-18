'use client'

import Link from 'next/link'
import { Smartphone, BarChart3, Palette, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-primary-800 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-200">
              QR
            </div>
            <span className="text-xl font-bold text-gray-900">اطلبها</span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-200"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 font-medium text-sm mb-8 animate-fadeIn border border-primary-100">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
              </span>
              الجيل الجديد من قوائم الطعام الرقمية
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight tracking-tight animate-slideUp">
              حوّل قائمة مطعمك إلى <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800">
                تجربة رقمية متكاملة
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed animate-slideUp animation-delay-200">
              منصة شاملة لإنشاء وإدارة قوائم الطعام برمز QR. تحكم في الأسعار، الصور، والعروض في الوقت الفعلي.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slideUp animation-delay-400">
              <Link
                href="/login"
                className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-bold text-lg hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <span>تسجيل الدخول</span>
                <ArrowRight size={20} />
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 bg-white text-gray-700 border-2 border-gray-200 rounded-2xl font-bold text-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                اكتشف المميزات
              </Link>
            </div>
          </div>
        </div>

        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-100/50 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob animation-delay-2000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">كل ما تحتاجه لإدارة مطعمك</h2>
            <p className="text-gray-600">أدوات احترافية مصممة خصيصاً لزيادة مبيعاتك وتحسين تجربة عملائك</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Smartphone className="w-8 h-8 text-primary-600" />,
                title: "تجربة موبايل سلسة",
                desc: "تصميم متجاوب يعمل بامتياز على جميع الهواتف الذكية دون الحاجة لتثبيت تطبيق."
              },
              {
                icon: <Palette className="w-8 h-8 text-blue-600" />,
                title: "هوية بصرية كاملة",
                desc: "خصص ألوان القائمة وارفع شعارك لتعكس هوية مطعمك الفريدة."
              },
              {
                icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
                title: "إحصائيات ذكية",
                desc: "تعرف على الأطباق الأكثر طلباً وأوقات الذروة لاتخاذ قرارات مدروسة."
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-primary-800 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                QR
              </div>
              <span className="text-xl font-bold">اطلبها</span>
            </div>
            <div className="text-gray-400 text-sm flex flex-col md:items-end gap-1">
              <span>© 2024 جميع الحقوق محفوظة</span>
              <span className="flex items-center gap-1">
                تم التطوير بكل ❤️ بواسطة
                <a href="https://www.facebook.com/osamabakryofficial" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary-500 transition-colors font-medium">
                  Osama Bakry
                </a>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
