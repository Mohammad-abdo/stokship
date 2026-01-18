import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Briefcase, User, Shield, Lock, UserCog } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../routes";
import { useAuth } from "../contexts/AuthContext";

export default function LoginCard() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState('Admin'); // Default role
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const roles = [
    { id: 'Trader', icon: Briefcase, label: 'Trader' },
    { id: 'Employee', icon: User, label: 'Employee' },
    { id: 'Moderator', icon: UserCog, label: 'Moderator' },
    { id: 'Admin', icon: Shield, label: 'Admin' },
  ];

  const quickLogins = {
    Admin: { email: 'admin@stokship.com', pass: 'admin123', label: 'Admin' },
    Employee: { email: 'employee@stokship.com', pass: 'employee123', label: 'Employee' },
    Moderator: { email: 'moderator1@stokship.com', pass: 'moderator123', label: 'Moderator' },
    Trader: { email: 'trader@stokship.com', pass: 'trader123', label: 'Trader' }
  };

  const handleQuickLogin = (role) => {
    setEmail(quickLogins[role].email);
    setPassword(quickLogins[role].pass);
    setSelectedRole(role);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password, false); // rememberMe false by default for now
      
      if (result.success) {
        // Handle multiple profiles if exists
        if (result.linkedProfiles && result.linkedProfiles.length > 1) {
          console.log('Multiple profiles found:', result.linkedProfiles);
        }
        
        // Navigate based on user type
        if (result.user.userType === 'TRADER') {
          navigate(ROUTES.SELLER);
        } else if (result.user.userType === 'MODERATOR') {
          navigate(ROUTES.MODERATOR_DASHBOARD);
        } else {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">نظام الإدارة</h1>
          <p className="text-gray-500">Select your role to continue</p>
        </div>

        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-right text-gray-700 mb-2 text-sm font-medium">Select Role</label>
          <div className="grid grid-cols-4 gap-2">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                    isSelected 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                  <span className="text-sm font-medium">{role.label}</span>
                </button>
              );
            })}
          </div>
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
            {loading ? "Jari..." : `تسجيل الدخول as ${selectedRole}`}
          </button>
        </form>

        {/* Quick Login */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <h3 className="text-sm font-bold text-gray-900 mb-3">:Quick Login</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div 
              onClick={() => handleQuickLogin('Admin')}
              className="cursor-pointer hover:text-blue-600 transition-colors"
            >
              Admin: {quickLogins.Admin.email} / {quickLogins.Admin.pass}
            </div>
             <div 
              onClick={() => handleQuickLogin('Employee')}
              className="cursor-pointer hover:text-blue-600 transition-colors"
            >
              Employee: {quickLogins.Employee.email} / {quickLogins.Employee.pass}
            </div>
             <div 
              onClick={() => handleQuickLogin('Moderator')}
              className="cursor-pointer hover:text-blue-600 transition-colors"
            >
              Moderator: {quickLogins.Moderator.email} / {quickLogins.Moderator.pass}
            </div>
             <div 
              onClick={() => handleQuickLogin('Trader')}
              className="cursor-pointer hover:text-blue-600 transition-colors"
            >
              Trader: {quickLogins.Trader.email} / {quickLogins.Trader.pass}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
