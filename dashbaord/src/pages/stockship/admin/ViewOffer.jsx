import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Gift, Store, Package, ShoppingCart, Calendar, CheckCircle, XCircle, FileText, Box } from 'lucide-react';
import showToast from '@/lib/toast';

const ViewOffer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState(null);

  useEffect(() => {
    fetchOffer();
  }, [id]);

  const fetchOffer = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getOffer(id);
      setOffer(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching offer:', error);
      showToast.error(t('mediation.offers.loadFailed') || 'Failed to load offer', error.response?.data?.message || t('common.notFound') || 'Offer not found');
      navigate('/stockship/admin/offers');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      ACTIVE: 'bg-green-100 text-green-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      VALIDATED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-orange-100 text-orange-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || t('common.unknown') || 'Unknown'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.offers.loading')}</p>
        </div>
      </div>
    );
  }

  if (!offer) {
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
            onClick={() => navigate('/stockship/admin/offers')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold">{t('mediation.offers.title')} - {t('mediation.offers.viewDetails')}</h1>
            <p className="text-muted-foreground mt-2">{offer.title || 'N/A'}</p>
          </div>
        </div>
        {getStatusBadge(offer.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                {t('mediation.viewOffer.basicInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.id')}</label>
                  <p className="mt-1 font-mono">{offer.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.status')}</label>
                  <div className="mt-1">{getStatusBadge(offer.status)}</div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.offers.title')}</label>
                  <p className="mt-1 text-lg font-semibold">{offer.title || 'N/A'}</p>
                </div>
                {offer.description && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.offers.description')}</label>
                    <p className="mt-1">{offer.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewOffer.totalCBM')}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Box className="w-4 h-4 text-gray-400" />
                    <p>{offer.totalCBM || 0} CBM</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewOffer.totalCartons')}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Package className="w-4 h-4 text-gray-400" />
                    <p>{offer.totalCartons || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trader Information */}
          {offer.trader && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  {t('mediation.viewOffer.traderInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.traders.companyName')}</label>
                    <p className="mt-1">{offer.trader.companyName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.traders.traderCode')}</label>
                    <p className="mt-1 font-mono">{offer.trader.traderCode || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.traders.country')}</label>
                    <p className="mt-1">{offer.trader.country || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.traders.city')}</label>
                    <p className="mt-1">{offer.trader.city || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Offer Items */}
          {offer.items && offer.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('mediation.viewOffer.items')} ({offer.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">{t('mediation.common.id')}</th>
                        <th className="text-left p-3">{t('mediation.viewOffer.itemDescription')}</th>
                        <th className="text-left p-3">{t('mediation.viewOffer.quantity')}</th>
                        <th className="text-left p-3">{t('mediation.viewOffer.cbm')}</th>
                        <th className="text-left p-3">{t('mediation.viewOffer.cartons')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offer.items.slice(0, 50).map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{item.id}</td>
                          <td className="p-3">{item.description || 'N/A'}</td>
                          <td className="p-3">{item.quantity || 0}</td>
                          <td className="p-3">{item.cbm || 0}</td>
                          <td className="p-3">{item.cartons || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {offer.items.length > 50 && (
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      {t('mediation.viewOffer.showingFirst50')} {offer.items.length} {t('mediation.viewOffer.items')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('mediation.viewOffer.statistics')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{offer._count?.items || 0}</p>
                    <p className="text-sm text-muted-foreground">{t('mediation.viewOffer.totalItems')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <ShoppingCart className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{offer._count?.deals || 0}</p>
                    <p className="text-sm text-muted-foreground">{t('mediation.viewOffer.totalDeals')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('mediation.viewOffer.importantDates')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewOffer.createdAt')}</label>
                <p className="mt-1">{offer.createdAt ? new Date(offer.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
              {offer.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewOffer.lastUpdated')}</label>
                  <p className="mt-1">{new Date(offer.updatedAt).toLocaleString()}</p>
                </div>
              )}
              {offer.validatedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewOffer.validatedAt')}</label>
                  <p className="mt-1">{new Date(offer.validatedAt).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default ViewOffer;




