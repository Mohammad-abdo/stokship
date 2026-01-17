import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StandardDataTable from '@/components/StandardDataTable';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Eye, 
  Edit, 
  Upload,
  Gift,
  Package,
  Plus,
  Filter,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { traderApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

const TraderOffers = () => {
  const navigate = useNavigate();
  const { getAuth } = useMultiAuth();
  const { t, language, isRTL } = useLanguage();
  const { user } = getAuth('trader');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchOffers();
    }
  }, [user, pagination.page, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchOffers();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await traderApi.getTraderOffers(user.id, params);
      const data = response.data?.data || response.data || [];
      setOffers(Array.isArray(data) ? data : []);
      if (response.data?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      } else {
        // Client-side pagination fallback
        setPagination(prev => ({
          ...prev,
          total: Array.isArray(data) ? data.length : 0,
          pages: Math.ceil((Array.isArray(data) ? data.length : 0) / pagination.limit) || 1
        }));
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      showToast.error(
        t('mediation.offers.loadFailed') || 'Failed to load offers',
        error.response?.data?.message || 'Please try again'
      );
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.offers.draft') || 'Draft', icon: FileText },
      PENDING_VALIDATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('mediation.offers.pending') || 'Pending', icon: Clock },
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: t('mediation.offers.active') || 'Active', icon: CheckCircle },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.offers.closed') || 'Closed', icon: XCircle },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: t('mediation.offers.rejected') || 'Rejected', icon: XCircle }
    };
    const config = statusConfig[status] || statusConfig.DRAFT;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    {
      key: 'title',
      label: t('mediation.offers.offerTitle') || 'Title',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-gray-400" />
          <div className="flex flex-col">
            <span className="font-medium text-sm text-gray-900">{value || 'N/A'}</span>
            {row.description && (
              <span className="text-xs text-gray-500 line-clamp-1">{row.description}</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: t('mediation.common.status') || 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'items_count',
      label: t('mediation.offers.items') || 'Items',
      render: (value, row) => (
        <div className="flex items-center gap-1.5">
          <Package className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {row._count?.items || row.items?.length || 0}
          </span>
        </div>
      )
    },
    {
      key: 'totalCBM',
      label: t('mediation.offers.totalCBM') || 'Total CBM',
      render: (value) => (
        <span className="text-sm font-medium text-gray-900">
          {(Number(value) || 0).toFixed(2)}
        </span>
      )
    },
    {
      key: 'deals_count',
      label: t('mediation.offers.deals') || 'Deals',
      render: (value, row) => (
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {row._count?.deals || 0}
          </span>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: t('mediation.common.createdAt') || 'Created',
      render: (value) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(value)}</span>
        </div>
      )
    }
  ];

  const rowActions = (row) => (
    <div className={`flex items-center gap-1 ${isRTL ? 'justify-start' : 'justify-end'}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/stockship/trader/offers/${row.id}`);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.offers.viewDetails') || 'View Details'}
      >
        <Eye className="w-4 h-4 text-gray-600" />
      </button>
      {row.status === 'DRAFT' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/stockship/trader/offers/${row.id}/edit`);
          }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title={t('common.edit') || 'Edit'}
        >
          <Edit className="w-4 h-4 text-gray-600" />
        </button>
      )}
      {row.status === 'PENDING_VALIDATION' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/stockship/trader/offers/${row.id}/upload`);
          }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title={t('mediation.offers.uploadData') || 'Upload Data'}
        >
          <Upload className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  );

  // Calculate stats from pagination total (if available) or current offers
  const stats = {
    total: pagination.total || offers.length,
    active: offers.filter(o => o.status === 'ACTIVE').length,
    pending: offers.filter(o => o.status === 'PENDING_VALIDATION').length,
    draft: offers.filter(o => o.status === 'DRAFT').length
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('mediation.trader.myOffers') || 'My Offers'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('mediation.trader.myOffersDesc') || 'Manage and track your product offers'}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/stockship/trader/offers/create')}
          className={`flex items-center gap-2 px-6 py-2.5 bg-yellow-400 text-blue-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Plus className="w-4 h-4" />
          <span>{t('mediation.trader.createOffer') || 'Create Offer'}</span>
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('mediation.offers.totalOffers') || 'Total Offers'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Gift className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('mediation.offers.active') || 'Active'}</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('mediation.offers.pending') || 'Pending'}</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('mediation.offers.draft') || 'Draft'}</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className={`flex flex-col sm:flex-row gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <div className="relative flex-1">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
              <input
                type="text"
                placeholder={t('mediation.offers.search') || 'Search offers by title or description...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white`}
              />
            </div>
            <div className="relative">
              <Filter className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none`} />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white appearance-none min-w-[180px]`}
              >
                <option value="">{t('mediation.offers.allStatus') || 'All Status'}</option>
                <option value="DRAFT">{t('mediation.offers.draft') || 'Draft'}</option>
                <option value="PENDING_VALIDATION">{t('mediation.offers.pending') || 'Pending'}</option>
                <option value="ACTIVE">{t('mediation.offers.active') || 'Active'}</option>
                <option value="CLOSED">{t('mediation.offers.closed') || 'Closed'}</option>
                <option value="REJECTED">{t('mediation.offers.rejected') || 'Rejected'}</option>
              </select>
            </div>
            {statusFilter && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {t('mediation.offers.clearFilters') || 'Clear Filter'}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Offers Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {t('mediation.offers.list') || 'Offers List'} ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <StandardDataTable
            columns={columns}
            data={offers}
            loading={loading}
            emptyMessage={t('mediation.offers.noOffers') || 'No offers found'}
            searchable={false}
            rowActions={rowActions}
            compact={false}
            pagination={{
              page: pagination.page,
              pages: pagination.pages,
              total: pagination.total,
              limit: pagination.limit
            }}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            onRowClick={(row) => navigate(`/stockship/trader/offers/${row.id}`)}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TraderOffers;
