import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { dealApi } from '@/lib/mediationApi';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Building2, User, Calendar, DollarSign, Package, CheckCircle, MessageSquare, CreditCard, FileText, AlertCircle } from 'lucide-react';
import showToast from '@/lib/toast';
import StandardDataTable from '@/components/StandardDataTable';

const TraderViewDeal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { getAuth } = useMultiAuth();
  const { user } = getAuth('trader');
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState(null);
  const [platformSettings, setPlatformSettings] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchDeal();
    }
  }, [id, user]);

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const response = await dealApi.getDealById(id);
      const responseData = response.data?.data || response.data;
      
      // Extract deal and platformSettings from response
      const dealData = responseData.deal || responseData;
      const settings = responseData.platformSettings || null;
      
      // Verify this deal belongs to the current trader
      if (dealData.traderId !== user.id) {
        showToast.error(
          t('mediation.deals.accessDenied') || 'Access Denied',
          t('mediation.deals.notYourDeal') || 'This deal does not belong to you'
        );
        navigate('/stockship/trader/deals');
        return;
      }
      
      setDeal(dealData);
      setPlatformSettings(settings);
    } catch (error) {
      console.error('Error fetching deal:', error);
      showToast.error(
        t('mediation.deals.loadDealFailed') || 'Failed to load deal',
        error.response?.data?.message || t('common.notFound') || 'Deal not found'
      );
      navigate('/stockship/trader/deals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm(t('mediation.deals.approveConfirm') || 'Are you sure you want to approve this deal?')) {
      return;
    }

    // Ensure we have a negotiatedAmount - use totalAmount as fallback
    let negotiatedAmount = deal.negotiatedAmount || deal.totalAmount;
    
    // Convert to number if it's a string
    if (typeof negotiatedAmount === 'string') {
      negotiatedAmount = parseFloat(negotiatedAmount);
    }
    
    // Validate the amount is a valid number and greater than 0
    if (!negotiatedAmount || isNaN(negotiatedAmount) || negotiatedAmount <= 0) {
      console.error('Invalid negotiatedAmount:', deal.negotiatedAmount, deal.totalAmount, negotiatedAmount);
      showToast.error(
        t('mediation.deals.approveFailed') || 'Failed to approve deal',
        t('mediation.deals.negotiatedAmountRequired') || 'Negotiated amount is required to approve the deal'
      );
      return;
    }

    try {
      await dealApi.approveDeal(deal.id, {
        negotiatedAmount: negotiatedAmount
      });
      showToast.success(
        t('mediation.deals.dealApproved') || 'Deal Approved',
        t('mediation.deals.approveSuccess') || 'Deal has been approved successfully'
      );
      fetchDeal(); // Reload deal data
    } catch (error) {
      console.error('Error approving deal:', error);
      showToast.error(
        t('mediation.deals.approveFailed') || 'Failed to approve deal',
        error.response?.data?.message || t('common.errorOccurred') || 'An error occurred'
      );
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      NEGOTIATION: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        label: t('mediation.deals.status.negotiation') || 'Negotiation' 
      },
      APPROVED: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800', 
        label: t('mediation.deals.status.approved') || 'Approved' 
      },
      PAID: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        label: t('mediation.deals.status.paid') || 'Paid' 
      },
      SETTLED: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800', 
        label: t('mediation.deals.status.settled') || 'Settled' 
      },
      CANCELLED: { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        label: t('mediation.deals.status.cancelled') || 'Cancelled' 
      }
    };
    const config = statusConfig[status] || { 
      bg: 'bg-gray-100', 
      text: 'text-gray-800', 
      label: status || t('common.unknown') || 'Unknown' 
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatDate = (date) => {
    if (!date) return t('common.notAvailable') || 'N/A';
    return new Date(date).toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return null;
  }

  // Deal items table columns
  const dealItemsColumns = [
    {
      header: t('mediation.deals.itemNo') || 'Item No',
      accessor: (item) => item.offerItem?.itemNo || item.itemNo || '-',
      className: 'font-mono'
    },
    {
      header: t('mediation.deals.description') || 'Description',
      accessor: (item) => item.offerItem?.description || item.description || '-',
      className: 'max-w-xs truncate'
    },
    {
      header: t('mediation.deals.quantity') || 'Quantity',
      accessor: (item) => (item.quantity || 0).toLocaleString(isRTL ? 'ar-SA' : 'en-US'),
      className: isRTL ? 'text-right' : 'text-left'
    },
    {
      header: t('mediation.deals.unit') || 'Unit',
      accessor: (item) => item.offerItem?.unit || item.unit || '-'
    },
    {
      header: t('mediation.deals.unitPrice') || 'Unit Price',
      accessor: (item) => {
        const price = item.offerItem?.unitPrice || item.unitPrice || 0;
        const currency = item.offerItem?.currency || item.currency || 'USD';
        return `${currency} ${formatCurrency(price)}`;
      },
      className: isRTL ? 'text-right' : 'text-left'
    },
    {
      header: t('mediation.deals.amount') || 'Amount',
      accessor: (item) => {
        const amount = item.offerItem?.amount || item.amount || 0;
        const currency = item.offerItem?.currency || item.currency || 'USD';
        return `${currency} ${formatCurrency(amount)}`;
      },
      className: isRTL ? 'text-right' : 'text-left'
    },
    {
      header: t('mediation.deals.cartons') || 'Cartons',
      accessor: (item) => (item.cartons || 0).toLocaleString(isRTL ? 'ar-SA' : 'en-US'),
      className: isRTL ? 'text-right' : 'text-left'
    },
    {
      header: t('mediation.deals.cbm') || 'CBM',
      accessor: (item) => {
        const cbm = item.offerItem?.totalCBM || item.totalCBM || item.cbm || 0;
        return formatCurrency(cbm);
      },
      className: isRTL ? 'text-right' : 'text-left'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/trader/deals')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </motion.button>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('mediation.deals.dealDetails') || 'Deal Details'}
            </h1>
            <p className="text-muted-foreground mt-2">{deal.dealNumber || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {deal.status === 'NEGOTIATION' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleApprove}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              {t('mediation.deals.approve') || 'Approve Deal'}
            </motion.button>
          )}
          {getStatusBadge(deal.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Info */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {t('mediation.deals.dealInfo') || 'Deal Information'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.dealNumber') || 'Deal Number'}</p>
                  <p className="font-mono font-semibold text-gray-900">{deal.dealNumber || 'N/A'}</p>
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.negotiatedAmount') || 'Negotiated Amount'}</p>
                  <p className="font-semibold text-lg text-gray-900">
                    ${formatCurrency(deal.negotiatedAmount || deal.totalAmount || 0)}
                  </p>
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.totalCBM') || 'Total CBM'}</p>
                  <p className="font-medium text-gray-900">{formatCurrency(deal.totalCBM || deal.cbm || 0)}</p>
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.totalCartons') || 'Total Cartons'}</p>
                  <p className="font-medium text-gray-900">{(deal.totalCartons || deal.cartons || 0).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</p>
                </div>
                {deal.financialTransactions && deal.financialTransactions.length > 0 && (() => {
                  const transaction = deal.financialTransactions[0];
                  const platformCommission = parseFloat(transaction.platformCommission || 0);
                  const employeeCommission = parseFloat(transaction.employeeCommission || 0);
                  const traderAmount = parseFloat(transaction.traderAmount || 0);
                  const totalAmount = parseFloat(transaction.amount || 0);
                  const platformCommissionRate = totalAmount > 0 ? ((platformCommission / totalAmount) * 100).toFixed(2) : 0;
                  
                  return (
                    <>
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.platformCommission') || 'Platform Commission'}</p>
                        <p className="font-medium text-gray-900">
                          ${formatCurrency(platformCommission)} ({platformCommissionRate}%)
                        </p>
                      </div>
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.employeeCommission') || 'Employee Commission'}</p>
                        <p className="font-medium text-gray-900">${formatCurrency(employeeCommission)}</p>
                      </div>
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.traderAmount') || 'Your Amount'}</p>
                        <p className="font-semibold text-lg text-green-600">${formatCurrency(traderAmount)}</p>
                      </div>
                    </>
                  );
                })()}
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.createdAt') || 'Created At'}</p>
                  <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{formatDate(deal.createdAt)}</p>
                  </div>
                </div>
                {deal.offer && (
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.offer') || 'Offer'}</p>
                    <p className="font-medium text-gray-900">{deal.offer.title || t('common.untitled') || 'Untitled'}</p>
                  </div>
                )}
              </div>
              {deal.notes && (
                <div className={`mt-4 p-3 bg-gray-50 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.notes') || 'Notes'}</p>
                  <p className="text-sm text-gray-900">{deal.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Card */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <User className="w-5 h-5 text-gray-600" />
                  {t('mediation.deals.client') || 'Client'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('mediation.employees.name') || 'Name'}</p>
                    <p className="font-medium text-gray-900">{deal.client?.name || t('common.notAvailable') || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('mediation.employees.email') || 'Email'}</p>
                    <p className="text-sm text-gray-900">{deal.client?.email || t('common.notAvailable') || 'N/A'}</p>
                  </div>
                  {deal.client?.phone && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('mediation.employees.phone') || 'Phone'}</p>
                      <p className="text-sm text-gray-900">{deal.client.phone}</p>
                    </div>
                  )}
                  {deal.client?.country && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('common.location') || 'Location'}</p>
                      <p className="text-sm text-gray-900">
                        {[deal.client.city, deal.client.country].filter(Boolean).join(', ') || t('common.notAvailable') || 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Employee/Guarantor Card */}
            {deal.employee && (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Building2 className="w-5 h-5 text-gray-600" />
                    {t('mediation.deals.guarantor') || 'Employee Guarantor'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('mediation.employees.name') || 'Name'}</p>
                      <p className="font-medium text-gray-900">{deal.employee.name || t('common.notAvailable') || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('mediation.employees.employeeCode') || 'Employee Code'}</p>
                      <p className="text-sm text-gray-900 font-mono">{deal.employee.employeeCode || t('common.notAvailable') || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Deal Items */}
          {deal.items && deal.items.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Package className="w-5 h-5 text-gray-600" />
                  {t('mediation.deals.dealItems') || 'Deal Items'}
                  <span className="text-sm font-normal text-gray-500">({deal.items.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StandardDataTable
                  data={deal.items || []}
                  columns={dealItemsColumns}
                  searchable={true}
                  searchPlaceholder={t('mediation.deals.searchItems') || 'Search items...'}
                  className="mt-4"
                />
              </CardContent>
            </Card>
          )}

          {/* Payment Info */}
          {deal.payments && deal.payments.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  {t('mediation.deals.payments') || 'Payments'}
                  <span className="text-sm font-normal text-gray-500">({deal.payments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deal.payments.map((payment, index) => (
                    <div 
                      key={payment.id || index} 
                      className={`p-4 border border-gray-200 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}
                    >
                      <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div>
                          <p className="font-medium text-gray-900">
                            ${formatCurrency(payment.amount || 0)}
                          </p>
                          {payment.paymentMethod && (
                            <p className="text-xs text-gray-500 mt-1">
                              {t('mediation.deals.paymentMethod') || 'Method'}: {payment.paymentMethod}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'VERIFIED' || payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          payment.status === 'FAILED' || payment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status || t('common.unknown') || 'Unknown'}
                        </span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs text-gray-500 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(payment.createdAt || payment.paymentDate)}</span>
                      </div>
                      {payment.referenceNumber && (
                        <p className="text-xs text-gray-500 mt-2 font-mono">
                          {t('mediation.deals.referenceNumber') || 'Reference'}: {payment.referenceNumber}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status History */}
          {deal.statusHistory && deal.statusHistory.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <FileText className="w-5 h-5 text-gray-600" />
                  {t('mediation.deals.statusHistory') || 'Status History'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deal.statusHistory.map((history, index) => (
                    <div 
                      key={history.id || index}
                      className={`flex items-start gap-3 p-3 border border-gray-200 rounded-lg ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                          {getStatusBadge(history.status)}
                          <span className="text-xs text-gray-500">{formatDate(history.createdAt)}</span>
                        </div>
                        {history.description && (
                          <p className="text-sm text-gray-700 mt-1">{history.description}</p>
                        )}
                        {history.changedByType && (
                          <p className="text-xs text-gray-500 mt-1">
                            {t('mediation.deals.changedBy') || 'Changed by'}: {history.changedByType}
                          </p>
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
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  {t('mediation.deals.negotiations') || 'Negotiation Messages'}
                  <span className="text-sm font-normal text-gray-500">({deal.negotiations.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {deal.negotiations.map((negotiation, index) => (
                    <div 
                      key={negotiation.id || index}
                      className={`p-4 border border-gray-200 rounded-lg ${
                        negotiation.senderType === 'TRADER' 
                          ? `bg-blue-50 ${isRTL ? 'text-right' : 'text-left'}` 
                          : `bg-gray-50 ${isRTL ? 'text-right' : 'text-left'}`
                      }`}
                    >
                      <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <p className="text-xs font-medium text-gray-700">
                          {negotiation.senderType === 'TRADER' 
                            ? t('mediation.deals.trader') || 'Trader'
                            : t('mediation.deals.client') || 'Client'
                          }
                        </p>
                        <span className="text-xs text-gray-500">{formatDate(negotiation.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{negotiation.message || negotiation.content}</p>
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
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CheckCircle className="w-5 h-5 text-gray-600" />
                {t('common.status') || 'Status'}
              </CardTitle>
            </CardHeader>
            <CardContent className={isRTL ? 'text-right' : 'text-left'}>
              {getStatusBadge(deal.status)}
              {deal.status === 'NEGOTIATION' && (
                <p className="text-xs text-gray-500 mt-3">
                  {t('mediation.deals.negotiationHint') || 'You can approve this deal to proceed'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Package className="w-5 h-5 text-gray-600" />
                {t('mediation.deals.quickStats') || 'Quick Stats'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <p className="text-sm text-gray-600">{t('mediation.deals.totalAmount') || 'Total Amount'}</p>
                  <p className="font-semibold text-gray-900">
                    ${formatCurrency(deal.negotiatedAmount || deal.totalAmount || 0)}
                  </p>
                </div>
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <p className="text-sm text-gray-600">{t('mediation.deals.totalCBM') || 'Total CBM'}</p>
                  <p className="font-medium text-gray-900">{formatCurrency(deal.totalCBM || deal.cbm || 0)}</p>
                </div>
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <p className="text-sm text-gray-600">{t('mediation.deals.totalCartons') || 'Total Cartons'}</p>
                  <p className="font-medium text-gray-900">
                    {(deal.totalCartons || deal.cartons || 0).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <p className="text-sm text-gray-600">{t('mediation.deals.items') || 'Items'}</p>
                  <p className="font-medium text-gray-900">
                    {(deal.items?.length || 0).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <p className="text-sm text-gray-600">{t('mediation.deals.payments') || 'Payments'}</p>
                  <p className="font-medium text-gray-900">
                    {(deal.payments?.length || 0).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar className="w-5 h-5 text-gray-600" />
                {t('mediation.deals.importantDates') || 'Important Dates'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('mediation.deals.createdAt') || 'Created'}</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(deal.createdAt)}</p>
                </div>
                {deal.updatedAt && deal.updatedAt !== deal.createdAt && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('common.updatedAt') || 'Last Updated'}</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(deal.updatedAt)}</p>
                  </div>
                )}
                {deal.approvedAt && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('mediation.deals.approvedAt') || 'Approved At'}</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(deal.approvedAt)}</p>
                  </div>
                )}
                {deal.settledAt && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('mediation.deals.settledAt') || 'Settled At'}</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(deal.settledAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default TraderViewDeal;

