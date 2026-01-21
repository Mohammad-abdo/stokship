import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { dealService } from "../../services/dealService";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes";
import { ShoppingCart, ChevronLeft, ChevronRight, Search, Users } from "lucide-react";

export default function TraderDeals() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadDeals = async () => {
      try {
        // Fetch deals for this trader
        const dealsRes = await dealService.getDeals({ traderId: user.id, limit: 100 });
        setDeals(dealsRes.data.data || dealsRes.data || []);
      } catch (error) {
        console.error('Error loading deals:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadDeals();
    }
  }, [user]);

  const filteredDeals = deals.filter(deal => 
    deal.dealNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    deal.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      NEGOTIATION: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      PAID: 'bg-purple-100 text-purple-800',
      SETTLED: 'bg-indigo-100 text-indigo-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    try {
      return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (e) {
      return amount;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12" dir={currentDir}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to={ROUTES.TRADER_DASHBOARD} className="text-slate-500 hover:text-slate-700">
                {currentDir === 'rtl' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">
                {t('trader.deals', 'صفقاتي')}
              </h1>
            </div>
            <p className="text-slate-600 ml-7 rtl:mr-7">
              {t('trader.manageDeals', 'متابعة جميع الصفقات والطلبات')}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder={t('common.searchDeals', 'بحث في الصفقات...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        </div>

        {/* Deals List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           {filteredDeals.length > 0 ? (
             <div className="divide-y divide-slate-100">
               {filteredDeals.map((deal) => (
                 <div 
                   key={deal.id}
                   onClick={() => navigate(ROUTES.TRADER_DEAL_DETAILS.replace(':id', deal.id))}
                   className="p-4 sm:p-6 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                 >
                   <div className="flex items-start gap-4">
                     <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                       <ShoppingCart className="w-6 h-6 text-green-600" />
                     </div>
                     <div>
                       <h3 className="font-semibold text-slate-900 font-mono group-hover:text-blue-700 transition-colors">
                         {deal.dealNumber || 'NO-NUMBER'}
                       </h3>
                       <div className="flex items-center gap-3 mt-1 flex-wrap">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(deal.status)}`}>
                           {deal.status}
                         </span>
                         {deal.client && (
                           <span className="text-sm text-slate-500 flex items-center gap-1">
                             <Users className="w-4 h-4" />
                             {deal.client.name}
                           </span>
                         )}
                       </div>
                     </div>
                   </div>
                   <div className="text-right sm:text-left rtl:text-left rtl:sm:text-right">
                     <span className="block font-bold text-slate-900">
                       {formatCurrency(deal.negotiatedAmount || 0)}
                     </span>
                     <span className="text-xs text-slate-400 block mt-1">
                       {new Date(deal.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                     </span>
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="p-12 text-center">
               <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <p className="text-slate-500 mb-4">{t('trader.noDealsFound', 'لم يتم العثور على صفقات')}</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
