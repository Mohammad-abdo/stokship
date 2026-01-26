import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Play, Pause, Volume2, VolumeX, Eye } from 'lucide-react';

const VideoAdsSection = () => {
  const { t, i18n } = useTranslation();
  const [videoAds, setVideoAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    fetchVideoAds();
  }, []);

  const fetchVideoAds = async () => {
    try {
      setLoading(true);
      const response = await api.get('/video-ads?activeOnly=true');
      const data = response.data.data || response.data;
      setVideoAds(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching video ads:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || videoAds.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {isRTL ? 'إعلانات مميزة' : 'Featured Advertisements'}
          </h2>
          <p className="text-gray-600">
            {isRTL ? 'شاهد أحدث المنتجات والعروض عبر الفيديو' : 'Watch our latest products and offers via video'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videoAds.map((ad) => (
            <div key={ad.id} className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
              <div className="relative aspect-video bg-black overflow-hidden">
                <video
                  src={ad.videoUrl}
                  poster={ad.thumbnailUrl}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  muted
                  playsInline
                  onMouseOver={(e) => e.currentTarget.play()}
                  onMouseOut={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                />
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {ad.views || 0}
                </div>
                <Link 
                  to={`/video-ads/${ad.id}`}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-6 h-6 fill-current" />
                  </div>
                </Link>
              </div>
              <div className={`p-6 flex-grow flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">
                  {isRTL ? ad.titleAr : ad.titleEn}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
                  {isRTL ? ad.descriptionAr : ad.descriptionEn}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <Link
                    to={`/video-ads/${ad.id}`}
                    className="inline-flex items-center text-primary font-bold hover:gap-2 transition-all"
                  >
                    {isRTL ? 'تفاصيل العرض' : 'View Details'}
                    <svg
                      className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  
                  {ad.linkUrl && (
                    <a
                      href={ad.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-primary transition-colors underline"
                    >
                      {isRTL ? 'الرابط الخارجي' : 'External Link'}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoAdsSection;
