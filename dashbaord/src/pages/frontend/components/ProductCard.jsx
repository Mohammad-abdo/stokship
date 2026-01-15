import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const ProductCard = ({ product }) => {
  const { language } = useLanguage();
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  const displayName = language === "ar" ? product.nameAr || product.nameEn : product.nameEn || product.nameAr;
  const displayPrice = product.price || product.minPrice || "0.00";
  const rawImageUrl = product.images?.[0]?.imageUrl || product.imgUrl || "";
  
  // Filter out placeholder URLs and invalid URLs
  const isValidImageUrl = rawImageUrl && 
    !rawImageUrl.includes('via.placeholder.com') && 
    !rawImageUrl.includes('placeholder') &&
    (rawImageUrl.startsWith('http://') || rawImageUrl.startsWith('https://') || rawImageUrl.startsWith('/'));
  
  const imageUrl = isValidImageUrl ? rawImageUrl : "";
  const rating = product.rating || 5;
  const reviewCount = product.reviewCount || 65;
  
  // Get category name
  const categoryName = product.category 
    ? (language === "ar" ? product.category.nameAr || product.category.nameEn : product.category.nameEn || product.category.nameAr)
    : (language === "ar" ? "هواتف ذكية" : "Smartphones");
  
  // Set image error if URL is invalid
  useEffect(() => {
    if (!isValidImageUrl) {
      setImageError(true);
    } else {
      setImageError(false);
    }
  }, [isValidImageUrl]);

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // TODO: Add to wishlist API call
  };

  return (
    <Link
      to={`/frontend/products/${product.id}`}
      className="group bg-white border border-gray-200 rounded-lg overflow-hidden relative block"
    >
      {/* Product Image Section */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {imageError || !imageUrl ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
            <span className="text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {language === "ar" ? "لا توجد صورة" : "No Image"}
            </span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setImageError(true);
            }}
            onLoad={() => {
              // Reset error state if image loads successfully
              if (imageError) {
                setImageError(false);
              }
            }}
          />
        )}
        
        {/* FOR SALE Badge - White block with red text on the right */}
        <div className="absolute top-4 right-4 bg-white px-3 py-2 flex items-center justify-center">
          <span className="text-red-600 font-bold text-sm uppercase" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            FOR SALE
          </span>
        </div>
      </div>

      {/* Product Info Section */}
      <div className="p-4">
        {/* Flag and Category - Left aligned */}
        <div className="flex items-center gap-2 mb-2">
          {/* China Flag - Red background with yellow stars (simplified) */}
          <div className="w-6 h-4 bg-red-600 relative border border-gray-300 flex-shrink-0">
            {/* Large star in top-left */}
            <div className="absolute top-0.5 left-1 text-yellow-400 text-[6px] leading-none">★</div>
            {/* Small stars arranged in arc */}
            <div className="absolute top-1 left-2.5 text-yellow-400 text-[4px] leading-none">★</div>
            <div className="absolute top-1.5 left-3.5 text-yellow-400 text-[4px] leading-none">★</div>
            <div className="absolute top-1.5 left-2 text-yellow-400 text-[4px] leading-none">★</div>
            <div className="absolute top-2 left-3 text-yellow-400 text-[4px] leading-none">★</div>
          </div>
          <span className="text-sm text-gray-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {categoryName}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-gray-900 mb-2 text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          {language === "ar" ? `هاتف ${displayName}` : `${displayName} Phone`}
        </h3>
        
        {/* Rating with Review Count */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            ({reviewCount})
          </span>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-4 h-4 fill-yellow-400 text-yellow-400"
              />
            ))}
          </div>
        </div>

        {/* Placeholder Description Text */}
        <div className="mb-4">
          <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {language === "ar" ? "لوريم إيبسوم دولار سيت أم" : "Lorem Ipsum Dollar Set Am"}
          </p>
        </div>

        {/* Action Buttons - Heart on left, View Details on right */}
        <div className="flex items-center justify-between gap-3">
          {/* Heart Icon - Left */}
          <button
            onClick={handleFavorite}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
          </button>

          {/* View Details Button - Right with blue border */}
          <button
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/frontend/products/${product.id}`;
            }}
            className="flex-1 border-2 border-blue-500 bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg transition-colors hover:bg-blue-50 text-sm"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            {language === "ar" ? "عرض التفاصيل" : "View Details"}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
