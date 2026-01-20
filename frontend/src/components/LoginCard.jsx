import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../routes";
import { useAuth } from "../contexts/AuthContext";

export default function LoginCard() {
  const { t, i18n } = useTranslation();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Attempt login
      const result = await login(email, password, false);
      
        if (result.success) {
        // Enforce Client Only
        const rawUserType = result.user?.userType || result.user?.role || '';
        const userType = rawUserType.toUpperCase();
        
        if (userType !== 'CLIENT' && userType !== 'USER' && userType !== 'TRADER') {
           // If user is not CLIENT/TRADER, deny access and logout
           await logout();
           setError(`Access denied. This login is for Clients and Traders only. (Role: ${userType})`);
           setLoading(false);
           return;
        }

        // Handle linked profiles if needed (e.g. check for Trader/Seller profile)
        if (result.linkedProfiles && result.linkedProfiles.length > 1) {
          console.log('Multiple profiles found:', result.linkedProfiles);
        }
        
        // Navigate based on role
        if (userType === 'TRADER') {
          // Navigate to internal Trader Dashboard
          navigate(ROUTES.TRADER_DASHBOARD);
        } else {
          // Clients go to Home
          navigate(ROUTES.HOME);
        }
        
      } else {
        setError(result.message || t("auth.loginFailed"));
      }
    } catch (err) {
      setError(t("auth.loginFailed"));
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">تسجيل الدخول</h1>
          <p className="text-gray-500">Enter your credentials to access your account</p>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 text-center">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-blue-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 px-4 py-3 text-left pl-10 transition-colors"
                placeholder="name@example.com"
                required
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">✉️</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-blue-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 px-4 py-3 text-left pl-10 transition-colors"
                placeholder="••••••••"
                required
              />
               <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                   <Lock className="w-4 h-4" />
                </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition hover:-translate-y-0.5"
          >
            {loading ? "Jari..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Don't have an account?{' '}
            <Link to={ROUTES.SIGNUP} className="font-semibold text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
