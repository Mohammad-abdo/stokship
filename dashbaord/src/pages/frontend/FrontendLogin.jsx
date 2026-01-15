import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export default function FrontendLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      const user = JSON.parse(localStorage.getItem("auth_user"));
      const userType = user.userType || user.role;

      // Frontend only allows USER and VENDOR roles
      // Redirect ADMIN users to admin login
      if (userType === "ADMIN" || userType === "admin" || 
          (user.role_names && Array.isArray(user.role_names) && 
           (user.role_names.includes("ADMIN") || user.role_names.includes("admin")))) {
        // Admin should use admin login page
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setError(language === "ar" 
          ? "هذه الصفحة للعملاء والبائعين فقط. يرجى استخدام صفحة تسجيل دخول الأدمن." 
          : "This page is for customers and vendors only. Please use the admin login page.");
        setLoading(false);
        return;
      }

      // Redirect VENDOR to vendor dashboard
      if (userType === "VENDOR" || userType === "vendor" || 
          (user.role_names && Array.isArray(user.role_names) && 
           (user.role_names.includes("VENDOR") || user.role_names.includes("vendor")))) {
        navigate("/stockship/vendor/dashboard");
      } 
      // Redirect USER to frontend home
      else if (userType === "USER" || userType === "user" || 
               (user.role_names && Array.isArray(user.role_names) && 
                (user.role_names.includes("USER") || user.role_names.includes("user")))) {
        navigate("/frontend");
      } 
      // Default to frontend
      else {
        navigate("/frontend");
      }
    } catch (err) {
      if (err.response?.status === 429) {
        const retryAfter = err.response.headers['retry-after'] || 15;
        setError(language === "ar" 
          ? `محاولات تسجيل دخول كثيرة جداً. يرجى الانتظار ${retryAfter} ثانية قبل المحاولة مرة أخرى.`
          : `Too many login attempts. Please wait ${retryAfter} seconds before trying again.`);
      } else {
        setError(err.response?.data?.message || err.message || 
          (language === "ar" ? "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى." : "Login failed. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  const isRTL = language === "ar";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-1 text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#1E3A8A]/60 flex items-center justify-center"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  d="M6 10C6 9.44772 6.44772 9 7 9H9C9.55228 9 10 9.44772 10 10V14C10 14.5523 9.55228 15 9 15H7C6.44772 15 6 14.5523 6 14V10Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M10 10C10 9.44772 10.4477 9 11 9H13C13.5523 9 14 9.44772 14 10V14C14 14.5523 13.5523 15 13 15H11C10.4477 15 10 14.5523 10 14V10Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M14 10C14 9.44772 14.4477 9 15 9H17C17.5523 9 18 9.44772 18 10V14C18 14.5523 17.5523 15 17 15H15C14.4477 15 14 14.5523 14 14V10Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <line
                  x1="12"
                  y1="10"
                  x2="12"
                  y2="14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#1E3A8A] to-[#1E3A8A]/60 bg-clip-text text-transparent">
              {language === "ar" ? "تسجيل الدخول" : "Login"}
            </CardTitle>
            <CardDescription className="text-lg">
              {language === "ar" ? "مرحباً بك في STOCKSHIP" : "Welcome to STOCKSHIP"}
            </CardDescription>
            <p className="text-sm text-muted-foreground mt-2">
              {language === "ar" ? "سجل دخولك للوصول إلى حسابك" : "Sign in to access your account"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <label htmlFor="email" className="text-sm font-medium">
                  {language === "ar" ? "البريد الإلكتروني" : "Email"}
                </label>
                <div className="relative">
                  <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5`} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all`}
                    placeholder={language === "ar" ? "البريد الإلكتروني" : "email@example.com"}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <label htmlFor="password" className="text-sm font-medium">
                  {language === "ar" ? "كلمة المرور" : "Password"}
                </label>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5`} />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all`}
                    placeholder={language === "ar" ? "كلمة المرور" : "Password"}
                  />
                </div>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[#1E3A8A] text-white font-semibold hover:bg-[#1E3A8A]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {language === "ar" ? "جاري تسجيل الدخول..." : "Signing in..."}
                  </>
                ) : (
                  language === "ar" ? "تسجيل الدخول" : "Sign In"
                )}
              </motion.button>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-center space-y-2"
            >
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
                <Link to="/frontend/register" className="text-[#1E3A8A] hover:underline font-semibold">
                  {language === "ar" ? "سجل الآن" : "Sign up"}
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "تريد أن تصبح بائعاً؟" : "Want to become a vendor?"}{" "}
                <Link to="/frontend/vendor/register" className="text-[#F5AF00] hover:underline font-semibold">
                  {language === "ar" ? "سجل كبائع" : "Register as vendor"}
                </Link>
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

