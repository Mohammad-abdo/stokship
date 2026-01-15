import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import logo from "../assets/imgs/Group20.png";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../routes";
import { useAuth } from "../contexts/AuthContext";

export default function LoginCard() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Form */}
          <div dir={currentDir} className="p-6 sm:p-10">
            <div className="w-full">
              <h1 className={`text-xl font-bold text-slate-900 w-full ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                {t("auth.welcomeBack")}
              </h1>
              
              <form
                className="mt-6 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError("");
                  setLoading(true);

                  try {
                    const result = await login(email, password, rememberMe);
                    
                    if (result.success) {
                      // Handle multiple profiles if exists
                      if (result.linkedProfiles && result.linkedProfiles.length > 1) {
                        // TODO: Show profile selection modal
                        console.log('Multiple profiles found:', result.linkedProfiles);
                      }
                      
                      // Navigate based on user type
                      if (result.user.userType === 'TRADER') {
                        navigate(ROUTES.SELLER);
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
                }}
              >
                {/* Email */}
                <div>
                  <label className={`block text-sm text-slate-700 mb-1 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                    {t("auth.email")}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    disabled={loading}
                    className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${currentDir === 'rtl' ? 'text-right' : 'text-left'} ${error ? 'border-red-500' : ''}`}
                    dir={currentDir}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className={`block text-sm text-slate-700 mb-1 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                    {t("auth.password")}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${currentDir === 'rtl' ? 'text-right pr-10' : 'text-left pl-10'} ${error ? 'border-red-500' : ''}`}
                      dir={currentDir}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className={`absolute top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-50 ${currentDir === 'rtl' ? 'right-2' : 'left-2'}`}
                      aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Row: Remember + Forgot */}
                <div className={`flex items-center justify-between text-sm ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <label className={`flex items-center gap-2 text-slate-600 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-200"
                    />
                    {t("auth.rememberMe")}
                  </label>

                  <button
                    type="button"
                    className="text-slate-500 hover:text-slate-700"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className={`rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t("auth.loggingIn") || "جاري تسجيل الدخول..." : t("auth.login")}
                </button>

                {/* Links */}
                <div className="pt-2 text-center text-sm">
                  <Link to={ROUTES.SIGNUP}>
                    <span className="text-slate-500">{t("auth.noAccount")}</span>
                    <button type="button" className="font-semibold text-amber-600 hover:text-amber-700 ms-1">
                      {t("auth.signUpNow")}
                    </button>
                  </Link>
                </div>
                <Link to={ROUTES.HOME}>
                  <div className="text-center">
                    <button type="button" className="text-sm font-semibold text-amber-600 hover:text-amber-700">
                      {t("auth.guestLogin")}
                    </button>
                  </div>
                </Link>
              </form>

              <div className="mt-10 text-center text-xs text-slate-400">
                © 2025 QeemaTech - {t("auth.allRightsReserved")}
              </div>
            </div>
          </div>

          {/* Right: Brand */}
          <div className=" bg-blue-900 p-6 sm:p-10 flex items-center justify-center">
            

            <img className="w-md" src={logo} alt="logo" />

          </div>
        </div>
      </div>
    </div>
  );
}
