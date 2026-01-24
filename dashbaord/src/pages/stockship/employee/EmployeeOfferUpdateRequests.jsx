import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Gift, 
  Search, 
  Filter,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { employeeApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

const EmployeeOfferUpdateRequests = () => {
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { getAuth } = useMultiAuth();
  const { user } = getAuth('employee');

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchUpdateRequests();
    }
  }, [user?.id, statusFilter]);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const fetchUpdateRequests = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getAllOfferUpdateRequests({
        status: statusFilter || undefined
      });
      const data = response.data?.data || response.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching update requests:', error);
      showToast.error(t('mediation.offers.updateRequest.loadFailed') || 'Failed to load update requests');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(req => 
        req.offer?.title?.toLowerCase().includes(searchLower) ||
        req.offer?.trader?.name?.toLowerCase().includes(searchLower) ||
        req.offer?.trader?.companyName?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredRequests(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: t('mediation.offers.updateRequest.status.pending') || 'Pending' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: t('mediation.offers.updateRequest.status.approved') || 'Approved' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: t('mediation.offers.updateRequest.status.rejected') || 'Rejected' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle, label: t('mediation.offers.updateRequest.status.cancelled') || 'Cancelled' },
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle, label: status };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('mediation.offers.updateRequest.reviewTitle') || 'Offer Update Requests'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('mediation.offers.updateRequest.reviewSubtitle') || 'Review and approve or reject offer update requests'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
              <Input
                type="text"
                placeholder={t('common.search') || 'Search...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isRTL ? 'pr-10' : 'pl-10'}`}
              />
            </div>
            <div className="relative">
              <Filter className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full ${isRTL ? 'pr-10' : 'pl-10'} py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 bg-white`}
              >
                <option value="">{t('mediation.offers.updateRequest.allStatus') || 'All Status'}</option>
                <option value="PENDING">{t('mediation.offers.updateRequest.status.pending') || 'Pending'}</option>
                <option value="APPROVED">{t('mediation.offers.updateRequest.status.approved') || 'Approved'}</option>
                <option value="REJECTED">{t('mediation.offers.updateRequest.status.rejected') || 'Rejected'}</option>
                <option value="CANCELLED">{t('mediation.offers.updateRequest.status.cancelled') || 'Cancelled'}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {t('mediation.offers.updateRequest.noRequests') || 'No update requests found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-1">
                    <div className={`flex items-center gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Gift className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <h3 className="font-semibold text-gray-900">
                          {request.offer?.title || t('common.unknown') || 'Unknown'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {request.offer?.trader?.companyName || request.offer?.trader?.name || ''} • {request.offer?.trader?.traderCode || ''}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {t('common.submittedAt') || 'Submitted'}: {new Date(request.createdAt).toLocaleString()}
                    </p>
                    {Object.keys(request.requestedData || {}).length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-xs font-semibold mb-1">
                          {t('mediation.offers.updateRequest.requestedChanges') || 'Requested Changes'}:
                        </p>
                        <ul className="text-xs text-gray-700 space-y-1">
                          {Object.entries(request.requestedData).slice(0, 3).map(([key, value]) => (
                            <li key={key}>
                              <strong>{key}:</strong> {String(value).substring(0, 50)}
                              {String(value).length > 50 ? '...' : ''}
                            </li>
                          ))}
                          {Object.keys(request.requestedData).length > 3 && (
                            <li className="text-gray-500">
                              +{Object.keys(request.requestedData).length - 3} {t('common.more') || 'more'}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/stockship/employee/offer-update-requests/${request.id}`)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {t('common.view') || 'View'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </motion.div>
  );
};

export default EmployeeOfferUpdateRequests;
