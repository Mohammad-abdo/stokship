import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { dealApi } from '@/lib/mediationApi';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Building2, User, Calendar, DollarSign, Package, CheckCircle, MessageSquare, CreditCard } from 'lucide-react';
import showToast from '@/lib/toast';

const ViewDeal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState(null);

  useEffect(() => {
    fetchDeal();
  }, [id]);

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const response = await dealApi.getDealById(id);
      setDeal(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching deal:', error);
      showToast.error(
        t('mediation.employee.loadDealFailed') || 'Failed to load deal',
        error.response?.data?.message || 'Deal not found'
      );
      navigate('/stockship/employee/deals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      NEGOTIATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('mediation.deals.negotiation') || 'Negotiation' },
      APPROVED: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('mediation.deals.approved') || 'Approved' },
      PAID: { bg: 'bg-green-100', text: 'text-green-800', label: t('mediation.deals.paid') || 'Paid' },
      SETTLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.deals.settled') || 'Settled' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: t('mediation.deals.cancelled') || 'Cancelled' }
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status || 'Unknown' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.employee.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/employee/deals')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('mediation.deals.viewDetails') || 'Deal Details'}
            </h1>
            <p className="text-muted-foreground mt-2">{deal.dealNumber || 'N/A'}</p>
          </div>
        </div>
        {getStatusBadge(deal.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Info */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {t('mediation.deals.dealInfo') || 'Deal Information'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.dealNumber') || 'Deal Number'}</p>
                  <p className="font-mono font-semibold text-gray-900">{deal.dealNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.negotiatedAmount') || 'Negotiated Amount'}</p>
                  <p className="font-semibold text-lg text-gray-900">
                    ${(Number(deal.negotiatedAmount) || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.cbm') || 'CBM'}</p>
                  <p className="font-medium text-gray-900">{deal.cbm || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.cartons') || 'Cartons'}</p>
                  <p className="font-medium text-gray-900">{deal.cartons || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('mediation.common.createdAt') || 'Created At'}</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">
                      {deal.createdAt 
                        ? new Date(deal.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-600" />
                  {t('mediation.deals.trader') || 'Trader'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">{t('mediation.traders.companyName') || 'Company'}</p>
                    <p className="font-medium text-gray-900">{deal.trader?.companyName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('mediation.traders.contactPerson') || 'Contact'}</p>
                    <p className="text-sm text-gray-900">{deal.trader?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('mediation.common.email') || 'Email'}</p>
                    <p className="text-sm text-gray-900">{deal.trader?.email || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  {t('mediation.deals.client') || 'Client'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">{t('mediation.common.name') || 'Name'}</p>
                    <p className="font-medium text-gray-900">{deal.client?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('mediation.common.email') || 'Email'}</p>
                    <p className="text-sm text-gray-900">{deal.client?.email || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Info */}
          {deal.payments && deal.payments.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  {t('mediation.deals.payments') || 'Payments'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deal.payments.map((payment, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">
                          ${(Number(payment.amount) || 0).toFixed(2)}
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                          payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status || 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {payment.createdAt 
                          ? new Date(payment.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')
                          : 'N/A'
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-gray-600" />
                {t('mediation.common.status') || 'Status'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getStatusBadge(deal.status)}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-600" />
                {t('mediation.deals.quickStats') || 'Quick Stats'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{t('mediation.deals.totalAmount') || 'Total Amount'}</p>
                  <p className="font-semibold text-gray-900">
                    ${(Number(deal.negotiatedAmount) || 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{t('mediation.deals.cbm') || 'CBM'}</p>
                  <p className="font-medium text-gray-900">{deal.cbm || 'N/A'}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{t('mediation.deals.cartons') || 'Cartons'}</p>
                  <p className="font-medium text-gray-900">{deal.cartons || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default ViewDeal;




