import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Upload, 
  X, 
  Save, 
  Image as ImageIcon,
  Loader2,
  Edit
} from 'lucide-react';
import { offerApi, uploadApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Countries and cities data
const countries = [
  { value: 'SA', label: { en: 'Saudi Arabia', ar: 'السعودية' } },
  { value: 'AE', label: { en: 'United Arab Emirates', ar: 'الإمارات' } },
  { value: 'EG', label: { en: 'Egypt', ar: 'مصر' } },
  { value: 'KW', label: { en: 'Kuwait', ar: 'الكويت' } },
  { value: 'QA', label: { en: 'Qatar', ar: 'قطر' } },
  { value: 'BH', label: { en: 'Bahrain', ar: 'البحرين' } },
  { value: 'OM', label: { en: 'Oman', ar: 'عمان' } },
  { value: 'JO', label: { en: 'Jordan', ar: 'الأردن' } },
  { value: 'LB', label: { en: 'Lebanon', ar: 'لبنان' } },
  { value: 'MA', label: { en: 'Morocco', ar: 'المغرب' } }
];

const citiesByCountry = {
  'SA': [
    { value: 'riyadh', label: { en: 'Riyadh', ar: 'الرياض' } },
    { value: 'jeddah', label: { en: 'Jeddah', ar: 'جدة' } },
    { value: 'dammam', label: { en: 'Dammam', ar: 'الدمام' } },
    { value: 'makkah', label: { en: 'Makkah', ar: 'مكة المكرمة' } },
    { value: 'medina', label: { en: 'Medina', ar: 'المدينة المنورة' } },
    { value: 'khobar', label: { en: 'Khobar', ar: 'الخبر' } },
    { value: 'taif', label: { en: 'Taif', ar: 'الطائف' } },
    { value: 'abha', label: { en: 'Abha', ar: 'أبها' } }
  ],
  'AE': [
    { value: 'dubai', label: { en: 'Dubai', ar: 'دبي' } },
    { value: 'abu-dhabi', label: { en: 'Abu Dhabi', ar: 'أبوظبي' } },
    { value: 'sharjah', label: { en: 'Sharjah', ar: 'الشارقة' } }
  ],
  'EG': [
    { value: 'cairo', label: { en: 'Cairo', ar: 'القاهرة' } },
    { value: 'alexandria', label: { en: 'Alexandria', ar: 'الإسكندرية' } }
  ]
};

// Categories for offers
const categories = [
  { value: 'electronics', label: { en: 'Electronics', ar: 'إلكترونيات' } },
  { value: 'clothing', label: { en: 'Clothing', ar: 'ملابس' } },
  { value: 'shoes', label: { en: 'Shoes', ar: 'أحذية' } },
  { value: 'furniture', label: { en: 'Furniture', ar: 'مفروشات' } },
  { value: 'decorations', label: { en: 'Decorations', ar: 'ديكورات' } },
  { value: 'food', label: { en: 'Food', ar: 'أطعمة' } },
  { value: 'toys', label: { en: 'Toys', ar: 'ألعاب' } },
  { value: 'books', label: { en: 'Books', ar: 'كتب' } },
  { value: 'sports', label: { en: 'Sports', ar: 'رياضة' } },
  { value: 'automotive', label: { en: 'Automotive', ar: 'سيارات' } },
  { value: 'health', label: { en: 'Health & Beauty', ar: 'صحة وجمال' } },
  { value: 'home', label: { en: 'Home & Garden', ar: 'منزل وحديقة' } }
];

const TraderEditOfferRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuth } = useMultiAuth();
  const { t, language, isRTL } = useLanguage();
  const { user } = getAuth('trader');
  const imageInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [offer, setOffer] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    country: 'SA',
    city: 'jeddah',
    category: '',
    acceptsNegotiation: false
  });
  
  // Images gallery
  const [adImages, setAdImages] = useState([]);

  // Get available cities for selected country
  const availableCities = citiesByCountry[formData.country] || [];

  // Fetch offer data
  useEffect(() => {
    if (id && user?.id) {
      fetchOffer();
    }
  }, [id, user?.id]);

  const fetchOffer = async () => {
    try {
      setLoading(true);
      const response = await offerApi.getOfferById(id);
      const responseData = response.data?.data || response.data;
      const offerData = responseData.offer || responseData;
      
      if (!offerData) {
        showToast.error(t('mediation.offers.notFound') || 'Offer not found');
        navigate('/stockship/trader/offers');
        return;
      }

      // Check if offer belongs to trader
      if (offerData.traderId !== user.id) {
        showToast.error(t('mediation.offers.unauthorized') || 'Not authorized');
        navigate('/stockship/trader/offers');
        return;
      }

      // Check if offer is ACTIVE
      if (offerData.status !== 'ACTIVE') {
        showToast.error(t('mediation.offers.canOnlyEditActive') || 'Can only request edits for active offers');
        navigate(`/stockship/trader/offers/${id}`);
        return;
      }

      setOffer(offerData);

      // Parse images
      let images = [];
      if (offerData.images) {
        try {
          images = typeof offerData.images === 'string' 
            ? JSON.parse(offerData.images) 
            : offerData.images;
          if (!Array.isArray(images)) images = [];
        } catch (e) {
          images = [];
        }
      }

      // Set form data
      setFormData({
        title: offerData.title || '',
        description: offerData.description || '',
        country: offerData.country || 'SA',
        city: offerData.city || 'jeddah',
        category: offerData.category || '',
        acceptsNegotiation: offerData.acceptsNegotiation || false
      });

      setAdImages(images);
    } catch (error) {
      console.error('Error fetching offer:', error);
      showToast.error(t('mediation.offers.loadFailed') || 'Failed to load offer');
      navigate('/stockship/trader/offers');
    } finally {
      setLoading(false);
    }
  };

  // Handle ad images upload
  const handleAdImagesUpload = async (files) => {
    if (!files || files.length === 0) return;

    if (adImages.length + files.length > 10) {
      showToast.error(
        t('mediation.trader.maxImages') || 'Maximum Images Exceeded',
        t('mediation.trader.maxImagesDesc') || 'You can upload a maximum of 10 images'
      );
      return;
    }

    setUploadingImages(true);
    try {
      const response = await uploadApi.uploadImages(Array.from(files));
      const uploadedUrls = response.data.data.files.map(file => {
        const url = file.url || `/uploads/images/${file.filename}`;
        if (url.startsWith('http')) {
          return url;
        } else if (url.startsWith('/')) {
          return `${API_URL}${url}`;
        } else {
          return `${API_URL}/uploads/images/${url}`;
        }
      });
      
      setAdImages(prev => [...prev, ...uploadedUrls]);
      showToast.success(
        t('common.uploadSuccess') || 'Upload Success',
        t('mediation.trader.imagesUploaded') || 'Images uploaded successfully'
      );
    } catch (error) {
      console.error('Error uploading images:', error);
      showToast.error(
        t('common.uploadFailed') || 'Upload Failed',
        error.response?.data?.message || t('mediation.trader.uploadFailedDesc') || 'Failed to upload images'
      );
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveAdImage = (index) => {
    setAdImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!offer) return;

    try {
      setSubmitting(true);
      
      // Prepare update data - only include changed fields
      const updateData = {};
      
      if (formData.title !== offer.title) updateData.title = formData.title;
      if (formData.description !== offer.description) updateData.description = formData.description;
      if (formData.country !== offer.country) updateData.country = formData.country;
      if (formData.city !== offer.city) updateData.city = formData.city;
      if (formData.category !== offer.category) updateData.category = formData.category;
      if (formData.acceptsNegotiation !== offer.acceptsNegotiation) {
        updateData.acceptsNegotiation = formData.acceptsNegotiation;
      }

      // Check if images changed
      const currentImages = offer.images 
        ? (typeof offer.images === 'string' ? JSON.parse(offer.images) : offer.images)
        : [];
      if (JSON.stringify(adImages) !== JSON.stringify(currentImages)) {
        updateData.images = adImages;
      }

      if (Object.keys(updateData).length === 0) {
        showToast.error(t('mediation.offers.noChanges') || 'No changes detected');
        return;
      }

      await offerApi.createOfferUpdateRequest(offer.id, updateData);
      showToast.success(
        t('mediation.offers.editRequestCreated') || 'Edit Request Created',
        t('mediation.offers.editRequestCreatedDesc') || 'Your edit request has been submitted successfully. Please wait for employee review.'
      );
      navigate(`/stockship/trader/offers/${id}`);
    } catch (error) {
      console.error('Error creating edit request:', error);
      showToast.error(
        error.response?.data?.message || 
        t('mediation.offers.editRequestFailed') || 
        'Failed to submit edit request'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/stockship/trader/offers/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </motion.button>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('mediation.offers.requestEdit') || 'Request Edit'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('mediation.offers.requestEditDesc') || 'Request changes to your offer. Changes will be reviewed by an employee.'}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={submitting}
          className={`flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('common.submitting') || 'Submitting...'}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{t('common.submitRequest') || 'Submit Request'}</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Section 1: Basic Information */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Edit className="w-5 h-5 text-blue-500" />
            {t('mediation.trader.basicInfo') || 'Basic Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('mediation.offers.offerTitle') || 'Title'} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t('mediation.trader.enterTitle') || 'Enter offer title...'}
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('mediation.trader.description') || 'Description'} *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t('mediation.trader.enterDescription') || 'Enter offer description...'}
            />
          </div>

          {/* Country and City */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('mediation.trader.country') || 'Country'} *
              </label>
              <select
                value={formData.country}
                onChange={(e) => {
                  setFormData({ ...formData, country: e.target.value, city: '' });
                }}
                className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {countries.map(country => (
                  <option key={country.value} value={country.value}>
                    {isRTL ? country.label.ar : country.label.en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('mediation.trader.city') || 'City'} *
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <option value="">{t('mediation.trader.selectCity') || 'Select City'}</option>
                {availableCities.map(city => (
                  <option key={city.value} value={city.value}>
                    {isRTL ? city.label.ar : city.label.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('mediation.trader.category') || 'Category'}
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <option value="">{t('mediation.trader.selectCategory') || 'Select Category'}</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {isRTL ? category.label.ar : category.label.en}
                </option>
              ))}
            </select>
          </div>

          {/* Negotiation Toggle */}
          <div className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
            <label htmlFor="acceptsNegotiation" className={`text-sm font-medium text-gray-700 cursor-pointer ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('mediation.trader.acceptNegotiation') || 'Do you accept negotiation on price and quantity?'}
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="acceptsNegotiation"
                checked={formData.acceptsNegotiation}
                onChange={(e) => setFormData({ ...formData, acceptsNegotiation: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Upload Images */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <ImageIcon className="w-5 h-5 text-blue-500" />
            {t('mediation.trader.uploadImages') || 'Upload Images'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors bg-gray-50">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleAdImagesUpload(e.target.files);
                }
                e.target.value = '';
              }}
              disabled={uploadingImages || adImages.length >= 10}
            />
            
            <div className={`flex flex-col items-center gap-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              <Upload className={`w-16 h-16 text-blue-500 ${uploadingImages ? 'animate-pulse' : ''}`} />
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {t('mediation.trader.dragDropImages') || 'Drag and drop images here'} {t('common.or') || 'or'}
                </p>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImages || adImages.length >= 10}
                  className={`inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  {uploadingImages ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('common.uploading') || 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5" />
                      {t('mediation.trader.chooseImages') || 'Choose Images'}
                    </>
                  )}
                </button>
              </div>
              
              <div className="text-sm text-gray-500 space-y-1">
                <p>{t('mediation.trader.maxFileSize') || 'Max 100 MB per file'}</p>
                <p>{t('mediation.trader.supportedFormats') || 'Supported formats: image/jpeg, image/png, image/webp'}</p>
                <p className="font-medium text-gray-700 mt-2">
                  {t('mediation.trader.uploadAdImages') || 'Upload ad images'} ({t('mediation.trader.maxImagesCount') || 'max 10 images'})
                </p>
              </div>
            </div>
          </div>

          {/* Uploaded Images Gallery */}
          {adImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {adImages.map((imgUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imgUrl.startsWith('http') ? imgUrl : `${API_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`}
                    alt={`Ad image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                  <button
                    onClick={() => handleRemoveAdImage(index)}
                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TraderEditOfferRequest;
