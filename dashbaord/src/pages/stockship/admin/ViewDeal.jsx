import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Store, User, Briefcase, Calendar, DollarSign, Package, Box, CheckCircle, MessageSquare, CreditCard } from 'lucide-react';
import showToast from '@/lib/toast';

const ViewDeal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState(null);

  useEffect(() => {
    fetchDeal();
  }, [id]);

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDeal(id);
      const data = response.data.data || response.data;
      setDeal(data.deal || data);
    } catch (error) {
      console.error('Error fetching deal:', error);
      showToast.error('Failed to load deal', error.response?.data?.message || 'Deal not found');
      navigate('/stockship/admin/deals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      NEGOTIATION: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      SETTLED: 'bg-emerald-100 text-emerald-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    const statusLabels = {
      NEGOTIATION: t('mediation.deals.negotiation'),
      APPROVED: t('mediation.deals.approved'),
      PAID: t('mediation.deals.paid'),
      SETTLED: t('mediation.deals.settled'),
      CANCELLED: t('mediation.deals.cancelled')
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status || 'Unknown'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.deals.loading')}</p>
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
            onClick={() => navigate('/stockship/admin/deals')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold">{t('mediation.deals.title')} - {t('mediation.deals.viewDetails')}</h1>
            <p className="text-muted-foreground mt-2">{deal.dealNumber || 'N/A'}</p>
          </div>
        </div>
        {getStatusBadge(deal.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {t('mediation.viewDeal.basicInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.deals.dealNumber')}</label>
                  <p className="mt-1 font-mono">{deal.dealNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.status')}</label>
                  <div className="mt-1">{getStatusBadge(deal.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.negotiatedAmount')}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <p className="text-lg font-semibold">{deal.negotiatedAmount ? `${Number(deal.negotiatedAmount).toLocaleString()} SAR` : 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.totalCBM')}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Box className="w-4 h-4 text-gray-400" />
                    <p>{deal.totalCBM || 0} CBM</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.totalCartons')}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Package className="w-4 h-4 text-gray-400" />
                    <p>{deal.totalCartons || 0}</p>
                  </div>
                </div>
                {deal.settledAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.settledAt')}</label>
                    <p className="mt-1">{new Date(deal.settledAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Parties Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trader */}
            {deal.trader && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Store className="w-5 h-5" />
                    {t('mediation.deals.trader')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.traders.companyName')}</label>
                    <p className="mt-1">{deal.trader.companyName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.traders.traderCode')}</label>
                    <p className="mt-1 font-mono text-sm">{deal.trader.traderCode || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Client */}
            {deal.client && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5" />
                    {t('mediation.deals.client')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.name')}</label>
                    <p className="mt-1">{deal.client.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.email')}</label>
                    <p className="mt-1">{deal.client.email || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Employee */}
          {deal.employee && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  {t('mediation.viewDeal.employee')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.name')}</label>
                    <p className="mt-1">{deal.employee.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.employees.employeeCode')}</label>
                    <p className="mt-1 font-mono">{deal.employee.employeeCode || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deal Items */}
          {deal.items && deal.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t('mediation.viewDeal.items')} ({deal.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">{t('mediation.common.id')}</th>
                        <th className="text-left p-3">{t('mediation.viewDeal.itemDescription')}</th>
                        <th className="text-left p-3">{t('mediation.viewDeal.quantity')}</th>
                        <th className="text-left p-3">{t('mediation.viewDeal.cbm')}</th>
                        <th className="text-left p-3">{t('mediation.viewDeal.cartons')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deal.items.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{item.id}</td>
                          <td className="p-3">{item.offerItem?.description || 'N/A'}</td>
                          <td className="p-3">{item.quantity || 0}</td>
                          <td className="p-3">{item.cbm || 0}</td>
                          <td className="p-3">{item.cartons || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payments */}
          {deal.payments && deal.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {t('mediation.viewDeal.payments')} ({deal.payments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deal.payments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.amount')}</label>
                          <p className="mt-1 font-semibold">{payment.amount ? `${payment.amount.toLocaleString()} SAR` : 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.status')}</label>
                          <div className="mt-1">
                            {payment.status === 'COMPLETED' ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {t('mediation.viewDeal.completed')}
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {payment.status || 'N/A'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.paymentDate')}</label>
                          <p className="mt-1">{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A'}</p>
                        </div>
                        {payment.paymentMethod && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.paymentMethod')}</label>
                            <p className="mt-1">{payment.paymentMethod}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Negotiations */}
          {deal.negotiations && deal.negotiations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  {t('mediation.viewDeal.negotiations')} ({deal.negotiations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {deal.negotiations.map((negotiation) => (
                    <div key={negotiation.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">{negotiation.senderType || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground">
                          {negotiation.createdAt ? new Date(negotiation.createdAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm">{negotiation.message || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('mediation.viewDeal.importantDates')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.createdAt')}</label>
                <p className="mt-1">{deal.createdAt ? new Date(deal.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
              {deal.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.lastUpdated')}</label>
                  <p className="mt-1">{new Date(deal.updatedAt).toLocaleString()}</p>
                </div>
              )}
              {deal.approvedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.approvedAt')}</label>
                  <p className="mt-1">{new Date(deal.approvedAt).toLocaleString()}</p>
                </div>
              )}
              {deal.settledAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.settledAt')}</label>
                  <p className="mt-1">{new Date(deal.settledAt).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Offer Info */}
          {deal.offer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t('mediation.viewDeal.offer')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.offers.title')}</label>
                  <p className="mt-1">{deal.offer.title || 'N/A'}</p>
                </div>
                {deal.offer.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.offers.description')}</label>
                    <p className="mt-1 text-sm">{deal.offer.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ViewDeal;

