import React from 'react';

import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import FooterArabic from '../components/FooterArabic';
import ProtectedRoute from '../components/ProtectedRoute';
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes';

function TraderDashboardContent() {
  const { user } = useAuth();

  return (
    <div dir="rtl">
      <Header />
      <div className="min-h-screen bg-slate-50 pt-40 pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">لوحة تحكم التاجر</h1>
              <p className="text-slate-500 mt-2">مرحباً بك، {user?.name}</p>
            </div>
            <Link 
               to={ROUTES.PUBLISH_AD}
               className="px-6 py-3 bg-(--accent) text-(--primary) font-bold rounded-lg hover:brightness-110 transition-all shadow-md flex items-center gap-2"
            >
              <span>+</span> نشر إعلان جديد
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Quick Stats Cards */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
               <h3 className="text-slate-500 text-sm font-semibold mb-2">إجمالي الإعلانات</h3>
               <p className="text-3xl font-bold text-slate-900">0</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
               <h3 className="text-slate-500 text-sm font-semibold mb-2">الطلبات النشطة</h3>
               <p className="text-3xl font-bold text-slate-900">0</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
               <h3 className="text-slate-500 text-sm font-semibold mb-2">المبيعات هذا الشهر</h3>
               <p className="text-3xl font-bold text-slate-900">0 ر.س</p>
            </div>

            {/* Quick Actions */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-4">
              <h2 className="text-xl font-bold text-slate-900 mb-4">روابط سريعة</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to={ROUTES.PUBLISH_AD} className="p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group">
                   <div className="text-lg font-bold text-slate-800 group-hover:text-blue-600 mb-1">نشر إعلان</div>
                   <div className="text-sm text-slate-500">أضف منتجات جديدة للبيع</div>
                </Link>
                <Link to={ROUTES.SELLER_PRODUCTS + "/" + (user?.id || '')} className="p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group">
                   <div className="text-lg font-bold text-slate-800 group-hover:text-blue-600 mb-1">منتجاتي</div>
                   <div className="text-sm text-slate-500">إدارة المنتجات المعروضة</div>
                </Link>
                <Link to={ROUTES.ORDERS} className="p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group">
                   <div className="text-lg font-bold text-slate-800 group-hover:text-blue-600 mb-1">الطلبات</div>
                   <div className="text-sm text-slate-500">متابعة طلبات الشراء</div>
                </Link>
                <Link to={ROUTES.PROFILE} className="p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group">
                   <div className="text-lg font-bold text-slate-800 group-hover:text-blue-600 mb-1">الإعدادات</div>
                   <div className="text-sm text-slate-500">تعديل الملف الشخصي</div>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
      <FooterArabic />
    </div>
  );
}

export default function TraderDashboard() {
  return (
    <ProtectedRoute allowedRoles={['TRADER']}>
      <TraderDashboardContent />
    </ProtectedRoute>
  );
}
