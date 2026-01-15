import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { frontendApi } from "@/lib/frontendApi";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import { ChevronRight, Store, Shield, MessageSquare, ThumbsUp, Award, Truck, ShoppingBag, ArrowRight } from "lucide-react";

const HomePage = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [topRated, setTopRated] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [smartphones, setSmartphones] = useState([]);
  const [clothing, setClothing] = useState([]);
  const [popularCategories, setPopularCategories] = useState([]);
  const [businessServices, setBusinessServices] = useState([]);

  const isRTL = language === "ar";

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const fetchHomepageData = async () => {
    try {
      setLoading(true);
      
      // Helper function to safely fetch with error handling
      const safeFetch = async (apiCall, fallback = []) => {
        try {
          const response = await apiCall();
          return response.data?.data || response.data || fallback;
        } catch (error) {
          if (error.response?.status === 429) {
            console.warn("Rate limit reached, using fallback data");
          } else {
            console.error("API error:", error);
          }
          return fallback;
        }
      };

      // Fetch data sequentially with delays to avoid rate limiting
      // First batch: essential data
      const [categoriesRes, allProductsRes] = await Promise.all([
        safeFetch(() => frontendApi.getPopularCategories({ limit: 20 }), []),
        safeFetch(() => frontendApi.getProducts({ limit: 30 }), [])
      ]);

      setPopularCategories(categoriesRes);
      const allProducts = allProductsRes;

      // Add delay between batches
      await new Promise(resolve => setTimeout(resolve, 300));

      // Second batch: product sections
      const [topRatedRes, bestSellersRes, recentlyAddedRes] = await Promise.all([
        safeFetch(() => frontendApi.getTopRated({ limit: 10 }), []),
        safeFetch(() => frontendApi.getBestSellers({ limit: 10 }), []),
        safeFetch(() => frontendApi.getRecentlyAdded({ limit: 10 }), [])
      ]);

      setTopRated(topRatedRes);
      setBestSellers(bestSellersRes);
      setRecentlyAdded(recentlyAddedRes);

      // Find categories
      const smartphonesCategory = categoriesRes.find(cat => 
        (cat.nameEn?.toLowerCase().includes('smartphone') || 
         cat.nameEn?.toLowerCase().includes('phone') ||
         cat.nameAr?.includes('هاتف') ||
         cat.nameAr?.includes('ذكي'))
      );
      
      const clothingCategory = categoriesRes.find(cat => 
        (cat.nameEn?.toLowerCase().includes('clothing') || 
         cat.nameEn?.toLowerCase().includes('apparel') ||
         cat.nameAr?.includes('ملابس') ||
         cat.nameAr?.includes('أزياء'))
      );

      // Filter products by category
      if (smartphonesCategory && allProducts.length > 0) {
        const smartphonesProducts = allProducts.filter(p => 
          p.categoryId === smartphonesCategory.id || 
          p.category?.id === smartphonesCategory.id
        );
        setSmartphones(smartphonesProducts.slice(0, 10));
      } else {
        setSmartphones(topRatedRes.slice(0, 10));
      }

      if (clothingCategory && allProducts.length > 0) {
        const clothingProducts = allProducts.filter(p => 
          p.categoryId === clothingCategory.id || 
          p.category?.id === clothingCategory.id
        );
        setClothing(clothingProducts.slice(0, 10));
      } else {
        setClothing(bestSellersRes.slice(0, 10));
      }

      // Set default business services
      setBusinessServices([
        {
          id: 1,
          title: language === "ar" ? "الأمان" : "Security",
          description: language === "ar" ? "التأكد من هوية المورد و المستورد" : "Verify supplier and importer identity",
          icon: Shield,
          color: "yellow"
        },
        {
          id: 2,
          title: language === "ar" ? "خدماتنا التجارية" : "Our Commercial Services",
          description: language === "ar" ? "عرض مختلف البضائع في جميع الفئات" : "Display various goods in all categories",
          icon: Store,
          color: "blue"
        },
        {
          id: 3,
          title: language === "ar" ? "التواصل" : "Communication",
          description: language === "ar" ? "سرعة التواصل و مراقبة المحادثات" : "Fast communication and chat monitoring",
          icon: MessageSquare,
          color: "yellow"
        }
      ]);
    } catch (error) {
      console.error("Error fetching homepage data:", error);
      // Set default empty arrays to prevent crashes
      setTopRated([]);
      setBestSellers([]);
      setRecentlyAdded([]);
      setSmartphones([]);
      setClothing([]);
      setPopularCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const renderProductSection = (title, products, link) => {
    if (!products || products.length === 0) return null;

    return (
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4 md:px-20">
          <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1E3A8A]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {title}
            </h2>
            {link && (
              <Link
                to={link}
                className="flex items-center gap-2 text-[#1E3A8A] hover:text-blue-600 transition-colors"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <span>{language === "ar" ? "عرض الكل" : "View All"}</span>
                <ChevronRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
            <p className="text-[#1E3A8A]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {language === "ar" ? "جاري التحميل..." : "Loading..."}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir={isRTL ? "rtl" : "ltr"}>
      <Header />

      {/* Top Section - Grid Layout: Top Rated, Best Sellers, Banner, Categories */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4 md:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Top Rated & Best Sellers (Small Boxes) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Top Rated Products Box */}
              <div className="bg-gradient-to-br from-[#1E3A8A] to-blue-700 rounded-lg p-6 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <ThumbsUp className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {language === "ar" ? "أعلى مرتبة بضائع" : "Top Rated Products"}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-400 text-sm">★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <Link
                  to="/frontend/products?sort=rating"
                  className="flex items-center gap-2 text-white hover:text-yellow-300 transition-colors text-sm font-semibold"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <span>{language === "ar" ? "تصفح" : "Browse"}</span>
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
              </div>

              {/* Best Sellers Box */}
              <div className="bg-gradient-to-br from-[#F5AF00] to-yellow-500 rounded-lg p-6 text-[#1E3A8A]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {language === "ar" ? "أفضل البائعين" : "Best Sellers"}
                    </h3>
                    <div className="mt-1">
                      <span className="bg-[#1E3A8A] text-white px-2 py-1 rounded text-xs font-bold">
                        BEST SELLER
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  to="/frontend/products?sort=sales"
                  className="flex items-center gap-2 text-[#1E3A8A] hover:text-blue-700 transition-colors text-sm font-semibold"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <span>{language === "ar" ? "تصفح" : "Browse"}</span>
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
              </div>
            </div>

            {/* Center Column - Large Promotional Banner */}
            <div className="lg:col-span-6">
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-8 text-white h-full flex flex-col justify-between relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
                </div>
                
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {language === "ar" ? "كل ما تحتاجه لموسم العودة للمدارس" : "Everything you need for the Back to School season"}
                  </h2>
                  <p className="text-purple-100 mb-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {language === "ar" ? "اكتشف مجموعتنا الواسعة من المنتجات" : "Discover our wide range of products"}
                  </p>
                  <div className="flex items-center gap-4">
                    <Link
                      to="/frontend/products?category=school"
                      className="bg-white text-purple-700 font-bold px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors inline-flex items-center gap-2"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      <span>{language === "ar" ? "تصفح" : "Browse"}</span>
                      <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                    </Link>
                    <div className="bg-white/20 px-4 py-2 rounded-lg">
                      <span className="text-2xl font-bold">299</span>
                      <span className="text-sm ml-1">{language === "ar" ? "ريال" : "SAR"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Categories Sidebar */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
                <h4 className="font-bold text-[#1E3A8A] mb-4 text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {language === "ar" ? "الفئات" : "Categories"}
                </h4>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {popularCategories.slice(0, 15).map((category) => (
                    <Link
                      key={category.id}
                      to={`/frontend/categories/${category.id}`}
                      className="block py-2 px-3 rounded hover:bg-[#E0E7FF] transition-colors text-gray-700 hover:text-[#1E3A8A] text-sm"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      {language === "ar" ? category.nameAr || category.nameEn : category.nameEn || category.nameAr}
                    </Link>
                  ))}
                  <Link
                    to="/frontend/categories"
                    className="block py-2 px-3 rounded hover:bg-[#E0E7FF] transition-colors text-[#1E3A8A] font-semibold text-sm border-t border-gray-200 mt-2 pt-4"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    {language === "ar" ? "المزيد من الفئات" : "More Categories"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rotating Banner Section */}
      <section className="py-8 bg-gradient-to-r from-purple-600 to-purple-800">
        <div className="container mx-auto px-4 md:px-20">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {language === "ar" ? "منتجات جديدة مع توصيل سريع!" : "New products with fast delivery!"}
                </h2>
                <p className="text-purple-100 mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {language === "ar" ? "اكتشف أحدث مجموعاتنا من اليوم!" : "Discover our latest collections today!"}
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <Link
                    to="/frontend/products?new=true"
                    className="bg-white text-purple-700 font-bold px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors inline-flex items-center gap-2"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <span>{language === "ar" ? "تسوق الآن" : "Shop Now"}</span>
                  </Link>
                  <Link
                    to="/frontend/products?fast-delivery=true"
                    className="bg-purple-500 text-white font-bold px-6 py-3 rounded-lg hover:bg-purple-400 transition-colors inline-flex items-center gap-2"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <Truck className="w-5 h-5" />
                    <span>{language === "ar" ? "توصيل سريع" : "Fast Delivery"}</span>
                  </Link>
                </div>
              </div>
              {/* Carousel Dots */}
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smartphones Section */}
      {renderProductSection(
        language === "ar" ? "الهواتف الذكية" : "Smartphones",
        smartphones,
        "/frontend/products?category=smartphones"
      )}

      {/* Clothing Section */}
      {renderProductSection(
        language === "ar" ? "الملابس" : "Clothing",
        clothing,
        "/frontend/products?category=clothing"
      )}

      {/* Recommended Products Section */}
      {renderProductSection(
        language === "ar" ? "بضائع موصى بها" : "Recommended Products",
        recentlyAdded,
        "/frontend/products?sort=recent"
      )}

      {/* Commercial Services Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 md:px-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {businessServices.map((service) => {
              const Icon = service.icon || Store;
              const iconBg = service.color === "yellow" ? "bg-[#F5AF00]" : "bg-[#1E3A8A]";
              return (
                <div
                  key={service.id}
                  className="bg-[#E0E7FF] rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`${iconBg} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1E3A8A]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {service.title}
                    </h3>
                  </div>
                  <p className="text-gray-700 mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {service.description}
                  </p>
                  <Link
                    to="/frontend/services"
                    className="text-[#1E3A8A] hover:text-blue-600 font-semibold text-sm inline-flex items-center gap-1"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <span>{language === "ar" ? "المزيد" : "More"}</span>
                    <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Join Us Banner */}
      <section className="py-12 bg-gradient-to-r from-[#1E3A8A] to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <ShoppingBag className="w-96 h-96 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white" />
        </div>
        <div className="container mx-auto px-4 md:px-20 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {language === "ar" ? "هل أنت تاجر أو مصنع؟ انضم لستوك الآن!" : "Are you a merchant or a manufacturer? Join Stock now!"}
          </h2>
          <p className="text-blue-100 mb-6 max-w-3xl mx-auto text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {language === "ar"
              ? "ابدأ بيع بضائعك بالجملة ووصل إلى شبكة واسعة من التجار بسهولة وأمان مع ستوك، تقدر تتفاوض مباشرة مع المشترين ونضمن لك حماية كاملة لكل صفقة."
              : "Start selling your goods wholesale and reach a wide network of merchants easily and securely with Stock. You can negotiate directly with buyers, and we guarantee full protection for every deal."}
          </p>
          <Link
            to="/frontend/vendor/register"
            className="inline-block bg-[#F5AF00] text-[#1E3A8A] font-bold px-8 py-4 rounded-lg hover:bg-[#e5a000] transition-colors text-lg"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            {language === "ar" ? "انضم لنا" : "Join Us"}
          </Link>
        </div>
      </section>

      {/* Popular Products Tags Section */}
      {popularCategories.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 md:px-20">
            <h2 className="text-3xl font-bold text-[#1E3A8A] mb-8 text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {language === "ar" ? "البضائع الشائعة" : "Popular Products"}
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {popularCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/frontend/categories/${category.id}`}
                  className="bg-white border-2 border-[#1E3A8A] text-[#1E3A8A] font-semibold px-6 py-3 rounded-lg hover:bg-[#1E3A8A] hover:text-white transition-colors text-sm"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  {language === "ar" ? category.nameAr || category.nameEn : category.nameEn || category.nameAr}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default HomePage;
