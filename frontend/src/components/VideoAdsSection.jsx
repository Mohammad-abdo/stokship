import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, Keyboard, EffectFade } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import api, { getFileUrl } from '../services/api';
import { Play, Eye, X, ExternalLink, Calendar, ChevronRight, ChevronLeft, Volume2, VolumeX, Sparkles } from 'lucide-react';

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

const VideoAdsSection = () => {
  const { t, i18n } = useTranslation();
  const [videoAds, setVideoAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
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

  const incrementViews = async (id) => {
    try {
      const response = await api.get(`/video-ads/${id}`);
      const updatedAd = response.data.data || response.data;
      setVideoAds(prev => prev.map(ad => ad.id === id ? updatedAd : ad));
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const openDetails = (ad) => {
    setSelectedAd(ad);
    incrementViews(ad.id);
  };

  if (loading || videoAds.length === 0) return null;

  return (
    <section className="w-full bg-[#050505] overflow-hidden relative group/hero">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, Keyboard, EffectFade]}
        effect="fade"
        speed={1200}
        spaceBetween={0}
        slidesPerView={1}
        loop={videoAds.length > 1}
        autoplay={{
          delay: 12000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          renderBullet: (index, className) => {
            return `<span class="${className} modern-bullet"></span>`;
          },
        }}
        navigation={{
          nextEl: '.hero-next',
          prevEl: '.hero-prev',
        }}
        keyboard={{ enabled: true }}
        className="video-hero-swiper h-[90vh] w-full"
      >
        {videoAds.map((ad, idx) => (
          <SwiperSlide key={ad.id}>
            {({ isActive }) => (
              <div className="relative w-full h-full overflow-hidden">
                {/* Immersive Video Layer */}
                <motion.div 
                  initial={{ scale: 1.1 }}
                  animate={{ scale: isActive ? 1 : 1.1 }}
                  transition={{ duration: 15, ease: "linear" }}
                  className="absolute inset-0 z-0"
                >
                  <video
                    src={getFileUrl(ad.videoUrl)}
                    poster={getFileUrl(ad.thumbnailUrl)}
                    className="w-full h-full object-cover brightness-[0.5] grayscale-[0.2] contrast-[1.1]"
                    muted={isMuted}
                    playsInline
                    loop
                    autoPlay
                  />
                </motion.div>
                
                {/* Advanced Multi-Layer Gradients */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 z-10"></div>
                <div className={`absolute inset-0 bg-gradient-to-${isRTL ? 'l' : 'r'} from-black/80 via-transparent to-transparent z-10`}></div>
                
                {/* Animated Particles Effect Decoration */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-15 opacity-30">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full bg-primary/20 blur-3xl"
                      style={{
                        width: Math.random() * 400 + 200,
                        height: Math.random() * 400 + 200,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        x: [0, Math.random() * 100 - 50],
                        y: [0, Math.random() * 100 - 50],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>

                {/* Main Content Content Container */}
                <div className="relative z-20 container mx-auto h-full px-6 flex items-center">
                  <div className={`w-full max-w-5xl ${isRTL ? 'text-right' : 'text-left'}`}>
                    <AnimatePresence mode="wait">
                      {isActive && (
                        <motion.div
                          key={`content-${ad.id}`}
                          initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: isRTL ? -50 : 50 }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className="space-y-8"
                        >
                          {/* Modern Badge */}
                          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-2xl border border-white/10 px-5 py-2 rounded-full shadow-2xl">
                            <span className="flex h-2.5 w-2.5 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                            </span>
                            <span className="text-white/90 text-sm font-bold tracking-widest uppercase">
                              {isRTL ? 'عرض فيديو حصري' : 'Exclusive Video Deal'}
                            </span>
                          </div>

                          {/* Cinematic Typography */}
                          <div className="space-y-4">
                            <motion.h2 
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.8, delay: 0.4 }}
                              className="text-5xl md:text-8xl lg:text-9xl font-black text-white leading-[0.9] tracking-tighter"
                            >
                              {isRTL ? ad.titleAr : ad.titleEn}
                            </motion.h2>
                            <motion.p 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.8, delay: 0.6 }}
                              className="text-gray-300/80 text-xl md:text-2xl max-w-2xl leading-relaxed font-medium"
                            >
                              {isRTL ? ad.descriptionAr : ad.descriptionEn}
                            </motion.p>
                          </div>

                          {/* Modern CTA & Stats Group */}
                          <div className="flex flex-wrap items-center gap-8 pt-4">
                            <motion.button
                              whileHover={{ scale: 1.05, y: -5 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openDetails(ad)}
                              className="relative px-12 py-6 bg-primary text-white text-xl font-black rounded-2xl group/btn overflow-hidden shadow-[0_20px_50px_rgba(26,86,219,0.4)]"
                            >
                              <span className="relative z-10 flex items-center gap-4">
                                {isRTL ? 'إكتشف التفاصيل' : 'Discover Details'}
                                <ChevronRight className={`w-6 h-6 transition-transform duration-300 group-hover/btn:translate-x-1 ${isRTL ? 'rotate-180' : ''}`} />
                              </span>
                              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500"></div>
                            </motion.button>

                            <div className="flex items-center gap-10">
                              <div className="flex flex-col">
                                <span className="text-3xl font-black text-white tracking-tighter">{ad.views || 0}</span>
                                <span className="text-xs text-white/40 uppercase tracking-widest">{isRTL ? 'مشاهدة' : 'Views'}</span>
                              </div>
                              <div className="w-px h-10 bg-white/10"></div>
                              <div className="flex flex-col">
                                <span className="text-3xl font-black text-white tracking-tighter">{new Date(ad.createdAt).getFullYear()}</span>
                                <span className="text-xs text-white/40 uppercase tracking-widest">{isRTL ? 'سنة' : 'Year'}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </SwiperSlide>
        ))}

        {/* Cinematic Controls */}
        <div className="absolute bottom-12 right-12 z-30 flex items-center gap-4">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-500"
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2">
            <button className="hero-prev w-14 h-14 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-primary transition-all duration-500">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button className="hero-next w-14 h-14 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-primary transition-all duration-500">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </Swiper>

      {/* Glassmorphic Immersive Modal */}
      <AnimatePresence>
        {selectedAd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-10"
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" onClick={() => setSelectedAd(null)}></div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0a0a0a] w-full max-w-7xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] relative border border-white/10 z-10"
            >
              <button 
                onClick={() => setSelectedAd(null)}
                className="absolute top-8 right-8 z-50 p-4 bg-white/5 hover:bg-red-500 text-white rounded-2xl transition-all backdrop-blur-2xl border border-white/10 group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              </button>

              <div className="overflow-y-auto custom-modal-scroll h-full">
                {/* Modal Video Header */}
                <div className="relative aspect-video bg-black w-full overflow-hidden">
                  <video
                    src={getFileUrl(selectedAd.videoUrl)}
                    poster={getFileUrl(selectedAd.thumbnailUrl)}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                  />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
                </div>

                <div className={`p-8 md:p-20 ${isRTL ? 'text-right' : 'text-left'} space-y-16`}>
                  {/* Modal Header Info */}
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 border-b border-white/5 pb-16">
                    <div className="space-y-6 flex-1">
                      <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
                        {isRTL ? selectedAd.titleAr : selectedAd.titleEn}
                      </h2>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                          <Eye className="w-5 h-5 text-primary" />
                          <span className="text-lg font-bold text-gray-400">{selectedAd.views || 0} {isRTL ? 'مشاهدة' : 'Views'}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                          <Calendar className="w-5 h-5 text-primary" />
                          <span className="text-lg font-bold text-gray-400">
                            {new Date(selectedAd.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedAd.linkUrl && (
                      <motion.a
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href={selectedAd.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-4 px-12 py-6 bg-white text-black text-xl font-black rounded-3xl hover:bg-primary hover:text-white transition-all duration-500 shadow-2xl"
                      >
                        {isRTL ? 'إذهب للمتجر' : 'Go to Store'}
                        <ExternalLink className="w-6 h-6" />
                      </motion.a>
                    )}
                  </div>

                  {/* Modal Body Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-7 space-y-12">
                      <section className="space-y-6">
                        <div className="flex items-center gap-4 text-primary uppercase tracking-[0.3em] font-black text-sm">
                          <Sparkles className="w-5 h-5" />
                          {isRTL ? 'عن العرض' : 'Offer Context'}
                        </div>
                        <p className="text-gray-400 text-2xl leading-relaxed font-medium">
                          {isRTL ? selectedAd.descriptionAr : selectedAd.descriptionEn}
                        </p>
                      </section>
                    </div>

                    {(selectedAd.contentAr || selectedAd.contentEn) && (
                      <div className="lg:col-span-5">
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          className="bg-white/5 p-10 rounded-[3rem] border border-white/10 backdrop-blur-xl relative overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                          <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4">
                            <div className="w-12 h-1.5 bg-primary rounded-full"></div>
                            {isRTL ? 'المواصفات' : 'Details'}
                          </h3>
                          <div className="text-gray-300 leading-loose whitespace-pre-line text-xl font-medium">
                            {isRTL ? (selectedAd.contentAr || selectedAd.contentEn) : (selectedAd.contentEn || selectedAd.contentAr)}
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .video-hero-swiper .swiper-pagination {
          bottom: 120px !important;
          left: 60px !important;
          width: auto !important;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .modern-bullet {
          width: 4px !important;
          height: 24px !important;
          background: rgba(255,255,255,0.2) !important;
          border-radius: 4px !important;
          opacity: 1 !important;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
          margin: 0 !important;
        }
        
        .modern-bullet.swiper-pagination-bullet-active {
          height: 48px !important;
          background: #1a56db !important;
          box-shadow: 0 0 20px rgba(26,86,219,0.5);
        }

        .custom-modal-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-modal-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: #1a56db;
        }

        @media (max-width: 768px) {
          .video-hero-swiper .swiper-pagination {
            bottom: 40px !important;
            left: 50% !important;
            transform: translateX(-50%);
            flex-direction: row;
          }
          .modern-bullet {
            width: 24px !important;
            height: 4px !important;
          }
          .modern-bullet.swiper-pagination-bullet-active {
            width: 48px !important;
            height: 4px !important;
          }
        }
      `}} />
    </section>
  );
};

export default VideoAdsSection;
