import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, Menu, X, ChevronDown, Package, Camera, Bed, Lamp, Smartphone, Shirt, Footprints, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import LanguageToggle from "@/components/LanguageToggle";
import { frontendApi } from "@/lib/frontendApi";
import { useEffect } from "react";

const Header = () => {
  const { t, language } = useLanguage();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesMenuOpen, setCategoriesMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  // Don't show header for admin users - they should use admin dashboard
  if (isAdmin) {
    return null;
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await frontendApi.getCategories({ limit: 10 });
      setCategories(response.data?.data || response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/frontend/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/frontend");
  };

  // Category order: Furniture, Decorations, Electronics, Shoes, Clothing (as per Figma)
  const mainCategories = [
    { name: language === "ar" ? "مفروشات" : "Furniture", icon: Bed, link: "/frontend/products?category=furniture" },
    { name: language === "ar" ? "ديكورات" : "Decorations", icon: Lamp, link: "/frontend/products?category=decorations" },
    { name: language === "ar" ? "إلكترونيات" : "Electronics", icon: Smartphone, link: "/frontend/products?category=electronics" },
    { name: language === "ar" ? "أحذية" : "Shoes", icon: Footprints, link: "/frontend/products?category=shoes" },
    { name: language === "ar" ? "ملابس" : "Clothing", icon: Shirt, link: "/frontend/products?category=clothing" },
  ];

  const isRTL = language === "ar";

  return (
    <>
      {/* Top Header Bar - Dark Blue #1E3A8A */}
      <header className={`text-white sticky top-0 z-50 ${isRTL ? 'rtl' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif', backgroundColor: '#1E3A8A' }}>
        <div className="container mx-auto px-4 md:px-20">
          <div className={`flex items-center justify-between h-24 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Logo - Right side (RTL: Left side) with STOCKSHIP logo image */}
            <Link to="/frontend" className={`flex flex-col items-end ${isRTL ? 'items-start' : 'items-end'}`}>
              <img 
                src="/images/logo-1.png" 
                alt="STOCKSHIP" 
                className="h-12 md:h-16 object-contain"
              />
            </Link>

            {/* Search Bar - Center */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-[722px] mx-8">
              <div className={`relative w-full flex items-center bg-white border border-[#a3a3a3] rounded-[5px] overflow-hidden h-[52px] ${isRTL ? 'flex-row-reverse' : ''}`}>
                {/* Search Button - Left side (RTL: Right side) */}
                <button
                  type="submit"
                  className="px-4 py-2 text-[#1E3A8A] font-bold hover:text-[#1E3A8A] transition-colors text-sm"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  {language === "ar" ? "بحث" : "Search"}
                </button>
                
                {/* Search Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === "ar" ? "ابحث..." : "Search..."}
                  className="flex-1 px-4 py-2 text-gray-900 focus:outline-none"
                />
                
                {/* Camera Icon - Right side (RTL: Left side) */}
                <button
                  type="button"
                  className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Action Buttons - Left side (RTL: Right side) */}
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {!user ? (
                <>
                  <Link
                    to="/frontend/vendor/register"
                    className="px-6 py-2 bg-[#F5AF00] text-[#1E3A8A] font-bold rounded-[5px] hover:bg-[#e5a000] transition-colors text-sm whitespace-nowrap"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    {language === "ar" ? "كن بائعاً" : "Become a Seller"}
                  </Link>
                  <Link
                    to="/frontend/login"
                    className="px-6 py-2 bg-white text-[#1E3A8A] font-bold rounded-[5px] hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    {language === "ar" ? "تسجيل دخول" : "Login"}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/frontend/cart"
                    className="relative p-2 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Package className="w-6 h-6" />
                  </Link>
                  <button className="relative p-2 hover:bg-blue-700 rounded-lg transition-colors hidden md:block">
                    <Bell className="w-6 h-6" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      3
                    </span>
                  </button>
                  <div className="relative group">
                    <button className="flex items-center space-x-2 p-2 hover:bg-blue-700 rounded-lg transition-colors">
                      <Package className="w-6 h-6" />
                      <span className="hidden md:block">{user.name || user.email}</span>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <Link
                        to="/frontend/profile"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-t-lg"
                      >
                        {language === "ar" ? "الملف الشخصي" : "Profile"}
                      </Link>
                      <Link
                        to="/frontend/orders"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                      >
                        {language === "ar" ? "طلباتي" : "My Orders"}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-b-lg"
                      >
                        {language === "ar" ? "تسجيل الخروج" : "Logout"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
              <form onSubmit={handleSearch} className="mb-4">
                <div className={`relative flex items-center bg-white border border-[#a3a3a3] rounded-[5px] overflow-hidden h-[52px] ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    type="submit"
                    className="px-4 py-2 text-[#1E3A8A] font-bold hover:text-[#1E3A8A] transition-colors text-sm"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    {language === "ar" ? "بحث" : "Search"}
                  </button>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === "ar" ? "ابحث..." : "Search..."}
                    className="flex-1 px-4 py-2 text-gray-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="p-3 text-gray-400"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Bar - Light Blue/Grey #E0E7FF */}
      <nav className={`border-b border-gray-200 sticky top-24 z-40 ${isRTL ? 'rtl' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif', backgroundColor: '#E0E7FF' }}>
        <div className="container mx-auto px-4 md:px-20">
          {/* Main Navigation Row */}
          <div className={`flex items-center justify-between h-[92px] ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Right Side (RTL: Left Side) - My Orders, Notifications */}
            <div className={`flex items-center gap-[10px] ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Link
                to="/frontend/orders"
                className="flex flex-col gap-1 items-center justify-center h-[60px] w-[80px] text-[#1E3A8A] hover:text-blue-600 transition-colors"
              >
                <Package className="w-6 h-6" />
                <span className="text-xs font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {language === "ar" ? "طلباتي" : "My Orders"}
                </span>
              </Link>
              
              {/* Vertical Separator */}
              <div className="h-[60px] w-px bg-[#CED3D9]" />
              
              <button className="relative flex flex-col gap-1 items-center justify-center h-[60px] w-[80px] text-[#1E3A8A] hover:text-blue-600 transition-colors">
                <Bell className="w-6 h-6" />
                <span className="text-xs font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {language === "ar" ? "الإشعارات" : "Notifications"}
                </span>
                <span className="absolute -top-1 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </button>
            </div>

            {/* Center - Category Links with Icons and Vertical Separators */}
            <div className="hidden lg:flex items-center gap-5 flex-1 justify-center">
              {mainCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <div key={index} className="flex items-center">
                    <Link
                      to={category.link}
                      className="flex items-center gap-2 px-2 text-[#1E3A8A] hover:text-blue-600 transition-colors group"
                      style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '16px', lineHeight: '20px' }}
                    >
                      <ChevronDown className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>{category.name}</span>
                      <Icon className="w-6 h-6" />
                    </Link>
                    {index < mainCategories.length - 1 && (
                      <div className="h-6 w-px bg-[#CED3D9] mx-2" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Left Side (RTL: Right Side) - All Categories, Language Selector, Vertical Separator */}
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {/* All Categories with Hamburger Menu */}
              <div className="relative group">
                <button
                  className="flex items-center gap-2 px-2 text-[#1E3A8A] hover:text-blue-600 transition-colors"
                  onMouseEnter={() => setCategoriesMenuOpen(true)}
                  onMouseLeave={() => setCategoriesMenuOpen(false)}
                  style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '16px', lineHeight: '20px' }}
                >
                  <Menu className="w-6 h-6" />
                  <span>{language === "ar" ? "جميع الفئات" : "All Categories"}</span>
                  <ChevronDown className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                
                {/* Categories Dropdown Menu */}
                {(categoriesMenuOpen || mobileMenuOpen) && (
                  <div
                    className={`absolute top-full ${isRTL ? 'right-0' : 'left-0'} mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50`}
                    onMouseEnter={() => setCategoriesMenuOpen(true)}
                    onMouseLeave={() => setCategoriesMenuOpen(false)}
                  >
                    {categories.slice(0, 10).map((category) => (
                      <Link
                        key={category.id}
                        to={`/frontend/categories/${category.id}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        {language === "ar" 
                          ? category.nameAr || category.nameEn 
                          : category.nameEn || category.nameAr}
                      </Link>
                    ))}
                    <Link
                      to="/frontend/categories"
                      className="block px-4 py-2 text-sm text-blue-600 font-semibold hover:bg-blue-50 border-t border-gray-200 mt-2"
                    >
                      {language === "ar" ? "عرض جميع الفئات" : "View All Categories"}
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Vertical Separator */}
              <div className="h-[60px] w-px bg-[#CED3D9]" />
              
              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[#1E3A8A] font-medium text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {language === "ar" ? "اللغة" : "Language"}
                </span>
                <ChevronDown className="w-4 h-4 text-[#1E3A8A]" />
                <LanguageToggle />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
