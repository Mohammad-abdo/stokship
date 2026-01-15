import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  return (
    <footer className={`bg-[#E0E7FF] text-[#1E3A8A] mt-16 ${isRTL ? 'rtl' : ''}`}>
      <div className="container mx-auto px-4 py-12">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 ${isRTL ? 'text-right' : 'text-left'}`}>
          {/* Column 1: Contact Us */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-[#1E3A8A]">
              {language === "ar" ? "اتصل بنا" : "Contact Us"}
            </h4>
            <ul className="space-y-2 text-[#1E3A8A] text-sm">
              <li>
                {language === "ar" 
                  ? "العنوان: 502 شارع التصميم الجديد. ميلبورن، سان فرانسيسكو، CA 94110، الولايات المتحدة" 
                  : "Address: 502 New Design Street, Melbourne, San Francisco, CA 94110, United States"}
              </li>
              <li>
                {language === "ar" 
                  ? "الهاتف: (+01) 123-456-789" 
                  : "Phone: (+01) 123-456-789"}
              </li>
              <li>
                {language === "ar" 
                  ? "البريد الإلكتروني: contact@ecom market.com" 
                  : "Email: contact@ecom market.com"}
              </li>
              <li>
                {language === "ar" 
                  ? "ساعات العمل: من 8:00 صباحًا إلى 5:00 مساءً من الاثنين إلى السبت" 
                  : "Working hours: From 8:00 AM to 5:00 PM, Monday to Saturday"}
              </li>
            </ul>
            {/* Social Media Icons */}
            <div className={`flex gap-3 mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <a
                href="#"
                className="w-10 h-10 bg-[#1E3A8A] rounded-full flex items-center justify-center hover:bg-[#1E40AF] transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#1E3A8A] rounded-full flex items-center justify-center hover:bg-[#1E40AF] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#1E3A8A] rounded-full flex items-center justify-center hover:bg-[#1E40AF] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#1E3A8A] rounded-full flex items-center justify-center hover:bg-[#1E40AF] transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          {/* Column 2: Company */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-[#1E3A8A]">
              {language === "ar" ? "الشركة" : "Company"}
            </h4>
            <ul className="space-y-2">
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/about"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "عنا" : "About Us"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/shipping"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "معلومات التوصيل" : "Delivery Information"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/privacy"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/terms"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "الشروط والأحكام" : "Terms & Conditions"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/contact"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "اتصل بنا" : "Contact Us"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/support"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "مركز الدعم" : "Support Center"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/careers"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "الوظائف" : "Jobs"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Categories */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-[#1E3A8A]">
              {language === "ar" ? "الفئات" : "Categories"}
            </h4>
            <ul className="space-y-2">
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/about"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "عنا" : "About Us"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/shipping"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "معلومات التوصيل" : "Delivery Information"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/privacy"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/terms"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "الشروط والأحكام" : "Terms & Conditions"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/contact"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "اتصل بنا" : "Contact Us"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/support"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "مركز الدعم" : "Support Center"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/careers"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "الوظائف" : "Jobs"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: My Account */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-[#1E3A8A]">
              {language === "ar" ? "حسابي" : "My Account"}
            </h4>
            <ul className="space-y-2">
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/profile"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "حسابي" : "My Account"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/returns"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "مركز الإرجاع" : "Return Center"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/orders"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "المشتريات والطلبات" : "Purchases & Orders"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/support-tickets"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "تذاكر الدعم" : "Support Tickets"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/track-order"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "تتبع الطلب" : "Track Order"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/support"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "مركز الدعم" : "Support Center"}
                </Link>
              </li>
              <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#1E3A8A] text-xs">▶</span>
                <Link
                  to="/frontend/payment"
                  className="text-[#1E3A8A] hover:text-yellow-500 transition-colors text-sm"
                >
                  {language === "ar" ? "طريقة الدفع" : "Payment Method"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Brand Information and Payment Gateways */}
          <div>
            {/* STOCKSHIP Logo */}
            <div className="mb-4">
              <div className="flex items-center gap-1">
                <span className="text-3xl font-bold text-[#1E3A8A]">STOCK</span>
                <div className="relative inline-flex items-center">
                  <span className="text-3xl font-bold text-yellow-500">SHIP</span>
                  <ArrowUpRight className="absolute -top-2 -right-4 w-6 h-6 text-yellow-500 stroke-[3]" />
                </div>
              </div>
              <p className="text-yellow-500 text-xs mt-1 font-medium">
                A LINK WE BUILD
              </p>
            </div>

            {/* Description */}
            <p className="text-[#1E3A8A] text-sm mb-6 leading-relaxed">
              {language === "ar" 
                ? "هي المنصة الرائدة للوساطة التجارية بين المصانع والتجار، حيث يمكنك عرض بضائعك بالجملة التفاوض مباشرة مع المشترين، وإتمام الصفقات بأمان وسهولة، مع ضمان متابعة الشحن وحماية المدفوعات في كل خطوة"
                : "It is the leading platform for commercial brokerage between factories and traders, where you can display your wholesale goods, negotiate directly with buyers, and complete deals safely and easily, with guaranteed shipping tracking and payment protection at every step"}
            </p>

            {/* Payment Gateways Heading */}
            <h5 className="font-bold text-sm mb-3 text-[#1E3A8A]">
              {language === "ar" ? "بوابات الدفع الآمنة" : "Secure Payment Gateways"}
            </h5>

            {/* Payment Method Logos */}
            <div className={`flex flex-wrap gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="bg-white px-4 py-2 rounded border border-gray-200 shadow-sm">
                <span className="text-[#1E3A8A] font-bold text-sm">VISA</span>
              </div>
              <div className="bg-white px-4 py-2 rounded border border-gray-200 shadow-sm">
                <span className="text-[#1E3A8A] font-bold text-sm">MasterCard</span>
              </div>
              <div className="bg-white px-4 py-2 rounded border border-gray-200 shadow-sm">
                <span className="text-[#1E3A8A] font-bold text-sm">Maestro</span>
              </div>
              <div className="bg-white px-4 py-2 rounded border border-gray-200 shadow-sm">
                <span className="text-[#1E3A8A] font-bold text-sm">American Express</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#B8C5FF] mt-8 pt-8 text-center">
          <p className="text-[#1E3A8A] text-sm">
            {language === "ar" 
              ? "حقوق الطبع والنشر © 2025 Stocksip جميع الحقوق محفوظة." 
              : "Copyright © 2025 Stocksip All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
