import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Lock, Loader2, AlertCircle, User, Building2, Briefcase, UserCog, ShoppingBag } from "lucide-react";

export default function MultiLogin({ mode = "internal" }) { // mode: "internal" | "public" | "staff"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Removed duplicate declaration
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, setActiveRole } = useMultiAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Default role depends on mode
  const [selectedRole, setSelectedRole] = useState(
    mode === "public" ? "client" : "admin"
  );

  // Ensure selectedRole is valid for the current mode on mount/mode change
  useEffect(() => {
    if (mode === 'public' && !['client', 'trader'].includes(selectedRole)) {
      setSelectedRole('client');
    } else if (mode === 'internal' && !['admin', 'employee', 'moderator'].includes(selectedRole)) {
      setSelectedRole('admin');
    } else if (mode === 'staff' && !['admin', 'employee', 'moderator'].includes(selectedRole)) {
      setSelectedRole('admin');
    }
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password, selectedRole);
      
      // IMPORTANT: Use the selectedRole (what user chose) not the backend role
      // This ensures traders go to trader dashboard even if backend returns employee as primary
      const roleToUse = selectedRole; // Use what the user selected
      
      // Set active role to what the user selected, not what backend returned
      if (setActiveRole) {
        setActiveRole(roleToUse);
        localStorage.setItem('active_role', roleToUse);
      }

      // Check for returnUrl
      const returnUrl = location.state?.returnUrl;
      if (returnUrl) {
        navigate(returnUrl, { replace: true });
        return;
      }

      // Navigate based on SELECTED role - use replace to prevent back button issues
      // Validate Mode Compliance BEFORE Navigation
      const isInternalRole = ['admin', 'employee', 'moderator'].includes(roleToUse);
      const isStaffRole = ['admin', 'employee', 'moderator'].includes(roleToUse);
      const isPublicRole = ['client', 'trader'].includes(roleToUse);

      if (mode === 'internal' && !isInternalRole) {
        setError(`Access denied. ${roleToUse.charAt(0).toUpperCase() + roleToUse.slice(1)}s must use the public login page.`);
        setLoading(false);
        return;
      }
      
      if (mode === 'staff' && !isStaffRole) {
         setError(`Access denied. This login is for Staff only.`);
         setLoading(false);
         return;
      }

      if (mode === 'public' && !isPublicRole) {
         setError(`Access denied. ${roleToUse.charAt(0).toUpperCase() + roleToUse.slice(1)}s must use the dashboard login page.`);
         setLoading(false);
         return;
      }

      // Navigate based on SELECTED role - use replace to prevent back button issues
      if (roleToUse === "admin") navigate("/stockship/admin/dashboard", { replace: true });
      else if (roleToUse === "employee") navigate("/stockship/employee/dashboard", { replace: true });
      else if (roleToUse === "moderator") navigate("/stockship/moderator/dashboard", { replace: true });
      else if (roleToUse === 'vendor') {
         // Vendor removed from system, redirect to dashboard fallback or handle error if needed
         navigate("/stockship/admin/dashboard", { replace: true });
      }
      else if (roleToUse === "trader") navigate("/stockship/trader/dashboard", { replace: true });
      else if (roleToUse === "client") navigate("/stockship/client/dashboard", { replace: true });
      else navigate("/dashboard", { replace: true }); // Fallback
    } catch (err) {
      if (err.response?.status === 429) {
        const retryAfter = err.response.headers['retry-after'] || 15;
        setError(`Too many login attempts. Please wait ${retryAfter} seconds before trying again.`);
      } else {
        setError(err.response?.data?.message || err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: "admin", label: "Admin", icon: User, color: "from-blue-500 to-blue-600", mode: "internal" },
    { value: "moderator", label: "Moderator", icon: UserCog, color: "from-orange-500 to-orange-600", mode: "internal" },
    { value: "employee", label: "Employee", icon: Briefcase, color: "from-green-500 to-green-600", mode: "internal" },
    // Vendor role removed as per user request
    { value: "trader", label: "Trader", icon: Building2, color: "from-purple-500 to-purple-600", mode: "public" },
    { value: "client", label: "Client", icon: ShoppingBag, color: "from-pink-500 to-pink-600", mode: "public" },
  ];
  
  const filteredRoles = roleOptions.filter(role => {
      if (mode === 'staff') return ['admin', 'employee', 'moderator'].includes(role.value);
      return role.mode === mode;
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-background to-primary/5 p-4">
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
              className="mx-auto mb-4 w-16 h-16 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary-foreground"
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
              </svg>
            </motion.div>
            <CardTitle className="text-3xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('login.title') || (mode === 'internal' ? 'Dashboard Login' : 'Login')}
            </CardTitle>
            <CardDescription className="text-lg">
              Select your role to continue
            </CardDescription>
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

              {/* Role Selection */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium">Select Role</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredRoles.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedRole === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedRole(option.value)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? `border-primary bg-primary/10 ${option.color} text-white`
                            : 'border-input bg-background hover:border-primary/50'
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-xs font-medium">{option.label}</div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <label htmlFor="email" className="text-sm font-medium">
                  {t('login.email') || 'Email'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder={
                      selectedRole === 'admin' ? 'admin@stokship.com' :
                      selectedRole === 'moderator' ? 'moderator1@stokship.com' :
                      selectedRole === 'employee' ? 'employee@stokship.com' :
                      selectedRole === 'trader' ? 'trader@stokship.com' :
                      'client_test@stokship.com'
                    }
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
                  {t('login.password') || 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="••••••••"
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
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('login.signingIn') || 'Signing in...'}
                  </>
                ) : (
                  `${t('login.signIn') || 'Sign In'} as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
                )}
              </motion.button>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-center text-sm text-muted-foreground space-y-1"
            >
              <p className="font-semibold">Quick Login:</p>
              <div className="text-xs space-y-1">
                <p>Admin: admin@stokship.com / password</p>
                <p>Moderator: moderator1@stokship.com / moderator123</p>
                <p>Employee: employee@stokship.com / password</p>
                <p>Trader: trader@stokship.com / password</p>
                <p>Client: client_test@stokship.com / password</p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

